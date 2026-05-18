# VIONA OPERATING PROTOCOL

**Document type:** Operating charter — engineering, product, and AI/agent execution rules for the VIONA repository and ecosystem.  
**Audience:** Humans (staff, contractors, vendors) and AI coding agents operating on this codebase.  
**Relationship:** Subordinate to **Master Blueprint** (`VIONA_FINAL_MASTER_BLUEPRINT_V2.md` or successor). If this protocol conflicts with a **founder-signed** blueprint clause, **blueprint wins**.

---

## 1. Purpose

Ensure VIONA advances as **Global Vietnamese Companion OS** implemented as a **Super App / Mini-App Platform**, with **trust**, **financial safety**, **tenant safety**, and **honest product state** — without accidental drift into a single-vertical app, demo theater, or runaway AI/payment cost.

Named strategic surfaces in this protocol include **SOS / Global Lifeline / SOS Plus** (global safety layer for Vietnamese people worldwide — not Europe-only, not Vietnam-only unless an explicit market filter applies) and **B2B Wholesale / E-shop Import** (merchant commerce engine for wholesale and catalog import — not a fake production marketplace).

### 1.1 Global Active / Full standard (product vision)

**Target state:** VIONA is **Active / Full globally** for the **entire app**, across **all markets**. This is the north-star product scope — not a regional demo, not a “Lite app for CZ only,” and not a permanent subset of universes.

| Principle | Rule |
|-----------|------|
| **Global scope** | All VIONA universes and mini-apps are **intended to be available globally**; every market is **in scope** for the full platform vision. |
| **No strategic demo-only market** | No country or region is strategically classified as “demo-only” or “out of product scope.” Gaps in locale files, ops, payment rails, or legal readiness are **implementation progress**, not a reduced product definition. |
| **Full core app** | The global target includes: **Home / LifeOS**, **SOS / Global Lifeline**, **Travel**, **Local**, **Academy**, **Account / Profile**, **VIO Loyalty**, **AI Companion**, **Business / Merchant**, **B2B Wholesale / E-shop Import**, **Income / Broker / Community loops**, and the **Smart Trio** language layer. |
| **Internal readiness labels only** | **Lite**, **Pilot**, **Demo**, **Gated**, **Beta**, and **Coming Soon** describe **internal** safety, legal, ops, payment, AI-cost, and fulfillment readiness — they **must not** be read as “VIONA is only a partial product in this market.” |
| **Public direction** | External and investor-facing direction: **global full platform**. Internal gates control **when** a surface may claim live behavior — not **whether** the surface belongs in VIONA globally. |

**No-fake production boundary (unchanged by Active/Full):** Pursuing Active/Full globally **does not** permit fake or implied-live outcomes. The following remain forbidden unless backed by verified systems, legal review, and ops:

- emergency dispatch or “authorities contacted”
- GPS/location sharing to VIONA or third parties without explicit consent and implementation
- payment captured / booking confirmed / refund guaranteed / payout or cash-out
- official certification or accredited assessment claims
- supplier fulfillment, inventory, or delivery promises without source-of-truth data
- AI phone calling or autonomous booking/payment without approved gates
- verified identity, provider, or merchant status when unverified

**Locale strategy (implementation, not vision):** Bundled locale JSON and partial translation coverage are **implementation artifacts**. Missing native locale for a market **does not** remove that market from global scope; **English bridge + Vietnamese + safety-critical local bundles** may support early operation until **full native-language support by market** is reached.

**Canonical lock doc:** `docs/audit/VIONA_GLOBAL_ACTIVE_FULL_STANDARD_LOCK_1.md` (`VIONA.GLOBAL_ACTIVE_FULL_STANDARD_LOCK.1`).

---

## 2. Twelve mandatory roles (collective accountability)

These roles must exist as named accountability on every release wave that touches money, identity, AI telephony, or merchant-facing surfaces. One person may wear multiple hats **only** if explicitly documented for that wave.

