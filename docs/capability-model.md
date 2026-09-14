# Capability model

Runtime state is authoritative. Pi Sych should know enough about active
capabilities to route work intelligently without maintaining a second registry
of the environment.

## Current Pi Sych surface

Pi Sych currently provides `project_status`, `dispatch_worker`, and
`literature_search`. A session may also expose ordinary Pi tools or tools from
other active packages. Pi Sych should not copy their full schemas merely to know
that a relevant capability exists.

Distinguish capabilities already directly visible to the supervisor as
normal active tools from Pi-Sych-owned or conditional state that is
hard to know otherwise. A normal active tool's own schema and
description should generally be enough; do not mechanically summarize
every installed third-party tool merely so Pi Sych can classify it.
The summary focuses on worker modes and context modes, local
literature configuration, remote-research availability and
degradation, optional Pi-Sych integrations, and other genuinely
hidden or conditional capability state.

Worker tool modes are `read-only`, `edit`, and `full-host`. These names describe
visible Pi tools, not OS sandbox boundaries. Worker context is independent:
`clean` is the default and `trajectory` adds the persisted supervisor branch
immediately before the exact dispatch entry when prior discussion materially
helps.

## Injected supervisor summary

At supervisor start, the workbench derives and injects a compact summary from
active session tools plus Pi Sych's local integration inspection. It is useful
for routing, but remains non-authorizing: availability does not grant
permission, credentials, or successful access. The summary answers only
questions useful for routing work, such as:

- which broad supervisor capabilities are active;
- which optional integrations relevant to the task are actually usable;
- whether local literature discovery is configured or degraded (inspection
  does not verify source access or search compatibility);
- which worker capability and context modes Pi Sych can provide; and
- whether a relevant capability is unavailable or degraded.

It should not reproduce credentials, full tool schemas, or every host command.
Capability availability is factual; user preference (durable `STACK.md`
or project `AGENTS.md` conventions) is separate; authorization for
consequential action is separate.
Remote MCPorter state is likewise only inspected/configured; configured servers
and an installed extension do not verify credentials, reachability, or access.
Availability never implies user authorization for a new consequential action.

## Research capabilities as an example

A research task may benefit from several independently owned capabilities:

- local indexed literature for discovery within the user's corpus;
- scholarly metadata/graph services such as OpenAlex or an equivalent;
- peer-reviewed gateways such as Scholar Gateway or an equivalent;
- PDF or full-text readers;
- broad web/search discovery; and
- targeted fetch/browser tools for known pages.

The supervisor should discover which of these are actually active and choose by
function. It should not advertise or invoke a named provider merely because Pi
Sych documentation mentions it.

## Desired properties

A good implementation is truthful, small, mechanically derived, composable,
able to represent degraded capability, and non-authorizing. If Pi already
provides a canonical active-capability projection, reuse it rather than adding a
Pi Sych registry.

## Implemented boundary

The workbench filters the active tool projection against configured tools and
reports only active names. It reports local literature as unavailable,
present-but-unverified, or degraded, and remote worker research as unavailable,
degraded, or configured-but-unverified. The summary is refreshed at each
supervisor start rather than stored as a second registry.

## Historical design questions

Before writing code, inspect current Pi APIs and establish:

1. whether a canonical active-tool/package projection already exists;
2. whether useful capability categories can be derived without importing other
   packages' internal registries;
3. when the summary can be refreshed cheaply and deterministically;
4. how absent versus degraded integrations should be represented; and
5. whether any proposed stored state would become an unnecessary second source
   of truth.
