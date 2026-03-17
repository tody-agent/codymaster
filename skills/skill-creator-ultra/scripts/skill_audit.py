#!/usr/bin/env python3
"""
skill_audit.py — Tự audit Skill theo 7 Nguyên Tắc Hoàn Hảo

Sử dụng:
    python skill_audit.py /path/to/SKILL.md
    python skill_audit.py /path/to/skill-folder/
    python skill_audit.py /path/to/skill-folder/ --json    # Output JSON
    python skill_audit.py /path/to/skill-folder/ --strict  # Chấm khắt khe

7 Nguyên tắc:
  1. Atomic Logic      — 1 skill = 1 việc (tên không có AND)
  2. Semantic Trigger   — Description đủ dài, có trigger phrases
  3. 4 Core Sections    — Goal + Instructions + Examples + Constraints
  4. Show Don't Tell    — ≥2 ví dụ có Input/Output
  5. Semantic Precision — Không dùng từ mơ hồ
  6. Error Recovery     — Có xử lý lỗi, fallback
  7. Black Box Scripts  — Script có --help, --dry-run (nếu có scripts/)

Developed by Thân Công Hải — Skill Generator v3.2 Expert
"""

import sys
import os
import re
import json
from pathlib import Path


# ============================================================
# COLOR OUTPUT
# ============================================================

class Colors:
    """ANSI color codes cho terminal output."""
    PASS = '\033[92m'
    FAIL = '\033[91m'
    WARN = '\033[93m'
    INFO = '\033[96m'
    BOLD = '\033[1m'
    DIM = '\033[2m'
    RESET = '\033[0m'

    @staticmethod
    def enable_windows():
        """Bật ANSI colors cho Windows terminal."""
        if os.name == 'nt':
            try:
                import ctypes
                kernel32 = ctypes.windll.kernel32
                kernel32.SetConsoleMode(kernel32.GetStdHandle(-11), 7)
            except Exception:
                pass


Colors.enable_windows()


# ============================================================
# PARSERS
# ============================================================

def parse_frontmatter(content):
    """Trích xuất YAML frontmatter từ nội dung SKILL.md."""
    match = re.match(r'^---\s*\n(.*?)\n---\s*\n', content, re.DOTALL)
    if not match:
        return None, content

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


def find_sections(body):
    """Tìm tất cả heading sections (# Level 1) trong body."""
    sections = {}
    current_section = None
    current_content = []

    for line in body.split('\n'):
        h1_match = re.match(r'^#\s+(.+)', line)
        if h1_match:
            if current_section:
                sections[current_section.lower()] = '\n'.join(current_content)
            current_section = h1_match.group(1).strip()
            current_content = []
        else:
            current_content.append(line)

    if current_section:
        sections[current_section.lower()] = '\n'.join(current_content)

    return sections


# ============================================================
# 7 AUDIT PRINCIPLES
# ============================================================

AMBIGUOUS_WORDS = [
    'xử lý', 'kiểm tra', 'tối ưu', 'cải thiện', 'tốt',
    'sạch', 'nhiều', 'lớn', 'nhanh', 'phù hợp',
    'hợp lý', 'chính xác', 'đầy đủ', 'chuẩn', 'ổn',
]

ERROR_KEYWORDS = [
    'nếu lỗi', 'nếu không', 'if error', 'fallback', 'retry',
    'thất bại', 'failed', 'không tìm thấy', 'not found',
    'trường hợp đặc biệt', 'edge case', 'ngoại lệ', 'exception',
    'VERIFY', 'verify', 'kiểm tra lại', 'double-check',
]


