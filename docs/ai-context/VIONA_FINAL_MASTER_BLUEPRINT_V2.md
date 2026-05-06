# VIONA FINAL MASTER BLUEPRINT V2

> **Vị trí file:** `docs/ai-context/VIONA_FINAL_MASTER_BLUEPRINT_V2.md`  
> **Quan hệ V1:** V1 tiếng Anh tại `docs/ai-context/VIONA_FINAL_MASTER_BLUEPRINT.md`. V2 **đúc kết và mở rộng** V1; khi founder ký, V2 có thể trở thành SSoT chính hoặc được merge ngược vào V1.  
> **Tóm tắt thay đổi so V1:** North Star **Global Vietnamese Companion OS**; **5 Operating Systems**; Local **hai chiều** (người bản địa đặt DN Việt); Travel **ba hướng**; **B2C AI Call Assistant** + **Industry-Aware Lễ Tân AI**; Core OS bổ sung **Mini-App Registry**, **CTA Resolver**; Shared Core bổ sung **Market language config**, **Industry taxonomy**; roadmap / P0 tasks / Design System / Financial Fortress chi tiết hóa.

Bản V2 đúc kết từ V1 và bổ sung các điểm đã chốt: **Smart Trio i18n**, **đồng hành/bảo hộ**, **Local cho người Việt và người bản địa**, **Travel hai chiều**, **AI gọi/đặt lịch hộ**, **Lễ Tân AI đa ngành**, **thu nhập** cho tiểu thương/sinh viên/broker — **giữ nguyên** guardrail tài chính và an toàn của blueprint gốc (VIO không crypto/cash-out; không fake production; super app mini-app platform).

---

## 0. North Star

**VIONA = Global Vietnamese Companion OS.**

VIONA là người đồng hành, người bảo hộ, cầu nối ngôn ngữ, cầu nối kinh doanh và nền tảng tạo thu nhập cho người Việt toàn cầu.

VIONA phục vụ 5 nhóm chính:

```txt
1. Người Việt sinh sống, học tập, làm việc ở nước ngoài.
2. Người Việt kinh doanh ở nước ngoài.
3. Người bản địa muốn đặt dịch vụ của doanh nghiệp Việt.
4. Người nước ngoài / kiều bào đến Việt Nam du lịch, trải nghiệm, làm việc ngắn hạn.
5. Sinh viên, broker, cộng tác viên, local helper muốn tạo thêm thu nhập từ hệ sinh thái VIONA.
```

VIONA không được bị thu hẹp thành:

```txt
- app booking đơn thuần
- app AI đơn thuần
- app travel đơn thuần
- app merchant đơn thuần
- ví điểm thưởng đơn thuần
```

VIONA phải là:

```txt
Global Vietnamese Network
+ Smart Trio Language OS
+ Local Commerce OS
+ Travel Companion OS
+ Merchant AI OS
+ Income & Growth OS
+ Safety / Zero-Loss Guardrails
```

---

## 1. Non-Negotiable Identity

```txt
Public brand: VIONA
Domain: vionaio.com
Public points: VIO Points / VIO Credits
Legacy names: ViGlobal, Kết Nối Global, KNG
Legacy internal token name may remain VIG until migration
```

Rules:

```txt
- Public UI must not say “VIG Token”.
- Public UI must use “VIO Points” or “VIO Credits”.
- VIO is NOT crypto in MVP.
- VIO is NOT withdrawable cash.
- VIO is loyalty / internal credits unless a future regulated finance layer is approved.
```

Tagline:

```txt
Connect. Survive. Thrive.
```

---

## 2. Strategic Positioning

VIONA giúp người Việt:

```txt
- sống được ở nước ngoài
- làm việc được ở nước ngoài
- kinh doanh được ở nước ngoài
- vượt qua rào cản ngôn ngữ
- đặt lịch / gọi điện / xử lý tình huống khi không biết tiếng bản địa
- tìm cộng đồng và dịch vụ Việt đáng tin
- tạo thu nhập từ network VIONA
```

VIONA giúp người bản địa:

