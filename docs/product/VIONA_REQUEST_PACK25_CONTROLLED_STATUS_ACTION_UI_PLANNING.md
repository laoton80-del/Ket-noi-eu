# VIONA Request Engine — Pack25 Controlled Status-Action UI Planning

**Document type:** Controlled status-action UI planning (docs-only — no implementation, deploy, live QA, or data mutation in this pack).
**Packet ID:** `CURSOR_PACK25_CONTROLLED_STATUS_ACTION_UI_PLANNING_DOCS_ONLY`
**Baseline:** `origin/master @ 6221a99` — `docs(ui): record universe tile parity visual pass evidence (#177)`.
**Related:** `docs/product/VIONA_REQUEST_PACK25_MANUAL_UI_CHECK_GATE_CLOSURE_NEXT_STEP_PLANNING.md`, `docs/product/VIONA_REQUEST_PACK25_STATUS_ACTION_IDEMPOTENCY_REPLAY_LIVE_QA_PASS_EVIDENCE.md`, `src/components/viona/requests/VionaRequestLiveDetailReadOnly.tsx`, `src/services/viona/vionaRequestStatusActionService.ts`, `src/services/viona/vionaRequestStatusActionDto.ts`

---

## 1. Planning summary

| Field | Value |
| --- | --- |
| Operating Protocol read | **YES** |
| Docs-only planning pack | **YES** |
| Current verified master | **`6221a99`** |
| Pack25 status action / idempotency replay gate | **CLOSED / GREEN** |
| Pack25 read-only visibility implementation | **CLOSED / GREEN** |
| Pack25 manual UI/detail check | **CLOSED / GREEN** — PR #174 |
| Direction B universe tile parity | **CLOSED / GREEN** — PR #176, PR #177 |
| Controlled status-action UI implementation | **NOT authorized** |
| Pack26 opened | **NO** |

**This packet plans** a future owner-visible status-action UI affordance on request detail. It does **not** implement UI, change backend/API, authenticate, call staging, mutate data, deploy, or open Pack26.

---

## 2. Prior gate context (closed on master)

| Gate | Status |
| --- | --- |
| Status action API + idempotency replay | **CLOSED / GREEN** |
| Read-only visibility implementation | **CLOSED / GREEN** |
| Manual UI check authorization | **CLOSED / GREEN** — PR #173 |
| Manual UI check execution | **CLOSED / GREEN** — PR #174 |
| Manual UI check gate closure | **CLOSED / GREEN** |
| Direction B tile parity + visual pass | **CLOSED / GREEN** — PR #176, PR #177 |

**Existing backend (already on master — no new route planned):**

| Method | Route | Scope |
| --- | --- | --- |
| `POST` | `/api/viona/requests/:id/actions/status` | Owner-only **`submitted` → `triage`** |

Canonical constants: `VIONA_REQUEST_STATUS_ACTION_ALLOWED_TRANSITION` in `src/services/viona/vionaRequestStatusActionDto.ts`.

---

## 3. UI placement candidate

| Rule | Plan |
| --- | --- |
| Surface | **Request detail only** — `VionaRequestLiveDetailReadOnly` (live inbox detail pane) |
| Placement | **Below status badge / header row**, **above Timeline section** — secondary candidate: compact row between status label and Timeline |
| Not on | Global navigation, Home/Local/Travel/Academy tiles, list rows, or universe shortcut surfaces |
| Visual relationship | Adjacent to `VionaRequestStatusBadge` so owner sees current status before acting |
| Separation from notes | Status action is **distinct** from `VionaRequestNoteInputWrite` — different intent, different API |

**Rationale:** Keeps write surface scoped to authorized request detail context; matches manual UI check surface; avoids polluting universe tile parity work.

---

## 4. Visibility rules

| Condition | UI behavior |
| --- | --- |
| User not owner-authenticated | **Hide** affordance entirely |
| Request status is `submitted` | **Show** enabled action (owner only) |
| Request status is `triage` | **Hide** or show disabled-safe “Already in review” state — **no button** |
| Request status unknown / unsupported | **Hide** — no button for unknown statuses |
| Non-owner participant | **Hide** — server enforces owner-only; UI must not expose action |
| Loading detail | **Hide** action until detail loaded |
| Detail error | **Hide** action |

**Owner check:** Align with existing authorized read scope — only render when detail is loaded for an owner-visible row (same session that can submit notes if note write is enabled).

---

## 5. Action rules

| Rule | Plan |
| --- | --- |
| Allowed transition | **`submitted` → `triage` only** |
| Target status in POST body | `"triage"` |
| API route | `POST /api/viona/requests/:id/actions/status` — **existing route only** |
| Idempotency key | Client-generated stable key per user intent attempt — reuse pattern from `VionaRequestNoteInputWrite` (attempt-scoped UUID or equivalent) |
| Replay behavior | On replay with same idempotency key: expect `idempotentReplay: true` in action meta; **no duplicate status/audit events** |
| After success | Refetch detail GET; badge updates to **In review**; Timeline shows new `action.status` read-only entry |
| Invalid transition | Server returns `invalid_transition` — UI shows safe error, no retry storm |
| New transitions | **NO** — not in scope |
| Backend changes | **Only if proven gap** — separate authorization required |

