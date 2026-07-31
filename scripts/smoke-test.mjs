#!/usr/bin/env node

import { spawnSync } from "node:child_process";

const result = spawnSync(process.execPath, ["--test", "tests/integration/package-load.test.mjs"], {
	cwd: process.cwd(),
	encoding: "utf8",
	stdio: "inherit",
	env: { ...process.env, PI_OFFLINE: "1" },
});

if (result.error) throw result.error;
process.exitCode = result.status ?? 1;
