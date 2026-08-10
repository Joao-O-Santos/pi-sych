# Architecture

This section is for the supervisor model and for contributors who need
to understand the runtime boundary. Pi Sych is deliberately a small
mechanical layer: it tracks paths and hashes, launches bounded workers,
and preserves explicit human review. Skills and humans own semantic
judgment.

## Supervisor contract

The supervisor sees two agent tools:

- `project_status` checks or acknowledges mechanical project state;
- `dispatch_worker` runs one short-lived clean-context worker.

Human commands are separate: `/pi-sych-status`, `/pi-sych-mcp`,
`/plannotator-last`, `/plannotator-annotate`, and `/plannotator-review`.
There is no plan controller, worker registry, semantic reconciliation
tool, or automatic promotion mechanism. The supported surface and SemVer
boundary are defined in [the public contract](docs/public-contract.md).

When a turn starts, Pi Sych adds its static guidance and, when present,
the configured project `agents` file. The private model catalog is
loaded lazily: direct project work does not require worker setup, while
a worker dispatch requires a valid exact-role catalog.

The supervisor should pass the smallest complete worker packet: task,
expected output, capability mode, context files, selected skills, model
role, and a bounded timeout. Workers receive no supervisor transcript.
After reading a selected umbrella skill, workers read the local modules
and shared methods its task recipe routes to, in the stated order. A
worker selected with the exact `research` skill receives
`literature_search` in addition to its mode's tools; other workers do
not. Tool modes control visible Pi tools; they are not sandboxes and do
not remove host permissions.

## Worker lifecycle

A worker is a clean Pi process with one terminal result. The launcher:

1.  resolves the project and selected context;
2.  checks that the worker agent directory was explicitly bootstrapped;
3.  creates a temporary result directory;
4.  starts Pi with the selected tools, skills, model, and optional
    MCPorter extension;
5.  stops it on cancellation or timeout, escalating from `SIGTERM` to
    `SIGKILL`; and
6.  accepts a result only when it is valid, immutable, and the process
    exits normally.

The worker result protocol has `status` (`complete`, `partial`, or
`failed`), non-empty `summary`, and string arrays `files` and
`limitations`. `complete` is a worker report, not an approval claim.
Reported files must be relative, remain inside the project root, and
exist when the result is accepted. Cancellation, timeout, spawn failure,
a signal exit, or a non-zero exit takes precedence over any result file.
The temporary result directory is removed whether the worker succeeds or
fails.

## Project state

`SYNC.json` version 2 records tracked file hashes and dependency paths.
`project_status` reports missing files, changed hashes, persisted
statuses, project-brief validation problems, and direct or transitive
dependency impact. It never decides semantic drift, authority, quality,
or correctness.

Acknowledgement is atomic and rechecks selected files immediately before
writing. If a file changed during the review window, acknowledgement
aborts instead of recording an obsolete fingerprint. A changed hash
proves only that content changed after acknowledgement.

Artifact paths are project-local by lexical path, while symlinks remain
ordinary project files and are not treated as a security boundary.
Explicit canonical paths are configuration: they may be absolute or
external and are checked for readability rather than treated as a
sandbox boundary.

## Compaction

When `compaction.custom` is enabled, Pi Sych calls the active supervisor
model through the custom-compaction seam; it does not use a worker role.
Returning no custom result on unavailable model/authentication or
failure leaves Pi's normal compactor in control. Compaction sends the
previous summary, compacted conversation, a concise status projection,
and bounded snapshots of the configured `project`, `todo`, and
`decisions` files when present. It retains relevant artifact paths
without loading every artifact. The prompt explicitly preserves
continuity-critical unresolved alternatives, negative results, failed
approaches that constrain the next action, and commitments not yet
written to canonical files, using the existing memory fields. `INBOX.md`
is intentionally excluded because it contains unreviewed proposals.

Text snapshots are capped per file and in total. Truncation is reported
to the model. At most five validated proposals may be appended to the
configured inbox, which is created as needed and counted by proposal
lines, not by newline accidents.

## Local literature

`literature_search` is registered only by the worker extension. It opens
the selected database read-only and queries the supported SQLite FTS5
`papers` plus external-content `papers_fts` schema. The supervisor
forwards only the resolved Pi Sych configuration-directory path to the
worker while retaining its isolated Pi agent directory. Search joins the
index to canonical metadata, searches filepath, title, abstract, tags,
and DOI, and ranks with FTS5, snippets `abstract`, and returns source
paths resolved relative to the database. Database selection and the
`literatureDatabase` setting are documented in
[configuration](docs/configuration.md#local-literature-search).

## Skills, MCPorter, and Plannotator

Only six umbrella skills are public: `project`, `write`, `analyze`,
`code`, `review`, and `research`. Each contains bounded ordered task
recipes. Recipes compose two kinds of plain supporting file:

- shared methods under `skills/_methods` define reusable procedures for
  prose, hypothesis generation, argument analysis, and claim-to-evidence
  mapping; and
- local modules adapt those procedures to a genre, artifact, or review
  mode.

`_methods` contains no `SKILL.md`, so neither methods nor modules
enlarge the public catalog. Routes are ordinary Markdown links resolved
relative to the umbrella file. Methods may include examples, templates,
rubrics, or scripts; scripts remain ordinary support files, not
registered tools. Intellectual influences are recorded once in packaged
`docs/attribution.md`, outside routed model context. There is no method
registry, composition engine, prompt inheritance, or automatic import
mechanism.

MCPorter is enabled only for explicitly requested remote research. Its
configuration is not generated by worker bootstrap. Diagnostics report
availability, configuration presence, and server names without printing
credentials.

The core workbench and the Plannotator adapter are separate package
extensions. Pi package filters or `pi config` can omit Plannotator;
`extensions: []` or `--no-extensions` omits all package extensions while
skills may remain loaded. `--tools` and `--exclude-tools` narrow visible
tools for one Pi session. None of these controls makes a worker a
sandbox.

Plannotator remains a narrow human review adapter. Last-message feedback
enters the conversation. File annotation writes `<input>.feedback.md`;
code-review feedback writes `<projectRoot>/PLANNOTATOR_REVIEW.md`.