```txt
- tìm và đặt dịch vụ của doanh nghiệp Việt
- giao tiếp với merchant Việt bằng tiếng bản địa
- nhận xác nhận booking / dịch vụ rõ ràng
```

VIONA giúp người nước ngoài đến Việt Nam:

```txt
- du lịch an toàn hơn
- hiểu tiếng Việt / văn hóa Việt tốt hơn
- có local fixer / concierge / phiên dịch / hướng dẫn
- trải nghiệm dịch vụ Việt đáng tin
```

---

## 3. Architecture Decision

VIONA là **SUPER APP implemented as a MINI-APP PLATFORM**, không được build như một app khổng lồ rời rạc. Blueprint gốc đã quy định cấu trúc 3 lớp: **VIONA Core OS**, **Shared Business Core**, và **Mini-Apps**, đồng thời yêu cầu mỗi mini-app có id, status, route, featureFlag, role, permissions, monetization, risk và readiness rõ ràng. 

### Layer 1 — VIONA Core OS

```txt
Auth
Roles
Tenant isolation
Brand config
Feature flags
App shell
Navigation
Mini-App Registry
CTA Resolver
Smart Trio i18n
SOS Lifeline
Shared UI
Shared API client
Logging
Sentry
Cost firewall
Audit log
GDPR tools
```

### Layer 2 — Shared Business Core

```txt
Users
Profiles
Merchants
Services
Bookings
Locations
Reviews
QR/manual payment status
Broker attribution
VIO Points / Credits
Ledger
AI usage tracking
Notifications
Market language config
Industry taxonomy
```

### Layer 3 — Mini-Apps

```txt
Hub
Local
Booking
Merchant Dashboard
B2B AI Receptionist
B2C AI Call Assistant
Travel
Academy
Leona Assistant
Minh Khang Translator
Broker QR
Admin / Command Center
```

---

## 4. The 5 Operating Systems

VIONA V2 không chỉ chia theo màn hình. VIONA phải có 5 hệ thống vận hành.

## 4.1 Survival & Protection OS

Mục tiêu: **người bảo hộ**.

Bao gồm:

```txt
SOS / Global Lifeline
emergency numbers by country
embassy / consulate guidance
trusted contacts
location sharing
distress phrases in native language
lost document guidance
scam / safety warning
hospital / police / emergency flow
```

Rules:

```txt
- SOS giữ 3 giây mới trigger.
- Không fake emergency response.
- AI có thể hỗ trợ ngôn ngữ khẩn cấp nhưng không thay thế chính quyền.
- Nếu demo-only thì phải ghi rõ.
```

Blueprint gốc đã yêu cầu Global Lifeline tồn tại trên B2C, B2B, Broker, Travel, Local và không được giả lập phản hồi khẩn cấp. 

## 4.2 Language Freedom OS

Mục tiêu: **xóa hoàn toàn rào cản ngôn ngữ**.

Smart Trio i18n:

```txt
Vietnamese
English
Native local language by market
```

Ví dụ:

```txt
CZ: vi / en / cs
DE: vi / en / de
FR: vi / en / fr
JP: vi / en / ja
KR: vi / en / ko
VN: vi / en / traveler language
```

Dùng cho:

```txt
App UI
merchant profile
service menu
booking flow
AI receptionist
AI call assistant
customer confirmation
merchant dashboard
notifications
receipt / policy / reminder
travel translation
```

## 4.3 Local Commerce OS

Mục tiêu: **người Việt kinh doanh được ở nước sở tại**.

Local không chỉ phục vụ người Việt. Local là marketplace hai chiều:

```txt
Người Việt tìm dịch vụ Việt.
Người bản địa đặt dịch vụ của doanh nghiệp Việt.
Merchant Việt vận hành bằng tiếng Việt nhưng bán hàng bằng tiếng bản địa / tiếng Anh.
```

## 4.4 Travel Companion OS

Mục tiêu: **người Việt đi toàn cầu, thế giới đến Việt Nam**.

Travel không chỉ là Vietnam inbound. Travel là global movement layer:

