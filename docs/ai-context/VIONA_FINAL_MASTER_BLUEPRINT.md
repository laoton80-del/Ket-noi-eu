# VIONA FINAL MASTER BLUEPRINT

## 0. Purpose

This document is the single source of truth for VIONA.

Every AI agent, developer, reviewer, Cursor session, Claude session, Gemini session, or ChatGPT session must align with this blueprint before making product, architecture, monetization, UI, AI, payment, or database decisions.

If any task conflicts with this document, pause and ask for confirmation.

VIONA must not drift into a narrow booking app, a generic AI chatbot, a travel-only app, or a luxury-only concept.

VIONA is a super app implemented as a mini-app platform.

---

## 1. Non-Negotiable Identity

### Brand

- Public brand name: **VIONA**
- Domain infrastructure: **vionaio.com**
- Legacy names:
  - ViGlobal
  - Kết Nối Global
  - KNG
- Public points / credits name:
  - **VIO Points**
  - **VIO Credits**
- Legacy internal token name:
  - VIG may remain internally until a controlled migration is planned.

### Public Display Rules

- Public UI must say **VIONA**, not ViGlobal, KNG, or Kết Nối Global.
- Public UI must say **VIO Points** or **VIO Credits**, not VIG Token.
- VIO is not crypto in MVP.
- VIO is not withdrawable cash.
- VIO is loyalty / internal credits unless a future regulated financial layer is approved.
- Do not globally replace internal VIG fields, database enums, or transaction types without a dedicated migration plan.

### Tagline

**Connect. Survive. Thrive.**

### Core Positioning

VIONA is the Global Vietnamese Network.

VIONA serves two major audiences:

1. Vietnamese people living abroad:
   - survival
   - language
   - business
   - community
   - booking
   - merchant tools
   - B2B AI automation

2. Foreigners traveling to Vietnam:
   - safe travel
   - translation
   - local fixer
   - experiences
   - concierge
   - cultural support

VIONA is not only:
- a booking app
- an AI chatbot
- a travel app
- a wallet app
- an academy app

VIONA is a mini-app platform and closed-loop digital economy for Vietnamese worldwide and Vietnam inbound travelers.

---

## 2. Core Vision

VIONA preserves the original super app vision:

- A Digital Nation for Vietnamese abroad.
- A Gateway to Vietnam for foreigners.
- A survival layer with SOS, translation, emergency guidance, law/tax/community information.
- A business layer with merchants, booking, AI receptionist, B2B SaaS, broker growth.
- A travel layer with Vietnam inbound travel, local fixer, safety, translation, experiences.
- An education layer with Vietnamese language, family learning, and AI tutor.
- A monetization layer with B2B SaaS, usage-based AI, transaction fees, travel commission, academy subscription, broker performance, and VIO loyalty.
- A financial safety layer with no uncapped costs, no fake payment state, no fake AI production state, and no financial side effect without policy/tool/ledger guardrails.

The app must feel useful immediately, but it must also clearly show that it can expand into a real super app.

---

## 3. Architecture Decision

VIONA is a **Super App** implemented as a **Mini-App Platform**.

Do not build it as one giant unstructured app.

### Layer 1 — VIONA Core OS

The Core OS is shared by all mini-apps.

Responsibilities:

- Auth
- Roles
- Tenant isolation
- Brand config
- Feature flags
- App shell
- Navigation
- Smart Trio i18n
- SOS Lifeline
- Shared UI
- Shared API client
- Logging
- Sentry monitoring
- Cost firewall
- Audit log
- GDPR tools
- Notification system

### Layer 2 — Shared Business Core

Shared business domain used across mini-apps:

- Users
- Profiles
- Merchants
- Services
- Bookings
- Locations
- Reviews
- QR/manual payment status
- Broker attribution
- VIO Points
- Ledger
- AI usage tracking
- Notifications
- Merchant plans
- Usage quota
- Cost tracking

### Layer 3 — Mini-Apps

Mini-apps include:

- Hub
- Local
- Booking
- Merchant Dashboard
- B2B AI Receptionist
- Travel
- Academy
- Leona Assistant
- Minh Khang Translator
- Broker QR
- Admin / Command Center

Each mini-app must have:

- id
- name
- status
- route
- featureFlag
- requiredRole
- permissions
- data dependencies
- monetization model
- risk level
- production readiness status

