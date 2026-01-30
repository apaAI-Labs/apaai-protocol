# apaai-ts-sdk

[![npm version](https://img.shields.io/npm/v/apaai-ts-sdk.svg)](https://www.npmjs.com/package/apaai-ts-sdk)
[![License](https://img.shields.io/badge/license-Apache%202.0-blue.svg)](LICENSE)

**TypeScript SDK for APAAI — AI Agent Governance**

APAAI lets AI agents check policies before taking risky actions, get human approval when needed, and propose their own governance policies.

```bash
npm install apaai-ts-sdk
```

---

## For AI Agents (Claude Code, Cursor, etc.)

If you are an AI coding agent and the user asks you to "integrate APAAI" or "add APAAI governance", follow these steps:

### 1. Install the SDK

```bash
npm install apaai-ts-sdk
```

### 2. Ask the user for their enrollment key

They create one at https://app.apaai.ai/settings/enrollment-keys. It looks like `enroll_abc123...`.

### 3. Bootstrap yourself

```typescript
import { bootstrap } from 'apaai-ts-sdk';

const { client, result } = await bootstrap({
  endpoint: 'https://apaaiapi-production.up.railway.app',
  enrollmentKey: 'enroll_USER_KEY_HERE',
  name: 'project-name-agent',
  description: 'Claude Code agent for project-name',
});

// result.agentToken  — save this to .env as APAAI_AGENT_TOKEN
// result.agentId     — save this to .env as APAAI_AGENT_ID
// result.policies    — the policies this agent must follow
// client             — already configured with the agent token
```

Save the token to `.env`:
```
APAAI_AGENT_TOKEN=agt_...
APAAI_AGENT_ID=...
APAAI_API_URL=https://apaaiapi-production.up.railway.app
```

### 4. Add governance instructions to CLAUDE.md

Append this to the project's `CLAUDE.md` so future sessions know to check APAAI:

```markdown
## APAAI Governance

This project uses APAAI for AI governance. Before risky actions (deploy,
delete data, send emails, modify infrastructure), check with APAAI.

### Check before acting
```typescript
import { AccountabilityLayer } from 'apaai-ts-sdk';

const apaai = new AccountabilityLayer({
  endpoint: process.env.APAAI_API_URL,
  apiKey: process.env.APAAI_AGENT_TOKEN,
});

const decision = await apaai.createAction({
  id: crypto.randomUUID(),
  timestamp: new Date().toISOString(),
  type: 'deploy_production',  // or any action type
  actor: { kind: 'agent', name: 'claude-code' },
  params: { service: 'api', version: '2.0' },
});

if (decision.status === 'requires_approval') {
  // Tell user: "Needs approval at https://app.apaai.ai/actions/ACTION_ID"
  const result = await apaai.waitForApproval(decision.actionId);
  if (!result.approved) { /* stop — action was rejected */ }
}
// If status is 'allowed' or 'approved', proceed
// If status is 'blocked', do NOT proceed
```

### Action types to check
- `deploy_production`, `deploy_staging` — deployments
- `delete_data` — data deletion
- `send_email` — sending emails
- `database_migration` — schema changes
- `infrastructure_change` — cloud resource changes
```

### 5. Done

The agent is registered, token saved, CLAUDE.md updated. The user manages policies at https://app.apaai.ai.

---

## API Reference

### Initialize

```typescript
import { AccountabilityLayer } from 'apaai-ts-sdk';

// With admin API key (for org management)
const admin = new AccountabilityLayer({
  endpoint: 'https://apaaiapi-production.up.railway.app',
  apiKey: 'apk_your_admin_key',
});

// With agent token (for agent operations)
const agent = new AccountabilityLayer({
  endpoint: 'https://apaaiapi-production.up.railway.app',
  apiKey: 'agt_your_agent_token',
});
```

### Bootstrap (no auth required)

```typescript
const result = await agent.bootstrap({
  enrollmentKey: 'enroll_...',
  name: 'my-agent',
  description: 'My AI agent',
});
// Client is now auto-configured with result.agentToken
```

### Propose Actions

```typescript
const decision = await agent.createAction({
  id: crypto.randomUUID(),
  timestamp: new Date().toISOString(),
  type: 'send_email',
  actor: { kind: 'agent', name: 'my-agent' },
  params: { to: 'user@example.com', subject: 'Hello' },
});

// decision.status: 'allowed' | 'requires_approval' | 'blocked'
// decision.actionId: string
```

Or use the convenience function:

```typescript
import { propose } from 'apaai-ts-sdk';

const decision = await propose({
  type: 'deploy_production',
  actor: { kind: 'agent', name: 'deploy-bot' },
  params: { service: 'api' },
});
```

### Wait for Approval

```typescript
if (decision.status === 'requires_approval') {
  const result = await agent.waitForApproval(decision.actionId, {
    timeoutMs: 300_000,  // 5 minutes (default)
    intervalMs: 5_000,   // poll every 5s (default)
  });

  if (result.approved) {
    // proceed
  } else {
    // action was rejected
  }
}
```

### Discover Policies

```typescript
const { policies } = await agent.discoverPolicies();
// policies: [{ name, actionType, mode, scope, rules }]
```

### Agent Profile

```typescript
const me = await agent.me();
// me: { name, slug, status, metrics, ... }
```

### Approve / Reject (with identity)

```typescript
await agent.approveWithIdentity(actionId, 'Looks good', {
  kind: 'agent',
  name: 'reviewer-bot',
});

await agent.rejectWithIdentity(actionId, 'Too risky');
```

### Propose a Policy

```typescript
const decision = await agent.proposePolicy({
  name: 'Require Tests for Deploy',
  actionType: 'deploy_production',
  mode: 'enforce',
  scope: 'all_agents',
  rules: [{
    when: { actionType: 'deploy_production' },
    then: 'require_approval',
    require: ['tests_pass'],
  }],
}, 'All production deploys should require passing tests');

// decision.status === 'requires_approval' (meta-policy)
// Human reviews and approves at https://app.apaai.ai
```

### Submit Evidence

```typescript
await agent.submitEvidence({
  actionId: decision.actionId,
  checks: [
    { name: 'tests_pass', pass: true, note: 'All 42 tests passed' },
    { name: 'security_scan', pass: true },
  ],
});
```

### Agent Management (admin only)

```typescript
// Register agent (admin key)
const agentObj = await admin.agents.register({ name: 'my-bot' });

// List agents
const agents = await admin.agents.list();

// Get/update/delete
const a = await admin.agents.get(agentId);
await admin.agents.update(agentId, { description: 'Updated' });
await admin.agents.delete(agentId);
```

---

## Environment Variables

| Variable | Description |
|----------|-------------|
| `APAAI_ENDPOINT` | API URL (default: `http://localhost:8787`) |
| `APAAI_KEY` | API key or agent token |
| `APAAI_API_URL` | Alternative to APAAI_ENDPOINT |
| `APAAI_AGENT_TOKEN` | Agent token from bootstrap |
| `APAAI_AGENT_ID` | Agent ID from bootstrap |
| `APAAI_ENROLLMENT_KEY` | Enrollment key for bootstrap |

The global singleton auto-configures from `APAAI_ENDPOINT` and `APAAI_KEY`.

---

## Response Statuses

| Status | Meaning | Action |
|--------|---------|--------|
| `allowed` | No policy matched, or policy allows | Proceed |
| `requires_approval` | Policy requires human approval | Wait for approval |
| `blocked` | Policy blocks this action | Do NOT proceed |
| `approved` | Human approved the action | Proceed |
| `rejected` | Human rejected the action | Do NOT proceed |

---

## License

Apache-2.0
