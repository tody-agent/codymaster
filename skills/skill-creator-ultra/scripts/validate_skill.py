#!/usr/bin/env python3
"""
validate_skill.py — Kiểm tra tính hợp lệ của file SKILL.md

Sử dụng:
    python validate_skill.py /path/to/SKILL.md
    python validate_skill.py /path/to/skill-folder/

Script sẽ kiểm tra:
  1. YAML frontmatter có hợp lệ không
  2. Có đầy đủ các section bắt buộc không (Goal, Instructions)
  3. Có Examples không (khuyến khích mạnh)
  4. Có Constraints không (khuyến khích)
  5. Description có đủ chi tiết không
  6. Cấu trúc thư mục có chuẩn không
"""

import sys
import os
import re
from pathlib import Path


# ============================================================
# CONSTANTS
# ============================================================

REQUIRED_SECTIONS = ['goal', 'instructions']
RECOMMENDED_SECTIONS = ['examples', 'constraints']
MIN_DESCRIPTION_LENGTH = 30    # Ký tự tối thiểu cho description
MIN_DESCRIPTION_WORDS = 5      # Từ tối thiểu cho description
MAX_SKILL_NAME_LENGTH = 50     # Ký tự tối đa cho tên skill
VALID_SUBFOLDERS = {'scripts', 'resources', 'examples'}


# ============================================================
# COLOR OUTPUT (Windows + Unix compatible)
# ============================================================

class Colors:
    """ANSI color codes cho terminal output."""
    PASS = '\033[92m'       # Green
    FAIL = '\033[91m'       # Red
    WARN = '\033[93m'       # Yellow
    INFO = '\033[96m'       # Cyan
    BOLD = '\033[1m'
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


def print_result(status, message):
    """In kết quả kiểm tra với màu sắc."""
    if status == 'PASS':
        icon = f"{Colors.PASS}✅ PASS{Colors.RESET}"
    elif status == 'FAIL':
        icon = f"{Colors.FAIL}❌ FAIL{Colors.RESET}"
    elif status == 'WARN':
        icon = f"{Colors.WARN}⚠️  WARN{Colors.RESET}"
    else:
        icon = f"{Colors.INFO}ℹ️  INFO{Colors.RESET}"
    
    print(f"  {icon}  {message}")


# ============================================================
# YAML FRONTMATTER PARSER
# ============================================================

def parse_frontmatter(content):
    """
    Trích xuất YAML frontmatter từ nội dung SKILL.md.
    
    Returns:
        tuple: (frontmatter_dict, body_content) hoặc (None, content) nếu không có frontmatter
    """
    # Tìm YAML frontmatter (giữa 2 dấu ---)
    pattern = r'^---\s*\n(.*?)\n---\s*\n(.*)$'
    match = re.match(pattern, content, re.DOTALL)
    
    if not match:
        return None, content
    
    yaml_content = match.group(1)
    body = match.group(2)
    
    # Parse YAML đơn giản (hỗ trợ multi-line block scalar `|` và `>`)
    frontmatter = {}
    lines = yaml_content.strip().split('\n')
    i = 0
    while i < len(lines):
        line = lines[i]
        stripped = line.strip()
        if ':' in stripped and not stripped.startswith('#'):
            key, _, value = stripped.partition(':')
            key = key.strip()
            value = value.strip().strip('"').strip("'")
            
            # Xử lý multi-line block scalar (| hoặc >)
            if value in ('|', '>', '|+', '|-', '>+', '>-'):
                multi_lines = []
                i += 1
                while i < len(lines):
                    next_line = lines[i]
                    # Dòng tiếp theo phải có indent (bắt đầu bằng space/tab)
                    if next_line and (next_line[0] == ' ' or next_line[0] == '\t'):
                        multi_lines.append(next_line.strip())
                        i += 1
                    else:
                        break
                value = ' '.join(multi_lines)
            
            frontmatter[key] = value
        i += 1
    
    return frontmatter, body


