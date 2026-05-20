# VIONA Local Request Audit Log Design 1

**Document ID:** `VIONA_LOCAL_REQUEST_AUDIT_LOG_DESIGN_1`  
**Type:** Architecture / audit design (docs only — **no** runtime, schema, or UI in this pack)  
**Branch:** `pack-local-request-audit-log-design`  
**Base master:** `485d032` — `docs(operating): merge project kernel expiry apply sync from repo-doc branch`  
**Inputs:** [VIONA Project Kernel](../operating/VIONA_PROJECT_KERNEL.md), [Local Merchant Request ACK API Design](./VIONA_LOCAL_MERCHANT_REQUEST_ACK_API_DESIGN_1.md), [Local Request Expiry Worker Design](./VIONA_LOCAL_REQUEST_EXPIRY_WORKER_DESIGN_1.md), [Local Request Schema Design](./VIONA_LOCAL_REQUEST_SCHEMA_DESIGN_1.md), `prisma/schema.prisma` (read-only reference), implemented Local routes @ `485d032`  
**Date:** 2026-05-20  

**Status:** Design-only / **not implemented** — no audit table, write helper, API, migration, or wallet mutation in this pack.

**Design law:** Local commercial mode on master is **request-only / no charge** (`walletMode=REQUEST_ONLY_NO_CHARGE`, `walletPhase=NONE`). Audit events record **what happened to the request row** — not payment, not escrow, not settlement. **Audit ≠ ledger.**

---

## 1. Purpose

An append-only **Local request audit log** is required **before** further Local automation (expiry at scale, rate limits, public timelines, AI Copilot grounding, and any future wallet hold pack). Without durable audit:

- Lifecycle transitions cannot be reconstructed for ops, merchants, or requesters in disputes.
- Expiry worker accountability (`runId`, skipped races, idempotent replays) has no durable trail beyond row timestamps.
- Silent or mistaken state mutation would be hard to detect.
- Future wallet safety cannot attach finance-grade evidence to the correct request transition.
- AI assistants would lack a trustworthy, read-only history separate from marketing copy.

This document defines **event types**, **actor model**, **proposed future storage**, **PII boundaries**, **wallet/CFO rules**, **AI safety**, **expiry worker policy**, and **implementation phases** — without shipping runtime code in this pack.

**Why now (per Project Kernel §7):** Audit log design is the **next** Local backend item after expiry dry-run and apply (no wallet) are merged. Runtime integration follows in a separate pack.

---

## 2. Current lifecycle events to audit

The following **event types** cover the implemented Local lifecycle and expiry worker artifacts. Exact enum names are proposals for a future `LocalRequestAuditEventType` (schema pack).

| Event type | Source (current / future) | Notes |
|------------|---------------------------|-------|
| `REQUEST_CREATED` | `POST /api/local/requests` | Row lands `REQUESTED` (or policy variant); snapshot wallet fields |
| `MERCHANT_VIEWED` | Future inbox / first merchant open | Optional v1; record only if product needs “seen” evidence |
| `MERCHANT_REVIEW_STARTED` | Future explicit `MERCHANT_REVIEW` transition | Safer than inferring from inbox read alone |
| `MERCHANT_CONFIRMED` | `POST /api/local/merchant/requests/:id/confirm` | `fromStatus` → `toStatus=CONFIRMED` |
| `MERCHANT_REJECTED` | `POST /api/local/merchant/requests/:id/reject` | Terminal |
| `USER_CANCELLED` | `POST /api/local/requests/:id/cancel` | Terminal |
| `OPS_CANCELLED` | `POST /api/local/ops/requests/:id/cancel` | Terminal; ops reason codes |
| `REQUEST_EXPIRED` | Expiry apply worker (future audit integration) | `toStatus=EXPIRED`; system actor |
| `EXPIRY_DRY_RUN_IDENTIFIED` | Expiry dry-run script (future optional) | Per-row or aggregate — see §8 |
| `EXPIRY_APPLY_ATTEMPTED` | Expiry apply worker | Candidate selected for apply |
| `EXPIRY_APPLY_SKIPPED_RACE_CONDITION` | Expiry apply `updateMany` count=0 | Competing mutation won |
| `EXPIRY_APPLY_COMPLETED` | Expiry apply `updateMany` count=1 | Successful transition |

