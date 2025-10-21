// src/withAction.ts
import type { Actor, Check, Decision } from "./types.js";
import { AccountabilityLayer } from "./index.js";

/**
 * Orchestrates: propose → (optional approval) → execute → evidence.
 */
export async function withAction<T>(opts: {
  apaai: AccountabilityLayer;
  type: string;
  actor: Actor;
  target?: string;
  params?: Record<string, unknown>;
  id?: string;
  timestamp?: string;

  onApproval?: (d: { actionId: string; checks?: string[] }) => Promise<void> | void;

  execute?: () => Promise<T>;
  evidence?: {
    onSuccess?: (result: T) => Check[];
    onError?: (err: unknown) => Check[];
  };
}): Promise<T | undefined> {
  const {
    apaai,
    type,
    actor,
    target,
    params,
    id,
    timestamp,
    onApproval,
    execute,
    evidence: evidenceHandlers,
  } = opts;

  const decision: Decision & { actionId: string } = await apaai.createAction({
    id: id ?? crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    timestamp: timestamp ?? new Date().toISOString(),
    type,
    actor,
    target,
    params,
  });

  if (decision.status === "requires_approval" && onApproval) {
    await onApproval({ actionId: decision.actionId, checks: decision.checks });
  }

  try {
    const result = execute ? await execute() : undefined;
    const checks =
      result !== undefined && evidenceHandlers?.onSuccess
        ? evidenceHandlers.onSuccess(result)
        : [{ name: "action_executed", pass: true as const }];
    await apaai.submitEvidence({ actionId: decision.actionId, checks });
    return result;
  } catch (err) {
    const checks =
      evidenceHandlers?.onError?.(err) ??
      [{ name: "action_failed", pass: false as const, note: String((err as Error)?.message ?? err) }];
    await apaai.submitEvidence({ actionId: decision.actionId, checks });
    throw err;
  }
}
