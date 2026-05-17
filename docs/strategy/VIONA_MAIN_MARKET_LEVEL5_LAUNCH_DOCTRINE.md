# VIONA Main Market Level 5 Launch Doctrine

**Document type:** Strategy / launch gate doctrine  
**Audience:** Executive leadership, product, architecture, finance, compliance, AI safety, GTM, and engineering leads  
**Status:** Draft for internal alignment — **not** a public marketing claim  
**Relationship:** Subordinate to founder-signed **Master Blueprint** (`docs/ai-context/VIONA_FINAL_MASTER_BLUEPRINT_V2.md`) and **Operating Protocol** (`docs/ai-context/VIONA_OPERATING_PROTOCOL.md`). On conflict with a signed blueprint clause, **blueprint wins**.

**Primary references read for this doctrine:**

- `docs/ai-context/VIONA_OPERATING_PROTOCOL.md`
- `docs/ai-context/VIONA_FINAL_MASTER_BLUEPRINT_V2.md`
- `docs/ai-context/VIONA_AI_CALL_AND_INDUSTRY_RECEPTIONIST_ARCHITECTURE.md`
- `docs/ai-context/B2B_AI_RECEPTIONIST_FULL_PRODUCTION_ARCHITECTURE.md`
- `docs/ops/VIONA_COMMERCIAL_PILOT_CHECKLIST.md`
- `docs/audit/VIONA_GLOBAL_COMMERCIALIZATION_READINESS_AUDIT.md`

---

## 1. Executive Summary

VIONA will continue to build AI automation **step by step internally**. Engineering, product, and operations may progress through controlled internal milestones from intake-only behavior to full business automation. That internal progression is **not** permission to sell main-market automation before the platform can execute it safely.

**Europe, the United States, and Canada** are VIONA’s **main commercial markets** for paid merchant automation and AI Business Autopilot positioning. These markets must **not** receive a commercial “full launch” framed as production-grade AI receptionist or AI business automation while the product is still effectively at **Level 1 or Level 2** demo, script, or manual-ops pilot behavior.

For EU / US / Canada, **main-market commercial launch** means **Level 5 AI Business Autopilot readiness**: controlled backend execution through Policy Engine, Tool Gateway, tenant isolation, audit, finance gates, cost firewall, human fallback, and admin monitoring. Level 5 is **not** uncontrolled AI. It is governed automation with deterministic outcomes.

**Global Lite** may still launch or expand **worldwide** before or alongside main-market Level 5. Global Lite surfaces may remain labeled Lite, Demo, Pilot, or Gated and must not overclaim automation, payment, booking, or emergency outcomes. Main-market paid positioning must remain honest until Level 5 gates pass.

---

## 2. Definition of Level 5

For VIONA, **Level 5** means **AI Business Autopilot with controlled backend execution**.

The AI may sound and behave like a trained front-desk or operations assistant, but every material outcome is proposed by the model and **disposed** only through approved backend paths. Level 5 may include, when policy and merchant configuration allow:

- inbound AI calls and chat
- language detection and Smart Trio routing
- customer intent detection and slot extraction
- service / price / hour / staff / capacity lookup from authoritative tenant data
- booking hold creation
- booking confirmation only when merchant rules, capacity, and policy allow
- merchant notification
- transcript and audit log retention
- customer reminder flows
- payment intent or deposit creation only when payment and ledger gates pass
- receipt or invoice draft only when finance gates pass
- human fallback and escalation
- admin monitoring and incident visibility
- cost cap enforcement and auto-pause

**Level 5 must not mean uncontrolled AI.** The model does not own truth, money, inventory, or cross-tenant access. It does not bypass merchant policy, legal constraints, or finance controls.

---

## 3. Non-negotiable AI safety rules

The following rules apply to main-market automation and to any path that may be mistaken for production automation:

- AI **must not** write to the database directly.
- AI **must not** charge money directly.
- AI **must not** invent prices, discounts, policies, or availability.
- AI **must not** access cross-tenant data.
- AI **must not** make refund or chargeback decisions.
- AI **must not** perform outbound cold calling without compliance and consent review.
- AI **must not** run without cost cap, usage quota, and auto-pause behavior.

All mutations and material side effects must pass through:

