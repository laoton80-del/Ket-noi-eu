# VIONA Global Commercialization Readiness Audit

**Audit date:** 2026-05-06  
**Scope:** Read-only review of repo state, docs/ai-context, navigation/core/config/screens/services, Prisma header, scripts surface; **no code changes** in this audit.  
**Evidence snapshot:** `git status`, `git log -20`, `npm run typecheck`, `npm run lint`, `npm run`, targeted `rg`/reads; aligns with `docs/ai-context/VIONA_FINAL_MASTER_BLUEPRINT_V2.md` and linked audits under `docs/audit/`.

---

## 1. Executive Summary

| Question | Answer |
|----------|--------|
| **VIONA đang ở mức nào?** | **Super App Lite / demo-adjacent prototype** — nền tảng product-heavy (Expo + API + Prisma), nhiều màn demo/pilot có nhãn, blueprint V2 và mini-app registry **đã bắt đầu** trong code; **chưa** production-ready toàn cầu. |
| **Còn đúng hướng Global Vietnamese Companion OS?** | **Có, về kiến trúc ý định** (docs V2, SOS/VIO copy trong `app.config.js`, travel multi-hướng trong registry). **Rủi ro lệch:** UI/services vẫn nhiều legacy **ViGlobal / KNG / VIG Token** và travel copy **“KNG Travel”** — dễ bị nhận diện như travel/booking app thay vì Companion OS. |
| **Lệch booking / AI demo / travel?** | **Có dấu hiệu lệch** ở bề mặt (grep: `KNG Travel`, `VIG Token`, ViGlobal trong marketing/wallet/interpreter). Song song có **điều chỉnh brand** (commits `feat(brand):`, VIONA assets) — **đang giữa chừng**. |
| **Demo merchant/user thật?** | **Internal / controlled demo: khả thi** nếu chọn flow đã gate + nhãn Pilot/Demo (AI Receptionist simulator, checklist). **Merchant pilot trả tiền:** **chưa** khuyến nghị cho đến khi payment/ledger/ops pass commercial gate (Needs confirmation theo env triển khai). |
| **Beta thị trường quốc tế?** | **Chưa** — i18n Smart Trio chưa đủ rộng; legacy EN/CZ-centric copy và brand remnant; **Needs confirmation** cho store policy từng quốc gia. |
| **Commercial launch toàn cầu?** | **Không** — thiếu wiring CTA/registry, đồng nhất VIO vs VIG public, cost firewall/metering chứng minh E2E, và broker/payment guardrails chứng minh bằng smoke/preflight trên môi trường production-like. |
| **Recommendation (A–E)** | **C — Need architecture/registry/gate foundation before pilot** (registry + `resolveMiniAppEntry` tồn tại nhưng **chưa được gọi từ UI**; CTAs vẫn `navigation.navigate('Tabs', …)` rải rác). **Đi kèm ưu tiên cao B** (Super App Lite cleanup brand/navigation) và **D** (payment/AI/ops) trước commercialization — xem §19–§22. |

**Chọn chữ cái:** **C**

---

## 2. Current Repo / Build Status

| Check | Result | Notes |
|--------|--------|-------|
| **git status** | Nhiều file modified + untracked | Modified: `HomeScreen`, `LoginScreen`, `WelcomeScreen`, `LocalScreen`, `TravelScreen`, B2B AI Receptionist screens, `B2BPaywallScreen`, `MerchantVnDashboardScreen`, `miniAppRegistry.ts`, `brandConfig`/`appBrand`, i18n `en`/`vi`, `ultraMasterBookingFlow.ts`, SOS/premium widgets, v.v. Untracked: `docs/ai-context/VIONA_FINAL_MASTER_BLUEPRINT_V2.md`, `VIONA_TRAVEL_DUAL_DIRECTION_ARCHITECTURE.md`, `src/components/viona/`, `src/core/industries/`, `src/core/miniapps/index.ts`, `resolveMiniAppEntry.ts`. |
| **Latest commits (oneline -20)** | `7ad6737` … `621b1c7` | Gần đây: AI/call + companion OS **docs**, brand polish, web fixes, AI receptionist ops **docs**. |
| **typecheck** | **Pass** | `npm run typecheck` → `tsc --noEmit`, exit 0. |
| **lint** | **Pass với warnings** | `0 errors`, **51 warnings** (unused vars, import order, array-type style, v.v.) — không chặn build nhưng là nợ kỹ thuật trước scale. |
| **npm scripts** | Rich release/commercial tooling | Có `preflight`, `preflight:commercial`, `commercial:preflight`, `trust:*`, `security:preflight`, `ops:preflight`, `check:brand-boundaries`, `check:commercial-mapping`, v.v. |
| **Current branch** | `chore/payment-pilot-observability` | Tên branch gợi payment pilot — **Needs confirmation** mục tiêu branch vs release. |
| **Untracked files** | Blueprint V2, travel dual-direction doc, viona components, industries core, miniapps barrel + resolver | Rủi ro: PR/review khó nếu không stage; một phần là **SSoT blueprint** nên cần quy trình merge rõ. |
| **High-risk modified files** | AI Receptionist UI, paywall, merchant dashboard, booking flow, wallet-related services (per history), SOS | Thay đổi tập trung **B2B AI + shell + commerce** — đúng vùng tài chính/niềm tin; cần review tập trung trước demo ngoài. |

