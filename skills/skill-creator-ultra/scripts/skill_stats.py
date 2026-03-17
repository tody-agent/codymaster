#!/usr/bin/env python3
"""
skill_stats.py — Phân tích thống kê nhanh cho SKILL.md

Sử dụng:
    python skill_stats.py /path/to/SKILL.md
    python skill_stats.py /path/to/skill-folder/
    python skill_stats.py /path/to/skill-folder/ --json

Hiển thị:
  - Tổng dòng, từ, ký tự
  - Số sections, steps, examples, constraints
  - Cognitive Load Score (ước tính)
  - Tỷ lệ phân bổ nội dung (Instructions vs Examples vs Constraints)
  - Cảnh báo nếu quá dài/ngắn

Developed by Thân Công Hải — Skill Generator v3.2 Expert
"""

import sys
import os
import re
import json


# ============================================================
# COLOR OUTPUT
# ============================================================

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
    """Trích xuất YAML frontmatter."""
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


def find_sections_with_sizes(body):
    """Tìm sections và tính kích thước mỗi section. Bỏ qua headings trong code blocks."""
    sections = []
    current_section = None
    current_lines = 0
    in_code_block = False

    for line in body.split('\n'):
        stripped = line.strip()
        
        # Phát hiện code block
        if stripped.startswith('```'):
            in_code_block = not in_code_block
            current_lines += 1
            continue
        
        # Bỏ qua headings trong code block
        if in_code_block:
            current_lines += 1
            continue
        
        h1_match = re.match(r'^#\s+(.+)', line)
        if h1_match:
            if current_section:
                sections.append((current_section, current_lines))
            current_section = h1_match.group(1).strip()
            current_lines = 0
        else:
            current_lines += 1

    if current_section:
        sections.append((current_section, current_lines))

    return sections


# ============================================================
# COGNITIVE LOAD CALCULATOR
# ============================================================

def calculate_cognitive_load(body):
    """
    Tính Cognitive Load Score.
    Budget tối đa: 100 điểm
    - Steps: mỗi step = 3 điểm (tối đa 30)
    - Constraints: mỗi constraint = 2 điểm (tối đa 20)
    - Examples: mỗi ví dụ = 5 điểm (tối đa 25)
    - Conditions: mỗi if/nếu = 2 điểm (tối đa 25)
    """
    steps = len(re.findall(r'^\d+\.', body, re.MULTILINE))
    constraints = len(re.findall(r'(KHÔNG ĐƯỢC|LUÔN LUÔN|🚫|✅)', body))
    examples = len(re.findall(r'^##\s+.*[Vv]í dụ|^##\s+.*[Ee]xample|^###\s+.*[Vv]í dụ', body, re.MULTILINE))
    conditions = len(re.findall(r'\b(nếu|if |khi |when )\b', body, re.IGNORECASE))

    load = {
        'steps': min(steps * 3, 30),
        'constraints': min(constraints * 2, 20),
        'examples': min(examples * 5, 25),
        'conditions': min(conditions * 2, 25),
    }
    load['total'] = sum(load.values())
    load['raw'] = {'steps': steps, 'constraints': constraints, 'examples': examples, 'conditions': conditions}

    return load


# ============================================================
# MAIN
# ============================================================