def audit_principle_1_atomic(frontmatter, body):
    """Nguyên tắc 1: Atomic Logic — 1 skill = 1 việc."""
    result = {'name': 'Atomic Logic', 'score': 0, 'max': 15, 'details': []}

    name = frontmatter.get('name', '')
    desc = frontmatter.get('description', '')

    # Check 1: Tên không chứa AND/và/+
    if not re.search(r'\band\b|\bvà\b|\+', name, re.IGNORECASE):
        result['score'] += 5
        result['details'].append(('PASS', f'Tên "{name}" không chứa AND — atomic ✓'))
    else:
        result['details'].append(('FAIL', f'Tên "{name}" chứa AND/và/+ — có thể ôm đồm'))

    # Check 2: Description trả lời "Làm 1 việc gì?"
    verbs_found = len(re.findall(r'\b(tạo|sinh|phân tích|kiểm tra|chuyển|soạn|tìm|generate|create|validate|parse)\b', desc, re.IGNORECASE))
    if 1 <= verbs_found <= 3:
        result['score'] += 5
        result['details'].append(('PASS', f'Description có {verbs_found} động từ chính — tập trung ✓'))
    elif verbs_found > 3:
        result['details'].append(('WARN', f'Description có {verbs_found} động từ — có thể ôm đồm'))
        result['score'] += 2
    else:
        result['details'].append(('WARN', 'Description thiếu động từ hành động'))
        result['score'] += 1

    # Check 3: Không quá nhiều H2 sections trong Instructions (≤10 phases)
    phases = len(re.findall(r'^##\s+', body, re.MULTILINE))
    if phases <= 10:
        result['score'] += 5
        result['details'].append(('PASS', f'{phases} phases/sections — acceptable ✓'))
    else:
        result['details'].append(('WARN', f'{phases} phases — quá phức tạp, cân nhắc tách skill'))
        result['score'] += 2

    return result


def audit_principle_2_trigger(frontmatter):
    """Nguyên tắc 2: Semantic Trigger — Description rõ ràng."""
    result = {'name': 'Semantic Trigger', 'score': 0, 'max': 15, 'details': []}

    desc = frontmatter.get('description', '')

    # Check 1: Description đủ dài (≥30 ký tự)
    if len(desc) >= 30:
        result['score'] += 3
        result['details'].append(('PASS', f'Description {len(desc)} ký tự (≥30) ✓'))
    else:
        result['details'].append(('FAIL', f'Description chỉ {len(desc)} ký tự — quá ngắn (cần ≥30)'))

    # Check 2: Có trigger phrases (khi nào kích hoạt)
    trigger_patterns = [
        r'kích hoạt khi', r'khi user', r'khi người dùng',
        r'trigger', r'activated when', r'khi nói', r'khi yêu cầu',
    ]
    has_trigger = any(re.search(p, desc, re.IGNORECASE) for p in trigger_patterns)
    if has_trigger:
        result['score'] += 4
        result['details'].append(('PASS', 'Có trigger phrases — AI biết khi nào kích hoạt ✓'))
    else:
        result['details'].append(('WARN', 'Thiếu trigger phrases — AI có thể không biết khi nào dùng'))
        result['score'] += 1

    # Check 3: Trả lời "Làm gì?"
    action_words = re.findall(r'\b(tạo|sinh|phân tích|kiểm tra|chuyển|soạn|tìm|generate|create|validate)\b', desc, re.IGNORECASE)
    if action_words:
        result['score'] += 4
        result['details'].append(('PASS', f'Trả lời "Làm gì?" — {action_words[0]} ✓'))
    else:
        result['details'].append(('FAIL', 'Không trả lời "Làm gì?" — thiếu động từ hành động'))

    # Check 4: Trả lời "Cho ai?"
    audience_words = re.findall(r'\b(dành cho|cho|user|người dùng|developer|team)\b', desc, re.IGNORECASE)
    if audience_words:
        result['score'] += 4
        result['details'].append(('PASS', 'Trả lời "Cho ai?" ✓'))
    else:
        result['details'].append(('WARN', 'Không rõ "Cho ai?" — nên thêm đối tượng sử dụng'))
        result['score'] += 1

    return result