Mini-apps can be:

- active
- beta
- pilot
- lite
- coming soon
- frozen

Do not delete visionary features. Convert risky features to Lite / Beta / Pilot / Coming Soon / Frozen.

---

## 4. The 4 Universes

## Universe 1 — VIONA Hub

Purpose:

The command center / LifeOS home.

Must include:

- SOS / Global Lifeline
- Dual clock: local time vs Vietnam time
- VIO Points / Credits preview
- Payment QR / wallet preview only when safe
- Survival briefing:
  - law
  - tax
  - community
  - safety
  - immigration
- Mini-app launcher
- Heart Fund / CSR counter when real
- Personalized quick actions

Rules:

- Hub must be clean, trust-first, and not overloaded.
- Above-the-fold must show only life-critical and high-value actions.
- Do not make Hub look like a crypto dashboard.
- Do not show fake payment, fake wallet, or fake token economy as production.

---

## Universe 2 — VIONA Local

Purpose:

Life and business for Vietnamese abroad.

Must include:

- Merchant directory
- Nail / spa / restaurant / barber booking
- Merchant profile
- Service menu
- Booking flow
- Merchant Dashboard basic
- B2B marketplace / wholesale later
- Expat services:
  - lawyer
  - tax
  - shipping
  - events
  - classifieds
  - hiring
  - renting

Rules:

- Local is the first major business engine.
- It must work even without AI.
- Merchant booking must not depend on mock AI.
- Merchant data must be tenant-isolated.
- Booking must not double-book staff/chair/table.
- Payment state must never be fake.

---

## Universe 3 — VIONA Travel

Purpose:

Vietnam inbound hub for foreigners and overseas Vietnamese visiting Vietnam.

Must include:

- Travel Lite first
- Safety checklist
- Translation help
- Local fixer
- Cravings Radar
- Vietnam guide
- Airport / SIM / taxi / safety guidance
- VIP / chauffeur / fast-track / tax refund only when provider/payment is real

Rules:

- Travel may open early as Travel Lite.
- Premium paid services must not pretend production if providers, payment, or operations are not ready.
- Travel must not charge for mock provider fulfillment.
- Translation and safety help may be available early with disclaimers.

---

## Universe 4 — VIONA Academy

Purpose:

Vietnamese language, culture, family learning.

Must include:

- Academy Lite first
- Vietnamese basics
- Kids/family learning
- Survival phrases
- Pronunciation practice if real
- AI teacher only if backend is real
- Leaderboard/certificates later

Rules:

- Academy should open early because it is a core differentiator.
- If AI grading, camera grading, certificates, or emotional tutor are not production-ready, label them Lite/Beta.
- Do not promise official certification unless approved.
- Do not show mock AI teacher as production.

---

## 5. Global Lifeline / SOS

Global Lifeline is a core safety feature.

It should exist across:

- B2C
- B2B
- Broker
- Travel
- Local

It may be excluded or simplified in Academy if not relevant.

Rules:

- Use 3-second hold-to-trigger to avoid accidental activation.
- Must not fake emergency response.
- Must clearly guide user to:
  - local emergency numbers
  - embassy
  - trusted contacts
  - location sharing
  - emergency phrases
- AI may assist with distress language but must not replace authorities.
- SOS should not be hidden just because Travel is disabled.
- If SOS is demo-only, label clearly.
- Do not charge for emergency/survival basics.

---

## 6. The AI Personas

## AI Minh Khang — Vision & Voice / Travel

Purpose:

- Real-time translation
- Menu/sign/document scanning
- Travel survival
- Voice-to-voice helper

Allowed:

- Translation
- Cultural explanation
- Travel assistant
- Document/menu scan with disclaimer

Not allowed without production approval:

- Final legal advice
- Final medical advice
- Paid legal scan that charges VIO while using mock output
- Guaranteed document interpretation

---

## AI Leona — B2C Concierge

Purpose:

- Travel/expat concierge
- Emotional support
- Survival guidance
- Translation helper
- AI assistant/call lite

Allowed early:

- Leona Assistant Lite
- Leona Call Lite if real and clearly labeled
- Travel / expat help
- General guidance
- Survival phrase help

Not allowed:

