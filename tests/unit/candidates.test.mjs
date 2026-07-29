import assert from "node:assert/strict";
import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import {
  applyCandidate,
  buildArtifactProjectCandidate,
  buildGreenfieldCandidate,
  buildOutlineCandidate,
  buildSectionCandidate,
  buildSyncCandidate,
  formatCandidateReview,
  nextGreenfieldQuestion,
} from "../../.test-build/workbench/src/candidates.js";

test("greenfield interview asks only its next focused question and leaves gaps unresolved", () => {
  assert.equal(nextGreenfieldQuestion({}), "What is the immediate objective of this project?");
  assert.equal(nextGreenfieldQuestion({ objective: "Build a brief." }), "Who will use or evaluate the result?");
  const candidate = buildGreenfieldCandidate({ objective: "Build a brief.", audience: "A collaborator." });
  assert.equal(candidate.requiresApproval, true);
  assert.equal(candidate.statements.find((statement) => statement.group === "project objective").label, "explicit");
  assert.equal(candidate.statements.find((statement) => statement.group === "intended contribution").label, "unresolved");
  assert.match(candidate.files.find((file) => file.path === "PROJECT.md").content, /\[explicit\] Build a brief\./);
  assert.match(candidate.files.find((file) => file.path === "PROJECT.md").content, /\[unresolved\] Confirm intended contribution\./);
});

test("existing manuscript produces observations, bounded inference, and open questions", async () => {
  const markdown = await readFile("fixtures/stage3-manuscript/manuscript.md", "utf8");
  const candidate = buildArtifactProjectCandidate("manuscript.md", markdown);
  assert.deepEqual(candidate.statements.filter((statement) => statement.label === "explicit").map((statement) => statement.group), ["artifact identity", "artifact structure"]);
  assert.equal(candidate.statements.find((statement) => statement.group === "main artifact").label, "inferred");
  assert.equal(candidate.statements.find((statement) => statement.group === "objective").label, "unresolved");
  const review = formatCandidateReview(candidate);
  assert.match(review, /No durable file will be written until explicit approval/);
  assert.match(review, /```[\s\S]*# Project[\s\S]*```/);
});

test("canonical files produce a coherent outline candidate with stated evidence and uncertainty", () => {
  const candidate = buildOutlineCandidate("# Project\n\n## Objective\n\nA test\n", "# Evidence\n\n## E-001 — Support\n");
  assert.match(candidate.files[0].content, /Purpose and audience/);
  assert.match(formatCandidateReview(candidate), /E-001/);
  assert.equal(candidate.statements.find((statement) => statement.group === "artifact scope").label, "unresolved");
});

test("canonical files produce a bounded section candidate with no unsupported prose", () => {
  const candidate = buildSectionCandidate("Introduction", "# Project\n\n## Objective\n\nA test\n", "# Evidence\n\n## E-001 — Support\n");
  assert.match(candidate.files[0].content, /^# Introduction/m);
  assert.match(candidate.files[0].content, /\[unresolved\] Add only claims supported/);
  assert.match(formatCandidateReview(candidate), /Cite only relevant evidence entries: E-001/);
});

test("candidate writes require approval and refuse project-root escape", async () => {
  const root = await mkdtemp(join(tmpdir(), "pi-sych-candidate-"));
  const candidate = buildGreenfieldCandidate({ objective: "Only after approval." });
  await assert.rejects(applyCandidate(root, candidate, false), /explicit approval/);
  await assert.rejects(readFile(join(root, "PROJECT.md")), /ENOENT/);
  const written = await applyCandidate(root, candidate, true);
  assert.deepEqual(written.map((path) => path.slice(root.length + 1)), ["PROJECT.md", "EVIDENCE.md"]);
  assert.match(await readFile(join(root, "PROJECT.md"), "utf8"), /Only after approval/);
  await assert.rejects(applyCandidate(root, { ...candidate, files: [{ path: "../outside.md", content: "no", purpose: "bad" }] }, true), /leaves the project root/);
});

test("sync candidate is reviewable and fingerprints observed existing files", async () => {
  const root = await mkdtemp(join(tmpdir(), "pi-sych-sync-candidate-"));
  await writeFile(join(root, "PROJECT.md"), "# Project\n\n## Objective\nX\n## Current direction\nY\n## Definition of done\nZ\n");
  await writeFile(join(root, "EVIDENCE.md"), "# Evidence\n");
  await writeFile(join(root, "TODO.md"), "# Tasks\n");
  const candidate = await buildSyncCandidate(root);
  assert.equal(candidate.files[0].path, "SYNC.md");
  assert.match(candidate.files[0].content, /"PROJECT\.md"/);
  assert.match(candidate.files[0].content, /"EVIDENCE\.md"/);
  assert.match(candidate.files[0].content, /"TODO\.md"/);
  assert.match(candidate.files[0].content, /"role": "tasks"/);
  assert.match(candidate.files[0].content, /"task-state"/);
  assert.match(formatCandidateReview(candidate), /Confirm each proposed authority domain/);
});
