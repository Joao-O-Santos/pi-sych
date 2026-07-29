import assert from "node:assert/strict";
import test from "node:test";

import { buildRetrospectiveProposal } from "../../.test-build/workbench/src/retrospective.js";

test("retrospective proposal preserves actual observations, verification, limitations, and approval gate", () => {
  const proposal = buildRetrospectiveProposal({
    taskId: "task-1",
    objective: "Run a real package check",
    outcome: "complete",
    observations: ["The package loaded."],
    verified: ["npm test exited 0."],
    limitations: ["No external sandbox was tested."],
    proposedChanges: ["Keep the current package boundary."],
  });
  assert.equal(proposal.requiresApproval, true);
  assert.match(proposal.content, /npm test exited 0/);
  assert.match(proposal.content, /No external sandbox was tested/);
  assert.match(proposal.content, /proposal\. It must be reviewed/);
  assert.throws(() => buildRetrospectiveProposal({ objective: "", outcome: "complete", observations: [], verified: [], limitations: [], proposedChanges: [] }), /objective/);
});
