import { ApaaiAPI } from "./api.js";
import type { Actor, Action, Evidence, Decision, TraceLike, Policy } from "./types.js";
import { nowIso, uid } from "./utils.js";

/** APAAI Accountability Layer */
export class AccountabilityLayer implements TraceLike {
  private api: ApaaiAPI;

  constructor(cfg?: { endpoint?: string; apiKey?: string }) {
    this.api = new ApaaiAPI(cfg?.endpoint, cfg?.apiKey);
  }

  async propose(input: {
    type: string;
    actor: Actor;
    target?: string;
    params?: Record<string, unknown>;
    id?: string;
    timestamp?: string;
  }): Promise<Decision & { actionId: string }> {
    const action: Action = {
      id: input.id ?? uid(),
      timestamp: input.timestamp ?? nowIso(),
      type: input.type,
      actor: input.actor,
      target: input.target,
      params: input.params,
    };
    return this.api.createAction(action);
  }

  async evidence(
    actionId: string,
    checks: Evidence["checks"]
  ): Promise<{ verified: boolean }> {
    const e: Evidence = { actionId, checks };
    return this.api.submitEvidence(e);
  }

  async policy(actionType?: string): Promise<Policy> {
    const p = await this.api.getPolicy(actionType);
    if (actionType && Array.isArray(p?.rules)) {
      const filtered = p.rules.filter(r => r?.when?.actionType === actionType);
      // if server didn't filter, ensure we return only the target rules
      return { rules: filtered.length ? filtered : p.rules };
    }
    return p;
  }

  // New API surface
  get policies() {
    return {
      evaluate: async (actionId: string) => {
        const action = await this.api.getAction(actionId);
        const policy = await this.policy(action.type);
        return { status: action.status, checks: action.checks };
      },
      enforce: async (actionType: string) => {
        return this.policy(actionType);
      },
      set: async (policy: Policy) => {
        return this.api.setPolicy(policy);
      }
    };
  }

  get human() {
    return {
      approve: async (actionId: string, options?: { approver?: string }) => {
        return this.api.approveAction(actionId, options?.approver);
      },
      reject: async (actionId: string, reason?: string) => {
        return this.api.rejectAction(actionId, reason);
      }
    };
  }

  get evidence() {
    return {
      add: async (actionId: string, checks: Evidence["checks"]) => {
        return this.evidence(actionId, checks);
      },
      get: async (actionId: string) => {
        return this.api.getEvidence(actionId);
      }
    };
  }

  get actions() {
    return {
      get: async (actionId: string) => {
        return this.api.getAction(actionId);
      },
      list: async (filters?: any) => {
        return this.api.listActions(filters);
      }
    };
  }
}

// Legacy compatibility
export class TraceClient extends AccountabilityLayer {}

// Re-exports
export type {
  Actor,
  Action,
  Evidence,
  Decision,
  TraceLike,
  Check,
} from "./types.js";
export { withAction } from "./withAction.js";
