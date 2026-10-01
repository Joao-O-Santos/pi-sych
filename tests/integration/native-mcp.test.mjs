import assert from "node:assert/strict";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import test from "node:test";
import {
	createAgentSession,
	createCodemodeExtension,
	createMcpExtension,
	DefaultResourceLoader,
	SessionManager,
	SettingsManager,
} from "@earendil-works/pi-coding-agent";

const fixture = resolve("tests/fixtures/native-mcp-server.mjs");
const names = ["mcp__local__evidence", "mcp__local__missing"];

test("native stdio MCP tools compose in codemode without a model or provider", {
	timeout: 20000,
}, async (t) => {
	const root = await mkdtemp(join(tmpdir(), "pi-sych-native-mcp-"));
	const cwd = join(root, "project");
	const agentDir = join(root, "agent");
	await mkdir(cwd);
	await mkdir(agentDir);
	const previousAgentDir = process.env.PI_CODING_AGENT_DIR;
	let session;
	t.after(async () => {
		try {
			if (session) {
				// Reload emits session_shutdown and closes the stdio transport.
				await writeFile(join(agentDir, "mcp.json"), '{"mcpServers":{}}');
				await session.reload();
			}
		} finally {
			session?.dispose();
			if (previousAgentDir === undefined) delete process.env.PI_CODING_AGENT_DIR;
			else process.env.PI_CODING_AGENT_DIR = previousAgentDir;
			await rm(root, { recursive: true, force: true });
		}
	});
	process.env.PI_CODING_AGENT_DIR = agentDir;
	await writeFile(
		join(agentDir, "mcp.json"),
		JSON.stringify({
			mcpServers: {
				local: { command: process.execPath, args: [fixture], exposure: "codemode" },
			},
		}),
	);
	const loader = new DefaultResourceLoader({
		cwd,
		agentDir,
		extensionFactories: [createCodemodeExtension({ mode: "on" }), createMcpExtension()],
	});
	await loader.reload();
	({ session } = await createAgentSession({
		cwd,
		resourceLoader: loader,
		settingsManager: SettingsManager.inMemory({ defaultTools: ["+codemode"] }),
		sessionManager: SessionManager.inMemory(),
	}));
	await session.bindExtensions({});

	// MCP connects asynchronously on session_start. Bound the readiness wait without a provider call.
	const deadline = Date.now() + 8000;
	while (!names.every((name) => session.getCallableToolNames().includes(name))) {
		assert.ok(
			Date.now() < deadline,
			`MCP fixture failed to connect: ${session.getCallableToolNames()}`,
		);
		await new Promise((done) => setTimeout(done, 25));
	}
	assert.ok(session.getActiveToolNames().includes("codemode"));
	assert.ok(names.every((name) => !session.getActiveToolNames().includes(name)));
	for (const name of names)
		assert.equal(
			session.getAllTools().find((tool) => tool.name === name).annotations.readOnlyHint,
			true,
		);

	// The public Agent tool surface can execute a tool directly without starting an LLM turn.
	// Its extension wrapper supplies the session context; nested MCP calls use Pi's tool pipeline.
	const codemode = session.agent.state.tools.find((tool) => tool.name === "codemode");
	assert.ok(codemode, "codemode tool is active");
	const script = `
const results = await Promise.allSettled([
  tools.mcp__local__evidence({}),
  tools.mcp__local__missing({}).then(result => {
    if (result.isError) throw new Error(result.content[0].text);
    return result;
  }),
]);
text(JSON.stringify(results.map(result => result.status === "rejected"
  ? { status: result.status, reason: result.reason.message }
  : { status: result.status, source: result.value.structuredContent.source, title: result.value.structuredContent.title })));
`;
	// Give the nested pipeline the assistant call it attributes nested tool results to.
	// No model request is made: this is an in-memory synthetic call frame.
	session.agent.state.messages.push({
		role: "assistant",
		content: [
			{ type: "toolCall", id: "native-mcp-test", name: "codemode", arguments: { code: script } },
		],
	});
	const result = await codemode.execute(
		"native-mcp-test",
		{ code: script },
		new AbortController().signal,
	);
	const output = result.content
		.filter((part) => part.type === "text")
		.map((part) => part.text)
		.join("\n");
	assert.match(output, /Script completed/);
	assert.deepEqual(JSON.parse(output.match(/\[\{"status".*\}\]/)?.[0] ?? "null"), [
		{ status: "fulfilled", source: "fixture:record-1", title: "Local record" },
		{ status: "rejected", reason: "fixture:record-2 unavailable" },
	]);
	assert.deepEqual(
		result.details.calls.map(({ name, status }) => ({ name, status })),
		[
			{ name: names[0], status: "ok" },
			{ name: names[1], status: "error" }, // MCP isError resolves in scripts, but Pi marks the call as an error.
		],
	);
});
