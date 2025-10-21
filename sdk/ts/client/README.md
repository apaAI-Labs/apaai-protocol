# @apaai/ts-sdk

[![npm version](https://img.shields.io/npm/v/@apaai/ts-sdk.svg)](https://www.npmjs.com/package/@apaai/ts-sdk)
[![License](https://img.shields.io/badge/license-Apache%202.0-blue.svg)](LICENSE)

**TypeScript SDK for APAAI Protocol**

Open, vendor-neutral SDK for the APAAI Protocol's **Action → Policy → Evidence** loop.

- 📦 **Package**: `@apaai/ts-sdk`
- 🔌 **Protocol**: HTTP/JSON (`/actions`, `/evidence`, `/policy`)
- 🧪 **Minimal & testable**: ESM-first, class-based API
- 🧱 **License**: Apache-2.0

---

## Install

```bash
npm i @apaai/ts-sdk
# or
pnpm add @apaai/ts-sdk
# or
yarn add @apaai/ts-sdk
```

> **Reference server** (for local development):
>
> ```bash
> cd server
> npm i && npm run dev    # → http://localhost:8787
> ```

---

## Quickstart

```ts
import { AccountabilityLayer } from "@apaai/ts-sdk";

// Initialize the accountability layer
const apaai = new AccountabilityLayer({ 
  endpoint: "https://api.apaaiprotocol.org",
  apiKey: process.env.APAAI_API_KEY 
});

// 1) Propose an action
const decision = await apaai.propose({
  type: "send_email",
  actor: { kind: "agent", "name": "mail-bot" },
  target: "mailto:client@acme.com",
  params: { subject: "Proposal" }
});

// 2) Add evidence
await apaai.submitEvidence(decision.actionId, [
  { name: "email_sent", pass: true, note: "msgId=123" }
]);
```

---

## withAction Helper

The `withAction` helper orchestrates the complete flow:

```ts
import { AccountabilityLayer, withAction } from "@apaai-labs/accountability";

const apaai = new AccountabilityLayer({ 
  endpoint: "https://api.apaaiprotocol.org",
  apiKey: process.env.APAAI_API_KEY 
});

await withAction({
  apaai,
  type: "send_email",
  actor: { kind: "agent", "name": "mail-bot" },
  target: "mailto:client@acme.com",
  params: { subject: "Proposal" },
  
  onApproval: async ({ actionId }) => {
    // Handle approval workflow
    await apaai.approve(actionId, "@reviewer");
  },
  
  execute: async () => {
    // Your business logic
    return await sendEmail({ to: "client@acme.com", subject: "Proposal" });
  },
  
  evidence: {
    onSuccess: (result) => [
      { name: "email_sent", pass: true, note: `msgId=${result.id}` }
    ],
    onError: (err) => [
      { name: "email_failed", pass: false, note: String(err) }
    ]
  }
});
```

---

## API Reference

### AccountabilityLayer Class

```ts
const apaai = new AccountabilityLayer({ 
  endpoint?: string, 
  apiKey?: string 
});
```

### Core Methods

- **`propose(action)`** - Propose an action and get a decision
- **`submitEvidence(actionId, checks)`** - Submit evidence for an action
- **`policy(actionType?)`** - Get policy for an action type
- **`approve(actionId, approver?)`** - Approve an action
- **`reject(actionId, reason?)`** - Reject an action
- **`getAction(actionId)`** - Get action details
- **`listActions(filters?)`** - List actions with filters
- **`getEvidence(actionId)`** - Get evidence for an action
- **`setPolicy(policy)`** - Set a policy

### Manager Interfaces

- **`apaai.policies.evaluate(actionId)`** - Evaluate policy for an action
- **`apaai.policies.enforce(actionType)`** - Enforce policy for an action type
- **`apaai.policies.set(policy)`** - Set a policy
- **`apaai.human.approve(actionId, approver?)`** - Approve an action
- **`apaai.human.reject(actionId, reason?)`** - Reject an action
- **`apaai.evidence.add(actionId, checks)`** - Add evidence for an action
- **`apaai.evidence.get(actionId)`** - Get evidence for an action
- **`apaai.actions.get(actionId)`** - Get action details
- **`apaai.actions.list(filters?)`** - List actions with filters

---

## Examples

### Basic Flow

```ts
import { AccountabilityLayer } from "@apaai/ts-sdk";

const apaai = new AccountabilityLayer({ endpoint: "http://localhost:8787" });

// Propose action
const decision = await apaai.propose({
  type: "send_email",
  actor: { kind: "agent", name: "mail-bot" },
  target: "mailto:client@acme.com",
  params: { subject: "Proposal" }
});

// Handle approval if required
if (decision.status === "requires_approval") {
  await apaai.approve(decision.actionId, "@reviewer");
}

// Submit evidence
await apaai.submitEvidence(decision.actionId, [
  { name: "email_sent", pass: true, note: "msgId=123" }
]);
```

### Using Manager Interfaces

```ts
// Policy management
const policy = await apaai.policies.enforce("send_email");
await apaai.policies.set({ rules: [...] });

// Human-in-the-loop
await apaai.human.approve(actionId, "@reviewer");
await apaai.human.reject(actionId, "Invalid recipient");

// Evidence management
await apaai.evidence.add(actionId, [
  { name: "email_sent", pass: true, note: "msgId=123" }
]);
const evidence = await apaai.evidence.get(actionId);

// Action management
const action = await apaai.actions.get(actionId);
const actions = await apaai.actions.list({ type: "send_email" });
```

---

## Types

```ts
interface Actor {
  kind: "agent" | "user" | "system";
  name: string;
  provider?: string;
}

interface Action {
  id: string;
  timestamp: string;
  type: string;
  actor: Actor;
  target?: string;
  params?: Record<string, unknown>;
  status?: string;
  checks?: string[];
}

interface Check {
  name: string;
  pass: boolean;
  note?: string;
}

interface Evidence {
  actionId: string;
  checks: Check[];
}

interface Decision {
  status: "approved" | "requires_approval" | "rejected";
  checks?: string[];
}

interface PolicyRule {
  when?: { action?: string; actionType?: string };
  require?: string[];
  mode?: "enforce" | "observe";
}

interface Policy {
  rules: PolicyRule[];
}
```

---

## Testing

```bash
# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

---

## Build & Publish

```bash
# Build the package
npm run build

# Publish to npm
npm publish
```

---

## License

Apache-2.0