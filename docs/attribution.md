# Attribution and intellectual influences

Pi Sych is distributed under the repository's MIT `LICENSE`. This file
records the known direct influences identified in project history, the
owner's source inventory, and the current package design. It also
separates intellectual influence from host platforms, integrations, and
first-party material. Pi Sych does not include or relicense source text
or code from the works and projects cited below unless a file says
otherwise.

## Writing and reasoning methods

### Prose

Barbara W. Sarnecka's *The Writing Workshop: Write More, Write Better,
Be Happier in Academia*, second edition (2021), informs the
topic-sentence and reverse-outline practices, paragraph jobs,
familiar-to-new information flow, end-weight, concrete wording,
global-to-local revision, and defeasible rather than absolute writing
rules.

- Sarnecka, B. W. (2021). *The Writing Workshop: Write More, Write
  Better, Be Happier in Academia* (2nd ed.).
  <https://doi.org/10.31219/osf.io/5qcdh>

Geoffrey K. Pullum's critiques of mechanical grammar advice inform Pi
Sych's accurate diagnosis of grammatical passives, rejection of blanket
active-voice rules, and treatment of passive voice as a choice about
topic, information structure, and agency. The package does not infer a
passive from a form of *be* alone and does not treat every agentless
passive as a defect.

- Pullum, G. K. (2009, April 17). "50 Years of Stupid Grammar Advice."
  *The Chronicle of Higher Education*, 55(32).
  <https://www.research.ed.ac.uk/en/publications/50-years-of-stupid-grammar-advice/>
- Pullum, G. K. (2010). "The Land of the Free and *The Elements of
  Style*." *English Today*, 26(2), 34--44.
  <https://doi.org/10.1017/S0266078410000076>
- Pullum, G. K. (2014). "Fear and Loathing of the English Passive."
  *Language & Communication*, 37, 60--74.
  <https://doi.org/10.1016/j.langcom.2013.08.009>

These sources support strong but defeasible defaults. They do not make
every other prose recommendation a claim attributable to Sarnecka or
Pullum.

### Hypothesis generation and perspectivism

William J. McGuire's perspectivist approach informs the deliberate
generation of multiple accounts, contrary cases, scope and moderator
questions, rival mechanisms, and observations that discriminate them.
His heuristic catalogue is the source for the compact transformations in
the shared `hypothesis-generation` method. Pi Sych keeps generation
distinct from support: a heuristic can produce a candidate but cannot
make it evidentially supported.

- McGuire, W. J. (1989). "A Perspectivist Approach to the Strategic
  Planning of Programmatic Scientific Research." In B. Gholson, W. R.
  Shadish Jr., R. A. Neimeyer, and A. C. Houts (Eds.), *Psychology of
  Science: Contributions to Metascience* (pp. 214--245). Cambridge
  University Press.
- McGuire, W. J. (1997). "Creative Hypothesis Generating in Psychology:
  Some Useful Heuristics." *Annual Review of Psychology*, 48, 1--30.
  <https://doi.org/10.1146/annurev.psych.48.1.1>

Pi Sych uses a compact practical subset: contrary cases, reversed
causation, moderators, multiple accounts, counterforces, deviant cases,
conflict reconciliation, extreme conditions, re-operationalization,
decomposition, restatement, analogy, and discriminating study sequences.

Tom Zahavy's position paper informs a narrower grounding safeguard: a
language model may diversify, formalize, compare, analyze scope, and
propose discriminating tests for candidate hypotheses, but it must not
invent the sensory, experiential, empirical, or literature material that
supposedly motivated them. Pi Sych adopts this operational risk, not the
paper's stronger conclusion that present LLMs are structurally incapable
of an abductive scientific jump.

- Zahavy, T. (2026). "Position: LLMs can't jump." *Proceedings of the
  43rd International Conference on Machine Learning*, PMLR 306.

### Argument and claim analysis

