import { StringEnum } from "@earendil-works/pi-ai";
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { Type } from "typebox";
import {
	validateWorkerResult,
	writeImmutableResult,
} from "../workbench/src/worker-engine.js";

const resultParameters = Type.Object({
	schemaVersion: Type.Literal(1),
	status: StringEnum(["complete", "partial", "failed"] as const),
	summary: Type.String(),
	artifacts: Type.Array(
		Type.Object({ path: Type.String(), kind: Type.String() }),
	),
	changedFiles: Type.Array(Type.String()),
	limitations: Type.Array(Type.String()),
	resultPackage: Type.String({
		description:
			"Use 'inline' when the structured result is complete; otherwise provide an existing durable project-relative path.",
	}),
});

export default function piSychWorker(pi: ExtensionAPI): void {
	pi.registerTool({
		name: "submit_artifact",
		label: "Submit worker result",
		description:
			"Submit the one immutable result for the active Pi Sych worker task.",
		parameters: resultParameters,
		async execute(_toolCallId, params) {
			const taskId = process.env.PI_SYCH_TASK_ID;
			const runId = process.env.PI_SYCH_RUN_ID;
			const resultPath = process.env.PI_SYCH_RESULT_PATH;
			if (!taskId || !runId || !resultPath)
				throw new Error(
					"submit_artifact is available only during dispatch_worker",
				);
			const result = validateWorkerResult(
				{ ...params, taskId, runId },
				{ taskId, runId },
			);
			await writeImmutableResult(resultPath, result);
			return {
				content: [
					{ type: "text", text: `Submitted result for task ${taskId}.` },
				],
				details: { taskId, runId },
				terminate: true,
			};
		},
	});
}
