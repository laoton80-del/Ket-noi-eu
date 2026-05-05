# Roadmap

Tài liệu này phản ánh **ước lượng từ codebase + docs hiện có**. Ngày cụ thể và ưu tiên kinh doanh: **Chưa xác định** — điều chỉnh với PM.

## Completed

- Expo app shell + điều hướng đa vai (B2C / B2B / Broker / Admin theo `MainTabNavigator`).
- API Express với Prisma: auth (login, email OTP), wallet, bookings, tourism, pay, broker, business ranking, AI (có auth), education, charity totals, user GDPR/push/persona, admin marketing.
- Stripe webhook + raw body pipeline (`app.ts`).
- Schema Prisma phong phú: tourism fees, broker escrow, piggy bank, marketing posts, v.v.
- Script preflight: `typecheck`, `smoke`, commercial gates (`package.json`).

## In Progress

- **Chưa xác định** chính xác branch/feature đang mở — kiểm tra git và ticket nội bộ.
- Refresh session / rotation (`AuthRefreshSession` trong schema): mức độ tích hợp client — **Chưa xác định** (cần đọc `AuthService` + login response).

## Next Priorities

Gợi ý kỹ thuật (không thay thế roadmap sản phẩm trong `docs/ROADMAP_V9_CHECKLIST.md`):

1. Đồng bộ tài liệu API với code sau mỗi release route mới.
2. Hoàn thiện kiểm thử tự động cho luồng ví + webhook (idempotency).
3. Rà soát GDPR wipe vs `AuthRefreshSession` và bảng audit.
4. Chuẩn hóa env cho staging/production (không commit secret).

## Later

- Mở rộng test E2E (Detox / Maestro): **Chưa xác định** công cụ.
- Tối ưu bundle / lazy load màn hình nặng.

## Technical Debt

- Một số flow B2B/Payroll trong code là **mock** (`PayrollService` mock maps) — không coi là production-complete.
- Theme: vẫn có hardcoded hex ở vài screen — có checklist brand trong script `check-brand-boundaries.ts`.
- README root trống — dùng `docs/ai-context/SETUP.md` thay thế tạm.

## Risks

- Thanh toán / fee: logic phân tán giữa Stripe builders và webhook — rủi ro lệch metadata nếu không có snapshot server-side.
- Nhiều nguồn SQL (Prisma + supabase migrations) — rủi ro drift nếu không quy trình migrate thống nhất.

## Open Questions

- Production DB: chỉ Neon/RDS hay kết hợp Supabase Auth? (**Chưa xác định**)
- App Store / Play policy cho digital goods vs Stripe — xem `IAPRouter.ts` và legal review ngoài repo.
