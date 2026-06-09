# VIONA AI Phase 1 — Read-Only Copilot Plan

**Pack:** `VIONA.AI_PHASE1_READ_ONLY_COPILOT_PLANNING.PACK_AI1`
**Document type:** Phase 1 implementation planning — read-only copilot charter
**Audience:** Travel + Local Mini-App Owners, AI Safety Lead, engineering, QA
**Baseline:** AI0 committed (`5d07728`); forbidden claims `--strict` PASS; first universes: **Travel**, **Local**
**Relationship:** Subordinate to `VIONA_OPERATING_PROTOCOL.md`, `VIONA_AI_PHASE_ROADMAP.md`, `VIONA_AI_TOOL_PERMISSION_MATRIX.md`

---

## 1. Phase 1 scope (read-only)

Phase 1 copilot may **read** approved source-of-truth and **explain** to the user. It may **not** mutate server state, submit forms, or imply production outcomes.

### Allowed read-only behaviors

| # | Behavior | Example |
| --- | --- | --- |
| 1 | Explain current screen | “This is Travel Quick Help — tap a scenario for guidance.” |
| 2 | Explain Travel quick help | What each scenario tile means; preview vs live |
| 3 | Explain Local request flow | Request-only, merchant must confirm, no payment in pilot |
| 4 | Translate user-visible text | Smart Trio: vi + en + local market language |
| 5 | Summarize request status | Mirror server enum: pending, merchant_must_confirm |
| 6 | Draft suggested wording **without sending** | Phrase helper; user copies or edits manually |
| 7 | Explain safety limits | No dispatch, no payment captured, preview only |
| 8 | Explain preview / no-charge status | Fixer quote preview; Local no-charge pilot |
| 9 | Answer FAQ from approved docs only | Links to `docs/ai-context/*`, runbooks — no invented policy |

### User promise (copy template)

> **Read-only copilot (Phase 1)** — VIONA AI explains and translates. It does not book, pay, dispatch, or submit requests for you.

---

## 2. Explicit forbidden actions (Phase 1)

AI Phase 1 tools and prompts **must not** perform or imply:

| # | Forbidden action |
| --- | --- |
| 1 | Create booking |
| 2 | Confirm booking |
| 3 | Cancel booking |
| 4 | Charge user |
| 5 | Debit wallet |
| 6 | Mark as paid / captured / settled |
| 7 | Settle payout or cash-out |
| 8 | Send merchant reply |
| 9 | Submit Local request |
| 10 | Dispatch SOS |
| 11 | Call police / ambulance |
| 12 | Share live GPS |
| 13 | Impersonate human without disclosure |
| 14 | Give final legal / medical / financial advice |

If user asks for a forbidden action → refuse politely and explain Phase 1 limit + human path (e.g. “Tap Submit yourself after reviewing the draft in Phase 2”).

---

## 3. Prompt policy (safe principles)

| Principle | Rule |
| --- | --- |
| **Context-bound** | Answer only from allowed context packet (screen id, SoT fields, approved FAQ snippets). |
| **Uncertainty** | Say “I don’t have that data” when SoT missing or stale — never invent. |
| **No invented availability** | Do not claim merchant open, slot free, or price final without SoT field + timestamp. |
| **No payment claims** | Never say payment done, captured, or refunded. |
| **No confirmation claims** | Never say booking/request confirmed unless server state explicitly says so (Phase 1 should not surface confirm language as AI output). |
| **Preview boundary** | When discussing Travel fixer or wallet-adjacent UI, include preview / not charged / request-only where relevant. |
| **Smart Trio** | Default Vietnamese + English; add local market language from `countryPacks` when available. |
| **Educational SOS** | Emergency content is guidance only — “call local emergency number yourself”; no dispatch. |
| **Tone** | Calm, honest, short; label Lite/Pilot/Demo when explaining gated surfaces. |
| **No hidden tools** | Phase 1 copilot has zero write tools registered. |

### System prompt skeleton (design only — not runtime)

