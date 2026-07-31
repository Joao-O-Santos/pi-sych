# Implementation Plan: Working-Memory Compaction and `INBOX.md` Promotion

## 1. Objective

Add a compact Pi Sych compaction layer that produces two separate outputs from one model call:

1. **Working memory** — a concise task-centered summary used by Pi to continue the current session.
2. **Memory-promotion candidates** — semantic additions or updates stored in the project-root `INBOX.md` for later human review.

Use Pi’s standard compaction boundary so the resulting context contains:

```text
working-memory summary
+ Pi's retained recent conversation tail
```

Use canonical project files as accepted long-term memory. Treat `INBOX.md` as a proposal queue whose contents become canonical only through a later human-reviewed edit.

Target approximately **200–290 lines of new production TypeScript** across the feature.

---

## 2. Existing infrastructure to reuse

### 2.1 Pi compaction lifecycle

Register a `session_before_compact` handler through the existing Pi extension API.

Use these event fields directly:

* `event.preparation.messagesToSummarize`
* `event.preparation.turnPrefixMessages`
* `event.preparation.previousSummary`
* `event.preparation.firstKeptEntryId`
* `event.preparation.tokensBefore`
* `event.branchEntries`
* `event.customInstructions`
* `event.reason`
* `event.willRetry`
* `event.signal`

Return the custom result through:

```ts
return {
  compaction: {
    summary,
    firstKeptEntryId: event.preparation.firstKeptEntryId,
    tokensBefore: event.preparation.tokensBefore,
    usage: response.usage,
    details,
  },
};
```

Pi will save the compaction entry, rebuild the context, and retain the prepared recent tail. The hook supports custom JSON-serializable `details`, provider usage accounting, abort signals, manual compaction, threshold compaction, and overflow recovery.

### 2.2 Pi conversation conversion

Import and use:

```ts
import {
  buildSessionContext,
  convertToLlm,
  serializeConversation,
} from "@earendil-works/pi-coding-agent";
```

Use `serializeConversation(convertToLlm(messages))` for both:

* the conversation span Pi selected for compaction;
* a small preview of the retained recent context.

Pi’s serializer already formats user, assistant, thinking, tool-call, and tool-result messages and bounds large tool results.

### 2.3 Pi model and authentication flow

Follow Pi’s official custom-compaction example:

```ts
import { uuidv7 } from "@earendil-works/pi-ai";
import { complete } from "@earendil-works/pi-ai/compat";
```

Use:

```ts
const model = ctx.model;
const auth = await ctx.modelRegistry.getApiKeyAndHeaders(model);
```

Invoke the model with:

```ts
const response = await complete(
  model,
  { messages },
  {
    apiKey: auth.apiKey,
    headers: auth.headers,
    env: auth.env,
    maxTokens: Math.min(4096, model.maxTokens),
    signal: event.signal,
    cacheRetention: "none",
    sessionId: uuidv7(),
  },
);
```

Return `undefined` from the handler when the custom path is unavailable so Pi proceeds with its standard compactor. This is the same extension pattern used by Pi’s official custom-compaction implementation.

### 2.4 Pi-loaded context files

Extend the current `before_agent_start` handler in `extensions/workbench/index.ts`.

It currently appends `SUPERVISOR_GUIDANCE` to the system prompt.

Capture Pi’s already-loaded context files in the extension closure:

```ts
let loadedContextFiles: Array<{ path: string; content: string }> = [];

pi.on("before_agent_start", (event) => {
  loadedContextFiles = event.systemPromptOptions.contextFiles ?? [];

  return {
    systemPrompt: `${event.systemPrompt}\n\n${SUPERVISOR_GUIDANCE}`,
  };
});
```

`event.systemPromptOptions.contextFiles` reflects the `AGENTS.md` and `CLAUDE.md` files Pi actually loaded. Pi’s resource loader already performs global, ancestor, repository, and worktree-aware discovery.

Use `loadProjectContextFiles()` only in isolated tests that need to construct Pi context-file inputs directly.

