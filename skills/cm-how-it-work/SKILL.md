---
name: cm-how-it-work
description: "Complete guide to vibe coding with the Cody Master skill kit — from idea to deploy. Covers the full workflow, skills used at each phase, and common use cases. Read this first if you are new; reference it whenever you're unsure which skill to invoke."
---

# Cody Master Kit — The Ultimate Vibe Coding Guide

## Tổng quan

Bộ kit **Cody Master (CM)** biến ý tưởng thành production code thông qua 13 skill chuyên biệt đã được tối ưu hóa. Quy trình này đảm bảo chất lượng cao nhất, bảo mật tuyệt đối và tốc độ thực thi tối đa.

```
💡 Ý tưởng → 📐 Thiết kế → 🧪 Test-first (TDD) → 💻 Code → ✅ Verify → 🚀 Deploy → 🔄 Iterate
```

---

## Quy trình Làm việc (Workflow)

### Phase 0: Identity & Safety 🔒
> **Rule số 1:** Luôn xác nhận danh tính trước khi thực hiện bất kỳ hành động nào có thể thay đổi trạng thái project.

- **Skill:** `cm-identity-guard`
- **Khi nào:** Bắt đầu phiên làm việc, trước khi git push, deploy, hoặc thao tác database.
- **Hành động:** Chạy `node check-identity.js` (hoặc script tương tự) để verify GitHub/Cloudflare/Supabase accounts.

---

### Phase 1: Planning & Design 📐
> **Hiểu rõ 'Job to be Done' (JTBD) và kiến trúc trước khi viết code.**

- **Skill:** `cm-planning` (Gộp từ brainstorming + writing-plans)
- **Hành động:** 
    1. Brainstorm yêu cầu và phân tích i18n.
    2. Đề xuất architecture và tech stack.
    3. Viết `implementation_plan.md` chi tiết.
- **Output:** Tài liệu thiết kế và kế hoạch thực thi đã được user approve.

---

### Phase 2: Implementation (TDD & Execution) 💻
> **Biến kế hoạch thành mã nguồn thực tế một cách an toàn.**

- **Skills:**
    - `cm-tdd`: Chu kỳ Red-Green-Refactor. Không viết code production nếu không có test fail trước.
    - `cm-execution`: Thực thi plan một cách thông minh (Manual, Parallel, hoặc Subagent mode).
    - `cm-project-bootstrap`: Cho dự án mới — setup repo, i18n, SEO, và deploy pipeline từ Day 0.
    - `cm-git-worktrees`: Cách ly các đầu việc khác nhau để không lẫn lộn state.

---

### Phase 3: Quality Control & Verification ✅
> **Chứng minh bằng bằng chứng (Evidence), không phải bằng lời nói.**

- **Skills:**
    - `cm-quality-gate`: Setup hạ tầng test (`test:gate`) và verify output trước khi claim "xong".
    - `cm-debugging`: Khi test fail, dùng framework systematic investigation để tìm root cause.
    - `cm-code-review`: Quy trình request và nhận feedback chuyên nghiệp.

---

### Phase 4: Safe Deployment 🚀
> **Ship code mà không lo sợ sự cố.**

- **Skills:**
    - `cm-safe-deploy`: Chạy 8-gate pipeline (Secret → Syntax → Test → Build → Deploy → Smoke).
    - `cm-safe-i18n`: Dịch và đồng bộ hóa ngôn ngữ đồng nhất trên toàn bộ project.
    - `cm-terminal`: Giám sát mọi câu lệnh terminal để phát hiện lỗi ngay lập tức.

---

## Cody Master Kit — Tóm tắt 13 Skills

