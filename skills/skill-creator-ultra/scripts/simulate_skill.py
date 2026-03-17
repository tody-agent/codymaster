#!/usr/bin/env python3
"""
simulate_skill.py — Mô phỏng chạy thử Skill với input giả

Sử dụng:
    python simulate_skill.py /path/to/SKILL.md

Script sẽ:
  1. Parse SKILL.md
  2. Trích xuất Instructions (các bước)
  3. Trích xuất Examples (input/output mẫu)
  4. Mô phỏng "dry run" — đi qua từng bước
  5. Report: Bước nào rõ ràng, bước nào mơ hồ
"""

import sys
import os
import re
from pathlib import Path


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


def parse_frontmatter(content):
    """Trích xuất YAML frontmatter."""
    pattern = r'^---\s*\n(.*?)\n---\s*\n(.*)$'
    match = re.match(pattern, content, re.DOTALL)
    if not match:
        return {}, content
    
    yaml_content = match.group(1)
    body = match.group(2)
    
    frontmatter = {}
    current_key = None
    current_value = []
    
    for line in yaml_content.strip().split('\n'):
        if ':' in line and not line.startswith(' ') and not line.startswith('\t'):
            if current_key:
                frontmatter[current_key] = '\n'.join(current_value).strip().strip('"').strip("'")
            key, _, value = line.partition(':')
            current_key = key.strip()
            current_value = [value.strip().strip('"').strip("'").strip('|')]
        elif current_key:
            current_value.append(line.strip())
    
    if current_key:
        frontmatter[current_key] = '\n'.join(current_value).strip()
    
    return frontmatter, body


def extract_steps(body):
    """Trích xuất các bước từ Instructions section."""
    steps = []
    in_instructions = False
    current_step = None
    
    for line in body.split('\n'):
        stripped = line.strip()
        
        # Bắt đầu section Instructions
        if re.match(r'^#{1,2}\s+Instructions', stripped, re.IGNORECASE):
            in_instructions = True
            continue
        
        # Kết thúc section (gặp heading mới cùng level)
        if in_instructions and re.match(r'^#{1,2}\s+(?!Bước|Step|Stage)', stripped):
            if not re.match(r'^#{3,}', stripped):
                break
        
        if in_instructions:
            # Tìm numbered step
            step_match = re.match(r'^(\d+)\.\s+(.+)', stripped)
            if step_match:
                if current_step:
                    steps.append(current_step)
                current_step = {
                    'number': int(step_match.group(1)),
                    'text': step_match.group(2),
                    'sub_steps': [],
                    'has_condition': False,
                    'has_action': False,
                    'has_error_handling': False,
                }
            elif current_step and stripped.startswith(('-', '*', '•')):
                sub = stripped.lstrip('-*• ').strip()
                current_step['sub_steps'].append(sub)
    
    if current_step:
        steps.append(current_step)
    
    return steps


def extract_examples(body):
    """Trích xuất ví dụ từ Examples section."""
    examples = []
    in_examples = False
    current_example = None
    
    for line in body.split('\n'):
        stripped = line.strip()
        
        if re.match(r'^#{1,2}\s+Examples', stripped, re.IGNORECASE):
            in_examples = True
            continue
        
        if in_examples and re.match(r'^#{1,2}\s+(?!Ví dụ|Example)', stripped):
            if not re.match(r'^#{3,}', stripped):
                break
        
        if in_examples:
            example_match = re.match(r'^#{2,3}\s+(?:Ví dụ|Example)\s*\d*[:.]\s*(.*)', stripped, re.IGNORECASE)
            if example_match:
                if current_example:
                    examples.append(current_example)
                current_example = {
                    'title': example_match.group(1),
                    'has_input': False,
                    'has_output': False,
                }
            
            if current_example:
                if re.match(r'\*\*Input', stripped, re.IGNORECASE):
                    current_example['has_input'] = True
                if re.match(r'\*\*Output', stripped, re.IGNORECASE):
                    current_example['has_output'] = True
    
    if current_example:
        examples.append(current_example)
    
    return examples


def extract_constraints(body):
    """Trích xuất constraints."""
    constraints = []
    in_constraints = False
    
    for line in body.split('\n'):
        stripped = line.strip()
        
        if re.match(r'^#{1,2}\s+Constraints', stripped, re.IGNORECASE):
            in_constraints = True
            continue
        
        if in_constraints and re.match(r'^#{1,2}\s+', stripped):
            if not re.match(r'^#{3,}', stripped):
                break
        
        if in_constraints:
            constraint_match = re.match(r'^[-*]\s+(.+)', stripped)
            if constraint_match:
                text = constraint_match.group(1)
                is_negative = any(kw in text.upper() for kw in ['KHÔNG ĐƯỢC', 'KHÔNG BAO GIỜ', 'TUYỆT ĐỐI KHÔNG', 'NEVER', '🚫'])
                is_positive = any(kw in text.upper() for kw in ['LUÔN LUÔN', 'ALWAYS', 'BẮT BUỘC', '✅'])
                constraints.append({
                    'text': text,
                    'type': 'negative' if is_negative else ('positive' if is_positive else 'neutral'),
                })
    
    return constraints