**Not in v1 audit scope until packs exist:** `IN_PROGRESS`, `COMPLETED`, wallet hold/release, booking bridge, notification dispatch.

---

## 3. Actor model

| Actor type | May write audit today? | May mutate request today? | Notes |
|------------|------------------------|---------------------------|-------|
| `REQUESTER` | Future (on create/cancel) | Yes — create, user cancel | `actorUserId` = requester |
| `MERCHANT` | Future (confirm/reject) | Yes — confirm, reject | `actorUserId` = business owner |
| `OPS` | Future (ops cancel) | Yes — ops cancel | `actorUserId` = admin; role verified |
| `SYSTEM` | Future (expiry worker, cron) | Yes — expiry apply only | No JWT; internal job identity |
| `AI_COPILOT_READ_ONLY` | **No** | **No** | Future: read audit only |
| `AI_ACTION_ASSISTANT_FUTURE` | **No** | **No** | Future: human-confirmed actions only |

**Clarifications:**

- **Current runtime actors** that perform durable mutations: requester, merchant (owner), ops (admin), system (expiry apply script/service).
- **AI actors are future-only.** No audit row may imply the AI executed a confirm, cancel, or expiry in Phase B/C without a separate human-confirmed action record.
- `actorUserId` is **nullable** for `SYSTEM` (use `null` + `runId` for workers).
- `businessId` is set when the event is merchant-scoped or useful for inbox correlation; omit for pure requester-only views if redundant.

---

## 4. Suggested audit table / model (design only)

**No Prisma schema change in this pack.** Proposed future model name:

`LocalServiceRequestAuditEvent`

Suggested fields (implementation pack may adjust types/indexes):

| Field | Type (proposal) | Purpose |
|-------|-----------------|--------|
| `id` | UUID PK | Event id |
| `requestId` | UUID FK → `LocalServiceRequest` | SoT link |
| `eventType` | enum / string | See §2 |
| `actorType` | enum | See §3 |
| `actorUserId` | UUID nullable | Human actor when applicable |
| `businessId` | UUID nullable | Merchant context |
| `fromStatus` | `LocalServiceRequestStatus` nullable | Before transition |
| `toStatus` | `LocalServiceRequestStatus` nullable | After transition |
| `reason` | string nullable | e.g. `OPS_CANCEL`, `MERCHANT_REVIEW_TIMEOUT`, `PROVIDER_REJECTED` |
| `safeMessage` | string nullable | Copy-safe internal summary (not PII) |
| `metadataJson` | JSON nullable | Sanitized extras only |
| `noWalletAction` | boolean | **Must be `true` in v1 Local lifecycle** |
| `walletPhaseSnapshot` | `LocalWalletPhase` | At event time |
| `walletModeSnapshot` | `LocalWalletMode` | At event time |
| `requestOnlyNoChargeSnapshot` | boolean | `walletMode=REQUEST_ONLY_NO_CHARGE` at event time |
| `idempotencyKey` | string nullable | Dedup replays |
| `runId` | string nullable | Worker/cron correlation |
| `createdAt` | DateTime UTC | Append-only timestamp |

**Indexes (proposal):** `(requestId, createdAt)`, `(eventType, createdAt)`, `(runId)` where not null.

**Append-only law:** No `UPDATE` or `DELETE` on audit rows in normal operation. Corrections use compensating events, not edits.

### PII and secrets boundaries

**Forbidden in audit rows:**

- Phone numbers, email addresses, PIN, auth tokens
- Raw `metadata` from client create body without sanitization
- `DATABASE_URL`, env secrets, full HTTP headers
- Wallet balances, card data, Firebase VIP payloads