def audit_principle_3_sections(sections):
    """Nguyên tắc 3: 4 Core Sections — Goal + Instructions + Examples + Constraints."""
    result = {'name': '4 Core Sections', 'score': 0, 'max': 15, 'details': []}

    required = {
        'goal': ('Goal', 4),
        'instructions': ('Instructions', 4),
        'examples': ('Examples', 4),
        'constraints': ('Constraints', 3),
    }

    for key, (label, points) in required.items():
        found = any(key in s for s in sections.keys())
        if found:
            result['score'] += points
            result['details'].append(('PASS', f'Có section "{label}" ✓'))
        else:
            result['details'].append(('FAIL', f'THIẾU section "{label}" — bắt buộc!'))

    return result


def audit_principle_4_show_dont_tell(sections, body):
    """Nguyên tắc 4: Show Don't Tell — ≥2 ví dụ có Input/Output."""
    result = {'name': 'Show Don\'t Tell', 'score': 0, 'max': 15, 'details': []}

    # Đếm ví dụ
    example_headings = len(re.findall(r'^##\s+.*[Vv]í dụ|^##\s+.*[Ee]xample', body, re.MULTILINE))
    if example_headings == 0:
        # Thử đếm ### level
        example_headings = len(re.findall(r'^###\s+.*[Vv]í dụ|^###\s+.*[Ee]xample', body, re.MULTILINE))

    if example_headings >= 3:
        result['score'] += 6
        result['details'].append(('PASS', f'{example_headings} ví dụ — tuyệt vời (≥3 = 92% accuracy) ✓'))
    elif example_headings >= 2:
        result['score'] += 5
        result['details'].append(('PASS', f'{example_headings} ví dụ — tốt (≥2 = 85% accuracy) ✓'))
    elif example_headings >= 1:
        result['score'] += 3
        result['details'].append(('WARN', f'{example_headings} ví dụ — cần thêm (1 = 65% accuracy)'))
    else:
        result['details'].append(('FAIL', 'KHÔNG có ví dụ — AI sẽ hallucinate!'))

    # Check: Có Input/Output rõ ràng
    has_input = bool(re.search(r'\*\*Input\*\*|\*\*Đầu vào\*\*|Input:', body, re.IGNORECASE))
    has_output = bool(re.search(r'\*\*Output\*\*|\*\*Đầu ra\*\*|Output:', body, re.IGNORECASE))

    if has_input and has_output:
        result['score'] += 5
        result['details'].append(('PASS', 'Ví dụ có Input + Output rõ ràng ✓'))
    elif has_input or has_output:
        result['score'] += 3
        result['details'].append(('WARN', 'Ví dụ chỉ có Input hoặc Output — cần cả hai'))
    else:
        result['details'].append(('WARN', 'Ví dụ thiếu format Input/Output rõ ràng'))
        result['score'] += 1

    # Check: Có Thought Process
    has_thought = bool(re.search(r'[Tt]hought [Pp]rocess|[Pp]hân tích|Suy luận', body))
    if has_thought:
        result['score'] += 4
        result['details'].append(('PASS', 'Ví dụ có Thought Process — AI hiểu logic ✓'))
    else:
        result['details'].append(('INFO', 'Không có Thought Process — khuyến khích thêm'))
        result['score'] += 2

    return result