```txt
1. Người Việt đi nước ngoài.
2. Kiều bào về Việt Nam.
3. Người nước ngoài đến Việt Nam.
```

## 4.5 Income & Growth OS

Mục tiêu: **tạo thêm thu nhập cho cộng đồng**.

Bao gồm:

```txt
merchant onboarding
broker QR
student ambassador
community connector
local helper
travel fixer
academy creator
service provider
merchant visibility boost
```

Payout rules:

```txt
- chỉ trả từ net platform revenue
- không trả từ gross
- delayed until settlement
- capped
- clawback nếu refund/fraud
- attribution decay
- không infinite payout
```

Blueprint gốc đã khóa Broker QR / QR attribution như growth loop, nhưng payout phải từ net revenue, có cap, decay, không payout trước settlement. 

---

# 5. The 4 Universes — V2 Corrected

## Universe 1 — VIONA Hub

Purpose:

```txt
LifeOS command center.
```

Hub phải sạch, trust-first, không overloaded.

Must include:

```txt
SOS / Global Lifeline
Dual clock: local vs Vietnam
VIO Points / Credits preview
Payment QR / wallet preview if safe
Survival briefing
Mini-app launcher
Heart Fund / CSR counter when real
Personalized quick actions
```

Rule:

```txt
Above-the-fold chỉ hiển thị action sinh tử hoặc giá trị cao.
Không nhồi mọi feature vào Home.
Không để CTA chưa production trông như production.
```

---

## Universe 2 — VIONA Local

Purpose V2:

```txt
VIONA Local là marketplace dịch vụ Việt tại quốc gia sở tại, phục vụ cả người Việt và người bản địa, với Smart Trio i18n: tiếng Việt, English và ngôn ngữ bản địa.
```

Must include:

```txt
Merchant directory
Service marketplace
Booking flow
Merchant profile
Service menu
Customer reviews
Merchant dashboard
B2B AI Receptionist
Local customer booking in native language
Vietnamese merchant dashboard
Expat services: legal/tax/shipping/event/classifieds
B2B marketplace / wholesale later
```

Industries must include more than nails/spa/restaurant:

```txt
Beauty & Wellness
Food & Retail
Stay & Travel
Home & Local Services
Professional Services
Education & Community
Health Scheduling Only
```

Rule:

```txt
Local is first major business engine.
Local must work even without AI.
Local must let native customers book Vietnamese businesses.
Merchant Việt must be able to operate in Vietnamese.
```

---

## Universe 3 — VIONA Travel

Purpose V2:

```txt
AI-powered travel and safety layer for:
1. Vietnamese people traveling abroad.
2. Overseas Vietnamese returning to Vietnam.
3. Foreigners traveling to Vietnam.
```

Travel is not only Vietnam inbound. Travel is the global movement layer of VIONA.

Must include:

```txt
Travel Lite first
Direction selector:
- Người Việt đi nước ngoài
- Đến Việt Nam
- Về Việt Nam

Destination-aware safety checklist
Translation help through Minh Khang
Travel survival phrases
Local fixer / trusted helper network
Cravings Radar
Vietnam guide for inbound travelers
Airport / SIM / taxi / safety support
Embassy / emergency guidance
VIP / chauffeur / fast-track / tax refund only when provider/payment is real
```

Rule:

```txt
Travel may open early as Travel Lite.
Premium paid services must be Pilot / Coming soon / Gated until provider, payment, refund and manual ops are ready.
Travel must never pretend live provider fulfillment or payment success.
```

---

## Universe 4 — VIONA Academy

Purpose:

```txt
Vietnamese language, culture, family learning and survival language.
```

Must include:

```txt
Academy Lite first
Vietnamese basics
Survival phrases
Kids/family learning
Culture learning
Pronunciation practice if real
AI tutor beta
Certificates later only if production-ready
```

Rule:

```txt
Academy should open early because it is a differentiator.
AI grading/certification must be Lite/Beta if not production.
```

---

# 6. Smart Trio i18n Architecture

## 6.1 Language Contexts