- Pretending to be lawyer/doctor
- Handling emergency instead of authorities
- Charging for mock answers
- Making guaranteed promises
- Final decisions in high-risk domains

---

## Lễ Tân AI — B2B Phone Receptionist

Purpose:

Flagship business mini-app for merchants.

Long-term production goal:

- AI answers real calls
- AI speaks naturally like a receptionist
- AI books appointments
- AI handles multilingual customers
- AI checks services, hours, staff, inventory
- AI creates booking/order
- AI can trigger bill/print/payment flows through safe tools

Critical rule:

AI may speak like a receptionist, but AI must not directly write DB, charge money, reduce inventory, print bills, or confirm risky actions without:

- Policy Engine
- Tool Gateway
- Tenant Check
- Idempotency
- Audit Log
- Cost Firewall

---

## Cô Giáo AI — Academy Tutor

Purpose:

- Vietnamese tutor
- Pronunciation help
- Kids/family mode
- Culture learning

Allowed early:

- Lite/Beta learning
- Practice
- Simple quizzes
- Guided lessons

Not allowed without readiness:

- Official certification
- High-stakes grading
- Camera grading if not production
- Guaranteed pronunciation scoring

---

## 7. B2B AI Receptionist Full Production Principle

AI Receptionist is a flagship revenue engine.

Do not freeze it completely.

Do not open it recklessly.

It must be built as:

Voice Layer  
→ AI Brain Layer  
→ Policy Layer  
→ Business Automation Layer  
→ Finance & Cost Control Layer

### Production Call Flow

Customer calls merchant number  
→ Twilio / phone gateway  
→ tenant resolved by DID  
→ call session created  
→ AI answers  
→ detects language and intent  
→ checks merchant config  
→ proposes tool call  
→ Policy Engine validates  
→ Tool Gateway executes safely  
→ booking/payment/inventory/bill state updated only through backend  
→ transcript/audit log saved  
→ merchant notification/dashboard updated

### AI Must Never Write Database Directly

All mutations must pass:

- schema validation
- tenant check
- role/permission check
- idempotency key
- policy engine
- audit log
- cost firewall
- monitoring

### Allowed Production Actions Only If All Rules Pass

- answer FAQ
- quote configured prices only
- create booking hold
- confirm booking if auto-confirm allowed
- create booking request if uncertain
- reserve inventory via stock ledger
- create receipt draft
- create print job
- create payment intent / pre-auth through approved payment tool

### Not Allowed

- arbitrary discounts
- legal/medical advice
- booking outside business hours unless policy allows
- price outside merchant config
- payment outside Stripe-approved flow
- cross-merchant data access
- refund/chargeback decisions without policy/human approval
- payroll automation without payroll production gate

---

## 8. Financial Fortress

Payment rules:

- Stripe Connect preferred.
- Base currency: EUR unless local market requires controlled exception.
- Stripe Tax/Invoicing where applicable.
- Pre-authorization / manual capture for booking deposit or no-show protection.
- Webhook is source of truth.
- Client state is never source of truth for PAID.
- No fake payment success state.
- No payout before settlement.
- No broker payout before settlement and reserve.
- No platform payout if ledger does not reconcile.

### Dual Split-Fee

- Merchant/provider fee may be 3–5% for essential local booking.
- Tourist/customer trust fee may be 5–7% for higher-risk travel/premium services.
- Fees should be dynamic by category, not blindly applied to every essential service.
- Essential services must feel fair.
- Premium/travel/AI-shield services can carry higher fee.

### Ledger

Must support:

- platform revenue
- merchant payable
- broker payable
- provider cost
- AI/Twilio/server cost
- tax liability
- refund reserve
- chargeback reserve
- VIO liability
- payouts
- refunds
- disputes

---

## 9. Zero-Loss Monetization Engine

Core rule:

No production feature may run without:

- revenue source
- cost cap
- margin rule
- quota
- ledger
- monitoring
- auto-pause

Never sell unlimited AI.

Every AI/voice/vision/translation feature must have:

- included usage
- overage price
- hard cap
- model router
- provider cost tracking
- auto-pause
- upgrade prompt

### Revenue Streams

1. B2B SaaS
2. AI Receptionist minutes
3. Merchant booking fee
4. Travel service commission
5. Leona / Minh Khang AI credits
6. Academy subscription
7. Broker performance payout
8. Merchant visibility boost
9. Setup/onboarding fee
10. VIO loyalty loop

