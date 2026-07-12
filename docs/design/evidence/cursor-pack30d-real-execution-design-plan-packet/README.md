# Evidence — Pack30D Real-Execution Design & Planning Packet

**Packet ID:** `CURSOR_PACK30D_REAL_EXECUTION_DESIGN_PLAN_PACKET_DOCS_ONLY`
**Product doc (canonical):** `docs/product/VIONA_REQUEST_PACK30D_REAL_EXECUTION_DESIGN_PLAN_PACKET.md`
**Source master:** `origin/master @ 4c307e0f4677a53a8bc1303f655bbf9803ad4d7b` (`4c307e0`)
**Branch:** `docs/pack30d-real-execution-design-plan`

---

## Result classification

**`PACK30D_REAL_EXECUTION_DESIGN_PLAN_PACKET_PREPARED_ONLY`**

Docs-only design & planning packet for **Pack30D — Real-Execution Design**. Designs the real-provider adapter architecture (payload contract, timeout/retry/circuit-breaker policy, error taxonomy) and the persistent audit ledger (reusing the existing, already-defined `VionaRequestAuditEvent` Prisma model — no new table proposed). Defines a new, narrowly-scoped operator phrase for the first, still mock-only implementation increment. **No implementation, no real execution, no persistent audit writes, no external side effects, no production, no staging QA, no schema/migration** in this packet.

---

## Why Pack30D now (next-lane analysis)

| Candidate | Verdict | Reason |
| --- | --- | --- |
| Redeploy Fly staging first | **DEFERRED, not rejected** | Independent gate; may proceed separately, does not require design work |
| Jump directly to real provider implementation | **REJECTED** | No adapter payload/timeout/retry/error design exists yet; no persistent audit writer exists; no new operator phrase exists for the real-provider stage |
| **Pack30D — real-execution design & planning** | **SELECTED** | Mirrors the Pack30 precedent (design → phrase → plan → mock-only implementation) one level up: design first, hand off a bounded mock-only next increment, keep real execution blocked |

Full reasoning recorded in `docs/product/VIONA_REQUEST_PACK30D_REAL_EXECUTION_DESIGN_PLAN_PACKET.md` §0.

---

## Confirmed state (baseline)

