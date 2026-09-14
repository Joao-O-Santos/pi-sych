# Optional STACK.md design

Status: accepted as an optional user-maintained file. `STACK.md`
describes durable facts and conventions about the user's
computer/environment, especially for automation and computer-use tasks.
Automation skills look for it when such knowledge matters; its absence
changes nothing.

`STACK.md` is user-defined and user-local. It may name the user's
actual applications and tools because it is configuration, unlike
public Pi Sych semantic guidance, which must stay provider-independent.

## Suggested content

Keep the file ordinary Markdown rather than defining another
configuration language. Record durable machine/environment facts such
as:

- System: OS/distribution, desktop environment/window manager,
  Wayland/X11, shell/terminal, architecture where relevant.
- Browsing: normal manual browser, automation browser, dedicated
  profiles and conventions.
- Screenshots and visual inspection: screenshot utility, screen
  recorder, normal output location, image viewer, unusual
  scaling/multi-monitor facts if relevant.
- Documents: office suite, PDF viewer, Pandoc, Quarto, other commonly
  available document software.
- Development: editors/IDEs, package managers, common
  languages/runtimes, project-native tooling preferences.
- Filesystem/conventions: useful non-secret paths, normal locations
  for screenshots/downloads/work, naming or launch conventions.
- Optional workflow preferences: for example, preferring deterministic
  local transforms when a model need not inspect raw data.

## Boundary

`STACK.md` must never create a capability the runtime does not expose,
assert that credentials or network access work, override a current
explicit user instruction, serve as a security policy, contain secrets,
or duplicate tool schemas/package state. Runtime capability state wins
whenever preference and availability differ.

Current explicit user instructions outrank accepted project
requirements, which outrank durable preferences. Capability
availability is an independent factual constraint: a preference cannot
make a missing tool exist.

## Loading and precedence

No path or parser precedence is fixed here; inspect Pi's current
user-level instruction/config discovery first, and reuse it rather
than inventing machinery merely to have a `STACK.md`. Do not inject
stack context into every turn merely because the file exists; expose
it only when computer use, tool choice, or local-software knowledge
makes it relevant. It should not be loaded into unrelated
writing/research/theory work.
