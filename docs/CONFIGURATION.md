# Configuration

Pi Sych keeps credentials, providers, model ranking, and personal skill
customization outside the public package.

## Worker models

Create `~/.config/pi/pi-sych/models.json` with ranked private profiles:

``` json
{
  "models": {
    "strong-reviewer": {
      "ref": "provider/model",
      "strength": "deep",
      "suitableFor": ["methods review", "architecture review"]
    }
  },
  "profiles": {
    "default": ["strong-reviewer"],
    "review": ["strong-reviewer"]
  }
}
```

`dispatch_worker` selects the first model in its requested profile and
defaults to 90 seconds. `PI_SYCH_MODEL_CATALOG` selects another catalog;
`PI_SYCH_MODEL_PROFILES` supplies a direct JSON override for automation;
and `PI_SYCH_WORKER_AGENT_DIR` selects the worker runtime directory.

## Skill customization

Pi Sych exposes six umbrella skills. To customize examples durably, copy
one umbrella directory into either:

``` text
~/.pi/agent/skills/
.pi/skills/
.agents/skills/
```

For named worker selection, `.pi/skills/` wins over `.agents/skills/`,
which wins over user and packaged skills. Edit its
`modules/*/examples.md` files. Leave `guidance.md` intact unless you
intentionally want to change behavioral guidance. User or project skills
can add language- and framework-specific specialization without
modifying Pi Sych.

## Optional integrations

Plannotator is a runtime dependency but Pi Sych loads only its
documented lazy browser helpers. `submit_plan` falls back to file review
when those helpers cannot start. Do not separately enable Plannotator's
extension or plan mode for Pi Sych.

Set `remoteResearch: true` only for an assigned worker call. It receives
MCPorter and explicit private configuration; ordinary workers do not.
`PI_SYCH_MCPORTER_CONFIG` otherwise defaults to
`~/.config/pi-sych/mcp/mcporter.json`. `/pi-sych-mcp` reports diagnostic
status without printing credentials.
