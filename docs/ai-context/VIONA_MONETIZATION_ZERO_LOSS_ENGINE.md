# VIONA Monetization & Zero-Loss Engine

This document locks **monetization strategy** and the **Zero-Loss Engine** for VIONA: a super-app mini-app platform for the global Vietnamese diaspora and foreigners in Vietnam. It aligns with the commercial blueprint (**Dual Split-Fee**, B2B SaaS, Broker QR, loyalty points, **Stripe Connect**, pre-authorization / manual capture, **EUR** as base currency) and mandates a **public display migration from VIG → VIO** without pretending points are cash or crypto.

---

## 1. Strategic Decision

VIONA uses a **composite revenue model**:

**Freemium Trust Layer** + **B2B SaaS** + **Usage-Based AI** + **Transaction Fee** + **Travel Commission** + **Broker Performance Payout** + **VIO Loyalty**.

No single stream is allowed to subsidize uncapped provider cost; together they fund **margin**, **reserves**, and **liability** for points and promotions.

---

## 2. Monetization Principles

- **No unlimited AI** — every AI surface is metered, capped, or plan-bounded.
- **No fake payment state** — success only from verified server/webhook truth (Stripe).
- **No payout before settlement** — broker, affiliate, and merchant movements only after funds settle per policy.
- **No broker payout from gross revenue** — broker share is computed from **net platform revenue** after defined deductions (**Chưa xác định** exact deduction order without finance sign-off).
- **No VIO issued without margin source** — issuance tied to fee capture, SaaS margin, or pre-funded marketing pool (**Chưa xác định** pool accounting treatment).
- **No production feature without cost cap** — feature flags + hard budgets + auto-pause.
- **No hidden fee that damages trust** — all user-visible fees disclosed at checkout and in receipts where applicable.

---

## 3. Revenue Streams

| Stream | Description |
|--------|-------------|
| **Consumer subscription** | Recurring access to Plus-tier benefits (priority support, higher caps, bundled credits)—**Chưa xác định** exact SKU list by market. |
| **AI credits** | Pre-purchased packs for voice/chat/vision; consumed before premium model routes. |
| **B2B SaaS** | Monthly/annual plans for Merchant Dashboard, staff seats, AI Receptionist base, integrations. |
| **AI Receptionist minutes** | Included minutes + overage; primary meter for expensive voice path. |
| **Booking fee** | Platform or convenience fee on bookings (B2C/B2B) with category-based rates (see §6). |
| **Travel commission** | Take rate on travel/tourism GMV where legally contracted—aligned with Travel universe. |
| **Academy subscription** | Family / learner tiers for Academy universe content and coach access. |
| **Broker QR performance** | Performance-based compensation tied to attributed, settled transactions—not uncapped % of gross. |
| **Merchant visibility boost** | Sponsored placement, promoted listings, or ad products—**Chưa xác định** ad engine vs simple boost catalog. |
| **Setup / onboarding fee** | White-glove onboarding, menu digitization, hardware bundle—optional; high margin if scoped. |

---

## 4. B2B AI Receptionist Pricing

Proposed packages (names and numbers are **targets**; finance must calibrate to actual COGS).

### Free Demo

| Field | Policy |
|--------|--------|
| **Included minutes** | 30 min lifetime or 7-day rolling window (**Chưa xác định**). |
| **Overage** | Blocked (hard stop); upgrade CTA only. |
| **Hard cap** | Same as included; no paid overage on demo SKU. |
| **Features** | Single number, single location, no auto-capture, watermark on receipts if print enabled. |
| **Margin guard** | Demo pool budget per merchant; auto-pause when pool exhausted. |

### Starter

| Field | Policy |
|--------|--------|
| **Included minutes** | 200 min / month. |
| **Overage** | €X per minute or per-block (**Chưa xác định** X). |
| **Hard cap** | 2× included then auto-pause until plan upgrade or next cycle. |
| **Features** | Business hours only, basic FAQ cache, human fallback included. |
| **Margin guard** | Model router locked to small + cached path except emergencies. |

### AI Intake

| Field | Policy |
|--------|--------|
| **Included minutes** | 600 min / month. |
| **Overage** | Lower €/min than Starter overage (**Chưa xác định**). |
| **Hard cap** | Configurable 3–5× included (**Chưa xác định**). |
| **Features** | Intent + slot extraction, booking **hold** tools, no auto-capture without add-on. |
| **Margin guard** | Premium model minutes budget separate line item. |

### Power

| Field | Policy |
|--------|--------|
| **Included minutes** | 1,500 min / month. |
| **Overage** | Tiered volume discount after threshold (**Chưa xác định**). |
| **Hard cap** | Merchant-configurable ceiling + platform max. |
| **Features** | Auto booking post-policy, inventory reserve, print queue integration flags. |
| **Margin guard** | Dual split-fee on bookings; AI cost allocation per merchant dashboard. |

### Pro