### 2.5 Pi Sych project discovery

Reuse these exports from `project-files.ts`:

```ts
CORE_PROJECT_FILES
OPTIONAL_PROJECT_FILES
discoverProjectFiles()
resolveProjectPath()
```

The current implementation already:

* locates a project root using `SYNC.md` or `PROJECT.md`;
* reports whether known files exist;
* distinguishes core and optional files;
* validates project-relative paths.

Add `INBOX.md` to `OPTIONAL_PROJECT_FILES`.

### 2.6 Pi Sych mechanical status

Reuse:

```ts
checkProjectStatus()
formatProjectStatusCheck()
fingerprintFile()
```

`checkProjectStatus()` already provides:

* project root;
* missing core files;
* `PROJECT.md` validation results;
* parsed `SYNC.md`;
* tracked artifact metadata;
* changed and missing paths;
* declared direct and transitive impacts;
* dependency cycles.

Use `fingerprintFile()` to detect canonical-file changes during the model request.

### 2.7 Pi Sych atomic file writing

`writeApprovedFile()` already contains the required atomic-write sequence:

1. create a same-directory temporary file;
2. write and sync its contents;
3. close the handle;
4. rename it into place;
5. clean up the temporary path after failure.

Refactor that implementation into:

```ts
export async function writeAtomicFile(
  path: string,
  content: string,
): Promise<void>;
```

Then make `writeApprovedFile()` perform its approval check and delegate to `writeAtomicFile()`.

Use `writeAtomicFile()` for `INBOX.md`.

### 2.8 Existing status and review surfaces

Reuse the current:

* `project_status` agent tool;
* `/pi-sych-status` human command;
* `/plannotator-annotate` human command.

The status tool and command already share `checkProjectStatus()` and `formatProjectStatusCheck()`.

The existing Plannotator command safely opens a project-local file:

```text
/plannotator-annotate INBOX.md
```

It already uses project-root path validation and file reading.

Add pending-promotion reporting to these existing surfaces rather than introducing another agent tool or review command.

---

## 3. Files to change

### Add

```text
extensions/workbench/src/compaction.ts
tests/unit/compaction.test.mjs
tests/integration/compaction.test.mjs
```

### Modify

```text
extensions/workbench/index.ts
extensions/workbench/src/project-files.ts
extensions/workbench/src/project-status.ts
ARCHITECTURE.md
README.md
CHANGELOG.md
```

Keep prompt text in a dedicated constant inside `compaction.ts`, or move it to a non-TypeScript text asset if that better matches the repository’s source-budget accounting.

---

## 4. Runtime data structures

Define the following types in `compaction.ts`.

```ts
export interface WorkingMemory {
  currentTask: string;
  purpose?: string;
  completed: string[];
  successfulApproaches: string[];
  failedApproaches: string[];
  inProgress: string[];
  blockers: string[];
  criticalContext: string[];
  nextAction: string;
  relevantFiles: string[];
}

export interface AddPromotion {
  operation: "add";
  targetFile: string;
  proposedText: string;
  rationale: string;
}

export interface UpdatePromotion {
  operation: "update";
  targetFile: string;
  existingText: string;
  proposedText: string;
  rationale: string;
}

export type PromotionProposal = AddPromotion | UpdatePromotion;

export interface CompactionModelOutput {
  workingMemory: WorkingMemory;
  promotions: PromotionProposal[];
}
```

Persist inbox candidates with generated metadata:

```ts
export interface PromotionCandidate extends PromotionProposal {
  id: string;
  createdAt: string;
}

export interface PromotionInbox {
  version: 1;
  candidates: PromotionCandidate[];
}
```

Use a stable candidate ID derived from:

```text
operation
+ normalized targetFile
+ normalized proposedText
```

Generate it with SHA-256 and retain a short readable prefix:

```text
P-a84d092f38ce
```

This gives deterministic deduplication across sessions and repeated compactions.

---

## 5. `INBOX.md` format

