# VIONA Pre-Next-Feature Hygiene Check

## 1. Executive Summary
- Chưa an toàn để code feature mới ngay nếu mục tiêu là release hygiene sạch; trạng thái repo hiện vẫn rất "dirty" (nhiều modified + untracked).
- Còn file/folder untracked bắt buộc cho luồng hiện tại: `src/navigation/mvpSurfaceGate.tsx`, `src/core/**`, `docs/ai-context/**`, `docs/audit/**`.
- `npm run typecheck` pass (exit 0); `npm run lint` pass (exit 0, 51 warnings, 0 errors).
- Rủi ro lớn nhất hiện tại: thiếu track cho các file foundation/gate đang được code sử dụng, dẫn đến nguy cơ lệch build/PR/CI.

## 2. Required Untracked Files To Track

| File/Folder | Required? | Tracked? | Risk If Missing |
|-------------|-----------|----------|-----------------|
| `src/navigation/mvpSurfaceGate.tsx` | Yes | No (untracked) | Mất lớp gate/disabled screen cho navigation safety; build hoặc runtime mismatch giữa máy dev và CI |
| `src/core/**` | Yes | No (untracked) | Mất feature flags / miniapp registry / monetization config; gate logic sai hoặc không compile đúng bối cảnh |
| `docs/ai-context/**` | Yes | No (untracked) | Mất single-source context cho AI/dev handoff; tăng drift chiến lược |
| `docs/audit/**` | Yes | No (untracked) | Mất traceability audit/safety decisions; khó release sign-off |

## 3. Current Modified Files

| File | Area | Likely Task | Risk |
|------|------|-------------|------|
| `App.tsx` | Navigation shell / route gating | Super App Lite + safety gates | High (entrypoint route behavior) |
| `src/navigation/MainTabNavigator.tsx` | Tab surfaces / redirects | Lite tab exposure, role tab gating | High |
| `src/navigation/v7FourUniversesBlueprint.ts` | Tab labels | Travel/Academy Lite labeling | Low |
| `src/screens/HomeScreen.tsx` | CTA entrypoints | Leona/B2B demo gate behavior | Medium |
| `src/screens/b2c/LocalScreen.tsx` | CTA entrypoints | Leona/legal scan flow visibility | Medium |
| `src/screens/HocTapScreen.tsx` | Learning surface | Academy-related nav hooks | Medium |
| `src/screens/academy/LiveAiTeacherScreen.tsx` | Academy surface | Lite/beta exposure | Medium |
| `src/screens/b2c/academy/VietKidsScreen.tsx` | Academy surface | Lite exposure | Medium |
| `src/screens/b2c/LoyaltyRewardsScreen.tsx` | VIO display | Display-only economy updates | Medium |
| `src/screens/WalletTopUpScreen.tsx` | Wallet surface | Token/cashout UX coupling | Medium |
| `src/screens/admin/AdminDashboardScreen.tsx` | Admin demo surface | Admin/Omni demo controls | High |
| `src/screens/broker/BrokerDashboardScreen.tsx` | Broker surface | Broker gate alignment | Medium |
| `src/screens/broker/BrokerCommissionsTabScreen.tsx` | Broker payouts | Commission surface gate | High |
| `src/routes/brokerRoutes.ts` | Backend route map | Broker APIs/gates | High |
| `src/routes/authRoutes.ts` | Backend auth route | Auth flow updates | High |
| `src/controllers/AuthController.ts` | Auth backend | Auth behavior | High |
| `src/controllers/AIController.ts` | AI backend | AI endpoints behavior | High |
| `src/services/auth/EmailOtpService.ts` | OTP service | OTP/Auth patching | High |
| `prisma/schema.prisma` | Data model | Auth/refresh session schema changes | High |
| `package.json` | Build/runtime deps | Dependency or script changes | High |
| `package-lock.json` | Dependency lock | Dependency state changes | High |

## 4. Typecheck / Lint
- `npm run typecheck`: **PASS** (exit code 0).
- `npm run lint`: **PASS** (exit code 0, **51 warnings**, **0 errors**).

## 5. Recommended Commit/Backup Groups
1. **docs**  
   - `docs/ai-context/**`, `docs/audit/**`.
2. **core foundation**  
   - `src/core/**`, `src/navigation/mvpSurfaceGate.tsx`.
3. **auth/prisma riêng**  
   - `prisma/schema.prisma`, `src/controllers/AuthController.ts`, `src/routes/authRoutes.ts`, `src/services/auth/EmailOtpService.ts`, migration folder (nếu thực sự cần).
4. **safety gates**  
   - `App.tsx`, `src/navigation/MainTabNavigator.tsx`, admin/broker gate files liên quan.
5. **VIO display**  
   - `src/screens/b2c/LoyaltyRewardsScreen.tsx`, wallet/topup display files liên quan.
6. **navigation gates**  
   - `src/screens/HomeScreen.tsx`, `src/screens/b2c/LocalScreen.tsx`, academy/broker screen entrypoints còn lại.

## 6. Final Recommendation
**B. Phải track/backup untracked files trước.**

Lý do: các thành phần bắt buộc cho navigation safety và feature flags vẫn đang untracked; nếu code tiếp ngay sẽ làm tăng rủi ro mất đồng bộ và khó rollback/review.