- **Policy Engine**
- **Tool Gateway**
- **Tenant Check**
- **Role / permission check**
- **Idempotency**
- **Audit Log**
- **Cost Firewall**
- **Monitoring**

These rules align with the Operating Protocol, Master Blueprint V2, and B2B AI Receptionist production architecture. Demo, Lite, and Pilot surfaces may show simulated or lead-only behavior, but must remain honestly labeled.

---

## 4. Internal Level Build Sequence

VIONA may build internally through five automation levels. These are **internal engineering and operations milestones** for main-market readiness. They are **not** necessarily public product stages in EU / US / Canada.

| Internal level | Name | What it means | Typical public posture in main markets |
|---|---|---|---|
| **Level 1** | **AI Intake** | Capture intent, language, transcript, summary, lead, or booking request. Read-only or lead-only tools. No autonomous commit. | Demo / Pilot / waitlist only. No paid “autopilot” claim. |
| **Level 2** | **AI Booking Request** | Structured booking request, hold proposal, merchant review queue, customer follow-up draft. Confirmation still human or merchant-mediated unless policy explicitly allows more. | Controlled merchant onboarding and labeled pilot. |
| **Level 3** | **Rule-Based Auto Booking** | Deterministic booking hold and confirm within merchant-configured rules, hours, capacity, and confirmation policy. No payment capture unless separately gated. | Private beta only until platform and merchant checklists pass. |
| **Level 4** | **Transaction Automation** | Payment intent, deposit, ledger-aware confirmation, inventory reservation or release, receipt draft, and finance reconciliation through approved tools and webhooks. | Still not main-market commercial launch unless Level 5 checklist is complete. |
| **Level 5** | **Full Business Autopilot** | End-to-end governed automation across intake, booking, notification, transcript, finance-safe payment/deposit, receipt draft, fallback, monitoring, and cost control. | Eligible for **main-market commercial launch** only after production gate passes. |

Internal progression through Levels 1–4 is expected and desirable. **Public commercial launch in EU / US / Canada is reserved for Level 5.**

---

## 5. Main Market Launch Rule

For **Europe, the United States, and Canada**:

- **No commercial “full launch”** until the **Level 5 production gate checklist** passes for the target market group and merchant segment.
- **Private and internal pilots** are allowed when labeled, scoped, and covered by runbooks and owner assignment.
- **Controlled merchant onboarding** is allowed for configuration, script preview, test calls, transcript review, and admin review.
- **Public product copy must not overclaim** automation, booking confirmation, payment success, inventory mutation, or emergency outcomes before Level 5 is real in production.
- **Paid launch** should be framed as **AI Business Autopilot** only when the production checklist, finance guardrails, and compliance posture for that market are complete.

This doctrine does **not** forbid Global Lite, companion surfaces, SOS Basic, Academy Lite, travel Lite, or other honestly labeled non-Level-5 experiences worldwide. It forbids **mislabeling** those experiences as main-market production autopilot.

---

## 6. Global Lite vs Main Market Level 5

| Market group | Allowed early status | Commercial launch target | Required automation level | Payment required? | Legal / compliance review required? | Human fallback required? | Recommended public positioning |
|---|---|---|---|---|---|---|---|
| **Worldwide / Rest of World** | Global Lite, Demo, Pilot, waitlist, companion entry, script/translation assistant, simulator | Phased regional expansion; no universal paid autopilot claim | Lite through internal Level 2–3 as implemented; **not** Level 5 by default | Only where payment rails and legal posture are explicitly enabled | Baseline privacy, consent, and market copy review; stronger review before paid automation | Yes for any live or quasi-live AI path | **Global Vietnamese Companion OS — Lite**; honest Demo / Pilot labels |
| **Europe** | Private merchant onboarding, internal test calls, labeled demo calls, config UI, transcript review, waitlist / prelaunch | **Level 5 main-market commercial launch** | **Level 5** for paid AI Business Autopilot | Yes for paid autopilot plans; deposits only through ledger/webhook gates | GDPR, recording notice, AI disclosure, outbound restrictions, market legal copy | Yes; escalation path mandatory | **AI Business Autopilot for merchants** only after gate pass |
| **United States** | Same controlled prelaunch activities as Europe | **Level 5 main-market commercial launch** | **Level 5** | Yes for paid plans when finance gate passes | Federal/state telemarketing, recording, AI disclosure, health/legal/finance intake limits | Yes | Same as Europe; no “fully autonomous” overclaim |
| **Canada** | Same controlled prelaunch activities as Europe | **Level 5 main-market commercial launch** | **Level 5** | Yes for paid plans when finance gate passes | PIPEDA / provincial privacy, recording, consent, outbound restrictions | Yes | Same as Europe |
| **Seed EU countries (e.g. Czechia, Germany)** | Controlled pilots, merchant rehearsal, sandbox telephony, checklist-driven onboarding | First **Level 5** commercial packs inside EU after seed gate evidence | **Level 5** for paid launch; internal Levels 1–4 allowed pre-launch | As enabled by finance gate | EU baseline plus local language, recording, and telephony review | Yes | **AI Receptionist Pro / AI Business Autopilot** only with market-ready copy and evidence |

