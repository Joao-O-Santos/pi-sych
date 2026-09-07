import { readFile } from "node:fs/promises";
import { dirname, parse, resolve } from "node:path";
import type { ToolInfo } from "@earendil-works/pi-coding-agent";

const identifiesPewPew = (tool: ToolInfo) =>
	/pi-pew-pew/i.test(`${tool.sourceInfo.source}\n${tool.sourceInfo.path}`);

export async function enabledPewPewExtension(
	tools: readonly ToolInfo[],
	activeTools: readonly string[],
): Promise<string | undefined> {
	if (!activeTools.includes("web")) return undefined;
	const candidates = tools.filter((tool) => tool.name === "web");
	if (candidates.length !== 1)
		throw new Error(
			`Active web tool provenance is unavailable or ambiguous; found ${candidates.length}`,
		);
	const [candidate] = candidates;
	if (!candidate) return undefined;
	const claimedPewPew = identifiesPewPew(candidate);
	const extensionPath = resolve(candidate.sourceInfo.path);
	let directory = dirname(extensionPath);
	const root = parse(directory).root;
	while (true) {
		let manifest: { name?: unknown };
		try {
			manifest = JSON.parse(await readFile(resolve(directory, "package.json"), "utf8"));
		} catch (error) {
			if ((error as NodeJS.ErrnoException).code !== "ENOENT")
				throw new Error(`Active web tool package manifest is invalid: ${String(error)}`);
			if (directory === root) {
				if (claimedPewPew)
					throw new Error("Active PEW-PEW extension has no readable pi-pew-pew package manifest");
				return undefined;
			}
			directory = dirname(directory);
			continue;
		}
		if (manifest.name !== "pi-pew-pew") {
			if (claimedPewPew)
				throw new Error(`PEW-PEW provenance has package name ${String(manifest.name)}`);
			return undefined;
		}
		try {
			await readFile(extensionPath);
		} catch (error) {
			throw new Error(`Active PEW-PEW extension is unreadable: ${String(error)}`);
		}
		return extensionPath;
	}
}