The argument-analysis and claim-evidence methods consolidate procedures
from Pi Sych's earlier theoretical, empirical, review, research, and
analysis guidance. They do not adopt or reproduce one external formal
system. McGuire's perspectivism also informs their attention to serious
rivals and discriminating implications, but claim-to-artifact provenance
and the premise/inference/scope distinctions are first-party syntheses
rather than an attribution to McGuire alone.

## Package and harness design

Three owner-supplied references inform the package's view that model
behavior depends on the deployment harness and on the quality of
task-specific context, not only on base-model capability.

- Weng, L. (2026, July 4). "Harness Engineering for Self-Improvement."
  *Lil'Log*. <https://lilianweng.github.io/posts/2026-07-04-harness/>

  Weng's account informs the treatment of context, tools, action,
  artifacts, and evaluation as behaviorally material parts of a model's
  deployment system. Pi Sych applies that lesson through explicit
  project files, bounded context packets, short-lived workers, and
  visible verification boundaries. Regression-aware retrospective
  proposals name the targeted component and predicted effect, then
  separate motivating cases from held-out checks. Pi Sych does not
  implement recursive self-improvement or autonomous prompt mutation.

- Goedecke, S. (2026, July 24). "LLMs reward expertise."
  <https://www.seangoedecke.com/llms-reward-expertise/>

  Goedecke's argument informs the decision to spend skill context on
  domain distinctions and model-specific failure modes rather than
  generic advice a capable model already follows.

- OpenAI. (2026). "How two settings tripled our ARC-AGI-3 scores."
  <https://openai.com/index/how-two-settings-tripled-our-arc-agi-3-scores/>

  The reported effects of retained reasoning and compaction inform Pi
  Sych's attention to working-memory continuity, compaction, token use,
  and harness-sensitive evaluation. This citation does not claim that Pi
  Sych reproduces OpenAI's settings, benchmark, or reported results.

## Retrospective workflow inspirations

Three public projects inspired the narrow, cautious retrospective
proposal format used in Pi Sych's project guidance:

- [Lynskylate/agent-md-management](https://github.com/Lynskylate/agent-md-management),
  which provides tools for reviewing and improving `AGENTS.md` files;
- [BayramAnnakov/claude-reflect](https://github.com/BayramAnnakov/claude-reflect),
  which captures feedback and proposes updates to Claude workflow files;
  and
- [jo-inc/pi-reflect](https://github.com/jo-inc/pi-reflect), which
  analyzes session history for proposed behavioral-file revisions.

Pi Sych adopts only the idea that retrospective lessons can be proposed
for human review. It does not copy their code, install their hooks, mine
unattended transcripts, or adopt automatic edits or commits.

## Platforms, integrations, and first-party material

[Pi](https://pi.dev/) is the host platform and extension system for Pi
Sych. The package currently targets the
[`earendil-works/pi`](https://github.com/earendil-works/pi) distribution
of Mario Zechner's Pi coding agent. The project also grew out of the
author's move from [OpenCode](https://opencode.ai/) to Pi; that is
experiential lineage, not a code or API dependency.

[pi-mcporter](https://github.com/mavam/pi-mcporter) and its
[MCPorter](https://github.com/openclaw/mcporter) runtime provide the
optional remote-research bridge.
[Plannotator](https://github.com/backnotprop/plannotator) provides
browser annotation and code-review interfaces. These are dependencies or
integrations, not sources for the writing and reasoning methods. Their
own licenses govern their packages.

`templates/revealjs-baseline.css` is adapted from the Pi Sych author's
own talk styles, not third-party CSS. The argument-analysis and
claim-evidence methods likewise preserve first-party lineage from
earlier Pi Sych guidance.

## Limits

Attribution records influence, not correctness or universal authority.
It does not establish that a local edit, hypothesis, argument, citation,
or harness choice is sound. Inspect the original source before making
precise historical, bibliographic, or empirical claims.
