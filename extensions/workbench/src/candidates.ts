import { readFile } from "node:fs/promises";
import { basename, relative, resolve } from "node:path";
import { fingerprintFile } from "./sync.js";
import { discoverProjectFiles, resolveProjectPath, writeApprovedFile } from "./project-files.js";

export const PROPOSAL_LABELS = ["explicit", "inferred", "unresolved", "contradicted", "unsupported"] as const;
export type ProposalLabel = (typeof PROPOSAL_LABELS)[number];

export interface CandidateStatement {
  label: ProposalLabel;
  group: string;
  text: string;
  source?: string;
}

export interface CandidateFile {
  path: string;
  content: string;
  purpose: string;
}

export interface CandidateReview {
  title: string;
  files: CandidateFile[];
  statements: CandidateStatement[];
  requiresApproval: true;
}

export interface GreenfieldAnswers {
  objective?: string;
  audience?: string;
  contribution?: string;
  deliverables?: string;
  constraints?: string;
  definitionOfDone?: string;
}

const GREENFIELD_QUESTIONS: Array<{ key: keyof GreenfieldAnswers; question: string }> = [
  { key: "objective", question: "What is the immediate objective of this project?" },
  { key: "audience", question: "Who will use or evaluate the result?" },
  { key: "contribution", question: "What contribution should the work make?" },
  { key: "deliverables", question: "What concrete deliverable should this produce?" },
  { key: "constraints", question: "What constraints or non-negotiable preferences apply?" },
  { key: "definitionOfDone", question: "What would count as done?" },
];

function line(label: ProposalLabel, text?: string, fallback = "Confirm this with the project owner."): string {
  return `[${label}] ${text?.trim() || fallback}`;
}

export function nextGreenfieldQuestion(answers: GreenfieldAnswers): string | undefined {
  return GREENFIELD_QUESTIONS.find(({ key }) => !answers[key]?.trim())?.question;
}

export function buildGreenfieldCandidate(answers: GreenfieldAnswers = {}): CandidateReview {
  const statements: CandidateStatement[] = [];
  const fields: Array<[keyof GreenfieldAnswers, string, string]> = [
    ["objective", "Objective", "project objective"],
    ["audience", "Audience and use", "intended audience"],
    ["contribution", "Intended contribution", "intended contribution"],
    ["deliverables", "Deliverables", "deliverables"],
    ["constraints", "Constraints", "constraints"],
    ["definitionOfDone", "Definition of done", "completion criteria"],
  ];
  const projectSections = fields.map(([key, heading, group]) => {
    const value = answers[key]?.trim();
    statements.push({ label: value ? "explicit" : "unresolved", group, text: value || `Confirm ${group}.`, ...(value ? { source: "user response" } : {}) });
    return `## ${heading}\n\n${line(value ? "explicit" : "unresolved", value, `Confirm ${group}.`)}`;
  });
  const project = [
    "# Project",
    "",
    ...projectSections,
    "",
    "## Main artifact",
    "",
    line("unresolved", undefined, "Identify the principal artifact or repository deliverable."),
    "",
    "## Current direction",
    "",
    line("unresolved", undefined, "Confirm the initial direction after reviewing this candidate."),
    "",
    "## Project rules and preferences",
    "",
    line("unresolved", undefined, "Record only approved project-specific rules."),
    "",
    "## Open decisions",
    "",
    line("unresolved", undefined, "Record consequential unresolved decisions when they arise."),
    "",
    "## Review and approval policy",
    "",
    "[explicit] Durable changes require explicit project-owner approval.",
    "",
    "## Current state",
    "",
    "[explicit] Candidate created from a focused greenfield interview; it is not accepted until reviewed.",
    "",
    "## Immediate next step",
    "",
    line("unresolved", undefined, "Review this candidate and confirm the next substantive task."),
    "",
  ].join("\n");
  const evidence = [
    "# Evidence",
    "",
    "No evidence entries have been accepted yet.",
    "",
    "Add concise entries only for inspectable literature, empirical output, documentation, or observed behaviour. Include source, support, limits, and checked date.",
    "",
  ].join("\n");
  return { title: "Greenfield canonical-state candidate", files: [{ path: "PROJECT.md", content: project, purpose: "operative project state" }, { path: "EVIDENCE.md", content: evidence, purpose: "claim and decision support" }], statements, requiresApproval: true };
}