| # | Role | Charter (what “done” means) |
|---|------|-----------------------------|
| 1 | **Executive Sponsor / Founder Delegate** | Owns north-star trade-offs (Companion OS vs vertical creep); resolves cross-functional disputes; signs commercial posture. |
| 2 | **Chief Product Officer (CPO) Surface Owner** | Owns universe/mini-app UX truth: users never confuse **demo/pilot/live**; IA matches blueprint universes. |
| 3 | **Principal Architect** | Owns layering: Core OS / Shared Business Core / Mini-Apps; prevents architectural drift and “silent routing.” |
| 4 | **Core Platform Lead** | Owns registry/resolver/gates patterns, shell navigation integrity, feature-flag semantics consistency. |
| 5 | **Mini-App Owner (per vertical)** | Owns end-to-end truth for one universe (Hub/Local/Travel/Academy/B2B/etc.) including readiness labels and CTAs. |
| 6 | **Trust & Safety Lead (Product + UX)** | Owns SOS integrity (no fake emergency outcomes), abuse/spam surfaces, misleading CTAs, safety copy. |
| 7 | **AI Safety & Production Reliability Lead** | Owns AI cost firewall posture, model/tool boundaries, incident loops for AI outages and misbehavior. |
| 8 | **Security & Tenant Isolation Lead** | Owns authz correctness, cross-tenant forbidden paths, secrets posture, webhook verification expectations. |
| 9 | **Payments & Ledger Integrity Owner** | Owns money movement truth: webhook SoT, idempotency discipline, reconciliation mindset, “no fake paid.” |
| 10 | **Operations / Incident Commander** | Owns runbooks, on-call expectations for pilots, lead intake triage, smoke evidence before demos/pilots. |
| 11 | **Compliance & Privacy Owner** | Owns GDPR posture, consent/recording disclaimers where applicable, data minimization for pilots. |
| 12 | **Release Train / QA Gate Owner** | Owns “definition of ready” per gate (internal demo / pilot / beta / launch); blocks promotion on failed checks. |

---

## 2.13 SOS / Global Lifeline Safety Product Lead

**Responsibilities:**

- protect SOS as a global safety layer for Vietnamese people worldwide
- ensure SOS is not Europe-only, Vietnam-only, or market-limited unless a market filter is explicit
- distinguish clearly between:
  - SOS Basic
  - SOS Plus
  - SOS Live Automation
- prevent fake emergency response claims
- prevent fake GPS sharing claims
- prevent hardcoded emergency numbers without verified country routing
- require consent for:
  - location
  - trusted contact alert
  - audio recording
  - video recording
  - emergency call assistance
  - legal disclaimer acceptance
- require local emergency disclaimer
- require country-by-country routing matrix before showing specific emergency numbers
- require human/legal/compliance review before live calling, recording, dispatch, or automated routing

**Primary question:**

> Does this make users safer globally without pretending VIONA replaces local emergency services?

---

## 2.14 B2B Wholesale / E-shop Import Commerce Architect

**Responsibilities:**

- protect B2B wholesale and e-shop import as a real merchant commerce engine
- support Vietnamese merchants importing products from wholesale suppliers into their online shops
- support Vietnamese wholesalers selling to merchants through structured B2B catalogs
- ensure supplier catalogs, SKUs, prices, MOQ, stock, shipping, VAT, and return policies are not faked
- prevent fake inventory, fake supplier availability, fake delivery promise, fake wholesale pricing, or fake checkout success
- require review/approval before AI imports products into a live shop
- require product compliance checks for restricted categories
- require margin, ledger, commission, settlement, refund, and chargeback awareness
- ensure Smart Trio language support:
  - supplier language
  - merchant operating language
  - customer-facing language

**Primary question:**

> Does this help Vietnamese wholesalers and merchants trade globally without inventory, payment, or compliance risk?

---

## 3. Ten non-negotiable rules

1. **Blueprint supremacy (within signed scope).** Shipping decisions that change positioning (Companion OS vs vertical-only product), liability posture, or commercial promises must align with the **current signed Master Blueprint** (or an explicit amendment process).