```ts
type LanguageContext = {
  appLocale: string;
  marketLocale: string;
  customerLocale: string;
  merchantLocale: string;
  contentLocale: string;
  notificationLocale: string;
  aiConversationLocale: string;
};
```

## 6.2 Market Language Config

```ts
type MarketLanguageConfig = {
  countryCode: string;
  nativeLocale: string;
  supportedLocales: string[];
  defaultCustomerLocale: string;
  defaultMerchantLocale: "vi";
  fallbackLocale: "en";
};
```

Examples:

```txt
CZ: vi / en / cs
DE: vi / en / de
VN: vi / en
US: vi / en
FR: vi / en / fr
JP: vi / en / ja
KR: vi / en / ko
```

## 6.3 Localized Content

```ts
type LocalizedText = {
  vi: string;
  en?: string;
  native?: string;
  cs?: string;
  de?: string;
  fr?: string;
  ja?: string;
  ko?: string;
};
```

Applies to:

```txt
merchant.name
merchant.description
service.name
service.description
bookingPolicy
cancellationPolicy
openingHoursNote
pricingNote
staffBio
promotionTitle
promotionDescription
```

---

# 7. B2C AI Call Assistant

## Strategic Decision

VIONA must have:

```txt
AI gọi hộ
AI đặt lịch hộ
AI phiên dịch cuộc gọi
AI chuẩn bị script khi người dùng không biết tiếng bản địa
```

Product names:

```txt
Minh Khang Call
AI gọi hộ
AI đặt lịch hộ
AI phiên dịch cuộc gọi
```

Use cases:

```txt
đặt lịch bác sĩ / nha sĩ / salon / sửa xe
gọi trường học / cơ quan / ngân hàng
đặt bàn nhà hàng
hỏi khách sạn / homestay
hỏi dịch vụ sửa chữa
gọi bảo hiểm / tư vấn / dịch vụ công
```

Rules:

```txt
- AI không được giả danh user nếu chưa có consent.
- AI không được ký hợp đồng.
- AI không được thanh toán.
- AI không được đưa medical/legal/financial final advice.
- AI không được tự cung cấp dữ liệu nhạy cảm nếu user chưa xác nhận.
- AI phải có transcript + summary.
- Production calling cần consent, cost cap, logging, legal review.
```

Rollout:

```txt
Phase A — script / translation assistant
Phase B — manual ops call support
Phase C — Twilio pilot with consent
Phase D — production call assistant with cost cap
```

---

# 8. B2B Industry-Aware AI Receptionist

Blueprint gốc đã xác định Lễ Tân AI là flagship B2B, có mục tiêu trả lời cuộc gọi thật, đặt lịch, xử lý khách đa ngôn ngữ, kiểm tra dịch vụ/giờ làm/staff/inventory, nhưng không được tự ghi DB, charge tiền, trừ kho, in bill nếu không qua Policy Engine + Tool Gateway. 

## Strategic Decision

Lễ Tân AI không được hard-code cho 4 ngành. Merchant phải chọn ngành nghề.

```txt
Bạn kinh doanh ngành gì?
```

## Industry Taxonomy

### A. Beauty & Wellness

```txt
Nail salon
Spa
Hair salon
Barber
Massage
Eyelash / brow
Beauty clinic
Fitness / yoga
```

### B. Food & Retail

```txt
Nhà hàng
Quán cà phê
Tiệm bánh
Catering
Hàng thực phẩm Việt
Siêu thị mini / grocery
Cửa hàng đặc sản
Online food order
```

### C. Stay & Travel

```txt
Khách sạn
Homestay
Guesthouse
Tour guide
Local fixer
Airport pickup
Car rental
Travel agency
```

### D. Home & Local Services

```txt
Sửa nhà
Điện nước
Vệ sinh
Giặt là
Sửa xe
Chuyển nhà
Gửi hàng / logistics
In ấn / photocopy
```

### E. Professional Services

```txt
Kế toán / thuế
Luật sư / tư vấn pháp lý
Bảo hiểm
Dịch thuật công chứng
Tư vấn du học
Tư vấn định cư
Bất động sản
```

