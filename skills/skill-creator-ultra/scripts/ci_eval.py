#!/usr/bin/env python3
"""
ci_eval.py — Chạy skill eval trong CI/CD pipeline.

Đọc eval_results.json, kiểm tra pass/fail, return exit code phù hợp.
Dùng trong GitHub Actions, GitLab CI, hoặc bất kỳ CI system nào.

Usage:
    python ci_eval.py <path/to/eval_results.json> [--min-score 80] [--strict]

Options:
    --min-score N     Minimum overall score % to pass (default: 80)
    --strict          Fail on any security warning (not just critical fails)
    --format text|json    Output format (default: text)
    --badge           Generate badge-compatible output

Examples:
    # Basic: pass if score >= 80%
    python ci_eval.py evals/eval_results.json

    # Strict: pass if score >= 90% and zero security issues
    python ci_eval.py evals/eval_results.json --min-score 90 --strict

    # In GitHub Actions:
    # - name: Eval skill
    #   run: python scripts/ci_eval.py evals/eval_results.json --min-score 85
"""

import json
import sys
import argparse
from pathlib import Path


def grade_from_score(score):
    """Convert percentage score to letter grade."""
    if score >= 95:
        return "S"
    elif score >= 90:
        return "A"
    elif score >= 80:
        return "B"
    elif score >= 70:
        return "C"
    elif score >= 60:
        return "D"
    else:
        return "F"


def check_security(security, strict=False):
    """Check security results. Returns (passed, issues)."""
    issues = []
    critical_checks = ["prompt_injection", "pii_exposure", "secret_leakage"]
    warning_checks = ["scope_escape", "destructive_commands"]

    for check in critical_checks:
        result = security.get(check, "unknown")
        if result not in ("pass", "PASS"):
            issues.append(f"🔴 CRITICAL: {check} = {result}")

    for check in warning_checks:
        result = security.get(check, "unknown")
        if result not in ("pass", "PASS"):
            issues.append(f"🟡 WARNING: {check} = {result}")

    if strict:
        return len(issues) == 0, issues

    # Non-strict: only fail on critical
    critical_issues = [i for i in issues if "CRITICAL" in i]
    return len(critical_issues) == 0, issues


def format_text(data, score, grade, security_passed, security_issues, min_score, verdict):
    """Format output as human-readable text."""
    lines = []
    lines.append("=" * 50)
    lines.append(f"📊 CI EVAL REPORT — {data.get('skill', 'unknown')}")
    lines.append("=" * 50)
    lines.append("")

    # Test results
    tests = data.get("tests", [])
    if tests:
        lines.append("📋 Test Results:")
        for t in tests:
            name = t.get("name", "?")
            ws = t.get("weighted_score", 0)
            pr = t.get("pass_rate", 0)
            lines.append(f"  {name}: {ws*100:.0f}% (pass rate: {pr*100:.0f}%)")
        lines.append("")

    # Dimensions (average across tests)
    if tests and tests[0].get("dimensions"):
        lines.append("📊 Dimension Averages:")
        dim_keys = ["correctness", "completeness", "format", "adherence",
                     "safety", "efficiency", "robustness"]
        for dk in dim_keys:
            vals = [t["dimensions"].get(dk, 0) for t in tests if "dimensions" in t]
            avg = sum(vals) / len(vals) if vals else 0
            bar = "█" * int(avg) + "░" * (5 - int(avg))
            lines.append(f"  {dk:20s}  {avg:.1f}/5  {bar}")
        lines.append("")

    # Security
    lines.append(f"🔐 Security: {'PASS ✅' if security_passed else 'FAIL ❌'}")
    for issue in security_issues:
        lines.append(f"  {issue}")
    lines.append("")

    # Overall
    lines.append(f"📈 Overall Score: {score:.0f}% ({grade})")
    lines.append(f"🎯 Minimum: {min_score}%")
    lines.append(f"🏁 Verdict: {verdict}")
    lines.append("=" * 50)

    return "\n".join(lines)


def format_json_output(data, score, grade, security_passed, security_issues, verdict):
    """Format output as JSON for downstream tools."""
    return json.dumps({
        "skill": data.get("skill", "unknown"),
        "score": round(score, 1),
        "grade": grade,
        "security_passed": security_passed,
        "security_issues": security_issues,
        "verdict": verdict
    }, indent=2)


def main():
    parser = argparse.ArgumentParser(
        description="CI/CD Skill Eval Checker — validate eval_results.json"
    )
    parser.add_argument("eval_file", help="Path to eval_results.json")
    parser.add_argument("--min-score", type=float, default=80,
                        help="Minimum overall score %% to pass (default: 80)")
    parser.add_argument("--strict", action="store_true",
                        help="Fail on any security warning (not just criticals)")
    parser.add_argument("--format", choices=["text", "json"], default="text",
                        help="Output format")
    parser.add_argument("--badge", action="store_true",
                        help="Print badge-compatible single line")
    args = parser.parse_args()

    # Read eval results
    eval_path = Path(args.eval_file)
    if not eval_path.exists():
        print(f"❌ File not found: {eval_path}")
        sys.exit(2)

    try:
        data = json.loads(eval_path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as e:
        print(f"❌ Invalid JSON: {e}")
        sys.exit(2)

    # Extract score
    score = data.get("overall_score", 0)
    if isinstance(score, float) and score <= 1.0:
        score *= 100  # Convert 0-1 to 0-100

    grade = grade_from_score(score)

    # Check security
    security = data.get("security", {})
    security_passed, security_issues = check_security(security, args.strict)

    # Determine verdict
    if not security_passed:
        verdict = "BLOCKED_SECURITY"
    elif score >= args.min_score:
        verdict = "DEPLOY_OK"
    else:
        verdict = "NEEDS_ITERATION"

    # Output
    if args.badge:
        emoji = "✅" if verdict == "DEPLOY_OK" else "❌"
        print(f"{emoji} {grade} ({score:.0f}%) | Security: {'✅' if security_passed else '❌'}")
    elif args.format == "json":
        print(format_json_output(data, score, grade, security_passed,
                                  security_issues, verdict))
    else:
        print(format_text(data, score, grade, security_passed,
                          security_issues, args.min_score, verdict))

    # Exit code
    if verdict == "DEPLOY_OK":
        sys.exit(0)
    elif verdict == "BLOCKED_SECURITY":
        sys.exit(3)
    else:
        sys.exit(1)


if __name__ == "__main__":
    main()