Use Markdown containing one fenced JSON object, following the existing `SYNC.md` pattern.

````markdown
# Memory promotion inbox

> Unreviewed proposals for possible updates to persistent project files.
> Review with `/plannotator-annotate INBOX.md`.

```json
{
  "version": 1,
  "candidates": [
    {
      "id": "P-a84d092f38ce",
      "createdAt": "2026-07-31T00:45:00.000Z",
      "operation": "update",
      "targetFile": "DECISIONS.md",
      "existingText": "Compaction candidates are stored in INBOX.md.",
      "proposedText": "Compaction candidates are stored in INBOX.md and remain proposals until human review promotes them into canonical files.",
      "rationale": "The accepted decision does not yet record the human-promotion boundary."
    }
  ]
}
````

````

Implement:

```ts
parsePromotionInbox(markdown: string): PromotionInbox
formatPromotionInbox(inbox: PromotionInbox): string
readPromotionInbox(projectRoot: string): Promise<PromotionInbox>
countPromotionCandidates(projectRoot: string): Promise<number>
````

Return an empty version-1 inbox when the file is absent.

Create `INBOX.md` only when at least one validated candidate is ready to append.

Create it at:

```ts
resolveProjectPath(projectRoot, "INBOX.md")
```

This places it in the visible project root and allows Git to present it as an untracked file until the user chooses a repository policy.

---

## 6. Canonical-memory collection

Implement:

```ts
interface CanonicalFile {
  path: string;
  content: string;
  fingerprint: string;
  exists: true;
}

interface CanonicalSnapshot {
  projectRoot: string;
  files: CanonicalFile[];
  allowedTargets: string[];
  absentStandardTargets: string[];
}
```

Build the snapshot as follows.

### 6.1 Standard promotion targets

Start with:

```ts
const STANDARD_MEMORY_FILES = [
  "PROJECT.md",
  "AGENTS.md",
  "STYLE.md",
  "EVIDENCE.md",
  "DECISIONS.md",
  "TODO.md",
] as const;
```

Include existing files in `files`.

Include all six names in `allowedTargets`, including currently absent files. This allows an `add` proposal to recommend creating an absent standard file.

### 6.2 Declared authoritative files

Read `state.manifest?.artifacts`.

Add an artifact to the canonical set when all of these conditions hold:

* its path ends in `.md` or `.mdx`;
* it currently exists;
* it declares `role` or a non-empty `authoritativeFor`;
* its path resolves through `resolveProjectPath()`.

This allows projects to declare files such as:

```text
PLAN.md
ARCHITECTURE.md
IMPLEMENTATION_PLAN.md
METHODS.md
```

as accepted project memory through their existing `SYNC.md` metadata.

Add those paths to `allowedTargets`.

### 6.3 Pi context files

Use the captured `loadedContextFiles` as additional accepted context for the model.

For context files located inside the resolved project root:

* include their contents in the prompt;
* include their project-relative paths among allowed targets when they correspond to a standard or declared authoritative file.

For global or ancestor context files:

* include them under a separate “loaded conventions” section;
* retain their paths as context metadata.

### 6.4 Mechanical project state

Pass a compact structured subset of `ProjectStatusCheck`:

```ts
{
  missingCore: state.missingCore,
  projectErrors: state.projectErrors,
  syncError: state.syncError,
  changed: state.changed,
  missing: state.missing,
  impacted: state.impacted,
}
```

This provides mechanical context while preserving the distinction between changed content and semantic drift.

### 6.5 Size budget

Use a bounded input policy:

* up to 32 KiB per canonical file;
* up to 192 KiB across canonical files;
* standard files before declared artifacts;
* append a visible truncation marker to bounded content.

Keep file names, fingerprints, existence, and target eligibility available even when content is bounded.

---

## 7. Compaction input construction

Implement one exported handler:

```ts
export async function createWorkingMemoryCompaction(
  event: SessionBeforeCompactEvent,
  ctx: ExtensionContext,
  loadedContextFiles: Array<{ path: string; content: string }>,
): Promise<SessionBeforeCompactEventResult | undefined>;
```

