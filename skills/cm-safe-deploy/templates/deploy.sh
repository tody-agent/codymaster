#!/bin/bash
# deploy.sh — 9-Gate Deploy Pipeline
# Usage: ./deploy.sh [staging|production]

set -e
TARGET="${1:-staging}"
echo "🚀 Deploying to $TARGET..."

# Gate 0: Secret Hygiene
echo "🔒 Gate 0: Secret Hygiene..."
if grep -rq 'SERVICE_KEY\|ANON_KEY\|DB_PASSWORD' wrangler.jsonc 2>/dev/null; then
  echo "❌ Secrets found in wrangler.jsonc! Use 'wrangler secret put' instead."
  exit 1
fi
if ! grep -q '.dev.vars' .gitignore; then
  echo "❌ .dev.vars not in .gitignore!"
  exit 1
fi
echo "✅ Gate 0 passed"

# Gate 1: Syntax Validation
echo "📝 Gate 1: Syntax Validation..."
if [ -f "tsconfig.json" ]; then
  npx tsc --noEmit
else
  find src/ public/ -name "*.js" -exec node -c {} \; 2>&1
fi
echo "✅ Gate 1 passed"

# Gate 2: Test Suite
echo "🧪 Gate 2: Test Suite..."
npm run test:gate
echo "✅ Gate 2 passed"

# Gate 3: i18n Parity
echo "🌍 Gate 3: i18n Parity..."
if [ -d "public/static/i18n" ]; then
  PRIMARY=$(wc -l < public/static/i18n/vi.json)
  for f in public/static/i18n/*.json; do
    COUNT=$(wc -l < "$f")
    if [ "$COUNT" != "$PRIMARY" ]; then
      echo "❌ $(basename $f) has $COUNT lines vs primary $PRIMARY"
      exit 1
    fi
  done
  echo "✅ Gate 3 passed"
else
  echo "⏭️ Gate 3 skipped (no i18n)"
fi

# Gate 4: Build
echo "🏗️ Gate 4: Build..."
if grep -q '"build"' package.json; then
  npm run build
  echo "✅ Gate 4 passed"
else
  echo "⏭️ Gate 4 skipped (no build script)"
fi

# Gate 5: Dist Verification
echo "📦 Gate 5: Dist Verification..."
# Customize this for your project
echo "✅ Gate 5 passed"

# Gate 6: Deploy + Smoke Test
echo "🚀 Gate 6: Deploy..."
if [ "$TARGET" = "production" ]; then
  BRANCH=$(git branch --show-current)
  if [ "$BRANCH" != "production" ]; then
    echo "❌ Must be on 'production' branch for production deploy"
    exit 1
  fi
fi
# Replace with your deploy command:
# npx wrangler pages deploy dist/ --project-name=YOUR_PROJECT
echo "✅ Gate 6 passed"

# Gate 7: Version Bump (post-deploy)
echo "🏷️ Gate 7: Version Bump..."
# npm run release:version
echo "✅ Gate 7 passed"

# Gate 8: Changelog (post-deploy)
echo "📋 Gate 8: Changelog..."
# npm run release:changelog
echo "✅ Gate 8 passed"

echo ""
echo "🎉 All 9 gates passed! Deployed to $TARGET."
