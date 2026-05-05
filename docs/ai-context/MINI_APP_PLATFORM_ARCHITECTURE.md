# VIONA Mini-App Platform Architecture

> **Nguồn chân lý kỹ thuật:** repo hiện tại (Expo + Express + Prisma). Tài liệu này là **định hướng kiến trúc** — không thay thế `ARCHITECTURE.md` chi tiết từng file.

---

## 1. Core Decision

VIONA là **Global Vietnamese Network** cho người Việt ở nước ngoài. **Vision dài hạn** vẫn là **super app** (nhiều dịch vụ trên một identity và một ví dữ liệu tin cậy).

**Quyết định triển khai:** VIONA **không** cố ship “toàn bộ super app một lần” trong một binary/logic khối không phân ranh giới. Thay vào đó, **triển khai như một mini-app platform**: một **core OS** + **shared business core** + các **mini-app** được đăng ký, bật/tắt theo phase và **feature flags**.

**Không rebuild toàn bộ:** Giữ nguyên Expo app và Express API; tiến hoá dần qua **registry**, **flags**, và **thống nhất shell**.

---

## 2. Why Mini-App Platform

| Lý do | Giải thích ngắn |
|-------|-----------------|
| **Không phá blueprint** | Vision Hub / Local / Travel / Academy / Merchant / Broker / AI **giữ nguyên trong roadmap**; chỉ **ưu tiên thứ tự** và **đóng băng** phần chưa harden. |
| **Ship được MVP** | MVP = **Hub + Local + Booking** (theo brief). Mini-app model cho phép **ẩn hoặc đánh dấu “coming soon”** phần còn lại thay vì xóa code. |
| **Dễ mở rộng** | Mini-app mới = thêm **registry entry + routes + flags**, không cần rewrite OS. |
| **Giảm rủi ro overbuilding** | Phần demo/mock được **gắn cờ frozen/beta** — không đứng cùng “production” trong UX. |
| **Dễ bật/tắt theo market** | Bật Travel/Academy khi có retention và tuân thủ; tắt broker đầy đủ khi chưa có kế toán sẵn sàng. |

---

## 3. Architecture Layers

### Layer 1 — VIONA Core OS

Shell + identity + điều hướng + auth + i18n + observability + API client + flags + design tokens **dùng chung mọi mini-app**.

### Layer 2 — Shared Business Core

Domain và API **một lần**: User/Profile, Merchant/Business, Service, Booking, location/discovery, QR/manual settlement hooks, broker attribution cơ bản, ví (nếu MVP cần).

### Layer 3 — Mini-Apps

**Hub**, **Local**, **Booking**, **Travel**, **Academy**, **Merchant**, **Broker**, **AI**… là **lớp trình bày + luồng UX + permission** trên core — không duplicate backend ledger nếu không cần.

**Liên hệ repo hiện tại:** Expo screens + tab navigator ≈ **shell**; `src/routes/*.ts` ≈ **API theo domain**; Prisma models ≈ **shared business core**. Mini-app “registry” là **lớp siêu dữ liệu + convention** chưa nhất thiết là runtime plugin engine.

---

## 4. VIONA Core OS

| Trách nhiệm | Ghi chú (mapping repo — **Chưa xác định** chi tiết từng file nếu chưa rà soát) |
|-------------|----------------------------------------------------------------------------------|
| **Brand config** | Tên hiển thị, theme tokens, splash — hiện có `app.config.js`, `theme/`; rebrand VIONA **theo phase**, không global replace bừa. |
| **App shell** | Root navigator, tab bar theo role — `MainTabNavigator`, `AuthPaywallModal`. |
| **Navigation** | Stack + tabs; deep link scheme `ketnoiglobal` — có thể mở rộng prefix theo mini-app. |
| **Auth** | JWT + login/OTP — `authRoutes`, `authMiddleware`. |
| **Roles** | B2C / B2B / Broker / Admin — `Role` Prisma + `userStore` active role. |
| **i18n** | `i18next` / `strings` — shared. |
| **SOS Lifeline** | Hold-to-trigger, modal — `SOSShieldComponent`, `SOSModal`; **Chưa xác định** toàn bộ route SOS backend. |
| **Feature flags** | Remote hoặc env — **cần chuẩn hoá** một module `featureFlags` (hiện có mảnh `launchPilot`, demo sandbox). |
| **Shared UI** | Components, `theme`, `applyWebStyles`. |
| **Shared API client** | `apiClient`, `EXPO_PUBLIC_BACKEND_API_BASE`, `restAuthClient`. |
| **Logging / error handling** | Client: Sentry/telemetry — **Chưa xác định** độ phủ; Server: Pino + `jsonFail`. |