---

## 3. Blueprint Alignment Check

| Blueprint Requirement | Current Evidence | Status | Gap |
|----------------------|------------------|--------|-----|
| Public brand VIONA | `app.config.js` splash VIONA; commits brand; i18n đang chỉnh | **Partial** | `appBrand.ts` vẫn `internalName: 'KNG'`, `masterName: 'Kết Nối Global'`; grep còn ViGlobal/KNG/VIG user-facing. |
| VIO Points / Credits; không VIG Token public | `featureFlags.ts` `vioPointsDisplayEnabled`; blueprint | **Partial** | `liveInterpreterService`, `WalletService` (fintech), `VigTokenIcon`, `state/wallet` vẫn nhắc **VIG Token** trong message/UI paths. |
| Global Vietnamese Companion OS | `VIONA_FINAL_MASTER_BLUEPRINT_V2.md`; `VIONA_GLOBAL_COMPANION_OS_ARCHITECTURE.md` (repo) | **Strong (doc)** / **Partial (product)** | Cần shell copy + navigation phản ánh “companion” thay vì vertical silo. |
| Super App Mini-App Platform | `src/core/miniapps/miniAppRegistry.ts` + types; `resolveMiniAppEntry.ts` | **Partial** | Registry **đủ meta** (status, flag, role, readiness); **CTA Resolver chưa gắn UI** (grep chỉ thấy export/định nghĩa, không screen consumer). |
| Core OS / Shared Core / Mini-Apps | Prisma + services lớn; mini-app list trong registry | **Partial** | Shared core “Industry taxonomy” có `src/core/industries/` (untracked) — **Needs confirmation** độ phủ vs playbook. |
| Smart Trio i18n | `languageMapper.ts` comment Smart Trio; `routes.ts` comment storefront | **Early** | Chưa thấy model `appLocale`/`marketLocale`/`customerLocale`/`merchantLocale` toàn app trong grep hẹp. |
| SOS Lifeline | `SOSFloatingButton`, `SOSShieldComponent`, SOS modal logs | **Partial** | Cần rà soát emergency-by-country + copy; console log `[ViGlobal SOS]` — legacy tên. |
| Local Commerce | `LocalScreen`, merchant detail, booking routes | **Partial** | Audit trước ghi legacy “ViGlobal Local”; marketplace hai chiều **Needs confirmation** độ hoàn chỉnh. |
| Travel dual-direction | Registry: `travelOutbound`, `travelInboundVietnam`, `travelReturnToVietnam` + doc untracked | **Partial (architecture)** | UI `TravelScreen`/`FlightSearchScreen` vẫn **KNG Travel** kicker — mâu thuẫn worldview. |
| Academy Lite | `academy` mini-app `status: lite`, flag `academyLiteEnabled` | **Partial** | Tab AI đa màn; nhãn Lite cần verify trên mọi entry. |
| AI Receptionist Demo/Pilot | `AiReceptionistDemoSimulatorScreen` “SIMULATED DEMO”; Pilot form; checklist flags | **Good for demo honesty** | Pilot relay: UI báo **“not configured yet”** khi thiếu env — đúng guardrail, nhưng **chưa pilot-ready** cho intake tự động. |
| B2C AI Call Assistant | Registry `b2cAiCallAssistant` → `LeonaCall`, `status: demo` | **Partial / doc-heavy** | Cần map UI `LeonaCall` vs Twilio readiness (Needs confirmation). |
| Income/Growth OS | `brokerQr` mini-app `gated`; Prisma `BROKER`, `BrokerEscrow*` | **Partial** | Payout guardrails cần chứng minh bằng test + ops, không chỉ schema. |
| Zero-loss monetization | `StripeBillingService`, `BrokerService` comments về margin; flags tách auto booking/payment | **Partial** | Nhiều path mock/dynamic labeling trong code comments — phải đồng bộ UX “ước tính / sandbox”. |
| Cost Firewall | Blueprint + flags `b2bAuto*` default false | **Partial** | **Needs confirmation** metering per-tenant trong runtime vs doc. |
| No fake production | Demos có badge; `resolveMiniAppEntry` không silent fallback Home | **Partial** | Vẫn có mock panels/services trong repo (audit cũ); phụ thuộc **flag + routing** không đưa user nhầm sang live. |

---

## 4. Mini-App Registry & Navigation Audit

**Centralized registry:** **Có** — `MINI_APP_REGISTRY` trong `src/core/miniapps/miniAppRegistry.ts`.  
**CTA Resolver adoption:** **Chưa** — `resolveMiniAppEntry` **không** được import bởi screen nào ngoài package miniapps (chỉ `index.ts` export). Đây là **gap kiến trúc P0** so blueprint “CTA Resolver”.

