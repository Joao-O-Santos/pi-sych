# Documentation diagrams

These notes track the repository's explanatory PNGs. The diagrams are
illustrations, not executable architecture specifications; prose in the
README, architecture, configuration, migration, and public-contract
documentation is authoritative for details.

## Only pending image correction: `architecture.png`

The other explanatory images were checked against the current package:
`workflow.png`, `supervisors_context.png`, `skills_architecture.png`,
and `review_workflow.png` appear consistent with the current behavior.
`logo.png` is artwork, not an architecture diagram. The architecture
image already shows all three supervisor tools and the worker-change
distinction, but it still shows the removed MCPorter integration and
labels the worker boundary as clean-context-only. Update only
`architecture.png` for these v8 discrepancies.

### Paste-ready edit prompt

Attach the existing `docs/img/architecture.png` and use this prompt:

> Edit the attached Pi Sych architecture diagram in place. Keep its
> sepia technical-blueprint style, dimensions, palette, central
> supervisor/worker layout, project-files panel, and readable labels.
> Make only the specific corrections below; do not redesign the diagram
> or invent new behavior. Keep the three existing supervisor tool IDs:
> `project_status`, `dispatch_worker`, and `literature_search`.
>
> 1.  Correct the `project_status` card. Its current "Goals, scope,
>     domains, assumptions, baselines" lists project-brief content, not
>     the tool's check/acknowledge operations. Use concise wording such
>     as: `Check project state and declared dependency impact`;
>     `Acknowledge reviewed state`;
>     `Acknowledgement is not correctness or approval`.
> 2.  In the worker boundary banner, replace `BOUNDARY: CLEAN CONTEXT`
>     and its clean-only explanation with
>     `BOUNDARY: BOUNDED ASSIGNMENT CONTEXT`. State briefly that the
>     supervisor may choose clean or trajectory context for a worker; do
>     not imply workers always lack prior context or receive the full
>     live supervisor session.
> 3.  Remove the obsolete `MCPorter` box and all MCPorter/client or
>     companion-web inheritance claims. Do not depict MCPorter as part
>     of the current architecture.
> 4.  In the worker area, add a concise accurate note: ordinary workers
>     do not receive MCP/codemode; explicitly marked remote-research
>     workers load Pi-native MCP and codemode and use their own worker
>     `mcp.json`. Tool availability does not guarantee credentials or
>     successful access. Keep this note legible and subordinate to the
>     main worker flow.
> 5.  Keep Plannotator only as a separately selectable, optional human-
>     review adapter. It is not a required workflow step, plan
>     controller, or automatic approval/promotion mechanism. Rebalance
>     the bottom adapter area after removing MCPorter rather than adding
>     another adapter card.
> 6.  Retain the existing distinction between worker-reported files and
>     observed project changes, including unexpected changes after
>     failure and the fact that observation does not undo changes.
>
> Keep all labels correctly spelled and legible at normal README display
> size. Do not add claims that workers are sandboxes, that configured
> tools necessarily work, or that worker completion is approval. Return
> an edited PNG at the original dimensions. Do not modify other images.

Inspect the rendered output against `docs/ARCHITECTURE.md` and
`docs/public-contract.md` before replacing the tracked image.

## Image inventory

- `workflow.png` is the general-audience overview: relevant skills and
  project files may help, workers are optional, and humans retain
  consequential decisions.
- `supervisors_context.png` distinguishes bounded compaction inputs and
  continuation from assignment-specific worker context. It shows
  proposals as unreviewed until human review and writing style defaults
  only for selected writing workers.
- `skills_architecture.png` shows seven public umbrella skills and keeps
  skill-local modules and shared methods in the private building-block
  layer.
- `review_workflow.png` shows a suggested review/revision pattern,
  including a separate debate path and human decisions. It does not make
  Plannotator or any single sequence mandatory.
- `logo.png` is the project logo used by the README and package gallery.

All diagrams are compact summaries. They do not replace the detailed
contracts or establish semantic approval, source verification, or
successful tool access.