def find_sections(body):
    """
    Tìm tất cả heading sections (# Level 1) trong body.
    Bỏ qua headings nằm trong fenced code blocks (``` ... ```).
    
    Returns:
        dict: {section_name_lowercase: section_content}
    """
    sections = {}
    current_section = None
    current_content = []
    in_code_block = False
    
    for line in body.split('\n'):
        stripped = line.strip()
        
        # Phát hiện bắt đầu/kết thúc code block
        if stripped.startswith('```'):
            in_code_block = not in_code_block
            current_content.append(line)
            continue
        
        # Bỏ qua headings trong code block
        if in_code_block:
            current_content.append(line)
            continue
        
        # Tìm heading level 1 (# Title)
        heading_match = re.match(r'^#\s+(.+)$', stripped)
        if heading_match:
            # Lưu section trước
            if current_section:
                sections[current_section] = '\n'.join(current_content)
            current_section = heading_match.group(1).strip().lower()
            current_content = []
        else:
            current_content.append(line)
    
    # Lưu section cuối cùng
    if current_section:
        sections[current_section] = '\n'.join(current_content)
    
    return sections


def count_examples(body):
    """Đếm số ví dụ (heading ## Ví dụ hoặc ## Example). Bỏ qua code blocks."""
    # Xóa nội dung trong code blocks trước khi đếm
    clean_body = re.sub(r'```.*?```', '', body, flags=re.DOTALL)
    pattern = r'^##\s+(?:Ví dụ|Example)\s*\d*'
    return len(re.findall(pattern, clean_body, re.MULTILINE | re.IGNORECASE))


def count_constraints(body):
    """Đếm số constraint (dòng bắt đầu bằng - KHÔNG ĐƯỢC hoặc - LUÔN LUÔN)."""
    pattern = r'^[-*]\s*(?:KHÔNG ĐƯỢC|LUÔN LUÔN|NEVER|ALWAYS|🚫|⚠️)'
    return len(re.findall(pattern, body, re.MULTILINE | re.IGNORECASE))


# ============================================================
# VALIDATORS
# ============================================================

def validate_frontmatter(frontmatter):
    """Kiểm tra YAML frontmatter."""
    results = []
    
    if frontmatter is None:
        results.append(('FAIL', 'Không tìm thấy YAML frontmatter (--- đầu và cuối)'))
        return results, False
    
    results.append(('PASS', 'YAML frontmatter hợp lệ'))
    
    # Check description (BẮT BUỘC)
    desc = frontmatter.get('description', '')
    if not desc:
        results.append(('FAIL', 'Thiếu trường `description` — Đây là phần QUAN TRỌNG NHẤT'))
    elif len(desc) < MIN_DESCRIPTION_LENGTH:
        results.append(('WARN', f'Description quá ngắn ({len(desc)} ký tự) — Nên ≥{MIN_DESCRIPTION_LENGTH} ký tự'))
    elif len(desc.split()) < MIN_DESCRIPTION_WORDS:
        results.append(('WARN', f'Description quá ít từ ({len(desc.split())} từ) — Nên ≥{MIN_DESCRIPTION_WORDS} từ'))
    else:
        results.append(('PASS', f'Description đầy đủ ({len(desc)} ký tự, {len(desc.split())} từ)'))
    
    # Check name (TÙY CHỌN)
    name = frontmatter.get('name', '')
    if name:
        if ' ' in name or any(c.isupper() for c in name):
            results.append(('WARN', f'Tên skill `{name}` nên dùng kebab-case (vd: my-skill-name)'))
        elif len(name) > MAX_SKILL_NAME_LENGTH:
            results.append(('WARN', f'Tên skill quá dài ({len(name)} ký tự) — Nên ≤{MAX_SKILL_NAME_LENGTH}'))
        else:
            results.append(('PASS', f'Tên skill: `{name}` (hợp lệ)'))
    else:
        results.append(('INFO', 'Không có trường `name` — AI sẽ dùng tên thư mục'))
    
    return results, True


