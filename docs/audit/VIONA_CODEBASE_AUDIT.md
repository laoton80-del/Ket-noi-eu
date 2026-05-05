# VIONA Codebase Audit

**Phạm vi:** Repo `ket-noi-global` tại thời điểm audit (đọc source + script có sẵn). **Brand mới “VIONA”** trong brief — **chưa xuất hiện** trong code/UI đã quét; codebase vẫn dùng **ViGlobal / Kết Nối Global / KNG** ở nhiều nơi.

**Phương pháp:** Đọc `package.json`, `src/app.ts`, routes/controllers/services đại diện, `prisma/schema.prisma`, `docs/ai-context/*`, grep `mock`/`Mock`/`demo`, chạy **`npm run typecheck`** (thành công, exit 0).

---

## 1. Executive Summary

| Câu hỏi | Trả lời |
|---------|---------|
| **App đang ở trạng thái nào?** | **Bản build product-heavy:** Expo RN + Express API + Prisma schema lớn; nhiều màn **demo/mock** (marketing admin, KOL dashboard, B2B booking “mock engine”, payroll mock, voice receptionist “architecture sketch”). Luồng **auth + wallet + một số API** có vẻ production-shaped nhưng **phụ thuộc env và triển khai**. |
| **Có thể launch MVP chưa?** | **Chưa** như một MVP **đáng tin cho tiền & B2B** mà không có thêm **hard gate QA, env production, và loại bỏ/ẩn demo**. Có thể **launch pilot hạn chế** (bản đọc-only / ít thanh toán) nếu cố ý cắt scope — **Chưa xác định** mục tiêu kinh doanh cụ thể. |
| **Nếu chưa, lý do lớn nhất?** | **Độ tin cậy “thật vs trình diễn” không đồng nhất:** nhiều tính năng trọng yếu (AI receptionist, omni marketing, payroll, một phần B2B flow) là **mock hoặc stub**; thanh toán/broker cần **cấu hình secrets + kiểm thử E2E** trước khi mở cho user trả tiền. |
| **Điểm mạnh lớn nhất** | **Nền API + schema Prisma + envelope JSON + middleware auth/rate limit + Stripe webhook raw body** được thiết kế có chủ đích; **`tsc --noEmit` pass** — nền tảng kỹ thuật để hoàn thiện. |
| **Điểm yếu lớn nhất** | **Surface area quá rộng** so với mức “đã harden”: admin/marketing/B2B/client đều có lớp demo; **thiếu một đường happy-path MVP được đánh dấu rõ** trong code. |
| **Rủi ro lớn nhất trước khi ra thị trường** | **Tài chính & niềm tin:** lỗi fee/metadata/webhook hoặc user thấy **mock** trong luồng merchant — tổn hại thương hiệu (kể cả khi rebrand VIONA). |

---

## 2. Repository Structure Audit

| Thành phần | Vị trí |
|------------|--------|
| **Frontend app (Expo)** | Root: `App.tsx`, `index.ts`, `src/screens/`, `src/navigation/`, `src/components/` |
| **Backend/API** | `src/server.ts`, `src/app.ts`, `src/routes/`, `src/controllers/`, `src/services/` (chồng lên cả client và server — **cần phân biệt import path**) |
| **Mobile/Expo** | Cùng repo với app; `app.config.js`, `package.json` `expo` |
| **Prisma / DB** | `prisma/schema.prisma`, `prisma/migrations/` |
| **Docs** | `docs/` (nhiều file chiến lược), `docs/ai-context/` (onboarding AI) |
| **Config / env** | Root `.env` (không audit giá trị), `.env.example`, `app.config.js` `extra`, `src/config/` |

**Đánh giá cấu trúc:**

- **Có rõ:** Entry API (`createApp`), mount route chuẩn; entry app Expo rõ.
- **Lẫn lộn frontend/backend:** **Có** — `src/services/` vừa gọi API (`apiClient`, `EXPO_PUBLIC_BACKEND_API_BASE`) vừa chứa logic server-style; developer mới dễ import nhầm nếu không đọc đường dẫn.
- **Mini-app platform:** **Một shell điều hướng theo role + tab** (`MainTabNavigator`, `userStore` active role) — **gần** “mini-app” (Hub/Local/Travel/Academy cho B2C) nhưng **không** phải runtime plugin isolation; là **monolith UI** với nhiều tab/màn.

---

