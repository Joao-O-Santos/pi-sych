# Retrospective examples

Bad:

> Add “always inspect requirements first” to shared `agents` after one late
> discovery.

Better:

> Evidence: two review prompts missed explicit requirements. Target:
> `review` task selection. Proposed effect: the reviewer identifies controlling
> requirements before judging generic quality. Alternative: the worker packet,
> not the skill, omitted the files. Regression risk: routine reviews become
> ceremonial or overlong. Held-in: rerun the two motivating cases. Held-out:
> test a small review with complete requirements and a case where no formal
> requirements exist. Ask the owner to accept, modify, defer, or reject the
> smallest local change; do not apply it automatically.

Why: motivating cases show whether a proposal addresses the observed failure;
held-out cases test generalization and protect behavior that already worked.