def analyze_skill(target_path, json_output=False):
    """Phân tích thống kê skill."""

    if os.path.isdir(target_path):
        skill_md = os.path.join(target_path, 'SKILL.md')
        skill_dir = target_path
    else:
        skill_md = target_path
        skill_dir = os.path.dirname(target_path)

    if not os.path.exists(skill_md):
        print(f"{Colors.FAIL}❌ Không tìm thấy SKILL.md tại: {skill_md}{Colors.RESET}")
        return False

    with open(skill_md, 'r', encoding='utf-8') as f:
        content = f.read()

    frontmatter, body = parse_frontmatter(content)
    name = frontmatter.get('name', 'unknown')

    # Basic stats
    lines = content.count('\n') + 1
    words = len(content.split())
    chars = len(content)

    # Section analysis
    sections = find_sections_with_sizes(body)
    h1_count = len(sections)
    h2_count = len(re.findall(r'^##\s+', body, re.MULTILINE))
    h3_count = len(re.findall(r'^###\s+', body, re.MULTILINE))

    # Content counts
    steps = len(re.findall(r'^\d+\.', body, re.MULTILINE))
    examples = len(re.findall(r'^##\s+.*[Vv]í dụ|^##\s+.*[Ee]xample|^###\s+.*[Vv]í dụ', body, re.MULTILINE))
    constraints_positive = len(re.findall(r'(LUÔN LUÔN|✅)', body))
    constraints_negative = len(re.findall(r'(KHÔNG ĐƯỢC|🚫)', body))
    code_blocks = len(re.findall(r'```', body)) // 2
    tables = len(re.findall(r'^\|', body, re.MULTILINE))
    links = len(re.findall(r'\[.*?\]\(.*?\)', body))

    # Cognitive Load
    cognitive = calculate_cognitive_load(body)

    # Directory stats
    dir_files = 0
    dir_scripts = 0
    dir_resources = 0
    dir_examples = 0

    if os.path.isdir(skill_dir):
        for root, dirs, files in os.walk(skill_dir):
            for f in files:
                dir_files += 1
                rel = os.path.relpath(root, skill_dir)
                if rel.startswith('scripts'):
                    dir_scripts += 1
                elif rel.startswith('resources'):
                    dir_resources += 1
                elif rel.startswith('examples'):
                    dir_examples += 1

    # JSON output
    if json_output:
        output = {
            'name': name,
            'file': skill_md,
            'basic': {'lines': lines, 'words': words, 'chars': chars},
            'structure': {
                'h1_sections': h1_count, 'h2_sections': h2_count, 'h3_sections': h3_count,
                'steps': steps, 'examples': examples,
                'constraints_positive': constraints_positive,
                'constraints_negative': constraints_negative,
                'code_blocks': code_blocks, 'tables': tables, 'links': links,
            },
            'cognitive_load': cognitive,
            'directory': {
                'total_files': dir_files, 'scripts': dir_scripts,
                'resources': dir_resources, 'examples': dir_examples,
            },
            'sections': [{'name': s[0], 'lines': s[1]} for s in sections],
        }
        print(json.dumps(output, ensure_ascii=False, indent=2))
        return True

    # Pretty output
    print()
    print(f"{Colors.BOLD}{'=' * 55}{Colors.RESET}")
    print(f"{Colors.BOLD}  📊 SKILL STATS — Phân tích thống kê{Colors.RESET}")
    print(f"{Colors.BOLD}  Skill: {Colors.INFO}{name}{Colors.RESET}")
    print(f"{Colors.BOLD}{'=' * 55}{Colors.RESET}")
    print()

    # Basic
    print(f"  {Colors.BOLD}📏 Kích thước:{Colors.RESET}")
    print(f"     Dòng:   {Colors.INFO}{lines:,}{Colors.RESET}")
    print(f"     Từ:     {Colors.INFO}{words:,}{Colors.RESET}")
    print(f"     Ký tự:  {Colors.INFO}{chars:,}{Colors.RESET}")
    print()

    # Structure
    print(f"  {Colors.BOLD}🏗️ Cấu trúc:{Colors.RESET}")
    print(f"     Sections (H1):    {h1_count}")
    print(f"     Sub-sections:     {h2_count} (H2) + {h3_count} (H3)")
    print(f"     Steps:            {steps}")
    print(f"     Examples:         {examples}")
    print(f"     Constraints:      ✅ {constraints_positive} (DO) + 🚫 {constraints_negative} (DON'T)")
    print(f"     Code blocks:      {code_blocks}")
    print(f"     Tables:           {tables // 2 if tables > 0 else 0}")
    print(f"     Links:            {links}")
    print()

    # Cognitive Load
    cl = cognitive
    if cl['total'] <= 50:
        cl_color = Colors.PASS
        cl_status = '🟢 Nhẹ'
    elif cl['total'] <= 75:
        cl_color = Colors.WARN
        cl_status = '🟡 Trung bình'
    else:
        cl_color = Colors.FAIL
        cl_status = '🔴 Nặng'

    print(f"  {Colors.BOLD}🧠 Cognitive Load:{Colors.RESET}")
    print(f"     Score:       {cl_color}{cl['total']}/100 — {cl_status}{Colors.RESET}")
    print(f"     Steps:       {cl['raw']['steps']} × 3đ = {cl['steps']}/30")
    print(f"     Constraints: {cl['raw']['constraints']} × 2đ = {cl['constraints']}/20")
    print(f"     Examples:    {cl['raw']['examples']} × 5đ = {cl['examples']}/25")
    print(f"     Conditions:  {cl['raw']['conditions']} × 2đ = {cl['conditions']}/25")
    print()

    # Section breakdown
    if sections:
        print(f"  {Colors.BOLD}📋 Phân bổ nội dung:{Colors.RESET}")
        total_lines = sum(s[1] for s in sections)
        for section_name, section_lines in sections:
            pct = round(section_lines / total_lines * 100) if total_lines > 0 else 0
            bar = '█' * (pct // 5) + '░' * (20 - pct // 5)
            print(f"     {section_name[:25]:<25} {bar} {pct}% ({section_lines} dòng)")
        print()

    # Directory
    if dir_files > 1:
        print(f"  {Colors.BOLD}📁 Thư mục:{Colors.RESET}")
        print(f"     Tổng files:    {dir_files}")
        print(f"     Scripts:       {dir_scripts}")
        print(f"     Resources:     {dir_resources}")
        print(f"     Examples:      {dir_examples}")
        print()

    # Warnings
    warnings = []
    if lines < 50:
        warnings.append('Skill quá ngắn (<50 dòng) — có thể thiếu chi tiết')
    if lines > 2000:
        warnings.append('Skill quá dài (>2000 dòng) — cân nhắc tách hoặc dùng resources/')
    if examples == 0:
        warnings.append('KHÔNG có ví dụ — thêm ≥2 ví dụ!')
    if steps == 0:
        warnings.append('KHÔNG có steps đánh số — Instructions nên có bước rõ ràng')
    if constraints_positive + constraints_negative == 0:
        warnings.append('KHÔNG có constraints — thêm quy tắc DOs/DON\'Ts!')
    if cl['total'] > 80:
        warnings.append(f'Cognitive Load cao ({cl["total"]}/100) — AI có thể bị overload')

    if warnings:
        print(f"  {Colors.WARN}⚠️ Cảnh báo:{Colors.RESET}")
        for w in warnings:
            print(f"     → {w}")
        print()

    print(f"{Colors.BOLD}{'=' * 55}{Colors.RESET}")
    print()
    return True


if __name__ == '__main__':
    if len(sys.argv) < 2:
        print("Sử dụng: python skill_stats.py <path-to-SKILL.md-or-skill-folder>")
        print("Options:")
        print("  --json    Output dạng JSON")
        print()
        print("Ví dụ:   python skill_stats.py ./my-skill/")
        sys.exit(1)

    target = sys.argv[1]
    json_mode = '--json' in sys.argv

    if not os.path.exists(target):
        print(f"❌ Không tìm thấy: {target}")
        sys.exit(1)

    analyze_skill(target, json_output=json_mode)
