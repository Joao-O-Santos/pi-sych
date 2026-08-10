import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const pipeline = await readFile(new URL("../../.gitlab-ci.yml", import.meta.url), "utf8");

test("npm release verifies the published version and latest tag with bounded retries", () => {
	assert.match(pipeline, /for attempt in \$\(seq 1 12\)/);
	assert.match(pipeline, /npm view "\$\{package_name\}@\$\{package_version\}" version/);
	assert.match(pipeline, /npm view "\$\{package_name\}" dist-tags\.latest/);
	assert.match(pipeline, /test "\$\{verified\}" = true/);
});