## 3. Tech Stack Reality Check

| Hạng mục | Thực tế từ code | Đánh dấu |
|----------|-----------------|----------|
| Framework frontend | Expo ~54, React Native 0.81, React 19, TypeScript | **Real** |
| Backend/API | Express 5 (`src/app.ts`), chạy `tsx src/server.ts` | **Real** |
| Database/ORM | Prisma 6 + PostgreSQL (`DATABASE_URL`) | **Real** (cần DB thật để chạy) |
| Auth | JWT Bearer `authMiddleware`; login phone+PIN + email OTP (Zod trên auth routes) | **Partial** — refresh session có model `AuthRefreshSession` trong schema; **Chưa xác định** mức độ wiring đầy đủ client↔server trong mọi luồng |
| Payment | Stripe RN dependency; server webhook `verifyStripeWebhookSignature`; client không có secret | **Partial** — an toàn thiết kế webhook; **Missing/Chưa xác định** production keys & full PI flows trong app |
| AI integration | OpenAI: `createRoutedChatCompletion` cho `/api/ai/chat-completion`; translation gọi service có cache; legal scan dùng **`mockLegalScan`** nhưng **trừ VIG thật** | **Partial** — chat/translate **real** khi có `OPENAI_API_KEY`; legal scan **mock logic** |
| Mobile stack | Expo, dev client, native modules (Mapbox, Stripe, Firebase, v.v.) | **Real** |
| Deployment stack | Script `build:web`, `functions:build`; không có Dockerfile trong quét nhanh | **Chưa xác định** pipeline production trong repo |

---

## 4. Docs vs Code Consistency

| Area | Docs Say (`docs/ai-context`) | Code Reality | Match? | Notes |
|------|------------------------------|--------------|--------|-------|
| Product scope | ViGlobal / Kết Nối Global, mini-ecosystem | Cùng branding trong app strings; **không có “VIONA”** | **Partial** | Brief gọi brand **VIONA** — code **chưa** rebrand |
| Architecture | Express + Prisma + Expo; webhook trước JSON | Khớp `app.ts` | **Yes** | — |
| Data model | Mô tả entity chính | `schema.prisma` phong phú, khớp hướng | **Yes** | Chi tiết field: luôn đọc schema |
| API reference | Liệt kê endpoint | Routes trong `src/routes/*.ts` khớp hướng; shape body từng route: **cần đọc controller** | **Partial** | Doc không thay OpenAPI machine-readable |
| Setup | `.env.example`, `api:dev`, DB | Khớp | **Yes** | — |
| Roadmap/current state | Snapshot mang tính hand-written | Code có mock/demo nhiều hơn doc gợi ý | **Partial** | CURRENT_STATE có thể lạc hậu nếu không cập nhật |
| AI rules | Quy tắc sửa code | Không xung đột; đây là quy ước, không phải enforce tự động | **N/A** | — |

---

## 5. Product Module Audit

| Module | Status | Frontend | Backend | Database | Notes |
|--------|--------|----------|---------|----------|-------|
| Hub (Home / LifeOS) | **Partial** | `HomeScreen`, LifeOS hooks | Một phần qua API charity/notification | Profile/Wallet | Nhiều tính năng phụ thuộc local state |
| Local | **Partial** | `LocalScreen` + demo booking payload | Booking API có | `Booking`/`Service` | Có `getDemoBookingPayload` |
| Travel | **Partial** | `TravelHubScreen`, tourism screens | `/api/tourism/*` | `TourismBooking` | Một số copy “demo” (weather, SOS hub) |
| Academy | **Partial** | Tab AI / VietKids / academy screens | `/api/edu/*`, AI routes | PiggyBank, v.v. | Demo tour + mock audio |
| Merchant dashboard | **Partial** | `MerchantDashboardScreen`, orders, paywall | Business ranking, pay merchant APIs | `Business` | B2B workspace gated |
| Booking | **Partial** | Nhiều flow | `/api/bookings` auth | `Booking` | QR completion path; legacy complete deprecated |
| Broker QR | **Partial** | Broker tabs | `/api/broker/*` | `Business.brokerId`, escrow tables | Cần role BROKER |
| Auth / roles | **Partial** | AuthContext, userStore | JWT + middleware | `User.role` | Super-admin: DB role ADMIN |
| Wallet / payments | **Partial** | Wallet screens, Stripe | Wallet transfer, pay, webhook | `Wallet`, `Transaction` | Phụ thuộc `EXPO_PUBLIC_BACKEND_API_BASE` |
| AI receptionist | **Mock** | Voice/B2B flows | **Chưa xác định** server realtime bridge | N/A | `VoiceReceptionistService.ts` ghi rõ **mock / sketch** |
| Admin dashboard | **Partial / heavy demo** | `AdminDashboardScreen` | `/api/admin/*` | Marketing posts | Nhiều nhãn “mock” MarTech |
| SOS / Global Lifeline | **Partial** | `SOSShieldComponent`, tab visibility rules | Ít/none HTTP SOS | N/A | Ping rescue có thể chỉ local notification |

