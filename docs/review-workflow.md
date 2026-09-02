# Review and revision workflow

Pi Sych can separate independent review, accepted revisions, and final
verification into fresh worker processes. This is a recommended workflow
pattern rather than a runtime-enforced pipeline. The README's
[introductory overview](../README.md) is a simpler orientation; this
diagram shows the fuller review pattern.

![Review and revision workflow: independent review, human decision,
clean-context editing, fresh verification, and
acknowledgement](img/review_workflow.png)

In the diagram, "fresh context" means no prior supervisor transcript or
review debate. The worker still receives the selected artifact, context
files, and task brief needed for its assigned job.

## What problem this addresses

A long conversation can accumulate rejected alternatives, reviewer
arguments, author responses, and intermediate formulations. Passing all
of that history to the model performing the revision can contaminate the
final prose.

For example, suppose an earlier draft said X. A reviewer recommends Y,
and the author agrees. A writer exposed to the whole debate may produce
"Not X, but Y."

A fresh edit worker given only the accepted correction can instead
produce the clean statement "Y."

The purpose is not to conceal relevant evidence. It is to distinguish
the context needed to write the artifact from the historical discussion
used to decide what should change.

## A typical manuscript cycle

### 1. Write or update the manuscript

The manuscript and supporting project files remain ordinary files in the
project. `PROJECT.md` records the project direction, while `SYNC.json`
can track relevant artifacts and declared dependencies.

### 2. Request an independent review

The supervisor checks mechanical project state and creates a bounded
worker packet containing the review task, expected output, selected
context files, relevant skills, model role, capability mode, and
timeout.

The reviewer receives no supervisor transcript. It sees the context and
tools selected for that review.

### 3. Decide what to do with the findings

The reviewer returns findings rather than silently changing the
manuscript. You may accept, reject, prioritize, combine, or ask for
clarification on each material point.

You can respond in the conversation, annotate the last assistant
message, or annotate a project-local review file.

### 4. Launch a fresh edit worker

The supervisor converts your decisions into a clean implementation
brief. The edit worker receives:

- the accepted corrections;
- the manuscript or sections that must change;
- applicable evidence and style requirements;
- any tools needed to perform the revision.

It normally does not need rejected suggestions or the full review
debate.

### 5. Verify in another fresh context

A verification worker receives the revised files and the original
criteria. It checks whether the accepted changes were implemented,
whether anything was lost or distorted, and whether the revision
introduced new problems.

A failed verification leads to a new edit worker with a focused
correction packet. The previous worker context is not resumed.

### 6. Accept and acknowledge

Human acceptance remains separate from mechanical acknowledgement.
`project_status` rehashes selected files immediately before updating
`SYNC.json`; acknowledgement aborts if a reviewed file changed during
that interval.

## Selecting tools

Workers receive the mode and optional integrations appropriate to their
task:

- `read-only` exposes reading and discovery tools for review,
  inspection, and analysis;
- `edit` adds focused file editing and writing tools;
- `full-host` exposes Bash for tasks that must run project commands or
  inspect the wider host environment; and
- `remoteResearch: true` adds MCPorter only for an explicitly assigned
  remote-research task.

These names describe visible Pi tools, not security boundaries. Tool
modes do not remove the worker process's underlying host permissions.

## Human review tools

- `/plannotator-last` annotates the last assistant response and returns
  feedback to the conversation.
- `/plannotator-annotate <file>` accepts only a project-local `.md` or
  `.mdx` file and writes feedback to `<file>.feedback.md`.
- `/plannotator-review` records code-review feedback in
  `<projectRoot>/PLANNOTATOR_REVIEW.md`.

These are review interfaces, not a plan controller or automatic approval
system. Plannotator is a separate optional extension: disable it with
`pi config` or package extension filtering without changing the core
review workflow. See the [public contract](public-contract.md) for the
supported boundary.

## What isolation does and does not guarantee

Each dispatched worker is a new process with an explicit context packet
and no supervisor transcript. Fresh processes make it possible to keep
the accepted edit brief separate from the preceding review debate.

The supervisor still chooses the files, skills, tools, integrations, and
instructions included in each packet. `--tools` and `--exclude-tools`
can narrow visible tools for a Pi session, but do not sandbox a worker.
Context discipline therefore remains partly a workflow responsibility.
It is context isolation, not a host sandbox. It does not guarantee that
selected files are free of review history, that remote results are
correct, or that host access is contained.