---

## 5. Shared Business Core

Domain **dùng chung** (khớp hướng Prisma / API hiện có):

| Domain | Vai trò |
|--------|---------|
| **Users** | `User`, auth, persona, GDPR hooks |
| **Profiles** | `Profile` |
| **Merchants** | `Business`, owner, broker link, VietQR fields |
| **Services** | `Service`, `TourismService` (travel là consumer khác của core — có thể flag) |
| **Bookings** | `Booking`, `TourismBooking` |
| **Locations** | Geo trên `Business`, discovery APIs |
| **Reviews** | **Chưa xác định** model tập trung — có thể phase sau |
| **QR / manual payment status** | Booking completion QR hash; pay routes |
| **Broker attribution basic** | `Business.brokerId`, broker routes — **full commission engine** = frozen |

---

## 6. Mini-App Contract

Mỗi mini-app **nên** được mô tả bằng một record (TypeScript type hoặc JSON registry — **triển khai sau**):

| Field | Ý nghĩa |
|-------|---------|
| **id** | Slug ổn định: `hub`, `local`, `booking`, … |
| **name** | Tên hiển thị |
| **status** | `active` \| `beta` \| `coming_soon` \| `frozen` |
| **route** | Prefix tab/stack hoặc map tới `routes.ts` |
| **requiredRole** | `B2C` \| `B2B` \| `BROKER` \| `ADMIN` \| `*` |
| **featureFlag** | Key cờ (ví dụ `MINI_APP_TRAVEL_ENABLED`) |
| **screens** | Danh sách màn chính (reference path) |
| **permissions** | Camera, location, mic — cho OS permission prompts |
| **data dependencies** | Models/API cần: ví dụ Booking → `Booking`, `Wallet` |

---

## 7. Mini-App Registry (đề xuất)

| id | name | status | Ghi chú |
|----|------|--------|---------|
| **hub** | Hub (LifeOS / Home) | **active** | Trục điều hướng & giá trị chính MVP |
| **local** | Local | **active** | Discovery + feed địa phương — MVP |
| **booking** | Booking | **active** | Đặt chỗ + QR completion — MVP |
| **merchant** | Merchant Dashboard | **beta** | Bật pilot; ownership checks bắt buộc |
| **broker** | Broker QR | **beta** / **frozen** tùy env | Core attribution có; **full engine** frozen |
| **travel** | Travel | **coming_soon** | Giữ code; không marketing như production đầy đủ |
| **academy** | Academy | **coming_soon** | Kids/adult learning — sau MVP |
| **ai_receptionist** | AI Receptionist | **frozen** | Voice/WebRTC sketch — không bán như prod |

**Chú thích:** `beta` = có trong build nhưng chỉ pilot / nhãn Beta; `frozen` = không hiển thị hoặc chỉ internal/`__DEV__`.

---

## 8. MVP Mini-Apps

Theo brief MVP **chỉ bật**:

- **Hub**
- **Local**
- **Booking**
- **Merchant Dashboard basic** (đặt lịch, QR, không cần full ads/payroll/token)

Mọi mini-app khác: **registry = coming_soon hoặc frozen** + **feature flag = off** trong production build.

---

## 9. Frozen Mini-Apps / Flows

Đóng băng khỏi **trải nghiệm production** (cho đến khi có phase riêng):

| Mục | Lý do ngắn |
|-----|----------------|
| **AI Receptionist production** | Kiến trúc mock/sketch — chưa realtime bridge |
| **Travel full system** | scope lớn; có phần demo |
| **Academy** | không cốt lõi MVP Hub/Local/Booking |
| **Legal Scan paid flow** | debit VIG xảy ra trong khi logic scan có thể mock — cần redesign trước khi thu phí |
| **Payroll** | Implementation mock maps |
| **Token economy** | mở rộng sau khi booking + ví ổn |
| **Broker commission full engine** | rủi ro kế toán; giữ basic attribution nếu cần pilot |

---

## 10. Feature Flag Strategy

**Mục tiêu:** Không để mock/demo lọt vào build production như tính năng hoàn chỉnh.

1. **Phân lớp cờ:** `ENV` (dev/staging/prod), `EXPO_PUBLIC_*` chỉ cho cờ an toàn client, **remote config** sau này (Firebase/EAS) — **Chưa xác định** dịch vụ cụ thể.
2. **Cờ theo mini-app:** `MINI_APP_<ID>_ENABLED` — default off ngoài Hub/Local/Booking/Merchant-basic.
3. **Cờ demo:** `DEMO_MODE` hoặc `SHOW_ADMIN_MOCK` — chỉ true trong dev/staging.
4. **Build profiles:** EAS profile `production` set cờ tắt toàn bộ demo — **cần implement** trong pipeline.
5. **UX:** Màn frozen không trong tab; hoặc một màn “Sắp ra mắt” thống nhất thay vì nút dẫn vào mock.

