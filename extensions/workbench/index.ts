import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, extname, isAbsolute, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import type { ExtensionAPI, ExtensionCommandContext } from "@earendil-works/pi-coding-agent";
import { Type } from "typebox";
import {
  applyCandidate,
  artifactCandidateFromFile,
  buildGreenfieldCandidate,
  buildSyncCandidate,
  formatCandidateReview,
  nextGreenfieldQuestion,
  type CandidateReview,
} from "./src/candidates.js";
import { applyApprovedReconciliation, buildReconciliationCandidate, formatDriftFindings, reviewProjectDrift } from "./src/drift.js";
import { dispatchWorker } from "./src/worker-engine.js";
import { loadModelProfiles } from "./src/model-catalog.js";
import { formatMcporterDiagnostic, inspectMcporter, remoteResearchExtensionPaths } from "./src/mcporter.js";
import { formatSyncSummary, inspectProjectSync } from "./src/sync.js";
import { runVerification } from "./src/verification.js";
import { buildEvidenceProposal, challengeEvidenceEntries, formatEvidenceChallenges, formatEvidenceProposal, readEvidence } from "./src/evidence.js";
import { buildRetrospectiveProposal } from "./src/retrospective.js";
import { startFileAnnotation, startLastMessageAnnotation, startPlanReview } from "./src/plannotator.js";

export interface PackageStatus {
  name: string;
  version: string;
  packageRoot: string;
}

interface PackageMetadata {
  name?: unknown;
  version?: unknown;
}

export const PACKAGE_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");

export function getPackageStatus(packageRoot = PACKAGE_ROOT): PackageStatus {
  const metadata = JSON.parse(readFileSync(resolve(packageRoot, "package.json"), "utf8")) as PackageMetadata;
  if (typeof metadata.name !== "string" || typeof metadata.version !== "string") {
    throw new Error("package.json must contain string name and version fields");
  }
  return { name: metadata.name, version: metadata.version, packageRoot };
}

export function formatPackageStatus(status: PackageStatus): string {
  return `${status.name} ${status.version}\npackage: ${status.packageRoot}`;
}

const verificationParameters = Type.Object({
  executable: Type.String(),
  args: Type.Array(Type.String()),
  cwd: Type.Optional(Type.String()),
  expectedExitCode: Type.Optional(Type.Integer()),
  timeoutMs: Type.Optional(Type.Integer({ minimum: 1 })),
});

const driftFindingParameters = Type.Object({
  id: Type.String(),
  type: Type.Union([
    Type.Literal("project-artifact"),
    Type.Literal("evidence-artifact"),
    Type.Literal("analysis-evidence"),
    Type.Literal("analysis-artifact"),
    Type.Literal("decision"),
    Type.Literal("style"),
    Type.Literal("sync-manifest"),
  ]),
  files: Type.Array(Type.String()),
  domain: Type.String(),
  conflict: Type.String(),
  whyItMatters: Type.String(),
  possibleResolutions: Type.Array(Type.String()),
  recommendedAction: Type.Literal("human-reconciliation"),
  syncImpact: Type.Array(Type.String()),
});

const reconciliationParameters = Type.Object({
  finding: driftFindingParameters,
  selectedResolution: Type.Integer({ minimum: 0 }),
  changes: Type.Array(Type.Object({ path: Type.String(), content: Type.String(), purpose: Type.String() })),
  approvalPlanPath: Type.String(),
});

const candidateParameters = Type.Object({
  title: Type.String(),
  files: Type.Array(Type.Object({ path: Type.String(), content: Type.String(), purpose: Type.String() })),
  statements: Type.Array(Type.Object({
    label: Type.Union([
      Type.Literal("explicit"),
      Type.Literal("inferred"),
      Type.Literal("unresolved"),
      Type.Literal("contradicted"),
      Type.Literal("unsupported"),
    ]),
    group: Type.String(),
    text: Type.String(),
    source: Type.Optional(Type.String()),
  })),
  approvalPlanPath: Type.String(),
});

const evidenceProposalParameters = Type.Object({
  id: Type.String(),
  title: Type.String(),
  kind: Type.Union([Type.Literal("empirical result"), Type.Literal("literature"), Type.Literal("official documentation"), Type.Literal("observed behaviour")]),
  source: Type.String(),
  evidence: Type.String(),
  sourceClaim: Type.Optional(Type.String()),
  projectInterpretation: Type.Optional(Type.String()),
  limits: Type.String(),
  supports: Type.Optional(Type.Array(Type.String())),
  checked: Type.Optional(Type.String()),
});

