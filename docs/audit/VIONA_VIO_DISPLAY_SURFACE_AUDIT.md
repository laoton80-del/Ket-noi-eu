# VIONA VIO Display Surface Audit

**Vai trò:** Senior Product Safety Auditor (read-only).  
**Mục tiêu:** Rà soát UI/copy/label **public** liên quan VIG/VIO/token/wallet/loyalty/rewards để chuẩn bị đổi **public display** sang **VIO** an toàn; **không** global replace internal/DB.

**Tài liệu đã đọc:** `docs/ai-context/VIONA_MONETIZATION_ZERO_LOSS_ENGINE.md` (§10 VIO policy), `docs/audit/VIONA_FEATURE_GATE_ENTRYPOINT_AUDIT.md`, `docs/audit/VIONA_RESIDUAL_SURFACE_AUDIT.md` (nếu có — **Chưa xác định** nội dung chi tiết từng dòng trong phiên audit này), `src/core/monetization/vioDisplayConfig.ts`.  
**`docs/ai-context/VIONA_FINAL_MASTER_BLUEPRINT`:** **Không tìm thấy** file tương ứng trong repo — ghi **Chưa xác định**.

**Phương pháp:** `rg`/đọc cục bộ `src/screens`, `src/components`, `src/i18n/strings.ts`, services có string lỗi user-facing — **không** sửa code trong task này.

---

## 1. Executive Summary

| Câu hỏi | Kết luận ngắn |
|---------|----------------|
| **Có bao nhiêu chỗ public UI còn “VIG”?** | **Ước ~45–70+** chỗ user-facing (chuỗi hardcoded + `i18n/strings.ts` khối wallet) trải **~20+** file màn hình/component chính; số chính xác tùy định nghĩa “public” (có **Chưa xác định** nếu tính cả admin-only). |
| **Chỗ nào nguy hiểm nhất (user tưởng tiền thật)?** | **WalletTopUpScreen** + **`i18n/strings.ts` (wallet)** (nạp, số dư, “đã trả tiền”, P2P chuyển token); **Broker** mock commission + nhãn kiểu rút/payout; **LoyaltyRewardsScreen** (quy tắc 1 EUR → VIG + đổi quà); **CashOutScreen** (copy ví/xu). |
| **Chỗ nào internal legacy — không nên sửa ngay?** | **API/Prisma/controller** (`amountVIG`, `balanceVIG`, `totalPaidVIG`, `TxType`, v.v.), service layer tên field, comment nội bộ — đổi display trước, schema/API sau có kế hoạch. |
| **Nên sửa code theo hướng nào?** | **Một nguồn public copy:** đọc `vioDisplayConfig` (+ i18n keys) cho **VIO Points / VIO Credits**; giữ **VIG** trong payload/DB; thêm **disclaimer** “không phải tiền mặt / không crypto / không rút bank” nơi có nạp Stripe hoặc broker payout; **gate** copy loyalty/wallet khi `vigTokenEconomyEnabled === false` (đã có hướng P0-3C). |

---

## 2. Public Display Findings

Bảng đại diện (không liệt kê từng dòng `i18n` — xem §2b).