**Allowed:**

- `requestId`, `businessId`, `actorUserId` (internal UUIDs)
- Status enums, reason codes, `merchantReviewDeadlineAt` ISO snapshot in sanitized `metadataJson`
- `safeMessage` using Project Kernel copy rules (no payment implication)

---

## 5. Event rules by transition

### Create request

| Field | Value |
|-------|-------|
| `eventType` | `REQUEST_CREATED` |
| `actorType` | `REQUESTER` |
| `fromStatus` | `null` |
| `toStatus` | `REQUESTED` (or initial status) |
| `noWalletAction` | `true` |
| `idempotencyKey` | `{requestId}:created` (optional) |

Emit **after** successful `LocalServiceRequest` insert.

### Merchant confirm

| Field | Value |
|-------|-------|
| `eventType` | `MERCHANT_CONFIRMED` |
| `actorType` | `MERCHANT` |
| `fromStatus` | `REQUESTED` or `MERCHANT_REVIEW` |
| `toStatus` | `CONFIRMED` |
| `noWalletAction` | `true` |

On idempotent replay (already `CONFIRMED`): emit **no** second transition event, or emit `MERCHANT_CONFIRMED` with `metadataJson: { idempotent: true }` — implementation pack must pick one policy and test it (recommend **skip** duplicate transition events).

### Merchant reject

| Field | Value |
|-------|-------|
| `eventType` | `MERCHANT_REJECTED` |
| `actorType` | `MERCHANT` |
| `toStatus` | `REJECTED` |
| `reason` | `PROVIDER_REJECTED` or controlled enum |

### User cancel

| Field | Value |
|-------|-------|
| `eventType` | `USER_CANCELLED` |
| `actorType` | `REQUESTER` |
| `toStatus` | `USER_CANCELLED` |

### Ops cancel

| Field | Value |
|-------|-------|
| `eventType` | `OPS_CANCELLED` |
| `actorType` | `OPS` |
| `toStatus` | `OPS_CANCELLED` |
| `reason` | `OPS_CANCEL` / `SYSTEM_SAFETY_RELEASE` |

### Expiry dry-run

| Policy | Recommendation |
|--------|----------------|
| Default v1 | **No per-row audit writes** during dry-run (read-only) |
| Optional | Single aggregate `EXPIRY_DRY_RUN_IDENTIFIED` with `metadataJson: { eligibleCount, runId }` at run end |
| Per-row | Defer unless ops requires row-level dry-run proof |

### Expiry apply

For each candidate from dry-run selection:

1. `EXPIRY_APPLY_ATTEMPTED` — before `updateMany` (optional, or fold into completed/skipped only).
2. If `updateMany.count === 0` → `EXPIRY_APPLY_SKIPPED_RACE_CONDITION` (no status change).
3. If `updateMany.count === 1` → `REQUEST_EXPIRED` **and/or** `EXPIRY_APPLY_COMPLETED` (prefer **`REQUEST_EXPIRED`** as user-meaningful; `EXPIRY_APPLY_COMPLETED` as worker bookkeeping — implementation pack may emit one row with both semantics in `safeMessage`).

| Field | Value |
|-------|-------|
| `actorType` | `SYSTEM` |
| `fromStatus` | `REQUESTED` or `MERCHANT_REVIEW` |
| `toStatus` | `EXPIRED` (on success only) |
| `reason` | `MERCHANT_REVIEW_TIMEOUT` |
| `runId` | Worker run UUID |
| `idempotencyKey` | `{runId}:{requestId}:expire` |
| `noWalletAction` | `true` |

**Idempotent apply:** Row already `EXPIRED` → no candidate in dry-run; no apply event.

**Race:** Merchant confirm wins → `EXPIRY_APPLY_SKIPPED_RACE_CONDITION`; do **not** emit `REQUEST_EXPIRED`.

---

## 6. Wallet / CFO safety rules

