# Capability model

Runtime state is authoritative. Pi Sych should know enough about active
capabilities to route work intelligently without maintaining a second registry
of the environment.

## Current Pi Sych surface

Pi Sych currently provides `project_status`, `dispatch_worker`, and
`literature_search`. A session may also expose ordinary Pi tools or tools from
other active packages. Pi Sych should not copy their full schemas merely to know
that a relevant capability exists.

Worker tool modes are `read-only`, `edit`, and `full-host`. These names describe
visible Pi tools, not OS sandbox boundaries. Worker context is independent:
`clean` is the default and `trajectory` adds the persisted supervisor branch
immediately before the exact dispatch entry when prior discussion materially
helps.

## Target summary

The planned v7 capability summary should answer only questions useful for
routing work, such as:

- which broad supervisor capabilities are active;
- which optional integrations relevant to the task are actually usable;
- whether local literature discovery is configured;
- which worker capability and context modes Pi Sych can provide; and
- whether a relevant capability is unavailable or degraded.

It should not reproduce credentials, full tool schemas, or every host command.
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

## Questions for the coding agent

Before writing code, inspect current Pi APIs and establish:

1. whether a canonical active-tool/package projection already exists;
2. whether useful capability categories can be derived without importing other
   packages' internal registries;
3. when the summary can be refreshed cheaply and deterministically;
4. how absent versus degraded integrations should be represented; and
5. whether any proposed stored state would become an unnecessary second source
   of truth.
