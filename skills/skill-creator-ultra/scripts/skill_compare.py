#!/usr/bin/env python3
"""
skill_compare.py — So sánh 2 phiên bản Skill.md

Sử dụng:
    python skill_compare.py /path/to/old/SKILL.md /path/to/new/SKILL.md
    python skill_compare.py /path/to/old-skill/ /path/to/new-skill/
    python skill_compare.py /path/to/old/ /path/to/new/ --json

Hiển thị:
  - Diff tổng quan (dòng thêm/xóa/thay đổi)
  - So sánh sections (thêm/xóa/thay đổi kích thước)
  - So sánh metrics (steps, examples, constraints)
  - Đánh giá: cải thiện hay tệ hơn?

Developed by Thân Công Hải — Skill Generator v3.2 Expert
"""

import sys
import os
import re
import json


class Colors:
    PASS = '\033[92m'
    FAIL = '\033[91m'
    WARN = '\033[93m'
    INFO = '\033[96m'
    BOLD = '\033[1m'
    DIM = '\033[2m'
    RESET = '\033[0m'

    @staticmethod
    def enable_windows():
        if os.name == 'nt':
            try:
                import ctypes
                kernel32 = ctypes.windll.kernel32
                kernel32.SetConsoleMode(kernel32.GetStdHandle(-11), 7)
            except Exception:
                pass


Colors.enable_windows()


def parse_frontmatter(content):
    match = re.match(r'^---\s*\n(.*?)\n---\s*\n', content, re.DOTALL)
    if not match:
        return {}, content
    fm_text = match.group(1)
    body = content[match.end():]
    frontmatter = {}
    current_key = None
    current_value = []
    for line in fm_text.split('\n'):
        key_match = re.match(r'^(\w+):\s*(.*)', line)
        if key_match:
            if current_key:
                frontmatter[current_key] = '\n'.join(current_value).strip()
            current_key = key_match.group(1)
            current_value = [key_match.group(2)] if key_match.group(2) and key_match.group(2) != '|' else []
        elif current_key and line.startswith('  '):
            current_value.append(line.strip())
    if current_key:
        frontmatter[current_key] = '\n'.join(current_value).strip()
    return frontmatter, body


def get_metrics(content, body):
    """Trích xuất metrics từ skill."""
    return {
        'lines': content.count('\n') + 1,
        'words': len(content.split()),
        'chars': len(content),
        'h1_sections': len(re.findall(r'^#\s+', body, re.MULTILINE)),
        'h2_sections': len(re.findall(r'^##\s+', body, re.MULTILINE)),
        'steps': len(re.findall(r'^\d+\.', body, re.MULTILINE)),
        'examples': len(re.findall(r'^##\s+.*[Vv]í dụ|^##\s+.*[Ee]xample|^###\s+.*[Vv]í dụ', body, re.MULTILINE)),
        'constraints': len(re.findall(r'(KHÔNG ĐƯỢC|LUÔN LUÔN|🚫|✅)', body)),
        'code_blocks': len(re.findall(r'```', body)) // 2,
        'tables': len(re.findall(r'^\|.*\|$', body, re.MULTILINE)),
        'error_handling': len(re.findall(r'(nếu lỗi|fallback|retry|edge case|VERIFY)', body, re.IGNORECASE)),
    }


def get_sections(body):
    """Lấy danh sách sections và kích thước."""
    sections = {}
    current = None
    lines = 0
    for line in body.split('\n'):
        h1 = re.match(r'^#\s+(.+)', line)
        if h1:
            if current:
                sections[current] = lines
            current = h1.group(1).strip()
            lines = 0
        else:
            lines += 1
    if current:
        sections[current] = lines
    return sections


def format_delta(old_val, new_val, higher_is_better=True):
    """Format thay đổi với màu sắc."""
    delta = new_val - old_val
    if delta == 0:
        return f"{Colors.DIM}= (không đổi){Colors.RESET}"
    
    if higher_is_better:
        color = Colors.PASS if delta > 0 else Colors.FAIL
    else:
        color = Colors.FAIL if delta > 0 else Colors.PASS
    
    sign = '+' if delta > 0 else ''
    pct = round(delta / old_val * 100) if old_val > 0 else 0
    return f"{color}{sign}{delta} ({sign}{pct}%){Colors.RESET}"


