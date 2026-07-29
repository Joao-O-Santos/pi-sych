import assert from "node:assert/strict";
import { lstat, mkdtemp, mkdir, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import { bootstrapWorkerAgentDir } from "../../scripts/bootstrap-worker-agent-dir.mjs";

test("worker bootstrap loads only the worker extension and links credentials", async () => {
  const root = await mkdtemp(join(tmpdir(), "pi-sych-worker-"));
  const agentDir = join(root, "worker");
  const supervisorAgentDir = join(root, "supervisor");
  await mkdir(supervisorAgentDir);
  await writeFile(join(supervisorAgentDir, "auth.json"), "{}\n");
  await writeFile(join(supervisorAgentDir, "models-store.json"), "{}\n");

  const result = await bootstrapWorkerAgentDir({ agentDir, packageRoot: process.cwd(), supervisorAgentDir });
  const settings = JSON.parse(await readFile(join(agentDir, "settings.json"), "utf8"));
  const mcporter = JSON.parse(await readFile(join(agentDir, "mcporter.json"), "utf8"));

  assert.deepEqual(settings.packages, []);
  assert.deepEqual(settings.extensions, [join(process.cwd(), "extensions/worker/index.ts")]);
  assert.deepEqual(settings.skills, []);
  assert.deepEqual(mcporter, { version: 1, defaultExposure: "index", callTimeoutMs: 60000, discoveryTimeoutMs: 3000, maxMatchedTools: 5, servers: { context7: { exposure: "index" }, openalex: { exposure: "index" }, "scholar-gateway": { exposure: "index" } } });
  assert.equal(result.linked["auth.json"], true);
  assert.equal(result.linked["models.json"], false);
  assert.equal(result.linked["models-store.json"], true);
  assert.equal((await lstat(join(agentDir, "auth.json"))).isSymbolicLink(), true);
});