| Mini-App | Exists? | Route | Status (registry) | Feature Flag | Role | Readiness | Problem |
|----------|---------|-------|-------------------|---------------|------|-----------|---------|
| Hub | Yes | `Tabs/TabHome` | active | `hubEnabled` | b2c, merchant, broker, admin | ready | CTAs khác vẫn có thể bypass registry. |
| Local | Yes | `Tabs/TabLocal` | lite | `localEnabled` | broad | ready | Legacy copy risk (audit). |
| Booking | Yes | `Tabs/TabLocal` | lite | `bookingEnabled` | broad | partial | Gộp route Local — user có thể không phân biệt mini-app. |
| Merchant Dashboard | Yes | `Tabs/TabMerchant` | lite | `merchantDashboardEnabled` | merchant | ready | Financial surface — cần nhãn + gate payment. |
| B2B AI Receptionist | Yes | `AiReceptionistSetupChecklist` | pilot | `b2bAiReceptionistDemoEnabled` / pilot flags | merchant | partial | Demo/pilot tách; production flag riêng — tốt. Relay email **Needs confirmation** env. |
| B2C AI Call Assistant | Yes | `LeonaCall` | demo | `leonaAssistantEnabled` | broad | partial | Phải giữ nhãn demo; trùng concept với `leonaAssistant` entry khác. |
| Travel | Yes | `Tabs/TabTravel` | lite | `travelLiteEnabled` | broad | partial | Sub-mini-apps hướng đi cùng tab — UX selector **Needs confirmation** trên `TravelScreen`. |
| Academy | Yes | `Tabs/TabAi` | lite | `academyLiteEnabled` | broad | partial | Tab AI chứa nhiều universe — dễ overload. |
| Leona | Yes | `LeonaCall` | lite | `leonaAssistantEnabled` | broad | partial | Hai entry (b2cAiCallAssistant vs leonaAssistant) — có thể gây rối CTA. |
| Minh Khang Translator | Yes | `LiveInterpreter` | beta | `aiReceptionistEnabled` | broad | partial | Flag name **legacy alignment** — dễ nhầm với B2B receptionist. |
| Broker QR | Yes | `Tabs/TabQr` | gated | `brokerQrEnabled` | broker | partial | Đúng hướng gate tài chính. |
| Admin | Yes | `Tabs/TabCommandCenter` | gated | (none in row — def không set `featureFlag` trong đoạn đọc) | admin | partial | **Needs confirmation** flag admin trong `getFeatureFlags` vs navigation. |

**Đặc biệt (navigation / Home):**

- Nhiều `navigation.navigate('Tabs', { screen: 'TabHome' | … })` — **không** thấy pipeline `resolveMiniAppEntry` → gate UI.
- Tab label **“Tổng quan”** (`vi.json` `tabHub`) = Home — **không** phải bug tự thân nhưng nếu CTA “xong” luôn về đây mà không giải thích → cảm giác “bị đá về Home”; **Needs confirmation** từng flow UX.
- **Silent fallback:** `resolveMiniAppEntry` **explicitly avoids** silent fallback to Hub — **tốt**; nhưng vì chưa dùng, các chỗ khác vẫn có thể fallback hành vi mặc định tab.

---

## 5. Universe Structure Audit

### Universe 1 — Hub

- **Trust-first:** Đang cải (VIONA shell commits); vẫn có **legacy strings** và có thể duplicate SOS widgets (modified `SOSFloatingButton`, `SOSShieldComponent`) — **Needs confirmation** chỉ một entry SOS production.
- **Overload:** Home + briefing + nhiều card mini-app dễ nặng; blueprint khuyến nghị launcher rõ.
- **SOS / VIO / briefing / launcher:** Có mảnh ghép; thiếu **một cốt truyện** “một màn = một hành động chính” (xem §15).

### Universe 2 — Local

- **Marketplace hai chiều:** Schema/BizType hướng VN inbound + EU roles — **Needs confirmation** UI cho “native books Vietnamese merchant” đầy đủ.
- **Smart Trio:** Gợi ý ở `languageMapper` + một nút storefront — **chưa OS-wide**.
- **Booking/merchant/menu:** Có luồng và màn hợp lý trong navigation; độ production **Partial** (audit cũ: mock engine một phần B2B).
- **Hẹp nail/spa:** Có vertical F&B/transport trong enum — **Needs confirmation** nội dung seed UI không thiên về một vertical.

### Universe 3 — Travel

- **Dual/tri direction:** Registry tách `travelOutbound`, `travelInboundVietnam`, `travelReturnToVietnam` — **đúng hướng blueprint V2** (doc untracked bổ sung).
- **Hard-code Praha/Berlin/CZ/DE:** **Needs confirmation** full `TravelScreen.tsx` scan; bằng chứng grep: **“KNG Travel”** trong `FlightSearchScreen` / `LocalFixerScreen` — worldview chưa neutral global.
- **Premium / Pilot labels:** Một phần travel gated `travelLiteEnabled` + paywall patterns; **Needs confirmation** từng premium card (AcrylicPlatinum modified).

