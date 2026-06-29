# VIONA Request Engine — Pack25 Controlled Status-Action UI Implementation Authorization Packet

**Document type:** Controlled status-action UI implementation authorization packet (docs-only — no code execution, no UI changes in this pack).
**Packet ID:** `CURSOR_PACK25_CONTROLLED_STATUS_ACTION_UI_IMPLEMENTATION_AUTHORIZATION_PACKET_DOCS_ONLY`
**Baseline:** `origin/master @ 4912d97` — `docs(pack25): plan controlled status action ui (#178)`.
**Related:** `docs/product/VIONA_REQUEST_PACK25_CONTROLLED_STATUS_ACTION_UI_PLANNING.md`, `docs/product/VIONA_REQUEST_PACK25_STATUS_ACTION_IDEMPOTENCY_REPLAY_LIVE_QA_PASS_EVIDENCE.md`, `src/components/viona/requests/VionaRequestLiveDetailReadOnly.tsx`, `src/services/viona/vionaRequestStatusActionService.ts`, `src/services/viona/vionaRequestStatusActionDto.ts`

---

## 1. Packet summary

| Field | Value |
| --- | --- |
| Operating Protocol read | **YES** |
| Docs-only authorization packet | **YES** |
| Current verified master | **`4912d97`** |
| Pack25 status action / idempotency replay | **CLOSED / GREEN** |
| Pack25 read-only visibility + manual UI check | **CLOSED / GREEN** |
| Direction B tile parity + visual pass | **CLOSED / GREEN** |
| Controlled status-action UI planning | **CLOSED / GREEN** — PR #178 |
| UI implementation granted by this packet | **NO** |
| Pack26 opened | **NO** |

**This packet prepares** future controlled status-action UI implementation scope and defines the operator phrase required before any code work. It does **not** implement UI, change backend/API, authenticate, call staging, mutate data, deploy, run live QA, or open Pack26.

---

## 2. Prior gate context (closed on master)

| Gate | Status |
| --- | --- |
| Status action API + idempotency replay | **CLOSED / GREEN** |
| Read-only visibility implementation | **CLOSED / GREEN** |
| Manual UI check authorization + execution | **CLOSED / GREEN** — PR #173, #174 |
| Direction B tile parity + visual pass | **CLOSED / GREEN** — PR #176, #177 |
| Controlled status-action UI planning | **CLOSED / GREEN** — PR #178 @ `4912d97` |
| Controlled status-action UI implementation | **NOT granted** |

**Existing backend on master (no new route planned):**

| Method | Route | Scope |
| --- | --- | --- |
| `POST` | `/api/viona/requests/:id/actions/status` | Owner-only **`submitted` → `triage`** |

---

## 3. Future implementation boundary (when separately authorized)

| Field | Value |
| --- | --- |
| Target surface | `VionaRequestLiveDetailReadOnly` (live inbox request detail) |
| Placement | Near status badge / above Timeline — not global navigation or universe tiles |
| Visibility | Owner-authenticated only; show when status is **`submitted`**; hide or disabled-safe when **`triage`** or unknown |
| Transition | **`submitted` → `triage` only** |
| API | Existing `POST /api/viona/requests/:id/actions/status` — **no new backend route** |
| Idempotency | Client idempotency key per attempt; preserve replay-safe behavior; no duplicate status/audit events on replay |
| UX states | Pending/loading, success, safe error — no destructive language |
| Copy | Review/triage only — no fake automation, booking, payment-ledger, SOS-outcome, or operator-assignment claims |

### Allowed future code touch (UI-only)

| Area | Allowed |
| --- | --- |
| `VionaRequestLiveDetailReadOnly.tsx` | Status-action affordance + states |
| New focused UI component(s) under `src/components/viona/requests/` | If needed for clarity — UI only |
| Client API call wrapper (if not already present) | POST to existing status route only |
| i18n strings for safe copy | Review/triage labels only |
| Types / props wiring | Detail refresh after success |

### Explicitly forbidden in future implementation

