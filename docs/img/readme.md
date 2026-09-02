# Architecture diagrams

- `workflow.png` is the primary introductory overview: a request can use
  task-specific skills and project files, optionally involve a focused
  worker, and return for human review and decision. It is intended for a
  general audience and does not replace the detailed review diagram.
- `architecture.png` shows the two supervisor tools, project state, one
  bounded worker, and optional adapters.
- `supervisors_context.png` shows the bounded six-field compaction flow
  and human review of proposal lines.
- `skills_architecture.png` shows the six public skills, shared methods,
  and local modules as a composition boundary rather than extra public
  skills.
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
