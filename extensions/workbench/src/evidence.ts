import { constants } from "node:fs";
import { access, readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { type EvidenceEntry, parseEvidenceEntries } from "./project-files.js";
import { fingerprintFile, type ProjectSyncState } from "./sync.js";

export interface EvidenceProposal {
	id: string;
	title: string;
	status: "proposed";
	kind:
		| "empirical result"
		| "literature"
		| "official documentation"
		| "observed behaviour";
	source: string;
	evidence: string;
	sourceClaim?: string;
	projectInterpretation?: string;
	limits: string;
	supports: string[];
	checked: string;
}

export interface EvidenceChallenge {
	entryId: string;
	issue: "missing-source" | "missing-field" | "unsupported-status";
	source?: string;
	explanation: string;
	proposedStatuses: string[];
}

export interface EvidenceDependencyState {
	evidencePath: string;
	evidenceChanged: boolean;
	changedSources: string[];
	dependentArtifacts: string[];
	status: "current" | "needs-review";
}

function requireString(value: unknown, name: string): string {
	if (typeof value !== "string" || !value.trim())
		throw new Error(`${name} must be a non-empty string`);
	return value.trim();
}

export function buildEvidenceProposal(input: {
	id: string;
	title: string;
	kind: EvidenceProposal["kind"];
	source: string;
	evidence: string;
	sourceClaim?: string;
	projectInterpretation?: string;
	limits: string;
	supports?: string[];
	checked?: string;
}): EvidenceProposal {
	return {
		id: requireString(input.id, "id"),
		title: requireString(input.title, "title"),
		status: "proposed",
		kind: input.kind,
		source: requireString(input.source, "source"),
		evidence: requireString(input.evidence, "evidence"),
		...(input.sourceClaim ? { sourceClaim: input.sourceClaim.trim() } : {}),
		...(input.projectInterpretation
			? { projectInterpretation: input.projectInterpretation.trim() }
			: {}),
		limits: requireString(input.limits, "limits"),
		supports: [
			...new Set(
				(input.supports ?? []).map((support) =>
					requireString(support, "supports entry"),
				),
			),
		],
		checked: input.checked ?? new Date().toISOString().slice(0, 10),
	};
}

export function formatEvidenceProposal(proposal: EvidenceProposal): string {
	return [
		`## ${proposal.id} — ${proposal.title}`,
		"",
		`**Status:** ${proposal.status}`,
		`**Kind:** ${proposal.kind}`,
		`**Source:** ${proposal.source}`,
		...(proposal.supports.length
			? [`**Supports:** ${proposal.supports.join("; ")}`]
			: []),
		`**Evidence:** ${proposal.evidence}`,
		...(proposal.sourceClaim
			? [`**Source claim:** ${proposal.sourceClaim}`]
			: []),
		...(proposal.projectInterpretation
			? [`**Project interpretation:** ${proposal.projectInterpretation}`]
			: []),
		`**Limits:** ${proposal.limits}`,
		`**Checked:** ${proposal.checked}`,
		"",
		"This is a proposal; it is not verified or accepted until reviewed against the source.",
	].join("\n");
}

async function pathExists(path: string): Promise<boolean> {
	try {
		await access(path, constants.F_OK);
		return true;
	} catch {
		return false;
	}
}

export async function challengeEvidenceEntries(
	projectRoot: string,
	entries: EvidenceEntry[],
): Promise<EvidenceChallenge[]> {
	const challenges: EvidenceChallenge[] = [];
	for (const entry of entries) {
		const source =
			entry.source?.match(/`([^`]+)`/)?.[1] ?? entry.source?.trim();
		if (!entry.status || !entry.kind || !entry.source) {
			challenges.push({
				entryId: entry.id,
				issue: "missing-field",
				...(source ? { source } : {}),
				explanation:
					"Evidence entries need status, kind, and an inspectable source before they can support a claim.",
				proposedStatuses: ["needs-review", "unsupported"],
			});
			continue;
		}
		if (
			source &&
			(source.includes("/") || source.includes(".")) &&
			!(await pathExists(resolve(projectRoot, source)))
		) {
			challenges.push({
				entryId: entry.id,
				issue: "missing-source",
				source,
				explanation: `The declared evidence source '${source}' is unavailable at the project path.`,
				proposedStatuses: ["needs-review", "unsupported"],
			});
		}
		if (
			![
				"supported",
				"supported-with-limits",
				"verified",
				"proposed",
				"unresolved",
				"unsupported",
			].includes(entry.status)
		) {
			challenges.push({
				entryId: entry.id,
				issue: "unsupported-status",
				...(source ? { source } : {}),
				explanation: `Status '${entry.status}' is not one of the documented evidence states.`,
				proposedStatuses: ["needs-review", "unresolved"],
			});
		}
	}
	return challenges;
}

export async function evidenceDependencyState(
	state: ProjectSyncState,
): Promise<EvidenceDependencyState> {
	const evidence = state.artifacts.find(
		(artifact) => artifact.path === "EVIDENCE.md",
	);
	const changedSources = state.artifacts
		.filter((artifact) => artifact.changed && artifact.path !== "EVIDENCE.md")
		.map((artifact) => artifact.path);
	const dependentArtifacts = state.artifacts
		.filter(
			(artifact) =>
				artifact.updateFrom?.includes("EVIDENCE.md") ||
				changedSources.some((source) => artifact.updateFrom?.includes(source)),
		)
		.map((artifact) => artifact.path);
	return {
		evidencePath: evidence?.path ?? "EVIDENCE.md",
		evidenceChanged: evidence?.changed ?? false,
		changedSources,
		dependentArtifacts,
		status:
			evidence?.changed || changedSources.length > 0
				? "needs-review"
				: "current",
	};
}

export function formatEvidenceChallenges(
	challenges: EvidenceChallenge[],
): string {
	if (challenges.length === 0) return "No deterministic evidence challenges.";
	return challenges
		.map((challenge) =>
			[
				`${challenge.entryId} — ${challenge.issue}`,
				challenge.explanation,
				...(challenge.source ? [`Source: ${challenge.source}`] : []),
				`Proposed statuses: ${challenge.proposedStatuses.join(", ")}`,
			].join("\n"),
		)
		.join("\n\n");
}

export async function fingerprintEvidenceSource(
	projectRoot: string,
	source: string,
): Promise<string | undefined> {
	const path = resolve(projectRoot, source);
	return (await pathExists(path)) ? fingerprintFile(path) : undefined;
}

export async function readEvidence(
	projectRoot: string,
): Promise<EvidenceEntry[]> {
	const path = resolve(projectRoot, "EVIDENCE.md");
	return (await pathExists(path))
		? parseEvidenceEntries(await readFile(path, "utf8"))
		: [];
}
