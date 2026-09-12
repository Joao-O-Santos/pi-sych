# Browser and UI

Choose the least stateful mechanism that can complete the task. Prefer direct or
read-only retrieval when the job is to fetch or inspect information. Use an
interactive browser only when the task genuinely requires rendered state,
authentication, navigation, clicking, typing, downloading, screenshots, or other
UI interaction.

Keep browser work bounded to the named task. Distinguish read-only navigation
from actions that change external state. Before sending, submitting, deleting,
purchasing, publishing, or changing account/project state, follow the user's
explicit approval boundary and the active tool's contract. Do not treat browser
automation as a security sandbox.

When a deterministic local tool can finish work after a download, hand the file
off to it rather than continuing to manipulate structured data through the UI.
Verify the final observable state when possible and report blocked authentication,
CAPTCHAs, permissions, or unsupported interactions plainly.
