# VIONA AI Automation Readiness Matrix

**Pack:** `VIONA.AI_AUTOMATION_READINESS_DOCS.PACK_AI0`
**Document type:** Per-universe AI readiness — current phase, gates, blockers
**Audience:** Mini-App Owners, AI Safety Lead, Release Train Owner
**Baseline:** Post D2E safety stack (`a1b22d5`); route inventory (`70a355d`); forbidden claims `--strict` PASS.

---

## Universe readiness summary

| Universe | Current AI phase | Next AI phase | Current allowed AI | Allowed w/ human confirm | Forbidden until gates | Blockers |
| --- | ---: | ---: | --- | --- | --- | --- |
| **Home** | 0→1 | 1 | Policy docs; read-only hub explain (when wired) | — | LifeOS mutations, payment nudges | Hub SoT map incomplete; cost guard not wired |
| **Local** | 1 | 2 | Read-only explain; translation; simulator copy only | Request **draft** + user submit (pilot) | Payment capture; confirmed booking; VIP charge without gates | No-charge pilot; request-only SoT; merchant confirm flow |
| **Travel** | 1 | 2 | Read-only trip/help explain; translation; fixer quote **preview** | Booking/request **draft** | Payment capture; fixer payout; emergency dispatch | Checkout preview-only; telephony not production |
| **Academy** | 1 | 2 | Read-only lesson explain; translation | Practice **draft** answers (user graded) | Official certificate claims; accredited assessment | Content SoT partial; kids safety review |
| **Business** | 1–2 | 3 | Receptionist **simulator**; reply **draft** | Merchant send after confirm | Auto-booking confirm; telephony outbound | B2B telephony legal review; tenant isolation tests |
| **Account** | 1 | 2 | Read-only profile/wallet **display** explain | Profile update **draft** | Wallet debit; cash-out; payment capture | Wallet phase gates; receipt strictness env |
| **SOS** | 0–1 | 2 | Read-only guidance copy; emergency **education** | Trusted-contact **draft** (user confirm) | Dispatch; GPS share; auto-call; recording without consent | Country routing matrix; legal review; no fake dispatch |
| **B2B Wholesale / E-shop Import** | 1 | 2 | Catalog read; import **suggestion draft** | Merchant publish queue (human approve) | Live inventory promises; auto checkout; supplier fulfillment claims | Supplier SoT; compliance categories; ledger settlement |

---

## Per-universe detail

### Home

| Field | Value |
| --- | --- |
| **Current allowed AI** | Phase 0 foundation; Phase 1 navigation help and hub surface explanation when copilot wired |
| **Next phase** | Phase 1 read-only copilot for Command Center / LifeOS labels |
| **Human confirmation** | None for Phase 1 |
| **Forbidden until gates** | Any action implying payment, booking confirm, or SOS dispatch from Home shell |
| **Required SoT** | Route registry, feature flags, user session (read-only), market/locale |
| **Production gates** | Core Platform Lead sign-off; copilot labels Lite/Pilot honestly |
| **Blockers** | LifeOS tiles mix readiness labels; AI cost guard not implemented |

### Local

| Field | Value |
| --- | --- |
| **Current allowed AI** | Translation; explain Local lanes; AI receptionist **simulator** transcript (demo); summarize open request status from API |
| **Next phase** | Phase 2 — local service request draft + explicit user submit |
| **Human confirmation** | User tap to submit request; merchant tap to confirm/reject |
| **Forbidden until gates** | Payment captured; VIP post charge without credit SoT; booking confirmed language |
| **Required SoT** | Merchant catalog, request state machine, consent flags, locale bundles |
| **Production gates** | Local no-charge pilot criteria; Trust & Safety copy review; forbidden claims strict PASS |
| **Blockers** | `REQUEST_ONLY_NO_CHARGE` posture; partial i18n; merchant production onboarding |

### Travel

| Field | Value |
| --- | --- |
| **Current allowed AI** | Translation; trip context explain; fixer quote breakdown **preview** (read-only) |
| **Next phase** | Phase 2 — fixer/booking request draft |
| **Human confirmation** | User confirm before any request API call |
| **Forbidden until gates** | Payment capture; fixer payout; emergency police/ambulance implications |
| **Production gates** | Travel Mini-App Owner; checkout honesty (preview copy committed D2D) |
| **Blockers** | Stripe Connect demo only; no live settlement |

### Academy

| Field | Value |
| --- | --- |
| **Current allowed AI** | Lesson summary; translation; practice hints (non-grading automation) |
| **Next phase** | Phase 2 — draft practice responses; teacher review queue |
| **Human confirmation** | Teacher or user confirm for published feedback |
| **Forbidden until gates** | Official certificate; government-approved; accredited assessment claims |
| **Required SoT** | Curriculum content API, progress records, child-safety flags |
| **Blockers** | Kids lane safety review; content coverage gaps |