2. **No fake production state.** UI must not imply **paid success**, **confirmed booking**, **live SOS resolution**, or **production AI outcomes** unless the backing systems and operations are truly in that mode.

3. **Honest labeling for maturity.** Surfaces that are **Demo / Lite / Pilot / Gated / Beta / Coming Soon** must be labeled accordingly in UX and docs; “pretty UI” must not obscure truth. These labels are **internal readiness and safety gates** (see §1.1) — they control what behavior may be claimed **now**, not whether the universe or market is in VIONA’s global product scope.

4. **Tenant isolation is mandatory.** No cross-merchant access paths; administrative shortcuts require explicit audited mechanisms.

5. **Money moves only through governed rails.** Payment/settlement/booking financial truth follows server rules + webhook/idempotency discipline as designed for the deployment — never “client-side truth.”

6. **AI cannot silently mutate protected domains.** No silent mutation of **inventory, bills, payroll, or payment state** by AI agents/tools without explicit approved automation gates.

7. **Cost firewall is mandatory for AI/telecom.** Usage must be trackable and constrained by policy (caps, auto-pause/downgrade paths) before scaling pilots.

8. **Zero-loss monetization mindset.** Revenue mechanics must not assume infinite subsidy; broker/payout/growth loops must respect net revenue, caps, clawback, and settlement delays per blueprint economics.

9. **Scope discipline on repo changes.** Avoid unrelated refactors during incident/hotfix windows; avoid “drive-by” expansions that violate mini-app boundaries.

10. **Documentation precedes ambiguous commercial steps.** Material pilot/beta expansions require updated runbooks/checklists and owner assignment **before** widening audience.

---

## 4. Operating mechanics (lightweight)

### 4.1 Change classes

- **Class A — Safe UI/copy/i18n:** low risk if no routing/money/auth semantics change.  
- **Class B — Routing/registry/gates:** requires Architect + Core Platform review.  
- **Class C — Money/identity/AI telephony:** requires Payments/Tenant/AI Safety review and explicit approval path.

### 4.2 Escalation

Unresolved conflicts between Product and Engineering escalate to **Executive Sponsor**. Conflicts involving legal/regulatory claims escalate to **Compliance & Privacy Owner** + Sponsor.

---

## 5. Agent-specific instruction (Cursor / automation)

Agents working in this repository must:

- Prefer **audit-first** when scope is ambiguous commercial readiness.
- Never **mock production** financial outcomes.
- Never bypass explicit **“do not touch”** lists when provided by the operator.
- Produce **evidence-first** reports (commands/logging outputs) when verifying readiness.

---

## 6. Document control

| Field | Value |
|-------|--------|
| Canonical path | `docs/ai-context/VIONA_OPERATING_PROTOCOL.md` |
| Updates | Revision PR with reason; notify Release Train Owner for gate-impacting edits |
| Related locks | `docs/audit/VIONA_GLOBAL_ACTIVE_FULL_STANDARD_LOCK_1.md` — global Active/Full target vs internal readiness labels; `docs/design/VIONA_DESIGN_MODE_LOCK.md` — dark product UI vs light presentation-only |

---

## 10.5 SOS / Global Lifeline Universe

SOS is part of Hub / LifeOS.

SOS must serve:

- Vietnamese people abroad worldwide
- Vietnamese travelers crossing countries
- overseas Vietnamese returning to Vietnam
- Vietnamese families who need urgent support
- vulnerable users who may not speak the local language
- merchants or staff in urgent situations

SOS must not be positioned as Europe-only.

### SOS product layers

#### SOS Basic

**Status:**

- Lite / Active safety entry

**Allowed:**

- pre-login SOS entry
- red SOS button
- hold 3 seconds to confirm
- safety guidance
- local emergency disclaimer
- categories:
  - Medical / Ambulance
  - Police
  - Fire
  - Trusted contact
  - Report scam
  - Embassy / consulate help
- native dialer handoff if user explicitly confirms and the platform supports it
- generic local emergency guidance

**Not allowed:**

- fake dispatch
- fake GPS sharing
- fake safety response team
- fake AI shield active
- fake recording
- fake Twilio call
- fake police/fire/ambulance call

