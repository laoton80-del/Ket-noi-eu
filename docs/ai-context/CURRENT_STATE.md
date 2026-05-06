# Current State

> **Cập nhật thủ công** sau mỗi phiên làm việc lớn. AI nên đọc file này trước khi bắt đầu task mới.

## Last Updated

2026-04-30

## Current Focus

- Bộ tài liệu **`docs/ai-context/`** vừa được khởi tạo để onboarding AI và dev.

## Recently Completed

- Tạo 10 file markdown trong `docs/ai-context/` (PROJECT_CONTEXT, ARCHITECTURE, AI_RULES, ROADMAP, CURRENT_STATE, DATA_MODEL, API_REFERENCE, SETUP, TASK_HANDOFF_TEMPLATE, SESSION_LOG).

## Currently Working On

- **Chưa xác định** — cập nhật khi user hoặc team bắt đầu sprint/feature cụ thể.

## Known Bugs

- **Chưa xác định** danh sách bug được xác nhận — thêm từ issue tracker / QA.

## Broken / Unstable Areas

- Endpoints phụ thuộc env (SES, Stripe secret, DB): thiếu env → 500 có thể xảy ra khi dev local thiếu cấu hình (xem `SETUP.md`).
- **Chưa xác định** môi trường staging ổn định công khai.

## Important Files Recently Changed

| File | Ghi chú |
|------|---------|
| `docs/ai-context/*` | Bộ context AI mới |

## Next Recommended Steps

1. Điền **Current Focus** / **Currently Working On** sau sprint planning.
2. Đồng bộ `API_REFERENCE.md` khi thêm route.
3. Chạy `npm run typecheck` trước PR lớn.

## Context For Next AI Session

- Đọc `PROJECT_CONTEXT.md` + `ARCHITECTURE.md`.
- API mount trong `src/app.ts`; Prisma schema là nguồn sự thật cho entity.
- Không chỉnh sửa thứ tự webhook Stripe trong `app.ts` nếu không hiểu rõ ảnh hưởng chữ ký.
