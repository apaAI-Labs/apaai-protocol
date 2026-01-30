// src/index.ts
import type { Action, Evidence, Decision, Policy, Agent, CreateAgentInput, UpdateAgentInput, BootstrapInput, BootstrapResult, PolicyDiscoveryResult, ProposePolicyInput, ApproverIdentity } from "./types.js";
import { sleep } from "./utils.js";

/** ---- Public Client ----------------------------------------------------- */
export type AccountabilityLayerOptions = {
  endpoint?: string;                 // default http://localhost:8787
  apiKey?: string;                   // optional; sent as x-api-key if present
  headers?: Record<string, string>;  // extra headers to send on every request
};

/** Agent operations namespace */
class AgentsAPI {
  constructor(private client: AccountabilityLayer) {}

  /** Register a new agent */
  async register(input: CreateAgentInput): Promise<Agent> {
    return this.client['post']('/agents', input);
  }

  /** List all agents for the organization */
  async list(filters?: { status?: string; limit?: number }): Promise<Agent[]> {
    const params = new URLSearchParams();
    if (filters?.status) params.set('status', filters.status);
    if (filters?.limit) params.set('limit', String(filters.limit));
    const qs = params.toString();
    return this.client['get'](`/agents${qs ? `?${qs}` : ''}`);
  }

  /** Get a single agent by ID */
  async get(agentId: string): Promise<Agent> {
    return this.client['get'](`/agents/${encodeURIComponent(agentId)}`);
  }

  /** Update an agent */
  async update(agentId: string, input: UpdateAgentInput): Promise<Agent> {
    return this.client['patch'](`/agents/${encodeURIComponent(agentId)}`, input);
  }

  /** Delete (disable) an agent */
  async delete(agentId: string): Promise<{ success: boolean; message: string }> {
    return this.client['del'](`/agents/${encodeURIComponent(agentId)}`);
  }

  /** List actions for an agent */
  async listActions(agentId: string, filters?: { status?: string; limit?: number }): Promise<Action[]> {
    const params = new URLSearchParams();
    if (filters?.status) params.set('status', filters.status);
    if (filters?.limit) params.set('limit', String(filters.limit));
    const qs = params.toString();
    return this.client['get'](`/agents/${encodeURIComponent(agentId)}/actions${qs ? `?${qs}` : ''}`);
  }
}

export class AccountabilityLayer {
  private base: string;
  private apiKey?: string;
  private extra: Record<string, string>;
  private static UA = "apaai-js/0.2.0";

  /** Agent management API */
  public readonly agents: AgentsAPI;

  constructor(opts: AccountabilityLayerOptions = {}) {
    this.base = (opts.endpoint ?? "http://localhost:8787").replace(/\/+$/, "");
    this.apiKey = opts.apiKey;
    this.extra = opts.headers ?? {};
    this.agents = new AgentsAPI(this);
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
  private patch<T>(path: string, body?: unknown) {
    return this.request<T>(path, {
      method: "PATCH",
      body: body == null ? undefined : JSON.stringify(body),
    });
  }
  private del<T>(path: string) {
    return this.request<T>(path, { method: "DELETE" });
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

  // ---- Agentic-first methods ----

  /** Bootstrap: self-register using an enrollment key. No auth required. */
  async bootstrap(input: BootstrapInput): Promise<BootstrapResult> {
    const result = await this.request<BootstrapResult>("/agents/bootstrap", {
      method: "POST",
      body: JSON.stringify(input),
    });
    // Auto-configure this client with the returned agent token
    this.apiKey = result.agentToken;
    return result;
  }

  /** Discover all policies applicable to this agent (requires agent token) */
  async discoverPolicies(): Promise<PolicyDiscoveryResult> {
    return this.get("/agents/me/policies");
  }

  /** Get this agent's profile (requires agent token) */
  async me(): Promise<Agent> {
    return this.get("/agents/me");
  }

  /** Approve an action with approver identity */
  async approveWithIdentity(actionId: string, note?: string, approver?: ApproverIdentity): Promise<{ action: any; webhookResults?: any[]; createdPolicyId?: string }> {
    return this.post(`/actions/${encodeURIComponent(actionId)}/approve`, { note, approver });
  }

  /** Reject an action with approver identity */
  async rejectWithIdentity(actionId: string, note?: string, approver?: ApproverIdentity): Promise<{ action: any }> {
    return this.post(`/actions/${encodeURIComponent(actionId)}/reject`, { note, approver });
  }

  /** Propose a new policy (creates a propose_policy action that requires human approval) */
  async proposePolicy(policy: ProposePolicyInput, reason: string): Promise<Decision & { actionId: string }> {
    return this.createAction({
      id: typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      timestamp: new Date().toISOString(),
      type: "propose_policy",
      actor: { kind: "agent", name: "sdk-agent" },
      params: { policy, reason },
    });
  }

  /** Poll for approval. Resolves when action is approved/rejected or timeout. */
  async waitForApproval(actionId: string, opts?: { timeoutMs?: number; intervalMs?: number }): Promise<{ status: string; approved: boolean }> {
    const timeout = opts?.timeoutMs ?? 300_000;
    const interval = opts?.intervalMs ?? 5_000;
    const start = Date.now();

    while (Date.now() - start < timeout) {
      const action = await this.getAction(actionId);
      const status = (action as any).status;
      if (status === "approved" || status === "completed") {
        return { status, approved: true };
      }
      if (status === "rejected") {
        return { status, approved: false };
      }
      await sleep(interval);
    }
    throw new Error(`Approval timeout after ${timeout}ms for action ${actionId}`);
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
  agentId?: string;  // Link to registered agent
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
    agentId: input.agentId,
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

/** Bootstrap an agent — creates a new client configured with the agent token */
export async function bootstrap(input: BootstrapInput & { endpoint?: string }): Promise<{ client: AccountabilityLayer; result: BootstrapResult }> {
  const c = new AccountabilityLayer({ endpoint: input.endpoint });
  const result = await c.bootstrap(input);
  return { client: c, result };
}

export default AccountabilityLayer;
