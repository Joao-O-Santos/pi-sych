import assert from "node:assert/strict";
import test from "node:test";
import {
	boundedArray,
	boundedString,
	boundedStringArray,
	nonEmptyString,
	objectRecord,
	stringArray,
} from "../../.test-build/workbench/src/validation.js";

test("non-empty strings reject blank and non-string values", () => {
	assert.equal(nonEmptyString("  trimmed  ", "label"), "trimmed");
	assert.throws(() => nonEmptyString("", "label"), /label must be a non-empty string/);
	assert.throws(() => nonEmptyString("   ", "label"), /label must be a non-empty string/);
	assert.throws(() => nonEmptyString(42, "label"), /label must be a non-empty string/);
	assert.throws(() => nonEmptyString(undefined, "label"), /label must be a non-empty string/);
});

test("string arrays trim entries and drop blanks", () => {
	assert.deepEqual(stringArray([" a ", "", "b"], "label"), ["a", "b"]);
	assert.throws(() => stringArray("nope", "label"), /label must be an array of strings/);
	assert.throws(() => stringArray(["ok", 7], "label"), /label must be an array of strings/);
});

test("bounded strings enforce item limits with indexed labels", () => {
	assert.equal(boundedString("ok", "label", 4), "ok");
	assert.throws(() => boundedString("toolong", "label", 4), /label must not exceed 4/);
	assert.deepEqual(boundedStringArray(" single ", "label", 10, 2), ["single"]);
	assert.deepEqual(boundedStringArray(undefined, "label", 10, 2), []);
	assert.deepEqual(boundedStringArray(null, "label", 10, 2), []);
	assert.throws(
		() => boundedStringArray(["a", "b", "c"], "label", 10, 2),
		/label must contain at most 2 entries/,
	);
	assert.throws(
		() => boundedStringArray(["ok", "toolong"], "label", 4, 2),
		/label\[1\] must not exceed 4/,
	);
});

test("object records reject null, arrays, and primitives", () => {
	const record = { a: 1 };
	assert.equal(objectRecord(record, "label"), record);
	assert.throws(() => objectRecord(null, "label"), /label must be an object/);
	assert.throws(() => objectRecord([], "label"), /label must be an object/);
	assert.throws(() => objectRecord("nope", "label"), /label must be an object/);
});

test("bounded arrays default missing input and report indexed conversions", () => {
	const seen = [];
	assert.deepEqual(
		boundedArray(undefined, "label", 2, (item, index) => {
			seen.push([item, index]);
			return item;
		}),
		[],
	);
	assert.deepEqual(seen, []);
	assert.throws(() => boundedArray("nope", "label", 2, (item) => item), /label must be an array/);
	assert.throws(
		() => boundedArray([1, 2, 3], "label", 2, (item) => item),
		/label must contain at most 2 entries/,
	);
	assert.deepEqual(
		boundedArray(["a", "b"], "label", 2, (item, index) => `${index}:${item}`),
		["0:a", "1:b"],
	);
});
