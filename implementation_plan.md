# Implementation plan — engineering kit (v5 track)

**Canonical repo:** `/Users/todyle/Coder/codymaster/Cody_Master`  
**Tiếp tục thực thi:** đánh dấu checkbox khi xong; chạy **Verify** trước khi merge.

Nghiên cứu gốc (GStack/Goose gap) có thể nằm ở repo khác, ví dụ `upgrade_plan.md` — đồng bộ với `[docs/roadmap-cm-v5.md](docs/roadmap-cm-v5.md)`.

---

## Tổng hợp chiến lược (cm-brainstorm-idea)

### Qualified problem

**For:** Người dùng CodyMaster / team dùng CLI + MCP engineering  
**Who:** Cần tin cậy daemon browse, guardian, sprint bus và cấu hình thống nhất  
**The:** Bộ engineering v5 **đã ship** lõi (browse, sprint, guardian, MCP tools)  
**That:** Cần **cứng hoá DX**, **một nguồn cấu hình** (`.cm/config.yaml`), **CI** và lộ trình ecosystem  
**Unlike:** Chỉ dựa env + defaults rải rác, tài liệu thiếu, sprint không có escape hatch  
**Our approach:** Ưu tiên P0 (doc + hook + sprint ergonomics) → P1 (config loader dùng chung + CI + second-opinion/canary nâng cấp) → P2/P3 ecosystem & intelligence.

### 9 Windows (tóm tắt)


|                  | Past                 | Present                                    | Future                                                 |
| ---------------- | -------------------- | ------------------------------------------ | ------------------------------------------------------ |
| **Super-system** | Kit skill/plugin rời | Đa IDE, MCP chuẩn hoá                      | Marketplace / cài skill qua CLI                        |
| **System**       | Chủ yếu skill static | CLI + daemon + bus file                    | Một file config, baseline canary, retro có cấu trúc    |
| **Sub-system**   | Ít test vùng mới     | Guardian có test; config parse chỉ storage | Module `cm config` dùng chung, workflow GitHub Actions |


### Ba hướng chiến lược (đã chọn)


| Option                  | Ý chính                                          | Effort | Khi nào hợp                 |
| ----------------------- | ------------------------------------------------ | ------ | --------------------------- |
| **A — Doc-first**       | Chỉ viết doc + ví dụ, ít code                    | S      | Cần ship nhanh, rủi ro thấp |
| **B — Config-first**    | Một loader YAML (hoặc parser chuẩn) cho mọi lệnh | M–L    | Giảm drift env vs file      |
| **C — Ecosystem-first** | `cm install` / distro trước                      | L      | Khi đã chốt `meta.json`     |


**Khuyến nghị:** Kết hợp **A ngay (P0)** + **B có kiểm soát (P1)**; **C** theo `[skills/cm-ecosystem-roadmap/SKILL.md](skills/cm-ecosystem-roadmap/SKILL.md)` sau khi format gói ổn định.

### Ma trận đánh giá (gợi ý trọng số)


| Dimension (trọng số)           | A Doc-first    | B Config-first    | C Ecosystem |
| ------------------------------ | -------------- | ----------------- | ----------- |
| Tech (25%)                     | 6              | 9                 | 7           |
| Product / DX (30%)             | 9              | 8                 | 7           |
| Design / UX CLI (20%)          | 8              | 7                 | 6           |
| Business / time-to-value (25%) | 9              | 7                 | 6           |
| **Tổng quan**                  | Thắng ngắn hạn | Nền tảng giữa hạn | Sau P1      |


### Giao cho bước tiếp (cm-planning)

1. **Scope kỳ tới:** P0 hoàn chỉnh + skeleton loader config (interface + 1 consumer) hoặc full P1 tùy bandwidth.
2. **Ràng buộc:** Không gửi secret trong diff second-opinion; browse bắt buộc token production.
3. **Đã rõ trong code:** `storage-backend.ts` đã đọc `.cm/config.yaml` (regex) — P1 nên **tái sử dụng / thay bằng parser YAML** thống nhất, tránh copy logic.
4. **Câu hỏi mở:** Có chấp nhận thêm dependency `yaml`/`js-yaml` không, hay giữ parser tối giản?

---

## Trạng thái hiện tại (đã land)