| Rule | v1 Local (`REQUEST_ONLY_NO_CHARGE`) |
|------|-------------------------------------|
| Audit implies payment | **Forbidden** in `safeMessage` and public projections |
| `Transaction.create` from audit writer | **Forbidden** |
| Wallet balance update | **Forbidden** |
| Debit / hold / release / refund / settlement | **Forbidden** |
| `noWalletAction` on all v1 lifecycle events | **Required `true`** |
| `walletModeSnapshot` | Must reflect row; guard expects `REQUEST_ONLY_NO_CHARGE` |
| `walletPhaseSnapshot` | Must reflect row; guard expects `NONE` |
| Future hold mode events | **Separate CFO-approved pack**; `noWalletAction=false` only with finance sign-off |

Audit is **evidence of request state**, not evidence of money movement. Never use audit copy: “refunded”, “released”, “settled”, “charged” in v1.

---

## 7. AI safety rules

### Phase B — AI Copilot read-only (future)

AI **may:**

- Read `LocalServiceRequestAuditEvent` rows for a `requestId`
- Summarize chronological status history in neutral language
- Explain why a request is `EXPIRED`, `REJECTED`, etc.
- Suggest next step (“wait for merchant”, “contact support”) without executing APIs

AI **may not:**

- Insert audit events that claim `MERCHANT_CONFIRMED` or `USER_CANCELLED` without a matching human/API mutation
- Call confirm/reject/cancel/ops/expiry endpoints
- State that payment occurred

### Phase C — AI Action Assistant (future)

- AI suggests action; **human confirms**; backend API executes; audit records **human/API actor**, not `AI_*` as mutator.
- Optional future event: `AI_SUGGESTION_RECORDED` (read-only advisory, no status change) — out of scope until product approves.

### Separation

`actorType=AI_COPILOT_READ_ONLY` must never appear on rows where `toStatus` changed unless explicitly modeling a bug — **do not use** for normal operations.

---

## 8. Expiry worker audit policy

Aligns with [Expiry Worker Design](./VIONA_LOCAL_REQUEST_EXPIRY_WORKER_DESIGN_1.md) and implemented dry-run/apply scripts.

| Mode | Audit writes (future runtime) |
|------|-------------------------------|
| **Dry-run** | Default: **none** per row; optional one run-level summary with `eligibleCount`, `runId`, `noWalletAction: true` |
| **Apply** | `REQUEST_EXPIRED` per successful expire; `EXPIRY_APPLY_SKIPPED_RACE_CONDITION` optional per skipped id (or aggregate count only) |
| **Run correlation** | Every apply invocation sets `runId` (UUID) on all events in that run |
| **PII** | No requester phone/email in worker logs or audit `safeMessage` |
| **Env guard** | `VIONA_ALLOW_LOCAL_EXPIRY_APPLY=true` — do not log env values in audit |

**Skipped race:** Prefer **aggregate** in run summary (`skippedRaceCount`) over high-volume per-id events unless debugging pack requires per-id.

---

## 9. Public copy / user-facing boundary

Audit events are **internal source-of-truth**. User-facing timelines (future `USER_TIMELINE_1`) are **projections** with safe copy — never raw audit dump.

| Internal event | Example public projection (EN) |
|----------------|-------------------------------|
| `REQUEST_CREATED` | “Request submitted.” |
| `MERCHANT_CONFIRMED` | “Merchant confirmed your request. No payment has been captured.” |
| `MERCHANT_REJECTED` | “Request declined by merchant.” |
| `USER_CANCELLED` | “Request cancelled. No payment was captured.” |
| `OPS_CANCELLED` | “Request cancelled by support.” |
| `REQUEST_EXPIRED` | “Request expired because the merchant did not respond in time. No payment was captured.” |

**Forbidden in public projection:** “Refunded”, “VIO Credits returned”, “Payment reversed”, “Escrow released” (v1).

