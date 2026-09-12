import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { registerLiteratureSearch } from "../workbench/src/literature-search.js";
import {
	validateWorkerResult,
	workerResultSchema,
	writeImmutableResult,
} from "../workbench/src/worker-engine.js";
export default function piSychWorker(pi: ExtensionAPI): void {
	pi.registerTool({
		name: "submit_artifact",
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
