import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { parseEvidenceEntries, resolveProjectPath, writeApprovedFile } from "./project-files.js";
import { fingerprintFile, type ProjectSyncState, type SyncManifest } from "./sync.js";

export const DRIFT_TYPES = ["project-artifact", "evidence-artifact", "analysis-evidence", "analysis-artifact", "decision", "style", "sync-manifest"] as const;
export type DriftType = (typeof DRIFT_TYPES)[number];

export interface DriftFinding {
  id: string;
  type: DriftType;
  files: string[];
  domain: string;
  conflict: string;
  whyItMatters: string;
  possibleResolutions: string[];
  recommendedAction: "human-reconciliation";
  syncImpact: string[];
}

export interface ReconciliationChange {
  path: string;
  content: string;
  purpose: string;
}

export interface ReconciliationCandidate {
  finding: DriftFinding;
  selectedResolution: number;
  manifest: SyncManifest;
  content: string;
  changes: ReconciliationChange[];
  requiresApproval: true;
}

function unique(values: string[]): string[] {
  return [...new Set(values)];
}

export function validateDriftFinding(value: unknown): DriftFinding {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Drift finding must be an object");
  const finding = value as Record<string, unknown>;
  const allowedKeys = new Set(["id", "type", "files", "domain", "conflict", "whyItMatters", "possibleResolutions", "recommendedAction", "syncImpact"]);
  const unknownKey = Object.keys(finding).find((key) => !allowedKeys.has(key));
  if (unknownKey) throw new Error(`Unknown drift finding field: ${unknownKey}`);
  const string = (key: string): string => {
    const current = finding[key];
    if (typeof current !== "string" || !current.trim()) throw new Error(`Drift finding ${key} must be a non-empty string`);
    return current;
  };
  const strings = (key: string, minimum = 1): string[] => {
    const current = finding[key];
    if (!Array.isArray(current) || current.length < minimum || current.some((item) => typeof item !== "string" || !item.trim())) {
      throw new Error(`Drift finding ${key} must contain at least ${minimum} non-empty string${minimum === 1 ? "" : "s"}`);
    }
    return unique(current);
  };
  const type = string("type");
  if (!DRIFT_TYPES.includes(type as DriftType)) throw new Error(`Unknown drift type: ${type}`);
  const recommendedAction = string("recommendedAction");
  if (recommendedAction !== "human-reconciliation") throw new Error("Drift findings require human-reconciliation");
  return {
    id: string("id"),
    type: type as DriftType,
    files: strings("files", 2),
    domain: string("domain"),
    conflict: string("conflict"),
    whyItMatters: string("whyItMatters"),
    possibleResolutions: strings("possibleResolutions", 2),
    recommendedAction: "human-reconciliation",
    syncImpact: strings("syncImpact", 1),
  };
}

function createFinding(input: Omit<DriftFinding, "id" | "recommendedAction">, id: number): DriftFinding {
  return validateDriftFinding({ id: `D-${String(id).padStart(3, "0")}`, ...input, recommendedAction: "human-reconciliation" });
}

function dependencyPaths(state: ProjectSyncState, sourcePath: string): string[] {
  return state.artifacts.filter((artifact) => artifact.updateFrom?.includes(sourcePath)).map((artifact) => artifact.path);
}

export async function reviewSynchronizationManifest(state: ProjectSyncState): Promise<DriftFinding[]> {
  const findings: DriftFinding[] = [];
  let id = 1;
  if (state.syncError) {
    findings.push(createFinding({
      type: "sync-manifest",
      files: ["PROJECT.md", "SYNC.md"],
      domain: "synchronization-state",
      conflict: state.syncError,
      whyItMatters: "The supervisor cannot reconstruct confirmed freshness or scoped authority from an absent or invalid manifest.",
      possibleResolutions: ["Review and create a candidate manifest from observed files.", "Correct the manifest structure while preserving the previous authority decisions."],
      syncImpact: ["SYNC.md"],
    }, id++));
    return findings;
  }
  for (const artifact of state.artifacts.filter((artifact) => artifact.changed || !artifact.exists || artifact.status === "conflicted")) {
    const reason = !artifact.exists ? "is missing" : artifact.changed ? "changed since its confirmed fingerprint" : "is marked conflicted";
    findings.push(createFinding({
      type: "sync-manifest",
      files: unique(["SYNC.md", artifact.path]),
      domain: artifact.authoritativeFor.join(", ") || "unspecified-domain",
      conflict: `${artifact.path} ${reason}; this does not determine which representation is correct.`,
      whyItMatters: "Previously confirmed coordination no longer describes the current files.",
      possibleResolutions: ["Inspect the changed artifact and update the manifest after confirming its current role.", "Restore the prior artifact if the change was unintended, then re-confirm fingerprints."],
      syncImpact: unique([artifact.path, ...dependencyPaths(state, artifact.path)]),
    }, id++));
  }
  return findings;
}

