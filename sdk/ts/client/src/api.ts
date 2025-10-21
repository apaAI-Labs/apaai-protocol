import type { Action, Evidence, Decision, Policy } from "./types.js";

export class ApaaiAPI {
  private endpoint: string;
  private apiKey?: string;

  constructor(endpoint?: string, apiKey?: string) {
    this.endpoint = (endpoint ?? "http://localhost:8787").replace(/\/$/, "");
    this.apiKey = apiKey;
  }

  private async request<T>(path: string, options?: RequestInit): Promise<T> {
    const url = `${this.endpoint}${path}`;
    const headers: Record<string, string> = { "content-type": "application/json" };
    
    if (this.apiKey) {
      headers["Authorization"] = `Bearer ${this.apiKey}`;
    }
    
    const res = await fetch(url, {
      headers,
      ...options,
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`APAAI API error ${res.status}: ${text}`);
    }
    return (await res.json()) as T;
  }

  async createAction(action: Action): Promise<Decision & { actionId: string }> {
    return this.request("/actions", {
      method: "POST",
      body: JSON.stringify(action),
    });
  }

  async submitEvidence(ev: Evidence): Promise<{ verified: boolean }> {
    return this.request("/evidence", {
      method: "POST",
      body: JSON.stringify(ev),
    });
  }

  async getPolicy(actionType?: string): Promise<Policy> {
    const path = actionType
      ? `/policy?actionType=${encodeURIComponent(actionType)}`
      : "/policy";
    return this.request<Policy>(path);
  }

  async setPolicy(policy: Policy): Promise<Policy> {
    return this.request("/policy", {
      method: "POST",
      body: JSON.stringify(policy),
    });
  }

  async getAction(actionId: string): Promise<Action> {
    return this.request(`/actions/${actionId}`);
  }

  async listActions(filters?: any): Promise<Action[]> {
    const query = filters ? `?${new URLSearchParams(filters).toString()}` : "";
    return this.request(`/actions${query}`);
  }

  async getEvidence(actionId: string): Promise<Evidence> {
    return this.request(`/evidence/${actionId}`);
  }

  async approveAction(actionId: string, approver?: string): Promise<{ verified: boolean }> {
    return this.request(`/approve/${actionId}`, {
      method: "POST",
      body: JSON.stringify({ approver }),
    });
  }

  async rejectAction(actionId: string, reason?: string): Promise<{ verified: boolean }> {
    return this.request(`/reject/${actionId}`, {
      method: "POST",
      body: JSON.stringify({ reason }),
    });
  }
}

let apaai = new ApaaiAPI(process.env.APAAI_ENDPOINT, process.env.APAAI_KEY);

export function configure({ endpoint, apiKey }: { endpoint?: string; apiKey?: string } = {}) {
  apaai = new ApaaiAPI(endpoint, apiKey);
}

export async function propose(input: {
  type: string;
  actor: any;
  target?: string;
  params?: Record<string, unknown>;
  id?: string;
  timestamp?: string;
}): Promise<Decision & { actionId: string }> {
  return apaai.createAction({
    id: input.id ?? crypto.randomUUID(),
    timestamp: input.timestamp ?? new Date().toISOString(),
    type: input.type,
    actor: input.actor,
    target: input.target,
    params: input.params,
  });
}

export async function evidence(actionId: string, checks: any[]): Promise<{ verified: boolean }> {
  return apaai.submitEvidence({ actionId, checks });
}

export async function policy(action?: string): Promise<Policy> {
  const p = await apaai.getPolicy(action);
  if (action && Array.isArray(p?.rules)) {
    const filtered = p.rules.filter(r => r?.when?.action === action || r?.when?.actionType === action);
    return { rules: filtered.length ? filtered : p.rules };
  }
  return p;
}

export async function approve(actionId: string, approver?: string): Promise<{ verified: boolean }> {
  return apaai.approveAction(actionId, approver);
}

export async function reject(actionId: string, reason?: string): Promise<{ verified: boolean }> {
  return apaai.rejectAction(actionId, reason);
}

export async function getAction(actionId: string): Promise<Action> {
  return apaai.getAction(actionId);
}

export async function listActions(filters?: any): Promise<Action[]> {
  return apaai.listActions(filters);
}

export async function getEvidence(actionId: string): Promise<Evidence> {
  return apaai.getEvidence(actionId);
}

export async function setPolicy(policy: Policy): Promise<Policy> {
  return apaai.setPolicy(policy);
}