### Universe 4 — Academy

- **Lite/Beta:** Flag `academyLiteEnabled` default true — cần copy nhất quán “Lite”.
- **Văn hóa/gia đình:** Có learning stacks (Kids/Adult) trong repo — **Partial**.
- **AI tutor fake production:** Phụ thuộc flag + billing; audit cũ ghi legal scan mock + debit — **rủi ro** nếu không tách nhãn (không mở rộng chi tiết DB trong audit này).

---

## 6. Smart Trio i18n Readiness

| Area | vi | en | native market | Status | Gap |
|------|----|----|---------------|--------|-----|
| App shell | Có `vi.json` | `en.json` | **Needs confirmation** FR/JA/KR parity | Partial | `docs/audit/VIONA_BRAND_RESET_VERIFICATION.md` ghi fr/ja/ko hub/SOS chưa đồng bộ. |
| Home | Đang đổi | Đang đổi | CZ/DE copy **Needs confirmation** | Partial | Legacy ViGlobal trong audit. |
| Local | VN-heavy | Partial | Host country **Needs confirmation** | Partial | Smart Trio storefront chỗ hiếm. |
| Travel | Mixed | KNG Travel EN strings | EU kicker | **Gap** | Đổi worldview + market trio. |
| Merchant | VN dashboard direction | Partial | **Needs confirmation** | Partial | Bilingual merchant ops. |
| AI Receptionist | Pilot EN + mixed | i18n keys `aiReceptionist.*` | Industry strings | Partial | Cần đủ vi/en + industry playbook i18n. |
| Booking | `routes.ts` comment Smart Trio | Partial | Customer native | Partial | End-to-end language pick **Needs confirmation**. |
| Notifications | Expo permissions VN copy | Partial | Locale follow OS | **Needs confirmation** | |
| Paywall | B2B paywall modified | Partial | Currency/tax copy | Partial | |
| SOS | Legacy log tag ViGlobal | Partial | Emergency by country | Partial | |
| Academy | Partial | Partial | Host language | Partial | |

---

## 7. Local Commerce Readiness

| Capability | Current State | Needed for Commercialization | Priority |
|------------|---------------|------------------------------|----------|
| Merchant directory | Có trong product | Verified data + spam guard | P1 |
| Merchant profile | Screens exist | Trust signals, policy | P1 |
| Service menu | Partial | Structured services + pricing rules | P1 |
| Booking flow | `ultraMasterBookingFlow` modified | E2E idempotent + status machine | P0 |
| Customer native-language booking | Smart Trio spotty | Full trio + confirmation templates | P0 |
| Merchant Vietnamese dashboard | `MerchantVnDashboardScreen` modified | Reconcile with EU merchant | P1 |
| Reviews | Schema/Partial UI **Needs confirmation** | Moderation + fraud | P1 |
| Availability/capacity | **Needs confirmation** | Truthful inventory | P0 |
| Price display | Partial | Tax/fee transparency | P1 |
| Safe payment status | Flags `liveStripePaymentEnabled` | Webhook SoT + UI chỉ success khi confirmed | P0 |
| Manual booking fallback | Ops runbooks exist pattern | Surfaced in UI | P1 |
| Merchant onboarding | Partial | Checklist + KYB | P1 |
| B2B AI Receptionist entry | Checklist + demo | Industry + manual ops | P1 |

---

## 8. AI Receptionist & AI Call Assistant Readiness

### B2B Industry-Aware AI Receptionist

- Industry taxonomy/playbooks: `src/core/industries/` (untracked) + i18n demo strings — **Partial**, **Needs confirmation** coverage.
- Setup checklist + demo simulator + pilot request: **Implemented**; pilot **manual review** messaging — aligns runbook.
- Demo simulator: **SIMULATED DEMO** badge — good.
- Manual ops / email relay: **Documented** (`AI_RECEPTIONIST_MANUAL_OPS_RUNBOOK.md`); **runtime relay Needs confirmation** (`VIONA_AI_RECEPTIONIST_LEAD_CAPTURE_*` audits).
- No production call without readiness: **Flags** `b2bAiReceptionistProductionEnabled` default false — good.
- No DB/payment/inventory mutation by AI in pilot form: **Stated** in runbook; voice service elsewhere still **Needs confirmation** not linked from demo path.

### B2C AI Call Assistant

- Docs: `VIONA_AI_CALL_AND_INDUSTRY_RECEPTIONIST_ARCHITECTURE.md` (commit history).
- UI: Registry points to `LeonaCall`; **Needs confirmation** Twilio wiring, consent, recording disclaimer, cost cap.

