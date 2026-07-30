---
name: revealjs-slides
description: Build concise Reveal.js slides with Pandoc or Quarto, opinionated visual defaults, and explicit render verification.
---

# Reveal.js slides

Use the general workflow. Prefer one communicative idea per slide, visual
hierarchy, and speaker-appropriate detail rather than paragraph walls. Do not
create a separate slide-workflow engine. Style overrides follow
`style-application` precedence; venue or accessibility requirements may further
constrain the deck.

## Rendering

- Prefer **Pandoc** Markdown to Reveal.js when Pandoc is available.
- Prefer a **Quarto** route when the talk is statistically heavy, needs
  executable code cells, the project already uses Quarto, and Quarto is
  available.
- If neither renderer is available, prepare source and report the missing tool;
  never claim a deck rendered when it did not.
- After a successful render, check that figures, code, citations, and
  incremental reveals appear as intended.

## Package visual defaults

Unless a stronger source in the `style-application` order says otherwise:

- Reveal theme: `white`
- Transition: `none`
- Aspect: `16:9`
- Incremental reveals: minimal; enable only when the spoken point needs it
- Slide titles: level-one headings (`#` / `h1`)
- Title-block `date` may hold conference name, contact, or other title-page
  metadata when that improves the title slide
- CSS baseline: **copy** the packaged `templates/revealjs-baseline.css` into a
  project-local path (for example `slides/revealjs-baseline.css`) and reference
  that actual path from deck metadata or `STYLE.md`. Do not link a non-existent
  package-relative path after install, and do not claim the baseline is active
  until it is copied and loaded.
- Prefer `standalone: true`. Use `embed-resources: true` when a single-file deck
  helps distribution and the toolchain supports it.

Do not copy personal talk assets, logos, or private theme files into a project
unless the user explicitly provides them.

## Delivery checks

- Speaker notes or a rehearsal outline exist when the talk needs them.
- Timing fits the slot; cut slides before shrinking type to unreadability.
- Figures have readable labels; contrast and alt text or spoken equivalents
  cover essential visual content.
- With the baseline CSS and `h1` titles, capitalization is ordinary rather than
  forced small-caps/all-caps.

## Use with

Pair with `writing-core` for claim clarity and `style-application` for
precedence. Use `r-quarto` when the deck embeds analysis. Use `verification` or
`verify-change` against the actual render command.

## Optional user examples

If `~/.config/pi/skills/revealjs-slides/examples.md` exists, read it before applying this skill. Use it as illustrative preference, not as evidence or project requirements.
