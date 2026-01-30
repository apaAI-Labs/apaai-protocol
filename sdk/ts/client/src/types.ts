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
  agentId?: string;  // Link action to registered agent
}

// Agent types for agent-centric workflows
export interface Agent {
  id: string;
  orgId: string;
  name: string;
  slug: string;
  description?: string;
  status: "active" | "idle" | "error" | "disabled";
  lastSeenAt?: string;
  lastActionAt?: string;
  metrics: {
    totalActions: number;
    approvedActions: number;
    blockedActions: number;
    pendingActions: number;
  };
  config?: {
    webhookUrl?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CreateAgentInput {
  name: string;
  description?: string;
  config?: {
    webhookUrl?: string;
  };
}

export interface UpdateAgentInput {
  name?: string;
  description?: string;
  status?: "active" | "idle" | "error" | "disabled";
  config?: {
    webhookUrl?: string;
  };
}

// Agentic-first types

export interface BootstrapInput {
  enrollmentKey: string;
  name: string;
  description?: string;
  provider?: string;
  model?: string;
  tags?: string[];
  config?: {
    webhookUrl?: string;
    webhookSecret?: string;
  };
}

export interface BootstrapResult {
  agentId: string;
  agentToken: string;
  agent: {
    name: string;
    slug: string;
    status: string;
  };
  policies: DiscoveredPolicy[];
}

export interface DiscoveredPolicy {
  id: string;
  name: string;
  actionType: string;
  mode: "enforce" | "observe";
  scope: "all_agents" | "opt_in";
  rules: PolicyRule[];
}

export interface PolicyDiscoveryResult {
  agentId: string;
  agentName: string;
  policies: DiscoveredPolicy[];
}

export interface ProposePolicyInput {
  name: string;
  actionType: string;
  mode: "enforce" | "observe";
  scope: "all_agents" | "opt_in";
  rules: Array<{
    when?: { actionType?: string; field?: string; operator?: string; value?: string };
    then: string;
    require?: string[];
  }>;
}

export interface ApproverIdentity {
  kind: "user" | "agent" | "system";
  id?: string;
  name?: string;
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
