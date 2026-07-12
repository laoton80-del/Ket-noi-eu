# Pack 32.5 — Core System Integration Audit: evidence

Operator phrase: `APPROVE_PACK32_5_CORE_SYSTEM_AUDIT_INTEGRATION`.

Scope: a milestone audit, **not** a new feature increment. Write true end-to-end service-layer
integration tests piercing every layer from Pack30D through Pack32
(`[Mock Request] -> [Dispatcher Intent] -> [Escrow Hold] -> [ExecuteReal (mock network)] ->
[Escrow Settle] -> [Audit Logs Verification]`), and fix — strictly locally, bug-fix only — any
integration bug the audit finds. No new UI, no Prisma schema change, no new Tool.

## 1. What this audit found

Every prior Pack30D-1/30D-2/30D-3/30D-4/31/32 unit test suite is correct **in isolation**, but each
one reached its target function through a fake stand-in for at least one adjacent layer (a fake
`routeExecutor` in the Pack32 dispatcher tests, a made-up non-existent `actionId` in the Pack30D-4
POC tests, etc.). No test in the repository had ever driven a request through the **real, unfaked**
`buildVionaExecutionPlan()` eligibility + readiness chain together with the real
`holdVionaRequestExecutionCost()` / `executeVionaTwilioTestPocReal()` / `settleVionaRequestExecutionHold()`
functions in one call, with only the true system edges (DB, network, LLM) faked out.

Writing that test (`scripts/test-viona-pack32-5-core-integration-audit.ts`) immediately surfaced a
**severe, silent integration bug**:

### Finding A (critical) — the Pack32 dispatcher could never reach `executeReal()` in real life

The Pack32 Tool Registry's only entry (`twilio_test_sms_poc`,
`src/lib/viona/dispatcher/vionaToolRegistry.ts`) declared `linkedActionId: 'live_ai.action'`. That
action id is a real, registered Pack26B action — but it is **permanently hard-blocked** at the
Pack28 execution-integration-readiness layer
(`src/lib/viona/executionIntegration/vionaExecutionIntegrationPolicy.ts`:
`integrationReadinessBucket: 'blocked_sensitive_integration'`, `blockedReason: 'Live AI autonomy
blocked in Pack28.'`). `buildVionaExecutionPlan()`'s readiness gate check
(`readinessGate.blocked`) therefore denies **every** plan built for this action with
`denialReason: 'blocked_lane'` — unconditionally, regardless of the
`PACK30_REAL_PROVIDER_EXECUTION_ENABLED` flag, `operatorApprovalGranted`, or `userConsentGranted`.

Net effect: from the moment PR #307 (Pack32 implementation) merged, `dispatchVionaAutonomousRequest()`
could **never** have reached `executeVionaTwilioTestPocReal()` in a real deployment — the intended
chain (`AI Dispatcher -> Pack31 hold -> Pack30D-4 executeReal -> Pack31 settle`) was structurally
broken at its very first gate. This was invisible to every existing test because each one faked
away exactly this layer. Both `scripts/test-viona-pack30d2-real-provider-execution-poc.ts` (which
uses the placeholder actionId `'request.notify_test_poc'`, itself unknown/blocked) and
`scripts/test-viona-pack32-autonomous-dispatcher.ts` (which injects a fully fake `routeExecutor`)
never exercised this gate for real either.

**Fix applied (local, bug-fix only):** `linkedActionId` corrected from `'live_ai.action'` to
`'request.assign'` — the exact action id the original Pack32 planning packet (§4) itself used as
its own worked example, which is Pack29-eligible and only `operator_review_planning_candidate`
(not blocked) at the Pack28 layer. This restores the already-designed, already-intended data flow
without loosening or touching any safety policy — `live_ai.action` remains exactly as blocked as it
always was; this repo continues to have zero code paths that unblock it.

### Finding B (moderate) — `previewVionaExecutionPlanRealProviderPocRoute()` had zero test seams