#### SOS Plus

**Status:**

- Pilot / Gated until payment, consent, legal, and routing are production-ready

**Price:**

- public planned price: 4,99 €/month or localized equivalent
- Vietnamese copy: 4,99 €/tháng

**Allowed:**

- product surface
- subscription positioning
- consent profile
- trusted contacts
- emergency country / region preference
- language preference
- legal disclaimer timestamp
- planned voice keyword copy
- planned location-aware guidance copy
- planned consent-based recording copy
- planned trusted contact alert copy

**Not allowed until implemented:**

- real Stripe success state
- real entitlement unlock without webhook/server truth
- real Twilio call
- real emergency dispatch
- real recording
- real video recording
- background listening
- automated police/fire/ambulance calling
- claiming response team is watching

**Required copy:**

> VIONA SOS does not replace local emergency services. If you are in immediate danger, call your local emergency number directly.

#### SOS Live Automation

**Status:**

- Pilot only, country-by-country

**Required before activation:**

- verified country emergency routing matrix
- local legal review
- consent flow
- recording notice where required
- payment entitlement if Plus-only
- cost cap
- audit log
- call/session log
- fallback path
- failure disclaimer
- trusted contact rules
- emergency limitation disclaimer
- manual ops or human fallback where needed

**Live automation may include only after approval:**

- Twilio or equivalent call provider
- trusted contact calling
- operator calling
- local emergency number handoff
- audio recording
- video recording
- location sharing
- voice keyword detection

**Hard rule:**

Country-specific emergency numbers must not be displayed as production truth unless verified by country routing matrix.

**Global fallback copy:**

**EN:**

> Call your local emergency number directly if you are in immediate danger.

**VI:**

> Nếu đang gặp nguy hiểm ngay lập tức, hãy gọi trực tiếp số khẩn cấp địa phương.

---

## 10.6 B2B Wholesale / E-shop Import Universe

B2B Wholesale / E-shop Import belongs to Merchant / Business / Local Commerce.

**Purpose:**

- help Vietnamese wholesalers sell to merchants
- help Vietnamese merchants import products into their e-shop
- help local/native customers buy from Vietnamese merchant shops
- help shops operate across language barriers
- create a B2B commerce layer beyond bookings and services

**User personas:**

- Vietnamese wholesale supplier
- Vietnamese merchant / shop owner
- salon/spa owner buying stock
- restaurant/café owner buying ingredients or goods
- retailer importing catalog products
- local helper / broker / sourcing agent
- admin / ops reviewer
- customer buying from the merchant storefront

**Core concepts:**

- Supplier
- Merchant
- B2B catalog
- Product import
- SKU mapping
- MOQ
- wholesale tier price
- retail price
- margin
- stock availability
- lead time
- shipping method
- VAT/invoice
- return policy
- restricted category
- e-shop listing
- import review queue
- fulfillment status
- settlement
- dispute / chargeback

**Required product states:**

- draft
- imported
- needsReview
- approved
- published
- outOfStock
- paused
- blocked
- archived

**Required supplier states:**

- unverified
- pendingReview
- verified
- pilot
- suspended
- blocked

**Allowed early:**

- CSV / spreadsheet product import
- supplier catalog preview
- AI-assisted product title/description translation
- AI-assisted category mapping
- merchant review before publish
- manual price/margin input
- draft e-shop listings
- local demo catalog
- pilot supplier onboarding

**Not allowed without production readiness:**

- fake supplier verification
- fake stock availability
- fake MOQ
- fake delivery date
- fake wholesale price
- fake payment success
- fake order fulfillment
- fake invoice/VAT
- fake refund/return policy
- AI publishing products without merchant review
- AI changing prices without approval
- AI placing supplier orders without policy/tool/audit
- shipping promises without provider readiness
- cross-tenant catalog access

**Product import flow:**

