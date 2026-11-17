# Documentation diagrams

The explanatory PNGs are illustrations, not executable architecture
specifications. README, architecture, configuration, migration, and
public-contract prose is authoritative for details.

## Reviewed v8 assets

`architecture.png` has been corrected and visually reviewed. It shows
mechanical project check/acknowledge operations, clean-or-trajectory
bounded assignment context, ordinary versus explicitly enabled remote-
research workers using Pi-native MCP/codemode and their own `mcp.json`,
and Plannotator as an optional review adapter. The obsolete MCPorter box
and dangling connector are gone. Tool availability does not establish
credentials or access; acknowledgement is not correctness or approval.
Small labels may require opening the full-size image.

The following illustrations are useful for orientation but need the
corrections noted below:

- `workflow.png` is the general-audience overview: relevant skills and
  project files may help, workers are optional, and humans retain
  consequential decisions.
- `supervisors_context.png` needs updating. Its recent/bounded
  conversation and "no raw history dump" labels predate full-visible
  input and token-aware fitting; its "resolved before compaction" label
  incorrectly suggests unfinished tasks and open questions must be
  settled first. See the compaction architecture for current behavior.
- `skills_architecture.png` shows seven public umbrella skills and keeps
  skill-local modules and shared methods in the private building-block
  layer.
- `review_workflow.png` shows a suggested review/revision pattern,
  including a separate debate path and human decisions. It does not make
  Plannotator or any single sequence mandatory.
- `logo.png` is the project logo used by the README and package gallery.
  Its terminal text, including `pi_sych run` and `pew-pew`, is
  decorative and does not describe supported Pi Sych commands or
  integrations.

All diagrams are compact summaries. They do not replace the detailed
contracts or establish semantic approval, source verification, or
successful tool access.