### 7.1 Gather project state

Call:

```ts
const state = await checkProjectStatus(ctx.cwd);
const discovery = await discoverProjectFiles(state.projectRoot);
const inbox = await readPromotionInbox(state.projectRoot);
const canonical = await collectCanonicalSnapshot(
  state,
  discovery,
  loadedContextFiles,
);
```

### 7.2 Build the summarized conversation span

Combine Pi’s prepared sections:

```ts
const compactedMessages = [
  ...event.preparation.messagesToSummarize,
  ...event.preparation.turnPrefixMessages,
];
```

Serialize with:

```ts
const compactedConversation = serializeConversation(
  convertToLlm(compactedMessages),
);
```

### 7.3 Build a retained-tail preview

Use Pi’s public session builder:

```ts
const currentContext = buildSessionContext(event.branchEntries).messages;
const recentMessages = currentContext.slice(-12);
```

Serialize:

```ts
const recentConversation = serializeConversation(
  convertToLlm(recentMessages),
);
```

The prepared span tells the model what is being replaced. The recent preview tells it what the session is currently doing. Pi will retain the actual recent tail through `firstKeptEntryId`.

### 7.4 Include the previous working-memory summary

Pass:

```ts
event.preparation.previousSummary
```

as prior working memory.

On repeated compactions, instruct the model to update the working state:

* retain active information;
* move newly completed work into `completed`;
* replace resolved blockers;
* preserve still-relevant failed approaches;
* select one current next action.

### 7.5 Include compaction circumstances

Pass:

```ts
{
  reason: event.reason,
  willRetry: event.willRetry,
  customInstructions: event.customInstructions,
}
```

For overflow recovery with `willRetry: true`, the working-memory result should identify the interrupted operation and its continuation point.

---

## 8. Model prompt contract

The prompt should request one JSON object matching `CompactionModelOutput`.

### 8.1 Working-memory instructions

Ask the model to describe:

* the immediate task currently being performed;
* the reason for that task;
* completed work relevant to continuation;
* approaches that produced useful results;
* approaches that produced failures or invalid results;
* partially completed work;
* current blockers;
* critical implementation context;
* exactly one immediate next action;
* existing relevant files selected from the supplied inventory.

Frame this as active working memory rather than project history.

### 8.2 Promotion instructions

For every possible promotion, require a semantic comparison against:

* all supplied canonical-file contents;
* the list of absent standard targets;
* all existing `INBOX.md` candidates.

Emit an `add` proposal when the information is materially useful as persistent project memory and lacks adequate representation in the selected target.

Emit an `update` proposal when new information materially:

* narrows an accepted statement;
* adds a consequential caveat;
* corrects an accepted statement;
* extends an accepted rule or decision;
* changes the future interpretation of an existing statement.

For `update`, require `existingText` to be an exact excerpt from the supplied target file.

Set a maximum of five proposals per compaction.

Give priority to:

1. explicit user decisions;
2. stable project constraints;
3. architectural principles;
4. durable workflow rules;
5. future tasks that belong in project task state;
6. evidence or conclusions with future relevance.

Request direct JSON text as the response.

---

## 9. Model invocation and parsing

### 9.1 Resolve the model

Use `ctx.model`.

Use:

```ts
await ctx.modelRegistry.getApiKeyAndHeaders(model)
```

for authentication data.

### 9.2 Execute

Call `complete()` using:

* `event.signal`;
* `cacheRetention: "none"`;
* a fresh `uuidv7()` session ID;
* up to 4096 output tokens;
* the current model’s output-token limit;
* resolved API key, headers, and environment.

### 9.3 Extract text

Join all response content blocks with `type === "text"`.

### 9.4 Parse JSON

Accept:

* direct JSON;
* one enclosing `json` Markdown fence.

Parse into `unknown`, then validate manually into `CompactionModelOutput`.