1. Supplier catalog source is selected.
2. Product data is parsed.
3. Product data is normalized.
4. AI may suggest translation/category/content.
5. Merchant reviews every imported product.
6. Merchant confirms price, margin, tax, shipping, visibility.
7. Policy engine checks category and restricted goods.
8. Product becomes approved draft.
9. Merchant publishes to e-shop.
10. Orders use real payment/order source of truth.
11. Fulfillment and settlement are tracked.
12. Refund/chargeback rules apply before payout.

**Required AI restrictions:**

- AI can suggest import mapping.
- AI can translate product descriptions.
- AI can detect possible category/risk.
- AI can suggest retail price only as guidance.
- AI must not publish, order, pay, refund, change stock, or change price without approved tool flow.
- AI must not claim supplier availability unless source data is verified.

**Required compliance checks:**

- prohibited goods
- age-restricted goods
- medicine / prescription goods
- supplements / health claims
- cosmetics safety
- food safety
- alcohol / tobacco
- weapons / knives
- counterfeit goods
- trademark/IP risk
- import/export restrictions
- VAT/invoice requirements
- platform policy restrictions

**Restricted categories must be:**

- blocked
- or pilot/manual review only
- never automatically imported to live shop

**Monetization models:**

- merchant SaaS plan
- supplier listing fee
- B2B transaction commission
- import concierge fee
- AI catalog import credit
- premium translation/content package
- broker/sourcing referral commission

**Zero-loss requirements:**

- no payout before settlement
- commission from net revenue only
- refund/chargeback reserve
- supplier payout rules
- broker payout capped and clawback-safe
- AI import usage quota
- storage/image processing cost cap
- manual review cost priced into plan or fee

**Smart Trio requirements:**

- supplier catalog language may be Vietnamese, English, Czech, German, French, etc.
- merchant operating language may be Vietnamese
- customer storefront language must support local/native customer language where market requires
- AI translation must be reviewable
- original supplier data must remain traceable

**Feature status rules:**

- If product import works only locally: demo
- If merchant can import drafts but not sell: pilot
- If sell flow has payment but no supplier automation: beta
- If real supplier orders and fulfillment are integrated: active
- If category/legal risk unresolved: gated or frozen

**Hard rule:**

B2B Wholesale / E-shop Import must never look like a live marketplace if inventory, payment, supplier fulfillment, or compliance is not real.

---

## 11.6 AI Rules for B2B Wholesale / E-shop Import

**AI may:**

- parse product spreadsheets
- normalize product titles
- translate product descriptions
- suggest categories
- suggest tags
- suggest SEO text
- detect duplicate SKUs
- detect missing MOQ/price/stock fields
- detect possible restricted categories
- draft supplier/merchant messages
- draft customer-facing product copy

**AI must not directly:**

- publish products
- change inventory
- change price
- create paid supplier order
- mark order as fulfilled
- issue refund
- promise delivery
- approve restricted goods
- create invoice
- send legally binding supplier agreement
- write DB directly

**Every AI-assisted import action must pass:**

- tenant check
- merchant ownership check
- supplier permission check
- product policy check
- category risk check
- review/approval gate
- audit log
- idempotency
- cost firewall

---

## 14.1 B2B Wholesale Financial Fortress Rules

For B2B Wholesale / E-shop Import:

**Never allow:**

- supplier payout before settlement
- broker/referral payout from gross revenue
- fake paid supplier order
- fake invoice
- fake inventory
- fake delivery tracking
- fake stock sync
- margin-negative product listing without warning
- VIO reward issuance without margin source

**Required:**

- order source of truth
- payment source of truth
- supplier settlement status
- merchant margin calculation
- tax/VAT fields
- refund reserve
- chargeback reserve
- shipping cost rule
- import cost rule
- supplier payout ledger
- broker payout ledger if broker exists

**If data is missing:**

- show Needs review
- do not publish as production-ready
- do not allow automated checkout if fulfillment is not ready

---

## 15.1 Zero-Loss Rules for Catalog Import AI

Every AI catalog import must have:

- import quota
- file size limit
- image processing limit
- translation token cap
- duplicate detection before expensive processing
- preview before write
- merchant confirmation before publish
- model/router cost tracking
- retry limit
- auto-pause if cost exceeds threshold

