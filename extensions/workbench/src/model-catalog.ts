import { readFileSync } from "node:fs";
import { piSychConfigPath } from "./config-directory.js";
export interface ModelEntry {
	model: string;
	cost?: string;
	notes?: string;
}
export interface ModelCatalog {
	default: string;
	models: Record<string, ModelEntry>;
}
export function parseModelCatalog(value: unknown): ModelCatalog {
	if (!value || typeof value !== "object" || Array.isArray(value))
		throw new Error("Model catalog must be an object");
	const catalog = value as Record<string, unknown>;
	if (typeof catalog.default !== "string" || !catalog.default.trim())
		throw new Error("Model catalog must define a default model role");
	if (!catalog.models || typeof catalog.models !== "object" || Array.isArray(catalog.models))
		throw new Error("Model catalog must define models");
	const models = Object.fromEntries(
		Object.entries(catalog.models as Record<string, unknown>).map(([role, entry]) => {
			if (!entry || typeof entry !== "object" || Array.isArray(entry))
				throw new Error(`Model '${role}' must be an object`);
			const item = entry as Record<string, unknown>;
			if (typeof item.model !== "string" || !item.model.trim())
				throw new Error(`Model '${role}' must define a model`);
			return [
				role,
				{
					model: item.model.trim(),
					...(typeof item.cost === "string" ? { cost: item.cost } : {}),
					...(typeof item.notes === "string" ? { notes: item.notes } : {}),
				},
			];
		}),
	) as Record<string, ModelEntry>;
	if (!models[catalog.default]) throw new Error(`Unknown default model: ${catalog.default}`);
	return { default: catalog.default, models };
}
export function modelCatalogPath(
	projectRoot?: string,
	env: NodeJS.ProcessEnv = process.env,
): string {
	return piSychConfigPath("modelCatalog", {
		env,
		...(projectRoot ? { projectRoot } : {}),
	});
}
function readModelCatalog(path: string, required: boolean): ModelCatalog | undefined {
	let value: string;
	try {
		value = readFileSync(path, "utf8");
	} catch (error) {
		if (!required && (error as NodeJS.ErrnoException).code === "ENOENT") return undefined;
		throw new Error(`Worker model catalog is unavailable or invalid at ${path}: ${String(error)}`);
	}
	try {
		return parseModelCatalog(JSON.parse(value));
	} catch (error) {
		throw new Error(`Worker model catalog is unavailable or invalid at ${path}: ${String(error)}`);
	}
}
export function loadModelCatalog(
	projectRoot?: string,
	env: NodeJS.ProcessEnv = process.env,
): ModelCatalog {
	return readModelCatalog(modelCatalogPath(projectRoot, env), true) as ModelCatalog;
}
export function loadOptionalModelCatalog(
	projectRoot?: string,
	env: NodeJS.ProcessEnv = process.env,
): ModelCatalog | undefined {
	return readModelCatalog(modelCatalogPath(projectRoot, env), false);
}