```
You are VIONA read-only copilot (Phase 1).
- Use ONLY the context JSON provided.
- Do not invent merchants, prices, availability, payment, or dispatch outcomes.
- If asked to submit, pay, confirm, or call emergency services: explain you cannot; direct user to in-app controls.
- Prefer Vietnamese + English; use local language when locale pack present.
- State preview/request-only/no-charge when discussing Travel quotes or Local requests.
```

---

## 4. Data / source-of-truth matrix (Travel + Local)

See detailed per-field tables in `VIONA_AI_PHASE1_TRAVEL_LOCAL_SPEC.md`.

### Summary

| Requirement | Travel | Local |
| --- | --- | --- |
| Allowed input context | Screen route, scenario id, fixer preview breakdown (read API), locale, safety disclaimers | Screen route, category id, request status (read API), merchant public card fields, locale |
| Forbidden input context | Payment tokens, wallet balance mutations, emergency routing credentials, other tenants’ data | Other users’ requests, merchant inbox drafts, VIP charge internals |
| Stale/missing data | Say “preview unavailable — refresh screen” | Say “status unavailable — check Requests tab” |
| Privacy / tenant | User-scoped session only | User-scoped requests only; no cross-merchant PII |
| Audit log | Log copilot open, context hash, model tier, token cost (read session) | Same |
| Cost / rate limit | Per-session cap; degrade to static FAQ if exceeded | Same |

---

## 5. Phase 2 promotion checklist

Before promoting **Travel** or **Local** from Phase 1 → Phase 2:

| # | Gate | Owner |
| --- | --- | --- |
| 1 | Human confirmation UI for every mutation | Mini-App Owner + CPO |
| 2 | Action audit log (tool id, confirmation id) | AI Safety Lead |
| 3 | Source-of-truth contract documented + tested | Principal Architect |
| 4 | Rollback / fallback (disable copilot tools per universe) | Ops / Core Platform |
| 5 | Feature flag default off → pilot cohort | Core Platform Lead |
| 6 | Cost guard + circuit breaker | AI Safety Lead |
| 7 | Tenant boundary tests | Security Lead |
| 8 | `node scripts/viona-forbidden-claims-check.mjs --strict` PASS | Release Train |
| 9 | Manual QA viewports: 390×844, 768×1024, 1024×768, 1366×768 | QA Gate Owner |
| 10 | Legal review if drafts touch recording/telephony | Compliance |
| 11 | Payment gates if any copy mentions money movement | Payments Owner |
| 12 | SOS gates if emergency-adjacent copy | SOS Safety Lead |
| 13 | Operator sign-off line in readiness matrix | Executive delegate |

Phase 2 adds **ALLOW_DRAFT_ONLY** and **ALLOW_WITH_USER_CONFIRMATION** tools per `VIONA_AI_TOOL_PERMISSION_MATRIX.md` — not before checklist complete.

---

## 6. Implementation waves (planning only)

| Wave | Deliverable | Runtime? |
| --- | --- | --- |
| AI1 plan (this pack) | Docs + readiness script | No |
| AI1 commit | Git commit docs only | No |
| AI1b (future) | Copilot shell UI stub, feature flag off | UI read-only panel |
| AI1c (future) | Context packet builder (read APIs only) | No writes |
| AI1d (future) | Model adapter behind cost guard | Read-only inference |
| AI2 (future) | Draft + confirm for Local/Travel | Phase 2 gates |

**This pack stops at planning docs.** No runtime AI in AI1.

---

## 7. Verification commands

```bash
node scripts/viona-ai-safety-readiness-check.mjs      # AI0 foundation
node scripts/viona-ai-phase1-readiness-check.mjs      # AI1 plan docs
node scripts/viona-forbidden-claims-check.mjs --strict
```

---

## Related documents

- `docs/ai-context/VIONA_AI_PHASE1_TRAVEL_LOCAL_SPEC.md`
- `docs/ai-context/VIONA_AI_PHASE_ROADMAP.md`
- `docs/ai-context/VIONA_AI_AUTOMATION_READINESS_MATRIX.md`
- `docs/handoff/VIONA_LOCAL_NO_CHARGE_PILOT_READINESS_HANDOFF_1.md`
