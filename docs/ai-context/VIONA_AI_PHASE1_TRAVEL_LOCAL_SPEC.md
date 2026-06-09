# VIONA AI Phase 1 — Travel + Local Specification

**Pack:** `VIONA.AI_PHASE1_READ_ONLY_COPILOT_PLANNING.PACK_AI1`
**Document type:** Universe-specific Phase 1 read-only copilot spec
**Audience:** Travel + Local Mini-App Owners, copilot implementers, QA
**Parent:** `VIONA_AI_PHASE1_READ_ONLY_COPILOT_PLAN.md`

**Smart Trio:** Phase 1 copilot uses Vietnamese + English by default, plus local market language from `countryPacks` when the active locale bundle includes it. Translation helpers must not replace safety-critical legal/emergency strings without approved i18n keys.

---

## Travel + Local readiness summary

| Universe | Allowed Phase 1 AI | Forbidden actions | Phase 2 blockers |
| --- | --- | --- | --- |
| **Travel** | Explain screens; Quick Help scenarios; translation; fixer quote **preview** explanation; safety disclaimers (educational); phrase helpers | Book/confirm/cancel; charge; payout; dispatch; call emergency; GPS share | Human-confirm UI; request draft API contract; cost guard wired; checkout honesty QA |
| **Local** | Explain request flow; no-charge pilot; merchant-must-confirm; category browse help; translate draft text **without send**; summarize **own** request status | Submit request; merchant reply; payment/VIP charge; booking confirmed language | User submit flow; merchant confirm SoT; no-charge pilot sign-off; inbox tenant tests |

---

## Travel Phase 1

### Allowed read-only use cases

| Use case | User intent | Copilot may |
| --- | --- | --- |
| Airport phrase helper | “What should I say at immigration?” | Suggest phrases from approved phrase pack; explain it is guidance not official advice |
| Translation guidance | “Translate this sign/message” | Translate user-pasted or on-screen visible text |
| Quick Help explain | “What does Emergency tile do?” | Explain scenario purpose + educational safety boundary |
| Fixer quote preview | “What is this total?” | Explain line items from `calculateSplitPayment` **preview** API response only |
| Travel safety disclaimer | “Will VIONA call police?” | Explain educational guidance only; user must call local emergency |
| Navigation within Travel | “Where is interpreter assist?” | Explain tab/screen from route registry |
| Preview/no-charge | “Am I being charged?” | Explain preview / chưa thu phí / demo pilot labels per screen copy |

### Approved source-of-truth

| SoT domain | Source | Phase 1 access |
| --- | --- | --- |
| Route / screen | Navigation registry + current route param | Read |
| Quick Help scenario metadata | i18n keys + scenario config (read) | Read |
| Fixer preview breakdown | `LocalFixerCheckoutScreen` / service read path | Read-only API or serialized preview object |
| Locale / market | `countryPacks`, active locale | Read |
| Safety disclaimers | Approved strings in i18n / trust surfaces | Read |
| Feature flags | Travel copilot flag (default off until pilot) | Read |

### User-facing safety boundaries

- Copilot panel shows **“Read-only · Phase 1”** badge.
- Any fixer/money discussion repeats **preview — not charged in this build** when applicable.
- Emergency scenarios: **“VIONA does not dispatch emergency services.”**
- No outbound call, no GPS, no recording initiation from copilot.

### Forbidden Travel actions (Phase 1)

- Create or confirm fixer booking
- Initiate payment or Stripe Connect charge
- Imply payout to fixer completed
- Auto-navigate to checkout with pre-filled pay intent
- Trigger SOS or emergency APIs
- Store payment instruments via AI conversation

### Required gates before Phase 2 (Travel)

1. Fixer/booking request draft API with `pending` server state
2. User tap confirmation component + audit log
3. Travel Mini-App Owner sign-off
4. D2D-style copy review on any new AI-adjacent strings
5. Viewport QA matrix PASS on Travel copilot entry points

---

## Local Phase 1

### Allowed read-only use cases

| Use case | User intent | Copilot may |
| --- | --- | --- |
| Request flow explain | “How do I ask for a service?” | Step-through: browse → draft → merchant confirms (Phase 2 submit) |
| Merchant must confirm | “Is my booking confirmed?” | Explain server states; if pending, say merchant must confirm — never “confirmed” |
| No-charge pilot | “Do I pay now?” | Explain `REQUEST_ONLY_NO_CHARGE`; payment not enabled for Local request flow |
| Category info | “What is Legal & Wealth lane?” | Summarize public category copy from catalog SoT |
| Message draft helper | “Help me write request message” | Suggest text in chat panel; **user copies** — no auto-submit |
| Request status summary | “What happened to my request?” | Summarize user’s own request from read API |
| Receptionist simulator context | “What did the demo call mean?” | Explain simulator-only transcript; not live telephony |

