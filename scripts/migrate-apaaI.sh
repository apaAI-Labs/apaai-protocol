#!/bin/bash

# 🔁 APAAI Migration Script
# Migrates TRACE Protocol → APAAI Protocol (Accountability Protocol for Agentic AI)
# Usage: ./scripts/migrate-apaaI.sh <repo-path> <branch-name>

set -e

REPO_PATH=${1:-.}
BRANCH_NAME=${2:-chore/rename-to-APAAI}

echo "🚀 Starting APAAI Migration..."
echo "📁 Repository: $REPO_PATH"
echo "🌿 Branch: $BRANCH_NAME"
echo ""

# Change to repo directory
cd "$REPO_PATH"

# Create new branch
echo "📝 Creating branch: $BRANCH_NAME"
git checkout -b "$BRANCH_NAME" 2>/dev/null || git checkout "$BRANCH_NAME"

echo ""
echo "🔄 Running migration transformations..."

# 1. Update package.json files
echo "📦 Updating package.json files..."
find . -name "package.json" -type f -exec node scripts/patch-package-json.js {} \;

# 2. Update pyproject.toml files
echo "🐍 Updating pyproject.toml files..."
find . -name "pyproject.toml" -type f -exec sed -i '' \
  -e 's/name = "traceprotocol"/name = "apaai"/g' \
  -e 's/TRACE Protocol Python SDK/APAAI Protocol Python SDK/g' \
  -e 's/TRACE Labs/apaAI Labs/g' \
  -e 's|https://traceprotocol.org|https://apaaiprotocol.org|g' \
  -e 's|https://github.com/trace-protocol/trace-protocol|https://github.com/apaAI-Labs/apaai-protocol|g' \
  {} \;

# 3. Update README files
echo "📖 Updating README files..."
find . -name "README.md" -type f -exec sed -i '' \
  -e 's/# TRACE Protocol/# APAAI Protocol/g' \
  -e 's/TRACE Protocol/APAAI Protocol/g' \
  -e 's/TRACE — Trusted Records of Autonomous Computation Events/APAAI — Accountability Protocol for Agentic AI/g' \
  -e 's/TRACE lets you:/APAAI lets you:/g' \
  -e 's/What is TRACE Protocol?/What is APAAI Protocol?/g' \
  -e 's/@trace-protocol\/client/@apaai\/client/g' \
  -e 's/traceprotocol/apaai/g' \
  -e 's/trace-protocol/apaai-protocol/g' \
  -e 's/traceprotocol\.org/apaaiprotocol.org/g' \
  -e 's/traceprotocol\.org/apaaiprotocol.org/g' \
  -e 's/TRACE Labs/apaAI Labs/g' \
  -e 's/Build agents that are not only capable — but accountable./Build agents that are not only capable — but accountable./g' \
  {} \;

# 4. Update OpenAPI spec
echo "🔌 Updating OpenAPI specification..."
find . -name "openapi.yaml" -type f -exec sed -i '' \
  -e 's/TRACE Protocol API/APAAI Protocol API/g' \
  -e 's/TRACE Protocol/APAAI Protocol/g' \
  -e 's/Trusted Record of Autonomous Computational Events/Accountability Protocol for Agentic AI/g' \
  -e 's/traceprotocol/apaai/g' \
  -e 's/trace-protocol/apaai-protocol/g' \
  -e 's/traceprotocol\.org/apaaiprotocol.org/g' \
  -e 's/support@traceprotocol\.org/support@apaaiprotocol.org/g' \
  -e 's/TRACE Protocol Support/APAAI Protocol Support/g' \
  {} \;

# 5. Update HTML files
echo "🌐 Updating HTML files..."
find . -name "*.html" -type f -exec sed -i '' \
  -e 's/TRACE Protocol/APAAI Protocol/g' \
  -e 's/traceprotocol\.org/apaaiprotocol.org/g' \
  -e 's/www\.traceprotocol\.org/www.apaaiprotocol.org/g' \
  -e 's/TRACE Labs/apaAI Labs/g' \
  {} \;

