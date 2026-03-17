# Example: pdf-processor (🟠 Phức tạp — Complexity 18)

> **Nguồn gốc:** Dựa trên Anthropic's official `pdf` skill — 1 trong 16 skills chính thức.
> **Điểm hay:** Description cực "pushy", progressive disclosure 3 tầng, reference docs dày.
> **Bài học:** Skill phức tạp nhưng SKILL.md vẫn lean nhờ tách logic vào resources.

## 📂 Cấu trúc (Anthropic thật)

```
skills/pdf/
├── SKILL.md         ← 315 dòng — Guide + code snippets
├── forms.md         ← 11KB — Chi tiết riêng về PDF forms/fill
├── reference.md     ← 16KB — Advanced: pypdfium2, JavaScript libs
└── scripts/
    └── ...          ← Helper scripts
```

---

## 📄 File 1: SKILL.md (trích — Anthropic style)

```markdown
---
name: pdf
description: |
  Use this skill whenever the user wants to do anything with PDF files.
  This includes reading or extracting text/tables from PDFs, combining or
  merging multiple PDFs into one, splitting PDFs apart, rotating pages,
  adding watermarks, creating new PDFs, filling PDF forms, encrypting/
  decrypting PDFs, extracting images, and OCR on scanned PDFs to make
  them searchable. If the user mentions a .pdf file or asks to produce
  one, use this skill.
---

# PDF Processing Guide

## Overview

This guide covers essential PDF processing operations using Python
libraries and command-line tools. For advanced features, JavaScript
libraries, and detailed examples, see REFERENCE.md. If you need to
fill out a PDF form, read FORMS.md and follow its instructions.

## Quick Start

from pypdf import PdfReader, PdfWriter

reader = PdfReader("document.pdf")
print(f"Pages: {len(reader.pages)}")

text = ""
for page in reader.pages:
    text += page.extract_text()

## Python Libraries

### pypdf - Basic Operations

#### Merge PDFs
[code snippets...]

#### Split PDF
[code snippets...]

### pdfplumber - Text and Table Extraction
[code snippets...]

### reportlab - Create PDFs
[code snippets...]

## Quick Reference

| Task             | Best Tool    | Command/Code               |
|------------------|--------------|-----------------------------|
| Merge PDFs       | pypdf        | writer.add_page(page)       |
| Split PDFs       | pypdf        | One page per file           |
| Extract text     | pdfplumber   | page.extract_text()         |
| Extract tables   | pdfplumber   | page.extract_tables()       |
| Create PDFs      | reportlab    | Canvas or Platypus          |
| Fill PDF forms   | See FORMS.md | See FORMS.md                |

## Next Steps
- For advanced pypdfium2 usage, see REFERENCE.md
- For JavaScript libraries (pdf-lib), see REFERENCE.md
- If you need to fill out a PDF form, follow FORMS.md
```

---

## 🔍 Phân tích: Bài học từ Anthropic

### ✅ Điểm hay — nên học

| Pattern | Chi tiết | Áp dụng |
|---|---|---|
| **Description cực "pushy"** | Liệt kê TOÀN BỘ use cases: "reading, extracting, combining, merging, splitting, rotating, watermarks, creating, filling forms, encrypting, decrypting, extracting images, OCR" | Viết description cover mọi cách user có thể hỏi |
| **Progressive Disclosure** | SKILL.md = quick reference, FORMS.md = deep dive, REFERENCE.md = advanced | Tách complexity ra resources/, SKILL.md giữ lean |
| **Code-as-documentation** | Thay vì giải thích cách merge PDF, cho luôn code snippet | Cho AI copy paste, nhanh hơn đọc text |
| **Quick Reference Table** | Bảng tổng hợp cuối: Task → Best Tool → Command | User scan nhanh, AI chọn đúng tool |
| **Routing to resources** | "If you need to fill out a PDF form, read FORMS.md" | Lazy loading — chỉ đọc khi cần |

### ⚠️ Điểm khác biệt với skill-generator

| Anthropic style | Skill-generator style | Nên dùng |
|---|---|---|
| Không có Examples section | Có 2-3 ví dụ Input → Output | ✅ Giữ Examples — AI hiểu pattern tốt hơn |
| Không có Constraints section | Có safety guardrails | ✅ Giữ Constraints — đặc biệt cho production |
| Viết bằng tiếng Anh | Viết bằng tiếng Việt | 🔀 Tùy user |
| Code snippets inline | Tách script riêng | 🔀 Tùy complexity |

### 🎯 Key Insight

Anthropic's description viết theo kiểu **"bắn phủ"** — liệt kê MỌI THỨ skill làm được.
Đây là cách tốt nhất để AI trigger đúng, vì AI agent chỉ đọc description để quyết định.

**Rule:** Description nên dài 50-200 ký tự và cover ≥ 80% use cases có thể xảy ra.
