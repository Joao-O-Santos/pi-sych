import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { registerLiteratureSearch } from "../workbench/src/literature-search.js";
import {
	validateWorkerResult,
	workerResultSchema,
	writeImmutableResult,
} from "../workbench/src/worker-engine.js";
export default function piSychWorker(pi: ExtensionAPI): void {
	pi.on("session_start", (_event, ctx) => {
		try {
			pi.setActiveTools(parseActiveTools(process.env.PI_SYCH_ACTIVE_TOOLS));
		} catch (error) {
			pi.setActiveTools([]);
			ctx.ui.notify(error instanceof Error ? error.message : String(error), "error");
		}
	});
	pi.registerTool({
		name: "submit_artifact",
		exposure: "model-only",
		label: "Submit worker result",
		description:
			"Submit the worker's one immutable terminal result. Use only after the assigned work is complete, partial, or genuinely failed; report limitations and only existing project-relative files.",
		parameters: workerResultSchema,
		async execute(_id, params) {
			const resultPath = process.env.PI_SYCH_RESULT_PATH;
			if (!resultPath) throw new Error("submit_artifact is available only during dispatch_worker");
			const result = validateWorkerResult(params);
			await writeImmutableResult(resultPath, result);
			return {
				content: [{ type: "text", text: "Submitted worker result." }],
				details: result,
				terminate: true,
			};
		},
	});
	registerLiteratureSearch(pi, process.env.PI_SYCH_CONFIG_DIRECTORY);
}

function parseActiveTools(serialized: string | undefined): string[] {
	if (!serialized)
		throw new Error("Worker active tool selection is missing; launch through Pi Sych dispatch");
	let parsed: unknown;
	try {
		parsed = JSON.parse(serialized);
	} catch {
		throw new Error("Worker active tool selection is invalid JSON");
	}
	if (
		!Array.isArray(parsed) ||
		!parsed.every((name) => typeof name === "string" && name.length > 0) ||
		new Set(parsed).size !== parsed.length ||
		!parsed.includes("submit_artifact")
	)
		throw new Error("Worker active tool selection must be a unique list including submit_artifact");
	return parsed;
}