function headings(markdown: string): string[] {
  return [...markdown.matchAll(/^#{1,6}\s+(.+?)\s*$/gm)].map((match) => match[1].trim());
}

export function buildArtifactProjectCandidate(artifactPath: string, markdown: string): CandidateReview {
  const title = headings(markdown)[0] ?? basename(artifactPath);
  const sections = headings(markdown).slice(1);
  const source = artifactPath;
  const statements: CandidateStatement[] = [
    { label: "explicit", group: "artifact identity", text: `The artifact title is '${title}'.`, source },
    ...(sections.length > 0 ? [{ label: "explicit" as const, group: "artifact structure", text: `The artifact has sections: ${sections.join(", ")}.`, source }] : []),
    { label: "inferred", group: "main artifact", text: `${artifactPath} appears to be a principal artifact; confirm this role before accepting it.`, source },
    { label: "unresolved", group: "objective", text: "The project objective is not accepted merely from artifact structure." },
    { label: "unresolved", group: "evidence", text: "Map substantive claims to inspectable evidence before accepting them." },
  ];
  const project = [
    "# Project",
    "",
    "## Objective",
    "",
    "[unresolved] Confirm the objective; the artifact structure alone is insufficient.",
    "",
    "## Main artifact",
    "",
    `[inferred] ${artifactPath} appears to be the main artifact.`,
    "",
    "## Current direction",
    "",
    `[explicit] Existing artifact title: ${title}.`,
    "",
    "## Open decisions",
    "",
    "[unresolved] Confirm the contribution, scope, and completion criteria.",
    "",
  ].join("\n");
  return { title: `Canonical-state candidate from ${artifactPath}`, files: [{ path: "PROJECT.md", content: project, purpose: "candidate project state" }], statements, requiresApproval: true };
}

export function buildOutlineCandidate(projectMarkdown: string, evidenceMarkdown = ""): CandidateReview {
  const projectHeadings = headings(projectMarkdown);
  const evidenceEntries = [...evidenceMarkdown.matchAll(/^##\s+(E-[A-Za-z0-9-]+)/gm)].map((match) => match[1]);
  const statements: CandidateStatement[] = [
    { label: "explicit", group: "project constraints", text: `The proposal uses PROJECT.md sections: ${projectHeadings.join(", ") || "none detected"}.`, source: "PROJECT.md" },
    ...(evidenceEntries.length > 0 ? [{ label: "explicit" as const, group: "evidence", text: `The proposal can draw on evidence entries: ${evidenceEntries.join(", ")}.`, source: "EVIDENCE.md" }] : []),
    { label: "unresolved", group: "artifact scope", text: "Confirm the target audience, required section depth, and claims before drafting prose." },
    { label: "inferred", group: "synchronization", text: "Writing a derived artifact may make its synchronization record need review." },
  ];
  const outline = [
    "# Proposed artifact outline",
    "",
    "1. Purpose and audience",
    "2. Context and evidence",
    "3. Central contribution or result",
    "4. Method, implementation, or reasoning",
    "5. Limits, open decisions, and next steps",
    "",
  ].join("\n");
  return { title: "Outline candidate from canonical project state", files: [{ path: "OUTLINE.proposed.md", content: outline, purpose: "reviewable artifact outline" }], statements, requiresApproval: true };
}

export function buildSectionCandidate(section: string, projectMarkdown: string, evidenceMarkdown = ""): CandidateReview {
  const normalizedSection = section.trim() || "Untitled section";
  const projectHeadings = headings(projectMarkdown);
  const evidenceEntries = [...evidenceMarkdown.matchAll(/^##\s+(E-[A-Za-z0-9-]+)/gm)].map((match) => match[1]);
  const statements: CandidateStatement[] = [
    { label: "explicit", group: "project constraints", text: `The section proposal uses PROJECT.md sections: ${projectHeadings.join(", ") || "none detected"}.`, source: "PROJECT.md" },
    ...(evidenceEntries.length > 0 ? [{ label: "explicit" as const, group: "evidence", text: `Cite only relevant evidence entries: ${evidenceEntries.join(", ")}.`, source: "EVIDENCE.md" }] : []),
    { label: "unresolved", group: "claim support", text: "Replace placeholders only with supported claims and identify evidence limits." },
    { label: "inferred", group: "synchronization", text: "Accepting this proposed section may make the main artifact's synchronization state need review." },
  ];
  const content = [
    `# ${normalizedSection}`,
    "",
    "[unresolved] State the section's precise purpose and audience before prose is accepted.",
    "",
    "[unresolved] Add only claims supported by the identified evidence, with limits where relevant.",
    "",
  ].join("\n");
  return { title: `Section candidate: ${normalizedSection}`, files: [{ path: "SECTION.proposed.md", content, purpose: "reviewable section proposal" }], statements, requiresApproval: true };
}

export function formatCandidateReview(candidate: CandidateReview): string {
  const lines = [candidate.title, "", "Proposed files (not written):", ...candidate.files.flatMap((file) => ["- " + file.path + " — " + file.purpose, "", "```", file.content, "```"])];
  for (const label of PROPOSAL_LABELS) {
    const group = candidate.statements.filter((statement) => statement.label === label);
    if (group.length > 0) lines.push("", `${label[0].toUpperCase()}${label.slice(1)}:`, ...group.map((statement) => `- ${statement.text}${statement.source ? ` (${statement.source})` : ""}`));
  }
  lines.push("", "Review these grouped candidates. No durable file will be written until explicit approval.");
  return lines.join("\n");
}

function syncMarkdown(confirmedAt: string, artifacts: Array<Record<string, unknown>>): string {
  return `# Project synchronization\n\n\`\`\`json\n${JSON.stringify({ version: 1, confirmedAt, artifacts }, null, 2)}\n\`\`\`\n`;
}

export async function buildSyncCandidate(projectRoot: string): Promise<CandidateReview> {
  const discovery = await discoverProjectFiles(projectRoot);
  const artifacts = [] as Array<Record<string, unknown>>;
  for (const file of discovery.files.filter((file) => file.name !== "SYNC.md" && file.exists)) {
    const domains = file.name === "PROJECT.md" ? ["objective", "scope", "contribution", "accepted-direction"] : file.name === "EVIDENCE.md" ? ["literature-support", "empirical-claims", "caveats"] : ["project-instructions"];
    artifacts.push({ path: relative(discovery.root, file.path), role: file.name === "PROJECT.md" ? "project" : file.name === "EVIDENCE.md" ? "evidence" : "instructions", status: "current", authoritativeFor: domains, fingerprint: await fingerprintFile(file.path) });
  }
  const content = syncMarkdown(new Date().toISOString(), artifacts);
  return {
    title: "Synchronization manifest candidate",
    files: [{ path: "SYNC.md", content, purpose: "reviewable freshness and scoped-authority record" }],
    statements: [
      { label: "explicit", group: "observed files", text: `Candidate records ${artifacts.length} existing canonical artifact${artifacts.length === 1 ? "" : "s"}.`, source: discovery.root },
      { label: "unresolved", group: "authority", text: "Confirm each proposed authority domain and freshness state before accepting this manifest." },
    ],
    requiresApproval: true,
  };
}

export async function applyCandidate(projectRoot: string, candidate: CandidateReview, approved: boolean): Promise<string[]> {
  if (!approved) throw new Error("Candidate files require explicit approval before writing");
  const written: string[] = [];
  for (const file of candidate.files) {
    const target = resolveProjectPath(projectRoot, file.path);
    await writeApprovedFile(target, file.content, true);
    written.push(target);
  }
  return written;
}

export async function artifactCandidateFromFile(projectRoot: string, artifactPath: string): Promise<CandidateReview> {
  const absolute = resolve(projectRoot, artifactPath);
  return buildArtifactProjectCandidate(artifactPath, await readFile(absolute, "utf8"));
}