def audit_principle_5_precision(body):
    """Nguyên tắc 5: Semantic Precision — Không dùng từ mơ hồ."""
    result = {'name': 'Semantic Precision', 'score': 0, 'max': 15, 'details': []}

    # Đếm từ mơ hồ trong Instructions
    instructions_section = ''
    in_instructions = False
    for line in body.split('\n'):
        if re.match(r'^#\s+Instructions', line, re.IGNORECASE):
            in_instructions = True
            continue
        elif re.match(r'^#\s+', line) and in_instructions:
            break
        if in_instructions:
            instructions_section += line + '\n'

    ambiguous_found = []
    for word in AMBIGUOUS_WORDS:
        count = len(re.findall(rf'\b{word}\b', instructions_section, re.IGNORECASE))
        if count > 0:
            ambiguous_found.append((word, count))

    if len(ambiguous_found) == 0:
        result['score'] += 8
        result['details'].append(('PASS', 'Không có từ mơ hồ trong Instructions ✓'))
    elif len(ambiguous_found) <= 2:
        result['score'] += 5
        words_str = ', '.join([f'"{w}" ({c}x)' for w, c in ambiguous_found])
        result['details'].append(('WARN', f'Có {len(ambiguous_found)} từ mơ hồ: {words_str}'))
    else:
        result['score'] += 2
        words_str = ', '.join([f'"{w}" ({c}x)' for w, c in ambiguous_found[:5]])
        result['details'].append(('FAIL', f'Có {len(ambiguous_found)} từ mơ hồ: {words_str}'))

    # Check: Dùng động từ cụ thể
    precise_verbs = re.findall(
        r'\b(analyze|transform|validate|generate|execute|parse|filter|compare|extract|calculate|tính|trích|sinh|xác nhận|phân loại)\b',
        instructions_section, re.IGNORECASE
    )
    if len(precise_verbs) >= 3:
        result['score'] += 7
        result['details'].append(('PASS', f'Dùng {len(precise_verbs)} động từ chính xác ✓'))
    elif len(precise_verbs) >= 1:
        result['score'] += 4
        result['details'].append(('WARN', f'Chỉ có {len(precise_verbs)} động từ chính xác — cần thêm'))
    else:
        result['details'].append(('FAIL', 'Không có động từ chính xác — Instructions quá mơ hồ'))

    return result


def audit_principle_6_error_recovery(body):
    """Nguyên tắc 6: Error Recovery — Có xử lý lỗi."""
    result = {'name': 'Error Recovery', 'score': 0, 'max': 15, 'details': []}

    error_count = 0
    for keyword in ERROR_KEYWORDS:
        if re.search(rf'{keyword}', body, re.IGNORECASE):
            error_count += 1

    if error_count >= 5:
        result['score'] += 8
        result['details'].append(('PASS', f'{error_count} error handling patterns — xuất sắc ✓'))
    elif error_count >= 3:
        result['score'] += 6
        result['details'].append(('PASS', f'{error_count} error handling patterns — tốt ✓'))
    elif error_count >= 1:
        result['score'] += 3
        result['details'].append(('WARN', f'{error_count} error handling — cần thêm'))
    else:
        result['details'].append(('FAIL', 'KHÔNG có error handling — skill sẽ crash khi gặp lỗi'))

    # Check: Có decision tree / branching
    branching = len(re.findall(r'nếu|if |→|rẽ nhánh|otherwise|else', body, re.IGNORECASE))
    if branching >= 5:
        result['score'] += 7
        result['details'].append(('PASS', f'{branching} branching points — logic mạnh ✓'))
    elif branching >= 2:
        result['score'] += 4
        result['details'].append(('WARN', f'{branching} branching points — cần thêm'))
    else:
        result['details'].append(('FAIL', 'Thiếu branching logic — skill chỉ chạy happy path'))
        result['score'] += 1

    return result


