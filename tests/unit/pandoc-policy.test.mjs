import assert from "node:assert/strict";
import test from "node:test";

import { comparePandocVersions, parsePandocVersion } from "../../scripts/format-markdown.mjs";
import {
	parseLatestStableRelease,
	selectLinuxAmd64Deb,
} from "../../scripts/install-latest-pandoc.mjs";

test("Pandoc versions are numeric and compare at the minimum boundary", () => {
	assert.deepEqual(parsePandocVersion("3.10.1"), [3, 10, 1]);
	assert.deepEqual(parsePandocVersion("3.11"), [3, 11, 0]);
	assert.equal(parsePandocVersion("3"), undefined);
	assert.equal(parsePandocVersion("v3.10.1"), undefined);
	assert.equal(comparePandocVersions("3.10.1", "3.10.1"), 0);
	assert.ok(comparePandocVersions("3.11", "3.10.1") > 0);
	assert.ok(comparePandocVersions("3.10.2", "3.10.1") > 0);
	assert.ok(comparePandocVersions("3.9.99", "3.10.1") < 0);
	assert.throws(() => comparePandocVersions("latest", "3.10.1"), /numeric/);
});

const release = {
	tag_name: "3.10.1",
	draft: false,
	prerelease: false,
	assets: [
		{ name: "pandoc-3.10.1-1-amd64.deb", browser_download_url: "https://example.test/p.deb" },
	],
};

test("latest Pandoc metadata selects only the exact Linux amd64 Debian asset", () => {
	assert.deepEqual(selectLinuxAmd64Deb(release), {
		tag: "3.10.1",
		name: "pandoc-3.10.1-1-amd64.deb",
		url: "https://example.test/p.deb",
	});
	assert.deepEqual(
		selectLinuxAmd64Deb({
			...release,
			tag_name: "3.11",
			assets: [
				{ name: "pandoc-3.11-1-amd64.deb", browser_download_url: "https://example.test/p.deb" },
			],
		}),
		{
			tag: "3.11",
			name: "pandoc-3.11-1-amd64.deb",
			url: "https://example.test/p.deb",
		},
	);
	assert.throws(() => parseLatestStableRelease({ ...release, prerelease: true }), /not a stable/);
	assert.throws(() => selectLinuxAmd64Deb({ ...release, assets: [] }), /exactly one/);
	assert.throws(
		() => selectLinuxAmd64Deb({ ...release, assets: [...release.assets, ...release.assets] }),
		/exactly one/,
	);
	assert.throws(
		() => parseLatestStableRelease({ ...release, tag_name: "v3.10.1" }),
		/numeric stable/,
	);
	assert.throws(() => parseLatestStableRelease(null), /expected an object/);
});
