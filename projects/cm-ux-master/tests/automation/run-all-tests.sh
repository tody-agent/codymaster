#!/bin/bash
# UX-Master Master Test Runner
# Runs all automation tests and generates report

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
VERSION="2.0.0"
RESULTS_DIR="test-results/$(date +%Y%m%d-%H%M%S)"
mkdir -p "${RESULTS_DIR}"

# Track results
declare -A TEST_RESULTS
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Header
echo -e "${BLUE}╔═══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║${NC}   ${GREEN}UX-Master Automation Test Suite${NC}                              ${BLUE}║${NC}"
echo -e "${BLUE}║${NC}   Version: ${VERSION}                                           ${BLUE}║${NC}"
echo -e "${BLUE}╚═══════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Function to run a test
run_test() {
    local test_id=$1
    local test_name=$2
    local test_command=$3
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    
    echo -e "${BLUE}[${TOTAL_TESTS}]${NC} Testing: ${test_name}..."
    
    local log_file="${RESULTS_DIR}/${test_id}.log"
    local start_time=$(date +%s)
    
    if eval "${test_command}" > "${log_file}" 2>&1; then
        local end_time=$(date +%s)
        local duration=$((end_time - start_time))
        echo -e "  ${GREEN}✅ PASS${NC} (${duration}s)"
        TEST_RESULTS["${test_id}"]="PASS:${duration}"
        PASSED_TESTS=$((PASSED_TESTS + 1))
        return 0
    else
        local end_time=$(date +%s)
        local duration=$((end_time - start_time))
        echo -e "  ${RED}❌ FAIL${NC} (${duration}s)"
        echo -e "  ${YELLOW}   See:${NC} ${log_file}"
        TEST_RESULTS["${test_id}"]="FAIL:${duration}"
        FAILED_TESTS=$((FAILED_TESTS + 1))
        return 1
    fi
}

# Function to check command exists
check_command() {
    if ! command -v "$1" &> /dev/null; then
        echo -e "${RED}Error: $1 is not installed${NC}"
        return 1
    fi
    return 0
}

# Pre-flight checks
echo -e "${YELLOW}▶ Pre-flight Checks${NC}"
echo ""

check_command "python3" || exit 1
check_command "pip" || exit 1
check_command "curl" || exit 1

echo -e "  ${GREEN}✓${NC} Python: $(python3 --version)"
echo -e "  ${GREEN}✓${NC} pip: $(pip --version | cut -d' ' -f2)"
echo -e "  ${GREEN}✓${NC} curl: $(curl --version | head -1)"
echo ""

# Create test projects
echo -e "${YELLOW}▶ Setting up Test Projects${NC}"
echo ""

mkdir -p test-projects/{landing,dashboard,mobile}/{en,vi,ja}-{react,vue,html}