| File | Screen/Area | Current Text / Meaning | Risk | Recommended Display | Recommended Action |
|------|----------------|------------------------|------|----------------------|---------------------|
| `src/screens/HomeScreen.tsx` | Home header pill | `"{credits} VIG Token"` + “Your Safe Travel Money” (tourist) | **Cao** — trộn “token” với “travel money” | **VIO Credits** (usage) + câu không gợi ý fiat | `replace_display_only` + `add_disclaimer` |
| `src/screens/HomeScreen.tsx` | Action widget | “VIG Rate”, a11y “VIG Rate” | Trung — user tưởng tỷ giá tiền | **VIO Points index** hoặc ẩn khi flag off | `hide_if_feature_disabled` + `use_vioDisplayConfig` |
| `src/screens/b2c/DashboardB2CScreen.tsx` | VIP badge | `VIG: {n} Token`, a11y “ViGlobal Rewards VIG Token…” | Cao — brand ViGlobal + VIG | **VIO Points** + VIONA Rewards | `replace_display_only` + `use_vioDisplayConfig` |
| `src/screens/b2c/DashboardB2CScreen.tsx` | Hub subcopy | “VIG wallet for your trip” | Cao | “VIO wallet (in-app)” hoặc “VIO Credits” | `replace_display_only` + `add_disclaimer` |
| `src/screens/WalletTopUpScreen.tsx` | Toàn màn | Hardcoded “VIG Token” (P2P, shop ảo, alert, placeholder) | **Rất cao** — thanh toán / chuyển token | **VIO Credits** + disclaimer closed-loop | `use_vioDisplayConfig` + `add_disclaimer` |
| `src/i18n/strings.ts` | Wallet / prepaid | Khối lớn “VIG Token”, gói nạp, lỗi “đã trả tiền” | **Rất cao** | **VIO Points / VIO Credits** theo ngữ cảnh | `replace_display_only` (i18n) + `use_vioDisplayConfig` helper cho format |
| `src/screens/b2c/LoyaltyRewardsScreen.tsx` | Title, chip, tier | “VIG Token · Đổi quà”, “1 EUR = 10 VIG Token” | **Cao** — gợn ý quy đổi fiat | **VIO Points** + chính sách earn (legal review) | `replace_display_only` + `needs_manual_review` (compliance) |
| `src/screens/b2c/LoyaltyRewardsScreen.tsx` | Alert redeem | “(demo)” có nhưng vẫn “VIG Token” | Trung | Giữ demo label + **VIO Points** | `replace_display_only` |
| `src/screens/b2c/LocalScreen.tsx` | Classifieds | “{credits} VIG”, VIP “+120 VIG Token”, legal scan “… VIG” | Cao (scan đã audit P0) | **VIO Credits** cho spend; scan copy **gate** | `replace_display_only` + `hide_if_feature_disabled` (scan) |
| `src/screens/b2c/ViralWrapScreen.tsx` | Travel vanity | “VIG on this trip”, format `… VIG` | Trung | **VIO Points spent** (hoặc demo) | `replace_display_only` + `needs_manual_review` |
| `src/screens/HocTapScreen.tsx` | Academy | Unlock “VIG Token”, badge balance | Cao | **VIO Credits** | `replace_display_only` |
| `src/screens/b2c/academy/VietKidsScreen.tsx` | Reward toast | “+N VIG Token cho phụ huynh” | Trung | **VIO Points** | `replace_display_only` |
| `src/screens/academy/LiveAiTeacherScreen.tsx` | Footer | “trừ VIG Token” | Trung | **VIO Credits** | `replace_display_only` |
| `src/components/ProfileSwitcher.tsx` | Broker/Merchant blurb | “earn VIG”, “paid in one wallet” | **Cao** — payout implication | **VIO** + “settled per policy” | `replace_display_only` + `add_disclaimer` |
| `src/screens/broker/BrokerDashboardScreen.tsx` | Hero | Mock “VIG”, “Withdraw to wallet” | **Rất cao** (dù mock) | **VIO** + “Demo / not a bank payout” | `add_disclaimer` + `hide_if_feature_disabled` |
| `src/screens/broker/BrokerCommissionsTabScreen.tsx` | List | “VIG credited…”, mock lines | Cao | **VIO Points** + demo | `replace_display_only` + broker flag |
| `src/screens/b2b/B2BPaywallScreen.tsx` | Copy | “VIG top-up”, “VIG Token top-up” | Cao | **VIO Credits** top-up | `replace_display_only` |
| `src/screens/b2b/MerchantDashboardScreen.tsx` | KPI | `formatVigTokenNumber` → “vig” label i18n | Trung–cao | Doanh thu **EUR** + điểm tách biệt | `needs_manual_review` |
| `src/screens/merchant/MerchantVnDashboardScreen.tsx` | Ledger | “Spendable VIG”, “+N VIG” | Cao | **VIO Credits** (merchant spendable) | `replace_display_only` |
| `src/screens/LifeOSDashboard.tsx` | Chip | “VIG Token”, tagline tốn token | Trung | **VIO Credits** | `replace_display_only` |
| `src/screens/CashOutScreen.tsx` | Explainer | “VIG / Xu ví nạp mua”, cash-out rules | **Cao** — pháp lý ví | Rõ **không phải bank** + VIO naming | `add_disclaimer` + `needs_manual_review` |
| `src/screens/b2c/VietnamHubScreen.tsx` | Price | `formatVigTokenNumber(priceVIG)` | Trung | Hiển thị **EUR** + optional VIO | `needs_manual_review` |
| `src/components/academy/CertificateGenerator.tsx` | Certificate | “VIG Token” | Thấp (ảnh/export) | **VIO Points** | `replace_display_only` |
| `src/components/ui/VigTokenIcon.tsx` | Component | Comment “VIG Token mark” | Thấp (dev) | Đổi tên component **Chưa xác định** timeline | `do_not_touch_internal` (đổi sau; hoặc alias icon) |
| `src/screens/admin/AdminDashboardScreen.tsx` | KPI | “… VIG” tourism | Thấp (admin) | Có thể giữ **VIG** nội bộ hoặc song song | `do_not_touch_internal` **hoặc** `needs_manual_review` |

