# Architecture diagrams

- `architecture.png` shows the two supervisor tools, project state, one
  bounded worker, and optional adapters.
- `supervisors_context.png` shows the bounded six-field compaction flow
  and human review of proposal lines.
- `skills_architecture.png` shows the six public skills, shared methods,
  and local modules as a composition boundary rather than extra public
  skills.
- `review_workflow.png` shows optional Plannotator feedback and the
  human decision to revise, verify, or acknowledge.
- These PNGs are deliberately simple summaries, not executable diagrams.
  Their labels must not be read as a complete runtime contract: in
  particular, workers receive the selected artifact and context, custom
  compaction receives bounded snapshots plus conversation material, and
  acknowledgement is mechanical rather than semantic approval.
  `README.md`, `docs/ARCHITECTURE.md`, the skill recipes, and
  implementation remain authoritative for exact behavior.