def validate_sections(sections, body):
    """Kiểm tra các sections bắt buộc và khuyến khích."""
    results = []
    
    # Check required sections
    for section in REQUIRED_SECTIONS:
        found = any(section in key for key in sections.keys())
        if found:
            results.append(('PASS', f'Có section `# {section.title()}`'))
        else:
            results.append(('FAIL', f'Thiếu section bắt buộc `# {section.title()}`'))
    
    # Check recommended sections
    for section in RECOMMENDED_SECTIONS:
        found = any(section in key for key in sections.keys())
        if found:
            results.append(('PASS', f'Có section `# {section.title()}`'))
        else:
            results.append(('WARN', f'Thiếu section khuyến khích `# {section.title()}`'))
    
    # Check examples count
    example_count = count_examples(body)
    if example_count >= 2:
        results.append(('PASS', f'Có {example_count} ví dụ (đạt chuẩn ≥2)'))
    elif example_count == 1:
        results.append(('WARN', f'Chỉ có {example_count} ví dụ — Nên có ≥2 ví dụ để giảm hallucination'))
    else:
        results.append(('WARN', 'Không tìm thấy ví dụ nào — Rất khuyến khích thêm ≥2 ví dụ'))
    
    # Check constraints count
    constraint_count = count_constraints(body)
    if constraint_count >= 1:
        results.append(('PASS', f'Có {constraint_count} constraint(s)'))
    else:
        results.append(('WARN', 'Không tìm thấy constraint nào — Nên có ít nhất 1 quy tắc "KHÔNG ĐƯỢC"'))
    
    return results


def validate_directory(skill_dir):
    """Kiểm tra cấu trúc thư mục skill."""
    results = []
    skill_path = Path(skill_dir)
    
    # Check SKILL.md exists
    skill_md = skill_path / 'SKILL.md'
    if skill_md.exists():
        results.append(('PASS', f'File `SKILL.md` tồn tại ({skill_md.stat().st_size} bytes)'))
    else:
        results.append(('FAIL', 'Không tìm thấy `SKILL.md` trong thư mục'))
        return results, None
    
    # Check subfolders
    for item in skill_path.iterdir():
        if item.is_dir():
            folder_name = item.name
            if folder_name in VALID_SUBFOLDERS:
                file_count = len(list(item.rglob('*')))
                results.append(('PASS', f'Thư mục `{folder_name}/` ({file_count} items)'))
            elif folder_name.startswith('.'):
                continue  # Bỏ qua hidden folders
            else:
                results.append(('WARN', f'Thư mục `{folder_name}/` không phải chuẩn (scripts/resources/examples)'))
    
    return results, skill_md


# ============================================================
# MAIN
# ============================================================