def compare_skills(path_old, path_new, json_output=False):
    """So sánh 2 skill."""

    # Resolve paths
    skill_old = os.path.join(path_old, 'SKILL.md') if os.path.isdir(path_old) else path_old
    skill_new = os.path.join(path_new, 'SKILL.md') if os.path.isdir(path_new) else path_new

    for path, label in [(skill_old, 'OLD'), (skill_new, 'NEW')]:
        if not os.path.exists(path):
            print(f"{Colors.FAIL}❌ Không tìm thấy {label}: {path}{Colors.RESET}")
            return False

    with open(skill_old, 'r', encoding='utf-8') as f:
        content_old = f.read()
    with open(skill_new, 'r', encoding='utf-8') as f:
        content_new = f.read()

    fm_old, body_old = parse_frontmatter(content_old)
    fm_new, body_new = parse_frontmatter(content_new)

    metrics_old = get_metrics(content_old, body_old)
    metrics_new = get_metrics(content_new, body_new)

    sections_old = get_sections(body_old)
    sections_new = get_sections(body_new)

    name_old = fm_old.get('name', 'unknown')
    name_new = fm_new.get('name', 'unknown')

    # JSON output
    if json_output:
        output = {
            'old': {'name': name_old, 'file': skill_old, 'metrics': metrics_old},
            'new': {'name': name_new, 'file': skill_new, 'metrics': metrics_new},
            'deltas': {k: metrics_new[k] - metrics_old[k] for k in metrics_old},
            'sections': {
                'added': [s for s in sections_new if s not in sections_old],
                'removed': [s for s in sections_old if s not in sections_new],
                'changed': {s: {'old': sections_old.get(s, 0), 'new': sections_new.get(s, 0)}
                           for s in set(sections_old) & set(sections_new)
                           if sections_old.get(s, 0) != sections_new.get(s, 0)},
            },
        }
        print(json.dumps(output, ensure_ascii=False, indent=2))
        return True

    # Pretty output
    print()
    print(f"{Colors.BOLD}{'=' * 60}{Colors.RESET}")
    print(f"{Colors.BOLD}  🔄 SKILL COMPARE — So sánh 2 phiên bản{Colors.RESET}")
    print(f"{Colors.BOLD}{'=' * 60}{Colors.RESET}")
    print(f"  {Colors.DIM}OLD: {skill_old}{Colors.RESET}")
    print(f"  {Colors.INFO}NEW: {skill_new}{Colors.RESET}")
    print()

    # Metrics comparison
    metric_labels = {
        'lines': ('📏 Dòng', True),
        'words': ('📝 Từ', True),
        'steps': ('📋 Steps', True),
        'examples': ('🎯 Examples', True),
        'constraints': ('⚠️ Constraints', True),
        'code_blocks': ('💻 Code blocks', True),
        'error_handling': ('🛡️ Error handling', True),
    }

    print(f"  {Colors.BOLD}📊 So sánh metrics:{Colors.RESET}")
    print(f"  {'Metric':<22} {'OLD':>8} {'NEW':>8} {'Thay đổi'}")
    print(f"  {'─' * 55}")

    improvements = 0
    regressions = 0

    for key, (label, higher_better) in metric_labels.items():
        old_v = metrics_old[key]
        new_v = metrics_new[key]
        delta_str = format_delta(old_v, new_v, higher_better)
        print(f"  {label:<22} {old_v:>8} {new_v:>8} {delta_str}")

        delta = new_v - old_v
        if (higher_better and delta > 0) or (not higher_better and delta < 0):
            improvements += 1
        elif delta != 0:
            regressions += 1

    print()

    # Sections comparison
    added = [s for s in sections_new if s not in sections_old]
    removed = [s for s in sections_old if s not in sections_new]

    if added or removed:
        print(f"  {Colors.BOLD}📋 Sections thay đổi:{Colors.RESET}")
        for s in added:
            print(f"     {Colors.PASS}+ {s} ({sections_new[s]} dòng){Colors.RESET}")
        for s in removed:
            print(f"     {Colors.FAIL}- {s} ({sections_old[s]} dòng){Colors.RESET}")
        print()

    # Changed sections
    changed = [(s, sections_old[s], sections_new[s])
               for s in set(sections_old) & set(sections_new)
               if sections_old[s] != sections_new[s]]

    if changed:
        print(f"  {Colors.BOLD}📐 Sections thay đổi kích thước:{Colors.RESET}")
        for name, old_lines, new_lines in sorted(changed, key=lambda x: x[2] - x[1], reverse=True):
            delta = new_lines - old_lines
            color = Colors.PASS if delta > 0 else Colors.FAIL
            sign = '+' if delta > 0 else ''
            print(f"     {name[:30]:<30} {old_lines:>5} → {new_lines:>5} ({color}{sign}{delta}{Colors.RESET})")
        print()

    # Overall verdict
    print(f"{Colors.BOLD}{'=' * 60}{Colors.RESET}")
    if improvements > regressions:
        print(f"  {Colors.PASS}🎉 VERDICT: Phiên bản mới TỐT HƠN ({improvements} cải thiện, {regressions} giảm){Colors.RESET}")
    elif regressions > improvements:
        print(f"  {Colors.FAIL}⚠️ VERDICT: Phiên bản mới CÓ VẤN ĐỀ ({regressions} giảm, {improvements} cải thiện){Colors.RESET}")
    else:
        print(f"  {Colors.INFO}ℹ️ VERDICT: Hai phiên bản TƯƠNG ĐƯƠNG{Colors.RESET}")
    print(f"{Colors.BOLD}{'=' * 60}{Colors.RESET}")
    print()

    return True


if __name__ == '__main__':
    if len(sys.argv) < 3:
        print("Sử dụng: python skill_compare.py <old-path> <new-path>")
        print("Options:")
        print("  --json    Output dạng JSON")
        print()
        print("Ví dụ:")
        print("  python skill_compare.py ./my-skill-v1/ ./my-skill-v2/")
        print("  python skill_compare.py old-SKILL.md new-SKILL.md")
        sys.exit(1)

    target_old = sys.argv[1]
    target_new = sys.argv[2]
    json_mode = '--json' in sys.argv

    compare_skills(target_old, target_new, json_output=json_mode)
