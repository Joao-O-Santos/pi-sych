import { spawn } from "node:child_process";
import { resolve } from "node:path";
import { observedProjectChanges, type WorkerVerification } from "./worker-engine.js";

const OUTPUT_LIMIT = 8_192;

export interface VerificationCommand {
  executable: string;
  args: string[];
  cwd?: string;
  expectedExitCode?: number;
  timeoutMs?: number;
}

export interface VerificationReport extends WorkerVerification {
  expectedExitCode: number;
  passed: boolean;
}

function tail(value: string): string {
  return value.length > OUTPUT_LIMIT ? value.slice(-OUTPUT_LIMIT) : value;
}

function requireString(value: unknown, name: string): string {
  if (typeof value !== "string" || !value.trim()) throw new Error(`${name} must be a non-empty string`);
  return value.trim();
}

function requireStringArray(value: unknown, name: string): string[] {
  if (!Array.isArray(value) || value.some((entry) => typeof entry !== "string")) throw new Error(`${name} must be an array of strings`);
  return value;
}

export function validateVerificationCommand(value: unknown): VerificationCommand {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Verification command must be an object");
  const command = value as Record<string, unknown>;
  const expectedExitCode = command.expectedExitCode === undefined ? 0 : command.expectedExitCode;
  if (typeof expectedExitCode !== "number" || !Number.isInteger(expectedExitCode)) throw new Error("expectedExitCode must be an integer");
  const timeoutMs = command.timeoutMs;
  if (timeoutMs !== undefined && (typeof timeoutMs !== "number" || !Number.isInteger(timeoutMs) || timeoutMs <= 0)) throw new Error("timeoutMs must be a positive integer");
  return {
    executable: requireString(command.executable, "executable"),
    args: requireStringArray(command.args, "args"),
    ...(command.cwd === undefined ? {} : { cwd: requireString(command.cwd, "cwd") }),
    expectedExitCode,
    ...(timeoutMs === undefined ? {} : { timeoutMs }),
  };
}

export async function runVerification(commandInput: unknown, defaultCwd: string): Promise<VerificationReport> {
  const command = validateVerificationCommand(commandInput);
  const cwd = command.cwd ? resolve(defaultCwd, command.cwd) : defaultCwd;
  const startedAt = new Date().toISOString();
  const before = await observedProjectChanges(cwd);
  const execution = await new Promise<{ exitCode: number | null; stdout: string; stderr: string }>((resolvePromise) => {
    let stdout = "";
    let stderr = "";
    let settled = false;
    let child;
    try {
      child = spawn(command.executable, command.args, { cwd, stdio: ["ignore", "pipe", "pipe"] });
    } catch (error) {
      return resolvePromise({ exitCode: null, stdout, stderr: error instanceof Error ? error.message : String(error) });
    }
    child.stdout.setEncoding("utf8");
    child.stderr.setEncoding("utf8");
    child.stdout.on("data", (chunk) => { stdout = tail(stdout + chunk); });
    child.stderr.on("data", (chunk) => { stderr = tail(stderr + chunk); });
    const timeout = setTimeout(() => {
      if (!settled) child.kill("SIGTERM");
    }, command.timeoutMs ?? 120_000);
    child.once("error", (error) => {
      settled = true;
      clearTimeout(timeout);
      resolvePromise({ exitCode: null, stdout, stderr: tail(`${stderr}${error.message}`) });
    });
    child.once("close", (exitCode) => {
      settled = true;
      clearTimeout(timeout);
      resolvePromise({ exitCode, stdout, stderr });
    });
  });
  const filesChanged = await observedProjectChanges(cwd);
  const endedAt = new Date().toISOString();
  return {
    executable: command.executable,
    args: command.args,
    cwd,
    exitCode: execution.exitCode,
    stdoutTail: tail(execution.stdout),
    stderrTail: tail(execution.stderr),
    startedAt,
    endedAt,
    filesChanged: [...new Set([...before, ...filesChanged])],
    expectedExitCode: command.expectedExitCode ?? 0,
    passed: execution.exitCode === (command.expectedExitCode ?? 0),
  };
}

export async function runVerificationContract(commands: unknown[], defaultCwd: string): Promise<VerificationReport[]> {
  const reports: VerificationReport[] = [];
  for (const command of commands) reports.push(await runVerification(command, defaultCwd));
  return reports;
}