The function had no dependency-injection surface at all: `getVionaRequestById()`,
`holdVionaRequestExecutionCost()`, `executeVionaTwilioTestPocReal()`, and
`settleVionaRequestExecutionHold()` were all called as fixed, hard-wired imports. Every other
function in the same chain already accepted injectable deps (a deliberate Pack30D-4/Pack31 design
choice) — this was the one missing seam, and it is exactly why no prior test could reach this
function's real body without a live database.

**Fix applied (local, bug-fix only, additive/backward-compatible):** added an optional
`PreviewVionaExecutionPlanRealProviderPocDeps` parameter (`getVionaRequestByIdFn`, `holdFn`,
`executeRealFn`, `settleFn`, `auditWriter`), each defaulting to the exact pre-existing real
function. Omitting `deps` (as every existing caller does) reproduces byte-for-byte the
pre-Pack32.5 behavior — this is a testability fix, not new business logic.

### Finding C (minor) — a failed escrow hold was only `console.error`-logged, never audited

`previewVionaExecutionPlanRealProviderPocRoute()` wrote an audit row for a **plan-denied**
rejection, but not for an **escrow-hold-denied** rejection (e.g. `insufficient_funds`) — that path
only logged to the server console, leaving no durable ledger trace of why `executeReal()` was never
reached.

**Fix applied (local, bug-fix only):** the hold-failure branch now also writes an
`executionBlockedPolicy` audit row (an existing event type — no new type added) with the hold's
failure reason in `payloadJson`, before returning.

None of the three fixes touch `prisma/schema.prisma`, add a dependency, add a new Tool, or add any
UI. Finding A's fix is a one-line string correction; Finding B's is an additive optional-parameter
seam; Finding C's is one additional call to the pre-existing `appendVionaExecutionAuditEvent()`
writer using a pre-existing event type.

## 2. Files touched

| File | Change |
|---|---|
| `src/lib/viona/dispatcher/vionaToolRegistry.ts` | Finding A fix: `linkedActionId` `'live_ai.action'` -> `'request.assign'`, with an in-code explanation comment. |
| `src/services/viona/vionaExecutionPlanRouteService.ts` | Finding B fix: additive `PreviewVionaExecutionPlanRealProviderPocDeps` DI seam. Finding C fix: audit write on hold failure. |
| `scripts/test-viona-pack32-autonomous-dispatcher.ts` | Cosmetic-only: fixture `actionId` literals updated from `'live_ai.action'` to `'request.assign'` for consistency with Finding A (no assertion in this file ever checked this value — regression-neutral). |
| `scripts/test-viona-pack32-5-core-integration-audit.ts` (NEW) | The audit's own integration test suite — see §3. |

No `.tsx` file, no `prisma/schema.prisma`, no `package.json`/lockfile, no `.env*` file was touched.
Verified with `git diff --stat` against `origin/master` (see §5).

## 3. Integration test suite (`scripts/test-viona-pack32-5-core-integration-audit.ts`)

