# Optional STACK.md design

Status: accepted as an optional user-maintained file. `STACK.md`
describes durable facts and conventions about the user's
computer/environment, especially for automation and computer-use tasks.
Automation skills look for it when such knowledge matters; its absence
changes nothing.

`STACK.md` is user-defined and user-local. The recommended location is
`~/.pi/agent/STACK.md`, alongside Pi's global instructions. Pi Sych does
not currently auto-load or parse this file. Automation instructions may
inspect the conventional path when it exists. Workers do not inherit it
automatically; pass it as explicit context when relevant.

It may name the user's actual applications and tools because it is
configuration, unlike public Pi Sych semantic guidance, which must stay
provider-independent.

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
Do not use this file for project software requirements or workflows;
those belong in `AGENTS.md` and/or `PROJECT.md`.

Do not use this file for approval, privacy, security, or authorization
rules. Put those in the applicable user or project instruction
mechanism.

## Boundary

`STACK.md` must never create a capability the runtime does not expose,
assert that credentials or network access work, override a current
explicit user instruction, serve as a security policy, contain secrets,
or duplicate tool schemas/package state. Runtime availability is a
factual constraint: a stale preference cannot make a missing tool
exist. Current explicit user instructions and accepted project
constraints govern choices among the available options.

## Loading and precedence

Pi's normal context discovery loads `AGENTS.md`, not `STACK.md`. Keep
the optional stack file outside automatic context loading unless the
user or a relevant instruction explicitly supplies it. Automation
skills should look for it only when computer use, tool choice, or
local-software knowledge makes it relevant; do not load it into
unrelated writing, research, or theory work. Current explicit
instructions outrank accepted project constraints, which outrank
machine preferences.