export async function reviewProjectArtifact(state: ProjectSyncState): Promise<DriftFinding[]> {
  if (state.syncError) return [];
  const project = state.artifacts.find((artifact) => artifact.path === "PROJECT.md");
  const findings: DriftFinding[] = [];
  let id = 100;
  for (const artifact of state.artifacts.filter((candidate) => candidate.role === "main-artifact")) {
    const dependsOnProject = artifact.updateFrom?.includes("PROJECT.md") || artifact.authoritativeFor.some((domain) => domain.includes("direction") || domain.includes("contribution"));
    if (dependsOnProject && (project?.changed || artifact.changed || artifact.status === "stale" || artifact.status === "needs-review" || artifact.status === "conflicted")) {
      findings.push(createFinding({
        type: "project-artifact",
        files: ["PROJECT.md", artifact.path],
        domain: "project-direction",
        conflict: `${artifact.path} and PROJECT.md require alignment review; one or both have changed or are not current.`,
        whyItMatters: "A contribution, scope, or direction mismatch can change required evidence, structure, and evaluation criteria.",
        possibleResolutions: ["Revise the artifact to reflect the approved project direction.", "Amend PROJECT.md after the project owner confirms a changed direction.", "Approve a combined direction and revise both representations."],
        syncImpact: unique(["PROJECT.md", artifact.path, ...dependencyPaths(state, artifact.path)]),
      }, id++));
    }
  }
  return findings;
}

function sourcePath(source: string | undefined): string | undefined {
  if (!source) return undefined;
  const match = source.match(/`([^`]+)`/);
  const candidate = match?.[1] ?? source.split(/,|\s+(?:row|section)\b/i)[0];
  return candidate.includes("/") || candidate.includes(".") ? candidate.trim() : undefined;
}

export async function reviewEvidenceDependencies(state: ProjectSyncState): Promise<DriftFinding[]> {
  const evidence = state.discovery.files.find((file) => file.name === "EVIDENCE.md");
  if (!evidence?.exists) return [];
  const entries = parseEvidenceEntries(await readFile(evidence.path, "utf8"));
  const findings: DriftFinding[] = [];
  let id = 200;
  for (const entry of entries) {
    const path = sourcePath(entry.source);
    if (!path) continue;
    const absolute = resolve(state.projectRoot, path);
    try {
      await readFile(absolute);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
      const type: DriftType = entry.kind?.toLowerCase().includes("empirical") ? "analysis-evidence" : "evidence-artifact";
      findings.push(createFinding({
        type,
        files: ["EVIDENCE.md", path],
        domain: entry.id,
        conflict: `${entry.id} cites ${path}, but that source file is unavailable.`,
        whyItMatters: "A claim or implementation decision cannot be treated as supported when its declared inspectable source is unavailable.",
        possibleResolutions: ["Restore or correct the source path and re-check the evidence entry.", "Mark the entry unresolved or unsupported until direct support is available."],
        syncImpact: unique(["EVIDENCE.md", ...dependencyPaths(state, "EVIDENCE.md")]),
      }, id++));
    }
  }
  return findings;
}

export async function reviewAnalysisArtifact(state: ProjectSyncState): Promise<DriftFinding[]> {
  if (state.syncError) return [];
  const findings: DriftFinding[] = [];
  let id = 300;
  for (const output of state.artifacts.filter((artifact) => artifact.role === "analysis-output" && (artifact.changed || !artifact.exists))) {
    for (const dependent of dependencyPaths(state, output.path)) {
      findings.push(createFinding({
        type: "analysis-artifact",
        files: [output.path, dependent],
        domain: "computed-results",
        conflict: `${output.path} changed or is missing while ${dependent} declares it as an update dependency.`,
        whyItMatters: "Derived prose or implementation decisions may no longer reflect the computed result.",
        possibleResolutions: ["Re-run the relevant analysis and revise the dependent artifact against its actual output.", "Restore the confirmed output if the change was accidental and re-check dependencies."],
        syncImpact: unique([output.path, dependent]),
      }, id++));
    }
  }
  return findings;
}

export async function reviewDecisionAndStyle(state: ProjectSyncState): Promise<DriftFinding[]> {
  const findings: DriftFinding[] = [];
  let id = 400;
  const decisions = state.discovery.files.find((file) => file.name === "DECISIONS.md");
  const project = state.discovery.files.find((file) => file.name === "PROJECT.md");
  if (decisions?.exists && project?.exists) {
    const [decisionText, projectText] = await Promise.all([readFile(decisions.path, "utf8"), readFile(project.path, "utf8")]);
    const accepted = [...decisionText.matchAll(/^##\s+(D-[A-Za-z0-9-]+).*?\n[\s\S]*?^\*\*Status:\*\*\s*accepted\s*$/gim)].map((match) => match[1]);
    for (const decision of accepted.filter((idValue) => projectText.includes(`[superseded] ${idValue}`))) {
      findings.push(createFinding({
        type: "decision",
        files: ["DECISIONS.md", "PROJECT.md"],
        domain: decision,
        conflict: `${decision} is accepted in DECISIONS.md but is marked superseded in PROJECT.md.`,
        whyItMatters: "The project cannot reliably apply a consequential decision while its operative state disagrees with its decision history.",
        possibleResolutions: ["Supersede the decision in DECISIONS.md with its reason and consequences.", "Restore the accepted decision in PROJECT.md after confirming it remains operative."],
        syncImpact: ["DECISIONS.md", "PROJECT.md"],
      }, id++));
    }
  }
  const style = state.discovery.files.find((file) => file.name === "STYLE.md");
  if (style?.exists && project?.exists) {
    const [styleText, projectText] = await Promise.all([readFile(style.path, "utf8"), readFile(project.path, "utf8")]);
    for (const term of [...styleText.matchAll(/^[-*]\s*\*\*Term:\*\*\s*(.+?)\s*$/gim)].map((match) => match[1])) {
      if (projectText.includes(`[unsupported] ${term}`)) {
        findings.push(createFinding({
          type: "style",
          files: ["STYLE.md", "PROJECT.md"],
          domain: "terminology",
          conflict: `STYLE.md requires '${term}' while PROJECT.md marks it unsupported.`,
          whyItMatters: "Style guidance must not make an unsupported substantive term appear approved.",
          possibleResolutions: ["Remove or qualify the term in STYLE.md.", "Add direct support and approve the term through the project review process."],
          syncImpact: ["STYLE.md", "PROJECT.md"],
        }, id++));
      }
    }
  }
  return findings;
}

export async function reviewProjectDrift(state: ProjectSyncState): Promise<DriftFinding[]> {
  const groups = await Promise.all([
    reviewSynchronizationManifest(state),
    reviewProjectArtifact(state),
    reviewEvidenceDependencies(state),
    reviewAnalysisArtifact(state),
    reviewDecisionAndStyle(state),
  ]);
  return groups.flat().map((finding, index) => ({ ...finding, id: `D-${String(index + 1).padStart(3, "0")}` }));
}

export function formatDriftFindings(findings: DriftFinding[]): string {
  if (findings.length === 0) return "No deterministic drift findings. This does not establish that project representations agree.";
  return findings.map((finding) => [
    `${finding.id} — ${finding.type} (${finding.domain})`,
    `Files: ${finding.files.join(", ")}`,
    `Conflict: ${finding.conflict}`,
    `Why it matters: ${finding.whyItMatters}`,
    "Possible resolutions:",
    ...finding.possibleResolutions.map((resolution, index) => `${index + 1}. ${resolution}`),
    `Synchronization impact: ${finding.syncImpact.join(", ")}`,
  ].join("\n")).join("\n\n");
}

function manifestMarkdown(manifest: SyncManifest): string {
  return `# Project synchronization\n\n\`\`\`json\n${JSON.stringify(manifest, null, 2)}\n\`\`\`\n`;
}

