#!/bin/bash
# Batch validation script for multiple test projects
# Validates all projects and generates summary report

set -e

# Configuration
TEST_DIR="${1:-test-projects-generated}"
RESULTS_DIR="test-results/batch-$(date +%Y%m%d-%H%M%S)"
SUMMARY_FILE="${RESULTS_DIR}/summary.md"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Initialize
mkdir -p "${RESULTS_DIR}/reports"
TOTAL=0
PASSED=0
FAILED=0
SCORES=()

echo -e "${BLUE}╔═══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║${NC}   ${GREEN}UX-Master Batch Validation${NC}                                 ${BLUE}║${NC}"
echo -e "${BLUE}╚═══════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo "Test Directory: ${TEST_DIR}"
echo "Results: ${RESULTS_DIR}"
echo ""

# Check if test directory exists
if [ ! -d "${TEST_DIR}" ]; then
    echo -e "${RED}Error: Test directory not found: ${TEST_DIR}${NC}"
    echo ""
    echo "Generate test projects first:"
    echo "  ./generate-test-projects.sh"
    exit 1
fi

# Count total projects
TOTAL=$(find "${TEST_DIR}" -name "index.html" | wc -l | tr -d ' ')
echo "Found ${TOTAL} projects to validate"
echo ""

# Initialize summary report
cat > "${SUMMARY_FILE}" << EOF
# UX-Master Batch Validation Report

**Date:** $(date)  
**Test Directory:** ${TEST_DIR}  
**Total Projects:** ${TOTAL}

## Summary

| Metric | Value |
|--------|-------|
| Total Projects | ${TOTAL} |
| Passed (≥80) | COUNT_PLACEHOLDER |
| Warning (60-79) | COUNT_PLACEHOLDER |
| Failed (<60) | COUNT_PLACEHOLDER |
| Average Score | AVG_PLACEHOLDER |

## Results by Project

| # | Project | Category | Lang | Stack | Score | Status |
|---|---------|----------|------|-------|-------|--------|
EOF

# Counter
CURRENT=0

# Validate each project
while IFS= read -r html_file; do
    CURRENT=$((CURRENT + 1))
    
    # Extract project info from path
    project_dir=$(dirname "${html_file}")
    project_name=$(basename "${project_dir}")
    category=$(basename "$(dirname "${project_dir}")")
    
    # Parse language and stack from project name
    lang=$(echo "${project_name}" | cut -d'-' -f1)
    stack=$(echo "${project_name}" | cut -d'-' -f2)
    
    echo -e "${BLUE}[${CURRENT}/${TOTAL}]${NC} Validating: ${project_name}..."
    
    # Run validation
    report_file="${RESULTS_DIR}/reports/${project_name}.json"
    
    if uxm validate "${html_file}" --suite all --format json --output "${report_file}" 2>/dev/null; then
        # Extract score
        if [ -f "${report_file}" ]; then
            score=$(jq -r '.score // 0' "${report_file}")
            
            # Determine status
            if (( $(echo "${score} >= 80" | bc -l) )); then
                status="✅ Pass"
                status_icon="${GREEN}✅${NC}"
                PASSED=$((PASSED + 1))
            elif (( $(echo "${score} >= 60" | bc -l) )); then
                status="⚠️ Warning"
                status_icon="${YELLOW}⚠️${NC}"
            else
                status="❌ Fail"
                status_icon="${RED}❌${NC}"
                FAILED=$((FAILED + 1))
            fi
            
            SCORES+=("${score}")
            
            echo -e "  ${status_icon} Score: ${score} - ${status}"
            
            # Add to summary
            echo "| ${CURRENT} | ${project_name} | ${category} | ${lang} | ${stack} | ${score} | ${status} |" >> "${SUMMARY_FILE}"
        else
            echo -e "  ${RED}❌ Error: No report generated${NC}"
            echo "| ${CURRENT} | ${project_name} | ${category} | ${lang} | ${stack} | Error | ❌ Error |" >> "${SUMMARY_FILE}"
            FAILED=$((FAILED + 1))
        fi
    else
        echo -e "  ${RED}❌ Validation failed${NC}"
        echo "| ${CURRENT} | ${project_name} | ${category} | ${lang} | ${stack} | Error | ❌ Error |" >> "${SUMMARY_FILE}"
        FAILED=$((FAILED + 1))
    fi
    