i18n: Smart Trio (VI / EN / local market) in future copy pack — audit stores language-neutral `reason` codes; projection applies locale.

---

## 10. Runtime implementation plan

| Phase | Pack (proposal) | Delivers |
|-------|-----------------|----------|
| **AUDIT_RUNTIME_1** | Schema + `LocalServiceRequestAuditEvent` + `appendLocalRequestAuditEvent()` helper | Table, indexes, unit tests, no HTTP |
| **AUDIT_RUNTIME_2** | Integrate create, confirm, reject, user cancel, ops cancel | One event per successful transition; idempotent policy |
| **AUDIT_RUNTIME_3** | Integrate expiry apply worker | `REQUEST_EXPIRED`, runId, race skips |
| **AUDIT_READ_API_1** | Internal ops read-only `GET` (admin-only) | Paginated audit by `requestId`; no PII fields |
| **USER_TIMELINE_1** | Safe public timeline projection | Derived DTO for requester app |
| **AI_COPILOT_AUDIT_READ_1** | Read-only AI grounding | RAG/history slice; no writes |

**Ordering:** AUDIT_RUNTIME_1 → 2 before scaling expiry automation reviews; AUDIT_READ_API_1 before merchant-facing dispute tools; AI after read API exists.

**Dependency:** Rate-limit pack (kernel §7) may run parallel to AUDIT_RUNTIME_2 but must not block audit schema.

---

## 11. Forbidden in this design pack

The following are **explicitly not shipped** in `VIONA.LOCAL.REQUEST_AUDIT_LOG_DESIGN.1`:

- Prisma schema edits or migrations
- `LocalServiceRequestAuditEvent` table creation
- Audit write helper or middleware in `src/services/local/`
- Changes to create/confirm/reject/cancel/ops/expiry services
- Controllers, routes, or public HTTP audit APIs
- UI, Home, Travel, Tourism, logo, or visual polish
- Wallet, `Transaction`, Firebase `walletOps`, VIP bridge
- `Booking` / `TourismBooking` creation or linkage
- Project Kernel edits (kernel remains separate operating doc)
- Production claims that audit is “live” before runtime packs merge

---

## 12. Review checklist

Pre-merge checklist for **implementation** packs:

- [ ] Every implemented lifecycle mutation has a defined audit `eventType`
- [ ] Expiry dry-run and apply have distinct policies (no accidental apply audit on dry-run)
- [ ] No audit `safeMessage` implies payment, refund, or settlement in v1
- [ ] No phone, email, secrets, or unsanitized client metadata in audit rows
- [ ] `actorType` and `actorUserId` rules are clear for requester, merchant, ops, system
- [ ] `fromStatus` / `toStatus` populated on transitions; null only for create
- [ ] `idempotencyKey` / `runId` documented for replay and worker runs
- [ ] Race-condition expiry skip represented (event or aggregate)
- [ ] AI read-only boundary documented for Copilot pack
- [ ] `noWalletAction=true` enforced for current Local mode in writer guard
- [ ] Future wallet compatibility preserved (snapshot fields, separate finance pack gate)

---

## References

- [VIONA_PROJECT_KERNEL.md](../operating/VIONA_PROJECT_KERNEL.md) — roadmap, wallet law, AI phases
- [VIONA_LOCAL_MERCHANT_REQUEST_ACK_API_DESIGN_1.md](./VIONA_LOCAL_MERCHANT_REQUEST_ACK_API_DESIGN_1.md) — transitions, audit requirements stub
- [VIONA_LOCAL_REQUEST_EXPIRY_WORKER_DESIGN_1.md](./VIONA_LOCAL_REQUEST_EXPIRY_WORKER_DESIGN_1.md) — expiry audit fields (`TIMEOUT_EXPIRED`, `runId`)
- [VIONA_LOCAL_REQUEST_SCHEMA_DESIGN_1.md](./VIONA_LOCAL_REQUEST_SCHEMA_DESIGN_1.md) — status enum, wallet fields

---

*End of document.*
