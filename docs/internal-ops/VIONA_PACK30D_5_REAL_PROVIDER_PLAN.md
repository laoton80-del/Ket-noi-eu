# Pack30D-5 — Real-Provider Execution Unlock & Circuit Breaker (Planning Packet, Docs-Only)

**Operator phrase:** `APPROVE_PACK30D_5_REAL_PROVIDER_UNLOCK_PLANNING` — provided this session.
**Status:** Design plan only. **No `.ts`/`.tsx` code written in this packet.**
**Baseline:** `origin/master @ c0144f0` (PR #318 — Pack32 closure Kernel sync, merged).

---

## 0. Mandatory naming/scope corrections (read first)

The Operator's request refers to a flag `isRealExecutionAuthorized`. **No such symbol exists in
this repo.** The actual, already-implemented (Pack30D-4, PR #303) gate is:

- Env var: **`PACK30_REAL_PROVIDER_EXECUTION_ENABLED`** (default unset → `false`)
- Reader function: **`isRealProviderExecutionEnabled()`** in
  `src/lib/viona/realProviderAdapter/vionaRealProviderExecutionFlag.ts`
- Hard production block: **`process.env.NODE_ENV === 'production'` always forces `false`**,
  regardless of the env var — this is independent, defense-in-depth logic, not something a
  Circuit Breaker replaces or weakens.

**OpenAI is a materially different starting point than Twilio and must be planned differently —
this is the single most important finding of this packet:**

| | Twilio (Pack30D-4) | OpenAI |
|---|---|---|
| Real execution today | **Blocked** by `PACK30_REAL_PROVIDER_EXECUTION_ENABLED=false` (default) + prod hard-block | **Already live** in dev/staging/production today, for chat, translation, marketing drafts (Pack32.1), legal scan, and the Pack32 dispatcher's Intent Router — gated only by `OPENAI_API_KEY` being present |
| Governance | Pack30D's flag + production hard-block + audit-bind | **None** — `createRoutedChatCompletion()` (`AIRouterService.ts`) has no flag, no production block, no cost cap |
| "Unlock" meaning | Flip an existing, already-designed, off-by-default flag | There is **no existing Pack30D-governed OpenAI adapter to unlock** — those call sites are separate, already-shipped product features (Pack32.1, chat, translation, legal scan), each with its own prior authorization, and are **out of scope for this pack** |

**Consequence for this plan:** this packet does **not** propose wrapping, gating, or otherwise
touching the already-live, already-shipped, general-purpose OpenAI call sites listed above — doing
so would be uncontrolled scope creep with a blast radius far beyond "Pack30D ladder" and could
break live product features without separate authorization for each of them. Instead, §4 designs a
**new, symmetric OpenAI real-execution adapter** (mirroring the Twilio adapter's exact shape:
flag → production hard-block → Circuit Breaker → real call → audit-bind) for a **future**
Pack32-Tool-Registry entry that does not exist yet. This keeps the "Twilio + OpenAI" scope the
Operator asked for, while being honest that OpenAI's starting point is "not yet built under Pack30D
governance," not "built but flagged off."

---

## 1. Goal

Design a safe, auditable, reversible path to eventually flip Twilio real execution from
off-by-default to authorized-on-staging, and design the equivalent governance for a future
OpenAI-based real-execution tool — **both gated by a new Circuit Breaker / daily budget cap that
auto-locks to mock the instant a spend or call-count threshold is exceeded.** This packet does
**not** flip anything, write any code, or authorize staging QA. It only designs the mechanism and
the exact rollout steps for a **future**, separately authorized implementation + staging QA pack.

---

## 2. What already exists vs. what is new (survey)

| Capability | Status today | Source |
|---|---|---|
| Twilio `executeReal()` | **Built, merged** (Pack30D-4) — Test Credentials + magic numbers only | `vionaTwilioTestRealProviderAdapter.ts` |
| Twilio flag + prod hard-block | **Built** — `PACK30_REAL_PROVIDER_EXECUTION_ENABLED`, default `false`, prod-forced `false` | `vionaRealProviderExecutionFlag.ts` |
| Audit ledger on every Twilio exit path | **Built** — `appendVionaExecutionAuditEvent()` | same file, `writeOutcomeAudit()` |
| Circuit breaker / budget cap | **Does not exist anywhere in this repo** — this packet's core deliverable |
| AI cost-guard modules (`aiCost`/`aiUsage`/`aiEnforcement`) | **Exist, but fixture/preview-only** — pure functions, `DEFAULT_AI_AUTO_PAUSE_POLICY.mode === 'dryRun'`, no live counters, no server-side enforcement anywhere | `src/core/aiCost/`, `src/core/aiUsage/`, `src/core/aiEnforcement/` |
| Redis | **Not a dependency** — zero imports repo-wide; a few comments say "use Redis for multi-node production" but nothing is wired | grep-verified |
| Admin-editable numeric threshold (UI/DB) | **Does not exist** — all existing caps (`AI_COST_GUARD_REGISTRY`, `DEFAULT_COST_FIREWALL_CONFIG`) are static, code-only constants | `src/core/aiCost/aiCostGuardRegistry.ts`, `src/core/monetization/costFirewallConfig.ts` |
| Pack31 escrow (VIO hold/settle/refund) | **Built** — strictly per-request, no daily/aggregate budget concept | `vionaRequestEscrowHoldService.ts` |
| OpenAI real execution | **Already live**, ungated by any Pack30-style flag | `AIRouterService.ts` `createRoutedChatCompletion()` |

**Decision: no new Redis dependency.** This system's threat model is a daily USD budget cap, not
sub-second rate limiting — a Prisma aggregate query over a trailing 24h window has more than
enough resolution, and introducing Redis would add a new infrastructure dependency, a new failure
mode, and a new ops burden for no measurable safety benefit at this scale. Redis remains a
documented, rejected-for-now option (§8).

**Decision: no new Prisma table for spend counting.** Both providers already write durable,
timestamped, queryable rows for every real-execution attempt:

- Twilio: `VionaRequestAuditEvent` rows (`executionRealAttempted`/`executionRealSucceeded`/
  `executionRealFailedBounded`), already written on every `executeVionaTwilioTestPocReal()` call.
- OpenAI (future adapter, §4): would write `LlmApiUsageLog` rows the same way every other
  `createRoutedChatCompletion()` caller already does, tagged with a **new, dedicated**
  `LlmRouterTaskType` value so the breaker's aggregate query can isolate real-execution usage from
  unrelated, out-of-scope OpenAI features (chat/translation/legal-scan/marketing-draft) — this
  isolation is the single most safety-critical property of the OpenAI-side design and has its own
  CRITICAL test (§7, test 5).

The Circuit Breaker is therefore a **read-only aggregation layer over existing tables**, not a new
write path — the only new persistent state is the admin-configured cap itself (§3.3).

---

## 3. Circuit Breaker design

### 3.1 Shape — reuse the existing `aiUsage`/`aiEnforcement` pure-function vocabulary

New pure module `src/lib/viona/circuitBreaker/vionaProviderSpendCircuitBreaker.ts` (future file,
not created by this packet), modeled directly on the existing, already-reviewed
`evaluateAiUsageAgainstGuard()` / `evaluateAiAutoPauseDecision()` shape:

```typescript
export type VionaProviderCircuitBreakerState = 'closed' | 'open';

export type VionaProviderSpendWindow = Readonly<{
  provider: 'twilio' | 'openai';
  windowStartIso: string;   // UTC day boundary
  windowEndIso: string;
  callCount: number;
  estimatedSpendUsdCents: number;
}>;

export type VionaProviderSpendCap = Readonly<{
  provider: 'twilio' | 'openai';
  dailyCapUsdCents: number;   // e.g. 500 = $5.00/day
}>;

export function evaluateVionaProviderCircuitBreaker(
  window: VionaProviderSpendWindow,
  cap: VionaProviderSpendCap,
): Readonly<{ state: VionaProviderCircuitBreakerState; reason: 'under_cap' | 'daily_cap_exceeded' }> {
  // pure, no I/O — window and cap are both pre-computed by the caller
}
```

Pure, synchronous, fully unit-testable with no DB/network mocking — exactly like the existing
`aiUsage` module the repo already trusts.

### 3.2 Counter source — read-only aggregate query, no new writes

New read-only service `src/services/viona/vionaProviderSpendWindowQueryService.ts` (future file):

- `queryVionaTwilioSpendWindow(nowIso)` — `prisma.vionaRequestAuditEvent.count()` /
  aggregate over rows where `eventType` is one of the three Twilio real-execution event types and
  `createdAt >= <UTC day start>`; multiplies count by the **existing**, already-used
  `VIONA_TWILIO_TEST_POC_ESTIMATED_COST_VIO` constant (converted to USD cents via a documented,
  illustrative, not-legally-reviewed FX table — same disclaimer pattern already used by Pack33's
  retention policy) to get `estimatedSpendUsdCents`.
- `queryVionaOpenAiRealExecutionSpendWindow(nowIso)` — `prisma.llmApiUsageLog.aggregate()` over
  rows where `taskType` equals the new, dedicated task type (§4) and `createdAt >= <UTC day
  start>`; converts `totalTokens` to estimated USD cents via a documented per-model rate table.
  **Never aggregates any other `taskType`** — this is the isolation boundary that keeps this
  breaker from ever affecting unrelated OpenAI features.

### 3.3 Cap configuration — env-var only for this pack, explicitly not a new admin DB feature

No DB-editable settings table exists anywhere in this repo today (surveyed in §2). Building one
would be its own, separately-scoped feature (new Prisma model, new admin UI, new RBAC-gated API —
likely a "Pack30D-6" or later). To keep this pack's blast radius minimal and reversible:

- **v1 (this pack, if implemented):** cap is a **static env var**, read once per process, mirroring
  every other Pack30D/31 flag already in this repo:
  - `PACK30D5_TWILIO_DAILY_CAP_USD_CENTS` (e.g. `500` = $5.00/day)
  - `PACK30D5_OPENAI_DAILY_CAP_USD_CENTS`
  - **Missing or unparseable → fail-closed to `0`** (breaker always `open`, i.e. always mock-only)
    — never "unlimited." This mirrors `isProductionEnvironment()`'s own fail-closed-on-error
    pattern in the existing Twilio flag module.
- **Future, separately authorized pack:** could add a DB-backed, admin-UI-editable cap (reusing
  the Pack32.4 admin-UI pattern) without changing the breaker's pure-function core at all — only
  the value's *source* would change.

### 3.4 State machine — deliberately simple, no half-open probing in v1

```
        under cap                                    UTC day rolls over
   ┌───────────────┐                              ┌─────────────────────┐
   │               ▼                              ▼                     │
[CLOSED] ──(spend/count ≥ cap)──▶ [OPEN] ──(new UTC day)──▶ [CLOSED] ────┘
   real calls                    ALL real calls
   proceed normally              auto-fallback to mock,
                                  zero network call made
```

- **No "half-open" probe state in v1.** Once `OPEN`, every real-execution attempt for that
  provider short-circuits to the mock/blocked path for the rest of the UTC day — it never
  automatically tries a real network call again to "test" the breaker. This is a deliberate,
  conservative choice: a probe state would itself spend budget to test whether it's safe to spend
  budget, which is the wrong failure mode for a *budget* breaker (as opposed to a *latency/error*
  breaker, where probing is standard). Reset is purely time-based (UTC day boundary) or,
  optionally, a manual operator action — never automatic retry.
- **Fail-closed everywhere:** any error while querying the spend window (DB unreachable, etc.)
  is treated as `state: 'open'` — a query failure never silently permits real spend.

### 3.5 Integration point — additive only, mirrors the existing blocked-path shape exactly

**Twilio** — inside `executeVionaTwilioTestPocReal()`, insert the breaker check **after** the
existing `isEnabled()` flag check and **before** the network transport call (never after —
zero wasted real spend on a call that's about to be blocked):

```typescript
// existing, unchanged:
if (!isEnabled()) { /* ...blockedOperator, reason: 'flag_disabled'... */ }

// NEW, additive branch — same shape as the existing one above:
const breaker = await evaluateFn(await queryFn(nowIso), cap);
if (breaker.state === 'open') {
  const outcome = { outcome: 'blockedOperator', reason: 'circuit_breaker_open_daily_cap_exceeded' };
  const auditWritten = await writeOutcomeAudit(input, 'executionBlockedOperator', outcome, auditWriter);
  return { requestId: input.requestId, actionId: input.actionId, outcome, auditWritten };
}

// existing, unchanged from here down:
const validation = validateVionaTwilioTestPocIntent(input.intent);
// ...
```

Every existing blocked-path branch (`flag_disabled`, `missing_test_credentials`, policy
validation) stays **byte-for-byte unchanged** — this is purely one new `if` block inserted between
two existing ones, using the exact same `writeOutcomeAudit(...)` helper and the exact same
`blockedOperator` outcome shape the file already uses. `'circuit_breaker_open_daily_cap_exceeded'`
is a new, additive value in the existing `reason` union type — no existing reason value is
renamed or removed.

**OpenAI (future adapter, §4)** — the new adapter's own gate chain would apply the identical
sequence (flag → production hard-block → breaker → real call → audit-bind), never touching
`AIRouterService.ts` or any existing OpenAI call site.

---

## 4. Symmetric governance design for a future OpenAI real-execution tool

Since no Pack30D-governed OpenAI adapter exists yet (§0), this section designs one **on paper
only**, to be built in a future, separately authorized pack — never in this one:

- New env flag `PACK30D_OPENAI_REAL_EXECUTION_ENABLED` (default unset → `false`), read by a new
  `isOpenAiRealExecutionEnabled()` function that reuses the **exact same**
  `isProductionEnvironment()` helper already exported by `vionaRealProviderExecutionFlag.ts` — no
  duplicated production-detection logic.
- New file `src/lib/viona/realProviderAdapter/vionaOpenAiRealProviderAdapter.ts` (future) —
  structurally mirrors `vionaTwilioTestRealProviderAdapter.ts`: flag check → prod hard-block →
  Circuit Breaker check (§3) → call `createRoutedChatCompletion()` with a **new, dedicated**
  `LlmRouterTaskType` (e.g. `VIONA_REAL_EXECUTION_CONTENT` — additive to the existing enum, never
  reusing `COMPLEX_MARKETING` or any task type an existing live feature already uses, precisely so
  the breaker's aggregate query in §3.2 stays isolated) → bind every outcome to the Audit Ledger
  exactly like Twilio does.
- This new adapter would **not** be wired to any HTTP route, any existing Tool Registry entry, or
  any existing screen by this pack — it is designed, not built, and if built (future pack) would
  land exactly as unwired/inert as Pack30D-4's Twilio adapter did at first (PR #303: "not wired to
  any HTTP route — service-layer only").
- **Never touches:** `AIRouterService.ts`, `AIPostGenerator.ts`, `TranslationService.ts`,
  `AIController.ts`, `vionaIntentRouter.ts`, or any other already-shipped, live OpenAI call site.
  A CRITICAL future test (§7, test 10) source-scans for exactly this.

---

## 5. Safe staging-unblock rollout sequence (operational runbook — not executed by this packet)

This packet authorizes **none** of the following steps. It only writes down the sequence so a
future, separately authorized pack can follow it precisely.

1. **Implementation pack** (future, requires its own operator phrase — candidate name
   `APPROVE_PACK30D_5_REAL_PROVIDER_UNLOCK_IMPLEMENTATION`, not requested or granted here): builds
   exactly the file allowlist in §6, with `PACK30_REAL_PROVIDER_EXECUTION_ENABLED` and the new
   `PACK30D_OPENAI_REAL_EXECUTION_ENABLED` **still defaulting to `false` in code** — merging this
   implementation changes zero runtime behavior until an operator explicitly sets an env var.
2. **Deploy to staging** with both flags still `false`. Confirm via staging QA that behavior is
   byte-identical to today's mock-only behavior (regression, not a new capability yet).
3. **Operator sets conservative caps on staging only** (e.g. `PACK30D5_TWILIO_DAILY_CAP_USD_CENTS=100`
   — one dollar, deliberately tiny for a first test) — via Fly staging secrets, never committed to
   git, never set in production.
4. **Operator flips `PACK30_REAL_PROVIDER_EXECUTION_ENABLED=true` on staging only.** The code's own
   `isProductionEnvironment()` hard-block means even an accidental production env var of the same
   name would still evaluate to `false` in production — this is unchanged, independent
   defense-in-depth, not something the breaker replaces.
5. **Bounded staging QA** under the **already-named, still-ungranted** Pack30D-2 phrase
   `APPROVE_PACK30D_REAL_PROVIDER_EXECUTION_STAGING_QA` (named in PR #289 §7.2) — this plan
   explicitly reuses that existing name rather than inventing a competing one for the same step.
   QA verifies: (a) a small number of real Twilio Test-Credential calls succeed and are
   audit-logged; (b) deliberately exceeding the tiny test cap flips the breaker to `open` and every
   subsequent call that day short-circuits to mock with **zero** additional real network calls;
   (c) VIO escrow settle/refund remains correct; (d) the breaker resets at the next UTC day.
6. **OpenAI-side staging QA** (future, its own separately-named phrase — not the same as step 5,
   since it is a materially new capability, not a flag flip) — only after the OpenAI adapter in §4
   is itself built and reviewed.
7. **Production remains a categorically separate, unnamed, far-future gate.** This packet does not
   propose a production phrase name — that decision is deliberately deferred until staging QA (step
   5/6) has actually passed with real data.
8. **Rollback, at any step:** unsetting or setting either flag back to `false` immediately returns
   to today's mock-only behavior — zero code change, zero deploy required. This reversibility
   already exists for Twilio today and is designed to be identical for the future OpenAI adapter.

---

## 6. File allowlist (future implementation pack — not created by this packet)

| # | File | Change | Purpose |
|---|---|---|---|
| 1 | `src/lib/viona/circuitBreaker/vionaProviderSpendCircuitBreaker.ts` | NEW | Pure breaker decision function (§3.1) |
| 2 | `src/services/viona/vionaProviderSpendWindowQueryService.ts` | NEW | Read-only aggregate queries over existing `VionaRequestAuditEvent`/`LlmApiUsageLog` tables (§3.2) |
| 3 | `src/lib/viona/realProviderAdapter/vionaTwilioTestRealProviderAdapter.ts` | MODIFY (additive only) | Insert one new breaker-check branch (§3.5); zero existing lines changed |
| 4 | `src/lib/viona/realProviderAdapter/vionaOpenAiRealProviderAdapter.ts` | NEW | Symmetric OpenAI real-execution adapter, unwired (§4) |
| 5 | `src/lib/viona/realProviderAdapter/vionaRealProviderExecutionFlag.ts` | MODIFY (additive only) | New `isOpenAiRealExecutionEnabled()`, reusing the existing `isProductionEnvironment()` helper unchanged |
| 6 | `prisma/schema.prisma` | MODIFY (additive only) | New `LlmRouterTaskType` enum value `VIONA_REAL_EXECUTION_CONTENT` only — **no new table**, no migration touching existing rows |
| 7 | `.env.example` | MODIFY (additive only) | Document the 4 new env vars (2 flags + 2 caps), names only, never real values |
| 8 | `scripts/test-viona-pack30d-5-real-provider-circuit-breaker.ts` | NEW | Test suite (§7) |
| 9 | `docs/design/evidence/cursor-pack30d-5-real-provider-unlock-implementation/README.md` | NEW | Evidence for the future implementation pack |

No Redis. No new admin-UI/DB-config table (§3.3). No HTTP route. No frontend/UI file. No change to
`AIRouterService.ts` or any other already-shipped OpenAI call site.

---

## 7. Test plan (for the future implementation pack)

1. Breaker `closed` when trailing-window spend/count is under cap → Twilio real call proceeds
   exactly as it does today (regression).
2. Breaker `open` when trailing-window spend/count is at or over cap → call short-circuits with
   **zero** network calls made (transport function never invoked — verified via a call-count spy).
3. Window correctly resets at the UTC day boundary (fixed test clock, no real wall-clock wait).
4. Aggregate query counts **only** the 3 Twilio real-execution event types, never Pack30A/30B
   mock-only preview events.
5. **CRITICAL** — OpenAI-side aggregate query counts **only** the new, dedicated
   `VIONA_REAL_EXECUTION_CONTENT` task type; a fixture row with any other `taskType` (chat,
   translation, marketing draft, legal scan) must **never** be counted.
6. Missing/unparseable cap env var fails closed to a `0` cap (always `open`), never "unlimited."
7. **CRITICAL** — production hard-block (`isProductionEnvironment()`) still forces `false`
   independently of the breaker's state — two-gate defense-in-depth, neither gate can compensate
   for the other being bypassed.
8. Breaker check runs strictly before the network transport call/retry loop — never after.
9. No automatic half-open retry/probe exists — once `open`, a second call in the same window is
   still `open` without re-attempting the network.
10. **CRITICAL source-scan** — the new OpenAI adapter file never imports/references
    `AIRouterService.ts`'s existing exported functions in a way that could affect other callers, and
    no existing file (`AIPostGenerator.ts`, `TranslationService.ts`, `AIController.ts`,
    `vionaIntentRouter.ts`) is modified by this pack.
11. **CRITICAL source-scan** — `vionaTwilioTestRealProviderAdapter.ts`'s diff vs. `origin/master`
    contains only added lines (git-diff line-prefix parsing, same pattern as Pack32.4's test 8).
12. Regression: Pack30D-4 (13/13), Pack31, Pack32, Pack32.5 core integration audit (4/4) — all
    100% PASS, proving the breaker is fully inert/bypassable under normal (under-cap) test
    conditions and changes no existing behavior.

---

## 8. Explicitly rejected/deferred alternatives (documented so they aren't silently reconsidered later)

- **Redis-backed counters** — rejected for now; Prisma aggregate queries suffice at this system's
  scale and threat model (daily budget, not sub-second rate limiting); revisit only if genuine
  multi-instance, high-QPS rate limiting is later required for an unrelated reason.
- **DB-backed, admin-UI-editable cap** — deferred to a future, separately scoped pack; v1 uses a
  static env var, fail-closed on absence, matching every other Pack30D/31 flag already in this
  repo.
- **Half-open probe state** — rejected for a *budget* breaker (as opposed to a *latency/error*
  breaker); probing a budget cap by spending against it is a contradiction. Reset is time-based
  or manual only.
- **Wrapping already-live OpenAI call sites** (chat, translation, marketing drafts, legal scan) —
  rejected; out of scope for "Pack30D ladder," would be uncontrolled scope creep, and risks
  breaking live features without their own separate authorization.

---

## 9. Explicit non-authorization boundary

This packet is **planning only**. It does **not**:

- Write, modify, or generate any `.ts`/`.tsx`/`.prisma` file.
- Flip `PACK30_REAL_PROVIDER_EXECUTION_ENABLED` (or any new flag) to `true` anywhere.
- Build the Circuit Breaker, the OpenAI adapter, or any file in §6.
- Authorize implementation. A future, separate operator phrase (candidate:
  `APPROVE_PACK30D_5_REAL_PROVIDER_UNLOCK_IMPLEMENTATION`) is required before §6's allowlist may be
  built.
- Authorize staging QA. The already-named Pack30D-2 phrase
  `APPROVE_PACK30D_REAL_PROVIDER_EXECUTION_STAGING_QA` remains **required YES / provided NO /
  recorded NO** — unchanged by this packet.
- Authorize production. Production real-provider execution remains a categorically separate,
  unnamed, far-future gate.

Real execution remains **BLOCKED**. Automated social-media posting remains **FORBIDDEN**
(unaffected — this pack is entirely about Twilio/OpenAI real-provider governance, not Pack32
marketing). Production remains **NOT AUTHORIZED**.