| Field | Policy |
|--------|--------|
| **Included minutes** | 4,000 min / month. |
| **Overage** | Negotiated band or committed annual (**Chưa xác định**). |
| **Hard cap** | Soft cap with ops approval workflow above cap. |
| **Features** | Multi-location, SLA, priority model route, advanced analytics. |
| **Margin guard** | Minimum monthly platform fee floor if usage collapses (anti negative margin). |

### Enterprise

| Field | Policy |
|--------|--------|
| **Included minutes** | Custom (e.g. 10,000+). |
| **Overage** | Custom CPQ. |
| **Hard cap** | Contractual committed spend + burst pool. |
| **Features** | Dedicated support, custom policy pack, optional VPC/dedicated tenancy (**Chưa xác định** infra). |
| **Margin guard** | Annual true-up; chargeback reserve held on balance sheet terms. |

---

## 5. Consumer Pricing

### Free

- Core trust layer: SOS-adjacent essentials where product defines them, limited AI, standard booking fees apply.
- Strict caps on AI and voice; upgrade prompts at 80% of cap.

### VIONA Plus

- Monthly/annual subscription: higher AI credit allowance, reduced booking fee cap or waived small-order fee (**Chưa xác định**).
- Transparent statement of included AI credits per month.

### Travel Pack

- Add-on for Travel universe: bundled protections, concierge credits, or fee discounts on travel bookings (**Chưa xác định** bundle composition).

### Academy Family

- Household subscription for Academy; optional per-child seat add-on (**Chưa xác định**).

### AI Credits

- Purchasable packs (never “unlimited”); consumed across eligible surfaces with visible balance as **VIO Credits** (usage) vs **VIO Points** (loyalty)—see §10 for naming.

---

## 6. Transaction Fee Policy

**Dynamic fee** model (implemented as config-driven rules, not model-decided):

- **Essential / everyday services** — lower take rate to preserve trust and frequency (Local universe skew).
- **Premium / travel** — higher take rate within competitive band; disclose as line item “platform + trust” where regulations allow.
- **Trust / AI shield fee** — explicit small add-on when AI mediation, translation, or dispute escrow is used (**Chưa xác định** legal label per jurisdiction).
- **Fee cap** — optional absolute cap on small-ticket orders to avoid user outrage (e.g. max €Y under €Z basket)—**Chưa xác định** Y/Z.

Dual split-fee: platform share + partner/broker/merchant components must be **computable from net** definitions in contract, not double-charged to consumer without disclosure.

---

## 7. Cost Firewall

- **Provider cost tracking** — Tag Twilio, OpenAI/Gemini (or other LLM), STT/TTS, maps, SMS by `merchantId` / `userId` / `callId` where possible.
- **AI token / audio budget** — Per session, per user, per merchant; soft warn, hard stop.
- **Twilio / SMS cost** — Separate from LLM; surge protection on OTP and marketing (**Chưa xác định** marketing SMS policy).
- **Server cost allocation** — Allocate infra to cohorts (B2C vs B2B) for margin dashboards; **Chưa xác định** allocation methodology (CPU vs revenue attribution).
- **Cost per merchant** — Roll-up for B2B billing and downgrade triggers.
- **Cost per call** — Real-time estimate post-call for margin analytics.
- **Auto-pause** — Stop new AI sessions / broker campaigns when burn exceeds cap.
- **Upgrade prompt** — In-app and email when crossing 80% thresholds; never silent hard stop without message.

---

## 8. Model Router

Routing reduces average COGS while preserving quality on edge cases:

- **Cache / FAQ** — High-hit answers without LLM call or with tiny completion.
- **Small model** — Intent, slot fill, classification.
- **Realtime voice model** — Streaming path for calls; strict minute accounting.
- **Premium model** — Complex disputes, multi-constraint scheduling; quota per plan.
- **Vision model** — Menu scan, receipt OCR—only when user action triggers and plan allows.
- **Fallback** — Cheaper or alternate vendor on outage; **same** policy and tool boundaries (no “fallback = unrestricted”).

---

## 9. Ledger & Reconciliation

Ledger concepts (double-entry or event-sourced—**Chưa xác định** schema):

| Account / bucket | Role |
|------------------|------|
| **Platform revenue** | Earned fees, SaaS, AI overage, subscriptions. |
| **Merchant payable** | Amounts owed to connected accounts after captures and disputes. |
| **Broker payable** | Accrued from **net** rules; released on schedule post-settlement. |
| **VIO liability** | Outstanding points/credits owed to users (loyalty + prepaid usage if mixed—prefer split sub-accounts). |
| **Provider cost** | Accrued COGS to reconcile against invoices (OpenAI, Twilio, cloud). |
| **Refund reserve** | Held portion of gross to cover expected refunds. |
| **Chargeback reserve** | High-risk MCC or new merchants—**Chưa xác định** % tables. |
| **Tax liability** | VAT/sales tax buckets per entity—**Chưa xác định** entity map without tax counsel. |

Reconciliation jobs: Stripe balance transactions ↔ internal ledger ↔ booking/order lines; mismatches alert within SLA (**Chưa xác định** SLA).

---

## 10. VIO Points Policy

