import { readFileSync } from "node:fs";
import { homedir } from "node:os";
import { resolve } from "node:path";
import type { ModelProfiles } from "./worker-engine.js";

interface ModelDefinition {
	ref?: unknown;
}

interface ModelCatalog {
	models?: Record<string, ModelDefinition>;
	profiles?: Record<string, unknown>;
	default?: unknown;
}

function profileEntries(value: unknown, name: string): string[] {
	if (
		!Array.isArray(value) ||
		value.length === 0 ||
		value.some((entry) => typeof entry !== "string" || !entry.trim())
	) {
		throw new Error(`Model profile '${name}' must be a non-empty array of model names`);
	}
	return value.map((entry) => entry.trim());
}

export function parseModelProfiles(value: unknown): ModelProfiles {
	if (!value || typeof value !== "object" || Array.isArray(value))
		throw new Error("Model catalog must be an object");
	const catalog = value as ModelCatalog;
	if (catalog.default !== undefined)
		return {
			default: profileEntries(catalog.default, "default"),
			...(catalog.profiles
				? {
						profiles: Object.fromEntries(
							Object.entries(catalog.profiles).map(([name, entries]) => [
								name,
								profileEntries(entries, name),
							]),
						),
					}
				: {}),
		};
	if (!catalog.profiles) throw new Error("Model catalog must define profiles.default");
	const aliases = catalog.models ?? {};
	const resolveEntry = (entry: string): string => {
		const definition = aliases[entry];
		if (!definition) return entry;
		if (typeof definition.ref !== "string" || !definition.ref.trim())
			throw new Error(`Model '${entry}' must define a non-empty ref`);
		return definition.ref.trim();
	};
	const profiles = Object.fromEntries(
		Object.entries(catalog.profiles).map(([name, entries]) => [
			name,
			profileEntries(entries, name).map(resolveEntry),
		]),
	);
	if (!profiles.default) throw new Error("Model catalog must define profiles.default");
	return { default: profiles.default, profiles };
}

export function loadModelProfiles(env: NodeJS.ProcessEnv = process.env): ModelProfiles {
	if (env.PI_SYCH_MODEL_PROFILES) return parseModelProfiles(JSON.parse(env.PI_SYCH_MODEL_PROFILES));
	const path =
		env.PI_SYCH_MODEL_CATALOG ??
		resolve(env.PI_CODING_AGENT_DIR ?? resolve(homedir(), ".config/pi"), "pi-sych/models.json");
	try {
		return parseModelProfiles(JSON.parse(readFileSync(path, "utf8")));
	} catch (error) {
		throw new Error(
			`Worker model catalog is unavailable or invalid at ${path}: ${error instanceof Error ? error.message : String(error)}`,
		);
	}
}