def audit_principle_7_scripts(skill_dir):
    """Nguyên tắc 7: Black Box Scripts — Script có --help, --dry-run."""
    result = {'name': 'Black Box Scripts', 'score': 0, 'max': 10, 'details': []}

    if not skill_dir or not os.path.isdir(skill_dir):
        result['score'] += 10
        result['details'].append(('INFO', 'Không có thư mục skill — bỏ qua check scripts (full marks)'))
        return result

    scripts_dir = os.path.join(skill_dir, 'scripts')
    if not os.path.isdir(scripts_dir):
        result['score'] += 10
        result['details'].append(('INFO', 'Không có scripts/ — skill không cần scripts (full marks)'))
        return result

    scripts = [f for f in os.listdir(scripts_dir) if f.endswith(('.py', '.sh', '.bash'))]

    if not scripts:
        result['score'] += 10
        result['details'].append(('INFO', 'Thư mục scripts/ trống (full marks)'))
        return result

    result['details'].append(('INFO', f'Tìm thấy {len(scripts)} scripts'))

    help_count = 0
    dryrun_count = 0

    for script_name in scripts:
        script_path = os.path.join(scripts_dir, script_name)
        try:
            with open(script_path, 'r', encoding='utf-8') as f:
                content = f.read()

            has_help = bool(re.search(r'--help|argparse|ArgumentParser', content))
            has_dryrun = bool(re.search(r'--dry-run|dry.run|DRY_RUN', content))

            if has_help:
                help_count += 1
            if has_dryrun:
                dryrun_count += 1

        except Exception:
            result['details'].append(('WARN', f'Không đọc được {script_name}'))

    if help_count == len(scripts):
        result['score'] += 5
        result['details'].append(('PASS', f'Tất cả {len(scripts)} scripts có --help ✓'))
    elif help_count > 0:
        result['score'] += 3
        result['details'].append(('WARN', f'{help_count}/{len(scripts)} scripts có --help'))
    else:
        result['details'].append(('FAIL', 'Không script nào có --help'))

    if dryrun_count > 0:
        result['score'] += 5
        result['details'].append(('PASS', f'{dryrun_count}/{len(scripts)} scripts có --dry-run ✓'))
    else:
        result['score'] += 3
        result['details'].append(('INFO', 'Không script nào có --dry-run — khuyến khích thêm'))

    return result


# ============================================================
# MAIN AUDIT
# ============================================================

TIER_LABELS = {
    'S': ('🏆 S-tier — Hoàn hảo', Colors.PASS),
    'A': ('⭐ A-tier — Xuất sắc', Colors.PASS),
    'B': ('✅ B-tier — Tốt', Colors.INFO),
    'C': ('⚠️ C-tier — Cần cải thiện', Colors.WARN),
    'D': ('❌ D-tier — Yếu', Colors.FAIL),
    'F': ('💀 F-tier — Fail', Colors.FAIL),
}


def get_tier(score):
    """Xác định tier dựa trên điểm."""
    if score >= 95:
        return 'S'
    elif score >= 85:
        return 'A'
    elif score >= 70:
        return 'B'
    elif score >= 55:
        return 'C'
    elif score >= 40:
        return 'D'
    else:
        return 'F'


