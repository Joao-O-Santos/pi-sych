export interface RetrospectiveInput {
  taskId?: string;
  objective: string;
  outcome: "complete" | "partial" | "failed";
  observations: string[];
  verified: string[];
  limitations: string[];
  proposedChanges: string[];
}

export interface RetrospectiveProposal {
  title: string;
  content: string;
  requiresApproval: true;
}

function required(value: string, name: string): string {
  if (!value.trim()) throw new Error(`${name} must not be empty`);
  return value.trim();
}

export function buildRetrospectiveProposal(input: RetrospectiveInput): RetrospectiveProposal {
  const objective = required(input.objective, "objective");
  if (!["complete", "partial", "failed"].includes(input.outcome)) throw new Error(`Unknown outcome: ${input.outcome}`);
  const list = (values: string[]) => values.length ? values.map((value) => `- ${required(value, "retrospective item")}`).join("\n") : "- None recorded.";
  const content = [
    "# Proposed retrospective",
    "",
    `**Task:** ${input.taskId ?? "unassigned"}`,
    `**Objective:** ${objective}`,
    `**Outcome:** ${input.outcome}`,
    "",
    "## Observations",
    "",
    list(input.observations),
    "",
    "## Deterministic verification actually run",
    "",
    list(input.verified),
    "",
    "## Limitations",
    "",
    list(input.limitations),
    "",
    "## Proposed project updates",
    "",
    list(input.proposedChanges),
    "",
    "This retrospective is a proposal. It must be reviewed before changing canonical project files.",
    "",
  ].join("\n");
  return { title: "Retrospective proposal", content, requiresApproval: true };
}