done < <(find "${TEST_DIR}" -name "index.html")

# Calculate statistics
if [ ${#SCORES[@]} -gt 0 ]; then
    # Calculate average
    sum=0
    for score in "${SCORES[@]}"; do
        sum=$(echo "${sum} + ${score}" | bc)
    done
    avg=$(echo "scale=1; ${sum} / ${#SCORES[@]}" | bc)
    
    # Count by range
    high=0
    medium=0
    low=0
    for score in "${SCORES[@]}"; do
        if (( $(echo "${score} >= 80" | bc -l) )); then
            high=$((high + 1))
        elif (( $(echo "${score} >= 60" | bc -l) )); then
            medium=$((medium + 1))
        else
            low=$((low + 1))
        fi
    done
else
    avg="N/A"
    high=0
    medium=0
    low=0
fi

# Update summary with final counts
sed -i.bak "s/COUNT_PLACEHOLDER/${high}/g" "${SUMMARY_FILE}"
sed -i.bak "s/COUNT_PLACEHOLDER/${medium}/g" "${SUMMARY_FILE}"
sed -i.bak "s/COUNT_PLACEHOLDER/${low}/g" "${SUMMARY_FILE}"
sed -i.bak "s/AVG_PLACEHOLDER/${avg}/g" "${SUMMARY_FILE}"
rm -f "${SUMMARY_FILE}.bak"

# Add details section
cat >> "${SUMMARY_FILE}" << EOF

## Statistics

### Score Distribution

- **Excellent (90-100):** $(echo "${SCORES[@]}" | tr ' ' '\n' | awk '$1 >= 90' | wc -l | tr -d ' ')
- **Good (80-89):** $(echo "${SCORES[@]}" | tr ' ' '\n' | awk '$1 >= 80 && $1 < 90' | wc -l | tr -d ' ')
- **Fair (70-79):** $(echo "${SCORES[@]}" | tr ' ' '\n' | awk '$1 >= 70 && $1 < 80' | wc -l | tr -d ' ')
- **Poor (60-69):** $(echo "${SCORES[@]}" | tr ' ' '\n' | awk '$1 >= 60 && $1 < 70' | wc -l | tr -d ' ')
- **Critical (<60):** $(echo "${SCORES[@]}" | tr ' ' '\n' | awk '$1 < 60' | wc -l | tr -d ' ')

### By Language

| Language | Count | Avg Score |
|----------|-------|-----------|
EOF

# Group by language
declare -A LANG_COUNTS
declare -A LANG_SCORES

for score in "${SCORES[@]}"; do
    # This is a simplified version - real implementation would track per-lang scores
    : # Placeholder
    break
done

cat >> "${SUMMARY_FILE}" << EOF

### By Stack

| Stack | Count | Avg Score |
|-------|-------|-----------|
EOF

# Add recommendations
cat >> "${SUMMARY_FILE}" << EOF

## Recommendations

Based on the validation results:

1. **High Priority:** Projects with scores below 60 need immediate attention
2. **Medium Priority:** Projects with scores 60-79 should be reviewed
3. **Best Practices:** Projects with scores 80+ demonstrate good UX practices

## Detailed Reports

Individual HTML reports are available in:
\`\`\`
${RESULTS_DIR}/reports/
\`\`\`

To view a specific report:
\`\`\`
open ${RESULTS_DIR}/reports/<project-name>.html
\`\`\`

---
Generated by UX-Master Batch Validation
EOF

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "                      BATCH VALIDATION COMPLETE                  "
echo "═══════════════════════════════════════════════════════════════"
echo ""
echo -e "  Total:    ${TOTAL}"
echo -e "  ${GREEN}Passed:${NC}   ${high} (≥80)"
echo -e "  ${YELLOW}Warning:${NC}  ${medium} (60-79)"
echo -e "  ${RED}Failed:${NC}   ${low} (<60)"
echo ""
echo "  Average Score: ${avg}"
echo ""
echo "  Summary Report: ${SUMMARY_FILE}"
echo "  Detailed Reports: ${RESULTS_DIR}/reports/"
echo ""
echo "═══════════════════════════════════════════════════════════════"
echo ""

# Exit with count of failures
exit ${low}