---

## 7. Level 5 Production Gate Checklist

Use this checklist before declaring EU / US / Canada ready for **main-market commercial Level 5 launch**. Items may be satisfied per market group and merchant segment, but **no item may be hand-waved by marketing copy**.

### Merchant readiness

- [ ] Merchant verified and tenant-bound
- [ ] Services configured from authoritative catalog
- [ ] Prices configured; no model-invented pricing path remains
- [ ] Hours and exceptions configured
- [ ] Staff / capacity / concurrency rules configured
- [ ] Fallback contact and escalation path configured
- [ ] Language preferences and Smart Trio routing configured
- [ ] Cancellation / no-show / deposit policy configured
- [ ] Test calls passed and reviewed
- [ ] Merchant approval of AI behavior, disclosures, and boundaries recorded

### Platform readiness

- [ ] Policy Engine live for target tools and market rules
- [ ] Tool Gateway live for all mutating actions
- [ ] Tenant isolation enforced on every tool and query path
- [ ] Role / permission check enforced
- [ ] Idempotency enforced on all mutations
- [ ] Audit log complete and retained
- [ ] Transcript storage policy implemented
- [ ] Admin monitor and operator visibility available
- [ ] Sentry / logging / error states covered
- [ ] Human fallback operational and tested

### Finance readiness

- [ ] Plan pricing defined per package
- [ ] Included minutes / calls defined
- [ ] Overage pricing defined
- [ ] Usage quota enforced
- [ ] Hard monthly cost cap enforced
- [ ] Provider cost tracking allocated per tenant where possible
- [ ] Margin rule and zero-loss guardrail documented
- [ ] Auto-pause behavior tested
- [ ] Ledger posture defined for money movement
- [ ] Stripe sandbox / webhook path proven if payment is enabled
- [ ] Refund / chargeback review path defined if payment is enabled

### Compliance / trust readiness

- [ ] AI disclosure copy approved
- [ ] Recording notice implemented where required
- [ ] Consent flow implemented where required
- [ ] Data retention copy and controls approved
- [ ] Market legal copy approved for target geography
- [ ] Outbound restrictions documented and enforced
- [ ] Human fallback copy approved
- [ ] No legal / medical / financial final advice from AI in production paths

---

## 8. Pricing and packaging principle

Level 5 must **not** be sold as unlimited AI.

Every commercial package must define at minimum:

- monthly price
- included calls / minutes
- overage rate
- hard monthly cost cap
- automation level delivered
- human fallback policy
- setup / onboarding fee if needed
- margin guard
- auto-pause behavior

Suggested package names for main-market positioning:

- **AI Business Autopilot**
- **AI Receptionist Pro**
- **AI Merchant OS**
- **Enterprise Multi-location**

**Do not set final prices in this doctrine.** Existing repo and blueprint materials treat detailed fee tables, included-minute bundles, and overage economics as **product/commercial decisions requiring confirmation** against finance guardrails and market packaging. This doctrine only requires that every paid plan is bounded, metered, and margin-aware.

---

## 9. What can ship before Level 5

For **main markets**, the following are allowed **before** public commercial Level 5 launch if honestly labeled and operationally owned:

