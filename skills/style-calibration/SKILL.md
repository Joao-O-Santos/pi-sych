---
name: style-calibration
description: Infer evidence-backed, reviewable style rules from gold, silver, negative, and held-out examples.
---

# Style calibration

Compare gold, silver, and negative examples rather than copying phrases. Separate voice from subject vocabulary and beliefs. Propose rules in `STYLE.proposed.md`; each rule must state priority (`required`, `preferred`, `acceptable`, or `avoid`), confidence, evidence, and exceptions.

Test rules on held-out content and report drift with local fixes. Do not infer durable rules from a single accidental example. Do not alter durable project or personal style without approval.

## Optional user examples

If `~/.config/pi/skills/style-calibration/examples.md` exists, read it before applying this skill. Use it as illustrative preference, not as evidence or project requirements.
