import assert from "node:assert/strict";
import test from "node:test";
import { countNonblankLines } from "../../scripts/check-source-budget.mjs";

test("source budget counts nonblank physical lines", () => {
	assert.equal(countNonblankLines("code\n\n  \n// comment\n\tcode\n"), 3);
	assert.equal(countNonblankLines("\n\t\n"), 0);
});