### §2b — `i18n/strings.ts` (wallet / prepaid)

Toàn bộ nhánh `wallet` / prepaid tiếng Việt dùng **“VIG Token”** dày đặc (gói 100/230/650, số dư, pending verify, lỗi backend). **Recommended action:** một pass i18n keyed theo `vioDisplayConfig.publicName` / `publicCreditName` — **replace_display_only** + **add_disclaimer** cho dòng liên quan Stripe / “đã trả tiền”.

---

## 3. Internal Legacy Findings

| File / area | Internal usage | Why not global replace yet | Notes |
|-------------|----------------|----------------------------|-------|
| Prisma schema / DB columns | `balanceVIG`, `amountVIG`, `totalPaidVIG`, … | Migration + backfill + API contract | **do_not_touch_internal** trong phase display-only |
| `src/controllers/AIController.ts`, `WalletController.ts`, … | `chargedVIG`, `amountVIG` | Server truth | Display layer only |
| `src/services/viGlobalWalletApi.ts`, `paymentApi.ts`, `BrokerService.ts` | Field names `*VIG` | Clients/SDK consumers | Rename = breaking |
| `src/navigation/routes.ts` | Comments “VIG wallet” | Docs in code | Optional later |
| `src/domain/legalScanPricing.ts` | `BASE_VIG` | Pricing unit tied to debit | Đổi label UI trước; đơn vị nội bộ sau |
| `src/state/wallet`, `reserveAndCommitCredits` | `credits` = internal balance | Mapping số học | **do_not_touch_internal** until product defines VIO vs credit split |

---

## 4. Wallet / Top-up Surface

**Files:** `WalletTopUpScreen.tsx` (và `WalletScreen.tsx` re-export), `GlobalWalletScreen.tsx` (**Chưa xác định** chi tiết từng string — nên grep bổ sung khi implement), `i18n/strings.ts`.

**Quan sát:**

- Balance label dùng i18n `balanceCreditsDisplay` → **“{credits} VIG Token”** — rất dễ hiểu là **tiền trong ví**.
- P2P “Chuyển VIG Token”, Stripe portal “nạp VIG / SaaS” — **payment-like** + **closed-loop** cần nhất quán với `vioDisplayConfig.isWithdrawableCash: false`.
- Virtual goods (avatar frame, passport badge) priced in **VIG Token** — nên hiển thị **VIO Credits** và làm rõ **in-app only**.