---

## 11. Routing Strategy (Expo hiện tại)

**Giữ** React Navigation stack + bottom tabs theo role (`MainTabNavigator`).

**Đề xuất:**

- **Không** nhét tất cả screen vào một stack phẳng — nhóm theo mini-app trong **param list** hoặc **nested navigator** khi refactor nhẹ (phase sau).
- **Deep link:** `viona://mini/local/...` — **Chưa xác định** schema cuối; có thể map dần từ `scheme` hiện có.
- **Tab visibility:** Drive từ **mini-app registry + role + flag** thay vì if rải rác (mục tiêu phase 3–4).

---

## 12. Backend Module Strategy (Express + Prisma)

Giữ **router theo domain** (đã có), đặt tên module **logic** cho team:

| Module | Routes hiện có (tham chiếu) |
|--------|-----------------------------|
| **auth** | `/api/auth` |
| **users** | `/api/users` |
| **merchants** | `/api/business`, merchant pay |
| **bookings** | `/api/bookings` |
| **payments / manual** | `/api/pay`, Stripe webhook |
| **broker/basic** | `/api/broker` — pilot only |
| **admin/minimal** | `/api/admin` — flag + role ADMIN |

**Nguyên tắc:** Mini-app chỉ **gọi** module shared; không fork ledger.

---

## 13. Data Ownership & Tenant Isolation

1. **User** chỉ đọc/ghi dữ liệu **gắn `userId` của chính họ** (wallet, booking as booker, profile).
2. **Merchant** chỉ thấy **business của mình** (`ownerId`) và booking gắn `businessId` đó — **mọi endpoint có `businessId` phải verify ownership**.
3. **Broker** chỉ thấy merchant/referral **gắn `brokerId` của họ**.
4. **Admin** thấy tổng — qua role `ADMIN` + middleware.
5. **Không** tin client gửi `ownerId`/`merchantId` thô — luôn resolve từ JWT + DB.

---

## 14. What Not To Do

- **Không rebuild** toàn bộ stack hoặc đổi ORM/framework trong phase định hướng này.
- **Không** làm plugin loader động (download mini-app) **ngay** — không cần cho MVP.
- **Không** bật AI / payment / token mock như production.
- **Không** global replace brand ViGlobal → VIONA **một lần** khi chưa có checklist pháp lý và asset.
- **Không** thêm feature ngoài **Hub + Local + Booking + Merchant basic** cho đến khi foundation cờ + registry xong.

---

## 15. Migration Plan (từ code hiện tại)

| Phase | Nội dung |
|-------|----------|
| **1 — Docs + feature flags** | Chuẩn hoá tài liệu (file này), thêm module flags + default prod off cho frozen |
| **2 — Brand config** | Tách token brand; chuẩn bị VIONA song song ViGlobal — đổi display theo phase |
| **3 — Registry** | Implement `miniApps.ts` (hoặc tương đương) — đăng ký id, route, flag, status |
| **4 — Hub / Local / Booking alignment** | Tab + stack chỉ expose các mini-app MVP; ẩn frozen |
| **5 — Merchant pilot** | Merchant basic + ownership audit endpoints |
| **6 — Mở mini-app mới** | Travel / Academy / Broker full — từng flag + QA |

---

## 16. Acceptance Criteria — “Mini-app platform foundation”

Foundation được coi là **đạt** khi:

- [ ] **Feature flags** cho mini-app và demo path — có nguồn sự thật đơn (config/env).
- [ ] **Brand config** — theme + app name có thể đổi mà không săn chuỗi trong 100 file (**Chưa xác định** mức độ hoàn thành ban đầu).
- [ ] **Mini-app registry** — một file hoặc module đơn là SSOT cho id/status/route/flag.
- [ ] **App shell** — một navigator shell dùng chung cho Hub/Local/Booking (đã gần có; cần align registry).
- [ ] **Hub / Local / Booking** đi qua shell và không require frozen mini-apps để dùng.
- [ ] **Frozen features** không xuất hiện như production (không tab, không CTA “hoàn tất” giả).
- [ ] **`npm run typecheck`** pass (đã có trong CI expectation).

---

*Tài liệu này là đầu ra định hướng — implementation thực hiện trong các task/code phase sau.*
