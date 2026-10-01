import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

export default async function piSychPlannotator(pi: ExtensionAPI): Promise<void> {
	let runtime: typeof import("./runtime.js");
	try {
		runtime = await import("./runtime.js");
	} catch (error) {
		const message = error instanceof Error ? error.message : String(error);
		if (
			(error as NodeJS.ErrnoException)?.code === "ERR_MODULE_NOT_FOUND" &&
			message.includes("jiti")
		)
			return;
		throw error;
	}
	try {
		await runtime.registerPlannotator(pi);
	} catch (error) {
		if (error instanceof runtime.PlannotatorUnavailableError) return;
		throw error;
	}
}