Never sell unlimited catalog AI import.

---

## 16.1 Security Rules for Supplier / Merchant Catalogs

**Must enforce:**

- tenant isolation
- supplier ownership
- merchant ownership
- no cross-merchant product access
- no cross-supplier price leak
- no private wholesale tier leak to public storefront
- no customer data shared with supplier unless needed for fulfillment
- no supplier bank/payment detail exposure
- audit log for import, publish, price change, stock change, order, refund, payout

---

## 17.1 UI Rules for SOS

SOS UI must be:

- red and distinct
- serious, calm, trustworthy
- not nightclub
- not fear-based
- not cluttered
- accessible pre-login
- available globally
- clear about Basic / Plus / Live Automation status

**Forbidden SOS UI copy:**

- GPS Location Shared unless real consent + location sharing exists
- safety response team is watching unless real staffed team exists
- AI Shield Active unless real safety AI is active and legally approved
- hardcoded emergency numbers for all users
- guaranteed police/fire/ambulance response
- hidden recording
- background listening without explicit opt-in

**Required SOS UI copy:**

- VIONA SOS does not replace local emergency services
- call local emergency number directly if in immediate danger
- Plus features may be planned/pilot unless live

---

## 17.2 UI Rules for B2B Wholesale / E-shop Import

B2B import UI must:

- show import status clearly
- show supplier verification status
- show product review status
- show missing data warnings
- show restricted category warnings
- show margin before publish
- show stock source and timestamp
- show lead time as supplier-provided / unverified if not confirmed
- separate draft/import preview from live storefront
- require merchant approval before publish

**Forbidden:**

- one-click publish from AI without review
- hidden margin-negative listings
- showing unverified supplier as verified
- showing draft product as live product
- hiding MOQ/shipping/tax uncertainty
- using customer-facing copy that implies guaranteed availability when not confirmed

---

## 18.1 Do Not Touch Without Explicit Approval — SOS

Do not touch these for SOS unless explicitly approved:

- Twilio live calling
- emergency dispatch
- emergency routing matrix
- background voice keyword detection
- audio recording
- video recording
- camera/microphone permissions
- live GPS sharing
- trusted contact SMS/call automation
- Stripe entitlement
- subscription billing
- SOS API
- SOS DB tables
- response team dashboard

---

## 18.2 Do Not Touch Without Explicit Approval — B2B Wholesale / E-shop Import

Do not touch these unless explicitly approved:

- supplier payout
- supplier settlement
- wholesale payment
- checkout payment
- Stripe Connect
- invoice/VAT generation
- product DB migration
- inventory mutation
- stock sync worker
- shipping provider integration
- supplier order placement
- broker payout
- product publish automation
- restricted goods approval
- live marketplace launch
- AI direct DB write for imported products

---

## 21.1 Standard Task Prompt — SOS

Use this format for SOS tasks:

```txt
Bạn đang làm việc cho VIONA SOS / Global Lifeline.

Read:
- docs/ai-context/VIONA_OPERATING_PROTOCOL.md
- docs/product/VIONA_SOS_PLUS_PRODUCT_SPEC.md
- docs/product/VIONA_SOS_PLUS_PRODUCTION_ROADMAP.md
- relevant audit docs

Blueprint scope:
- Universe: Hub / LifeOS
- Mini-app: SOS / Global Lifeline
- User persona: Vietnamese worldwide / travelers / families / vulnerable users
- Feature status: (Lite / Pilot / Gated — specify)
- Risk level: legal + safety + AI + privacy + financial
- Monetization model: (specify or N/A for copy-only waves)
- Data dependencies: (specify)
- Safety guard needed: (specify)
- Feature flag needed: (specify)
- Production readiness: (specify)

Non-negotiable:
- no fake emergency dispatch
- no fake GPS sharing
- no hardcoded global emergency number
- no recording without consent
- no live calling without legal/payment/cost/routing readiness
- VIONA SOS does not replace local emergency services
```

---

**End of protocol.**