# Danh sách từ mơ hồ cần cảnh báo
AMBIGUOUS_WORDS = [
    ('xử lý', 'parse/validate/transform/filter'),
    ('kiểm tra', 'so sánh X với Y / đảm bảo X ≥ 0'),
    ('tối ưu', 'giảm thời gian <2s / giảm bundle <500KB'),
    ('phù hợp', 'khớp regex / thuộc danh sách X'),
    ('tốt', 'pass test / response <200ms'),
    ('sạch', 'không duplicate / function <30 dòng'),
    ('nhiều', '≥5 items / >1000 rows'),
    ('lớn', '>10MB / >1000 records'),
    ('nhanh', '<2s / <100ms'),
]


def analyze_step(step):
    """Phân tích chất lượng 1 bước."""
    issues = []
    text = step['text'].lower()
    all_text = text + ' ' + ' '.join(s.lower() for s in step['sub_steps'])
    
    # Check conditional logic
    step['has_condition'] = any(kw in all_text for kw in ['nếu', 'if', 'khi', 'when', 'trường hợp'])
    
    # Check actionable
    action_verbs = ['đọc', 'ghi', 'chạy', 'tạo', 'xóa', 'kiểm', 'gửi', 'parse', 'scan', 
                    'hỏi', 'hiển thị', 'output', 'lưu', 'copy', 'move', 'validate',
                    'generate', 'deploy', 'build', 'test', 'review', 'format',
                    'trích xuất', 'phân tích', 'so sánh', 'merge', 'sort',
                    'kích hoạt', 'báo', 'cảnh báo', 'confirm', 'xác nhận']
    step['has_action'] = any(verb in all_text for verb in action_verbs)
    
    # Check error handling
    error_keywords = ['lỗi', 'fail', 'error', 'exception', 'không tìm', 'không có', 
                      'nếu fail', 'nếu lỗi', 'trường hợp xấu', 'fallback']
    step['has_error_handling'] = any(kw in all_text for kw in error_keywords)
    
    # Check ambiguous words
    for word, suggestion in AMBIGUOUS_WORDS:
        if word in text:
            issues.append(f'Từ mơ hồ "{word}" → Nên cụ thể hơn: {suggestion}')
    
    # Check too short
    if len(step['text'].split()) < 4 and len(step['sub_steps']) == 0:
        issues.append('Bước quá ngắn, thiếu chi tiết')
    
    return issues