| AI Feature | Status | Risk | Commercialization Gap |
|------------|--------|------|----------------------|
| B2B demo simulator | Live UI, simulated | Low if isolated | Packaging + i18n |
| B2B pilot intake | UI ready | Medium if relay missing | SES/env + triage owner |
| B2B production voice | Gated off | High if mis-flagged | Ops + Twilio + cost firewall |
| B2C Leona call | demo/lite flags | High telecom cost | Credits, hard cap, legal copy |
| Minh Khang live interpreter | beta | VIG messaging legacy | Replace VIG public strings |

---

## 9. Booking / Payment / Wallet / VIO Commercial Readiness

| Area | Current State | Risk | Required Before Production |
|------|---------------|------|----------------------------|
| Booking | Mixed real + demo paths in codebase (prior audits) | User trust | Single SoT status + no mock in paid path |
| Stripe | Plugin conditional on `EXPO_PUBLIC_STRIPE_MERCHANT_IDENTIFIER`; services reference dynamic Stripe | Misconfig | Webhook verify + idempotency tests |
| Webhook SoT | **Needs confirmation** deployment | Settlement wrong | Replay tests + monitoring |
| Ledger/reconciliation | Prisma `TxType` rich | Complexity | Accounting rules + reports |
| VIO liability | Display flag on; internal VIG naming persists | Regulatory perception | Rename public surfaces; ledger semantics |
| QR/manual payment | VietQR direction in git history | Ops | Clear “pending/confirmed” UI |
| Fake payment success | Audits flagged admin/KOL mock | Brand | Remove/hide demo revenue from live builds |
| Broker payout | Gated `brokerQrEnabled`; escrow enums | Fraud | Manual approval + caps |

---

## 10. Zero-Loss Monetization Audit

| Revenue Stream | Exists? | Cost Cap? | Ledger? | Margin Rule? | Auto-Pause? | Priority |
|----------------|---------|-----------|---------|---------------|-------------|----------|
| B2B SaaS | Partial (paywall) | **Needs confirmation** | Partial | Comments/rules in Stripe services | **Needs confirmation** | P1 |
| AI Receptionist minutes | Pilot intent | Flag | **Needs confirmation** | **Needs confirmation** | Flags off default | P0 |
| B2C AI Call credits | Registry monetization `credits` | **Needs confirmation** | **Needs confirmation** | **Needs confirmation** | P0 |
| Merchant booking fee | Schema/types | Partial | Partial | Partial | **Needs confirmation** | P0 |
| Travel commission | Tourism services | Partial | Partial | Partial | **Needs confirmation** | P1 |
| Leona / Minh Khang credits | Flags + credits model | Partial | Partial | Partial | **Needs confirmation** | P1 |
| Academy subscription | monetization `subscription` | **Needs confirmation** | **Needs confirmation** | **Needs confirmation** | P2 |
| Broker payout | Schema | Escrow states | Partial | Net revenue comments | **Needs confirmation** | P0 |
| Visibility boost | Marketing engines in repo | **Needs confirmation** | **Needs confirmation** | **Needs confirmation** | P2 |
| Setup/onboarding fee | B2B flows | **Needs confirmation** | Partial | Contractual | P2 |
| VIO loyalty loop | Display on | Points liability | **Needs confirmation** | No cash-out policy | P1 |

---

## 11. Cost Firewall / AI Usage Readiness

| Cost Area | Current State | Missing | Risk |
|-----------|---------------|---------|------|
| Provider tracking | **Needs confirmation** full pipeline | Per-tenant dashboard | Runaway bill |
| OpenAI/Gemini | Routed services exist | Hard budget + pause | Overage |
| Twilio | Gated / pilot docs | Prepaid + kill switch | Telecom shock |
| Model router | `createRoutedChatCompletion` (prior audit) | Fallback downgrade policy | Quality vs cost |
| Included usage | Tiers in commercial files | Enforcement in API | Expectation mismatch |
| Cached FAQ | Partial patterns | Standard cache layer | Repeat cost |
| Per merchant/user | **Needs confirmation** | Metering table + UI | Dispute |

---

## 12. Security / Tenant / Compliance Audit

| Security Area | Status | Evidence | Gap |
|---------------|--------|----------|-----|
| Tenant isolation | Partial | Prisma multi-role | **Needs confirmation** every API path |
| Cross-merchant | **Needs confirmation** | — | Pen test |
| Auth/roles | Schema `Role` | Client gates | Server enforcement audit |
| Prompt/Tool Armor | **Needs confirmation** | Blueprint | Implementation proof |
| Idempotency | Payment scripts `verify:receipt` | Coverage map | All mutating routes |
| Audit log | **Needs confirmation** | — | SOC2-style trail |
| Sentry | `app.config.js` plugin | DSN env | Release health |
| GDPR tools | Docs G2 trust | In-app tools | **Needs confirmation** |
| Webhook verification | Stripe standard | Env | Mis-wired endpoint |
| Secrets | dotenv | Rotation | Ops |
| `no any` | Lint not strict on any | 51 warnings | Harden ESLint for critical dirs |