# 6. Update TypeScript/JavaScript files
echo "📝 Updating TypeScript/JavaScript files..."
find . -name "*.ts" -o -name "*.js" -o -name "*.mjs" | grep -v node_modules | while read file; do
  sed -i '' \
    -e 's/traceprotocol/apaai/g' \
    -e 's/trace-protocol/apaai-protocol/g' \
    -e 's/TRACE_/APAAI_/g' \
    "$file"
done

# 7. Update Python files
echo "🐍 Updating Python files..."
find . -name "*.py" -type f | grep -v __pycache__ | while read file; do
  sed -i '' \
    -e 's/traceprotocol/apaai/g' \
    -e 's/trace-protocol/apaai-protocol/g' \
    -e 's/TRACE_/APAAI_/g' \
    "$file"
done

# 8. Update JSON files (schemas, configs)
echo "📋 Updating JSON files..."
find . -name "*.json" -type f | grep -v node_modules | grep -v package-lock.json | while read file; do
  sed -i '' \
    -e 's/traceprotocol/apaai/g' \
    -e 's/trace-protocol/apaai-protocol/g' \
    -e 's/TRACE_/APAAI_/g' \
    "$file"
done

# 9. Update other documentation files
echo "📚 Updating documentation files..."
find . -name "*.md" -type f | while read file; do
  sed -i '' \
    -e 's/TRACE Protocol/APAAI Protocol/g' \
    -e 's/TRACE Labs/apaAI Labs/g' \
    -e 's/traceprotocol\.org/apaaiprotocol.org/g' \
    -e 's/trace-protocol/apaai-protocol/g' \
    -e 's/@trace-protocol/@apaai/g' \
    "$file"
done

# 10. Update robots.txt and other config files
echo "🤖 Updating config files..."
find . -name "robots.txt" -o -name "vercel.json" -o -name "*.yaml" -o -name "*.yml" | while read file; do
  sed -i '' \
    -e 's/traceprotocol\.org/apaaiprotocol.org/g' \
    -e 's/trace-protocol/apaai-protocol/g' \
    "$file"
done

# 11. Rename directories
echo "📁 Renaming directories..."
if [ -d "sdk/python/trace_client" ]; then
  mv "sdk/python/trace_client" "sdk/python/apaai_client"
fi

# 12. Update import paths in Python files
echo "🔗 Updating Python import paths..."
find . -name "*.py" -type f | grep -v __pycache__ | while read file; do
  sed -i '' \
    -e 's/from trace_client/from apaai_client/g' \
    -e 's/import trace_client/import apaai_client/g' \
    "$file"
done

# 13. Update test files
echo "🧪 Updating test files..."
find . -name "*.test.*" -o -name "test_*.py" | while read file; do
  sed -i '' \
    -e 's/traceprotocol/apaai/g' \
    -e 's/trace-protocol/apaai-protocol/g' \
    -e 's/TRACE_/APAAI_/g' \
    "$file"
done

echo ""
echo "✅ Migration completed!"
echo ""
echo "📊 Summary of changes:"
echo "  • Package names: traceprotocol → apaai"
echo "  • NPM scope: @trace-protocol → @apaai"
echo "  • Domain: traceprotocol.org → apaaiprotocol.org"
echo "  • Company: TRACE Labs → apaAI Labs"
echo "  • Environment vars: TRACE_ → APAAI_"
echo "  • Directory: trace_client → apaai_client"
echo ""
echo "🔍 Next steps:"
echo "  1. Review changes: git diff"
echo "  2. Test the migration: npm test && python -m pytest"
echo "  3. Commit changes: git add . && git commit -m 'feat: migrate TRACE → APAAI Protocol'"
echo "  4. Push branch: git push origin $BRANCH_NAME"
echo ""
echo "🎉 Ready for APAAI Protocol launch!"