### Business (Merchant / B2B)

| Field | Value |
| --- | --- |
| **Current allowed AI** | Industry receptionist demo/simulator; inbox reply **draft**; marketing trigger status (internal) |
| **Next phase** | Phase 3 — limited template automation with merchant opt-in |
| **Human confirmation** | Merchant confirm send; admin confirm telephony enable |
| **Forbidden until gates** | Outbound AI call; auto booking confirm; cross-tenant data access |
| **Required SoT** | Merchant tenant, playbook, inbox threads, pricing authority |
| **Blockers** | Telephony compliance per market; AI cost firewall for voice |

### Account

| Field | Value |
| --- | --- |
| **Current allowed AI** | Explain wallet **display** labels; profile field help (read-only) |
| **Next phase** | Phase 2 — profile update draft |
| **Human confirmation** | User confirm save; biometric/PIN where required |
| **Forbidden until gates** | Wallet debit; top-up capture; cash-out; credit settlement |
| **Required SoT** | Auth session, wallet phase flags, `platform_payment_receipts` when enabled |
| **Blockers** | Wallet phase NONE/pilot; receipt strictness env-dependent |

### SOS / Global Lifeline

| Field | Value |
| --- | --- |
| **Current allowed AI** | Educational guidance; phrase help; read SOS profile **consent** state |
| **Next phase** | Phase 2 — trusted-contact alert **draft** (user confirm only) |
| **Human confirmation** | User confirm any contact alert; never auto-dispatch |
| **Forbidden until gates** | Dispatch; GPS live share; police/ambulance call; recording without consent |
| **Required SoT** | Country routing matrix, consent records, disclaimer acceptance |
| **Production gates** | SOS Safety Product Lead + Compliance + legal review |
| **Blockers** | No production dispatch automation; routing matrix incomplete for some markets |

### B2B Wholesale / E-shop Import

| Field | Value |
| --- | --- |
| **Current allowed AI** | Read supplier catalog; suggest import mapping **draft** |
| **Next phase** | Phase 2 — merchant approval queue for catalog publish |
| **Human confirmation** | Merchant approve SKUs/prices; admin approve restricted categories |
| **Forbidden until gates** | Fake inventory; fake delivery; auto checkout success; AI publish live without approval |
| **Required SoT** | Supplier catalog SoT, MOQ, stock feeds, compliance flags, margin/ledger awareness |
| **Blockers** | Supplier fulfillment not production; compliance category matrix |

---

## Source-of-truth requirements (global)

| Requirement | Phase needed | Owner |
| --- | ---: | --- |
| User profile API (read) | 1 | Account / Core Platform |
| Merchant profile + tenant scope | 1–2 | Security & Tenant Isolation |
| Catalog / service data | 1–2 | Mini-App Owner |
| Request / booking state enums | 2 | Mini-App Owner |
| Locale / market / country packs | 1 | Core Platform |
| Safety & consent flags | 2 | Trust & Safety / Compliance |
| Audit log append API | 2 | AI Safety Lead |
| Cost / rate limit enforcement | 1–3 | AI Safety Lead |
| Feature flags per universe/phase | 1 | Core Platform Lead |
| Tenant boundary tests | 2–3 | Security Lead |
| Rollback / AI kill switch | 1 | Ops / Incident Commander |

---

## Production gates (promotion checklist)

Before raising a universe from Phase N to N+1:

1. **Documented** in this matrix with date and owner sign-off line.
2. **Tool permission matrix** entries implemented match runtime tools.
3. **`viona-forbidden-claims-check.mjs --strict`** PASS.
4. **`viona-ai-safety-readiness-check.mjs`** PASS.
5. **Cost cap** configured for new tools.
6. **Incident runbook** link for AI outage/misbehavior.
7. **Copy review** — no fake production (Trust & Safety).
8. **Tenant isolation** spot-check for merchant/admin tools.

---

## Rollback / fallback

| Scenario | Action |
| --- | --- |
| AI provider outage | Disable AI feature flags; show static help + retry |
| Cost spike | Circuit breaker; degrade to Phase 1 read-only or off |
| Policy violation detected | Kill switch per universe; audit incident |
| Wrong tenant data | Immediate tool deny + Security incident |

---

## Related documents

- `docs/ai-context/VIONA_AI_PHASE_ROADMAP.md`
- `docs/ai-context/VIONA_AI_TOOL_PERMISSION_MATRIX.md`
- `docs/ai-context/VIONA_ROUTE_CAPABILITY_INVENTORY.md`
- `docs/ai-context/VIONA_OPERATING_PROTOCOL.md`
