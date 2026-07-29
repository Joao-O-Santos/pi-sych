# Pi Sych

Pi Sych is a Pi package for people doing serious writing, research, analysis, and code—not a machine for producing plausible-looking text.

It keeps a project’s decisions and evidence visible in files, gives workers only the context they need, records what checks actually happened, and stops consequential changes for human review. You remain responsible for the argument, data, citations, and final text.

## What it helps with

- Keep a short, reviewable project record in `PROJECT.md`, `EVIDENCE.md`, and `SYNC.md`.
- Notice when those files or their declared dependents have drifted.
- Delegate a bounded review, research, or implementation task without handing a worker the whole conversation.
- Record actual verification commands, exit codes, output, and changed files.
- Use Plannotator for explicit human review of consequential plans or local text.

Pi Sych does **not** make model output evidence, approve its own changes, verify citations it has not checked, or replace a line-by-line final human review.

## Start

Install the public package with Pi:

```sh
pi install npm:pi-sych
```

For local development, load `/path/to/pi-sych` as a package instead. Pi Sych already declares its Plannotator dependency; do **not** add Plannotator separately as a Pi extension.

```json
{
  "packages": [{
    "source": "/path/to/pi-sych",
    "extensions": ["extensions/workbench/index.ts"],
    "skills": ["skills"],
    "prompts": [],
    "themes": []
  }]
}
```

For delegated workers, create their isolated Pi profile once:

```sh
node scripts/bootstrap-worker-agent-dir.mjs \
  --agent-dir ~/.cache/pi/pi-sych/worker-agent \
  --package-root /path/to/pi-sych \
  --supervisor-agent-dir ~/.config/pi
```

If you use workers, add your own model ranking at `~/.config/pi/pi-sych/models.json`. Advanced worker, model, skill-example, and remote-research configuration is in `docs/CONFIGURATION.md`.

## Normal workflow

1. Start with `/pi-sych-init` for a new project, or `/pi-sych-init path/to/artifact` for existing work.
2. Check `/pi-sych-status`; use `/pi-sych-drift` when the project files disagree.
3. Let the supervisor work directly for small tasks or dispatch a bounded worker when an independent context is useful.
4. For consequential changes—central claims, architecture, publication, deployment, irreversible changes, or substantive synchronization—review a concise plan with `submit_plan` before applying anything.
5. Run meaningful executable checks through `pi_sych_verify` or an explicit dispatch verification contract.
6. Review changed dependents and refresh `SYNC.md` only after you decide what is correct.

Executable verification is optional. Many scientific-writing judgments require source checking or expert human review rather than a command. When a dispatch includes exact verification commands, the supervisor runs those commands after the worker submits its result and reports failures separately.

Workers receive an objective, exact inputs, selected skills, expected output, intended write paths, and any declared supervisor verification contract. They do not receive the supervisor conversation.

For Git work, the included `git-workflow` skill defaults to direct work on `main`, atomic verified commits, and explicit approval for remote or history-changing operations. A repository’s established commit convention takes precedence.

## Human review is not optional

Use `submit_plan` for approval-gated plans. It opens a browser review and waits for an explicit decision; opening or closing the browser is not approval. Use `/plannotator-annotate <file>` for a project-local file or `/plannotator-last` for the last assistant message.

Before submitting, publishing, deploying, or relying on generated work, a human must review:

- every sentence for accuracy and intended meaning;
- every citation, quotation, source claim, and interpretation against the original source;
- every numerical result, table, figure, code path, and command result that matters;
- every declaration about authorship, ethics, conflicts, data, code, permissions, or exclusivity.

If a claim, citation, result, or decision cannot be checked, mark it as unresolved rather than letting polished language hide the gap.

## SECURITY WARNING

Pi Sych is **alpha software**. It was developed with substantial AI assistance (including vibe-coded work). Its maintainer is experienced with R, Git/GitLab, Linux, and scientific writing, but is not a TypeScript or Node.js specialist. Read the code, inspect dependencies, and report problems; do not treat this disclosure as a guarantee of safety or quality.

Pi Sych is not a sandbox. Worker modes limit visible Pi tools, not operating-system permissions. `full-host` workers and configured remote tools run with the Pi process’s permissions; use external containment when that matters. Pi’s [security](https://pi.dev/docs/latest/security) and [containerization](https://pi.dev/docs/latest/containerization) guidance describe the relevant trust boundary and external isolation options.

Remote results, model output, browser opening, and passing a candidate to a tool are not evidence or approval. `intendedWritePaths` report task scope and unexpected mutations after the fact; they do not prevent host changes.

### Known upstream issue

Pi `0.82.1` currently carries `brace-expansion@5.0.7` through its nested `minimatch` dependency. npm identifies it as a high-severity memory-exhaustion denial-of-service advisory; Pi Sych does not introduce or directly expose that dependency. The patched `brace-expansion@5.0.8` exists, but Pi must update its nested resolution. Treat untrusted glob or brace-pattern input cautiously until an upstream Pi update resolves it.

## For maintainers

- `ARCHITECTURE.md` — implemented technical map
- `docs/CONFIGURATION.md` — advanced configuration
- `docs/DEVELOPMENT.md` — checks and contribution constraints