def audit_skill(target_path, strict=False, json_output=False):
    """Chạy toàn bộ audit cho skill."""

    # Tìm SKILL.md
    if os.path.isdir(target_path):
        skill_dir = target_path
        skill_md = os.path.join(target_path, 'SKILL.md')
    else:
        skill_dir = os.path.dirname(target_path)
        skill_md = target_path

    if not os.path.exists(skill_md):
        print(f"{Colors.FAIL}❌ Không tìm thấy SKILL.md tại: {skill_md}{Colors.RESET}")
        return False

    # Đọc file
    with open(skill_md, 'r', encoding='utf-8') as f:
        content = f.read()

    frontmatter, body = parse_frontmatter(content)

    if not frontmatter:
        print(f"{Colors.FAIL}❌ Không tìm thấy YAML frontmatter!{Colors.RESET}")
        return False

    sections = find_sections(body)
    skill_name = frontmatter.get('name', 'unknown')

    # Header
    if not json_output:
        print()
        print(f"{Colors.BOLD}{'=' * 60}{Colors.RESET}")
        print(f"{Colors.BOLD}  🔍 SKILL AUDIT — 7 Nguyên Tắc Hoàn Hảo{Colors.RESET}")
        print(f"{Colors.BOLD}  Skill: {Colors.INFO}{skill_name}{Colors.RESET}")
        print(f"{Colors.BOLD}  File:  {Colors.DIM}{skill_md}{Colors.RESET}")
        print(f"{Colors.BOLD}{'=' * 60}{Colors.RESET}")
        print()

    # Run 7 audits
    results = []
    results.append(audit_principle_1_atomic(frontmatter, body))
    results.append(audit_principle_2_trigger(frontmatter))
    results.append(audit_principle_3_sections(sections))
    results.append(audit_principle_4_show_dont_tell(sections, body))
    results.append(audit_principle_5_precision(body))
    results.append(audit_principle_6_error_recovery(body))
    results.append(audit_principle_7_scripts(skill_dir if os.path.isdir(target_path) else None))

    total_score = sum(r['score'] for r in results)
    total_max = sum(r['max'] for r in results)
    percentage = round(total_score / total_max * 100)
    tier = get_tier(percentage)

    # JSON output
    if json_output:
        output = {
            'skill': skill_name,
            'file': skill_md,
            'score': total_score,
            'max': total_max,
            'percentage': percentage,
            'tier': tier,
            'principles': []
        }
        for i, r in enumerate(results, 1):
            output['principles'].append({
                'number': i,
                'name': r['name'],
                'score': r['score'],
                'max': r['max'],
                'percentage': round(r['score'] / r['max'] * 100),
                'details': [{'status': d[0], 'message': d[1]} for d in r['details']]
            })
        print(json.dumps(output, ensure_ascii=False, indent=2))
        return percentage >= 70

    # Pretty output
    for i, r in enumerate(results, 1):
        p_pct = round(r['score'] / r['max'] * 100)
        if p_pct >= 90:
            color = Colors.PASS
            icon = '🟢'
        elif p_pct >= 70:
            color = Colors.WARN
            icon = '🟡'
        else:
            color = Colors.FAIL
            icon = '🔴'

        print(f"  {icon} {Colors.BOLD}Nguyên tắc {i}: {r['name']}{Colors.RESET}")
        print(f"     Điểm: {color}{r['score']}/{r['max']} ({p_pct}%){Colors.RESET}")

        for status, message in r['details']:
            if status == 'PASS':
                print(f"     {Colors.PASS}✅ {message}{Colors.RESET}")
            elif status == 'FAIL':
                print(f"     {Colors.FAIL}❌ {message}{Colors.RESET}")
            elif status == 'WARN':
                print(f"     {Colors.WARN}⚠️  {message}{Colors.RESET}")
            else:
                print(f"     {Colors.DIM}ℹ️  {message}{Colors.RESET}")

        print()

    # Summary
    tier_label, tier_color = TIER_LABELS[tier]
    print(f"{Colors.BOLD}{'=' * 60}{Colors.RESET}")
    print(f"  {Colors.BOLD}📊 TỔNG ĐIỂM: {tier_color}{total_score}/{total_max} ({percentage}%){Colors.RESET}")
    print(f"  {Colors.BOLD}🏅 XẾP HẠNG:  {tier_color}{tier_label}{Colors.RESET}")
    print(f"{Colors.BOLD}{'=' * 60}{Colors.RESET}")
    print()

    # Recommendations
    low_principles = [r for r in results if r['score'] / r['max'] < 0.7]
    if low_principles:
        print(f"  {Colors.WARN}💡 Khuyến nghị cải thiện:{Colors.RESET}")
        for r in low_principles:
            fails = [d[1] for d in r['details'] if d[0] in ('FAIL', 'WARN')]
            for f in fails[:2]:
                print(f"     → {r['name']}: {f}")
        print()

    return percentage >= (85 if strict else 70)


if __name__ == '__main__':
    if len(sys.argv) < 2:
        print("Sử dụng: python skill_audit.py <path-to-SKILL.md-or-skill-folder>")
        print("Options:")
        print("  --json     Output dạng JSON")
        print("  --strict   Chấm khắt khe (cần ≥85% thay vì ≥70%)")
        print()
        print("Ví dụ:   python skill_audit.py ./my-skill/")
        print("         python skill_audit.py ./my-skill/ --json")
        sys.exit(1)

    target = sys.argv[1]
    json_mode = '--json' in sys.argv
    strict_mode = '--strict' in sys.argv

    if not os.path.exists(target):
        print(f"❌ Không tìm thấy: {target}")
        sys.exit(1)

    success = audit_skill(target, strict=strict_mode, json_output=json_mode)
    sys.exit(0 if success else 1)
