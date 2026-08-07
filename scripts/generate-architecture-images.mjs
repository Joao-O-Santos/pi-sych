#!/usr/bin/env node
import { writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { Resvg } from "@resvg/resvg-js";

const scriptRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");

const COLORS = {
	supervisor: { fill: "#dbeafe", stroke: "#1e40af" },
	state: { fill: "#d1fae5", stroke: "#065f46" },
	worker: { fill: "#fef3c7", stroke: "#92400e" },
	adapter: { fill: "#fce7f3", stroke: "#9d174d" },
	review: { fill: "#fce7f3", stroke: "#9d174d" },
	decision: { fill: "#d1fae5", stroke: "#065f46" },
};

// Render text by computing character positions; SVG <text> cannot wrap on its own.
function textLines(x, y, lines, { size = 14, weight = 400, color = "#1f2937", family = "system-ui, -apple-system, sans-serif" } = {}) {
	return lines
		.map((line, i) => `<text x="${x}" y="${y + i * (size + 4)}" font-family='${family}' font-size="${size}" font-weight="${weight}" fill="${color}" text-anchor="middle">${escape(line)}</text>`)
		.join("");
}

function escape(s) {
	return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function box(x, y, width, height, title, subtitle, palette) {
	const titleSize = 16;
	const subtitleSize = 13;
	const lines = subtitle ? subtitle.split("\n") : [];
	const totalHeight = lines.length ? titleSize + 8 + lines.length * (subtitleSize + 4) : titleSize;
	const startY = y + (height - totalHeight) / 2;
	return `
		<rect x="${x}" y="${y}" width="${width}" height="${height}" rx="12" ry="12"
			fill="${palette.fill}" stroke="${palette.stroke}" stroke-width="2"/>
		<text x="${x + width / 2}" y="${startY + titleSize}" font-family="system-ui, -apple-system, sans-serif"
			font-size="${titleSize}" font-weight="700" fill="${palette.stroke}" text-anchor="middle">${escape(title)}</text>
		${textLines(x + width / 2, startY + titleSize + 12, lines, { size: subtitleSize })}
	`;
}

function arrow(x1, y1, x2, y2) {
	const midX = (x1 + x2) / 2;
	return `
		<defs>
			<marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto-start-reverse">
				<path d="M 0 0 L 10 5 L 0 10 z" fill="#6b7280"/>
			</marker>
		</defs>
		<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#6b7280" stroke-width="2" marker-end="url(#arrow)"/>
	`;
}

function buildArchitecture() {
	const width = 1200;
	const height = 600;
	const boxW = 220;
	const boxH = 160;
	const y1 = 180;
	const y2 = 440;
	const x1 = 40;
	const x2 = (width - boxW) / 2;
	const x3 = width - boxW - 40;
	return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
		<rect width="100%" height="100%" fill="#ffffff"/>
		<text x="40" y="50" font-family="system-ui, -apple-system, sans-serif" font-size="32" font-weight="700" fill="#111827">Pi Sych runtime</text>
		<text x="40" y="85" font-family="system-ui, -apple-system, sans-serif" font-size="16" fill="#4b5563">Small mechanical substrate; humans and skills own semantic judgment.</text>
		${box(x1, y1, boxW, boxH, "Supervisor", "two tools:\nproject_status\ndispatch_worker", COLORS.supervisor)}
		${box(x2, y1, boxW, boxH, "Project state", "SYNC.json\nPROJECT.md\ndeclared dependencies", COLORS.state)}
		${box(x3, y1, boxW, boxH, "Bounded worker", "one task, one result\nclean context\nimmutable submission", COLORS.worker)}
		${box(x2, y2, boxW, boxH, "Optional adapters", "MCPorter\nPlannotator", COLORS.adapter)}
		${arrow(x1 + boxW, y1 + boxH / 2, x2, y1 + boxH / 2)}
		${arrow(x2 + boxW, y1 + boxH / 2, x3, y1 + boxH / 2)}
		${arrow(x2 + boxW / 2, y1 + boxH, x2 + boxW / 2, y2)}
	</svg>`;
}

function buildSupervisorContext() {
	const width = 1200;
	const height = 600;
	const boxW = 240;
	const boxH = 180;
	const y1 = 200;
	const y2 = 440;
	const x1 = 40;
	const x2 = (width - boxW) / 2;
	const x3 = width - boxW - 40;
	return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
		<rect width="100%" height="100%" fill="#ffffff"/>
		<text x="40" y="50" font-family="system-ui, -apple-system, sans-serif" font-size="32" font-weight="700" fill="#111827">Supervisor and compaction</text>
		<text x="40" y="85" font-family="system-ui, -apple-system, sans-serif" font-size="16" fill="#4b5563">Configured project context remains visible and bounded.</text>
		${box(x1, y1, boxW, boxH, "Pi session", "conversation active\nconfigured agents", COLORS.supervisor)}
		${box(x2, y1, boxW, boxH, "Custom compaction", "six fields\nproject, todo, decisions\ninbox excluded", COLORS.state)}
		${box(x3, y1, boxW, boxH, "Next session", "working memory\ncontext restored", COLORS.worker)}
		${box(x2, y2, boxW, boxH, "Human review", "INBOX.md\nappend-only proposals", COLORS.review)}
		${arrow(x1 + boxW, y1 + boxH / 2, x2, y1 + boxH / 2)}
		${arrow(x2 + boxW, y1 + boxH / 2, x3, y1 + boxH / 2)}
		${arrow(x2 + boxW / 2, y1 + boxH, x2 + boxW / 2, y2)}
	</svg>`;
}

function buildSkillsArchitecture() {
	const width = 1200;
	const height = 600;
	const boxW = 240;
	const boxH = 200;
	const y1 = 200;
	const y2 = 440;
	const x1 = 40;
	const x2 = (width - boxW) / 2;
	const x3 = width - boxW - 40;
	return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
		<rect width="100%" height="100%" fill="#ffffff"/>
		<text x="40" y="50" font-family="system-ui, -apple-system, sans-serif" font-size="32" font-weight="700" fill="#111827">Six public skills</text>
		<text x="40" y="85" font-family="system-ui, -apple-system, sans-serif" font-size="16" fill="#4b5563">Umbrella skills route to shared methods and local modules.</text>
		${box(x1, y1, boxW, boxH, "Public skills", "project, write, analyze\ncode, review, research\nordered task recipes", COLORS.supervisor)}
		${box(x2, y1, boxW, boxH, "Composition", "shared methods\nlocal modules\nnot public skills", COLORS.state)}
		${box(x3, y1, boxW, boxH, "Worker packet", "selected skill\nrouted methods\ncontext files", COLORS.worker)}
		${box(x2, y2, boxW, boxH, "Authoring boundary", "non-public guidance\nreusable procedures\ngenre adaptation", COLORS.adapter)}
		${arrow(x1 + boxW, y1 + boxH / 2, x2, y1 + boxH / 2)}
		${arrow(x2 + boxW, y1 + boxH / 2, x3, y1 + boxH / 2)}
		${arrow(x2 + boxW / 2, y1 + boxH, x2 + boxW / 2, y2)}
	</svg>`;
}

function buildReviewWorkflow() {
	const width = 1200;
	const height = 600;
	const boxW = 240;
	const boxH = 180;
	const y1 = 200;
	const y2 = 440;
	const x1 = 40;
	const x2 = (width - boxW) / 2;
	const x3 = width - boxW - 40;
	return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
		<rect width="100%" height="100%" fill="#ffffff"/>
		<text x="40" y="50" font-family="system-ui, -apple-system, sans-serif" font-size="32" font-weight="700" fill="#111827">Human-guided review</text>
		<text x="40" y="85" font-family="system-ui, -apple-system, sans-serif" font-size="16" fill="#4b5563">Optional Plannotator adapter; approval remains human-owned.</text>
		${box(x1, y1, boxW, boxH, "Artifact", "source, memo, code\nproposed revision", COLORS.supervisor)}
		${box(x2, y1, boxW, boxH, "Review adapter", "Plannotator\noptional integration\nbrowser-mediated", COLORS.review)}
		${box(x3, y1, boxW, boxH, "Human decision", "revise, verify, accept\nconsequential choice", COLORS.decision)}
		${box(x2, y2, boxW, boxH, "Mechanical checks", "format, typecheck, tests\nread-only review", COLORS.adapter)}
		${arrow(x1 + boxW, y1 + boxH / 2, x2, y1 + boxH / 2)}
		${arrow(x2 + boxW, y1 + boxH / 2, x3, y1 + boxH / 2)}
		${arrow(x2 + boxW / 2, y1 + boxH, x2 + boxW / 2, y2)}
	</svg>`;
}

const diagrams = {
	"architecture.png": buildArchitecture(),
	"supervisors_context.png": buildSupervisorContext(),
	"skills_architecture.png": buildSkillsArchitecture(),
	"review_workflow.png": buildReviewWorkflow(),
};

for (const [name, svg] of Object.entries(diagrams)) {
	const resvg = new Resvg(svg, {
		background: "#ffffff",
		font: { loadSystemFonts: true, defaultFontFamily: "sans-serif" },
	});
	const png = resvg.render().asPng();
	const target = resolve(scriptRoot, "docs/img", name);
	await writeFile(target, png);
	console.log(`wrote ${target} (${png.length} bytes)`);
}