const retrospectiveParameters = Type.Object({
  taskId: Type.Optional(Type.String()),
  objective: Type.String(),
  outcome: Type.Union([Type.Literal("complete"), Type.Literal("partial"), Type.Literal("failed")]),
  observations: Type.Array(Type.String()),
  verified: Type.Array(Type.String()),
  limitations: Type.Array(Type.String()),
  proposedChanges: Type.Array(Type.String()),
});

const dispatchParameters = Type.Object({
  objective: Type.String(),
  role: Type.String(),
  mode: Type.Union([Type.Literal("read-only"), Type.Literal("edit"), Type.Literal("full-host")]),
  expectedOutput: Type.String(),
  inputs: Type.Optional(Type.Array(Type.Object({ path: Type.String(), purpose: Type.String() }))),
  intendedWritePaths: Type.Optional(Type.Array(Type.String())),
  skills: Type.Optional(Type.Array(Type.String())),
  reviewLens: Type.Optional(Type.String()),
  modelProfile: Type.Optional(Type.String()),
  verification: Type.Optional(Type.Object({
    commands: Type.Array(Type.Object({
      executable: Type.String(),
      args: Type.Array(Type.String()),
      cwd: Type.Optional(Type.String()),
      expectedExitCode: Type.Optional(Type.Integer()),
    })),
  })),
  timeoutMs: Type.Optional(Type.Integer({ minimum: 1 })),
  maxTurns: Type.Optional(Type.Integer({ minimum: 1 })),
  remoteResearch: Type.Optional(Type.Boolean()),
});

export const SUPERVISOR_GUIDANCE = [
  "Pi Sych supervisor workflow:",
  "- At project activation and after durable changes, inspect canonical synchronization and tell the user which files changed, which dependents need review, and the next action.",
  "- Work directly when simple. Use pi_sych_dispatch proactively for bounded parallel, specialist, review, research, or implementation work.",
  "  Before dispatch, consult the user model catalog at PI_SYCH_MODEL_CATALOG or <Pi agent dir>/pi-sych/models.json and choose the first suitable model profile.",
  "- Workers do not receive this conversation. Give each worker the smallest complete packet:",
  "  exact inputs and purposes, all required skills, expected output, intended writes, review lens, and verification.",
  "  Use the least capable mode.",
  "- For consequential plans or durable reconciliations, write a concise Markdown plan and call submit_plan. Do not proceed without its explicit approval.",
  "- Verify actual outcomes; never treat model output, opening a review UI, or remote retrieval as approval or evidence.",
].join("\n");

export class ApprovalLedger {
  private readonly approvedPlans = new Map<string, string>();

  record(absolutePath: string, approved: boolean, content: string): void {
    if (!approved) {
      this.approvedPlans.delete(absolutePath);
      return;
    }
    this.approvedPlans.set(absolutePath, contentHash(content));
  }

  consume(absolutePath: string, content: string): boolean {
    if (this.approvedPlans.get(absolutePath) !== contentHash(content)) return false;
    this.approvedPlans.delete(absolutePath);
    return true;
  }
}

interface ProjectFileResolution {
  absolutePath: string;
  projectRelative: string;
}

function contentHash(content: string): string {
  return createHash("sha256").update(content).digest("hex");
}

function resolveProjectFile(cwd: string, inputPath: string): ProjectFileResolution | undefined {
  const absolutePath = resolve(cwd, inputPath);
  const projectRelative = relative(resolve(cwd), absolutePath);
  const escapesProject = projectRelative === "" || projectRelative === ".."
    || projectRelative.startsWith(`..${process.platform === "win32" ? "\\" : "/"}`)
    || isAbsolute(projectRelative);
  return escapesProject ? undefined : { absolutePath, projectRelative };
}

function sendAnnotationFeedback(
  pi: ExtensionAPI,
  session: { waitForDecision(): Promise<{ exit?: boolean; feedback?: string; approved?: boolean }> },
  ctx: ExtensionCommandContext,
  feedbackHeader: string,
): void {
  void session.waitForDecision().then((result) => {
    if (result.exit) {
      ctx.ui.notify("Annotation closed.", "info");
    } else if (result.feedback) {
      ctx.ui.notify("Annotation feedback received.", "info");
      void pi.sendUserMessage(`${feedbackHeader}\n\n${result.feedback}`, { deliverAs: "followUp" });
    } else if (result.approved) {
      ctx.ui.notify("Annotation approved.", "info");
    }
  }).catch((error: unknown) => {
    ctx.ui.notify(`Annotation failed: ${error instanceof Error ? error.message : String(error)}`, "error");
  });
}