- **Public display:** **VIO Points** (loyalty) and **VIO Credits** (prepaid usage) — clear UX separation; migrate public copy from **VIG** → **VIO**.
- **Legacy internal:** **VIG** may remain in code/API/logs until migration completes; never show “VIG” as customer-facing brand post-cutover.
- **Not crypto** — no on-chain representation; no speculative trading.
- **Not withdrawable cash** — redemption catalog only (discounts, services, partner perks)—**Chưa xác định** if partial cash-out ever allowed (default: no).
- **Expirable** — Points expire on inactivity or fixed term; disclosed at earn time.
- **Redeem cap** — Per transaction and per day to limit liability spikes and fraud.
- **Liability tracking** — Points expense recognized with margin source; breakage modeled conservatively (**Chưa xác định** accounting standard).

---

## 11. Broker Payout Policy

- **Paid only from net platform revenue** after Stripe fees, refunds, chargebacks, and contractual deductions.
- **Delayed until settlement** — No same-day payout on auth-only or high-risk flows.
- **Commission cap** — Per broker and per order; **Chưa xác định** numeric caps.
- **Clawback** — On refunded/chargeback transactions within attribution window.
- **Attribution expiry / decay** — QR scan or click attribution TTL; decay for stale leads (**Chưa xác định** half-life).
- **No infinite uncapped payout** — Annual broker bonus pools with hard ceiling tied to platform EBITDA guardrail (**Chưa xác định** linkage formula).

---

## 12. Payment Safety

- **Stripe Connect** — Connected accounts; application fees per dual split-fee design.
- **Base currency EUR** — Internal pricing and settlement baseline; multi-currency display—**Chưa xác định** FX policy.
- **Pre-authorization / manual capture** — For high-risk or fulfillment-after-service flows.
- **Webhook source of truth** — No client-trusted “paid” UI state.
- **Delayed payout** — To merchants/brokers per risk tier.
- **Reserve** — Rolling reserve for new or volatile merchants—**Chưa xác định** % schedule.

---

## 13. Fairness & User Trust

- **Free survival layer** — Critical safety and basic utility remain usable without predatory upsell (**Chưa xác định** exact feature list).
- **Transparent fees** — Fee lines on checkout and in order history.
- **No hidden charges** — Bundled “free shipping” style tricks avoided in regulated categories.
- **Clear AI cost / credit usage** — Per session summary where product allows.
- **Merchant ROI dashboard** — Bookings attributed to AI, cost vs revenue, fee breakdown.
- **No predatory 90-day trap wording** — Clear renewal, cancel, and trial terms; **Chưa xác định** legal review for each locale.

---

## 14. Admin Dashboards

Required executive and ops views:

- **MRR** — By SKU: B2C Plus, B2B SaaS, Academy, Travel attach.
- **AI cost** — Tokens, voice minutes, vision jobs vs budget.
- **Call cost** — Telephony + STT/TTS roll-up.
- **Margin per merchant** — Revenue minus allocated AI + payment fees.
- **Failed payments** — Decline reasons, retry policy effectiveness.
- **Refunds** — Rate and reason codes; tie to clawback.
- **Broker payout** — Accrued vs paid vs clawed back.
- **VIO liability** — Outstanding points/credits; aging and expiration forecast.
- **Provider cost alerts** — Burn rate vs forecast; auto-pause events log.

---

## 15. Definition of Zero-Loss

VIONA does **not** promise zero refunds or zero chargebacks. **Zero-Loss** means:

- **No uncapped variable cost** relative to revenue for any shipped feature.
- Every production feature has:
  - **Revenue source** (direct fee, subscription, or funded marketing pool with cap).
  - **Cost cap** (technical and commercial).
  - **Margin rule** (minimum contribution or kill switch).
  - **Auto-pause** when caps breach.
  - **Ledger** row for money and points movement.
  - **Monitoring** with alerts and runbooks.

Platform may still lose on **edge catastrophes** (fraud wave); Zero-Loss is **architectural containment**, not an insurance guarantee—**Chưa xác định** if separate insurance product is needed.

---

## 16. Next Code Tasks (Proposal — Not Executed in This Doc)

1. **Create `monetizationConfig`** — Central fee tables, caps, plan SKUs (server + client read models).
2. **Create `costFirewall` types** — Budgets, enums for pause reasons, per-tenant counters.
3. **Create VIO display config** — Public strings, legacy VIG mapping flags, feature flag for cutover.
4. **Add AI usage tracking schema plan** — Events table: model tier, tokens, audio seconds, `merchantId`, cost estimate.
5. **Add merchant plan config** — Plan id → included minutes, overage price id, hard cap multiplier.
6. **Add broker payout policy config** — Net definition order, cap, TTL, clawback window.
7. **Add admin margin dashboard plan** — Queries, refresh cadence, role-based access.

---

## Appendix: Glossary

- **VIO** — Customer-facing loyalty and usage naming post-migration.
- **VIG** — Legacy internal naming; retire from UX per §10.
- **Zero-Loss Engine** — The combined policies: caps, ledger, reconciliation, payouts, and monitoring in §2–§15.
