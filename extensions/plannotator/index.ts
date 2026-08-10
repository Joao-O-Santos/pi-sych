import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { ensurePiSychConfig, loadPiSychConfig } from "../workbench/src/config-directory.js";
import { resolveProject } from "../workbench/src/project-files.js";
export default async function piSychPlannotator(pi: ExtensionAPI): Promise<void> {
	const options = { projectRoot: (await resolveProject(process.cwd())).projectRoot };
	await ensurePiSychConfig(options);
	if (loadPiSychConfig(options).review.mode === "manual") return;
	const { registerPlannotator } = await import("./runtime.js");
	await registerPlannotator(pi);
}
