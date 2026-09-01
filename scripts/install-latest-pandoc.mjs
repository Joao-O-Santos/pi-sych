#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import { writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const latestReleaseUrl = "https://api.github.com/repos/jgm/pandoc/releases/latest";

export function parseLatestStableRelease(metadata) {
	if (!metadata || typeof metadata !== "object" || Array.isArray(metadata))
		throw new Error("Pandoc release metadata is malformed: expected an object.");
	if (metadata.draft || metadata.prerelease)
		throw new Error("Pandoc release metadata is not a stable release.");
	if (typeof metadata.tag_name !== "string" || !/^\d+\.\d+(?:\.\d+)?$/.test(metadata.tag_name))
		throw new Error(
			"Pandoc release metadata is malformed: tag_name must be a numeric stable version.",
		);
	if (!Array.isArray(metadata.assets))
		throw new Error("Pandoc release metadata is malformed: assets must be an array.");
	return { tag: metadata.tag_name, assets: metadata.assets };
}

export function selectLinuxAmd64Deb(metadata) {
	const { tag, assets } = parseLatestStableRelease(metadata);
	const expectedName = `pandoc-${tag}-1-amd64.deb`;
	const matches = assets.filter(
		(asset) =>
			asset &&
			typeof asset === "object" &&
			asset.name === expectedName &&
			typeof asset.browser_download_url === "string" &&
			asset.browser_download_url.length > 0,
	);
	if (matches.length !== 1)
		throw new Error(
			`Pandoc release ${tag} must contain exactly one Linux amd64 Debian asset named ${expectedName}; found ${matches.length}.`,
		);
	return { tag, name: expectedName, url: matches[0].browser_download_url };
}

async function responseJson(response, description) {
	if (!response.ok) throw new Error(`${description} failed with HTTP ${response.status}.`);
	try {
		return await response.json();
	} catch (error) {
		throw new Error(`${description} returned invalid JSON: ${error.message}`);
	}
}

export async function installLatestPandoc({
	env = process.env,
	fetchImpl = fetch,
	writeFileImpl = writeFile,
	execFileSyncImpl = execFileSync,
	debPath = "/tmp/pandoc.deb",
} = {}) {
	if (/^(?:1|true|yes)$/i.test(env.PI_OFFLINE ?? ""))
		throw new Error("Pandoc installation is unavailable while Pi is offline.");
	let metadataResponse;
	try {
		metadataResponse = await fetchImpl(latestReleaseUrl, {
			headers: { Accept: "application/vnd.github+json" },
		});
	} catch (error) {
		throw new Error(`Pandoc release metadata request failed: ${error.message}`);
	}
	const asset = selectLinuxAmd64Deb(
		await responseJson(metadataResponse, "Pandoc release metadata request"),
	);
	let downloadResponse;
	try {
		downloadResponse = await fetchImpl(asset.url);
	} catch (error) {
		throw new Error(`Pandoc download request failed: ${error.message}`);
	}
	if (!downloadResponse.ok)
		throw new Error(`Pandoc download failed with HTTP ${downloadResponse.status}.`);
	let bytes;
	try {
		bytes = Buffer.from(await downloadResponse.arrayBuffer());
	} catch (error) {
		throw new Error(`Pandoc download body failed: ${error.message}`);
	}
	await writeFileImpl(debPath, bytes);
	try {
		execFileSyncImpl("dpkg", ["--install", debPath], { stdio: "inherit" });
	} catch (error) {
		throw new Error(`Pandoc dpkg installation failed: ${error.message}`);
	}
	return asset;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) await installLatestPandoc();