---

## 6. Architecture Audit

- **Kiểu kiến trúc:** **Modular monolith** — một codebase Expo + một server Express; không có package `apps/web` tách; **không** có mini-app runtime loader độc lập.
- **AppShell chung:** **Có** — stack + tab navigator + `AuthPaywallModal`, theme hub (`HubThemeContext`, `V7NavigationSurfaceContext`).
- **Route structure:** **Rõ** — `navigation/routes.ts`, `MainTabNavigator`, role-based tabs.
- **Component system:** **Có** nhưng **Chưa xác định** một design system document duy nhất; có `theme/`, `applyWebStyles`, NativeWind-style class names ở một số nơi.
- **Domain boundary:** **Yếu** — `src/services/` trộn client/server concepts; domain B2B có thêm `src/domain/b2b/` (Firestore-style types) **song song** Prisma — dễ nhầm nguồn sự thật dữ liệu.
- **Tách mini-app Hub/Local/Travel/Academy:** **Khả năng tách logic** (tab + feature flags) **có**; **tách bundle độc lập** — **chưa**, cần refactor lớn.
- **Overengineering:** **Có dấu hiệu** — schema + màn admin/marketing rất rộng so với MVP proof; nhiều “engine” song song.
- **Legacy / dead code:** **Chưa xác định** đầy đủ; có route deprecated (`/bookings/complete`), nhiều file “mock”.

**Kết luận kiến trúc:**

- **Nên giữ** shell Express + Prisma + Expo và envelope API.
- **Không cần rebuild toàn bộ** — cần **restructure nhẹ theo feature slice** (hoặc đơn giản hóa MVP) và **gắn nhãn demo**.

---

## 7. Frontend/UI Audit

| Issue | Severity | File/Area | Recommendation |
|-------|----------|-----------|----------------|
| Brand **ViGlobal** everywhere; **VIONA** chưa có | Low (đổi brand) | `app.config.js` name, strings | Plan rebrand chuỗi + asset sau quyết định pháp lý thương hiệu |
| Hardcoded hex / gradient | Medium | `HomeScreen`, `TravelScreen`, `app.config.js` | Dồn vào theme tokens (đã có `theme/theme.ts`) |
| Demo/Mock UI trong production path | **High** | `AdminDashboardScreen`, `KOLPartnerDashboard`, `B2BBookingDashboard` | Feature flag “demo mode” hoặc ẩn khỏi build store |
| SOS ẩn trên tab Academy (theo code đã biết) | Medium | `MainTabNavigator` | Xác nhận UX an toàn — có thể bug product |
| Loading/empty states | **Chưa xác định** đồng đều | Nhiều screen | Audit từng flow MVP |
| “Luxury/glass/gold” | Subjective | B2B/B2C shell | Nếu VIONA = Clean Tech Trust — cần guideline thị giác riêng (**Chưa xác định** trong code) |

---

## 8. Backend/API Audit

| Endpoint/Area | Status | Risk | Recommendation |
|---------------|--------|------|------------------|
| `GET /health` | Working | Low | Giữ |
| `POST /api/auth/*` | Partial | Medium | Hoàn thiện refresh flow nếu product yêu cầu; giữ Zod |
| `POST /api/pay/webhook/stripe` | Real pattern | **High** nếu thiếu secret/monitoring | Giữ signature verify; alert khi fulfillment fail |
| `/api/wallet/*` | Partial | **High** money | Integration tests + idempotency review |
| `/api/bookings/*` | Partial | Medium–High | Ưu tiên QR path; xóa/giảm UI gọi legacy |
| `/api/tourism/*` | Partial | Medium | FX fields — cần test với DB |
| `/api/ai/*` | Partial | Medium | Legal scan = mock brain + real debit — **công bố hoặc đổi** |
| `/api/admin/*` | Partial | Medium | Role ADMIN only — OK nếu seed admin an toàn |
| `/api/broker/*` | Partial | **High** commission | End-to-end broker + escrow |
| `/api/charity/totals` | Public | Low | Đảm bảo không lộ PII |
| Global error handler | Working | Low | Trả message generic — OK |
| Validation | **Partial** | Medium | Mở rộng Zod cho route chưa có |

