#!/usr/bin/env python3
"""
Medical Research Evidence Checker
Validates generated medical articles against evidence-based writing standards.

Usage:
  python3 evidence_checker.py <output_dir>           # Check all .md files
  python3 evidence_checker.py <output_dir> --strict   # Fail on warnings too
  python3 evidence_checker.py <file.md>               # Check single file
"""
import argparse
import re
import sys
from dataclasses import dataclass, field
from pathlib import Path


# === Thresholds ===
MIN_WORDS = {"T1": 1500, "T2": 2000, "T3": 1500}
MIN_REFERENCES = {"T1": 2, "T2": 3, "T3": 2}
MIN_LOE_MARKERS = {"T1": 1, "T2": 3, "T3": 2}

GUIDELINE_ORGS = [
    "ACOG", "ASRM", "ESHRE", "WHO", "BYT", "NICE", "RCOG",
    "Cochrane", "FIGO", "ISUOG", "RANZCOG", "SOGC",
]

TIER_MAP = {
    "F-": "T1",
    "VSN-": "T2", "VSM-": "T2", "NTI-": "T2", "BT-": "T2",
    "TC-": "T2", "VT-": "T2", "CTC-": "T2", "AD-": "T2",
    "VU-": "T2", "TK1-": "T2", "TK2-": "T2", "TK3-": "T2",
    "TNC-": "T2", "SSL-": "T2", "HSS-": "T2", "VNPK-": "T2",
    "SMTD-": "T2", "SLTT-": "T2", "UPKSS-": "T2", "PLHP-": "T2",
    "KTHT-": "T3", "PD-": "T3", "PHO-": "T3", "TDP-": "T3",
    "DT-": "T3",
}


@dataclass
class CheckResult:
    file: str
    tier: str = "T2"
    word_count: int = 0
    has_references: bool = False
    reference_count: int = 0
    guideline_refs: list = field(default_factory=list)
    loe_count: int = 0
    has_icd10: bool = False
    has_red_flag: bool = False
    has_disclaimer: bool = False
    has_cross_links: bool = False
    errors: list = field(default_factory=list)
    warnings: list = field(default_factory=list)

    @property
    def score(self) -> int:
        s = 0
        min_words = MIN_WORDS.get(self.tier, 1500)
        min_refs = MIN_REFERENCES.get(self.tier, 2)
        min_loe = MIN_LOE_MARKERS.get(self.tier, 1)

        # Word count (0-10)
        if self.word_count >= min_words:
            s += 10
        elif self.word_count >= min_words * 0.7:
            s += 6
        elif self.word_count >= min_words * 0.5:
            s += 3

        # References (0-10)
        if self.reference_count >= min_refs:
            s += 10
        elif self.reference_count >= 1:
            s += 5

        # Guideline orgs (0-10)
        if len(self.guideline_refs) >= min_refs:
            s += 10
        elif len(self.guideline_refs) >= 1:
            s += 5

        # LoE markers (0-10)
        if self.loe_count >= min_loe:
            s += 10
        elif self.loe_count >= 1:
            s += 5

        # ICD-10 (0-10) — only for T2
        if self.tier == "T2":
            s += 10 if self.has_icd10 else 0
        else:
            s += 10  # N/A for T1/T3

        # Red flag (0-10) — only for T2
        if self.tier == "T2":
            s += 10 if self.has_red_flag else 0
        else:
            s += 10

        # Disclaimer (0-10)
        s += 10 if self.has_disclaimer else 0

        # Cross-links (0-10)
        s += 10 if self.has_cross_links else 0

        return s

    @property
    def grade(self) -> str:
        s = self.score
        if s >= 72:
            return "✅ XUẤT SẮC"
        if s >= 56:
            return "🟡 TỐT"
        if s >= 40:
            return "🟠 TRUNG BÌNH"
        return "❌ FAIL"


def detect_tier(filename: str) -> str:
    for prefix, tier in TIER_MAP.items():
        if filename.startswith(prefix):
            return tier
    return "T2"


