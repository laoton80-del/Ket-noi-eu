# Session Log

Ghi lại các phiên làm việc với AI để đội và các phiên sau có ngữ cảnh.

---

## 2026-04-30

### Goal

Khởi tạo bộ tài liệu **AI context** trong `docs/ai-context/` để onboarding ChatGPT, Claude, Gemini, Cursor — không sửa code ứng dụng.

### Changes Made

- Tạo thư mục `docs/ai-context/` và 10 file Markdown theo spec: PROJECT_CONTEXT, ARCHITECTURE, AI_RULES, ROADMAP, CURRENT_STATE, DATA_MODEL, API_REFERENCE, SETUP, TASK_HANDOFF_TEMPLATE, SESSION_LOG.

### Files Changed

- `docs/ai-context/PROJECT_CONTEXT.md` (mới)
- `docs/ai-context/ARCHITECTURE.md` (mới)
- `docs/ai-context/AI_RULES.md` (mới)
- `docs/ai-context/ROADMAP.md` (mới)
- `docs/ai-context/CURRENT_STATE.md` (mới)
- `docs/ai-context/DATA_MODEL.md` (mới)
- `docs/ai-context/API_REFERENCE.md` (mới)
- `docs/ai-context/SETUP.md` (mới)
- `docs/ai-context/TASK_HANDOFF_TEMPLATE.md` (mới)
- `docs/ai-context/SESSION_LOG.md` (mới)

### Decisions

- Nội dung kỹ thuật lấy từ `package.json`, `src/app.ts`, `src/routes/*.ts`, `prisma/schema.prisma`, `.env.example`, `app.config.js`, `src/server.ts`. Phần không xác minh được đánh dấu **Chưa xác định**.
- Không ghi giá trị secret hoặc nội dung `.env`.

### Bugs Found

- Không có — phiên chỉ tạo doc.

### Next Steps

- Cập nhật `CURRENT_STATE.md` và `API_REFERENCE.md` khi thêm/sửa route.
- Thêm entry mới vào `SESSION_LOG.md` sau mỗi phiên AI lớn.