---

## 13. Global Market / Localization Readiness

| Market | Language Trio | Currency | Timezone | Services | Status |
|--------|---------------|----------|----------|----------|--------|
| CZ | Partial | **Needs confirmation** | **Needs confirmation** | Local + SOS | Partial |
| DE | Partial | **Needs confirmation** | **Needs confirmation** | Travel copy bias risk | Partial |
| VN | Strong VN | VND patterns in services | **Needs confirmation** | Inbound hub | Strong |
| US | en | USD Stripe | **Needs confirmation** | Partial | Partial |
| FR | fr.json gaps per audit | EUR **Needs confirmation** | **Needs confirmation** | Partial | Gap |
| JP | ko/ja gaps | **Needs confirmation** | **Needs confirmation** | Partial | Gap |
| KR | gaps | **Needs confirmation** | **Needs confirmation** | Partial | Gap |
| Global fallback | en | USD? | UTC? | **Needs confirmation** | Required |

---

## 14. Income & Growth OS Readiness

| Growth Loop | Status | Risk | Needed Before Launch |
|-------------|--------|------|----------------------|
| Broker QR | Gated mini-app | Early payout | Escrow + manual clearance |
| Student ambassador | **Needs confirmation** UI | Fraud | Attribution + cap |
| Community connector | Partial marketing | Spam | Quality bar |
| Local helper | Local fixer screens | Liability copy | Insurance/legal disclaimer |
| Travel fixer | KNG-branded copy | Wrong brand | Rebrand + contracts |
| Merchant onboarding | Partial | Ops load | Playbook |
| Attribution | Broker schema | Collision | Idempotent referral |
| Payout guard | Escrow enums | Bug | Admin tooling |
| Clawback | Enum `CANCELLED_*` | Dispute process | Policy |
| Cap/decay | **Needs confirmation** | Runaway | Config + monitoring |
| Net revenue only | Comments in `BrokerService` | Interpretation | Finance sign-off |

---

## 15. UI / UX / Design System Commercial Readiness

| Screen | Demo Ready? | Main Issue | Priority |
|--------|-------------|------------|----------|
| Login | Partial | Legacy brand remnants **Needs confirmation** | P1 |
| Home | Yes internal | Overload + legacy naming risk | P0 |
| Local | Partial | ViGlobal residue per audits | P0 |
| Travel | Partial | “KNG Travel” worldview | P0 |
| Academy | Partial | Lite label consistency | P1 |
| Merchant Dashboard | Partial | Financial clarity | P0 |
| AI Receptionist setup/demo/pilot | Yes (honest demo) | Relay env | P0 |
| B2BPaywall | Partial | Expectation vs delivery | P1 |
| Wallet/VIO | Partial | VIG strings in some services | P0 |
| SOS | Partial | Duplicate components modified | P0 |
| Profile/Role switch | Partial | Trust + clarity | P1 |

---

## 16. Operational Readiness

| Ops Area | Status | Missing | Owner Needed? |
|----------|--------|---------|---------------|
| Manual ops runbook | **Yes** (AI receptionist) | Execution proof | **Yes** — triage owner |
| Lead triage owner | Doc implies team | Named on-call | **Yes** |
| Backup owner | Not seen in snapshot | Rotations | **Yes** |
| SLA | **Needs confirmation** | Numbers | Product/Ops |
| Lead log | **Needs confirmation** | CRM | Ops |
| Retention | **Needs confirmation** | Policy | Legal |
| Support mailbox | Env in runbook | Working SES | Eng |
| Smoke test evidence | Scripts exist (`smoke`, `trust:*`) | CI artifacts | **Needs confirmation** |
| Failure path | Pilot UI handles relay failure | Others **Needs confirmation** | Eng |
| Incident process | **Needs confirmation** | Playbook | Ops |
| Merchant onboarding checklist | Partial in B2B surfaces | Single SSoT | Product |

---

## 17. Commercialization Gates

### Gate 1 — Internal Demo Ready

| Requirement | Pass/Fail | Evidence | Owner |
|-------------|-----------|----------|-------|
| typecheck green | Pass | `npm run typecheck` OK | Eng |
| lint no errors | Pass | 0 errors | Eng |
| demo labeled | Partial | AI simulator SIMULATED | Product |
| no silent pay success | Partial | Depends on build flags | Eng |
| brand not misleading | Fail | ViGlobal/KNG/VIG remnants | Product |

### Gate 2 — Controlled Merchant Pilot

| Requirement | Pass/Fail | Evidence | Owner |
|-------------|-----------|----------|-------|
| Pilot intake relay | **Needs confirmation** | UI error path when unset | Eng/Ops |
| Tenant isolation verified | **Needs confirmation** | — | Sec |
| Payment live gated | Partial | `liveStripePaymentEnabled` false default **Needs confirmation** | Eng |
| Cost cap AI | **Needs confirmation** | — | Eng |

