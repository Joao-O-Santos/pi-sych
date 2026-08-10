import assert from "node:assert/strict";
import test from "node:test";

import { rewriteMarkdownLinks, validateHtmlLinks } from "../../scripts/site-links.mjs";

test("site links rewrite canonical Markdown pages and images", () => {
	const rewritten = rewriteMarkdownLinks(
		"[Workflow](docs/review-workflow.md#human-review-tools) ![Flow](docs/img/review_workflow.png)",
		"README.md",
	);
	assert.equal(
		rewritten,
		"[Workflow](review-workflow.html#human-review-tools) ![Flow](img/review_workflow.png)",
	);
	assert.equal(
		rewriteMarkdownLinks("![Flow](img/review_workflow.png)", "docs/review-workflow.md"),
		"![Flow](img/review_workflow.png)",
	);
	assert.equal(
		rewriteMarkdownLinks(
			"[![Flow](docs/img/review_workflow.png)](docs/review-workflow.md)",
			"README.md",
		),
		"[![Flow](img/review_workflow.png)](review-workflow.html)",
	);
	assert.equal(
		rewriteMarkdownLinks(
			"[Architecture](docs/ARCHITECTURE.md#worker-lifecycle) [Contributing](docs/CONTRIBUTING.md)",
			"README.md",
		),
		"[Architecture](architecture.html#worker-lifecycle) [Contributing](contributing.html)",
	);
});

test("site link validation accepts pages, images, and fragments and rejects broken links", () => {
	const files = [
		{
			path: "index.html",
			html: '<main id="content"><a href="guide.html#start">Guide</a><img src="img/flow.png"></main>',
		},
		{ path: "guide.html", html: '<h1 id="start">Start</h1>' },
	];
	validateHtmlLinks(files, new Set(["index.html", "guide.html", "img/flow.png"]));
	assert.throws(
		() =>
			validateHtmlLinks([
				{ path: "index.html", html: '<a href="guide.html#missing">x</a>' },
				{ path: "guide.html", html: '<h1 id="start">Start</h1>' },
			]),
		/missing fragment/,
	);
	assert.throws(
		() => validateHtmlLinks([{ path: "index.html", html: '<img src="img/missing.png">' }]),
		/missing target/,
	);
});
