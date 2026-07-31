You are right. The implementation plan should contain only the intended architecture and work items.

## Pi’s root

Pi does **not** expose a Git-normalized project root. Extensions receive `ctx.cwd`, which is the current working directory. Pi internally uses the Git root as a boundary for some resource discovery, but that root is not exposed through `ExtensionContext`. ([Pi Coding Agent][1])

The clean resolution algorithm is:

1. Start with `ctx.cwd`.
2. Run `git rev-parse --show-toplevel` there.
3. Use the returned Git root, or `ctx.cwd` when Git is unavailable.
4. Search from `ctx.cwd` upward to that workspace root for the nearest `SYNC.json`.
5. When `SYNC.json` specifies `projectRoot`, resolve it relative to the directory containing `SYNC.json`.
6. Otherwise, use the directory containing `SYNC.json`; when there is no manifest, use the Git root or `ctx.cwd`.

Searching for the nearest manifest handles monorepos without substantially complicating the implementation:

```text
repository/
├── SYNC.json
├── package-a/
└── package-b/
    ├── SYNC.json
    └── src/
```

Launching Pi in `package-b/src` selects `package-b/SYNC.json`. Launching it elsewhere selects the repository manifest.

## `SYNC.json`, not Markdown or YAML

`SYNC.md` currently contains exactly one fenced JSON object, and the parser requires exactly that structure. The Markdown wrapper provides no meaningful prose layer and already caused a formatter-specific release repair.

`SYNC.json` is the better format because:

* Node parses and writes it natively.
* `JSON.stringify()` gives deterministic output.
* Automatic acknowledgement updates preserve a predictable structure.
* It removes the fenced-block extraction and formatting workaround.
* YAML would add a parser dependency and introduce scalar and formatting behavior that is unnecessary for machine-maintained state.

I would make `SYNC.json` the one fixed bootstrap filename. Every other canonical file can have a configurable path.

A suitable schema is:

```json
{
  "version": 2,
  "projectRoot": ".",
  "canonical": {
    "project": "PROJECT.md",
    "agents": "AGENTS.md",
    "style": "config/STYLE.md",
    "evidence": "research/EVIDENCE.md",
    "decisions": "notes/DECISIONS.md",
    "todo": "planning/TODO.md",
    "inbox": ".pi-sych/INBOX.md"
  },
  "confirmedAt": "2026-07-31T10:00:00.000Z",
  "artifacts": []
}
```

Omitted canonical entries receive their conventional defaults. Relative paths resolve against `projectRoot`; absolute paths remain absolute.

## Estimated code reduction

The repository currently records approximately **2,300 production TypeScript lines**.

My expected reduction is:

| Change                                                    | Net production TypeScript |
| --------------------------------------------------------- | ------------------------: |
| Replace fenced-JSON Markdown parsing and formatting       |                −30 to −40 |
| Replace current root and fixed-file discovery             |                −35 to −55 |
| Remove realpath/symlink containment machinery             |                −10 to −15 |
| Share one resolved manifest across status and compaction  |                −30 to −50 |
| Add Git-root resolution, manifest discovery and schema v2 |                +40 to +60 |
| **Root/config refactor**                                  |           **−65 to −100** |

The worker completion and diagnostic fixes will probably add 20–40 lines. The complete implementation should therefore finish around **2,200–2,250 production TypeScript lines**, a net reduction of roughly **50–100 lines**.

The skill restoration adds Markdown rather than production TypeScript, so it does not consume that source budget.

Here is the revised agent plan.

# Pi-sych refactor

## 1. Replace `SYNC.md` with `SYNC.json`

Introduce manifest version 2:

```ts
interface SyncManifest {
  version: 2;
  projectRoot?: string;
  canonical?: Partial<Record<CanonicalFile, string>>;
  confirmedAt: string;
  artifacts: ProjectArtifact[];
}

type CanonicalFile =
  | "project"
  | "agents"
  | "style"
  | "evidence"
  | "decisions"
  | "todo"
  | "inbox";
```

Use these defaults:

```ts
const DEFAULT_CANONICAL_PATHS = {
  project: "PROJECT.md",
  agents: "AGENTS.md",
  style: "STYLE.md",
  evidence: "EVIDENCE.md",
  decisions: "DECISIONS.md",
  todo: "TODO.md",
  inbox: "INBOX.md",
} satisfies Record<CanonicalFile, string>;
```