### F. Education & Community

```txt
Lớp tiếng Việt
Gia sư
Trung tâm đào tạo
Lớp lái xe
Sự kiện cộng đồng
Câu lạc bộ / hội nhóm
```

### G. Health Scheduling Only

```txt
Phòng khám
Nha khoa
Vật lý trị liệu
Chăm sóc người già
```

Health rule:

```txt
Scheduling/intake only.
No medical advice.
```

## Industry Playbook Schema

```ts
type AiReceptionistIndustryProfile = {
  industryId: string;
  displayName: string;
  supportedServices: string[];
  bookingMode:
    | "appointment"
    | "reservation"
    | "order"
    | "inquiry"
    | "quoteRequest";
  requiredIntakeFields: string[];
  optionalIntakeFields: string[];
  riskLevel: "low" | "medium" | "high";
  allowedActions: string[];
  blockedActions: string[];
  handoffRules: string[];
  confirmationPolicy:
    | "merchantConfirm"
    | "autoConfirmIfRulesPass"
    | "intakeOnly";
};
```

---

# 9. AI Personas V2

## Minh Khang — Language & Travel Shield

Purpose:

```txt
real-time translation
voice-to-voice helper
menu/sign/document scanning
travel survival
call script / call translation support
```

Allowed:

```txt
translation
cultural explanation
travel assistant
document/menu scan with disclaimer
call preparation / call translation support
```

Not allowed:

```txt
legal/medical final answer
paid legal scan using mock output
payment / booking mutation
```

## Leona — Companion & Concierge

Purpose:

```txt
expat/travel concierge
emotional support
survival guidance
general assistant
Leona Lite / Call Lite when real and clearly labeled
```

Not allowed:

```txt
pretending to be lawyer/doctor
handling emergency instead of authorities
charging for mock answers
guaranteed promises
```

## Lễ Tân AI — Merchant Revenue Engine

Purpose:

```txt
industry-aware multilingual AI receptionist for Vietnamese merchants.
```

Rules:

```txt
- AI may speak like receptionist.
- AI must not write DB directly.
- AI must not charge money directly.
- AI must not reduce inventory directly.
- AI must not print bills directly.
- All risky actions go through Policy Engine + Tool Gateway.
```

## Cô Giáo AI — Academy Tutor

Purpose:

```txt
Vietnamese tutor
kids/family mode
culture learning
pronunciation practice
```

Not allowed:

```txt
official certification if not production-ready
high-stakes grading
camera grading if not production
```

---

# 10. Policy / Tool / Tenant Rules

All AI tool actions must pass:

```txt
schema validation
tenant check
role/permission check
idempotency key
policy engine
audit log
cost firewall
monitoring
```

Forbidden:

```txt
cross-tenant lookup
arbitrary discount
price invented by AI
legal/medical advice as final answer
payment outside approved tools
booking outside policy
refund/chargeback decisions without human approval
```

Blueprint gốc đã yêu cầu Prompt Armor, Tool Armor, tenant isolation, audit logs, Sentry, webhook verification, idempotency, no hardcoded secrets, no any, no fake production state. 

---

# 11. Financial Fortress

Payment rules:

```txt
Stripe Connect preferred
Base currency EUR unless local market requires controlled exception
Stripe Tax/Invoicing where applicable
Pre-authorization / manual capture
Webhook is source of truth
Client state is never source of truth for PAID
No fake payment success
No payout before settlement
No broker payout before settlement and reserve
No platform payout if ledger does not reconcile
```

Ledger must track:

```txt
platform revenue
merchant payable
broker payable
provider cost
AI/Twilio/server cost
tax liability
refund reserve
chargeback reserve
VIO liability
payouts
refunds
disputes
```

---

# 12. Zero-Loss Monetization

Core rule:

```txt
No production feature may run without:
- revenue source
- cost cap
- margin rule
- quota
- ledger
- monitoring
- auto-pause
```

Never sell unlimited AI.

Every AI/voice/vision/translation feature must have:

```txt
included usage
overage price
hard cap
model router
provider cost tracking
auto-pause
upgrade prompt
```

