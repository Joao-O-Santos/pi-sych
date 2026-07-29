#!/usr/bin/env node

import { spawn } from "node:child_process";
import { createRequire } from "node:module";
import { dirname, resolve } from "node:path";
import { homedir } from "node:os";
import { existsSync } from "node:fs";

const require = createRequire(import.meta.url);
const entry = require.resolve("pi-mcporter/dist/index.js");
let current = dirname(dirname(entry));
let root;
while (true) {
  const candidate = resolve(current, "node_modules", "mcporter");
  if (existsSync(resolve(candidate, "dist", "cli.js"))) { root = candidate; break; }
  const parent = dirname(current);
  if (parent === current) throw new Error("pi-mcporter has no resolvable compatible MCPorter CLI");
  current = parent;
}
const configPath = process.env.PI_SYCH_MCPORTER_CONFIG ?? resolve(homedir(), ".config/pi-sych/mcp/mcporter.json");
const child = spawn(process.execPath, [resolve(root, "dist", "cli.js"), "--config", configPath, "auth", "scholar-gateway", ...process.argv.slice(2)], { stdio: "inherit" });
child.once("error", (error) => { process.stderr.write(`${error.message}\n`); process.exitCode = 1; });
child.once("close", (code) => { process.exitCode = code ?? 1; });
