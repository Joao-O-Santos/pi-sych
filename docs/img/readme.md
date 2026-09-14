# Architecture diagrams

- `logo.png` is the project logo used at the top of `README.md` and as
  the Pi package gallery preview.

<!--
IMAGE UPDATE PATCH — workflow.png

Give the existing image to a vision-capable image model and ask it to
preserve its dark brass-and-green illustrated workflow, seven numbered
stages, readable labels, and general-audience tone. Apply this patch
rather than redesigning it:

- In stage 3, retain the existing project, analyze, write, review, code,
  and research cards and add a seventh `automation` card. Describe it
  briefly as "Compose workflows, data/file work, and browser
  automation."
- Reflow only the stage-3 cards as needed so all seven are legible and
  have equal visual weight; do not remove code or research.
- Keep the qualification that steps vary by task and that workers are
  optional. Do not imply that every request uses every skill or that
  output is approved automatically.
- Keep the project-file and human-judgment concepts, but avoid adding
  claims not visible in the current package documentation.

The result should be the same illustration with this minimal content
diff, not a new visual style.
-->

- `workflow.png` is the primary introductory overview: a request can use
  task-specific skills and project files, optionally involve a focused
  worker, and return for human review and decision. It is intended for a
  general audience and does not replace the detailed review diagram.

<!--
IMAGE UPDATE PATCH — architecture.png

Give the existing image to a vision-capable image model as the reference. Keep
the sepia technical-blueprint treatment, central supervisor/worker structure,
human-judgment panel, project-file panel, optional Plannotator and MCPorter
adapters, and all labels that remain accurate. Make only this content patch:

- Expand `SUPERVISOR TOOLS` from two boxes to three. Keep `project_status` and
  `dispatch_worker`, and add `literature_search`.
- Label the new box approximately: `literature_search` — `Local read-only
  literature discovery; metadata and snippets are not source verification.`
- Rebalance the three tool boxes and their connectors without making the
  diagram denser or reducing text legibility.
- Do not call worker modes sandboxes, imply that tool availability proves
  access, or suggest that a worker's completion is approval.

Preserve the old image's composition and palette; this is a diagram-label
update, not a redesign.
-->

- `architecture.png` is stale: its `SUPERVISOR TOOLS` panel shows only
  `project_status` and `dispatch_worker`; add the current
  `literature_search` tool before treating it as current.

<!--
IMAGE UPDATE PATCH — supervisors_context.png

Use the existing image as the visual source and preserve its parchment,
blueprint, green-screen, and mechanical-compaction aesthetic. Update the
content so it describes the current bounded settled-turn compaction and worker
context without presenting an exhaustive runtime contract:

- Replace the old generic `LOADED ON DEMAND (NOT IN COMPACTION)` wording with
  a clear distinction between supervisor compaction inputs and worker packets.
- Show bounded observable conversation/continuation material, canonical
  snapshots, and explicit unresolved work as compaction inputs; show a bounded
  summary and next actions as output.
- Show worker-only writing context separately: package
  `skills/write/DEFAULT_STYLE.md` is a baseline and project `STYLE.md` is a
  local override for workers selected with `write`. Do not imply these files
  are always in supervisor compaction.
- Keep proposal flow human-controlled and label proposals as unreviewed until
  a human reviews them. Remove or replace the decorative Einstein quotation
  unless its wording and attribution are verified.
- Retain the limits: compaction is bounded, does not replay the full history,
  and does not mutate canonical semantic files.

Make the smallest legible diagram edit needed to correct these labels; retain
the original visual language rather than inventing new architecture.
-->

- `supervisors_context.png` is stale: it predates the current
  settled-turn observable compaction and does not distinguish worker
  writing-style context from supervisor compaction. Use the patch
  comment above when regenerating it.

<!--
IMAGE UPDATE PATCH — skills_architecture.png

Give the existing image to a vision-capable image model and preserve its
technical-illustration style, public/private grouping, recipe arrows, and
building-block explanation. Apply this minimal patch:

- Change `SIX PUBLIC ENTRY POINTS` to `SEVEN PUBLIC ENTRY POINTS`.
- Add a seventh public card named `automation`, with a short description such
  as `Capabilities, data, workflows, and browser automation.`
- Reflow the public cards so all seven are equally legible; retain project,
  write, analyze, code, review, and research.
- Do not promote modules or shared methods into public skills, and do not
  claim that a fixed sequence is required.

Keep the old composition and palette. This is a catalogue correction, not a
new illustration.
-->

- `skills_architecture.png` is stale: it predates the automation
  umbrella and still shows six public skills. Regenerate it with the
  patch comment above before treating the image as current.
- `review_workflow.png` shows the detailed review and revision pattern,
  including a separate debate or feedback path and the human decision to
  revise, verify, or acknowledge. Plannotator is one optional review
  adapter described in the accompanying documentation; it is not part of
  the diagram's required path.
- These PNGs are deliberately simple summaries, not executable diagrams.
  Their labels must not be read as a complete runtime contract: in
  particular, workers receive the selected artifact and context, custom
  compaction receives bounded snapshots plus conversation material, and
  acknowledgement is mechanical rather than semantic approval.
  `README.md`, `docs/ARCHITECTURE.md`, the skill recipes, and
  implementation remain authoritative for exact behavior.