Calls the real, unmodified `dispatchVionaAutonomousRequest()` -> (real) `routeVionaDispatchIntent()`
-> (real) `findVionaToolRegistryEntry()` -> (real) `previewVionaExecutionPlanRealProviderPocRoute()`
-> (real) `buildVionaExecutionPlan()` -> (real) `holdVionaRequestExecutionCost()` -> (real)
`executeVionaTwilioTestPocReal()` -> (real) `settleVionaRequestExecutionHold()`. Only the true
system edges are faked: the LLM call (`callLlm`), the database (an in-memory fake Prisma client
modelled on Pack31's own test double), and the network transport (`VionaTwilioHttpTransport`).

1. **Happy path** — correct tool selected; hold succeeds; the fake transport returns success;
   settle charges exactly `VIONA_TWILIO_TEST_POC_ESTIMATED_COST_VIO` and clears the lock; the
   ledger records >= 5 events (`dispatcherToolSelected`, `escrowHoldPlaced`,
   `executionRealAttempted`, `executionRealSucceeded`, `escrowSettled`).
2. **Hold fail (insufficient VIO Credits)** — wallet balance is `0`; the hold fails closed with
   `insufficient_funds`; the fake transport asserts it is called **zero** times;
   `realProviderResult` is `null`; the wallet is completely untouched; the ledger records the
   Finding C fix's `executionBlockedPolicy` row.
3. **Network timeout** — hold succeeds; the fake transport times out on both attempts (2 total,
   matching the adapter's own one-retry policy); the outcome classifies as
   `failedBounded`/`provider_timeout`; the hold is refunded in full; the wallet balance is fully
   restored to its pre-hold value — no VIO Credits lost to a network failure.
4. **Settle-throw race condition (regression)** — the real call succeeds, but `settleFn` throws a
   simulated DB error; the route service's own pre-existing `try/catch` converts this to
   `{ ok: false, reason: 'settle_error' }` internally; the already-known, already-succeeded
   `realProviderResult` is still returned unchanged (never lost); the hold row remains `HELD`
   (VIO Credits locked, not lost) pending manual reconciliation — asserted explicitly so a future
   change that silently "fixes" this by auto-refunding is caught as an intentional behavior change,
   not a silent regression.

Run: `npx tsx scripts/test-viona-pack32-5-core-integration-audit.ts` ->
`PASS Pack32.5 core system integration audit (4/4 end-to-end scenarios: happy path, hold-fail,
network-timeout, settle-throw race condition)`.

## 4. Quality gates

- `npm run typecheck` — PASS, 0 errors.
- `npm run lint` — PASS, 0 errors (0 new warnings on any touched file).
- New suite: 4/4 scenarios PASS (see §3).
- Full regression (all pre-existing Viona test scripts), all 100% PASS after the fixes:
  - Pack29 execution gate — PASS
  - Pack30A execution plan — 13/13 PASS
  - Pack30B execution-plan route wiring — 17/17 PASS
  - Pack30D-1 audit ledger writer — 12/12 PASS
  - Pack30D-4 Twilio Test-Credentials POC — 13/13 PASS
  - Pack30D-2 state machine audit hooks — 11/11 PASS
  - Pack30D-3 frontend audit trail timeline — 11/11 PASS
  - Pack31 financial gateway & escrow — 14/14 PASS
  - Pack32 autonomous dispatcher — 13/13 PASS
  - Read-only persistence API check — OK

## 5. Drift report

- `git diff --stat origin/master` — only the 4 files listed in §2 changed; **zero** `.tsx` files,
  **zero** `prisma/schema.prisma` diff, **zero** `package.json`/`package-lock.json` diff, **zero**
  `.env*` diff.
- No new npm dependency installed.
- No new Prisma model/enum/migration.
- No new Tool Registry entry (still exactly one: `twilio_test_sms_poc`).
- No new HTTP route/controller (grep-verified: the dispatcher and the real-provider POC route
  service remain unwired to any Express route, exactly as before this audit).
- No literal `operatorApprovalGranted: true` / `userConsentGranted: true` assignment introduced
  anywhere in the dispatcher or route service (Human-in-the-Loop structural enforcement unchanged).
- No live LLM/Twilio/Stripe call in any test; no secret printed.
- `PACK30_REAL_PROVIDER_EXECUTION_ENABLED` production hard-block: untouched.

## 6. Real execution / production status (unchanged)

Real execution and production remain **BLOCKED / NOT AUTHORIZED**. This audit did not enable, flip,
or bypass any flag, gate, or credential — it corrected the *wiring* between existing, already-
approved safety gates so that, if and when an operator does grant every required phrase/flag/
approval in a non-production environment, the intended chain is actually reachable rather than
silently dead at the first gate. `live_ai.action` remains exactly as blocked as before; this audit
introduces zero new code paths that reach it.
