#!/bin/bash
#
# UX Master Quick Start Script
# One command to extract and setup complete design system
#
# Usage:
#   ./quick-start.sh https://example.com
#   ./quick-start.sh https://example.com --framework semi --name MyApp

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Default values
URL=""
FRAMEWORK="react-tailwind"
PROJECT_NAME=""
OUTPUT_DIR="./output"

# Parse arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --framework|-f)
      FRAMEWORK="$2"
      shift 2
      ;;
    --name|-n)
      PROJECT_NAME="$2"
      shift 2
      ;;
    --output|-o)
      OUTPUT_DIR="$2"
      shift 2
      ;;
    --help|-h)
      echo "UX Master Quick Start"
      echo ""
      echo "Usage: $0 <url> [options]"
      echo ""
      echo "Options:"
      echo "  --framework, -f    Target framework (react-tailwind, semi, vue)"
      echo "  --name, -n         Project name"
      echo "  --output, -o       Output directory"
      echo "  --help, -h         Show this help"
      echo ""
      echo "Examples:"
      echo "  $0 https://example.com"
      echo "  $0 https://example.com --framework semi --name MyApp"
      exit 0
      ;;
    -*)
      echo "${RED}Unknown option: $1${NC}"
      exit 1
      ;;
    *)
      URL="$1"
      shift
      ;;
  esac
done

# Validate URL
if [ -z "$URL" ]; then
  echo "${RED}Error: URL is required${NC}"
  echo "Usage: $0 <url>"
  exit 1
fi

# Extract domain for project name if not provided
if [ -z "$PROJECT_NAME" ]; then
  PROJECT_NAME=$(echo "$URL" | sed -E 's|https?://||' | sed -E 's|www\.||' | cut -d'/' -f1 | cut -d'.' -f1)
fi

echo "${BLUE}"
echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║                                                               ║"
echo "║   UX Master Quick Start                                       ║"
echo "║   Extract → Generate → Export                                 ║"
echo "║                                                               ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo "${NC}"

echo "${BLUE}Configuration:${NC}"
echo "  URL:        $URL"
echo "  Framework:  $FRAMEWORK"
echo "  Project:    $PROJECT_NAME"
echo "  Output:     $OUTPUT_DIR/$PROJECT_NAME"
echo ""

# Check dependencies
echo "${YELLOW}→ Checking dependencies...${NC}"

if ! command -v python3 &> /dev/null; then
  echo "${RED}Error: Python 3 is required${NC}"
  exit 1
fi

if ! python3 -c "import playwright" 2>/dev/null; then
  echo "${YELLOW}Installing Playwright...${NC}"
  pip install playwright
  playwright install chromium
fi

echo "${GREEN}✓ Dependencies ready${NC}"
echo ""

# Step 1: Extract
echo "${YELLOW}→ Step 1/4: Extracting design system...${NC}"
python3 scripts/wizard.py --url "$URL" --name "$PROJECT_NAME" --framework "$FRAMEWORK" --output "$OUTPUT_DIR"

if [ $? -ne 0 ]; then
  echo "${RED}Error: Extraction failed${NC}"
  exit 1
fi

echo "${GREEN}✓ Design system extracted${NC}"
echo ""

# Step 2: Generate Figma tokens
echo "${YELLOW}→ Step 2/4: Generating Figma tokens...${NC}"
python3 scripts/figma_bridge.py export \
  --input "$OUTPUT_DIR/$PROJECT_NAME/design-system.json" \
  --name "$PROJECT_NAME" \
  --output "$OUTPUT_DIR/$PROJECT_NAME/figma-tokens.json"

echo "${GREEN}✓ Figma tokens ready${NC}"
echo ""

# Step 3: Generate Stitch files
echo "${YELLOW}→ Step 3/4: Creating Google Stitch files...${NC}"
python3 scripts/stitch_integration.py design-md \
  --input "$OUTPUT_DIR/$PROJECT_NAME/design-system.json" \
  --project "$PROJECT_NAME" \
  --output "$OUTPUT_DIR/$PROJECT_NAME/DESIGN.md"

echo "${GREEN}✓ Stitch files ready${NC}"
echo ""

# Step 4: Summary
echo "${YELLOW}→ Step 4/4: Finalizing...${NC}"

echo ""
echo "${GREEN}"
echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║                    🎉 SUCCESS! 🎉                              ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo "${NC}"

echo "${BLUE}Project: $PROJECT_NAME${NC}"
echo "${BLUE}Location: $OUTPUT_DIR/$PROJECT_NAME${NC}"
echo ""

echo "${GREEN}Generated Files:${NC}"
ls -lh "$OUTPUT_DIR/$PROJECT_NAME" | tail -n +2 | awk '{print "  📄 " $9 " (" $5 ")"}'

echo ""
echo "${GREEN}Next Steps:${NC}"
echo "  1. Review design-system.css for tokens"
echo "  2. Import figma-tokens.json to Figma Tokens Studio"
echo "  3. Use DESIGN.md with Google Stitch"
echo "  4. Copy components/ to your project"
echo ""

echo "${YELLOW}Quick Commands:${NC}"
echo "  cd $OUTPUT_DIR/$PROJECT_NAME"
echo "  cat design-system.css         # View CSS variables"
echo "  cat figma-tokens.json         # View Figma tokens"
echo "  cat DESIGN.md                 # View Stitch documentation"
echo ""

echo "${BLUE}Happy coding! 🚀${NC}"