Parse `SYNC.json` directly with `JSON.parse()`.

Write it directly with:

```ts
`${JSON.stringify(manifest, null, 2)}\n`
```

Convert the repository manifest and template to `SYNC.json`.

Update the package files, documentation, architecture documentation, changelog, examples, tests and formatting configuration.

Remove the fenced-JSON parser and Markdown manifest formatter.

## 2. Implement workspace and project-root resolution

Create a single resolver that accepts Pi’s `ctx.cwd`.

Resolve the Git root by running:

```sh
git rev-parse --show-toplevel
```

Use `ctx.cwd` when the Git command does not return a root.

Search from `ctx.cwd` upward to the resolved workspace root for the nearest `SYNC.json`.

Resolve the project root as follows:

```ts
const projectRoot = manifest.projectRoot
  ? resolve(dirname(syncPath), manifest.projectRoot)
  : dirname(syncPath);
```

Use the workspace root when no manifest exists.

Return one resolved project object:

```ts
interface ResolvedProject {
  cwd: string;
  workspaceRoot: string;
  projectRoot: string;
  syncPath: string;
  manifest?: SyncManifest;
  canonical: Record<CanonicalFile, string>;
}
```

Resolve relative canonical paths against `projectRoot`.

Preserve absolute canonical paths unchanged.

Use this resolver everywhere that currently performs independent project discovery.

## 3. Use configured canonical paths throughout the package

Replace fixed canonical filenames with the resolved `canonical` mapping.

Update:

* project validation;
* project-status checks;
* status acknowledgement;
* compaction input collection;
* inbox counting and writing;
* supervisor context loading;
* human commands;
* project bootstrap templates.

Report configured paths in diagnostics and status output.

Treat all manifest artifacts and all configured canonical paths as known project paths.

## 4. Simplify project file handling

Keep lexical resolution for ordinary relative artifact paths.

Allow filesystem symlinks to resolve normally.

Replace the existing realpath-containment resolver with an existence-checking resolver.

Consolidate manifest loading, canonical-path resolution and project discovery in one module.

Pass the resulting `ResolvedProject` object into project status and compaction instead of rediscovering project state.

## 5. Correct worker tool modes

Set worker tools to:

```ts
const MODE_TOOLS = {
  "read-only": [
    "read",
    "grep",
    "find",
    "ls",
    "submit_artifact",
  ],a

  edit: [
    "read",
    "grep",
    "find",
    "ls",
    "edit",
    "write",
    "submit_artifact",
  ],

  "full-host": [
    "read",
    "edit",
    "write",
    "bash",
    "submit_artifact",
  ],
};
```

Add exact tool-surface tests for each mode.

## 6. Make `submit_artifact` terminal

Return `terminate: true` from the worker’s `submit_artifact` tool.

Tell the worker to call `submit_artifact` by itself as its final tool call.

Wait for the worker process to exit.

Accept a submitted result only when:

```text
result validates
and process exits with code 0
and dispatch was not cancelled
and dispatch did not time out
and process received no terminating signal
```

Return a dispatch failure for timeout, cancellation, spawn failure, signal termination or nonzero exit.

Update the worker-engine tests to cover:

* terminal submission;
* clean successful exit;
* timeout after submission;
* cancellation after submission;
* nonzero exit after submission;
* missing result;
* invalid result.

## 7. Feed project status into compaction

Build a bounded status projection containing:

```ts
interface CompactionProjectStatus {
  changed: string[];
  missing: string[];
  impacted: ImpactedArtifact[];
  cycles: string[][];
  projectErrors: string[];
  syncError?: string;
}
```

Include this projection in the compaction request.

Ask the compaction model to retain:

* the active objective;
* unfinished work;
* decisions not yet represented in canonical files;
* changed artifacts relevant to the task;
* impacted dependent artifacts;
* the immediate next action.

Store every configured canonical path and manifest artifact path in the allowed `relevantFiles` set.

Load file contents only for textual canonical files selected for semantic comparison.

Preserve relevant binary, large, generated and source artifact paths without loading their contents.

## 8. Isolate inbox errors

