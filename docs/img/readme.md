# Architecture diagrams

## Paste-ready image-edit prompt

Attach **one target PNG at a time** to your image-generating model,
paste the prompt below, and replace `[TARGET-SPECIFIC EDIT]` with the
matching correction from this file. Ask the model to return an edited
PNG, not SVG or a textual mock-up. Inspect the rendered result and all
labels before replacing the repository asset.

> Edit the attached Pi Sych diagram in place. Preserve its existing
> illustration, palette, texture, composition, and overall visual
> identity. Make only the content corrections listed here; do not
> redesign the image or invent new features. Keep all text exact,
> correctly spelled, and legible at the image's normal README display
> size. Reflow or resize only the affected area as needed. Keep the
> image's existing dimensions and PNG format. Do not add decorative
> text, quotations, labels, connectors, steps, or icons that change the
> documented behavior. Do not imply that workers are sandboxes, that
> every task follows one required sequence, that tool availability
> proves access, or that generated work is approved automatically.
>
> Target-specific edit: \[TARGET-SPECIFIC EDIT\]

### Target-specific edits

- **`workflow.png`:** In the skills panel, retain the six existing
  skills and add a seventh equally legible `automation` card. Label it
  briefly: `Workflows, data/file tasks, and browser automation.`
  Preserve that tasks use only relevant skills and workers are optional.

- **`architecture.png`:** Add `literature_search` as the third
  supervisor tool, described as local read-only literature discovery
  whose metadata and snippets are not source verification. Update the
  worker/result area to show that reported files and observed project
  changes are distinct, unexpected changes are surfaced even after
  worker failure, and Pi Sych does not automatically undo them.

- **`supervisors_context.png`:** Update the compaction area to show
  bounded, observable conversation material and canonical snapshots
  flowing into a bounded continuation, with native fallback and no
  mutation of canonical semantic files. Show proposals as unreviewed
  until human review. Keep the worker context packet separate from
  compaction; package writing defaults and project `STYLE.md` apply only
  to selected writing workers.

- **`skills_architecture.png`:** Change six public skills to seven and
  add `automation`. Retain project, write, analyze, code, review, and
  research. Keep methods/modules private supporting guidance, not
  additional public skills, and do not imply a fixed workflow.

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

- `architecture.png` shows all three supervisor tools, including local
  read-only `literature_search`, and distinguishes worker-reported files
  from observed project changes, including changes left after failure.

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

- `supervisors_context.png` separates bounded compaction inputs and
  supervisor continuation from assignment-specific worker context. It
  also shows package writing defaults as the baseline and project
  `STYLE.md` as a local override for selected writing workers only.

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

- `skills_architecture.png` shows seven public umbrella skills,
  including `automation`, and keeps skill-local modules and shared
  methods in the private building-block layer.
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