def simulate(skill_path):
    """Chạy mô phỏng toàn bộ skill."""
    Colors.enable_windows()
    
    path = Path(skill_path)
    if path.is_dir():
        path = path / 'SKILL.md'
    
    if not path.exists():
        print(f"{Colors.FAIL}❌ Không tìm thấy: {path}{Colors.RESET}")
        return False
    
    content = path.read_text(encoding='utf-8', errors='ignore')
    frontmatter, body = parse_frontmatter(content)
    steps = extract_steps(body)
    examples = extract_examples(body)
    constraints = extract_constraints(body)
    
    print(f"\n{Colors.BOLD}{'='*60}{Colors.RESET}")
    print(f"{Colors.BOLD}🧪 SKILL SIMULATOR — Mô phỏng chạy thử{Colors.RESET}")
    print(f"{Colors.BOLD}{'='*60}{Colors.RESET}")
    
    name = frontmatter.get('name', path.parent.name)
    desc = frontmatter.get('description', '(không có)')
    print(f"\n{Colors.INFO}📌 Skill: {name}{Colors.RESET}")
    print(f"{Colors.DIM}📝 {desc[:100]}{'...' if len(desc) > 100 else ''}{Colors.RESET}\n")
    
    # ---- Simulate Steps ----
    print(f"{Colors.BOLD}🔄 DRY RUN — Đi qua từng bước:{Colors.RESET}\n")
    
    total_issues = 0
    actionable_steps = 0
    conditional_steps = 0
    error_handled_steps = 0
    
    for step in steps:
        issues = analyze_step(step)
        total_issues += len(issues)
        
        if step['has_action']:
            actionable_steps += 1
        if step['has_condition']:
            conditional_steps += 1
        if step['has_error_handling']:
            error_handled_steps += 1
        
        # Status icon
        if issues:
            icon = f"{Colors.WARN}⚠️{Colors.RESET}"
        elif step['has_action']:
            icon = f"{Colors.PASS}✅{Colors.RESET}"
        else:
            icon = f"{Colors.WARN}🔸{Colors.RESET}"
        
        # Flags
        flags = []
        if step['has_condition']:
            flags.append('🔀 Rẽ nhánh')
        if step['has_error_handling']:
            flags.append('🛡️ Error handling')
        if not step['has_action']:
            flags.append(f'{Colors.WARN}⚠️ Thiếu hành động cụ thể{Colors.RESET}')
        
        flag_str = f" [{', '.join(flags)}]" if flags else ""
        
        print(f"  {icon} Bước {step['number']}: {step['text'][:70]}{flag_str}")
        
        for sub in step['sub_steps'][:3]:
            print(f"     {Colors.DIM}  └─ {sub[:65]}{Colors.RESET}")
        
        for issue in issues:
            print(f"     {Colors.WARN}  ⚠️  {issue}{Colors.RESET}")
        
        print()
    
    # ---- Examples Analysis ----
    print(f"{Colors.BOLD}📋 Examples Analysis:{Colors.RESET}")
    if examples:
        for i, ex in enumerate(examples, 1):
            input_icon = f"{Colors.PASS}✅{Colors.RESET}" if ex['has_input'] else f"{Colors.FAIL}❌{Colors.RESET}"
            output_icon = f"{Colors.PASS}✅{Colors.RESET}" if ex['has_output'] else f"{Colors.FAIL}❌{Colors.RESET}"
            print(f"  Ví dụ {i}: {ex['title'][:50]}")
            print(f"    Input: {input_icon}  Output: {output_icon}")
    else:
        print(f"  {Colors.WARN}⚠️ Không tìm thấy ví dụ nào!{Colors.RESET}")
    print()
    
    # ---- Constraints Analysis ----
    print(f"{Colors.BOLD}🚧 Constraints Analysis:{Colors.RESET}")
    neg_count = sum(1 for c in constraints if c['type'] == 'negative')
    pos_count = sum(1 for c in constraints if c['type'] == 'positive')
    neu_count = sum(1 for c in constraints if c['type'] == 'neutral')
    
    if constraints:
        print(f"  🚫 Negative (KHÔNG ĐƯỢC): {neg_count}")
        print(f"  ✅ Positive (LUÔN LUÔN): {pos_count}")
        print(f"  🔸 Neutral: {neu_count}")
    else:
        print(f"  {Colors.WARN}⚠️ Không tìm thấy constraints!{Colors.RESET}")
    print()
    
    # ---- Overall Score ----
    print(f"{Colors.BOLD}{'='*60}{Colors.RESET}")
    print(f"{Colors.BOLD}📊 SIMULATION REPORT:{Colors.RESET}\n")
    
    metrics = [
        ('Tổng bước', len(steps), None),
        ('Bước có hành động cụ thể', actionable_steps, len(steps)),
        ('Bước có logic rẽ nhánh', conditional_steps, None),
        ('Bước có error handling', error_handled_steps, len(steps)),
        ('Ví dụ có Input+Output', sum(1 for e in examples if e['has_input'] and e['has_output']), len(examples)),
        ('Constraints (negative)', neg_count, None),
        ('Issues phát hiện', total_issues, None),
    ]
    
    for label, value, total in metrics:
        if total:
            pct = value / total * 100 if total > 0 else 0
            color = Colors.PASS if pct >= 80 else Colors.WARN if pct >= 50 else Colors.FAIL
            print(f"  {color}{label}: {value}/{total} ({pct:.0f}%){Colors.RESET}")
        else:
            print(f"  {Colors.INFO}{label}: {value}{Colors.RESET}")
    
    # Grade
    print()
    score = 0
    if len(steps) > 0:
        score += min(30, actionable_steps / len(steps) * 30)  # 30 pts for actionable
        score += min(20, error_handled_steps / len(steps) * 20)  # 20 pts for error handling
    score += min(20, len(examples) * 10)  # 20 pts for examples (2=full)
    score += min(15, neg_count * 5)  # 15 pts for constraints
    score -= total_issues * 3  # -3 pts per issue
    score = max(0, min(100, score))
    
    if score >= 90:
        grade, msg = 'A+', '🏆 Skill mô phỏng hoàn hảo!'
    elif score >= 80:
        grade, msg = 'A', '👍 Skill rất tốt, sẵn sàng deploy!'
    elif score >= 65:
        grade, msg = 'B', '⚠️ Khá tốt, cần cải thiện một số bước.'
    elif score >= 50:
        grade, msg = 'C', '⚠️ Cần sửa đáng kể trước khi deploy.'
    else:
        grade, msg = 'F', '❌ Cần viết lại phần lớn skill.'
    
    color = Colors.PASS if score >= 80 else Colors.WARN if score >= 50 else Colors.FAIL
    print(f"  {color}{Colors.BOLD}Score: {score:.0f}/100 — Grade: {grade}{Colors.RESET}")
    print(f"  {color}{msg}{Colors.RESET}")
    print(f"\n{Colors.BOLD}{'='*60}{Colors.RESET}\n")
    
    return score >= 65


if __name__ == '__main__':
    if len(sys.argv) < 2:
        print("Sử dụng: python simulate_skill.py <path-to-SKILL.md-or-skill-folder>")
        print("Ví dụ:   python simulate_skill.py ./my-skill/")
        sys.exit(1)
    
    target = sys.argv[1]
    if not os.path.exists(target):
        print(f"❌ Không tìm thấy: {target}")
        sys.exit(1)
    
    success = simulate(target)
    sys.exit(0 if success else 1)
