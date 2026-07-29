import assert from "node:assert/strict";
import test from "node:test";

import { parseModelProfiles } from "../../.test-build/workbench/src/model-catalog.js";

test("model catalog resolves user aliases and preserves ranked profile order", () => {
	const profiles = parseModelProfiles({
		models: {
			strong: { ref: "provider/strong", strength: "deep" },
			fast: { ref: "provider/fast", strength: "fast" },
		},
		profiles: { default: ["strong"], code: ["strong", "fast"] },
	});
	assert.deepEqual(profiles.default, ["provider/strong"]);
	assert.deepEqual(profiles.profiles.code, [
		"provider/strong",
		"provider/fast",
	]);
});

test("model catalog rejects missing defaults and invalid aliases", () => {
	assert.throws(
		() => parseModelProfiles({ profiles: { code: ["provider/model"] } }),
		/profiles\.default/,
	);
	assert.throws(
		() =>
			parseModelProfiles({
				models: { broken: {} },
				profiles: { default: ["broken"] },
			}),
		/non-empty ref/,
	);
});
