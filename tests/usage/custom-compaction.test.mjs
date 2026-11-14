import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { homedir, tmpdir } from "node:os";
import { join, resolve } from "node:path";
import test from "node:test";
import { SessionManager } from "@earendil-works/pi-coding-agent";

const LIMIT_MS = 180_000;

test("real Pi proactively invokes custom compaction and retains usable memory/promotions", {
	skip:
		process.env.PI_SYCH_USAGE_TEST === "1"
			? false
			: "set PI_SYCH_USAGE_TEST=1 to run real-model usage acceptance",
	timeout: LIMIT_MS,
}, async (t) => {
	const root = await mkdtemp(join(tmpdir(), "pi-sych-compaction-"));
	t.after(() => rm(root, { recursive: true, force: true }));
	const agentDir = await mkdtemp(join(tmpdir(), "pi-sych-compaction-agent-"));
	t.after(() => rm(agentDir, { recursive: true, force: true }));
	const authDirs = [
		...new Set([process.env.PI_CODING_AGENT_DIR, join(homedir(), ".config/pi")].filter(Boolean)),
	];
	for (const authDir of authDirs) {
		try {
			const auth = JSON.parse(await readFile(join(authDir, "auth.json"), "utf8"));
			if (auth["openai-codex"]) {
				await writeFile(
					join(agentDir, "auth.json"),
					JSON.stringify({ "openai-codex": auth["openai-codex"] }),
					{ mode: 0o600 },
				);
				break;
			}
		} catch (error) {
			if (error?.code !== "ENOENT") throw error;
		}
	}
	const projectRoot = join(root, "workspace"),
		stateDir = join(projectRoot, "state"),
		inbox = join(stateDir, "INBOX.md");
	await mkdir(stateDir, { recursive: true });
	await mkdir(join(projectRoot, ".pi", "pi-sych"), { recursive: true });
	await writeFile(
		join(projectRoot, ".pi", "pi-sych", "config.json"),
		JSON.stringify({ version: 2, compaction: { custom: true, thresholdTokens: 1 } }),
	);
	// Pi keeps 20k tokens by default, so short disposable sessions are not
	// compactable. Reduce only the isolated test agent's retention setting.
	await writeFile(
		join(agentDir, "settings.json"),
		JSON.stringify({ compaction: { keepRecentTokens: 1 } }),
	);
	await writeFile(
		join(projectRoot, "PROJECT.md"),
		"# Project\n\n## Objective\n\nPrepare a field report on the Amber Heron migration.\n\n## Current direction\n\nKeep the nesting survey separate from the lighting survey.\n\n## Definition of done\n\nA concise field report records both surveys independently.\n\n## Previous action\n\nNo report drafted.\n\n## Immediate next step\n\nDraft the report without merging survey results.\n",
	);
	await writeFile(
		join(projectRoot, "AGENTS.md"),
		"Do not merge the nesting and lighting surveys.\n",
	);
	await writeFile(join(projectRoot, "SURVEY_TEMPLATE.md"), "# Survey\n\nDate:\nObserver:\n");
	await writeFile(
		join(projectRoot, "SYNC.json"),
		`${JSON.stringify(
			{
				version: 2,
				projectRoot: ".",
				canonical: {
					project: "PROJECT.md",
					agents: "AGENTS.md",
					style: "STYLE.md",
					inbox: "state/INBOX.md",
				},
				confirmedAt: "2026-01-01T00:00:00Z",
				artifacts: [],
			},
			null,
			2,
		)}\n`,
	);
	// Seed visible history to test semantic extraction; this is not an actual
	// tool-execution test or evidence of preferences outside this fixture.
	const manager = SessionManager.create(projectRoot, root);
	const assistant = (content, stopReason = "stop") => ({
		role: "assistant",
		content,
		stopReason,
		api: "openai-responses",
		provider: "fixture",
		model: "fixture",
		timestamp: Date.now(),
		usage: {
			input: 0,
			output: 0,
			cacheRead: 0,
			cacheWrite: 0,
			totalTokens: 0,
			cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, total: 0 },
		},
	});
	const say = (text) => assistant([{ type: "text", text }]);
	for (const message of [
		{
			role: "user",
			content:
				"For this project, stop asking whether to continue already-authorized work; those pauses are frustrating.",
			timestamp: Date.now(),
		},
		say("I will continue authorized work until complete or genuinely blocked."),
		{
			role: "user",
			content: "I liked that concise evidence-based summary. Keep that format for this project.",
			timestamp: Date.now(),
		},
		say("I will retain that summary format."),
		assistant(
			[
				{
					type: "toolCall",
					id: "fixture-missing",
					name: "read",
					arguments: { path: "survey_template.md" },
				},
			],
			"toolUse",
		),
		{
			role: "toolResult",
			toolCallId: "fixture-missing",
			toolName: "read",
			content: [{ type: "text", text: "ENOENT: survey_template.md not found" }],
			isError: true,
			timestamp: Date.now(),
		},
		assistant(
			[
				{ type: "text", text: "The file is SURVEY_TEMPLATE.md; retry using that exact case." },
				{
					type: "toolCall",
					id: "fixture-correct",
					name: "read",
					arguments: { path: "SURVEY_TEMPLATE.md" },
				},
			],
			"toolUse",
		),
		{
			role: "toolResult",
			toolCallId: "fixture-correct",
			toolName: "read",
			content: [{ type: "text", text: "# Survey\n\nDate:\nObserver:\n" }],
			isError: false,
			timestamp: Date.now(),
		},
		say(
			"Reading the exact uppercase filename succeeded; this fixes the observed path mismatch, not every read failure.",
		),
		{
			role: "user",
			content: "Again: do not pause to ask me to continue approved work in this project.",
			timestamp: Date.now(),
		},
		say("Understood."),
		{
			role: "user",
			content:
				"That concise evidence-based summary was helpful again; keep doing that for this project.",
			timestamp: Date.now(),
		},
		say("Acknowledged."),
	])
		manager.appendMessage(message);
	const session = manager.getSessionFile();
	assert.ok(session);
	const prompt = [
		"Briefly acknowledge this handoff without doing the audit or editing files in this turn.",
		"The long-term project objective is a field report on the Amber Heron migration; the nesting survey must remain separate from the lighting survey.",
		"The current authorized task is to audit the survey metadata template, not draft the field report. The audit remains unfinished. The next step after resuming is to inspect the existing SURVEY_TEMPLATE.md survey template; the current approach is to check its fields before proposing changes, because date and observer may already be captured.",
		"The project owner suggests adding a one-line proposal to the project inbox: record the date and observer for every survey. This is a suggestion only, not an accepted canonical decision.",
	].join(" ");
	const runPi = (message) =>
		new Promise((resolvePromise, reject) => {
			let stdout = "";
			let stderr = "";
			let settled = false;
			let killTimeout;
			const finish = (callback, value) => {
				if (settled) return;
				settled = true;
				clearTimeout(timeout);
				clearTimeout(killTimeout);
				callback(value);
			};
			const child = spawn(
				"pi",
				[
					"--mode",
					"rpc",
					"--session",
					session,
					"--no-extensions",
					"--extension",
					resolve("extensions/workbench/index.ts"),
					"--no-skills",
					"--no-prompt-templates",
					"--no-themes",
					"--no-context-files",
					"--tools",
					"read,write",
				],
				{
					cwd: projectRoot,
					env: { ...process.env, PI_CODING_AGENT_DIR: agentDir },
					stdio: ["pipe", "pipe", "pipe"],
				},
			);
			const timeout = setTimeout(() => {
				child.kill("SIGTERM");
				killTimeout = setTimeout(() => {
					child.kill("SIGKILL");
					finish(
						reject,
						new Error(
							`Custom compaction usage test timed out after ${LIMIT_MS}ms\nstdout:\n${stdout}\nstderr:\n${stderr}`,
						),
					);
				}, 2_000);
			}, LIMIT_MS);
			child.stdout.setEncoding("utf8");
			child.stderr.setEncoding("utf8");
			let buffered = "";
			let compactionComplete = false;
			child.stdout.on("data", (chunk) => {
				buffered += chunk;
				for (;;) {
					const newline = buffered.indexOf("\n");
					if (newline < 0) break;
					const line = buffered.slice(0, newline);
					buffered = buffered.slice(newline + 1);
					let event;
					try {
						event = JSON.parse(line);
					} catch {
						continue;
					}
					if (
						[
							"compaction_start",
							"compaction_end",
							"session_compact_failed",
							"agent_settled",
						].includes(event.type)
					)
						stdout += `${JSON.stringify(event)}\n`;
					if (
						["compaction_end", "session_compact_failed"].includes(event.type) &&
						!compactionComplete
					) {
						compactionComplete = true;
						child.stdin.end();
					}
				}
			});
			child.stderr.on("data", (chunk) => (stderr += chunk));
			child.once("error", (error) => finish(reject, error));
			child.once("close", (code) => finish(resolvePromise, { code, stdout, stderr }));
			child.stdin.write(`${JSON.stringify({ type: "prompt", message })}\n`);
		});
	const result = await runPi(prompt);
	const diagnostics = `exit: ${result.code}\nstdout:\n${result.stdout}\nstderr:\n${result.stderr}`;
	assert.equal(result.code, 0, diagnostics);
	const events = result.stdout
		.split("\n")
		.filter(Boolean)
		.map((line) => JSON.parse(line));
	assert.ok(
		events.some((event) => event.type === "agent_settled"),
		`Pi did not reach the settled boundary that admits proactive compaction. ${diagnostics}`,
	);
	assert.ok(
		events.some((event) => event.type === "compaction_start" && event.reason === "manual"),
		`The settled-boundary trigger did not request Pi compaction. ${diagnostics}`,
	);
	assert.ok(
		!result.stdout.includes("Nothing to compact (session too small)"),
		`Pi rejected the session before invoking the custom hook; increase fixture context or lower keepRecentTokens. ${diagnostics}`,
	);
	const completion = events.find((event) => event.type === "compaction_end");
	assert.ok(
		completion?.result?.summary,
		`Compaction did not complete successfully: ${completion?.errorMessage ?? "no result"}. ${diagnostics}`,
	);
	const sessionText = await readFile(session, "utf8").catch((error) => {
		throw new Error(`Pi did not persist a session: ${String(error)}\n${diagnostics}`);
	});
	const persisted = sessionText
		.split("\n")
		.filter(Boolean)
		.map((line) => JSON.parse(line));
	const compactionEntry = persisted.find((entry) => entry.type === "compaction");
	assert.ok(
		compactionEntry,
		`No compaction entry was persisted despite a completion event. ${diagnostics}`,
	);
	assert.equal(
		compactionEntry.fromHook,
		true,
		`Pi persisted a native summary instead of the Pi Sych custom-hook result. ${diagnostics}`,
	);
	const objective = compactionEntry.summary.match(/## Objective\n\n([^\n]+)/)?.[1] ?? "";
	assert.match(
		objective,
		/audit[\s\S]*survey[\s\S]*metadata|survey[\s\S]*metadata[\s\S]*audit/i,
		`The active audit task must not become the broader field-report objective. Summary:\n${compactionEntry.summary}\n${diagnostics}`,
	);
	const nextAction = compactionEntry.summary.match(/## Next action\n\n([^\n]+)/)?.[1] ?? "";
	assert.match(
		nextAction,
		/(?:inspect|read|check|review|examine|audit)[^\n]*template/i,
		`The continuation must retain a concrete audit resume point. Summary:\n${compactionEntry.summary}\n${diagnostics}`,
	);
	const preferences =
		compactionEntry.summary.match(/## User preferences\n\n([\s\S]*?)(?:\n## |$)/)?.[1] ?? "";
	assert.match(
		preferences,
		/authoriz|approv|permission|continu|paus/i,
		`repeated corrective feedback should survive. Summary:\n${compactionEntry.summary}`,
	);
	assert.match(
		preferences,
		/concise|short|brief|evidence/i,
		`specific positive feedback should survive. Summary:\n${compactionEntry.summary}`,
	);
	assert.match(preferences, /project/i, "explicit project scope should survive");
	const lessons =
		compactionEntry.summary.match(/## Tool lessons\n\n([\s\S]*?)(?:\n## |$)/)?.[1] ?? "";
	assert.match(lessons, /SURVEY_TEMPLATE\.md/);
	assert.match(lessons, /ENOENT|case|path|file|not found/i);
	assert.match(lessons, /succeed|success|correct|retry/i);
	const proposals = await readFile(inbox, "utf8").catch((error) => {
		throw new Error(
			`Custom compaction did not create the expected proposal inbox: ${String(error)}\n${diagnostics}\nSession:\n${sessionText}`,
		);
	});
	assert.match(
		proposals,
		/\{(?:project|agents|style|evidence|decisions|todo)\}[^\n]*(?:date|observer)[^\n]*survey/i,
		`Custom compaction produced no usable survey-metadata promotion. Inbox:\n${proposals}\n${diagnostics}`,
	);
	assert.equal(
		await readFile(join(projectRoot, "PROJECT.md"), "utf8"),
		"# Project\n\n## Objective\n\nPrepare a field report on the Amber Heron migration.\n\n## Current direction\n\nKeep the nesting survey separate from the lighting survey.\n\n## Definition of done\n\nA concise field report records both surveys independently.\n\n## Previous action\n\nNo report drafted.\n\n## Immediate next step\n\nDraft the report without merging survey results.\n",
		"Compaction must not mutate canonical project state",
	);
});
