export interface Actor {
  kind: "agent" | "human" | "system";
  name: string;
  provider?: string;
}

export interface Action {
  id: string;
  type: string;
  actor: Actor;
  target?: string;
  params?: Record<string, unknown>;
  timestamp: string;
  status?: "approved" | "rejected" | "requires_approval" | "observed";
  checks?: string[];
}

export interface Check {
  name: string;
  pass: boolean;
  approver?: string;
  note?: string;
}

export interface Evidence {
  actionId: string;
  checks: Check[];
  timestamp?: string;
}

export interface Decision {
  actionId: string;
  status: "approved" | "rejected" | "requires_approval" | "observed";
  checks?: string[]; // names of required checks when gating
}

export interface PolicyRule {
  when?: { action?: string; actionType?: string };
  /** list of check names (e.g., ["reviewer_approval"]) */
  require?: string[];
  /** enforce = block until satisfied; observe = log-only */
  mode?: "enforce" | "observe";
}

export interface Policy {
  rules: PolicyRule[];
}
