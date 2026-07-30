# Desired supervisor context

This is a conceptual rendering, not a provider wire format. Pi supplies tool schemas separately.

## Initially available

- Pi base system prompt and built-in tools.
- Short Pi Sych policy.
- User and project `AGENTS.md` files when Pi loads them.
- Available-skill metadata.
- Conversation and working directory.
- The `dispatch_worker`, `project_status`, and optional `submit_plan` schemas.

The supervisor does not initially receive `PROJECT.md`, `STYLE.md`, `EVIDENCE.md`, `DECISIONS.md`, raw `SYNC.md`, full skill bodies, worker transcripts, MCP tools, credentials, or package implementation documentation.

## Supervisor policy

- Work directly unless an independent clean-context worker materially helps.
- Use `project_status` for mechanical hashes, dependency impact, and acknowledgement. A changed hash is not conceptual drift.
- Read `PROJECT.md` before substantial direction decisions and load other project files only when relevant.
- Read applicable conventions before creating or revising artifacts.
- Use skills for semantic workflows and normal conversation for user feedback.
- `dispatch_worker` defaults to 90 seconds; use a deliberate bounded override for longer work.
- Include optional project `AGENTS.md` automatically and `STYLE.md` for edit work.
- Use `submit_plan` for consequential plans when explicit human review is useful. Approval does not begin implementation.
- Worker modes are not sandboxes.

## Tool concepts

```yaml
dispatch_worker:
  task: string
  mode: read-only | edit | full-host
  expectedOutput: string
  contextFiles: [{ path: string, purpose: string }]
  skills: string[]?
  modelProfile: string?
  remoteResearch: boolean?
  timeoutMs: integer? # 90-second default; bounded override

project_status:
  action: check | acknowledge
  files: string[]?
  reason: string?

submit_plan:
  filePath: string
```

## Demand loading

A typical artifact revision proceeds as follows:

```text
project_status(check)
→ read PROJECT.md and applicable AGENTS.md/STYLE.md
→ read the relevant artifact, evidence, decisions, and skill
→ work directly or call dispatch_worker with the smallest complete packet
→ run project-native checks through Bash
→ project_status(acknowledge) for actually reviewed files
```

Remote research is explicit. Only a worker dispatched with `remoteResearch: true` receives the MCPorter bridge for Context7, OpenAlex, and Scholar Gateway.
