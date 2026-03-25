#!/bin/bash
# Build script: combines landing page + docs site into one dist/
set -e

echo "🏗️  Building Content Factory..."

# 1. Create clean dist
rm -rf dist
mkdir -p dist/docs

# 2. Copy landing page to root
echo "📄 Copying landing page..."
cp landing/index.html dist/
cp landing/style.css dist/
cp landing/script.js dist/
cp landing/translations.js dist/

# 3. Build docs site
echo "📚 Building docs site..."
cd docs-site
npx astro build
cd ..

# 4. Copy docs build to dist/docs/
echo "📦 Copying docs to dist/docs/..."
cp -r docs-site/dist/* dist/docs/

echo "✅ Build complete! Output → dist/"
echo "   Landing: dist/index.html"
echo "   Docs:    dist/docs/index.html"