Revenue streams:

```txt
B2B SaaS
AI Receptionist minutes
B2C AI Call Assistant minutes / credits
Merchant booking fee
Travel service commission
Leona / Minh Khang AI credits
Academy subscription
Broker performance payout
Merchant visibility boost
Setup/onboarding fee
VIO loyalty loop
```

---

# 13. Mini-App Status Strategy

Statuses:

```txt
Active
Lite
Demo
Pilot
Beta
Coming soon
Gated
Frozen
```

Default:

```txt
Active/open:
- Hub
- Local
- Booking Lite
- Merchant Dashboard basic
- Academy Lite
- Leona Assistant Lite
- Travel Lite
- B2B AI Receptionist Demo/Pilot
- VIO Points display

Controlled/gated:
- AI voice/call
- B2B production actions
- Broker QR
- Travel paid services
- VIO redemption

Frozen until safe:
- paid legal scan if mock
- payroll production
- full broker commission if ledger not ready
- live payment if webhook/reconciliation not verified
- real token economy
- outbound AI cold calling without compliance
```

Blueprint gốc đã nói không được giấu mãi các differentiator; nếu risky thì chuyển thành Lite/Beta/Demo/Pilot/Coming soon, có label, feature flag, safety guard, monetization/cost guard. 

---

# 14. Design System V2

Design direction:

```txt
Clean Tech Trust UI for core app.
Navy Premium Minimal for Travel/VIP/upgrade moments.
Dark Ops Dashboard only for merchant/staff/admin operations.
```

Rules:

```txt
- not too luxury
- not too dark/gold everywhere
- gold used sparingly
- no casino/glow-heavy SOS
- no fake metrics
- no unclear money state
- one screen = one main action
- logo is signature, not decoration
```

Color intent:

```txt
Core: clean light / blue / navy / trust
Accent: gold sparingly
Travel: platinum/light with premium accents
B2B/Hub/Local: navy/gold accents but not overload
SOS: red and distinct
```

---

# 15. Super App Lite Roadmap

## Phase 0 — Architecture Lock

```txt
Mini-App Registry
CTA Resolver
Smart Trio i18n Architecture
Travel Dual-Direction Architecture
Local Commerce Architecture
Industry Taxonomy
AI Call Assistant Architecture
```

## Phase 1 — Super App Lite

Ship:

```txt
Hub
Local basic
Booking Lite
Merchant basic
Academy Lite
Leona Lite
Travel Lite
B2B AI Receptionist Demo/Pilot
VIO display
```

Protect:

```txt
payment
broker payout
legal scan
payroll
AI full autonomy
inventory
bill printing
live token economy
```

## Phase 2 — Smart Trio + Local Commerce

```txt
market language config
customer native language booking
merchant Vietnamese dashboard
service/menu translation
booking confirmation by customer locale
```

## Phase 3 — Industry-Aware AI Receptionist

```txt
industry registry
playbooks
merchant setup by industry
demo simulator by industry
pilot request by industry
```

## Phase 4 — B2C AI Call Assistant Lite

```txt
call script
translation mode
manual ops call support
consent capture
cost cap
no production calls until ready
```

## Phase 5 — Payments / Ledger / Production Hardening

```txt
Stripe sandbox
webhook verified
ledger reconciles
manual capture
refund/dispute flow
broker payout guard
VIO liability tracking
```

## Phase 6 — Full Production Modules

```txt
AI Receptionist real calls
safe auto booking
inventory ledger
receipt draft / print job
payment intent
broker payout
Travel premium provider network
```

---

# 16. Production Cutover Rules

No feature becomes production until:

```txt
typecheck pass
lint pass
no fake payment state
no mock shown as production
tenant isolation tested
Stripe sandbox tested
webhook verified
ledger reconciles
Sentry enabled
cost cap works
auto-pause works
human fallback works
idempotency tested
error state tested
refund/chargeback scenario reviewed
admin dashboard can monitor cost and failures
```

Merchant AI Receptionist full production requires:

