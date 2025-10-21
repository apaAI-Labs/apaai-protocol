# APAAI Protocol — Accountability Layer for Agentic AI

APAAI is the open protocol that turns agent intent into verifiable outcomes — **Action → Policy → Evidence**.

**Install**
```bash
npm i @apaai/accountability
pip install apaai
```

**Use**

```ts
import { AccountabilityLayer } from "@apaai/accountability";

const al = new AccountabilityLayer({ apiKey: process.env.APAAI_API_KEY });
// or:
const apaai = new AccountabilityLayer({ apiKey: process.env.APAAI_API_KEY });
```

---

## 🎯 What is APAAI Protocol?

APAAI lets you:

- **Propose Actions** — define autonomous intents that require oversight  
- **Enforce Policies** — require approvals, validations, or constraints  
- **Collect Evidence** — log verifiable results and artifacts  
- **Audit Everything** — build a complete accountability trail

---

## 📁 Repository Structure

```
apaai-protocol/
├── schema/                      # JSON Schemas for validation
├── server/                      # Reference server implementation (TypeScript)
├── sdk/
│   ├── packages/client/         # TypeScript/JavaScript SDK
│   └── python/trace_client/    # Python SDK
├── examples/                    # Working examples and demos
├── website/                     # Static documentation website
├── openapi.yaml                 # OpenAPI specification
├── vercel.json                  # Deployment config
└── scripts/                     # Build and test scripts
```

---

## 🚀 Quick Start

### 1️⃣ Run the reference server
```bash
cd server
npm install
npm run dev
# → http://localhost:8787
```

### 2️⃣ Try the SDK examples

**TypeScript**
```bash
npm install @apaai/client
cd ../../..
node examples/sendEmail.mjs
```

**Python**
```bash
pip install apaai
python examples/python/send_email.py
```

**Expected output:**
```
Decision: requires_approval ['reviewer_approval']
Approved: <action-id>
Evidence submitted (success).
Done.
```

---

## 🧩 Core Components

### 📋 Schemas
Define structure for Action, Policy, and Evidence.

### 🖥️ Server
Reference backend implementing REST endpoints and storage backends (File, Postgres, S3).

### 📦 SDKs
- **TypeScript SDK**: `@apaai/client` ([npm](https://www.npmjs.com/package/@apaai/client))
- **Python SDK**: `apaai` ([PyPI](https://pypi.org/project/apaai/))

Both expose high-level helpers for proposing actions, enforcing policies, and emitting evidence.

### 🧪 Examples
Runnable examples covering the full Action → Policy → Evidence lifecycle.

---

## 📖 Documentation

| Resource | Description |
|----------|-------------|
| [Main site](https://apaai.org/) | Overview and rationale |
| [Manifesto](https://apaai.org/manifesto) | Principles and philosophy |
| [Technical Spec](https://apaai.org/spec.html) | Human-readable specification |
| [OpenAPI](openapi.yaml) | Machine-readable API definition |

---

## 🛠️ Development

### Requirements
- Node.js ≥ 18
- Python ≥ 3.9
- npm / pip

### Tests
```bash
# JS SDK
cd sdk/packages/client && npm test

# Python SDK
cd sdk/python && pytest
```

### Build
```bash
npm -C sdk/packages/client run build
pip install -e ./sdk/python
```

---

## ⚖️ License

- **Code & SDKs**: Apache 2.0
- **Specification**: CC BY 4.0

---

## 🤝 Contributing

Contributions welcome!  
See [CONTRIBUTING.md](CONTRIBUTING.md) for RFC guidelines, bug reporting, and feature proposals.

---

**Build agents that are not only capable — but accountable.**