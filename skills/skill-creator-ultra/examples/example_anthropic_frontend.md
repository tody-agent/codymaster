# Example: frontend-design (🟢 Đơn giản nhưng MẠNH — Complexity 5)

> **Nguồn gốc:** Anthropic's official `frontend-design` skill — chỉ 43 dòng!
> **Điểm hay:** Chứng minh skill tốt không cần dài. Tone "explain the why" tuyệt vời.
> **Bài học:** Lean = AI follow tốt hơn. Viết ngắn nhưng truyền cảm hứng.

## 📂 Cấu trúc (Anthropic thật)

```
skills/frontend-design/
└── SKILL.md        ← CHỈ 43 DÒNG. Không resources, không scripts.
```

---

## 📄 File 1: SKILL.md (NGUYÊN VĂN từ Anthropic)

```markdown
---
name: frontend-design
description: |
  Create distinctive, production-grade frontend interfaces with high design
  quality. Use this skill when the user asks to build web components, pages,
  artifacts, posters, or applications (examples include websites, landing
  pages, dashboards, React components, HTML/CSS layouts, or when styling/
  beautifying any web UI). Generates creative, polished code and UI design
  that avoids generic AI aesthetics.
---

This skill guides creation of distinctive, production-grade frontend
interfaces that avoid generic "AI slop" aesthetics. Implement real working
code with exceptional attention to aesthetic details and creative choices.

## Design Thinking

Before coding, understand the context and commit to a BOLD aesthetic direction:
- **Purpose**: What problem does this interface solve? Who uses it?
- **Tone**: Pick an extreme: brutally minimal, maximalist chaos,
  retro-futuristic, organic/natural, luxury/refined, playful/toy-like...
- **Constraints**: Technical requirements (framework, performance).
- **Differentiation**: What makes this UNFORGETTABLE?

**CRITICAL**: Choose a clear conceptual direction and execute it with
precision. Bold maximalism and refined minimalism both work — the key
is intentionality, not intensity.

## Frontend Aesthetics Guidelines

Focus on:
- **Typography**: Avoid generic fonts (Arial, Inter). Choose distinctive,
  characterful fonts. Pair display + body font.
- **Color & Theme**: Dominant colors with sharp accents outperform timid,
  evenly-distributed palettes.
- **Motion**: One well-orchestrated page load with staggered reveals
  creates more delight than scattered micro-interactions.
- **Backgrounds**: Create atmosphere — gradient meshes, noise textures,
  layered transparencies, grain overlays.

NEVER use: overused fonts (Inter, Roboto), cliched purple gradients,
predictable layouts, cookie-cutter design.

Remember: Claude is capable of extraordinary creative work. Don't hold
back, show what can truly be created.
```

---

## 🔍 Phân tích: Tại sao 43 dòng mà mạnh?

### ✅ Kỹ thuật Anthropic dùng

| Kỹ thuật | Ví dụ cụ thể | Tại sao hiệu quả |
|---|---|---|
| **Role Priming qua tone** | "Don't hold back, show what can truly be created" | AI adopt persona sáng tạo, không generic |
| **Negative Constraints (NEVER)** | "NEVER use: Inter, Roboto, purple gradients" | AI biết RÕ cái cấm → tránh được |
| **Specificity thay vì rules** | "Pick an extreme: brutally minimal, maximalist chaos, retro-futuristic..." | Cho danh sách cụ thể > "hãy sáng tạo" |
| **Explain the Why** | "Dominant colors with sharp accents OUTPERFORM timid palettes" | AI hiểu lý do → áp dụng linh hoạt |
| **No formal sections** | Không có # Goal, # Instructions, # Examples, # Constraints rõ ràng | Skill creative không cần rigid structure |

### ⚠️ Điều THIẾU (nếu dùng style của chúng ta)

| Thiếu | Nên thêm? | Lý do |
|---|---|---|
| **Examples** | ✅ Nên | 2-3 screenshots/descriptions của UI tốt vs xấu |
| **Constraints** | ⚠️ Optional | Skill creative — quá nhiều constraints = giết creativity |
| **Verification** | ❌ Không cần | Output chủ quan, không grade được |
| **Scripts** | ❌ Không cần | Skill này sinh code, không cần scripts |

### 🎯 Key Insight

**Lean ≠ Yếu.** 43 dòng Anthropic > 200 dòng quy tắc generic.

Bí quyết:
1. **Mỗi câu phải pull its weight** — không câu nào thừa
2. **Inspire thay vì command** — "Don't hold back" > "MUST create beautiful UI"
3. **Negative examples > positive rules** — "NEVER use Inter" > "use beautiful fonts"
4. **Skill creative dùng tone khác skill technical** — ít structure hơn, nhiều inspiration hơn

### 📊 So sánh: 2 phong cách viết skill

| | Anthropic Style | Skill-Generator Style |
|---|---|---|
| **Tone** | Inspirational, creative | Structured, systematic |
| **Length** | 30-50 dòng | 50-200 dòng |
| **Sections** | Freeform | Goal + Instructions + Examples + Constraints |
| **Best for** | Creative skills (design, writing) | Technical skills (code, data, automation) |
| **Downside** | Ít guidance cho edge cases | Có thể over-structure |

**→ Skill Creator Ultra dùng cả 2:** technical skills → structured, creative skills → lean.