---

## 9. Database & Prisma Audit

**Schema có** (không liệt kê hết — xem `schema.prisma`): `User`, `AuthRefreshSession`, `Wallet`, `Transaction`, `Business`, `Service`, `Booking`, `TourismService`, `TourismBooking`, `BrokerCommissionEscrow`, `MarketingPost`, `PiggyBank`, `Charity*`, `ProcessedStripeEvent`, `AILog`, `LlmApiUsageLog`, v.v.

| Entity/Table | Purpose | MVP Needed? | Risk | Notes |
|----------------|---------|-------------|------|-------|
| `User` / `Profile` | Core | **Yes** | Low | — |
| `Wallet` / `Transaction` | MVP tiền | **Yes** | **High** | Đúng số học + idempotency |
| `Booking` | Local merchant booking | **Yes** nếu chọn path B | Medium | QR token hash — tốt |
| `TourismBooking` | Travel | **Maybe** | Medium | Nhiều field fee — đừng bán trước khi test |
| `BrokerCommissionEscrow` | Broker | **Maybe** | **High** | Ràng buộc nghiệp vụ |
| `MarketingPost` | Social | **No** early MVP | Low | Có thể overkill |
| `PiggyBank` | Kids academy | **No** early | Low | — |
| `AuthRefreshSession` | Auth hardening | **Yes** nếu refresh live | Medium | GDPR wipe phải đồng bộ (ngoài phạm vi audit code change) |

**Multi-tenant:** **Không** có tenant_id tổng quát — isolation theo **userId / businessId / role** trong query; **Chưa xác định** hardening đầy đủ mọi endpoint.

**Migrations:** Có thư mục `prisma/migrations/` — **Chưa xác định** trạng thái apply trên mọi môi trường.

**Seed:** **Chưa xác định** file seed chuẩn trong audit này.

---

## 10. Auth, Roles & Tenant Isolation Audit

- **Auth:** **Có** — JWT + bcrypt PIN (server services).
- **Roles:** Prisma `Role` — **có** B2C/B2B/B2B_EU/B2B_VN/ADMIN/BROKER.
- **Tenant isolation:** **Phần lớn app-layer** (where theo `authUserId`); **không** chứng minh RLS đầy đủ cho mọi bảng Supabase nếu client truy cập trực tiếp — có file `supabase_migrations/01_v7_rls_seal.sql` cho subset.
- **Merchant chỉ thấy data mình:** **Chưa xác định** đã kiểm chứng trên **mọi** query — **cần audit query-by-query** trước B2B launch.
- **Cross-merchant leak risk:** **Trung bình** nếu có endpoint quên filter `ownerId` — **P1/P0** tùy endpoint.

**Kết luận B2B MVP:**

- **Chưa đủ** để tuyên bố “an toàn launch merchant” **chỉ dựa trên audit đọc code** — cần **pen-test nhỏ + test script** trên staging.

**P0 security blockers (đề xuất):**

1. Rà soát mọi route có `businessId` path param — ownership check.
2. Đảm bảo không có client-only gate cho hành động tài chính.
3. Webhook Stripe + idempotency verified trong staging.

---

## 11. Payment & Monetization Audit

| Hạng mục | Có? | Ghi chú |
|----------|-----|---------|
| Stripe | **Yes** (packages + webhook) | Cần keys + merchant config |
| Subscription | **Partial** | Field `subscriptionPlan` + services — **Chưa xác định** hoàn chỉnh Store/IAP |
| Booking payment | **Partial** | Wallet lock + QR path trong schema |
| Broker commission | **Partial** | Escrow model + webhook hook |
| Wallet / VIG | **Yes** | Server-side ledger |
| Fake payment state | **Có** trong UI/demo (KOL, admin mock) | **Nguy hiểm** nếu user tưởng thật |
| Webhook | **Yes** (verified signature path) | Phải bật `STRIPE_WEBHOOK_SECRET` |

**Khuyến nghị MVP:**