Return inbox inspection as:

```ts
interface InboxInspection {
  count?: number;
  error?: string;
}
```

Include normal project status when inbox parsing fails.

Display the inbox error as an additional status item.

Continue generating working memory when inbox parsing fails.

Persist promotion proposals when the inbox is valid.

Include inbox persistence status in compaction details.

## 9. Report custom-compaction failures

Classify custom-compaction failures.

Show a concise notification for manual compaction failures.

Write automatic-compaction failures to Pi’s diagnostic output.

Return control to Pi’s standard compactor after a custom-compaction failure.

Include the failure classification and concise message in compaction details.

## 10. Restore substantive skill guidance

Keep the six indexed skills:

```text
project
write
analyze
code
review
research
```

Read the final pre-consolidation versions of all removed skills.

Create a migration ledger mapping each removed skill to one current module.

Move every unique checklist, invariant, warning and domain-specific procedure into the appropriate one-level module.

Restore detailed empirical guidance covering:

* randomization and counterbalancing;
* exclusions and stopping rules;
* preregistered and exploratory decisions;
* sample-size justification;
* interactions and simple effects;
* effect sizes and uncertainty;
* non-significant results;
* alternative causal accounts;
* consistency across prose, tables and figures.

Restore equivalent depth for theoretical writing, grants, evidence synthesis, statistical analysis, software work, verification, review, European Portuguese, presentations, books and tutorials.

Keep examples in `examples.md` and invariant guidance in `guidance.md`.

Add tests confirming:

* exactly six skills are indexed;
* modules remain unindexed;
* every removed skill has a migration destination;
* selected critical invariants remain present;
* override precedence remains intact.

## 11. Update tests

Add unit tests for:

* Git repository root resolution;
* non-Git working-directory resolution;
* nearest nested `SYNC.json`;
* `projectRoot` resolution;
* default canonical paths;
* custom relative canonical paths;
* custom absolute canonical paths;
* direct JSON parsing and deterministic writing;
* configured canonical project validation;
* configured inbox location;
* configured main artifact location;
* relevant tracked source files surviving compaction;
* project-status findings entering compaction;
* malformed inbox status isolation;
* compaction failure diagnostics.

Update integration and smoke fixtures to use `SYNC.json`.

## 12. Verify the implementation

Run:

```sh
npm run typecheck
npm run style
npm run source:budget
npm run test:deps
npm test
npm run test:usage
npm run smoke
npm pack --dry-run
git diff --check
```

Run a real Pi worker dispatch confirming that `submit_artifact` terminates the worker and produces a clean successful exit.

Run a real Pi compaction confirming that custom canonical paths, tracked artifacts and project-status findings survive into working memory.

Keep the final estimated production TypeScript size at approximately 2,200–2,250 lines.

::

[1]: https://pi.dev/docs/latest/quickstart?utm_source=chatgpt.com "Quickstart · Documentation · Pi"



## 11. Rewrite and audit all model-facing prompts

Treat prompts as production interfaces.

Audit:

* supervisor guidance;
* worker system guidance;
* worker task envelopes;
* compaction instructions;
* promotion instructions;
* all six indexed skills;
* all skill modules;
* reviewer and verifier instructions;
* Plannotator-facing agent guidance;
* error-recovery and fallback prompts.

### Prompt standard

Write prompts that are:

* token-conservative;
* dense;
* explicit;
* imperative where compliance matters;
* scoped to the task;
* ordered by priority;
* clear about authority, output and stopping conditions.

Every instruction should do at least one of the following:

* change likely model behaviour;
* establish precedence;
* define a decision rule;
* prevent a known failure mode;
* constrain the output contract;
* identify when human judgment is required;
* define what to do when information is missing.

Delete instructions that merely restate capabilities the model already has.

Delete motivational, explanatory and ceremonial prose.

Do not tell the model to be intelligent, careful, helpful, rigorous or professional without specifying the behaviour that demonstrates it.

Do not repeat the same rule in several phrasings.

Use examples only when they disambiguate a rule that models regularly misapply.

### Instruction form

Prefer direct rules:

```text
State the finding and its support.
Separate observation from inference.
Report missing evidence rather than filling the gap.
```

Avoid diffuse guidance:

```text
Try to be thoughtful and rigorous when considering the available evidence.
```