### B2B AI Receptionist Pricing

- Free Demo: limited demo calls, no production booking
- Starter: booking/request intake, limited AI minutes
- AI Intake: AI receives calls, merchant confirms
- Power: auto-booking by rule, included minutes
- Pro: inventory, print, payment, multi-staff
- Enterprise: multi-location, custom SLA

Every plan must define:

- monthly price
- included minutes
- overage price
- maximum monthly cap
- automation level
- margin guard
- auto-pause behavior

### Consumer Pricing

- Free: Hub, Local basic, SOS, Academy basic
- VIONA Plus: Leona/translator/Academy credits
- Travel Pack: travel concierge and translation pack
- Academy Family: family learning
- AI Credits: prepaid for voice/vision/premium AI

### Broker Payout

- only from net platform revenue
- never from gross
- delayed until settlement
- capped
- clawback for refund/fraud
- attribution decay over time
- no infinite uncapped payout

### VIO Points

- VIO Points / VIO Credits are loyalty/credits
- not crypto
- not withdrawable
- expirable
- redeem cap
- liability tracking required
- never issue VIO without margin source

---

## 10. Cost Firewall

Cost Firewall must track:

- OpenAI cost
- Gemini cost
- Twilio cost
- SMS/email cost
- server cost
- storage cost
- payment fee
- support cost
- broker payout
- refund reserve
- chargeback reserve

AI usage must track:

- merchantId
- userId if applicable
- callSessionId
- model
- input tokens
- output tokens
- audio seconds
- vision requests
- provider cost
- billed amount
- margin

If margin turns negative:

- downgrade model
- use cached FAQ
- shorten call
- switch to intake-only
- ask merchant to upgrade
- pause automation
- alert admin

---

## 11. Model Router

Do not use expensive models for everything.

Use:

- cache for FAQ
- small/cheap model for intent classification
- realtime voice model for live calls
- premium model only for complex cases
- vision model only when camera/document scan is needed
- fallback model on outage or cost pressure

Model selection must consider:

- task risk
- user plan
- merchant plan
- monthly quota
- current margin
- latency requirement
- language requirement

---

## 12. Security / Compliance / Trust

Must enforce:

- Prompt Armor
- Tool Armor
- tenant isolation
- audit logs
- GDPR tools
- Sentry monitoring
- webhook verification
- idempotency
- no hardcoded secrets
- no any types
- no fake production state

### Prompt Armor

AI must not:

- reveal system prompt
- ignore business policy
- invent discounts
- invent prices
- access another merchant’s data
- handle payment outside approved tools
- give final legal/medical advice
- book outside policy
- claim certainty when uncertain

### Tool Armor

Every tool call must:

- validate schema
- check tenant
- check permissions
- check idempotency
- log action
- return typed result
- fail closed

### Tenant Isolation

Every merchant query must include tenant/merchant ownership checks.

No cross-merchant lookup.

No findUnique by id alone for tenant data unless ownership is verified.

---

## 13. UI / Brand / Design System

VIONA UI direction:

- Clean Tech Trust UI for core app
- Not too luxury
- Not too dark/gold everywhere
- Premium brand layer only where appropriate
- Logo is signature, not decoration

Color:

- Core: clean light / blue / navy / trust
- Accent: gold used sparingly
- Travel may use platinum/light mode
- B2B/Hub/Local may use navy/gold accents but not overload
- SOS always red and distinct

Design principles:

- Trust first
- Speed first
- Progressive premium
- Mobile-first
- No visual clutter
- One screen = one main action
- No fake metrics
- No unclear money state

---

## 14. Mini-App Status Strategy

### Active / Open

- Hub
- Local
- Booking
- Merchant Dashboard basic
- Academy Lite
- Leona Assistant Lite
- Travel Lite
- B2B AI Receptionist Demo / Pilot / Production when gates pass

### Controlled / Gated

- B2B AI Receptionist production actions by sub-flags
- VIO Points display
- Broker QR basic
- AI voice/call
- Travel paid services

### Frozen Until Safe

- Paid legal scan if output is mock
- Payroll production
- Full broker commission engine if ledger not ready
- Real token economy
- Live payment if Stripe webhook/reconciliation not verified
- Admin/KOL/Omni fake metrics
- Outbound AI cold calling if compliance/consent not ready