- **Giữ:** Webhook + wallet + booking QR completion + discovery read-only.
- **Hoãn:** Omni admin “mock MarTech”, KOL dashboard số demo, piggy kids nếu không core.
- **Nguy hiểm khi launch:** Bật tiền thật khi còn mock song song mà không có nhãn “Demo”.

---

## 12. AI Feature Audit

| Khía cạnh | Thực tế |
|-----------|---------|
| Chat completion | **Real** OpenAI qua server proxy (`postChatCompletion`) |
| Travel phrase translate | **Real** + cache DB |
| Legal scan | **Debit VIG thật**, phân tích **mock** (`mockLegalScan`) |
| Voice receptionist | **Mock / sketch** (`VoiceReceptionistService` header) |
| Demo sandbox | **Mock** reply khi bật (`DemoSandbox` + `AIEngine`) |
| Prompt injection | **Partial** — có `applyPromptArmorToUserMessages` trong `AIEngine` — **Chưa xác định** đủ mạnh |
| Cost control | Router task types, max tokens chat — **Partial** |
| Logging | `LlmApiUsageLog` / Pino — **Partial** |

**Kết luận:**

- **Nên hoàn thiện trước:** **Booking + wallet + merchant discovery** (trust path).
- **AI receptionist:** **Không** nên là cốt lõi MVP trừ khi bridge WebRTC–OpenAI Realtime đã có — hiện **chưa**.

---

## 13. Security & Privacy Audit

| Priority | Risk | File/Area | Why It Matters | Fix Recommendation |
|----------|------|-----------|----------------|---------------------|
| **P0** | Webhook / payment mis-config | `StripeWebhookService`, env | Double credit / no credit | Staging replay tests, monitoring |
| **P0** | Merchant data isolation | Controllers truy vấn `Business` | Leak PII / ledger | Ownership audit |
| **P1** | Secrets in client | `EXPO_PUBLIC_*` chỉ public keys | Key misuse | Kiểm tra không lộ secret |
| **P1** | GDPR incomplete vs refresh | `UserService.wipeUserData` vs `AuthRefreshSession` | Compliance | Revoke sessions on erase |
| **P2** | Console.error trong AI controller | `AIController` | Log noise / leak snippet | Dùng logger structured |
| **P1** | Rate limits | `RateLimitMiddleware` | Abuse | Tune per production traffic |
| **P2** | File upload | `mediaRoutes` | Malware / size | Giữ auth + multer limits |

**Env/secrets:** `.env` có trong workspace locally — **không** ghi nội dung; rủi ro nếu commit — **Chưa xác định** `.gitignore` state trong audit (không chạy `git check-ignore`).

---

## 14. MVP Readiness Score (0–10)

| Area | Score | Reason |
|------|-------|--------|
| Brand/UI foundation | **5** | UI phong phú; brand VIONA chưa có; nhiều demo |
| Hub | **6** | Home/LifeOS có; phụ thuộc backend flag |
| Local mini-app | **5** | Có màn + API; lẫn demo data |
| Merchant dashboard | **5** | Có shell; booking mock engine |
| Booking | **6** | API + schema tốt; cần harden & UX |
| Broker QR | **5** | Có path; cần test commission |
| Auth/Roles | **6** | JWT + roles; refresh **Partial** |
| Database | **8** | Schema mạnh; phức tạp cho MVP |
| Payment | **5** | Webhook pattern tốt; production **Chưa xác định** |
| AI receptionist | **2** | Mock/sketch |
| Security | **5** | Nền tảng OK; cần audit ownership |
| Mobile UX | **6** | Expo tốt; nhiều màn |
| Deployment readiness | **4** | Scripts có; pipeline **Chưa xác định** |

**Có launch MVP được chưa?** **Chưa** như sản phẩm trả phí an toàn **mà không có** giai đoạn hardening + cắt demo.

**Nếu chỉ chọn 1 MVP path (khuyến nghị dựa trên code đã có):** **A — Hub + Local + Booking** (core định vị expat + merchant discovery + QR booking) **trước** AI receptionist và trước broker phức tạp — vì API booking/wallet/tourism đã tồn tại và broker có rủi ro kế toán cao hơn.

---

## 15. Recommended MVP Scope

