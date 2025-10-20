# 🔁 APAAI Migration Documentation

## Overview

This document outlines the complete migration from **APAAI Protocol** to **APAAI Protocol** (Accountability Protocol for Agentic AI).

## Migration Mapping

| Component | From | To |
|-----------|------|-----|
| **Protocol Name** | APAAI Protocol | APAAI Protocol |
| **Full Name** | Trusted Records of Autonomous Computation Events | Accountability Protocol for Agentic AI |
| **Company** | apaAI Labs | apaAI Labs |
| **Domain** | apaaiprotocol.org | apaaiprotocol.org |
| **NPM Package** | @apaai-protocol/client | @apaai/client |
| **PyPI Package** | traceprotocol | apaai |
| **Environment Prefix** | TRACE_ | APAAI_ |
| **GitHub Org** | apaai-protocol | apaAI-Labs |
| **Repository** | apaai-protocol | apaai-protocol |

## Files Modified

### Package Configuration Files
- `package.json` (root, server, sdk/ts/client)
- `package-lock.json` files
- `pyproject.toml` (Python SDK)
- `requirements*.txt` files

### Documentation Files
- `README.md` (all instances)
- `CONTRIBUTING.md`
- `CHANGELOG.md`
- `ANNOUNCEMENT.md`
- `LICENSE`

### API & Configuration
- `openapi.yaml`
- `vercel.json`
- `robots.txt`
- `tsconfig.json` files

### Website Files
- `website/index.html`
- `website/manifesto.html`
- `website/spec.html`
- `website/test.html`
- `website/404.html`

### Source Code Files
- TypeScript files (`*.ts`, `*.js`, `*.mjs`)
- Python files (`*.py`)
- JSON schema files (`*.json`)

### Test Files
- `*.test.ts`
- `test_*.py`
- `conftest.py`

## Directory Structure Changes

```
Before:
sdk/python/trace_client/

After:
sdk/python/apaai_client/
```

## Environment Variables

| Old | New |
|-----|-----|
| `TRACE_API_URL` | `APAAI_API_URL` |
| `TRACE_API_KEY` | `APAAI_API_KEY` |
| `TRACE_ENDPOINT` | `APAAI_ENDPOINT` |

## Import Path Changes

### Python
```python
# Before
from trace_client import Client
import trace_client.api

# After  
from apaai_client import Client
import apaai_client.api
```

### TypeScript/JavaScript
```typescript
// Before
import { Client } from '@apaai-protocol/client'

// After
import { Client } from '@apaai/client'
```

## Usage Instructions

### 1. Run Migration Script
```bash
./scripts/migrate-apaaI.sh . chore/rename-to-APAAI
```

### 2. Review Changes
```bash
git diff
```

### 3. Test Migration
```bash
# Test TypeScript SDK
cd sdk/ts/client && npm test

# Test Python SDK  
cd sdk/python/apaai_client && python -m pytest

# Test Server
cd server && npm test
```

### 4. Commit Changes
```bash
git add .
git commit -m "feat: migrate TRACE → APAAI Protocol

- Rename all packages: traceprotocol → apaai
- Update domains: apaaiprotocol.org → apaaiprotocol.org  
- Change company: apaAI Labs → apaAI Labs
- Update environment variables: TRACE_ → APAAI_
- Rename directory: trace_client → apaai_client"
```

### 5. Push Branch
```bash
git push origin chore/rename-to-APAAI
```

## Post-Migration Checklist

- [ ] Verify all package names updated
- [ ] Test SDK installations (`npm install @apaai/client`, `pip install apaai`)
- [ ] Verify API endpoints work
- [ ] Check documentation links
- [ ] Test examples in `/examples/`
- [ ] Verify OpenAPI spec is valid
- [ ] Test website deployment
- [ ] Update CI/CD pipelines
- [ ] Update Docker images
- [ ] Notify team members

## Rollback Plan

If issues arise, rollback using:
```bash
git checkout main
git branch -D chore/rename-to-APAAI
```

## Notes

- This migration preserves all functionality while updating branding
- API endpoints remain compatible (only domain changes)
- All existing data structures are maintained
- Migration is designed to be reversible if needed

## Support

For questions about this migration, contact the apaAI Labs team.