export default function piSychWorkbench(pi: ExtensionAPI): void {
  const approvals = new ApprovalLedger();
  pi.on("before_agent_start", (event) => ({ systemPrompt: `${event.systemPrompt}\n\n${SUPERVISOR_GUIDANCE}` }));
  pi.registerTool({
    name: "submit_plan",
    label: "Submit Plan",
    description: "Submit an existing Markdown plan for explicit user review. Approval does not start implementation automatically.",
    parameters: Type.Object({ filePath: Type.String({ description: "Project-relative path to a Markdown plan." }) }),
    async execute(_toolCallId, params, signal, _onUpdate, ctx) {
      const inputPath = params.filePath.trim();
      const resolved = resolveProjectFile(ctx.cwd, inputPath);
      if (!resolved || ![".md", ".mdx"].includes(extname(resolved.absolutePath).toLowerCase())) {
        return {
          content: [{ type: "text", text: "Plan must be a non-empty Markdown file inside the project." }],
          details: { approved: false },
          isError: true,
        };
      }
      if (signal?.aborted) throw new Error("Plan review was cancelled.");
      const planContent = readFileSync(resolved.absolutePath, "utf8");
      if (!planContent.trim()) {
        return { content: [{ type: "text", text: "The plan file is empty." }], details: { approved: false }, isError: true };
      }
      const session = await startPlanReview(ctx, planContent);
      _onUpdate?.({
        content: [{
          type: "text",
          text: `Plan review opened: ${session.url}\nApprove or reject it in your browser; this tool will remain pending until then.`,
        }],
        details: { pending: true, url: session.url },
      });
      const result = await session.waitForDecision();
      approvals.record(resolved.absolutePath, result.approved, planContent);
      const message = result.approved
        ? result.feedback ? "Plan approved with notes." : "Plan approved."
        : "Plan requires revision.";
      const text = result.feedback ? `${message}\nFeedback: ${result.feedback}` : message;
      return {
        content: [{ type: "text", text }],
        details: { ...result, approved: result.approved, filePath: resolved.projectRelative },
      };
    },
  });
  pi.registerCommand("plannotator-annotate", {
    description: "Open a local text or Markdown file in Plannotator.",
    async handler(args, ctx) {
      const inputPath = args.trim();
      const resolved = resolveProjectFile(ctx.cwd, inputPath);
      if (!inputPath || !resolved) {
        ctx.ui.notify("Usage: /plannotator-annotate <project-local-file>", "error");
        return;
      }
      try {
        const content = readFileSync(resolved.absolutePath, "utf8");
        const session = await startFileAnnotation(ctx, resolved.absolutePath, content);
        ctx.ui.notify(`Plannotator annotation opened: ${session.url}`, "info");
        sendAnnotationFeedback(pi, session, ctx, `Feedback for ${resolved.projectRelative}:`);
      } catch (error) {
        ctx.ui.notify(`Unable to annotate ${inputPath}: ${error instanceof Error ? error.message : String(error)}`, "error");
      }
    },
  });
  pi.registerCommand("plannotator-last", {
    description: "Annotate the last assistant message in Plannotator.",
    async handler(_args, ctx) {
      try {
        const session = await startLastMessageAnnotation(ctx);
        if (!session) {
          ctx.ui.notify("No assistant message found in this session.", "error");
          return;
        }
        ctx.ui.notify(`Last-message annotation opened: ${session.url}`, "info");
        sendAnnotationFeedback(pi, session, ctx, "Feedback on the last assistant message:");
      } catch (error) {
        ctx.ui.notify(`Unable to annotate the last message: ${error instanceof Error ? error.message : String(error)}`, "error");
      }
    },
  });

  pi.registerTool({
    name: "pi_sych_project_status",
    label: "Inspect Pi Sych project status",
    description: "Inspect canonical files and synchronization fingerprints, including changed artifacts and downstream files that need review.",
    parameters: Type.Object({}),
    async execute(_toolCallId, _params, _signal, _onUpdate, ctx) {
      const state = await inspectProjectSync(ctx.cwd);
      return { content: [{ type: "text", text: formatSyncSummary(state) }], details: state };
    },
  });

  pi.registerTool({
    name: "pi_sych_dispatch",
    label: "Dispatch bounded Pi Sych worker",
    description: [
      "Launch one clean-context worker with an explicit objective, exact capability mode,",
      "complete bounded context, selected skills, and a user-ranked model profile;",
      "then return its immutable result or failure record.",
    ].join(" "),
    parameters: dispatchParameters,
    async execute(_toolCallId, params, signal, _onUpdate, ctx) {
      const outcome = await dispatchWorker({
        projectRoot: ctx.cwd,
        workerAgentDir: process.env.PI_SYCH_WORKER_AGENT_DIR ?? resolve(homedir(), ".cache/pi/pi-sych/worker-agent"),
        request: params,
        profiles: loadModelProfiles(),
        packageRoot: PACKAGE_ROOT,
        extraExtensionPaths: remoteResearchExtensionPaths(params.remoteResearch === true),
        signal,
      });
      const unexpected = outcome.unexpectedChanges.length
        ? `\nUnexpected changes: ${outcome.unexpectedChanges.join(", ")}`
        : "";
      const text = outcome.failure
        ? [
          `Worker ${outcome.identity.taskId} failed: ${outcome.failure.classification}.`,
          `${outcome.failure.lastEvent}${unexpected}`,
        ].join("\n")
        : [
          `Worker ${outcome.identity.taskId} submitted ${outcome.result?.status ?? "unknown"} result after ${outcome.attempts} attempt(s).`,
          `${outcome.result?.summary ?? "No result summary."}${unexpected}`,
        ].join("\n");
      return { content: [{ type: "text", text }], details: outcome };
    },
  });

  pi.registerTool({
    name: "pi_sych_apply_reconciliation",
    label: "Apply approved reconciliation",
    description: "Apply a drift resolution under an approved plan, including exact canonical/artifact content changes, then refresh SYNC.md fingerprints.",
    parameters: reconciliationParameters,
    async execute(_toolCallId, params, _signal, _onUpdate, ctx) {
      const planPath = resolveProjectFile(ctx.cwd, params.approvalPlanPath);
      const planContent = planPath ? readFileSync(planPath.absolutePath, "utf8") : "";
      if (!planPath || !approvals.consume(planPath.absolutePath, planContent)) {
        return {
          content: [{ type: "text", text: "No unused approved plan matches approvalPlanPath; no files were changed." }],
          details: { applied: false },
        };
      }
      const state = await inspectProjectSync(ctx.cwd);
      const candidate = await buildReconciliationCandidate(state, params.finding, params.selectedResolution);
      candidate.changes = params.changes;
      await applyApprovedReconciliation(state, candidate, true);
      return {
        content: [{
          type: "text",
          text: `Applied reconciliation for ${params.finding.id}; refreshed SYNC.md and ${params.changes.length} approved content change(s).`,
        }],
        details: { applied: true, changes: params.changes },
      };
    },
  });

  pi.registerTool({
    name: "pi_sych_apply_candidate",
    label: "Apply approved Pi Sych candidate",
    description: "Apply candidate contents atomically under a previously approved plan.",
    parameters: candidateParameters,
    async execute(_toolCallId, params, _signal, _onUpdate, ctx) {
      const { approvalPlanPath, ...candidateInput } = params;
      const planPath = resolveProjectFile(ctx.cwd, approvalPlanPath);
      const planContent = planPath ? readFileSync(planPath.absolutePath, "utf8") : "";
      if (!planPath || !approvals.consume(planPath.absolutePath, planContent)) {
        return {
          content: [{ type: "text", text: "No unused approved plan matches approvalPlanPath; no files were changed." }],
          details: { applied: false },
        };
      }
      const written = await applyCandidate(ctx.cwd, { ...candidateInput, requiresApproval: true } as CandidateReview, true);
      return { content: [{ type: "text", text: `Applied approved candidate files: ${written.join(", ")}` }], details: { applied: true, written } };
    },
  });

  pi.registerTool({
    name: "pi_sych_retrospective",
    label: "Propose Pi Sych retrospective",
    description: "Format a reviewable retrospective from explicit observations and actual verification records; never silently update canonical state.",
    parameters: retrospectiveParameters,
    async execute(_toolCallId, params) {
      const proposal = buildRetrospectiveProposal(params);
      return { content: [{ type: "text", text: proposal.content }], details: proposal };
    },
  });

  pi.registerTool({
    name: "pi_sych_propose_evidence",
    label: "Propose traceable evidence entry",
    description: "Format a reviewable evidence proposal that separates source claim, project interpretation, exact source, and limits.",
    parameters: evidenceProposalParameters,
    async execute(_toolCallId, params) {
      const proposal = buildEvidenceProposal(params);
      return { content: [{ type: "text", text: formatEvidenceProposal(proposal) }], details: proposal };
    },
  });

  pi.registerTool({
    name: "pi_sych_challenge_evidence",
    label: "Challenge evidence entries",
    description: "Check EVIDENCE.md entries for required fields and unavailable declared sources without changing the file.",
    parameters: Type.Object({}),
    async execute(_toolCallId, _params, _signal, _onUpdate, ctx) {
      const challenges = await challengeEvidenceEntries(ctx.cwd, await readEvidence(ctx.cwd));
      return { content: [{ type: "text", text: formatEvidenceChallenges(challenges) }], details: { challenges } };
    },
  });

  pi.registerTool({
    name: "pi_sych_verify",
    label: "Run Pi Sych verification contract",
    description: "Run one explicit executable-and-arguments verification contract and return actual exit code, bounded output, timestamps, and observed file changes.",
    parameters: verificationParameters,
    async execute(_toolCallId, params, _signal, _onUpdate, ctx) {
      const report = await runVerification(params, ctx.cwd);
      const text = [
        `${report.passed ? "Passed" : "Failed"}: ${report.executable} ${report.args.join(" ")}`,
        `Exit code: ${report.exitCode ?? "not started"}; expected: ${report.expectedExitCode}`,
        report.stderrTail || report.stdoutTail || "No output.",
      ].join("\n");
      return { content: [{ type: "text", text }], details: report };
    },
  });

  pi.registerCommand("pi-sych-retro", {
    description: "Create a review-gated retrospective proposal from explicit JSON input",
    handler: async (args, ctx) => {
      if (!args.trim()) {
        ctx.ui.notify(
          "Usage: /pi-sych-retro {\"objective\":\"...\",\"outcome\":\"complete|partial|failed\",\"observations\":[],\"verified\":[],\"limitations\":[],\"proposedChanges\":[]}",
          "info",
        );
        return;
      }
      try {
        ctx.ui.notify(buildRetrospectiveProposal(JSON.parse(args)).content, "info");
      } catch (error) {
        ctx.ui.notify(error instanceof Error ? error.message : String(error), "error");
      }
    },
  });

  pi.registerCommand("pi-sych-status", {
    description: "Show the loaded Pi Sych package version and project synchronization status",
    handler: async (_args, ctx) => {
      try {
        const packageStatus = formatPackageStatus(getPackageStatus());
        const projectStatus = formatSyncSummary(await inspectProjectSync(ctx.cwd));
        ctx.ui.notify(`${packageStatus}\n\n${projectStatus}`, "info");
      } catch (error) {
        ctx.ui.notify(error instanceof Error ? error.message : String(error), "error");
      }
    },
  });

  pi.registerCommand("pi-sych-mcp", {
    description: "Show Pi Sych MCPorter dependency and explicit-configuration diagnostics",
    handler: async (_args, ctx) => {
      try {
        ctx.ui.notify(formatMcporterDiagnostic(inspectMcporter()), "info");
      } catch (error) {
        ctx.ui.notify(error instanceof Error ? error.message : String(error), "error");
      }
    },
  });

  pi.registerCommand("pi-sych-init", {
    description: "Start a focused, review-gated canonical project-state candidate",
    handler: async (args, ctx) => {
      try {
        const artifactPath = args.trim();
        if (artifactPath) {
          ctx.ui.notify(formatCandidateReview(await artifactCandidateFromFile(ctx.cwd, artifactPath)), "info");
          return;
        }
        const candidate = buildGreenfieldCandidate();
        const question = nextGreenfieldQuestion({});
        ctx.ui.notify(`${question}\n\n${formatCandidateReview(candidate)}`, "info");
      } catch (error) {
        ctx.ui.notify(error instanceof Error ? error.message : String(error), "error");
      }
    },
  });

  pi.registerCommand("pi-sych-drift", {
    description: "Report deterministic drift findings without reconciling files",
    handler: async (_args, ctx) => {
      try {
        const status = await inspectProjectSync(ctx.cwd);
        const findings = await reviewProjectDrift(status);
        ctx.ui.notify(
          `${formatDriftFindings(findings)}\n\nNo file was changed; choose a resolution and review it before applying durable updates.`,
          "info",
        );
      } catch (error) {
        ctx.ui.notify(error instanceof Error ? error.message : String(error), "error");
      }
    },
  });

  pi.registerCommand("pi-sych-sync", {
    description: "Propose, but do not write, a synchronization manifest",
    handler: async (_args, ctx) => {
      try {
        ctx.ui.notify(formatCandidateReview(await buildSyncCandidate(ctx.cwd)), "info");
      } catch (error) {
        ctx.ui.notify(error instanceof Error ? error.message : String(error), "error");
      }
    },
  });
}