### Approved source-of-truth

| SoT domain | Source | Phase 1 access |
| --- | --- | --- |
| Service categories | Local catalog / bento config (read) | Read |
| User open requests | `LocalUserRequestStatus` read API | User-scoped read |
| Merchant public card | Storefront public fields | Read |
| Locale strings | vi/en + market bridge | Read |
| Pilot flags | Local no-charge / wallet phase flags | Read |
| Consent flags | Where shown on screen | Read |

### Request-only / no-charge boundaries

- Copilot must echo: **No payment captured** for Local request pilot when relevant.
- VIP / credits posting language is **out of scope** for Phase 1 copilot unless user explicitly on VIP screen and SoT says display-only.
- “Request received — merchant must confirm” (en i18n) is the correct status framing — not “captured” or “paid”.

### Forbidden Local actions (Phase 1)

- Submit Local service request
- Send message to merchant inbox
- Reserve or commit credits (VIP post)
- Confirm appointment on behalf of merchant
- Imply merchant verified when badge SoT says unverified

### Required gates before Phase 2 (Local)

1. Local no-charge pilot session criteria still met
2. Request submit API + idempotency documented
3. Merchant confirm/reject state machine stable
4. User confirmation UX + audit log
5. Trust & Safety review of AI-generated draft copy patterns
6. Forbidden claims strict PASS after any new i18n

---

## Data / source-of-truth matrix (detailed)

### Travel

| Field | Allowed in context? | If missing/stale | Privacy |
| --- | --- | --- | --- |
| `screenId`, `routeName` | Yes | Omit screen-specific help; generic Travel FAQ | Low |
| `quickHelpScenarioId` | Yes | “Select a scenario on screen” | Low |
| `fixerPreviewBreakdown` | Yes (read API) | “Open fixer preview screen first” | User session |
| `locale`, `marketCountry` | Yes | Fall back vi + en | Low |
| `walletBalance`, `paymentMethods` | **No** | Do not answer balance questions in Phase 1 | Sensitive |
| `emergencyRoutingTable` | **No** (educational static only) | Static disclaimer only | Safety |
| Other user PII | **No** | Refuse | High |

### Local

| Field | Allowed in context? | If missing/stale | Privacy |
| --- | --- | --- | --- |
| `screenId`, `localLane` | Yes | Generic Local FAQ | Low |
| `categoryId`, public description | Yes | “Category info unavailable” | Low |
| `userRequestId`, status enum | Yes (own requests) | “No request loaded” | User-scoped |
| `merchantId`, public name | Yes | Omit merchant-specific detail | Tenant public |
| `merchantInbox`, other users’ requests | **No** | Refuse | Tenant |
| `creditBalance`, VIP charge internals | **No** | Direct to wallet screen disclaimer | Sensitive |
| Cross-tenant catalog private fields | **No** | Refuse | High |

### Audit log (Phase 1 read sessions)

Minimum fields when copilot is eventually wired:

- `timestamp`, `userId` (hashed if logged), `universe`, `screenId`
- `phase: 1`, `mode: read_only`
- `contextSources[]`, `modelTier`, `tokenCount`, `estimatedCost`
- `outcome: explain | translate | faq | refused_forbidden_action`

### Cost / rate limits

| Limit | Default (planning) |
| --- | --- |
| Sessions per user per hour | 20 |
| Tokens per session | 8k input / 2k output cap |
| Degrade path | Static FAQ + “copilot busy” |
| Kill switch | `AI_COPILOT_PHASE1_ENABLED` flag per universe |

---

## Phase 2 promotion checklist (Travel + Local)

Copy from parent plan; universe owners must tick each item in release notes:

- [ ] Human confirmation UI implemented
- [ ] Audit log write path tested
- [ ] SoT contract version pinned
- [ ] Feature flag + rollback tested
- [ ] Cost guard enforced
- [ ] Tenant isolation spot-check
- [ ] Forbidden claims `--strict` PASS
- [ ] QA viewports 390×844, 768×1024, 1024×768, 1366×768
- [ ] Payment/SOS legal gates N/A or signed for scope
- [ ] Operator sign-off recorded in `VIONA_AI_AUTOMATION_READINESS_MATRIX.md`

---

## Example copilot refusals (Phase 1)

| User asks | Copilot responds |
| --- | --- |
| “Book the fixer for me” | “Phase 1 is read-only. I can explain the preview breakdown; booking submit comes in Phase 2 with your confirmation.” |
| “Submit my Local request” | “I can help you write a message, but you will tap Submit yourself when Phase 2 is enabled.” |
| “Call police for me” | “VIONA cannot dispatch emergency services. Call your local emergency number.” |
| “Is payment done?” | “I cannot see payment completion in Phase 1. Check wallet or screen labels; Local pilot is request-only without charge.” |
