import { createJiti } from "jiti";
import type { ExtensionContext } from "@earendil-works/pi-coding-agent";

export interface PlanReviewDecision {
  approved: boolean;
  feedback?: string;
  savedPath?: string;
}

export interface AnnotationDecision {
  feedback: string;
  exit?: boolean;
  approved?: boolean;
}

export interface ReviewSession {
  url: string;
  waitForDecision(): Promise<PlanReviewDecision>;
}

export interface AnnotationSession {
  url: string;
  waitForDecision(): Promise<AnnotationDecision>;
}

type PlannotatorModule = {
  startPlanReviewBrowserSession(ctx: ExtensionContext, planContent: string): Promise<ReviewSession>;
  startMarkdownAnnotationSession(ctx: ExtensionContext, filePath: string, content: string, mode: "annotate"): Promise<AnnotationSession>;
  getLastAssistantMessageText(ctx: ExtensionContext): string | undefined;
  startLastMessageAnnotationSession(ctx: ExtensionContext, text: string): Promise<AnnotationSession>;
};

const jiti = createJiti(import.meta.url, { interopDefault: true });

async function loadPlannotator(): Promise<PlannotatorModule> {
  // The dependency ships TypeScript Pi-extension sources rather than Node-consumable JavaScript.
  // Load its documented subpath only when a review is requested; this never calls its entrypoint.
  return jiti.import("@plannotator/pi-extension/plannotator-events.ts") as Promise<PlannotatorModule>;
}

export async function startPlanReview(ctx: ExtensionContext, planContent: string): Promise<ReviewSession> {
  return (await loadPlannotator()).startPlanReviewBrowserSession(ctx, planContent);
}

export async function startFileAnnotation(ctx: ExtensionContext, filePath: string, content: string): Promise<AnnotationSession> {
  return (await loadPlannotator()).startMarkdownAnnotationSession(ctx, filePath, content, "annotate");
}

export async function startLastMessageAnnotation(ctx: ExtensionContext): Promise<AnnotationSession | undefined> {
  const plannotator = await loadPlannotator();
  const text = plannotator.getLastAssistantMessageText(ctx);
  return text ? plannotator.startLastMessageAnnotationSession(ctx, text) : undefined;
}
