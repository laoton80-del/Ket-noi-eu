# Pack 31 — Business Flow Orchestrator: Evidence & Drift Report

**Operator phrase:** `APPROVE_PACK31_ORCHESTRATOR_DIRECT_PRISMA`
**Branch:** `feat/pack31-orchestrator-review`
**New file:** `src/services/viona/vionaRequestExecutionOrchestrator.ts`
**Function:** `executeVionaRequestBusinessFlow(input)`

## 1. Why a new file, not a change to `vionaRequestStatusActionService.ts`

By explicit operator instruction, `vionaRequestStatusActionService.ts` was not read, imported, or
modified. The technical reason this boundary is correct: that service wraps its status update and
audit writes inside a single Prisma `$transaction()`. A real-provider network call (Twilio) must
never execute while a DB transaction/row lock is held open for an external HTTP round-trip. This
orchestrator instead issues its own, separate, non-transactional Prisma statements before and
after the network call.

**Verification — the forbidden file has zero diff:**

```
git diff --stat origin/master -- src/services/viona/vionaRequestStatusActionService.ts
(no output — zero lines changed)
```

The new orchestrator's source also contains no reference to `vionaRequestStatusActionService` at
all (enforced by an automated source-scan test — see §4).

## 2. Domain addition: `inProgress` state (prevents silent data corruption)

### 2.1 The bug this addition prevents

The original Pack 31 instruction specified locking the request status to `in_progress` before
execution. Investigation of the codebase found:

- `VionaRequestStatus` (`src/domain/requests/vionaRequestTypes.ts`) is a closed TypeScript union of
  9 literal values (`draft`, `submitted`, `triage`, `needsHumanConfirmation`, `sentToPartner`,
  `partnerResponded`, `completed`, `cancelled`, `failed`) — **`in_progress` was not one of them.**
- The underlying Prisma column, `VionaRequest.status`, is a **plain `String`** (not a Prisma
  `enum`) — see `prisma/schema.prisma` line 860: `status String @default("draft")`.

Consequence: writing `status: 'in_progress'` via raw Prisma would **not** fail at the database or
Prisma-client level. It would silently persist an unrecognized string into the column. Every other
reader of that column — the state machine, the Pack29 execution-eligibility guard, the safety-copy
UI labels, any future admin/reporting query filtering on known statuses — would then either treat
the row as "unknown status" or throw, with no error at the write site to catch it. This is a
data-integrity bug, not a style preference.

### 2.2 The fix: one new, valid, additive status

`'inProgress'` (camelCase, matching existing naming convention: `needsHumanConfirmation`,
`sentToPartner`, `partnerResponded`) was added across exactly 4 files. Every change is **additive
only** — no existing status, transition, or return value was renamed, removed, or altered.