for dir in test-projects/*/*; do
    if [ -d "$dir" ]; then
        cat > "${dir}/index.html" << 'EOF'
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Test</title>
    <style>
        :root { --primary: #0064FA; --spacing: 4px; }
        body { font-family: system-ui; padding: calc(var(--spacing) * 8); }
        .btn { background: var(--primary); color: white; padding: 12px 24px; min-height: 44px; }
    </style>
</head>
<body>
    <h1>Title</h1>
    <h2>Subtitle</h2>
    <button class="btn">Click</button>
</body>
</html>
EOF
    fi
done

echo -e "  ${GREEN}✓${NC} Created $(find test-projects -name 'index.html' | wc -l) test projects"
echo ""

# Run Installation Tests
echo -e "${YELLOW}▶ Installation Tests${NC}"
echo ""

run_test "INST-001" "Fresh pip install" \
    "pip install --force-reinstall uxmaster-cli && uxm --version | grep '${VERSION}'"

run_test "INST-002" "Check CLI available" \
    "which uxm"

run_test "INST-003" "Check all commands" \
    "uxm --help && uxm init --help && uxm search --help && uxm validate --help"

echo ""

# Run CLI Tests
echo -e "${YELLOW}▶ CLI Command Tests${NC}"
echo ""

run_test "CLI-001" "Init dry-run for Claude" \
    "uxm init --ai claude --dry-run | grep -q 'claude'"

run_test "CLI-002" "Init dry-run for all platforms" \
    "uxm init --ai all --dry-run | grep -c 'config' | grep -q '[0-9]'"

run_test "CLI-003" "Search UX Laws" \
    "uxm search 'mobile' --domain ux-laws | grep -q 'Fitts'"

run_test "CLI-004" "Search Design Tests" \
    "uxm search 'button' --domain design-tests | grep -q 'DT-'"

run_test "CLI-005" "Generate design system (dry)" \
    "uxm search 'dashboard' --design-system --dry-run | grep -q 'Design System'"

run_test "CLI-006" "Validate HTML file" \
    "uxm validate test-projects/landing/en-react/index.html --suite mobile | grep -q 'Score'"

echo ""

# Run Validation Engine Tests
echo -e "${YELLOW}▶ Validation Engine Tests${NC}"
echo ""

run_test "VAL-001" "Validation with good design" \
    "python3 -c 'import sys; sys.path.insert(0, \"scripts\"); from validation_engine import ValidationEngine; e=ValidationEngine(); r=e.validate({\"meta\":{\"pageType\":\"landing\"},\"visualAnalysis\":{\"colors\":{\"semantic\":{\"primary\":{\"base\":\"#0064FA\"}}},\"typography\":{\"hierarchy\":{\"h1\":{\"size\":\"32px\"}}}},\"components\":{\"blueprints\":{\"button\":{\"representative\":{\"dimensions\":{\"width\":100,\"height\":44}}}}},\"quality\":{\"accessibility\":{\"contrastIssues\":[]}}},\"all\"); exit(0 if r.score > 70 else 1)'"

run_test "VAL-002" "Validation with bad design" \
    "python3 -c 'import sys; sys.path.insert(0, \"scripts\"); from validation_engine import ValidationEngine; e=ValidationEngine(); r=e.validate({\"meta\":{},\"visualAnalysis\":{},\"components\":{},\"quality\":{\"accessibility\":{\"contrastIssues\":[{\"contrast\":\"2.0\"}]}}},\"all\"); exit(0 if r.failed_count > 0 else 1)'"

echo ""

# Run MCP Server Tests (if server is running)
echo -e "${YELLOW}▶ MCP Server Tests${NC}"
echo ""

# Start MCP server in background
uxm mcp start --port 18888 &
MCP_PID=$!
sleep 3

run_test "MCP-001" "Server health check" \
    "curl -s http://localhost:18888/health | grep -q 'healthy'"

run_test "MCP-002" "Initialize endpoint" \
    "curl -s -X POST http://localhost:18888/mcp/v1/initialize | grep -q 'ux-master'"

run_test "MCP-003" "Tools list endpoint" \
    "curl -s -X POST http://localhost:18888/mcp/v1/tools/list | grep -q 'search_ux_laws'"

run_test "MCP-004" "Search tool execution" \
    "curl -s -X POST http://localhost:18888/mcp/v1/tools/call -H 'Content-Type: application/json' -d '{\"name\":\"search_ux_laws\",\"arguments\":{\"query\":\"test\"}}' | grep -q 'laws'"

# Stop MCP server
kill $MCP_PID 2>/dev/null || true

echo ""

# Run Performance Tests
echo -e "${YELLOW}▶ Performance Tests${NC}"
echo ""

run_test "PERF-001" "CLI startup time (<500ms)" \
    "python3 -c 'import time; start=time.time(); import subprocess; subprocess.run([\"uxm\",\"--version\"],capture_output=True); elapsed=(time.time()-start)*1000; exit(0 if elapsed < 500 else 1)'"

run_test "PERF-002" "Validation speed (<2s)" \
    "python3 -c 'import time; import sys; sys.path.insert(0,\"scripts\"); from validation_engine import ValidationEngine; e=ValidationEngine(); d={\"meta\":{\"pageType\":\"landing\"},\"visualAnalysis\":{\"colors\":{\"semantic\":{\"primary\":{\"base\":\"#0064FA\"}}},\"typography\":{\"hierarchy\":{\"h1\":{\"size\":\"32px\"}}}},\"components\":{},\"quality\":{\"accessibility\":{\"contrastIssues\":[]}}}; start=time.time(); e.validate(d,\"all\"); elapsed=(time.time()-start)*1000; exit(0 if elapsed < 2000 else 1)'"

echo ""

# Run Cross-Platform Tests
echo -e "${YELLOW}▶ Cross-Platform Tests${NC}"
echo ""

OS=$(uname -s)
run_test "XPLAT-001" "Detect OS: ${OS}" \
    "case ${OS} in Linux|Darwin) exit 0;; MINGW*|MSYS*|CYGWIN*) exit 0;; *) exit 1;; esac"

run_test "XPLAT-002" "Config path exists" \
    "test -d ~/.config || test -d ~/Library/Application\ Support || test -d \"%APPDATA%\""

echo ""

# Generate Summary Report
echo -e "${YELLOW}▶ Generating Report${NC}"
echo ""

REPORT_FILE="${RESULTS_DIR}/summary.md"

cat > "${REPORT_FILE}" << EOF
# UX-Master Automation Test Report

**Date:** $(date)  
**Version:** ${VERSION}  
**Platform:** $(uname -s)  
**Python:** $(python3 --version)

## Summary

| Metric | Value |
|--------|-------|
| Total Tests | ${TOTAL_TESTS} |
| ✅ Passed | ${PASSED_TESTS} |
| ❌ Failed | ${FAILED_TESTS} |
| Success Rate | $(echo "scale=1; ${PASSED_TESTS} * 100 / ${TOTAL_TESTS}" | bc)% |

## Test Details

| Test ID | Result | Duration |
|---------|--------|----------|
EOF

for test_id in "${!TEST_RESULTS[@]}"; do
    result="${TEST_RESULTS[$test_id]}"
    status=$(echo "$result" | cut -d: -f1)
    duration=$(echo "$result" | cut -d: -f2)
    
    if [ "$status" == "PASS" ]; then
        echo "| ${test_id} | ✅ PASS | ${duration}s |" >> "${REPORT_FILE}"
    else
        echo "| ${test_id} | ❌ FAIL | ${duration}s |" >> "${REPORT_FILE}"
    fi
done

cat >> "${REPORT_FILE}" << EOF

## Failed Tests Details

EOF

# Add failed test details
for test_id in "${!TEST_RESULTS[@]}"; do
    result="${TEST_RESULTS[$test_id]}"
    status=$(echo "$result" | cut -d: -f1)
    
    if [ "$status" == "FAIL" ]; then
        echo "### ${test_id}" >> "${REPORT_FILE}"
        echo '```' >> "${REPORT_FILE}"
        tail -20 "${RESULTS_DIR}/${test_id}.log" >> "${REPORT_FILE}"
        echo '```' >> "${REPORT_FILE}"
        echo "" >> "${REPORT_FILE}"
    fi
done

cat >> "${REPORT_FILE}" << EOF

## System Information

\`\`\`
$(uxm --version)
$(pip show uxmaster-cli | grep -E "^(Name|Version|Location)")
\`\`\`

---
Generated by UX-Master Automation Test Suite
EOF

echo -e "  ${GREEN}✓${NC} Report saved: ${REPORT_FILE}"
echo ""

# Final Summary
echo "═══════════════════════════════════════════════════════════════"
echo "                      TEST SUMMARY                             "
echo "═══════════════════════════════════════════════════════════════"
echo ""
echo -e "  Total Tests:    ${TOTAL_TESTS}"
echo -e "  ${GREEN}Passed:${NC}         ${PASSED_TESTS}"
echo -e "  ${RED}Failed:${NC}         ${FAILED_TESTS}"
echo -e "  Success Rate:   $(echo "scale=1; ${PASSED_TESTS} * 100 / ${TOTAL_TESTS}" | bc)%"
echo ""
echo -e "  Results:        ${RESULTS_DIR}/"
echo "═══════════════════════════════════════════════════════════════"
echo ""

# Cleanup
rm -rf test-projects

# Exit with failure count
exit ${FAILED_TESTS}
