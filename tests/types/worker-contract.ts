import type { DispatchRequest, WorkerResult } from "../../extensions/workbench/src/worker-engine.js";

type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2
	? true
	: false;
type Assert<T extends true> = T;

type Mode = Assert<Equal<DispatchRequest["mode"], "read-only" | "edit" | "full-host">>;
type Context = Assert<Equal<DispatchRequest["contextMode"], "clean" | "trajectory" | undefined>>;
type Thinking = Assert<
	Equal<DispatchRequest["thinkingLevel"], "off" | "minimal" | "low" | "medium" | "high" | "xhigh" | "max" | undefined>
>;
type Status = Assert<Equal<WorkerResult["status"], "complete" | "partial" | "failed">>;
export type WorkerContractAssertions = [Mode, Context, Thinking, Status];