- **MVP nên là:** **B2C expat shell:** Auth ổn định → Wallet đọc/ghi có kiểm soát → **Local discovery + booking với QR completion** → charity read-only (tuỳ chọn).
- **User đầu tiên:** Người Việt tại EU **dùng đặt lịch / quét QR** với merchant đã onboard thủ công (không cần broker scale).
- **Feature bắt buộc:** Login, JWT, wallet balance, booking create + complete-via-qr, health check, minimal error handling.
- **Feature nên hoãn:** Omni admin demo, KOL dashboard, voice receptionist production, payroll auto-tip.
- **Feature nên tắt/ẩn khỏi UI:** Các nút “mock”, demo campaign chạy log giả.
- **DB/API cần có:** `User`, `Wallet`, `Transaction`, `Business`, `Service`, `Booking`, `ProcessedStripeEvent` (+ env Stripe).
- **Screens cần có:** Login, Home/Hub, Local list/detail, Wallet, Booking confirmation, Merchant-facing minimal (hoặc merchant nhận QR ngoài app nếu chiến lược cho phép — **Chưa xác định**).
- **Điều kiện launchable:** Staging E2E xanh; không còn mock trong đường trừ tiền; policy privacy/GDPR rõ; hotfix channel (OTA/EAS) — **Chưa xác định** EAS config đầy đủ.

---

## 16. 30-Day Execution Plan

### Week 1
- **Goal:** Khóa **MVP path A** + danh sách màn hình + env checklist.
- **Tasks:** Rà route booking/wallet; tắt demo flags trong build “production”; viết checklist QA.
- **Files/areas:** `src/routes/bookingRoutes.ts`, `WalletController`, `MainTabNavigator`, feature flags.
- **Acceptance:** Một luồng booking + QR **test tay** trên staging DB.

### Week 2
- **Goal:** Hardening **auth + wallet**.
- **Tasks:** Refresh token flow (nếu product chọn); rate limit review; error messages.
- **Files/areas:** `authRoutes`, `AuthController`, `WalletService`, client `restAuthClient` / `apiClient`.
- **Acceptance:** Không 401 loop; transfer/booking không double-charge khi retry.

### Week 3
- **Goal:** **Payment + Stripe** trên staging.
- **Tasks:** Webhook end-to-end; idempotency replay test; remove misleading mock revenue UI hoặc đánh dấu Demo.
- **Files/areas:** `StripeWebhookService`, pay routes, `WalletTopUp` client (nếu có).
- **Acceptance:** Stripe CLI hoặc dashboard test mode passes.

### Week 4
- **Goal:** **B2B lite** (optional) hoặc polish B2C-only.
- **Tasks:** Merchant ranking API + dashboard chỉ số thật từ DB; broker **hoặc** hoãn.
- **Files/areas:** `businessRoutes`, `MerchantDashboardScreen`.
- **Acceptance:** Không số random trong dashboard production build.

---

## 17. Critical Fix List

| Priority | Issue | Risk | File/Area | Recommended Fix | Estimated Effort |
|----------|-------|------|-----------|-----------------|------------------|
| P0 | Legal scan dùng mock brain nhưng trừ VIG | Niềm tin / refund | `AIController.postLegalScan` | Thay model thật hoặc đổi pricing = 0 đến khi có model | M–L |
| P0 | Ownership queries | Data leak | Controllers với `businessId` | Thêm check `ownerId === auth` | M |
| P1 | Demo UI trong admin/KOL | Sai kỳ vọng | `AdminDashboardScreen`, `KOLPartnerDashboard` | Feature flag / build variant | S–M |
| P1 | Voice receptionist marketed as real | Sai kỳ vọng | `VoiceReceptionistService` | Copy “Beta/Mock” hoặc ẩn | S |
| P2 | Hardcoded colors | Brand drift | Screens | Tokenize | M |

---

## 18. What To Freeze / Keep / Rebuild / Delete

### Freeze
- Thứ tự middleware `app.ts` (Stripe raw → JSON → rate limit).
- Envelope `jsonOk`/`jsonFail`.
- Prisma schema cốt lõi booking/wallet (trừ khi migration có kế hoạch).

### Keep
- Express routing layout + auth middleware pattern.
- Stripe webhook verification approach.
- Tab/role navigation shell (`MainTabNavigator`).
- Prisma models cho booking/tourism/broker (là tài sản dài hạn).

### Rebuild
- **Nhẹ:** Tách rõ package hoặc alias `@server/*` vs `@client/*` (**đề xuất**, không bắt buộc rebuild app).
- **Lớn:** Marketing omni admin — nên thiết kế lại sau khi có CRM thật.