### Gate 3 — Public Beta

| Requirement | Pass/Fail | Evidence | Owner |
|-------------|-----------|----------|-------|
| i18n core markets | Fail | FR/JA/KO gaps per audit | Localization |
| registry-driven CTAs | Fail | Resolver unused | Eng |
| legal/consent | **Needs confirmation** | — | Legal |

### Gate 4 — Global Commercial Launch

| Requirement | Pass/Fail | Evidence | Owner |
|-------------|-----------|----------|-------|
| Ledger + reconciliation | **Needs confirmation** | Prisma rich | Finance |
| Webhook SoT | **Needs confirmation** | — | Eng |
| GDPR | **Needs confirmation** | — | Legal |
| Zero-loss monetization proof | Fail | Not evidenced end-to-end | CFO/Eng |

---

## 18. Top 30 Gaps

| Rank | Gap | Area | Severity | Commercial Impact | Suggested Fix |
|------|-----|------|----------|-------------------|---------------|
| 1 | `resolveMiniAppEntry` not wired to shell CTAs | Architecture | P0 | Wrong mini-app / trust | Pack A |
| 2 | Public VIG / ViGlobal / KNG strings | Brand | P0 | Regulatory + trust | Pack B + copy sweep |
| 3 | Travel “KNG Travel” worldview | Travel | P0 | Wrong positioning | Pack D + I |
| 4 | Pilot email relay may be unset | AI Ops | P0 | Pilot fails silently | Pack J + env |
| 5 | Payment/booking truth vs demo coexisting | Money | P0 | Chargebacks | Pack F |
| 6 | Smart Trio not pervasive | i18n | P0 | Conversion | Pack B |
| 7 | Duplicate SOS entrypoints risk | Safety | P0 | Confusion | Pack K |
| 8 | Broker payout complexity | Finance | P0 | Losses | Pack H |
| 9 | AI cost metering unproven | AI | P0 | Runaway cost | Pack G |
| 10 | B2C call legal disclaimers | Legal | P0 | Liability | Pack G + legal |
| 11 | Academy “lite” inconsistency | Product | P1 | Trust | Pack K |
| 12 | Leona vs b2cAiCallAssistant duplicate | Nav | P1 | clutter | Pack A |
| 13 | minhKhang uses `aiReceptionistEnabled` | Flags | P1 | Wrong gate | Pack A |
| 14 | Lint warning debt | Quality | P1 | Velocity | Eng hygiene |
| 15 | Unmerged untracked blueprint/docs | Process | P1 | SSoT drift | Docs process |
| 16 | FR/JA/KO locale gaps | i18n | P1 | Global beta | Pack B |
| 17 | Admin demo metrics in prod path | Trust | P1 | “Fake” perception | Flags (policy) |
| 18 | Voice receptionist mock sketch | AI | P1 | Mis-selling | Label/hide |
| 19 | Emergency numbers by country completeness | SOS | P1 | Safety | Pack I |
| 20 | Merchant availability truth | Local | P1 | Disputes | Pack E |
| 21 | Review moderation | Local | P1 | Abuse | Pack E |
| 22 | Stripe webhook monitoring | Pay | P1 | Money loss | Pack F |
| 23 | Idempotency coverage map | API | P1 | Double charge | Pack F |
| 24 | Sentry release health | Ops | P2 | MTTR | Pack J |
| 25 | GDPR export/delete | Compliance | P2 | EU market | Pack J |
| 26 | Accessibility contrast pass | UX | P2 | Store | Pack K |
| 27 | Mapbox/web fallbacks | Tech | P2 | UX | Eng |
| 28 | Academy subscription billing | Revenue | P2 | Leakage | Pack F |
| 29 | Visibility boost pricing | Revenue | P2 | Trust | Product |
| 30 | Incident comms template | Ops | P2 | Crisis | Pack J |

---

## 19. Recommended Roadmap (Packs A–K)

| Pack | Goal | Files likely touched | Risk | Dependencies | Done Criteria |
|------|------|----------------------|------|--------------|---------------|
| A | Mini-App Registry + CTA Resolver adoption | `HomeScreen`, hub CTAs, `navigation/*`, `resolveMiniAppEntry` consumers | Medium | featureFlags | Mọi CTA mini-app đi qua resolver + gate UI |
| B | Smart Trio i18n foundation | `languageMapper`, i18n json, booking confirmation templates | Medium | market config | Trio model documented + 3+ critical flows |
| C | Industry registry + playbooks | `core/industries`, AI screens, i18n | Medium | A | Industry chọn được + demo/pilot đồng bộ |
| D | Travel direction selector UX | `TravelScreen`, travel hub, registry sub-apps | Medium | B | User chọn hướng đi trước khi thấy offer |
| E | Local commerce booking clarity | `LocalScreen`, booking flow, merchant | High | F | Trạng thái booking + payment rõ ràng |
| F | Payment/ledger/Stripe readiness | server payment controllers, webhooks **(sau approval)** | High | Ops | Webhook tests + reconciliation report |
| G | Cost firewall / AI metering | AI routes, usage tables, flags | High | F | Hard cap + auto-pause proven |
| H | Broker/student income guardrails | broker services, admin | High | F | Payout chỉ sau clearance + cap |
| I | Global market config | market config modules, SOS numbers | Medium | B | No CZ/DE-only worldview in public copy |
| J | Commercial ops/support/runbooks | `docs`, SES, on-call | Low | A–I | Named owners + smoke evidence archived |
| K | UI/UX final verification | VIONA components, SOS single path | Medium | A | Design system + one primary action/screen |