| # | Skill | Chức năng chính |
|---|-------|----------------|
| 1 | `cm-project-bootstrap` | Khởi tạo dự án chuẩn 10-phase. |
| 2 | `cm-planning` | Khám phá ý tưởng và lập kế hoạch thực thi. |
| 3 | `cm-execution` | Chạy implementation plan (Manual/Parallel/Subagent). |
| 4 | `cm-tdd` | Quy trình Test-Driven Development nghiêm ngặt. |
| 5 | `cm-quality-gate` | Setup test files + Verification trước khi claim/deploy. |
| 6 | `cm-code-review` | Quản lý vòng đời PR và feedback. |
| 7 | `cm-safe-deploy` | 8-gate automated deployment pipeline. |
| 8 | `cm-safe-i18n` | Quản lý và dịch đa ngôn ngữ an toàn. |
| 9 | `cm-debugging` | Điều tra lỗi có hệ thống (Root cause first). |
| 10 | `cm-terminal` | Protocol chạy lệnh terminal an toàn. |
| 11 | `cm-git-worktrees` | Cách ly môi trường code theo task. |
| 12 | `cm-skill-mastery` | Tìm kiếm, cài đặt và viết skill mới. |
| 13 | `cm-identity-guard` | Bảo vệ project khỏi deploy nhầm account/project. |

## 🚀 Hệ Thống Tự Chủ (Autonomous Workflow)

Bộ kit hỗ trợ chế độ tự chạy (Autonomous Mode) bằng cách áp dụng vòng lặp **Reason → Act → Reflect → Verify (RARV)**.

### Cách sử dụng Workflow:
1. **`/cm-start [mục tiêu]`**: Bắt đầu công việc. Hệ thống sẽ tự tạo `cm-tasks.json`, chia nhỏ task, bật giao diện theo dõi, và tự động dùng các skill CM để hoàn thành.
2. **`/cm-dashboard`**: Mở Dashboard theo dõi trực quan trên trình duyệt (thấy được Kanban board, log luồng suy nghĩ, và tiến độ).
3. **`/cm-status`**: Xem tóm tắt tiến độ nhanh trong Terminal.

---

## 💡 Hướng Dẫn Kích Hoạt Theo Use Cases

Có 2 cách dùng Cody Master: **Tự chủ hoàn toàn (Via Workflows)** hoặc **Kích hoạt thủ công từng skill (Via Prompting)**.

### 1. Xây dựng Tính năng Mới / Dự án Mới (Tự Chủ)
> Cách tốt nhất để giao việc trọn gói.
- **Lệnh:** `/cm-start "Build tính năng quản lý user gồm màn hình list và CRUD form"`
- **Luồng ngầm định:** Planning → tạo Task JSON → sub-agents liên tục chạy `cm-tdd` và `cm-quality-gate` cho từng task đến khi xong.

### 2. Sửa Lỗi Production (Thủ công)
> Bug cần sự giám sát chặt chẽ và không nên cho AI tự mò mẫm đổi code quá nhiều.
- **Bước 1:** Kích hoạt `cm-debugging` để tìm Root Cause.
- **Bước 2:** Kích hoạt `cm-tdd` để viết test reproduce bug và sửa nó.
- **Bước 3:** Kích hoạt `cm-safe-deploy` để ship code an toàn.

### 3. Setup Project Mới Từ Đầu
> Thiết lập nền tảng để tránh nợ kỹ thuật sau này.
- **Lệnh gõ:** "Sử dụng `cm-identity-guard` đảm bảo đúng account, sau đó chạy `cm-project-bootstrap` để setup dự án Next.js mới."

### 4. Dịch thuật Đa Ngôn Ngữ Hàng Loạt
> Công việc nhàm chán nhưng dễ sai sót nếu AI mất tập trung.
- **Lệnh gõ:** "Sử dụng `cm-safe-i18n` để extract toàn bộ text cứng trong thư mục `/components` ra file `vi.json` và `en.json`."

---

## 8 Quy Tắc Vàng (Golden Rules)

1. **Identity First:** Verify account (`cm-identity-guard`) trước khi push/deploy.
2. **Design Before Code:** Luôn có plan được duyệt trước khi gõ phím.
3. **i18n Day 0:** Luôn quan tâm đa ngôn ngữ ngay từ bước brainstorm.
4. **Test Before Code:** RED → GREEN → REFACTOR. Không có ngoại lệ.
5. **Evidence Over Claims:** Chỉ tin output của terminal/test results, không tin AI "nói" đã xong.
6. **Deploy via Gates:** 8 gates phải pass tuần tự. Bất kỳ gate nào fail = DỪNG.
7. **Safe Secrets:** Không bao giờ commit secrets. Dùng `.dev.vars` hoặc quản lý qua Cloudflare.
8. **Parallel Power:** Sử dụng execution parallel cho i18n hoặc multi-bug fixes.
