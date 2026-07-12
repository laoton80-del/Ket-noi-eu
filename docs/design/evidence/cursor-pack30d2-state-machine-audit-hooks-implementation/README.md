# Pack30D-2 — State Machine Audit-Ledger Hooks Implementation Evidence

**Packet ID:** `CURSOR_PACK30D2_STATE_MACHINE_AUDIT_HOOKS_IMPLEMENTATION_MOCK_ONLY`
**Operator phrase:** `APPROVE_PACK30D_AUDIT_LEDGER_HOOKS_IMPLEMENTATION` (Required: YES | Provided: YES via operator chat approval | Recorded: YES, this evidence + the accompanying PR)
**Source master:** `ab5cb3d241fedd2ec77ffb092eba179f513c5abd` (`ab5cb3d`) — PR #299 merged
**Branch:** `feat/pack30d-2-state-machine-audit-hooks`
**Result classification:** `PACK30D2_STATE_MACHINE_AUDIT_HOOKS_IMPLEMENTATION_MOCK_ONLY_NO_REAL_EXECUTION`

---

## 1. What this implements

Wires the existing, already-merged Pack30D-1 audit-ledger writer (`appendVionaExecutionAuditEvent`, PR #296) into the **request status state machine** (`vionaRequestStatusActionService.ts` / `vionaRequestStatusMachine.ts`) so that every *committed* `VionaRequest.status` transition also produces a durable, append-only `stateTransition` audit row — in addition to, and without altering, the existing Pack25 `action.status` audit row already written inside the same transaction.

This is a **new increment beyond Pack30D-1's original §8 file allowlist** — the original Pack30D design packet (`docs/product/VIONA_REQUEST_PACK30D_REAL_EXECUTION_DESIGN_PLAN_PACKET.md`) scoped only the mock-only execution-plan-preview route (Pack30B). The operator explicitly authorized this new, distinct increment in this session with a new, distinct phrase: `APPROVE_PACK30D_AUDIT_LEDGER_HOOKS_IMPLEMENTATION`.

## 2. Files touched (exact)

| # | Path | Change type | Purpose |
| --- | --- | --- | --- |
| 1 | `src/domain/requests/vionaRequestAuditEventTypes.ts` | **MODIFY** | Add one new event type, `stateTransition`, without removing any of the 18 pre-existing values |
| 2 | `src/services/viona/vionaRequestStatusActionService.ts` | **MODIFY** | Add a pure builder (`buildVionaStateTransitionAuditEventInput`) and wire a hook call to `appendVionaExecutionAuditEvent` strictly *after* the existing `$transaction` has committed |
| 3 | `scripts/test-viona-pack30d2-state-machine-audit-hooks.ts` | **NEW** | Unit tests for this increment (11/11 PASS) |
| 4 | `scripts/test-viona-pack30d1-execution-audit-ledger-writer.ts` | **MODIFY (regression fix only)** | Updated the exact-event-type-count assertion from 18 to 19 to account for the new `stateTransition` value; no other change |
| 5 | `docs/design/evidence/cursor-pack30d2-state-machine-audit-hooks-implementation/README.md` | **NEW** | This evidence document |

**No other files touched.** In particular: `prisma/schema.prisma` diff is **empty**; no route/controller file; no frontend/UI file (`src/components/**`, `src/screens/**`, `app/**`); no `package.json`/lockfile; no `.env*` file.

## 3. Design decisions

- **Hook fires after commit, not inside the transaction.** The existing Pack25 `$transaction` already writes its own `action.status` audit row atomically with the status update. The new `stateTransition` hook call is placed immediately after that transaction resolves successfully (`transition != null`), mirroring the exact pattern the existing Pack30B route already uses for its own audit write (compute → append → log-and-continue on failure → return). This keeps the state-machine write path's existing atomicity guarantee completely unmodified, and keeps the new hook's failure mode non-blocking (per the same principle documented in the Pack30D design packet §9 test case 5).
- **No hook on idempotent replay.** The early-return branch for a replayed `idempotencyKey` (no new transition occurred) does **not** fire a new `stateTransition` row — firing one there would misrepresent a replay as a fresh transition.
- **No change to the Pack25 narrow allowed-transition scope.** `VIONA_REQUEST_STATUS_ACTION_ALLOWED_TRANSITION` (`submitted -> triage`) is untouched; this hook does not unlock any additional transition. Verified by regression test.
- **No change to the response shape.** `TransitionVionaRequestStatusResult` / `TransitionVionaRequestStatusActionMeta` are untouched — the hook is a pure additive side effect, invisible to the API contract.
- **`stateTransition` payload:** `{ fromStatus, toStatus, statusEventId, idempotencyKey, clientCorrelationId }` — `statusEventId` cross-references the existing `VionaRequestStatusEvent` row created in the same transaction, so the two audit trails (Pack25's `action.status` row and this new `stateTransition` row) can be correlated without duplicating data.

## 4. Quality gates (local)

| Gate | Result |
| --- | --- |
| `npm run typecheck` (`prisma generate` + `tsc --noEmit`) | **PASS**, 0 errors |
| `npm run lint` (`expo lint`) | **PASS**, 0 errors (180 pre-existing warnings, unrelated files, unchanged) |
| `scripts/test-viona-pack30d2-state-machine-audit-hooks.ts` (new) | **PASS 11/11** |
| `scripts/test-viona-pack30d1-execution-audit-ledger-writer.ts` (regression, count assertion updated) | **PASS 12/12** |
| `scripts/test-viona-pack30a-execution-plan.ts` (regression) | **PASS 13/13**, unchanged |
| `scripts/test-viona-pack30b-execution-plan-route.ts` (regression) | **PASS 17/17**, unchanged |

## 5. Drift check

| Check | Result |
| --- | --- |
| `prisma/schema.prisma` diff | **EMPTY** — no migration, no schema change |
| Real provider / network call (`fetch`, `axios`, `http.request`, `XMLHttpRequest`) in touched files | **NONE FOUND** |
| `executeReal()` / `PACK30_REAL_PROVIDER_EXECUTION_ENABLED` introduced | **NO** |
| `.env*` diff | **EMPTY** |
| `package.json` / lockfile diff | **EMPTY** |
| Frontend/UI files touched (`src/components/**`, `src/screens/**`, `app/**`) | **NONE** |
| New HTTP route / controller | **NONE** |
| Pre-existing single `VionaRequest` status-mutation call site (`.updateMany(`) count | **UNCHANGED (1)** — verified by regression test |
| Pack25 allowed-transition scope (`submitted -> triage`) | **UNCHANGED** — verified by regression test |
| `VionaRequest.status` mutated by the new hook code itself | **NO** — hook is read of already-committed state, write-only to `VionaRequestAuditEvent` |
| `VIONA_REQUEST_AUDIT_WRITE_READINESS.statusWritesAllowed` claim | **UNCHANGED** — still `false`; this increment adds an *audit trail hook*, not a new status-write authorization path |

## 6. Boundary (unchanged / reaffirmed)

- Mock-execution scope only — no external API call, no real provider touched.
- No Prisma schema change.
- No frontend/UI created or modified.
- Real execution: **BLOCKED**. Production: **NOT AUTHORIZED**.
- The second, distinct real-provider phrase (`APPROVE_PACK30D_REAL_PROVIDER_EXECUTION_STAGING_QA`) remains **NOT requested / NOT provided** — nothing in this change enables any real network call.

## 7. Next recommended step

Merge + post-merge verify this PR, then a Kernel/Handoff sync recording this increment; a future Pack30D-2 staging QA pack (mirrors the Pack30B → Pack30C precedent) could verify `stateTransition` audit rows are created correctly against a real request over HTTP — still mock-only, still no real provider.