**Reference implementation (server):** `transitionVionaRequestStatus` in `src/services/viona/vionaRequestStatusActionService.ts` — owner check, idempotent replay lookup, single transaction for status + audit events.

---

## 6. Copy rules

All labels must comply with Operating Protocol **no-fake-production** boundary and `VIONA_REQUEST_STATUS_ACTION_SAFETY` constants.

| Allowed copy intent | Examples (planning — i18n in implementation) |
| --- | --- |
| Move to review / triage | “Mark for review”, “Send to triage”, “Start review” |
| Pilot / not production | Preserve existing `notProductionCopy` banner context |
| Success | “Request marked for review” — **not** “confirmed” or “processed” |

| Forbidden copy | Reason |
| --- | --- |
| Booking-confirmed wording | Implies fulfillment |
| Payment-ledger / wallet-truth wording | Implies money movement |
| Emergency-escalation / SOS-outcome wording | Implies live safety outcome |
| “Automatically assigned” | Implies assign workflow |
| “Completed” / “Done” | Wrong transition; overclaims outcome |

**Safety constants to surface in UI footer/hint:** `noPaymentSettlement`, `noBookingFulfillment`, `noEmergencyEscalation`, `notProductionReady`.

---

## 7. Safety rules (UX)

| State | Requirement |
| --- | --- |
| Intent clarity | **One-step primary action** with clear label **or** lightweight confirmation affordance (operator choice at implementation auth) |
| Pending / loading | Disable button; show inline spinner or “Updating…” — prevent double-submit |
| Success | Brief inline confirmation; refresh badge + Timeline from GET detail |
| Error | Safe generic message — e.g. “Could not update status. Try again.” — map `invalid_transition` to non-alarming copy |
| Destructive language | **Avoid** — this is a forward review step, not cancel/delete |
| Double-submit | Guard with in-flight flag + idempotency key |

---

## 8. Evidence requirements for future implementation

When **separate implementation authorization** is granted, evidence must include:

| # | Requirement |
| --- | --- |
| 1 | Code inspection — UI only touches request detail; uses existing POST route |
| 2 | `npx tsc --noEmit` PASS |
| 3 | `npm run smoke` PASS |
| 4 | `viona-forbidden-claims-check.mjs` PASS (strict) |
| 5 | Visual check — affordance visible only when `submitted`; hidden/disabled when `triage` |
| 6 | Owner-only behavior — non-owner session does not see action |
| 7 | Idempotency replay — repeat POST with same key does not duplicate Timeline events |
| 8 | No mutation beyond authorized status action — no notes spam, no other writes |
| 9 | No assign/confirm/cancel/payment/booking/SOS/wallet/live AI surfaces touched |

**Live QA / staging POST:** Requires **separate operator authorization phrase** after implementation merge — not part of this planning pack.

---

## 9. Future authorization ladder

| Step | Scope | Authorized by this pack |
| --- | --- | --- |
| 1 | **Planning packet** (this document) | **YES** — planning only |
| 2 | Implementation authorization packet | **NO** — separate operator phrase |
| 3 | UI implementation | **NO** |
| 4 | Post-merge verify | **NO** |
| 5 | Staging redeploy | **Only if needed** — separate authorization |
| 6 | Live QA (owner POST + replay) | **NO** — separate operator phrase |

**Operator must explicitly authorize each rung.** Planning does not imply implementation approval.

---

## 10. Explicit deferred scopes

| Category | Defer until |
| --- | --- |
| Controlled status-action UI **implementation** | Separate implementation authorization |
| New status transitions beyond `submitted` → `triage` | Separate packets per transition |
| assign / confirm / cancel | Deferred action categories |
| payment / booking / SOS / wallet / live AI | Unchanged deferred boundary |
| Backend/API/DB/schema changes | Only if proven gap — separate authorization |
| Deploy / bundle refresh | Separate authorization |
| Pack26 | Operator decision — **not opened** |

---

## 11. Safety attestations (this docs pack)

| Check | Result |
| --- | --- |
| Code changed in this pack | **NO** |
| UI changed in this pack | **NO** |
| Controlled status-action UI added | **NO** |
| Deploy / Fly restart | **NO** |
| Live QA run | **NO** |
| Staging endpoint called | **NO** |
| Authentication performed | **NO** |
| Staging data mutated | **NO** |
| Request rows created/seeded/reset/rollback | **NO** |
| DB/Prisma/Supabase/SQL commands run | **NO** |
| Secrets/JWT/PIN/Auth headers/database URLs printed | **NO** |
| `.env*` changed | **NO** |
| New write actions / transitions added | **NO** |
| Backend services/controllers/routes/API DTOs touched | **NO** |
| Assign/confirm/cancel/payment/booking/SOS/wallet/live AI touched | **NO** |
| Pack26 opened | **NO** |

---

## 12. Decision

| Decision | Recommendation |
| --- | --- |
| Controlled status-action UI planning | **COMPLETE** — this packet |
| Implementation | **NOT authorized** |
| Next step when operator is ready | Separate **implementation authorization packet**, then UI work on `VionaRequestLiveDetailReadOnly` |
| Pack26 | **NOT opened** |

**Operator action required for any implementation:** explicit authorization phrase scoped to controlled status-action UI implementation only — not deploy, live QA, or Pack26 unless separately stated.