Use the repository’s existing validation style: small runtime predicates with precise errors, matching the approach used in `worker-engine.ts` and `project-status.ts`.

---

## 10. Mechanical validation

### 10.1 Working memory

Require:

* non-empty `currentTask`;
* non-empty `nextAction`;
* arrays containing strings;
* at most 12 items per array;
* bounded item length;
* at most 12 relevant files.

Resolve every `relevantFiles` entry through `resolveProjectPath()`.

Retain entries whose files currently exist.

Render these under “Relevant existing files.”

### 10.2 Promotion targets

Require `targetFile` to be present in `canonical.allowedTargets`.

For `add`:

* require non-empty `proposedText`;
* require non-empty `rationale`;
* compare an exact normalized form against the current target content;
* compute the stable candidate ID.

For `update`:

* require non-empty `existingText`;
* require non-empty `proposedText`;
* require non-empty `rationale`;
* require an existing target file;
* require the current target content to contain `existingText` exactly;
* compute the stable candidate ID.

### 10.3 Inbox deduplication

Build a set of existing candidate IDs.

Append candidates whose IDs are absent.

Preserve existing candidate order and append newly created candidates in model order.

### 10.4 Concurrent file changes

Record canonical fingerprints before invoking the model.

After parsing the response, fingerprint the same files again.

When a fingerprint differs:

* return the validated working-memory compaction;
* defer the promotion write to a later compaction;
* notify the user that canonical files changed during promotion analysis.

This keeps continuation available while ensuring promotion proposals correspond to the canonical contents they were compared against.

---

## 11. Working-memory rendering

Render the validated structure deterministically:

```markdown
# Working memory

## Current task

[task]

[optional purpose]

## Current state

### Completed

- ...

### Successful approaches

- ...

### Failed approaches

- ...

### In progress

- ...

### Blockers

- ...

## Critical context

- ...

## Continue from here

[next action]

## Relevant existing files

- ...
```

Omit empty optional sections.

Keep the result concise enough to function as working memory. Use bounded list counts and bounded string lengths as the mechanical size control.

Pass this rendered Markdown as `compaction.summary`.

---

## 12. Compaction details

Store compact machine-readable metadata:

```ts
interface PiSychCompactionDetails {
  kind: "pi-sych-working-memory";
  version: 1;
  reason: "manual" | "threshold" | "overflow";
  willRetry: boolean;
  inboxPath: "INBOX.md";
  pendingPromotions: number;
  addedPromotionIds: string[];
  canonicalFingerprints: Record<string, string>;
}
```

Include these details in the returned compaction object.

Pi persists extension-specific details in the session’s compaction entry.

---

## 13. Inbox persistence and visibility

After validation and fingerprint confirmation:

1. Merge the new candidates with the existing inbox.
2. Render `INBOX.md`.
3. Write it using `writeAtomicFile()`.
4. Count all pending candidates.
5. Notify the user:

```text
Working-memory compaction complete. INBOX.md has 3 pending memory proposals.
```

Use a brief TUI notification because it remains outside the model’s active context.

For an inbox write error:

1. retain the working-memory compaction;
2. emit a warning notification;
3. record zero added candidate IDs in compaction details.

---

## 14. Status integration

Extend `formatProjectStatusCheck()` with an optional second argument:

```ts
export function formatProjectStatusCheck(
  state: ProjectStatusCheck,
  pendingPromotions = 0,
): string;
```

Add:

```text
Pending memory proposals: 3
Review: /plannotator-annotate INBOX.md
```

when the count is positive.

Update both current callers in `extensions/workbench/index.ts`:

### Agent tool

```ts
const state = await checkProjectStatus(ctx.cwd);
const pendingPromotions = await countPromotionCandidates(state.projectRoot);
```

Return:

```ts
details: {
  ...state,
  pendingPromotions,
}
```

This lets the agent report that review is pending while keeping candidate contents in the human-review file.

### Human status command

Use the same count and formatter in `/pi-sych-status`.

---

## 15. Supervisor guidance

Add one line to `SUPERVISOR_GUIDANCE`:

```text
Treat INBOX.md as human-review proposal state: report its pending count through project_status and load its contents when the user explicitly requests inbox review.
```

This establishes the intended interaction while keeping the ordinary agent focused on current work.

---

## 16. Extension registration

In `piSychWorkbench()`:

1. Add the closure holding `loadedContextFiles`.
2. Extend the existing `before_agent_start` handler to refresh that closure.
3. Register:

```ts
pi.on("session_before_compact", (event, ctx) =>
  createWorkingMemoryCompaction(event, ctx, loadedContextFiles),
);
```

Keep the hook in the existing supervisor extension. The package manifest already loads `extensions/workbench/index.ts` as the Pi extension entry point.

---

## 17. Tests

Use the repository’s existing TypeScript build plus Node test workflow:

```text
npm run build:test
node --test tests/unit/*.test.mjs
node --test tests/integration/*.test.mjs
```

These commands are already defined in `package.json`.

### 17.1 Unit tests

Cover:

1. Direct JSON model output parsing.
2. Fenced JSON output parsing.
3. Working-memory field validation.
4. Deterministic working-memory rendering.
5. Empty optional sections.
6. Existing relevant-file filtering.
7. `add` candidate validation.
8. `update` candidate validation with exact existing excerpt.
9. Stable candidate IDs.
10. Duplicate inbox candidate removal.
11. Exact duplicate already present in canonical content.
12. Inbox parse/format round trip.
13. Missing `INBOX.md` producing an empty version-1 inbox.
14. Existing inbox preserving candidate order.
15. Canonical target collection from standard files.
16. Canonical target collection from `SYNC.md` artifacts with `role`.
17. Canonical target collection from `authoritativeFor`.
18. Absent `PROJECT.md` remaining available as an add target.
19. Canonical fingerprint change detection.
20. Pending-candidate counting.

### 17.2 Hook-level tests

Use a fake extension context and fake `complete()` boundary.

Cover:

1. Manual compaction.
2. Threshold compaction.
3. Overflow compaction with `willRetry: true`.
4. Previous working-memory summary supplied to the model.
5. Retained-tail preview supplied to the model.
6. Pi custom instructions supplied to the model.
7. Current model authentication.
8. Abort signal forwarding.
9. Response usage copied into the compaction result.
10. Pi’s `firstKeptEntryId` copied unchanged.
11. Pi’s `tokensBefore` copied unchanged.
12. Valid working memory with zero promotions.
13. Valid working memory with new promotions.
14. Canonical files changing during the model call.
15. Unavailable model handing execution to Pi’s standard compactor.
16. Authentication failure handing execution to Pi’s standard compactor.
17. Malformed model output handing execution to Pi’s standard compactor.
18. Empty model text handing execution to Pi’s standard compactor.
19. Inbox write failure retaining working-memory compaction.

### 17.3 Integration tests

Create temporary projects for:

1. `PROJECT.md` and `SYNC.md` present.
2. `PROJECT.md` absent.
3. `SYNC.md` absent.
4. Existing `DECISIONS.md` containing the full accepted decision.
5. Existing decision receiving a material caveat.
6. Existing pending candidate in `INBOX.md`.
7. Declared `PLAN.md` tracked through `SYNC.md`.
8. Repeated compaction where a previous candidate has since been promoted into a canonical file.
9. `/pi-sych-status` showing the pending count.
10. `project_status` details containing `pendingPromotions`.

---

## 18. Documentation updates

### `ARCHITECTURE.md`

Update the project-state section to describe:

```text
Working-memory compaction
    current task continuation

INBOX.md
    optional unreviewed promotion proposals

PROJECT.md / DECISIONS.md / TODO.md / other declared files
    accepted persistent project state
```

Add `INBOX.md` to the optional-file list currently documented alongside `AGENTS.md`, `STYLE.md`, `EVIDENCE.md`, `DECISIONS.md`, and `TODO.md`.

### `README.md`

Document:

* automatic and manual compaction behavior;
* the meaning of `INBOX.md`;
* status reporting;
* review command:

```text
/plannotator-annotate INBOX.md
```

### `CHANGELOG.md`

Record:

* task-centered working-memory compaction;
* semantic comparison against canonical files;
* root-level promotion inbox;
* pending-count status integration.

---

## 19. Implementation sequence

### Phase 1 — File primitives

1. Add `INBOX.md` to `OPTIONAL_PROJECT_FILES`.
2. Extract `writeAtomicFile()` from `writeApprovedFile()`.
3. Preserve `writeApprovedFile()` as the approval-enforcing wrapper.
4. Add unit coverage for atomic writes and optional inbox discovery.

### Phase 2 — Inbox model

1. Add inbox interfaces.
2. Implement inbox parsing.
3. Implement deterministic inbox formatting.
4. Implement stable candidate IDs.
5. Implement candidate merging and counting.
6. Add unit tests.

### Phase 3 — Canonical snapshot

1. Call `checkProjectStatus()`.
2. Call `discoverProjectFiles()`.
3. Collect standard memory files.
4. Collect declared authoritative Markdown artifacts.
5. merge Pi-loaded context files.
6. Read bounded contents.
7. fingerprint canonical files.
8. Add unit tests for present and absent files.

### Phase 4 — Compaction model call

1. Build compacted-span text.
2. Build recent-tail preview.
3. include previous working memory.
4. include canonical snapshot and inbox.
5. invoke `complete()` using the current Pi model and registry authentication.
6. parse and validate structured output.
7. add hook-level tests.

### Phase 5 — Rendering and persistence

1. Render working-memory Markdown.
2. validate promotions mechanically.
3. verify canonical fingerprints.
4. merge and atomically write `INBOX.md`.
5. return the Pi compaction result with usage and details.
6. add failure-path and race tests.

### Phase 6 — Visibility

1. add pending-count support to `formatProjectStatusCheck()`;
2. update `project_status`;
3. update `/pi-sych-status`;
4. add the supervisor-guidance line;
5. add integration tests.

### Phase 7 — Documentation and full verification

Run:

```text
npm run typecheck
npm run lint
npm run format:check
npm run markdown:check
npm run test
npm run source:budget
npm run smoke
```

The current repository enforces an estimated **2,000-line production TypeScript budget**, excluding only the MCPorter and Plannotator adapters. Keep the new compaction implementation inside that existing budget calculation.

---

## 20. Acceptance criteria

The implementation is complete when all of the following are demonstrated:

1. `/compact` produces a task-centered working-memory summary.
2. automatic threshold compaction uses the same working-memory format.
3. overflow compaction preserves the interrupted task’s continuation point.
4. Pi retains its prepared recent conversation tail.
5. the summary names only existing relevant files.
6. an absent `PROJECT.md` is represented accurately.
7. information already represented in canonical memory yields zero promotion candidates.
8. a materially new decision yields an `add` candidate.
9. a material caveat to an existing decision yields an `update` candidate with an exact source excerpt.
10. repeated compactions deduplicate pending candidates.
11. a candidate promoted into a canonical file ceases to be proposed in later compactions.
12. `INBOX.md` is created only when validated candidates exist.
13. inbox writes are atomic.
14. canonical-file changes during analysis defer promotion writing while preserving working-memory compaction.
15. `project_status` reports the pending candidate count.
16. `/pi-sych-status` reports the pending candidate count and review command.
17. `/plannotator-annotate INBOX.md` opens the existing review interface.
18. model usage appears in Pi’s session totals.
19. custom-compaction failures hand control to Pi’s standard compactor.
20. all repository checks and the source-budget check pass.

## 21. Expected production size

```text
compaction.ts                    160–220 lines
project-files.ts changes         15–25 lines
project-status.ts changes        10–20 lines
workbench/index.ts changes       20–30 lines
---------------------------------------------
Expected total                  205–295 lines
```

Prompt text and Markdown documentation remain outside this TypeScript estimate.

