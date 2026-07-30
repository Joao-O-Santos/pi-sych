---
name: writing-core
description: Develop clear, audience-aware writing through argument-first planning, opinionated prose defaults, and revision rather than formulaic rules.
---

# Writing core

Treat writing as thinking. Before polishing sentences, identify the reader, the
artifact's job, the central claim or decision, the evidence available, and what
remains uncertain. Match voice, format, citation practice, and amount of
explanation to the genre and audience; do not impose academic conventions on
work that does not need them. Style overrides follow `style-application`
precedence.

## Argument before prose

Use writing-workshop practices associated with Barbara Sarnecka when they help:

1. Build a **topic-sentence outline**: one provisional claim per planned
   paragraph, arranged so each claim makes the next necessary.
2. In a messy draft, make a **reverse outline**: state what each existing
   paragraph actually does, then reorder, merge, cut, or split before line
   editing.
3. Give most substantive paragraphs one job: a **claim**, the **support**
   (reasoning or evidence), and a **consequence** or transition. Short bridge
   paragraphs, dialogue, and intentional fragments remain valid when they serve
   the reader.
4. Draft for reasoning first; revise global structure before paragraph logic,
   information flow, sentences, and word choice.

Use concrete examples or small scenarios when they make an abstract claim
legible. Keep topic sentences specific enough to be testable against the
paragraph that follows. Preserve uncertainty markers, verified citations, and
placeholders.

## Package prose defaults

Unless a stronger source in the `style-application` order says otherwise:

- Hard-wrap prose Markdown at **72 columns**. Do not hard-wrap code fences,
  tables, headings that must remain one line, or URLs that cannot break safely.
- Prefer explicit topic sentences and signposting where they reduce reader
  memory load.
- Prefer concise concrete wording over throat-clearing and empty
  nominalizations.
- Prefer titles that foreground a surprising or consequential intellectual move
  without clickbait or false promise.

These are defaults, not universal laws. Genre, accessibility needs, venue
rules, and authorial voice may override them. Record durable overrides in
project `STYLE.md` rather than re-arguing them each session.

### Mechanical wrapping

When a mechanical wrap helps and **Pandoc is installed**, prefer Pandoc’s own
Markdown writer (not GFM), with pipe tables kept and grid/simple/multiline
tables disabled:

```sh
pandoc FILE.md \
  -f markdown \
  -t markdown+pipe_tables-simple_tables-multiline_tables-grid_tables \
  --wrap=auto --columns=72 \
  -o FILE.md
```

That path reflows prose while remaining in Pandoc Markdown. Residual limits: it
may realign pipe-table separators, break links across lines, or insert a space
after fence markers. Inspect the diff before keeping it. Avoid bare
`pandoc -t markdown`, which often rewrites tables into grid form.

Other options: dprint (extra install; may realign tables), Prettier (may rewrite
fences/tables), or an editor `textwidth` / format-paragraph pass.

Do not add a Markdown formatter dependency to this package solely for wrapping.
Do not claim a formatter check was applied unless it was run and its diff was
inspected.

## Sentence decisions

Prefer familiar information before new information, place the main action early
when that reduces reader memory load, and put longer or more complex material
later when useful. Prefer concrete verbs and nouns over empty nominalizations.
Remove filler and double negatives only when doing so preserves meaning and
rhythm.

Do not treat active voice as a universal improvement. Following Geoffrey K.
Pullum's critique of blanket anti-passive advice, choose voice by information
focus: passive when the acted-on entity, event, or method should occupy
attention, or when the actor is obvious, irrelevant, or unknown; active when a
specific actor's agency matters. Repair repeated agentless passives only when
they hide who did what.

## Use with

Use `style-application` after the argument and structure are sound. Use
`style-calibration` before proposing durable project style rules, and pair a
genre skill such as `scholarly-manuscript`, `book-and-tutorial`, or
`revealjs-slides` with this general writing guidance. Use `review-copyedit` for
a bounded sentence-level pass.

## Optional user examples

If `~/.config/pi/skills/writing-core/examples.md` exists, read it before applying this skill. Use it as illustrative preference, not as evidence or project requirements.