Do not hide important differentiators forever.

Instead, convert them to:

- Lite
- Beta
- Demo
- Pilot
- Coming soon

with clear safety labels.

---

## 15. Growth Engine

### Broker QR

- brokers/students/drivers/community connectors generate QR
- QR attribution creates merchant/user growth loop
- payout only from net revenue
- no unlimited lifetime payout without cap/decay
- no payout before settlement

### Merchant Launch Boost

Replace “90-Day Trap” language with **90-Day Launch Boost**.

Rules:

- first 90 days: visibility boost
- day 75: transparent notice
- day 90: choose Free / Power Visibility
- no surprise lock
- no predatory UX

### Outbound AI Sales

Can be powerful but must follow local laws and consent rules.

Do not launch production cold-calling without compliance review.

### Flyer / Deep Links

Use deep links to demo VIONA value.

Do not bypass spam rules illegally.

Use attribution and consent.

---

## 16. Production Cutover Rules

No feature becomes production until it passes:

- typecheck pass
- lint pass
- no fake payment state
- no mock shown as production
- tenant isolation tested
- Stripe sandbox tested
- webhook verified
- ledger reconciles
- Sentry enabled
- cost cap works
- auto-pause works
- human fallback works
- idempotency tested
- error state tested
- refund/chargeback scenario reviewed
- admin dashboard can monitor cost and failures

Merchant AI Receptionist full production requires:

- merchant verified
- services configured
- prices configured
- business hours configured
- staff/capacity configured
- fallback contact configured
- payment account connected if payments enabled
- test calls passed
- booking hold/confirm tested
- cost cap configured
- human fallback tested
- policy pack approved

---

## 17. Development Rules For Cursor / AI Coding

Before coding:

1. Read this blueprint.
2. Read docs/ai-context.
3. Read relevant audit docs.
4. Audit first.
5. Plan first.
6. List files to touch.
7. Do not code until scope is clear.

During coding:

- Do not refactor outside scope.
- Do not rewrite architecture without approval.
- Do not touch Prisma/migrations/payment/auth unless task explicitly says so.
- Do not use any.
- Do not hardcode colors when theme tokens exist.
- Do not fake payment success.
- Do not show mock as production.
- Do not global replace legacy names blindly.
- Do not create financial side effects without ledger/cost guard.
- Do not create AI tool mutation without tenant/policy/idempotency/audit.
- Do not bypass feature flags.

After coding:

- Run typecheck.
- Run lint.
- List changed files.
- Explain behavior change.
- Explain risks.
- Update docs if architecture/product changed.

If uncertain:

Write **Needs confirmation** instead of guessing.

---

## 18. Current Execution Priority

VIONA should not become a narrow booking-only app.

VIONA should become a **Super App Lite first**, then full production.

Super App Lite should expose:

- Hub
- Local
- Booking
- Merchant basic
- Academy Lite
- Leona Lite
- Travel Lite
- B2B AI Receptionist Demo/Pilot
- VIO Points display

But still protect:

- payment
- broker payout
- legal scan
- payroll
- AI full autonomy
- inventory
- bill printing
- live token economy

with feature flags, policy engine, and zero-loss rules.

---

## 19. Final North Star

Every decision must answer:

1. Does this help Vietnamese abroad survive, connect, and do business?
2. Does this help foreigners in Vietnam travel and experience safely?
3. Does this preserve the mini-app super app vision?
4. Does this avoid fake production behavior?
5. Does this avoid uncapped AI/server/payment cost?
6. Does this protect tenant data?
7. Does this keep VIONA financially profitable or at least cost-capped?
8. Does this move VIONA closer to a real market launch?

If a feature is visionary but risky:

- do not delete it
- do not fake it
- convert it to Lite / Beta / Pilot / Coming soon
- add feature flag
- add safety guard
- add monetization/cost guard
- ship it in controlled layers

---

## 20. Final Execution Formula

VIONA must follow this formula:

Super App Vision  
+ Mini-App Platform  
+ Super App Lite Launch  
+ Zero-Loss Monetization  
+ AI Tool Guardrails  
+ Tenant Isolation  
+ Feature Flags  
+ Production Cutover Checklist  
= Market-ready VIONA

End of Blueprint.