| Hạng mục                                                | Vị trí / lệnh                                                                                                                                                                                  |
| ------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Browse daemon (Playwright + HTTP)                       | `[src/browse-server.ts](src/browse-server.ts)` · `cm browse start`                                                                                                                             |
| Sprint Context Bus                                      | `[src/sprint-pipeline.ts](src/sprint-pipeline.ts)` · `cm sprint init                                                                                                                           |
| Guardian (pattern + freeze path)                        | `[src/guardian-core.ts](src/guardian-core.ts)` · `cm guardian check` · `cm guardian path-check`                                                                                                |
| CLI engineering                                         | `[src/cli/commands/engineering.ts](src/cli/commands/engineering.ts)` · đăng ký trong `[command-registry.ts](src/cli/command-registry.ts)`                                                      |
| MCP bridge (6 tool mới)                                 | `[src/mcp-skills-tools.ts](src/mcp-skills-tools.ts)` + `[src/mcp-context-server.ts](src/mcp-context-server.ts)` — `cm_plan`, `cm_review`, `cm_qa`, `cm_deploy`, `cm_search`, `cm_memory_query` |
| Second opinion / QA visual / canary / conductor / retro | Cùng file `engineering.ts`                                                                                                                                                                     |
| ADR                                                     | `[docs/adr/](docs/adr/)`                                                                                                                                                                       |
| Config mẫu                                              | `.cm/config.example.yaml` trong repo; skills (`cm-guardian-runtime`, …) trỏ tới file này                                                                                                        |
| Skill template                                          | `[templates/SKILL.md.tmpl](templates/SKILL.md.tmpl)`                                                                                                                                           |
| Scripts CI skill                                        | `npm run validate:skills` · `npm run build:skills` · `npm run check:skills`                                                                                                                    |
| Skills docs mới                                         | `skills/cm-browse/`, `cm-sprint-bus/`, `cm-guardian-runtime/`, `cm-engineering-meta/`, …                                                                                                       |
| Test guardian                                           | `[test/guardian-core.test.ts](test/guardian-core.test.ts)`                                                                                                                                     |


---

## Thứ tự thực thi đề xuất (2–3 sprint nhỏ)

1. **Sprint A — Niêm yết & an toàn vận hành:** P0 (browse doc, guardian hook doc, sprint `skip`/`reset`). Kế hoạch chi tiết: `[docs/plans/sprint-a-p0.md](docs/plans/sprint-a-p0.md)`.
2. **Sprint B — Một nguồn sự thật config + CI:** P1 config loader chung + GitHub Actions; sau đó second-opinion provider #2 và canary baseline.
3. **Sprint C — Ecosystem / intelligence:** P2 marketplace sketch; P3 retro JSONL + `cm suggest`.

---

## Backlog — thực thi tiếp (ưu tiên gợi ý)

### P0 — cứng hoá & DX

- **Document `cm browse`:** README chính hoặc `docs/browse-daemon.md` — cài Chromium (`npx playwright install chromium`), biến môi trường `CM_BROWSE_TOKEN`, port/host CLI, troubleshooting 401/port busy.  
  - **DoD:** Người mới làm theo doc chạy được `browse start` + `cm qa-visual` trong < 10 phút.
- **Guardian + hook:** Tài liệu gọi `cm guardian check` từ pre-tool shell (Cursor/Codex); hướng dẫn mở rộng whitelist (hiện `guardian-core` nhận `extraWhitelist`; đồng bộ với keys trong `.cm/config.yaml` khi P1 xong).  
  - **DoD:** Một đoạn copy-paste hook + bảng ví dụ lệnh bị chặn / được phép.
- **Sprint `skip` / `reset`:** CLI `cm sprint skip <step>` (ghi event + nhảy `current_index` / đánh dấu skipped) và `cm sprint reset` (xóa hoặc archive `state.json` + optional backup).  
  - **DoD:** Test hoặc ít nhất dry-run log rõ ràng; không corrupt `events.jsonl`.  
  - **Gợi ý code:** Mở rộng `[src/sprint-pipeline.ts](src/sprint-pipeline.ts)` + subcommand trong `engineering.ts`.

### P1 — chất lượng & an toàn

- **Config dùng chung:** `loadCmConfig` trong `[src/cm-config.ts](src/cm-config.ts)` (`yaml`); `browse` / `guardian` / `canary` + `[getBackend](src/storage-backend.ts)` đọc cùng file. Mẫu: `[.cm/config.example.yaml](.cm/config.example.yaml)`.  
  - **DoD:** Test `test/cm-config.test.ts`; không còn regex `loadStorageConfig` riêng.
- **cm second-opinion:** `--provider openai|anthropic`, redact qua `[src/second-opinion-providers.ts](src/second-opinion-providers.ts)`; `OPENAI_API_KEY` / `ANTHROPIC_API_KEY`.  
  - **DoD:** Thiếu key → exit 1 + message rõ.
- **cm canary:** `fetch` + latency; `--save-baseline` / `--compare-baseline` → `.cm/canary-baseline.json`. Lighthouse/CWV: backlog tùy chọn.  
  - **DoD:** So sánh 2 lần chạy (status + latency).
- **CI:** `[.github/workflows/ci.yml](.github/workflows/ci.yml)` — build, `test:gate`, `validate:skills`, `check:skills`. README đã ghi.

### P2 — design & ecosystem

- **cm-design-studio:** Skill + CLI mỏng (`cm design-studio init|status`) — checklist + folder `.cm/design-studio/`.  
  - **DoD:** Happy path trong skill + README artifact; không bắt buộc MCP ngoài.
- **Phase 4.5 upgrade (Stitch + DESIGN.md):** dùng baseline từ `VoltAgent/awesome-design-md` để tạo `DESIGN.md` local, sau đó feed vào Stitch prompt/handoff.
  - **DoD:** Có `DESIGN.md` + hướng dẫn chọn baseline + prompt contract trong handoff.
- **Marketplace / distro:** ADR 003 + `cm distro validate <dir>`; `cm install` / `cm distro create` vẫn backlog (xem `[skills/cm-ecosystem-roadmap/SKILL.md](skills/cm-ecosystem-roadmap/SKILL.md)`).  
  - **DoD:** ADR/spec cho format gói.

### P3 — intelligence

- **cm retro summary:** `cm retro summary` — tổng hợp JSONL theo tool; `--format json|md`, `--since`. (`cm retro --summary` giữ 20 dòng nhanh.)  
  - **DoD:** Output JSON hoặc Markdown có filter `--since`.
- **Gợi ý skill proactive:** `cm suggest` — `git status` + sprint state.  
  - **DoD:** Output skill + lý do ngắn.

---

## Verify (chạy trước khi claim xong)

```bash
cd /Users/todyle/Coder/codymaster/Cody_Master
npm install
npm run build
npm run test:gate
npm run validate:skills
npm run check:skills
# Guardian smoke:
node dist/index.js guardian check -- "echo ok"
node dist/index.js guardian check -- "rm -rf /" ; echo "exit=$?"  # expect exit 1
```

Nếu `cm` đã link global:

```bash
cm guardian check -- "echo ok"
cm sprint dry-run --project .
```

Browse E2E (cần Chromium):

```bash
export CM_BROWSE_TOKEN=test
# terminal 1:
cm browse start --token "$CM_BROWSE_TOKEN"
# terminal 2:
cm qa-visual --url https://example.com --token "$CM_BROWSE_TOKEN"
```

---

## Ghi chú `/cm-start` (continuity)

Khi mở phiên mới:

1. Đọc `.cm/CONTINUITY.md` **trong project đang làm việc** (không nhầm với repo khác).
2. Cập nhật **Active Goal** theo mục backlog đang làm (ví dụ: “P1: module load `.cm/config.yaml` cho guardian”).
3. Ghi **Files Modified** và **Next Actions** sau mỗi chunk.

---

## Kích thước repo & công cụ

- **Ước lượng:** ~41 file `src/*.ts` — dưới ngưỡng “rất lớn” của cm-deep-search; nếu docs phình to, có thể cân nhắc qmd sau.  
- **AGENTS.md:** Không có trong repo — có thể bổ sung overview cho agent (tùy chủ repo).

---

## Liên kết nội bộ

- Roadmap ngắn: `[docs/roadmap-cm-v5.md](docs/roadmap-cm-v5.md)`  
- ADR browse: `[docs/adr/001-playwright-browse-daemon.md](docs/adr/001-playwright-browse-daemon.md)`  
- ADR sprint bus: `[docs/adr/002-sprint-context-bus-files.md](docs/adr/002-sprint-context-bus-files.md)`

