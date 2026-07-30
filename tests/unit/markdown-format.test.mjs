import assert from "node:assert/strict";
import { mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import { formatMarkdown } from "../../scripts/format-markdown.mjs";

test("Pandoc wraps prose while preserving brace labels, tables, and fences", async () => {
	const root = await mkdtemp(join(tmpdir(), "pi-sych-markdown-"));
	const path = join(root, "sample.md");
	await writeFile(
		path,
		`# Sample\n\n{accepted} This deliberately long sentence must wrap at the configured width while keeping its brace-delimited project-state label readable in source and rendered output.\n\n| A | B |\n| - | - |\n| one | two |\n\n\`\`\`ts\nconst value = "unchanged";\n\`\`\`\n`,
	);
	const output = formatMarkdown(path);
	assert.match(output, /^\{accepted\} This deliberately long sentence/m);
	assert.doesNotMatch(output, /\\\{accepted\\\}/);
	assert.match(output, /^\| A\s+\| B\s+\|$/m);
	assert.match(output, /^``` ts\nconst value = "unchanged";\n```$/m);
	assert.ok(
		output
			.split("\n")
			.filter((line) => !line.startsWith("|"))
			.every((line) => line.length <= 72),
	);
});

test("Pandoc formatting reports a missing input file", () => {
	assert.throws(
		() => formatMarkdown("missing-markdown-input.md"),
		/Pandoc failed for missing-markdown-input\.md/,
	);
});