| Area | Forbidden |
| --- | --- |
| Backend services/controllers/routes/API DTO changes | **NO** — unless proven gap with separate auth |
| New status transitions | **NO** |
| assign / confirm / cancel | **NO** |
| payment / booking / SOS / wallet / live AI | **NO** |
| Prisma schema / migrations | **NO** |
| Deploy / bundle refresh | **NO** — separate authorization |
| Live QA / staging mutation | **NO** — separate authorization |
| Pack26 | **NO** |

---

## 4. Implementation not yet granted

| Item | Status |
| --- | --- |
| Operator implementation phrase received | **NO** |
| UI code changes authorized | **NO** |
| This packet alone | **Preparation only** |

No agent or engineer may begin UI implementation until the operator issues the exact phrase in §5.

---

## 5. Required operator authorization phrase (before any code)

The following phrase must appear **verbatim** from the operator before UI implementation begins:

```text
I explicitly authorize Pack25 controlled status-action UI implementation from verified origin/master @ 4912d97. Scope is limited to owner-only request detail UI for submitted-to-triage using the existing status action route, preserving idempotency, with no backend changes, no new transitions, no deploy, no live QA, no DB/data work, and no Pack26.
```

**Phrase rules:**

| Rule | Requirement |
| --- | --- |
| Master pin | Must reference **`4912d97`** or later verified master containing this packet |
| Scope | Owner-only request detail UI; **`submitted` → `triage`** only |
| Backend | No changes unless gap proven — separate authorization |
| Deploy / live QA / Pack26 | Explicitly excluded unless separately stated |

---

## 6. Future validation expectations (implementation pack)

When implementation is authorized and executed, evidence must include:

| # | Check |
| --- | --- |
| 1 | Code inspection — UI-only diff; touches `VionaRequestLiveDetailReadOnly` or scoped request UI components only |
| 2 | UI-only scope confirmation — no backend/API/schema/env files |
| 3 | `git diff --check` PASS |
| 4 | Forbidden paths safety grep PASS |
| 5 | `node scripts/viona-forbidden-claims-check.mjs` PASS |
| 6 | `node scripts/viona-forbidden-claims-check.mjs --strict` PASS |
| 7 | `npx tsc --noEmit` PASS |
| 8 | `npm run smoke` PASS |
| 9 | Conflict marker grep PASS |
| 10 | Visual pass — affordance visible only when `submitted`; hidden/disabled when `triage` |
| 11 | Owner-only behavior — non-owner does not see action |
| 12 | Idempotency — replay does not duplicate Timeline events |

---

## 7. Future post-merge ladder

| Step | Scope | Authorized by this packet |
| --- | --- | --- |
| 1 | Implementation authorization packet (this document) | **YES** — preparation only |
| 2 | Operator phrase (§5) | **NO** — operator must issue |
| 3 | UI implementation | **NO** |
| 4 | Post-merge verify | **NO** |
| 5 | Local visual pass | **NO** |
| 6 | Deploy / bundle refresh | **Only if separately authorized** |
| 7 | Live QA (owner POST + replay) | **Only if separately authorized** |

Each rung requires explicit operator authorization unless noted.

---

## 8. Explicitly not authorized by this packet

| Category | Status |
| --- | --- |
| UI implementation in this packet | **NOT authorized** |
| Backend/API changes | **NOT authorized** |
| New transitions | **NOT authorized** |
| assign / confirm / cancel | **NOT authorized** |
| payment / booking / SOS / wallet / live AI | **NOT authorized** |
| Deploy / bundle refresh | **NOT authorized** |
| Live QA | **NOT authorized** |
| DB/data work | **NOT authorized** |
| Pack26 | **NOT authorized** |

---

## 9. Safety attestations (this docs pack)

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

## 10. Decision

| Decision | Recommendation |
| --- | --- |
| Implementation authorization packet | **COMPLETE** — this packet |
| UI implementation | **NOT granted** — await operator phrase §5 |
| Next step when operator is ready | Issue §5 phrase, then authorize UI implementation pack on verified master |

**Operator action required:** issue the exact authorization phrase in §5 before any controlled status-action UI code work begins.
