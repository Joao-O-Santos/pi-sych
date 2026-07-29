import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { Type } from "typebox";
import {
	validateWorkerResult,
	writeImmutableResult,
} from "../workbench/src/worker-engine.js";

export const WORKER_EXTENSION_ID = "pi-sych-worker";

const resultParameters = Type.Object({
	schemaVersion: Type.Literal(1),
	role: Type.String(),
	status: Type.Union([
		Type.Literal("complete"),
		Type.Literal("failed"),
		Type.Literal("partial"),
	]),
	summary: Type.String(),
	artifacts: Type.Array(
		Type.Object({ path: Type.String(), kind: Type.String() }),
	),
	intendedChanges: Type.Array(Type.String()),
	observedChanges: Type.Array(Type.String()),
	verification: Type.Array(
		Type.Object({
			executable: Type.String(),
			args: Type.Array(Type.String()),
			cwd: Type.String(),
			exitCode: Type.Union([Type.Integer(), Type.Null()]),
			stdoutTail: Type.String(),
			stderrTail: Type.String(),
			startedAt: Type.String(),
			endedAt: Type.String(),
			filesChanged: Type.Array(Type.String()),
		}),
	),
	limitations: Type.Array(Type.String()),
});

export default function piSychWorker(pi: ExtensionAPI): void {
	pi.registerTool({
		name: "submit_artifact",
		label: "Submit Pi Sych worker result",
		description:
			"Submit the one immutable structured result for the active Pi Sych worker task.",
		parameters: resultParameters,
		async execute(_toolCallId, params) {
			const taskId = process.env.PI_SYCH_TASK_ID;
			const runId = process.env.PI_SYCH_RUN_ID;
			const resultPath = process.env.PI_SYCH_RESULT_PATH;
			if (!taskId || !runId || !resultPath)
				throw new Error(
					"submit_artifact is available only inside an active Pi Sych worker dispatch",
				);
			const result = validateWorkerResult(
				{ ...params, taskId, runId },
				{ taskId, runId },
			);
			await writeImmutableResult(resultPath, result);
			return {
				content: [
					{
						type: "text",
						text: `Submitted immutable result for task ${taskId}.`,
					},
				],
				details: { taskId, runId },
			};
		},
	});

	pi.registerCommand("pi-sych-worker-status", {
		description: "Confirm that the Pi Sych worker extension is loaded",
		handler: async (_args, ctx) => {
			ctx.ui.notify(`${WORKER_EXTENSION_ID}: ready`, "info");
		},
	});
}
