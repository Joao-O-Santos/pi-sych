import { appendFileSync } from "node:fs";
import { isAbsolute, relative, resolve } from "node:path";
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

// Private, test-only telemetry: never write prompts, summaries, or errors.
export default function observer(pi: ExtensionAPI) {
	const events = process.env.PI_SOAK_EVENTS;
	if (!events) throw new Error("Compaction soak observer requires PI_SOAK_EVENTS");
	const log = (data: object) =>
		appendFileSync(events, `${JSON.stringify({ at: Date.now(), ...data })}\n`, { mode: 0o600 });
	pi.on("session_before_compact", (event) => {
		log({ type: "before", reason: event.reason, tokensBefore: event.preparation.tokensBefore });
	});
	pi.on("session_compact", (event) => {
		log({
			type: "success",
			reason: event.reason,
			fromExtension: event.fromExtension,
			fromHook: event.compactionEntry.fromHook,
			usage: event.compactionEntry.usage,
			summaryCharacters: event.compactionEntry.summary.length,
			mentionsAudit: /audit/i.test(event.compactionEntry.summary),
			mentionsBothSurveys:
				/nesting/i.test(event.compactionEntry.summary) &&
				/lighting/i.test(event.compactionEntry.summary),
		});
	});
	pi.on("session_compact_failed", (event) => {
		log({
			type: "failed",
			reason: event.reason,
			aborted: event.aborted,
			fromExtension: event.fromExtension,
		});
	});
	pi.on("agent_settled", (event, ctx) => {
		log({ type: "settled", aborted: event.aborted, usage: ctx.getContextUsage() });
	});
	pi.on("tool_call", (event, ctx) => {
		if (event.toolName !== "read" && event.toolName !== "write")
			return { block: true, reason: "Soak only permits read and write" };
		const path = (event.input as { path?: unknown }).path;
		if (typeof path !== "string") return { block: true, reason: "Missing path" };
		const rel = relative(ctx.cwd, resolve(ctx.cwd, path.replace(/^@/, "")));
		if (rel.startsWith("..") || isAbsolute(rel))
			return { block: true, reason: "Outside soak workspace" };
	});
}
