# Artifacts

Read applicable instructions and the selected artifact. Identify actual paths,
headings, references, tables, figures, source, and outputs. Mark direct content
`explicit`, interpretation `inferred`, and absent high-impact rationale,
evidence, scope, or completion criteria `unresolved`.

Keep canonical roles distinct. `project` records accepted direction; `evidence`
records support and limitations; `decisions` records accepted consequential
choices; `style` records artifact conventions; `todo` records unfinished local
work; `SYNC.json` records mechanical state. An accepted decision may need both a
`decisions` entry and a concise `project` direction update, but do not duplicate
the full decision. Never turn inference into acceptance.

When the update would introduce a new consequential semantic
choice, present that choice for review first.

## Keep the evidence digest current

Use the optional `EVIDENCE.md` (or configured equivalent) as a short working
digest. Keep entries that someone needs to draft, check, or resume the current
work, or to verify a recent change. Organize by claim, section, or behavior so
the reader can find what matters without reading a chronology.

- **Research paper:** Keep relevant excerpts or faithful paraphrases from
  inspected papers and useful research notes. Give the citation and a locator
  when available, distinguish quotations from paraphrases and your own
  inference, and note what each can support or qualify. Keep material
  counterevidence alongside the claim it bears on.
- **Code project:** Keep key checks for ongoing or recently completed work:
  the behavior or revision tested, the command or run reference, the observed
  result, and any limit that changes how the result can be used. Link to logs
  or CI runs rather than copying their output.

When an argument, decision, or test result changes, replace or consolidate
the affected entries. Remove duplicates and obsolete evidence from the active
digest. If older material has audit or reproducibility value, leave it in a
durable source, Git revision, or archive and link to it only where needed.
Preserve unique records before pruning. Keep a known gap or unresolved
failure if it still matters.

When drafting from canonical state, read configured `project`, relevant
`evidence`, `SYNC.json`, and applicable `decisions` and `style`. Name controlling
constraints, evidence/source paths, unresolved assumptions, and dependent
artifacts that may become stale. Drafting or revision does not itself make a new
project decision; use the applicable writing, analysis, code, or presentation
guidance for the artifact.