Place critical prohibitions immediately before the operation they constrain.

State precedence explicitly when instructions may conflict:

```text
Project-specific instructions override packaged examples.
Accepted project decisions override generic best practices.
Evidence limits override pressure to produce a strong conclusion.
```

### Correct model training biases

Use forceful instructions where common model defaults are predictably harmful.

#### Avoid sycophancy

Require the agent to:

* evaluate claims independently;
* identify weak reasoning even when it supports the user’s preferred direction;
* distinguish agreement from evidence;
* state material objections plainly;
* avoid manufacturing praise, reassurance or consensus;
* preserve the user’s authority without treating the user as automatically correct.

Use language such as:

```text
Do not optimize for agreement. Optimize for a correct and useful assessment.
Challenge consequential assumptions when the evidence warrants it.
Do not soften a material defect into a stylistic preference.
```

#### Avoid overengineering

Require the agent to:

* solve the stated problem;
* prefer deletion, reuse and ordinary language features;
* justify every new abstraction, dependency, configuration layer and workflow;
* avoid speculative extensibility;
* avoid implementing hypothetical requirements;
* preserve simple local solutions when they are sufficient.

Use language such as:

```text
Implement the smallest complete solution.
Do not add an abstraction unless it removes more complexity than it introduces.
Do not solve future problems that are not part of the task.
Prefer deleting machinery to extending it.
```

#### Avoid generic LLM prose

In writing and revision prompts, prohibit recurrent model mannerisms:

* unnecessary summaries of what was just said;
* padded introductions and conclusions;
* repetitive signposting;
* symmetrical three-part lists used without analytical reason;
* excessive headings;
* excessive em dashes;
* repeated “not only … but also” constructions;
* inflated transitions;
* generic claims of importance;
* vague intensifiers;
* fabricated quotations;
* false precision;
* blandly balanced conclusions when the evidence is asymmetric;
* phrases that announce nuance instead of providing it;
* restating the prompt before answering it.

Require concrete nouns, specific verbs and claim-level evidence.

#### Do not impose simplistic active-voice dogma

Do not instruct agents to replace passive voice mechanically.

For prose revision, require the agent to choose grammatical voice according to information structure, agency and emphasis.

Use language such as:

```text
Prefer clear agents and actions, but do not replace passive constructions mechanically.
Retain the passive when the actor is unknown, irrelevant, already established, deliberately backgrounded, or less important than the affected object or procedure.
Judge sentences in context rather than applying an active-voice quota.
```

Apply the same principle to other shallow style heuristics. Do not enforce sentence length, paragraph length, vocabulary simplicity or variation mechanically.

#### Avoid premature certainty

Require the agent to label:

* observation;
* inference;
* assumption;
* accepted decision;
* unresolved question;
* tentative proposal.

Do not let polished prose convert uncertainty into confidence.

#### Avoid process theatre

Require the agent to report only work actually performed.

Do not claim that something was:

* verified when it was only inspected;
* tested when tests were not run;
* comprehensive when coverage was partial;
* approved when no human approval occurred;
* implemented when only a plan or suggestion was produced.

#### Avoid unnecessary deference to generic best practices

Generic best practices are defaults, not authority.

Require the agent to follow the project’s accepted constraints, trade-offs and operating model when they differ from conventional production guidance.

Do not reintroduce security, scaling, compatibility or process requirements that the project has deliberately excluded.

### Prompt architecture

Keep each prompt layered:

```text
1. Role and authority
2. Exact objective
3. Required context
4. Decision rules
5. Known failure modes
6. Output contract
7. Stop or escalation conditions
```

Omit empty layers.

Do not duplicate Pi’s base prompt, built-in tool descriptions or general language-model knowledge.

Skills should contain domain judgment and procedural safeguards.

The supervisor prompt should contain only cross-cutting orchestration rules.

Worker prompts should contain only the bounded task, supplied context, selected skills and result contract.

The compaction prompt should contain only working-memory extraction, durable-memory routing and promotion thresholds.

### Compaction-specific wording

Rewrite the compaction prompt under this standard.

Make these instructions explicit:

```text
Preserve only context needed to continue the active work.

Do not summarize the entire conversation.

Promotions should normally be empty.

Propose durable storage only for settled information whose loss would cause repeated work, inconsistency or a wrong future decision.

Route accepted decisions to decisions.
Route verified findings, results and research to evidence.
Route objectives, scope, constraints, audience, venue and accepted direction to project.
Route stable shared tools and workflows to agents.
Route stable style conventions to style.
Route concrete unfinished actions to todo.

Do not promote tentative ideas, conversational history, temporary blockers, incidental tool output, one-off requests or inferred personal preferences.

For an agents proposal, recommend project, personal or ask-user scope. Do not choose personal scope automatically.
```

### Skill-specific prompt audits

For every skill and module:

1. Identify the model failure modes relevant to that task.
2. Retain substantive domain safeguards.
3. Remove generic advice the model already knows.
4. Replace vague quality language with observable behaviour.
5. Separate invariants from examples.
6. State when the agent must ask, stop, qualify or defer.
7. Keep instructions compatible with project and user overrides.
8. Check for contradictions with other skills.
9. Check that the prompt does not encourage unnecessary workflow expansion.
10. Check that the output contract matches the actual caller.

### Prompt review tests

Add a prompt-quality review checklist covering:

* redundant instructions;
* duplicated built-in tool guidance;
* vague quality adjectives;
* missing precedence;
* missing output contract;
* unsupported claims of authority;
* sycophantic framing;
* overengineering pressure;
* simplistic style rules;
* generic LLM prose patterns;
* excessive token cost;
* contradictions between supervisor, worker and skill prompts.

Use behavioural fixtures for critical prompts.

Provide representative inputs that tempt the model to:

* agree with a flawed user assumption;
* overengineer a small change;
* promote transient information;
* rewrite valid passive voice mechanically;
* produce padded LLM prose;
* claim verification without executing checks;
* treat generic best practice as overriding project intent.

Evaluate whether the prompt directs the expected behaviour.

Do not use exact prompt snapshots as the primary quality test. Test the decision rules and output properties that the prompts are intended to produce.


### Route durable-memory proposals by canonical role

Change promotion proposals to identify a canonical role rather than supplying a filename:

```ts
type PromotionTarget =
  | "project"
  | "agents"
  | "style"
  | "evidence"
  | "decisions"
  | "todo";

interface PromotionProposal {
  operation: "add" | "update";
  target: PromotionTarget;
  proposedText: string;
  existingText?: string;
  rationale: string;
  recommendedScope?: "project" | "personal" | "ask-user";
}
```

Resolve the actual destination using:

```ts
resolvedProject.canonical[proposal.target]
```

Guide the compaction model to route information as follows:

* `decisions`: accepted consequential choices, their rationale and relevant rejected alternatives;
* `evidence`: verified findings, research, measurements, results, sources and limitations;
* `project`: objectives, scope, constraints, audience, venue, deliverables, definition of done and accepted direction;
* `agents`: stable project conventions, available tools, commands and shared workflows;
* `style`: stable prose, coding, presentation and formatting conventions;
* `todo`: concrete unfinished actions.

Require the model to distinguish tentative discussion from accepted decisions and unverified claims from evidence.

Tell the model that promotions should normally be empty. Create a proposal only when the information is durable, settled, not already represented and likely to prevent future inconsistency or repeated work.

Do not promote transient context, temporary blockers, incidental tool output, model-specific behaviour, one-off requests, speculative ideas or personal details without a durable operational purpose.

For every `agents` proposal, include a scope recommendation but do not select or modify a personal configuration automatically.

When reviewing an `agents` proposal, ask the user whether it belongs in:

* the project’s configured `AGENTS.md`; or
* the personal `~/.pi/agent/AGENTS.md`.

Explain that project instructions should be shared conventions, while personal configuration is for stable cross-project preferences or tooling that should not necessarily apply to collaborators.

Warn during review that accumulating transient personalization, conversational memories and obsolete instructions in agent files can cause memory rot through stale, conflicting and overly specific context.

Add tests covering:

* routing each information category to its canonical role;
* resolution through custom canonical paths;
* tentative decisions producing no proposal;
* unsupported findings producing no evidence proposal;
* transient preferences producing no agents proposal;
* agents proposals requiring an explicit scope decision;
* empty promotions for conversations containing no durable new information.