- private merchant onboarding
- internal test calls
- demo calls clearly labeled Demo / Simulator / Pilot
- merchant configuration UI
- script preview and playbook preview
- booking request pilot without autonomous public confirmation
- transcript review and admin review
- waitlist / prelaunch enrollment
- Global Lite companion surfaces
- lead capture and manual-ops-assisted follow-up

These activities support learning, merchant trust, and implementation readiness. They do **not** satisfy the Level 5 commercial launch gate by themselves.

---

## 10. What must not ship before Level 5

For **main markets**, the following must **not** ship as public commercial reality before Level 5 gates pass:

- public claim of full automation or “AI runs your business”
- live auto-confirm booking without merchant configuration and policy approval
- live payment capture without ledger and webhook truth
- AI refund or chargeback decisions
- AI inventory mutation without stock ledger discipline
- outbound cold calling without consent and compliance review
- unlimited AI plan or silent uncapped usage
- cross-tenant lookup or data blending
- fake AI receptionist claims
- fake payment success
- fake booking confirmation
- fake emergency, safety, or dispatch outcomes

This list complements Operating Protocol rule **No fake production state** and blueprint guardrails on money, booking, and AI mutation.

---

## 11. Recommended implementation roadmap

The following packs define the recommended build sequence. **Do not implement these packs in this docs-only task.**

| Pack | Purpose |
|---|---|
| **MAINMARKET.L5.0** | Strategy + launch gate doctrine (this document) |
| **MAINMARKET.L5.1** | AutomationLevel + MarketCapability config |
| **MAINMARKET.L5.2** | Merchant readiness checklist |
| **MAINMARKET.L5.3** | Policy Engine + Tool Gateway skeleton |
| **MAINMARKET.L5.4** | Cost Firewall + usage quota |
| **MAINMARKET.L5.5** | Inbound AI Receptionist sandbox |
| **MAINMARKET.L5.6** | Booking hold / confirm deterministic tools |
| **MAINMARKET.L5.7** | Transcript / audit / admin monitor |
| **MAINMARKET.L5.8** | Payment / ledger gate |
| **MAINMARKET.L5.9** | Level 5 launch checklist for EU / US / Canada |
| **MAINMARKET.L5.10** | Public commercial launch pack |

Recommended sequencing logic:

1. Lock doctrine and market capability model.
2. Make automation level and market claims configurable rather than copy-driven.
3. Operationalize merchant and platform readiness checklists.
4. Build policy/tool/cost foundations before widening live traffic.
5. Prove sandbox and deterministic booking tools before payment automation.
6. Prove audit/admin/finance gates before paid main-market launch.

---

## 12. Decision recommendation

| Question | Recommendation |
|---|---|
| Should VIONA build step-by-step internally? | **Yes.** Internal Levels 1–5 are the correct engineering sequence. |
| Should EU / US / Canada launch commercially before Level 5? | **No.** Main-market paid launch requires Level 5 production gate pass. |
| Should Global Lite still launch worldwide? | **Yes.** Worldwide Lite / Demo / Pilot / companion entry may continue with honest labeling and without autopilot overclaim. |
| What is the safest fast path? | Ship **MAINMARKET.L5.1** and **MAINMARKET.L5.2** immediately after this doctrine: market capability config plus merchant readiness checklist, while keeping EU / US / Canada on controlled onboarding and labeled pilots. Parallelize **MAINMARKET.L5.3** and **MAINMARKET.L5.4** so policy/tool boundaries and cost firewall exist before any widening of live inbound traffic. |
| What should be built next? | **MAINMARKET.L5.1 — AutomationLevel + MarketCapability config**, then **MAINMARKET.L5.2 — Merchant readiness checklist**, then **MAINMARKET.L5.3 — Policy Engine + Tool Gateway skeleton**. Do not advance public main-market paid positioning until **MAINMARKET.L5.9** evidence exists. |

---

## Document control

| Field | Value |
|---|---|
| Canonical path | `docs/strategy/VIONA_MAIN_MARKET_LEVEL5_LAUNCH_DOCTRINE.md` |
| Created | 2026-05-12 |
| Owner | Executive / Product Strategy + Principal Architect |
| Next review trigger | Any change to main-market paid positioning, AI telephony production scope, payment automation, or EU / US / Canada GTM plan |