def check_file(filepath: Path) -> CheckResult:
    content = filepath.read_text(encoding="utf-8")
    filename = filepath.stem
    result = CheckResult(file=str(filepath), tier=detect_tier(filename))

    # Word count
    result.word_count = len(content.split())
    min_words = MIN_WORDS.get(result.tier, 1500)
    if result.word_count < min_words:
        result.errors.append(f"Word count {result.word_count} < {min_words} minimum")

    # References section
    ref_patterns = [
        r"##\s*\d*\.?\s*TÀI LIỆU THAM KHẢO",
        r"##\s*\d*\.?\s*REFERENCES",
        r"##\s*\d*\.?\s*THAM KHẢO",
    ]
    result.has_references = any(re.search(p, content, re.IGNORECASE) for p in ref_patterns)
    if not result.has_references:
        result.errors.append("Missing '## TÀI LIỆU THAM KHẢO' section")

    # Count reference lines (lines starting with - or * or number in ref section)
    ref_section = ""
    for p in ref_patterns:
        match = re.search(p, content, re.IGNORECASE)
        if match:
            ref_section = content[match.start():]
            # Find next ## to limit scope
            next_section = re.search(r"\n##\s", ref_section[5:])
            if next_section:
                ref_section = ref_section[:next_section.start() + 5]
            break
    ref_lines = re.findall(r"^\s*[-*\d]+\.?\s+.+", ref_section, re.MULTILINE)
    result.reference_count = len(ref_lines)

    # Guideline references (anywhere in text)
    found_orgs = set()
    for org in GUIDELINE_ORGS:
        if re.search(rf"\b{org}\b", content, re.IGNORECASE):
            found_orgs.add(org)
    result.guideline_refs = sorted(found_orgs)

    min_refs = MIN_REFERENCES.get(result.tier, 2)
    if len(found_orgs) < min_refs:
        result.warnings.append(
            f"Only {len(found_orgs)} guideline org(s) cited, need ≥ {min_refs}"
        )

    # Level of Evidence markers
    loe_matches = re.findall(r"\[LoE:\s*[IViv]+", content)
    result.loe_count = len(loe_matches)
    min_loe = MIN_LOE_MARKERS.get(result.tier, 1)
    if result.loe_count < min_loe:
        result.warnings.append(f"Only {result.loe_count} LoE marker(s), need ≥ {min_loe}")

    # ICD-10 (for T2)
    icd_pattern = r"ICD-10\s*:\s*[A-Z]\d"
    result.has_icd10 = bool(re.search(icd_pattern, content))
    if result.tier == "T2" and not result.has_icd10:
        result.warnings.append("No ICD-10 code found (expected for pathology article)")

    # Red flag marker
    red_flag_patterns = [r"CỜ ĐỎ", r"⚠️.*CỜ ĐỎ", r"RED FLAG"]
    result.has_red_flag = any(re.search(p, content) for p in red_flag_patterns)
    if result.tier == "T2" and not result.has_red_flag:
        result.warnings.append("Missing '⚠️ CỜ ĐỎ' section")

    # Disclaimer
    disclaimer_patterns = [
        r"DISCLAIMER",
        r"cần chỉ định của bác sĩ",
        r"bác sĩ chuyên khoa",
        r"⚕️",
    ]
    result.has_disclaimer = any(re.search(p, content, re.IGNORECASE) for p in disclaimer_patterns)
    if not result.has_disclaimer:
        result.errors.append("Missing medical disclaimer")

    # Cross-links
    cross_patterns = [r"CROSS.?LINK", r"Xem chi tiết", r"→\s*Xem", r"Xem thêm"]
    result.has_cross_links = any(re.search(p, content, re.IGNORECASE) for p in cross_patterns)
    if not result.has_cross_links:
        result.warnings.append("No cross-links to related articles")

    return result


def main():
    parser = argparse.ArgumentParser(description="🏥 Medical Research Evidence Checker")
    parser.add_argument("path", help="File or directory to check")
    parser.add_argument("--strict", action="store_true", help="Treat warnings as errors")
    args = parser.parse_args()

    target = Path(args.path)
    if target.is_file():
        files = [target]
    elif target.is_dir():
        files = sorted(target.rglob("*.md"))
    else:
        print(f"❌ Path not found: {target}")
        sys.exit(1)

    if not files:
        print(f"⚠️ No .md files found in {target}")
        sys.exit(0)

    results = [check_file(f) for f in files]

    # === Summary Table ===
    print("\n" + "=" * 80)
    print("🏥 MEDICAL RESEARCH EVIDENCE CHECK")
    print("=" * 80)
    print(f"\n📁 Checked: {len(results)} file(s)\n")

    print(f"{'File':<30} {'Tier':<5} {'Words':<7} {'Refs':<5} {'LoE':<5} {'Score':<7} {'Grade'}")
    print("-" * 80)

    total_errors = 0
    total_warnings = 0

    for r in results:
        fname = Path(r.file).stem[:28]
        print(f"{fname:<30} {r.tier:<5} {r.word_count:<7} {r.reference_count:<5} {r.loe_count:<5} {r.score}/80  {r.grade}")
        total_errors += len(r.errors)
        total_warnings += len(r.warnings)

    # === Detail Errors ===
    print(f"\n{'=' * 80}")
    print(f"📊 Total: {total_errors} error(s), {total_warnings} warning(s)")
    print(f"{'=' * 80}")

    if total_errors > 0 or total_warnings > 0:
        for r in results:
            if r.errors or r.warnings:
                print(f"\n📄 {Path(r.file).stem}")
                for e in r.errors:
                    print(f"  ❌ {e}")
                for w in r.warnings:
                    print(f"  ⚠️  {w}")

    # === Score Summary ===
    if results:
        avg_score = sum(r.score for r in results) / len(results)
        print(f"\n📈 Average Score: {avg_score:.1f}/80")

        excellent = sum(1 for r in results if r.score >= 72)
        good = sum(1 for r in results if 56 <= r.score < 72)
        avg = sum(1 for r in results if 40 <= r.score < 56)
        fail = sum(1 for r in results if r.score < 40)
        print(f"   ✅ Xuất sắc: {excellent} | 🟡 Tốt: {good} | 🟠 TB: {avg} | ❌ Fail: {fail}")

    # Exit code
    if args.strict and (total_errors > 0 or total_warnings > 0):
        sys.exit(1)
    elif total_errors > 0:
        sys.exit(1)
    sys.exit(0)


if __name__ == "__main__":
    main()