### Delete or Hide (MVP)
- Ẩn: KOL mock metrics, omni mock switches, B2B Leona mock engine khỏi build store hoặc đặt sau `__DEV__` / feature flag.
- Không xóa file trong audit này — chỉ **khuyến nghị ẩn**.

---

## 19. Next 10 Cursor Tasks

1. **Goal:** Khóa danh sách màn MVP path A. **Scope:** Doc-only trong `docs/` hoặc comment ADR. **Files:** `docs/ai-context/CURRENT_STATE.md`. **AC:** 1 path được team chốt. **Do not touch:** `app.ts`.
2. **Goal:** Audit ownership `Business`/`Booking` queries. **Scope:** Đọc controllers. **Files:** `BookingController`, `BusinessController`, `TourismController`. **AC:** Bảng endpoint nguy cơ. **Do not touch:** schema.
3. **Goal:** Feature flag `HIDE_DEMO_SCREENS`. **Scope:** Config + wrap admin/KOL. **Files:** `launchPilot` hoặc `config/env`. **AC:** Build prod ẩn demo. **Do not touch:** webhook.
4. **Goal:** Document env production. **Scope:** Bảng env không giá trị. **Files:** `.env.example`. **AC:** Đủ cho staging. **Do not touch:** secrets.
5. **Goal:** Staging test script booking+QR. **Scope:** `scripts/` hoặc manual runbook. **Files:** new md in `docs/`. **AC:** Steps reproducible. **Do not touch:** Prisma data prod.
6. **Goal:** Legal scan: đổi label “mock” trong API response hoặc tắt debit. **Scope:** Product decision trước code. **Files:** `AIController`. **AC:** Không mâu thuẫn billing. **Do not touch:** unrelated routes.
7. **Goal:** Client `EXPO_PUBLIC_BACKEND_API_BASE` validation. **Scope:** startup warning nếu thiếu. **Files:** `apiClient` hoặc App mount. **AC:** Dev-friendly message. **Do not touch:** server.
8. **Goal:** Broker escrow flow diagram. **Scope:** Doc. **Files:** `docs/audit/` supplement. **AC:** Sequence webhook→escrow. **Do not touch:** code.
9. **Goal:** GDPR wipe vs refresh sessions review. **Scope:** Doc issue list. **Files:** reference `UserService`, schema. **AC:** P0/P1 list. **Do not touch:** DB.
10. **Goal:** Rename planning ViGlobal→VIONA. **Scope:** Content spreadsheet / doc — **không đổi code** cho đến khi brand approved. **Files:** brand checklist md. **AC:** Impact scope. **Do not touch:** `app.config` until approved.

---

## 20. Final Blunt Recommendation

- **Tiếp tục hướng hiện tại** (Expo + Express + Prisma) — **đừng** pivot sang “mini-app platform” kiểu micro-frontend cho đến khi có người dùng trả phí; **đơn giản hóa MVP** trong monolith hiện tại.
- **Build trước:** **Đặt chỗ + ví + QR completion** cho một vertical (Local merchant) thay vì AI receptionist hay broker đầy đủ.
- **Đổi brand sang VIONA trong code:** **Chưa** cho đến khi có quyết định pháp lý/sở hữu thương hiệu và chiến lược App Store — nhưng **nên** lên kế hoạch chuỗi + asset trước.
- **Payment/AI:** **Payment trước** (trust), AI **sau** — legal scan phải trung thực về chất lượng hoặc không thu phí.
- **Việc quan trọng nhất tiếp theo:** **Một** staging environment + **một** luồng E2E “login → book → QR complete → wallet đúng” — không thêm feature cho đến khi luồng này xanh.

---

## Phụ lục — Kiểm tra read-only

- **`npm run typecheck`:** **Pass** (exit code 0) tại thời điểm audit.
- **`git diff --name-only`:** Working tree **đã có** thay đổi khác (ví dụ `package.json`, `src/controllers/AuthController.ts`, …) **trước** khi tạo file audit này — **không phải** chỉ file audit. Sau khi chỉ thêm `docs/audit/VIONA_CODEBASE_AUDIT.md`, chạy lại `git status` để xác nhận file mới `?? docs/audit/` hoặc tracked.

---

*Tài liệu sinh bởi audit đọc code; không thay thế review pháp lý, kế toán, hay pentest.*
