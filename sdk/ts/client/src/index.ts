// src/index.ts
import type { Action, Evidence, Decision, Policy } from "./types.js";

/** ---- Public Client ----------------------------------------------------- */
export type AccountabilityLayerOptions = {
  endpoint?: string;                 // default http://localhost:8787
  apiKey?: string;                   // optional; sent as x-api-key if present
  headers?: Record<string, string>;  // extra headers to send on every request
};

export class AccountabilityLayer {
  private base: string;
  private apiKey?: string;
  private extra: Record<string, string>;
  private static UA = "apaai-js/0.1.0";

  constructor(opts: AccountabilityLayerOptions = {}) {
    this.base = (opts.endpoint ?? "http://localhost:8787").replace(/\/+$/, "");
    this.apiKey = opts.apiKey;
    this.extra = opts.headers ?? {};
  }

  /** Core request helper */
  private async request<T>(
    path: string,
    init: RequestInit = {}
  ): Promise<T> {
    const url = `${this.base}${path}`;
    const headers: Record<string, string> = {
      "content-type": "application/json",
      "user-agent": AccountabilityLayer.UA,
      ...this.extra,
      ...(init.headers as Record<string, string> | undefined),
    };
    if (this.apiKey) headers["x-api-key"] = this.apiKey;

    const res = await fetch(url, { ...init, headers });
    if (!res.ok) {
      let detail = "";
      try {
        detail = await res.text();
      } catch {}
      const msg = detail?.trim()
        ? `APAAI ${init.method ?? "GET"} ${path} -> ${res.status} ${res.statusText} :: ${detail}`
        : `APAAI ${init.method ?? "GET"} ${path} -> ${res.status} ${res.statusText}`;
      throw new Error(msg);
    }
    // Some endpoints may return 204 No Content
    if (res.status === 204) return undefined as unknown as T;
    return (await res.json()) as T;
  }

  private get<T>(path: string) {
    return this.request<T>(path);
  }
  private post<T>(path: string, body?: unknown) {
    return this.request<T>(path, {
      method: "POST",
      body: body == null ? undefined : JSON.stringify(body),
    });
  }

  // ---- High-level methods (1:1 with protocol) ----

  /** Propose/create an action; returns a decision + actionId */
  async createAction(action: Action): Promise<Decision & { actionId: string }> {
    return this.post("/actions", action);
  }

  /** Submit evidence (checks) for an action */
  async submitEvidence(ev: Evidence): Promise<{ verified: boolean }> {
    return this.post("/evidence", ev);
  }

  /** Fetch policy; optionally scoped to an actionType */
  async getPolicy(actionType?: string): Promise<Policy> {
    const path = actionType
      ? `/policy?actionType=${encodeURIComponent(actionType)}`
      : "/policy";
    return this.get<Policy>(path);
  }

  /** Set/replace policy */
  async setPolicy(policy: Policy): Promise<Policy> {
    return this.post("/policy", policy);
  }

  /** Read single action */
  async getAction(actionId: string): Promise<Action> {
    return this.get(`/actions/${encodeURIComponent(actionId)}`);
  }

  /** List actions with optional filters */
  async listActions(filters?: Record<string, string | number | boolean | undefined>): Promise<Action[]> {
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries(filters ?? {})) {
      if (v !== undefined && v !== null) params.set(k, String(v));
    }
    const qs = params.toString();
    return this.get(`/actions${qs ? `?${qs}` : ""}`);
  }

  /** Read evidence for an action */
  async getEvidence(actionId: string): Promise<Evidence> {
    return this.get(`/evidence/${encodeURIComponent(actionId)}`);
  }

  /** Approve an action (human-in-the-loop) */
  async approveAction(actionId: string, approver?: string): Promise<{ verified: boolean }> {
    return this.post(`/approve/${encodeURIComponent(actionId)}`, { approver });
  }

  /** Reject an action (human-in-the-loop) */
  async rejectAction(actionId: string, reason?: string): Promise<{ verified: boolean }> {
    return this.post(`/reject/${encodeURIComponent(actionId)}`, { reason });
  }
}

/** ---- Singleton + Convenience API (backwards & ergonomic) -------------- */

let client = new AccountabilityLayer({
  endpoint: process.env.APAAI_ENDPOINT,
  apiKey: process.env.APAAI_KEY,
});

/** Reconfigure the global client (useful for apps/tests) */
export function configure(opts: AccountabilityLayerOptions = {}) {
  client = new AccountabilityLayer(opts);
}

/** Propose an action (id/timestamp auto-filled if absent) */
export async function propose(input: {
  type: string;
  actor: any;
  target?: string;
  params?: Record<string, unknown>;
  id?: string;
  timestamp?: string;
}): Promise<Decision & { actionId: string }> {
  const id = input.id ?? (typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`);
  const timestamp = input.timestamp ?? new Date().toISOString();

  const action: Action = {
    id,
    timestamp,
    type: input.type,
    actor: input.actor,
    target: input.target,
    params: input.params,
  };
  return client.createAction(action);
}

export async function evidence(actionId: string, checks: Evidence["checks"]): Promise<{ verified: boolean }> {
  return client.submitEvidence({ actionId, checks });
}

export async function policy(action?: string): Promise<Policy> {
  const p = await client.getPolicy(action);
  if (action && Array.isArray(p?.rules)) {
    const filtered = p.rules.filter(
      (r: any) => r?.when?.action === action || r?.when?.actionType === action
    );
    return { rules: filtered.length ? filtered : p.rules };
  }
  return p;
}

export async function approve(actionId: string, approver?: string) {
  return client.approveAction(actionId, approver);
}
export async function reject(actionId: string, reason?: string) {
  return client.rejectAction(actionId, reason);
}
export async function getAction(actionId: string) {
  return client.getAction(actionId);
}
export async function listActions(filters?: Record<string, string | number | boolean | undefined>) {
  return client.listActions(filters);
}
export async function getEvidence(actionId: string) {
  return client.getEvidence(actionId);
}
export async function setPolicy(p: Policy) {
  return client.setPolicy(p);
}

/** ---- Optional ergonomic helper: orchestrate propose → execute → evidence */
export async function withAction<T>(opts: {
  apaai?: AccountabilityLayer;                 // use custom client or global singleton
  type: string;
  actor: any;
  target?: string;
  params?: Record<string, unknown>;
  onApproval?: (d: { actionId: string }) => Promise<void> | void;
  execute: () => Promise<T>;
  evidence: {
    onSuccess?: (result: T) => Evidence["checks"];
    onError?: (err: unknown) => Evidence["checks"];
  };
}) {
  const c = opts.apaai ?? client;

  const decision = await c.createAction({
    id: crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    timestamp: new Date().toISOString(),
    type: opts.type,
    actor: opts.actor,
    target: opts.target,
    params: opts.params,
  });

  if (decision.status === "requires_approval" && opts.onApproval) {
    await opts.onApproval({ actionId: (decision as any).actionId });
  }

  try {
    const result = await opts.execute();
    const checks = opts.evidence.onSuccess?.(result) ?? [{ name: "ok", pass: true }];
    await c.submitEvidence({ actionId: (decision as any).actionId, checks });
    return result;
  } catch (err) {
    const checks = opts.evidence.onError?.(err) ?? [{ name: "error", pass: false, note: String(err) }];
    await c.submitEvidence({ actionId: (decision as any).actionId, checks });
    throw err;
  }
}

export default AccountabilityLayer;