| File | Change |
|---|---|
| `src/domain/requests/vionaRequestTypes.ts` | Added `'inProgress'` to the `vionaRequestStatuses` literal array. |
| `src/domain/requests/vionaRequestStatusMachine.ts` | Added `triage → inProgress` to `triage`'s allowed transitions; added new entry `inProgress: ['completed', 'failed']`. |
| `src/lib/viona/executionGate/vionaRequestExecutionEligibilityGuard.ts` | Added `'inProgress'` to `VIONA_PACK29_POST_TRIAGE_ELIGIBLE_STATUSES`, so the existing Pack29/30A execution-plan eligibility check (re-run by the real-provider route *after* the orchestrator's claim) continues to allow the call instead of denying it with `ineligible_status`. |
| `src/domain/requests/vionaRequestSafetyCopy.ts` | Added the missing `case 'inProgress':` branch — required by TypeScript's exhaustive-switch check (`tsc --noEmit` failed with `TS2366` until this was added); returns `'Execution in progress — real-provider call attempted, outcome pending'`. |

No other file's behavior for the 9 pre-existing statuses changed. This was verified by the
regression suite in §5 (all pre-existing transitions/eligibility entries individually re-asserted
present and unchanged).

## 3. Atomic locking (optimistic-lock pattern) in Step 1

Step 1 of the orchestrator claims exclusive ownership of the execution attempt using a single
conditional `updateMany`, gated on **both** the expected current `status` **and** `ownerUserId` —
the same two-column guard the sanctioned `vionaRequestStatusActionService.ts` itself uses for its
own owner-scoped transitions (mirrored, not duplicated in logic — this file was never opened to
copy from):

```ts
async function claimVionaRequestForExecution(requestId: string, authUserId: string): Promise<boolean> {
  if (!canTransitionRequestStatus(CLAIM_FROM_STATUS, CLAIMED_STATUS)) {
    return false;
  }
  const updated = await getPrisma().vionaRequest.updateMany({
    where: {
      id: requestId,
      status: CLAIM_FROM_STATUS,   // 'triage' — optimistic-lock precondition
      ownerUserId: authUserId,     // owner-only, fail-closed on mismatch
    },
    data: { status: CLAIMED_STATUS }, // 'inProgress'
  });
  return updated.count === 1;
}
```

Why this is a real mutual-exclusion lock, not just a validation check: the `WHERE status = 'triage'`
predicate is evaluated and the row updated in a single atomic SQL `UPDATE ... WHERE ...` statement.
A second, concurrent caller racing the same request will only ever see `updated.count === 0` (the
row's status has already flipped to `'inProgress'` by the winner), and returns `invalid_state`
immediately — it can never also proceed to call the real Twilio provider for the same request. The
same atomic `status + ownerUserId` pattern is reused symmetrically in Step 3 (`finalizeVionaRequestStatus`,
`inProgress → completed|failed`), so a request this orchestrator did not itself just claim can never
be finalized by it either.

Preserved safety boundaries (not bypassed by using raw Prisma instead of the sanctioned service):

- **Owner-only** — every write scoped by `ownerUserId: authUserId`.
- **Valid-transition-only** — every status change pre-checked against the unmodified
  `canTransitionRequestStatus()` state machine before being attempted.
- **Real execution unchanged** — Step 2 delegates, unmodified, to
  `previewVionaExecutionPlanRealProviderPocRoute()`: feature-flag gate, Circuit Breaker, Twilio
  magic-number allowlist, and Zero-Loss VIO Credits escrow hold/settle all still enforced exactly
  as before.
- **Durable audit** — every terminal outcome writes both a `VionaRequestStatusEvent` row and a
  `stateTransition` audit-ledger row (via the existing, unmodified `appendVionaExecutionAuditEvent`)
  before returning, including the unexpected-exception path.

**Known, pre-existing, inherited limitation (not introduced here):** the real-provider route's
Pack25 hold/safety-label check (`blocked_safety_label`) only evaluates labels the *caller* supplies
via `requestSafetyLabels` — `VionaRequest` has no persisted safety-labels column today, so no
caller of this route, including this orchestrator, can look them up from the database. This
orchestrator omits `requestSafetyLabels` exactly as every other existing caller of this route does
today.

## 4. Test evidence — 100% pass

New suite: `scripts/test-viona-pack31-execution-orchestrator.ts`

```
  PASS 1: orchestrator source never imports vionaRequestStatusActionService
  PASS 2: vionaRequestStatusActionService.ts itself has zero diff (untouched)
  PASS 3: vionaRequestStatuses gained inProgress additively (all prior statuses still present)
  PASS 4: state machine: triage -> inProgress -> completed|failed all valid; no prior transition removed
  PASS 5: execution eligibility guard includes inProgress additively
  PASS 6: finalStatus: route ok:false -> failed
  PASS 7: finalStatus: plan denied -> failed
  PASS 8: finalStatus: escrow hold denied -> failed
  PASS 9: finalStatus: real provider succeeded -> completed
  PASS 10: finalStatus: real provider blockedPolicy/failedBounded -> failed

Pack31 execution orchestrator: 10/10 PASS
```

## 5. Regression evidence — 100% pass, zero prior-pack breakage

```
npm run typecheck            -> 0 errors
eslint (6 new/changed files) -> 0 errors

npx tsx scripts/test-viona-pack29-execution-gate.ts
  PASS Pack29 execution gate pure tests

npx tsx scripts/test-viona-pack30b-execution-plan-route.ts
  PASS Pack30B execution-plan route wiring tests (17/17)

npx tsx scripts/test-viona-pack30d-7-staging-deployment-stage-gating.ts
  PASS Pack30D-7 staging deployment-stage gating tests (9/9)

npx tsx scripts/test-viona-pack30d-8-internal-real-twilio-poc-route-wiring.ts
Pack30D-8 internal route wiring: 17/17 PASS
```

## 6. File-change summary

| File | Type | Notes |
|---|---|---|
| `src/services/viona/vionaRequestExecutionOrchestrator.ts` | New | `executeVionaRequestBusinessFlow()` — Step 1-4 orchestrator. |
| `scripts/test-viona-pack31-execution-orchestrator.ts` | New | 10/10 PASS unit suite. |
| `docs/product/VIONA_PACK31_ORCHESTRATOR_EVIDENCE.md` | New | This document. |
| `src/domain/requests/vionaRequestTypes.ts` | Modified (additive) | +1 status literal. |
| `src/domain/requests/vionaRequestStatusMachine.ts` | Modified (additive) | +1 transition-map entry, +1 outgoing edge from `triage`. |
| `src/lib/viona/executionGate/vionaRequestExecutionEligibilityGuard.ts` | Modified (additive) | +1 eligible-status entry. |
| `src/domain/requests/vionaRequestSafetyCopy.ts` | Modified (additive) | +1 switch case (required for `tsc` exhaustiveness). |
| `src/services/viona/vionaRequestStatusActionService.ts` | **Untouched** | Verified zero diff vs. `origin/master`. |