def validate_skill(target_path):
    """Chạy toàn bộ kiểm tra cho skill."""
    Colors.enable_windows()
    
    target = Path(target_path)
    all_results = []
    
    print(f"\n{Colors.BOLD}{'='*60}{Colors.RESET}")
    print(f"{Colors.BOLD}🔍 SKILL VALIDATOR — Kiểm tra chất lượng AI Skill{Colors.RESET}")
    print(f"{Colors.BOLD}{'='*60}{Colors.RESET}")
    print(f"{Colors.INFO}📁 Target: {target.absolute()}{Colors.RESET}\n")
    
    # ---- Phần 1: Kiểm tra thư mục (nếu là folder) ----
    skill_md_path = None
    
    if target.is_dir():
        print(f"{Colors.BOLD}📂 Kiểm tra cấu trúc thư mục:{Colors.RESET}")
        dir_results, skill_md_path = validate_directory(target)
        all_results.extend(dir_results)
        for status, msg in dir_results:
            print_result(status, msg)
        print()
        
        if skill_md_path is None:
            print(f"\n{Colors.FAIL}💀 KHÔNG THỂ TIẾP TỤC — Thiếu SKILL.md{Colors.RESET}\n")
            return False
    elif target.is_file() and target.name == 'SKILL.md':
        skill_md_path = target
    else:
        print(f"{Colors.FAIL}❌ Target phải là thư mục skill hoặc file SKILL.md{Colors.RESET}")
        return False
    
    # ---- Phần 2: Đọc và parse SKILL.md ----
    try:
        content = skill_md_path.read_text(encoding='utf-8')
    except UnicodeDecodeError:
        content = skill_md_path.read_text(encoding='utf-8', errors='ignore')
    
    frontmatter, body = parse_frontmatter(content)
    sections = find_sections(body)
    
    # ---- Phần 3: Kiểm tra frontmatter ----
    print(f"{Colors.BOLD}📝 Kiểm tra YAML Frontmatter:{Colors.RESET}")
    fm_results, fm_valid = validate_frontmatter(frontmatter)
    all_results.extend(fm_results)
    for status, msg in fm_results:
        print_result(status, msg)
    print()
    
    # ---- Phần 4: Kiểm tra sections ----
    print(f"{Colors.BOLD}📋 Kiểm tra nội dung Sections:{Colors.RESET}")
    sec_results = validate_sections(sections, body)
    all_results.extend(sec_results)
    for status, msg in sec_results:
        print_result(status, msg)
    print()
    
    # ---- Phần 5: Thống kê ----
    total_lines = len(content.split('\n'))
    total_words = len(content.split())
    
    print(f"{Colors.BOLD}📊 Thống kê:{Colors.RESET}")
    print_result('INFO', f'Tổng: {total_lines} dòng, {total_words} từ, {len(content)} bytes')
    print_result('INFO', f'Sections tìm thấy: {", ".join(sections.keys()) if sections else "(không có)"}')
    print()
    
    # ---- Phần 6: Tổng kết ----
    fails = sum(1 for s, _ in all_results if s == 'FAIL')
    warns = sum(1 for s, _ in all_results if s == 'WARN')
    passes = sum(1 for s, _ in all_results if s == 'PASS')
    
    print(f"{Colors.BOLD}{'='*60}{Colors.RESET}")
    print(f"{Colors.BOLD}📋 KẾT QUẢ:{Colors.RESET}")
    print(f"  {Colors.PASS}✅ PASS: {passes}{Colors.RESET}")
    print(f"  {Colors.WARN}⚠️  WARN: {warns}{Colors.RESET}")
    print(f"  {Colors.FAIL}❌ FAIL: {fails}{Colors.RESET}")
    
    if fails == 0 and warns == 0:
        print(f"\n  {Colors.PASS}{Colors.BOLD}🎉 TUYỆT VỜI! Skill đạt chuẩn hoàn hảo!{Colors.RESET}")
        grade = 'A+'
    elif fails == 0 and warns <= 2:
        print(f"\n  {Colors.PASS}{Colors.BOLD}👍 TỐT! Skill hợp lệ, có thể cải thiện thêm.{Colors.RESET}")
        grade = 'A'
    elif fails == 0:
        print(f"\n  {Colors.WARN}{Colors.BOLD}⚠️ ĐẠT! Nhưng nên sửa các cảnh báo.{Colors.RESET}")
        grade = 'B'
    elif fails <= 2:
        print(f"\n  {Colors.FAIL}{Colors.BOLD}❌ CHƯA ĐẠT! Cần sửa {fails} lỗi.{Colors.RESET}")
        grade = 'C'
    else:
        print(f"\n  {Colors.FAIL}{Colors.BOLD}💀 KHÔNG ĐẠT! Cần sửa {fails} lỗi nghiêm trọng.{Colors.RESET}")
        grade = 'F'
    
    print(f"\n  {Colors.BOLD}📊 Grade: {grade}{Colors.RESET}")
    print(f"{Colors.BOLD}{'='*60}{Colors.RESET}\n")
    
    return fails == 0


if __name__ == '__main__':
    if len(sys.argv) < 2:
        print("Sử dụng: python validate_skill.py <path-to-SKILL.md-or-skill-folder>")
        print("Ví dụ:   python validate_skill.py ./my-skill/")
        print("         python validate_skill.py ./my-skill/SKILL.md")
        sys.exit(1)
    
    target = sys.argv[1]
    
    if not os.path.exists(target):
        print(f"❌ Không tìm thấy: {target}")
        sys.exit(1)
    
    success = validate_skill(target)
    sys.exit(0 if success else 1)