export async function buildReconciliationCandidate(state: ProjectSyncState, finding: DriftFinding, selectedResolution: number): Promise<ReconciliationCandidate> {
  validateDriftFinding(finding);
  if (!state.manifest) throw new Error("A valid SYNC.md manifest is required before reconciliation can be proposed");
  if (!Number.isInteger(selectedResolution) || selectedResolution < 0 || selectedResolution >= finding.possibleResolutions.length) {
    throw new Error("Select one of the finding's possible resolutions");
  }
  const artifacts = await Promise.all(state.manifest.artifacts.map(async (artifact) => {
    const inspected = state.artifacts.find((candidate) => candidate.path === artifact.path);
    const impacted = finding.syncImpact.includes(artifact.path);
    if (!inspected?.exists) return { ...artifact, status: "missing" as const };
    const fingerprint = await fingerprintFile(inspected.absolutePath);
    return { ...artifact, fingerprint, ...(impacted ? { status: "needs-review" as const } : {}) };
  }));
  const manifest: SyncManifest = { version: 1, confirmedAt: new Date().toISOString(), artifacts };
  return { finding, selectedResolution, manifest, content: manifestMarkdown(manifest), changes: [], requiresApproval: true };
}

export async function applyApprovedReconciliation(state: ProjectSyncState, candidate: ReconciliationCandidate, approved: boolean): Promise<void> {
  if (!approved) throw new Error("Reconciliation requires explicit user approval");
  if (!state.manifest || candidate.finding.id.trim() === "") throw new Error("A valid reconciliation candidate is required");
  for (const change of candidate.changes) {
    await writeApprovedFile(resolveProjectPath(state.projectRoot, change.path), change.content, true);
  }
  const output = resolve(state.projectRoot, "SYNC.md");
  await writeApprovedFile(output, candidate.content, true);
}