---

## 20. First 10 Implementation Tasks

1. **Wire `resolveMiniAppEntry` to Hub CTAs** — Goal: không navigate thủ công tới tab sai; **Files:** `HomeScreen.tsx`, helper hook; **Do not touch:** Prisma, payment controllers; **Validation:** gate UI khi flag off; **Commit:** `feat(nav): route hub mini-apps via resolveMiniAppEntry`.
2. **Inventory every `navigate('Tabs')` from monetized surfaces** — Goal: map silent home; **Files:** grep list screens; **Do not touch:** backend; **Validation:** spreadsheet + test plan; **Commit:** `chore(nav): audit tab entrypoints for mini-app parity`.
3. **Replace user-visible “VIG Token” with VIO copy (client-only)** — Goal: blueprint compliance; **Files:** `liveInterpreterService`, selected UI; **Do not touch:** ledger enum names backend; **Validation:** `rg` VIG Token in `src/screens`; **Commit:** `fix(brand): align public wallet copy to VIO`.
4. **Remove/replace “KNG Travel” kickers** — Goal: global positioning; **Files:** `FlightSearchScreen`, `LocalFixerScreen`; **Do not touch:** payment; **Validation:** visual QA; **Commit:** `fix(travel): neutralize legacy travel chrome`.
5. **Converge Leona mini-app entries** — Goal: một CTA; **Files:** registry + hub cards; **Do not touch:** Twilio secrets; **Validation:** single route; **Commit:** `refactor(miniapps): dedupe leona entrypoints`.
6. **Fix `minhKhangTranslator` feature flag mapping** — Goal: không dùng nhầm `aiReceptionistEnabled`; **Files:** `miniAppRegistry.ts`, `featureFlags.ts`; **Do not touch:** DB; **Validation:** flag matrix doc; **Commit:** `fix(flags): isolate minh khang from b2b receptionist gate`.
7. **SOS single entry + copy audit** — Goal: một nút SOS production path; **Files:** `SOSFloatingButton`, `SOSShieldComponent`; **Do not touch:** SOS API contract; **Validation:** design review; **Commit:** `fix(sos): unify floating vs shield entry`.
8. **Pilot relay env checklist execution** — Goal: email đến inbox; **Files:** ops doc only hoặc config **sau approval**; **Do not touch:** payment; **Validation:** test email; **Commit:** `chore(ops): verify ai receptionist lead relay env`.
9. **Smart Trio on storefront booking** — Goal: customer sees native + VN + EN; **Files:** booking screen + i18n; **Do not touch:** wallet math; **Validation:** 3-locale snapshot; **Commit:** `feat(i18n): smart trio on storefront booking`.
10. **Run `npm run preflight:commercial` in staging & archive log** — Goal: evidence; **Files:** CI artifact; **Do not touch:** prod secrets; **Validation:** log attached to release ticket; **Commit:** `chore(release): commercial preflight evidence`.

---

## 21. Do Not Touch Without Explicit Approval

- Prisma schema / migrations  
- Payment / webhook / Stripe live configuration  
- Booking mutation semantics / idempotency keys  
- Wallet math / ledger postings  
- Broker payout / escrow release automation  
- AI real phone calls / Twilio production numbers  
- Inventory / bill printing automation  
- Legal / medical advice models  
- Payroll  
- Live token economy / cash-out messaging  
- Auth / JWT issuance backend  

---

## 22. Final Recommendation

**Chọn: C — Need core mini-app platform wiring (registry + CTA resolver adoption) before a trustworthy controlled pilot; parallel tracks B (brand/super-app shell) and D (payment/AI/ops evidence) remain mandatory before any money-moving beta.**

*(Nếu chỉ chọn một chữ cái từ A–E: **C**.)*

---

## Appendix — Commands Run (snapshot)

```text
git status --short   → see §2
git branch --show-current → chore/payment-pilot-observability
git log --oneline -20 → see §2
npm run typecheck    → pass
npm run lint         → 0 errors, 51 warnings
npm run              → scripts listed §2
```

**`git grep` pattern (user request):** executed conceptually via `rg` across `src` + spot `docs`; representative hits: ViGlobal/KNG/VIG Token, Demo/Pilot, `navigate('Tabs'…)`, “Tổng quan” in `vi.json` / commercial tiers.

---

**End of audit document.**