| Item | Value |
|------|--------|
| Current verified master | **`4c307e0f4677a53a8bc1303f655bbf9803ad4d7b`** (`4c307e0`) |
| Source PR #288 | **MERGED / VERIFIED** — Kernel/Handoff sync closing the Pack30C staging QA loop |
| Pack30C staging QA (Fly hosted target, PR #286) | **`BLOCKED_STAGING_ROUTE_MISSING_REDEPLOY_REQUIRED`** — independent, unresolved gate |
| Pack30C staging QA (local-dev target, real DB, PR #287) | **`PASS_EXECUTION_PLAN_PREVIEW_MOCK_ONLY`** — Pack30A/B code verified correct and safe |
| Pack30B route on master | **`POST /api/viona/requests/:id/actions/execution-plan-preview`** — mock-only |
| Pack29 gate | **`CLOSED_GREEN`** |
| PR chain #251 → #288 | **PRESERVED** |
| Pack30D implementation | **NOT EXECUTED** |
| Real execution | **BLOCKED** |
| Persistent audit write | **BLOCKED** |
| External side effects | **BLOCKED** |
| Production | **NOT AUTHORIZED** |
| Fly staging deployment | **STALE — separate gate** |

---

## Design summary

### Real-provider adapter architecture (design only)

- Adapter interface extends the existing Pack30A mock adapter shape with `buildRequestPayload()` and a hard-blocked `executeReal()` gated behind `PACK30_REAL_PROVIDER_EXECUTION_ENABLED` (default `false`).
- Payload contract: `requestId`, `actionFamily`, `idempotencyKey`, `payload`, `operatorApprovalRef`, `consentRef`, `requestedAt`.
- Timeout: bounded per-call (proposed 10s default); retry: at most 1, idempotent failures only, same idempotency key; circuit breaker: opens after N (proposed 5) consecutive bounded failures, fails closed.
- Error taxonomy: `provider_rejected`, `provider_timeout`, `provider_unavailable`, `provider_partial` (flagged for manual reconciliation, never silently retried), `policy_denied`, `circuit_open` — each maps to an existing Pack30 terminal state.

### Persistent audit ledger (design only, reuse existing schema)

- **No new Prisma table proposed.** The append-only `VionaRequestAuditEvent` model already exists in `prisma/schema.prisma` (lines 923-937) together with companion types in `src/domain/requests/vionaRequestAuditEventTypes.ts`.
- Proposes extending the existing `vionaRequestAuditEventTypes` enum with `executionPlanBuilt`, `executionMockInvoked`, `executionRealAttempted`, `executionRealSucceeded`, `executionRealFailedBounded`, `executionBlockedPolicy`, `executionBlockedOperator`, `executionRolledBack`, `executionKilled`.
- Enforcement: application-level `append()`-only write service; no update/delete method ever added.
- First implementation increment (Pack30D-1) would write only `executionPlanBuilt` / `executionMockInvoked` / `executionBlockedPolicy` / `executionBlockedOperator` for the **already-existing, unmodified** mock-only Pack30B route — still zero real-provider calls.

---

## New operator phrase (this packet)

### Requested — Pack30D-1 (still mock-only)

```text
APPROVE_PACK30D_AUDIT_LEDGER_WRITER_DESIGN_TO_IMPLEMENTATION
```

| Field | Value |
|-------|--------|
| Required | **YES** |
| Provided | **NO** (as of this packet) |
| Authorizes | A separate Pack30D-1 implementation pack — durable audit writes for the existing mock-only route only |
| Does NOT authorize | Real provider execution, production, payment/booking/SOS, new DB tables/migrations, deploy |

### Named but NOT requested — real-provider stage (future Pack30D-2)

```text
APPROVE_PACK30D_REAL_PROVIDER_EXECUTION_STAGING_QA
```

| Field | Value |
|-------|--------|
| Required (future) | **YES** |
| Provided | **NO** |
| Requested by this packet | **NO** — deferred to a future Pack30D-2 planning packet, exactly like Pack29's/Pack30C's staging QA phrases were each requested by their own preceding planning packet |

---

## Exact file allowlist (future Pack30D-1 implementation PR only — NOT this packet)

| # | Path | Change type |
|---|------|--------------|
| 1 | `src/domain/requests/vionaRequestAuditEventTypes.ts` | MODIFY (extend enum only) |
| 2 | `src/services/viona/vionaExecutionAuditWriteService.ts` | NEW |
| 3 | `src/services/viona/vionaExecutionPlanRouteService.ts` | MODIFY (add one audit-write call; no response-shape change) |
| 4 | `scripts/test-viona-pack30d1-execution-audit-ledger-writer.ts` | NEW |
| 5 | `docs/design/evidence/cursor-pack30d1-execution-audit-ledger-writer-implementation/README.md` | NEW |

No other files may be touched — no changes to `prisma/schema.prisma` (table already exists), `src/lib/viona/executionPlan/*`, `src/lib/viona/mockAdapter/*`, any other route/controller files, package/lockfiles, or `.env*`.

---

## Required test plan (future Pack30D-1 implementation)

- Mock invocation → `200` unchanged + one `executionMockInvoked` row
- `mock_ready` path → `200` unchanged + one `executionPlanBuilt` row
- Policy denial paths → unchanged response + one `executionBlockedPolicy`/`executionBlockedOperator` row
- Idempotency replay → audit write records `metadata.replay: true`, no misleading duplicate
- Simulated audit-write failure → route response unaffected, never surfaced as `5xx`
- No `VionaRequest.status` mutation
- No real provider call (source-scan drift check)
- No new Prisma model / empty schema diff
- `tsc --noEmit` PASS
- Existing Pack30A/Pack30B tests PASS unchanged (regression)

---

## Staged rollout ladder (Pack30D-specific)

| Step | Authorizes | Real provider calls |
| --- | --- | --- |
| Pack30D (this packet) | Design only | NO |
| Pack30D Kernel/Handoff sync | Docs-only record | NO |
| Pack30D-1 implementation (phrase §7.1) | Durable audit writes, existing mock-only route | NO |
| Pack30D-1 staging QA | Verify audit rows on real request, still mock-only | NO |
| Pack30D-2 planning packet (future) | Would request phrase §7.2 | NO (planning only) |
| Pack30D-2 implementation (phrase §7.2) | `executeReal()` behind hard-blocked flag, sandbox/test only | NO by default; sandbox only if separately enabled |
| Pack30D-2 staging QA (sandbox/test provider) | Verify timeout/retry/circuit-breaker behavior | Sandbox/test only, never live |
| Production readiness packet (separate legal/ops/finance review) | Only step that could ever authorize a live call | Only after this step, if separately authorized |

---

## Explicit NO assertions (this packet)

| Assertion | Value |
|-----------|-------|
| Implementation | **NO** |
| Real provider code written | **NO** |
| Audit-ledger write code written | **NO** |
| Deploy/restart (incl. Fly staging redeploy) | **NO** |
| QA run | **NO** |
| Staging API calls | **NO** |
| Staging mutation | **NO** |
| Request creation | **NO** |
| Request status mutation | **NO** |
| Real execution | **NO** |
| External side effects | **NO** |
| Persistent audit write | **NO** |
| DB / Prisma / Supabase / SQL commands run | **NO** |
| Migration / schema change | **NO** |
| Runtime/source changes | **NO** |
| Package/lockfile changes | **NO** |
| `.env*` changes | **NO** |
| Production | **NO** |
| Secrets printed | **NO** |
| Phrase §7.1 provided | **NO — required YES, provided NO** |
| Phrase §7.2 requested | **NO — intentionally deferred** |
| Payment / booking / SOS / live AI / merchant outbound / email / SMS / push | **NO** |

---

## Safety (this packet)

| Check | Result |
| --- | --- |
| Docs-only | **YES** |
| Deploy/restart in this pack | **NO** |
| QA re-run in this pack | **NO** |
| Staging API calls in this pack | **NO** |
| DB/Prisma/Supabase/SQL in this pack | **NO** |
| New Prisma migration proposed | **NO** (existing table reused) |
| `.env*` modified | **NO** |
| Secrets printed | **NO** |
| Real execution wiring in this pack | **NO** |
| External side effects in this pack | **NO** |
| Production in this pack | **NO** |
| Pack30D-1 implementation in this pack | **NO** |

---

## Files changed (this packet)

| Action | Path |
| --- | --- |
| Created | `docs/product/VIONA_REQUEST_PACK30D_REAL_EXECUTION_DESIGN_PLAN_PACKET.md` |
| Created | `docs/design/evidence/cursor-pack30d-real-execution-design-plan-packet/README.md` |

---

## Next gate

1. **Open PR** for this design & planning packet — merge and post-merge verify.
2. **Docs-only Kernel/Handoff sync** after this packet merges — separate pack.
3. **Hold** — no Pack30D-1 implementation until operator provides `APPROVE_PACK30D_AUDIT_LEDGER_WRITER_DESIGN_TO_IMPLEMENTATION`.
4. Only then prepare a **separate Pack30D-1 implementation pack** with exactly the file allowlist above.
5. **Do not implement Pack30D-1, and do not touch the real-provider stage, from this packet.**

Pack29 execution-preview dry-run gate remains **CLOSED_GREEN**. Real execution remains **BLOCKED**. Production remains **NOT AUTHORIZED**. PR chain **#251 → #288** preserved.

Evidence sources: `docs/product/VIONA_REQUEST_PACK30_CONTROLLED_REAL_EXECUTION_DESIGN_AUTHORIZATION_PACKET.md`, `docs/product/VIONA_REQUEST_PACK30B_EXECUTION_PLAN_ROUTE_WIRING_IMPLEMENTATION_PLAN_PACKET.md`, `docs/product/VIONA_REQUEST_PACK30C_LOCAL_DEV_QA_EXECUTION_PLAN_PREVIEW_RESULT.md`