**Khuyến nghị:** Thêm đoạn disclaimer ngắn (footer hoặc sheet lần đầu) — **add_disclaimer**; map string qua `vioDisplayConfig` — **use_vioDisplayConfig**.

---

## 5. Loyalty / Rewards Surface

**File:** `LoyaltyRewardsScreen.tsx`, catalog `config/loyaltyRewardsCatalog` (**Chưa xác định** từng dòng catalog trong audit này).

- Title **“VIG Token · Đổi quà”**, chip **VIG TOKEN**, rule **1 EUR = 10 VIG Token** — rủi ro **niềm tin + compliance** (coi như loyalty earn rate, không phải FX hối đoái — cần legal).
- `simulateSpend` / `onRedeem` có **“(demo)”** — tốt nhưng vẫn cần **VIO** + **gate** khi `vigTokenEconomyEnabled === false`.

**Recommended action:** `replace_display_only` + `hide_if_feature_disabled` + `needs_manual_review` (earn rule copy).

---

## 6. Broker / Commission Surface

**Files:** `BrokerDashboardScreen.tsx`, `BrokerCommissionsTabScreen.tsx`, `ProfileSwitcher.tsx`.

- Mock số lớn + chữ **“Withdraw to wallet”** / **“VIG credited when tourists settle”** — dễ hiểu **payout tiền thật** dù là demo.
- Khi `brokerQrEnabled === false`, vẫn **Chưa xác định** toàn bộ entry có bị ẩn hay không — cần kiểm tra navigation theo role.

**Recommended action:** `add_disclaimer` (“Demo / not a cash payout”) + `hide_if_feature_disabled` + đổi **VIO Points** cho commission display.

---

## 7. AI / Legal Scan / Paid AI Surface

**Đã có trong `VIONA_FEATURE_GATE_ENTRYPOINT_AUDIT.md`:** Legal scan **mock AI + debit VIG thật** — **P0** an toàn sản phẩm.

**UI liên quan:** `LocalScreen` (chi phí ước tính “VIG”), preview/alert copy.

**Recommended action:** **hide_if_feature_disabled** (`legalScanEnabled`) cho nút scan; đổi label chi phí sang **VIO Credits** khi bật lại sau production LLM.

**Khác:** `HocTapScreen`, `LiveAiTeacherScreen`, `VietKidsScreen` — trừ token / overage: **replace_display_only** → **VIO Credits**.

---

## 8. Proposed Code Change Plan

| Priority | Change | Files likely involved | Acceptance Criteria |
|----------|--------|----------------------|---------------------|
| **P0** | Đổi mọi **user-visible** “VIG Token” trên Hub/Home/Dashboard/Wallet/Loyalty sang **VIO** qua helper | `HomeScreen.tsx`, `DashboardB2CScreen.tsx`, `WalletTopUpScreen.tsx`, `LoyaltyRewardsScreen.tsx`, `LocalScreen.tsx` (dòng UI), `HocTapScreen.tsx` | Không còn chữ **VIG** trên happy-path B2C chính (trừ disclaimer footnote nếu cố ý) |
| **P0** | Sync **`i18n/strings.ts`** wallet keys với `vioDisplayConfig` | `strings.ts`, thin helper `formatVioBalance()` | Typecheck; snapshot hoặc QA string list |
| **P0** | **Disclaimer** closed-loop (không crypto / không rút bank) trên Wallet + Cash-out explainer | `WalletTopUpScreen.tsx`, `CashOutScreen.tsx` | Legal skim; không claim “tiền thật” |
| **P0** | Broker mock: nhãn **Demo** + không “Withdraw” kiểu bank | `BrokerDashboardScreen.tsx`, `BrokerCommissionsTabScreen.tsx` | User test broker role |
| **P1** | ProfileSwitcher + B2B paywall + Merchant KPI labels | `ProfileSwitcher.tsx`, `B2BPaywallScreen.tsx`, `MerchantDashboardScreen.tsx`, `MerchantVnDashboardScreen.tsx` | Nhất quán VIONA + VIO |
| **P1** | Travel/academy vanity (`ViralWrapScreen`, certificates) | `ViralWrapScreen.tsx`, `CertificateGenerator.tsx` | Không conflict brand |
| **P2** | Admin KPI — giữ VIG nội bộ hoặc song song | `AdminDashboardScreen.tsx` | Ops hiểu mapping |
| **P2** | Đổi tên `VigTokenIcon` / asset | `VigTokenIcon.tsx` | Design token; không block P0 nếu chỉ đổi label wrapper |

