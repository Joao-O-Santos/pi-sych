import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { chmod, copyFile, mkdir, mkdtemp, readFile, rm, stat, writeFile } from "node:fs/promises";
import { homedir, tmpdir } from "node:os";
import { join, resolve } from "node:path";
import test from "node:test";

const enabled = process.env.PI_SYCH_COMPACTION_SOAK === "1";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
function knob(name, fallback, min, max) {
	const value = process.env[name] === undefined ? fallback : Number(process.env[name]);
	if (!Number.isSafeInteger(value) || value < min || value > max)
		throw new Error(`Invalid ${name}: expected integer ${min}..${max}`);
	return value;
}

test("real workhorse automatic-compaction soak", {
	skip: enabled ? false : "set PI_SYCH_COMPACTION_SOAK=1 (paid real-model run)",
	timeout: 510_000,
}, async () => {
	const started = Date.now();
	const reportPath = resolve(
		process.env.PI_SYCH_SOAK_REPORT ??
			join(tmpdir(), `pi-sych-compaction-soak-${started}-${process.pid}.json`),
	);
	const report = {
		version: 1,
		started: new Date(started).toISOString(),
		attempts: [],
		batches: [],
		customFailureNotices: 0,
		limitations: [
			"Native fallback may hide a custom model failure; native success is not custom success.",
			"Reported usage is Pi-observable usage and may omit custom compactor calls.",
		],
	};
	let root,
		child,
		closed,
		deadlineTimer,
		timedOut = false,
		failure,
		events;
	const collectAttempts = async () => {
		const records = (await readFile(events, "utf8").catch(() => ""))
			.split("\n")
			.filter(Boolean)
			.map(JSON.parse);
		report.attempts = [];
		for (const e of records) {
			if (e.type === "before")
				report.attempts.push({
					startedAt: e.at,
					reason: e.reason,
					tokensBefore: e.tokensBefore,
					result: "incomplete",
				});
			if (e.type === "success" || e.type === "failed") {
				const attempt = [...report.attempts].reverse().find((a) => a.result === "incomplete");
				if (attempt)
					Object.assign(attempt, {
						durationMs: e.at - attempt.startedAt,
						result:
							e.type === "failed"
								? e.aborted
									? "cancelled"
									: "failed"
								: e.fromExtension === true && e.fromHook === true
									? "custom"
									: "native_fallback",
						usage: e.usage,
						summaryCharacters: e.summaryCharacters,
						mentionsAudit: e.mentionsAudit,
						mentionsBothSurveys: e.mentionsBothSurveys,
					});
			}
		}
		return records;
	};
	const kill = (signal) => {
		if (child?.pid) {
			try {
				process.kill(-child.pid, signal);
			} catch (e) {
				if (e.code !== "ESRCH") throw e;
			}
		}
	};
	try {
		const threshold = knob("PI_SYCH_SOAK_THRESHOLD", 32000, 1000, 50000);
		const target = knob("PI_SYCH_SOAK_TARGET", 3, 2, 3);
		const maxBatches = knob("PI_SYCH_SOAK_BATCHES", 8, 2, 8);
		const wallMs = knob("PI_SYCH_SOAK_SECONDS", 480, 30, 480) * 1000;
		Object.assign(report, { threshold, target, maxBatches, wallMs });
		// Match config-directory.ts precedence. Never disclose the catalog content.
		const configRoot = process.env.PI_CODING_AGENT_DIR
			? resolve(process.env.PI_CODING_AGENT_DIR)
			: process.env.XDG_CONFIG_HOME
				? resolve(process.env.XDG_CONFIG_HOME, "pi")
				: existsSync(join(homedir(), ".config/pi"))
					? join(homedir(), ".config/pi")
					: join(homedir(), ".pi");
		const catalog = JSON.parse(
			await readFile(join(configRoot, "pi-sych/worker-models.json"), "utf8"),
		);
		const selector = catalog.models?.workhorse?.model;
		if (typeof selector !== "string" || !selector.includes("/"))
			throw new Error("Missing workhorse provider/model in private worker-models.json");
		const slash = selector.indexOf("/"),
			provider = selector.slice(0, slash),
			model = selector.slice(slash + 1);
		if (!provider || !model) throw new Error("Invalid workhorse model selector");
		Object.assign(report, { provider, model });
		root = await mkdtemp(join(tmpdir(), "pi-sych-soak-"));
		const workspace = join(root, "workspace"),
			agent = join(root, "agent");
		events = join(root, "events.jsonl");
		await mkdir(join(workspace, ".pi/pi-sych"), { recursive: true });
		await mkdir(agent, { mode: 0o700 });
		await writeFile(
			join(workspace, ".pi/pi-sych/config.json"),
			JSON.stringify({
				version: 2,
				compaction: { custom: true, thresholdTokens: threshold },
				completionReassessment: false,
			}),
		);
		await writeFile(
			join(agent, "settings.json"),
			JSON.stringify({
				packages: [],
				extensions: [],
				skills: [],
				prompts: [],
				themes: [],
				compaction: { keepRecentTokens: 1000 },
			}),
			{ mode: 0o600 },
		);
		// Copy private state, never link: OAuth refreshes cannot mutate user files.
		for (const file of ["auth.json", "models.json", "models-store.json"]) {
			try {
				await copyFile(join(configRoot, file), join(agent, file));
				await chmod(join(agent, file), 0o600);
			} catch (e) {
				if (e.code !== "ENOENT") throw e;
			}
		}
		for (let batch = 1; batch <= maxBatches; batch++)
			for (let file = 1; file <= 3; file++) {
				const lines = Array.from(
					{ length: 300 },
					(_, i) =>
						`Record ${batch}-${file}-${i}: station ${(i * 37 + file * 11) % 97} observed ${["nesting", "lighting", "weather"][i % 3]} variance ${(i * 173 + batch * 19) % 997}; verify attribution and retain uncertainty.\n`,
				).join("");
				await writeFile(join(workspace, `corpus-${batch}-${file}.txt`), lines);
			}
		child = spawn(
			"pi",
			[
				"--mode",
				"rpc",
				"--no-session",
				"--provider",
				provider,
				"--model",
				model,
				"--no-extensions",
				"--extension",
				resolve("tests/usage/compaction-soak-observer.ts"),
				"--extension",
				resolve("extensions/workbench/index.ts"),
				"--no-skills",
				"--no-prompt-templates",
				"--no-themes",
				"--no-context-files",
				"--tools",
				"read,write",
			],
			{
				cwd: workspace,
				env: { ...process.env, PI_CODING_AGENT_DIR: agent, PI_SOAK_EVENTS: events },
				detached: true,
				stdio: ["pipe", "pipe", "pipe"],
			},
		);
		closed = new Promise((r) => {
			child.once("error", () => r());
			child.once("close", () => r());
		});
		child.stderr.resume();
		let buffer = "",
			sequence = 0,
			settle = 0,
			lastAbort = false,
			assistantError = false,
			reads = 0,
			writes = 0;
		child.stdin.on("error", () => {});
		const pending = new Map();
		child.stdout.setEncoding("utf8");
		child.stdout.on("data", (chunk) => {
			buffer += chunk;
			for (;;) {
				const n = buffer.indexOf("\n");
				if (n < 0) break;
				const line = buffer.slice(0, n);
				buffer = buffer.slice(n + 1);
				let event;
				try {
					event = JSON.parse(line);
				} catch {
					continue;
				}
				if (
					event.type === "extension_ui_request" &&
					event.method === "notify" &&
					typeof event.message === "string" &&
					event.message.startsWith("Working-memory compaction failed:")
				)
					report.customFailureNotices++;
				if (event.type === "response" && pending.has(event.id)) {
					pending.get(event.id)(event);
					pending.delete(event.id);
				}
				if (event.type === "agent_settled") {
					settle++;
					lastAbort = !!event.aborted;
				}
				if (event.type === "tool_execution_end" && !event.isError) {
					if (event.toolName === "read") reads++;
					if (event.toolName === "write") writes++;
				}
				if (
					event.type === "message_end" &&
					event.message?.role === "assistant" &&
					["error", "aborted"].includes(event.message.stopReason)
				)
					assistantError = true;
			}
		});
		const command = (type, extra = {}) =>
			new Promise((accept) => {
				const id = String(++sequence);
				pending.set(id, accept);
				child.stdin.write(`${JSON.stringify({ id, type, ...extra })}\n`);
			});
		const work = async () => {
			const state = await command("get_state");
			if (
				!state.success ||
				state.data?.model?.provider !== provider ||
				state.data?.model?.id !== model
			)
				throw new Error("Selected Pi model differs from configured workhorse");
			for (let batch = 1; batch <= maxBatches; batch++) {
				const beforeSettle = settle,
					start = Date.now(),
					beforeReads = reads,
					beforeWrites = writes,
					previousCustom = report.attempts.filter((a) => a.result === "custom").length;
				assistantError = false;
				const files = [1, 2, 3].map((i) => `corpus-${batch}-${i}.txt`).join(", ");
				const anchor =
					batch === 1
						? "Audit the synthetic field records. Keep nesting and lighting findings separate, cite record IDs, and distinguish uncertainty from observations. Work only in this workspace; never delegate or access remote resources. "
						: "";
				const response = await command("prompt", {
					message: `${anchor}Read each of ${files} using read. Write concise findings with examples to batch-${batch}-notes.md using write, then stop for this batch.`,
				});
				if (!response.success || response.data?.disposition !== "started")
					throw new Error("Prompt was not started");
				while (settle === beforeSettle) await sleep(100);
				// The workbench requests compaction at agent_settled; wait until its deferred work finishes.
				await sleep(500);
				for (;;) {
					const state = await command("get_state");
					if (!state.success) throw new Error("State unavailable");
					if (!state.data.isCompacting) break;
					await sleep(250);
				}
				const records = await collectAttempts();
				const stats = await command("get_session_stats");
				const note = await stat(join(workspace, `batch-${batch}-notes.md`)).catch(() => undefined);
				const settled = records.filter((e) => e.type === "settled").at(-1);
				report.batches.push({
					batch,
					durationMs: Date.now() - start,
					noteBytes: note?.size ?? 0,
					reads: reads - beforeReads,
					writes: writes - beforeWrites,
					afterCustom: previousCustom,
					aborted: lastAbort,
					assistantError,
					settledUsage: settled?.usage,
					sessionUsage: stats.success
						? { tokens: stats.data.tokens, cost: stats.data.cost }
						: undefined,
				});
				if (lastAbort || assistantError) throw new Error("Worker failed or was aborted");
				const successes = report.attempts.filter((a) => a.result === "custom").length;
				if (
					successes >= target &&
					report.batches.some(
						(b) => b.afterCustom > 0 && b.noteBytes > 0 && b.reads >= 2 && b.writes > 0,
					)
				) {
					report.stopReason = "target_and_continuation";
					break;
				}
			}
			report.stopReason ??= "batch_limit";
		};
		const timeout = new Promise((_, reject) => {
			deadlineTimer = setTimeout(
				() => {
					timedOut = true;
					kill("SIGKILL");
					reject(new Error("wall_time_limit"));
				},
				Math.max(1, wallMs - (Date.now() - started)),
			);
		});
		await Promise.race([
			work(),
			timeout,
			closed.then(() => {
				throw new Error("Pi process exited unexpectedly");
			}),
		]);
		assert.ok(
			report.attempts.filter((a) => a.result === "custom").length >= 2,
			"Fewer than two successful custom compactions",
		);
		assert.ok(
			report.batches.some(
				(b) => b.afterCustom > 0 && b.noteBytes > 0 && b.reads >= 2 && b.writes > 0,
			),
			"No observed work after custom compaction",
		);
	} catch (error) {
		failure = error;
		report.stopReason = timedOut ? "wall_time_limit" : (report.stopReason ?? "error");
		report.error =
			error instanceof assert.AssertionError
				? error.message
				: "Run failed; inspect local configuration and model availability";
	} finally {
		clearTimeout(deadlineTimer);
		if (child) {
			kill("SIGTERM");
			await Promise.race([closed, sleep(1000)]);
			kill("SIGKILL");
			await closed;
		}
		if (events) await collectAttempts();
		report.runtimeMs = Date.now() - started;
		const durations = report.attempts.map((a) => a.durationMs).filter(Number.isFinite);
		report.metrics = {
			attempts: report.attempts.length,
			customSuccesses: report.attempts.filter((a) => a.result === "custom").length,
			nativeFallbacks: report.attempts.filter((a) => a.result === "native_fallback").length,
			failures: report.attempts.filter((a) => a.result === "failed").length,
			cancellations: report.attempts.filter((a) => a.result === "cancelled").length,
			incomplete: report.attempts.filter((a) => a.result === "incomplete").length,
			compactionTotalMs: durations.reduce((sum, value) => sum + value, 0),
			compactionMinMs: durations.length ? Math.min(...durations) : null,
			compactionMaxMs: durations.length ? Math.max(...durations) : null,
			compactionMeanMs: durations.length
				? durations.reduce((sum, value) => sum + value, 0) / durations.length
				: null,
		};
		if (root) await rm(root, { recursive: true, force: true });
		await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, {
			mode: 0o600,
			flag: "wx",
		});
		console.log(`Compaction soak report: ${reportPath}`);
	}
	if (failure) throw new Error(`Soak failed (${report.stopReason}); see report ${reportPath}`);
});