```txt
merchant verified
industry selected
services configured
prices configured
business hours configured
staff/capacity configured
fallback contact configured
payment account connected if payments enabled
test calls passed
booking hold/confirm tested
cost cap configured
human fallback tested
policy pack approved
```

---

# 17. Development Rules for Cursor / AI Coding

Before coding:

```txt
Read this blueprint.
Read docs/ai-context.
Read relevant audit docs.
Audit first.
Plan first.
List files to touch.
Do not code until scope is clear.
```

During coding:

```txt
Do not refactor outside scope.
Do not rewrite architecture without approval.
Do not touch Prisma/migrations/payment/auth unless task explicitly says so.
Do not use any.
Do not hardcode colors when theme tokens exist.
Do not fake payment success.
Do not show mock as production.
Do not global replace legacy names blindly.
Do not create financial side effects without ledger/cost guard.
Do not create AI tool mutation without tenant/policy/idempotency/audit.
```

After coding:

```txt
Run typecheck.
Run lint.
List changed files.
Explain behavior change.
Explain risks.
Update docs if architecture/product changed.
```

---

# 18. First P0 Code Tasks After V2

## P0.1 — Mini-App Registry + CTA Resolver

```txt
src/core/miniapps/miniAppTypes.ts
src/core/miniapps/miniAppRegistry.ts
src/core/miniapps/resolveMiniAppEntry.ts
src/components/viona/MiniAppStatusBadge.tsx
src/components/viona/MiniAppGateSheet.tsx
```

Goal:

```txt
Không còn nút bấm xong bị trả về Tổng quan vô lý.
Mọi mini-app có status rõ.
```

## P0.2 — Smart Trio Foundation

```txt
src/core/i18n/smartTrioTypes.ts
src/core/i18n/smartTrioConfig.ts
src/core/i18n/resolveSmartTrioLocale.ts
src/core/markets/marketLanguageConfig.ts
```

Goal:

```txt
Vietnamese + English + native local language by market.
```

## P0.3 — Industry Registry

```txt
src/core/industries/industryTypes.ts
src/core/industries/industryRegistry.ts
src/core/industries/aiReceptionistIndustryPlaybooks.ts
```

Goal:

```txt
B2B chọn ngành nghề.
Lễ Tân AI hiểu ngành nghề.
Không hard-code nail/spa/restaurant.
```

## P0.4 — Travel Direction Selector

```txt
Travel mode:
- Người Việt đi nước ngoài
- Đến Việt Nam
- Về Việt Nam
```

## P0.5 — B2C AI Call Assistant Architecture/UI Lite

```txt
AI gọi hộ / đặt lịch hộ / phiên dịch cuộc gọi.
No real production call yet.
Consent + script + manual ops first.
```

---

# 19. Final North Star V2

Every VIONA decision must answer:

```txt
1. Does this help Vietnamese abroad survive, connect, work, and do business?
2. Does this remove language barriers?
3. Does this help local/native customers use Vietnamese businesses?
4. Does this help foreigners in Vietnam travel and experience safely?
5. Does this create income for merchants, students, brokers, local helpers, or creators?
6. Does this preserve the mini-app super app vision?
7. Does this avoid fake production behavior?
8. Does this avoid uncapped AI/server/payment cost?
9. Does this protect tenant data?
10. Does this keep VIONA financially profitable or at least cost-capped?
11. Does this move VIONA closer to real market launch?
```

If a feature is visionary but risky:

```txt
Do not delete it.
Do not fake it.
Convert it to Lite / Beta / Demo / Pilot / Coming soon.
Add feature flag.
Add safety guard.
Add monetization/cost guard.
Ship in controlled layers.
```

---

## Kết luận

**V2 đã mở đúng tầm nhìn của VIONA** — từ “super app cho người Việt” thành **Global Vietnamese Companion OS**: bảo hộ, xóa rào cản ngôn ngữ, giúp người Việt kinh doanh, giúp người bản địa đặt dịch vụ Việt, giúp khách quốc tế đến Việt Nam yên tâm hơn, và tạo income loop cho tiểu thương/sinh viên/broker/local helper.
