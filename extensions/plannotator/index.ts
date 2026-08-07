import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import {
	type ConfigDirectoryOptions,
	ensurePiSychConfig,
	loadPiSychConfig,
} from "../workbench/src/config-directory.js";
import { resolveProject } from "../workbench/src/project-files.js";

export default async function piSychPlannotator(pi: ExtensionAPI): Promise<void> {
	let options: ConfigDirectoryOptions = {};
	try {
		options = { projectRoot: (await resolveProject(process.cwd())).projectRoot };
	} catch (error) {
		console.error(`Pi Sych project resolution failed during startup: ${String(error)}`);
	}
	await ensurePiSychConfig(options);
	if (loadPiSychConfig(options).review.mode === "manual") return;
	const { registerPlannotator } = await import("./runtime.js");
	await registerPlannotator(pi);
}
