import { createInterface } from "node:readline";

// Minimal deterministic MCP stdio peer. Stdout is exclusively JSON-RPC messages.
const tools = [
	{
		name: "evidence",
		description: "Read one local evidence record",
		inputSchema: { type: "object", properties: {}, additionalProperties: false },
		annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true },
	},
	{
		name: "missing",
		description: "Read one unavailable local evidence record",
		inputSchema: { type: "object", properties: {}, additionalProperties: false },
		annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true },
	},
];

function respond(id, result) {
	process.stdout.write(`${JSON.stringify({ jsonrpc: "2.0", id, result })}\n`);
}

for await (const line of createInterface({ input: process.stdin })) {
	let request;
	try {
		request = JSON.parse(line);
	} catch {
		continue;
	}
	if (request.id === undefined) continue; // Notifications have no response.
	switch (request.method) {
		case "initialize":
			respond(request.id, {
				protocolVersion: request.params.protocolVersion,
				capabilities: { tools: {} },
				serverInfo: { name: "native-mcp-fixture", version: "1.0.0" },
			});
			break;
		case "tools/list":
			respond(request.id, { tools });
			break;
		case "tools/call":
			if (request.params.name === "evidence") {
				respond(request.id, {
					content: [{ type: "text", text: "Local record" }],
					structuredContent: { source: "fixture:record-1", title: "Local record" },
				});
			} else if (request.params.name === "missing") {
				respond(request.id, {
					content: [{ type: "text", text: "fixture:record-2 unavailable" }],
					isError: true,
				});
			} else {
				process.stdout.write(
					`${JSON.stringify({ jsonrpc: "2.0", id: request.id, error: { code: -32602, message: "Unknown tool" } })}\n`,
				);
			}
			break;
		default:
			process.stdout.write(
				`${JSON.stringify({ jsonrpc: "2.0", id: request.id, error: { code: -32601, message: "Unknown method" } })}\n`,
			);
	}
}
