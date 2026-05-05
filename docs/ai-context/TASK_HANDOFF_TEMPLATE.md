# AI Task Handoff

Sao chép nội dung template này vào ChatGPT / Claude / Gemini khi bắt đầu task mới. Điền các ô trong ngoặc.

---

## Project Summary

*(Ngắn — từ `docs/ai-context/PROJECT_CONTEXT.md` § One-line + Core Features)*

**Kết Nối Global** — Expo RN app + Express API (Prisma/PostgreSQL): ví VIG, booking, tourism, broker, AI, charity, GDPR erase.

---

## Current State

*(Từ `docs/ai-context/CURRENT_STATE.md` — cập nhật ngày và focus)*

- Last Updated: YYYY-MM-DD
- Current Focus: …
- Recently Completed: …

---

## Task

Tôi muốn bạn giúp tôi:

[Mô tả rõ ràng outcome mong muốn — ví dụ: thêm field X vào API Y, sửa bug Z]

---

## Relevant Files

*(Liệt kê đường dẫn file đã biết — AI có thể bổ sung sau khi grep)*

- ``
- ``

---

## Constraints

- Không đổi kiến trúc (ORM, envelope API, auth model) nếu chưa hỏi.
- Không sửa file ngoài phạm vi task trừ khi blocker rõ ràng.
- Giải thích plan ngắn trước khi sửa code lớn.
- Sau khi xong: liệt kê đầy đủ file đã thay đổi.
- Không commit secret; chỉ tên biến env trong doc.

---

## Expected Output

1. **Plan** — bullet các bước.
2. **Files to edit** — danh sách dự kiến.
3. **Code changes** — patch hoặc mô tả từng file.
4. **Tests/checks** — ví dụ `npm run typecheck`, luồng thử tay.
5. **Summary** — một đoạn cho changelog / PR.