---

## 9. Final Recommendation

| Câu hỏi | Trả lời |
|---------|---------|
| **Có nên làm VIO display code task ngay?** | **Có (P0)** — public vẫn lẫn **ViGlobal / VIG / “travel money”**; cần pass display-only trước khi marketing rộng. |
| **File nào sửa trước?** | **`src/i18n/strings.ts` (wallet)** + **`WalletTopUpScreen.tsx`** + **`LoyaltyRewardsScreen.tsx`** + **`HomeScreen.tsx`** + **`DashboardB2CScreen.tsx`**. |
| **File nào không đụng (legacy)?** | **Prisma / controllers / `*VIG` API fields** — **do_not_touch_internal** đến khi có migration naming plan. |
| **Có nên dùng `vioDisplayConfig` trong UI?** | **Có** — một nguồn cho `publicName` / `publicCreditName` / `legacyCode` / flags `isCrypto` / `isWithdrawableCash` để disclaimer và formatter nhất quán. |

---

## 10. Deliverables (theo yêu cầu sau khi tạo file)

### 10.1 Top 10 public display risks

1. Wallet + i18n: “VIG Token” + copy thanh toán / “đã trả tiền” → tưởng **tiền pháp định**.  
2. Home tourist: “VIG Token” + “Your Safe Travel Money” → **trộn token với tiền du lịch**.  
3. Loyalty: **1 EUR = 10 VIG Token** → rủi ro hiểu nhầm **FX / đầu tư**.  
4. Broker mock: **Withdraw** + số lớn → tưởng **payout bank**.  
5. P2P chuyển “VIG Token” → tưởng **chuyển khoản**.  
6. B2B paywall: “VIG Token top-up” / enforcement → **B2B tin là tiền**.  
7. Local legal scan: chi phí **VIG** + flow mock (audit P0).  
8. `ProfileSwitcher`: “earn VIG” / “paid in one wallet”.  
9. Academy (`HocTapScreen`, kids): unlock & overage **VIG Token**.  
10. `CashOutScreen`: “VIG / Xu ví” — cần **pháp lý** rõ closed-loop.

### 10.2 P0 display changes (tóm tắt)

- Thay **VIG → VIO Points / VIO Credits** (đúng ngữ cảnh) trên **Home, Dashboard VIP, Wallet UI + i18n wallet, Loyalty header/body, Local classifieds hint, HocTap/VietKids/LiveAiTeacher**.  
- Thêm **disclaimer** closed-loop trên Wallet / Cash-out.  
- Broker mock: **Demo** + bỏ ngôn ngữ rút tiền kiểu bank hoặc gate theo `brokerQrEnabled`.

### 10.3 Next code task (một dòng)

**Tạo helper `formatVioPublicBalance` + wire `vioDisplayConfig` vào `i18n/strings.ts` (wallet) và năm màn P0 (`HomeScreen`, `DashboardB2CScreen`, `WalletTopUpScreen`, `LoyaltyRewardsScreen`, `LocalScreen` UI strings) — không đổi schema/API.**

---

**Xác nhận:** Không sửa code app trong task audit này; không migration / không git.
