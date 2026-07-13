# Evidence — Pack30D-5 Real-Provider Circuit Breaker (Implementation)

**Operator phrase:** `APPROVE_PACK30D_5_REAL_PROVIDER_UNLOCK_IMPLEMENTATION` — the exact candidate
name proposed in the merged planning packet (PR #319, §5 step 1).
**Baseline:** `origin/master @ 5f4042f` (PR #319 — Pack30D-5 planning packet, merged).
**Plan followed:** `docs/internal-ops/VIONA_PACK30D_5_REAL_PROVIDER_PLAN.md`.

---

## 1. What was built (file allowlist §6, all 9 files)

| # | File | Change | Notes |
|---|---|---|---|
| 1 | `src/lib/viona/circuitBreaker/vionaProviderSpendCircuitBreaker.ts` | NEW | Pure decision module — `evaluateVionaProviderCircuitBreaker()`, `readVionaProviderSpendCapUsdCentsFromEnv()`. No I/O. |
| 2 | `src/services/viona/vionaProviderSpendWindowQueryService.ts` | NEW | Read-only aggregate queries: `queryVionaTwilioSpendWindow()` (over `VionaRequestAuditEvent`), `queryVionaOpenAiRealExecutionSpendWindow()` (over `LlmApiUsageLog`, filtered to `VIONA_REAL_EXECUTION_CONTENT` only). |
| 3 | `src/lib/viona/realProviderAdapter/vionaTwilioTestRealProviderAdapter.ts` | MODIFY (additive) | One new breaker-check branch inserted between the existing flag check and policy validation. Zero existing lines edited — see §3 below for how the `reason` union was extended without touching the pre-existing line. |
| 4 | `src/lib/viona/realProviderAdapter/vionaOpenAiRealProviderAdapter.ts` | NEW | Symmetric, **unwired** OpenAI real-execution adapter — same flag → prod-block → breaker → call → audit-bind shape. Not called by any route/Tool Registry entry/screen. |
| 5 | `src/lib/viona/realProviderAdapter/vionaRealProviderExecutionFlag.ts` | MODIFY (additive) | New `isOpenAiRealExecutionEnabled()` + `VIONA_OPENAI_REAL_EXECUTION_ENV_FLAG` (`PACK30D_OPENAI_REAL_EXECUTION_ENABLED`). Reuses `isProductionEnvironment()` unchanged. |
| 6 | `prisma/schema.prisma` | MODIFY (additive) | New `LlmRouterTaskType` enum value `VIONA_REAL_EXECUTION_CONTENT`. Migration file authored, **not applied** (see §5). |
| 7 | `.env.example` | MODIFY (additive) | Documents `PACK30D5_TWILIO_DAILY_CAP_USD_CENTS`, `PACK30D5_OPENAI_DAILY_CAP_USD_CENTS`, `PACK30D_OPENAI_REAL_EXECUTION_ENABLED` — names only, no real values. |
| 8 | `scripts/test-viona-pack30d-5-real-provider-circuit-breaker.ts` | NEW | 12-case test suite (§7 of the plan). |
| 9 | `docs/design/evidence/cursor-pack30d-5-real-provider-unlock-implementation/README.md` | NEW | This file. |

No Redis. No new admin-UI/DB-config table. No HTTP route. No frontend/UI file. No change to
`AIRouterService.ts` or any other already-shipped OpenAI call site (verified, see §4).

## 2. Runtime behavior change — none, by default

`PACK30_REAL_PROVIDER_EXECUTION_ENABLED` and `PACK30D_OPENAI_REAL_EXECUTION_ENABLED` both still
default to `false` in code. Neither new cap env var (`PACK30D5_TWILIO_DAILY_CAP_USD_CENTS` /
`PACK30D5_OPENAI_DAILY_CAP_USD_CENTS`) is set anywhere in this change — so even in an environment
where an operator *did* flip the execution flag on, the breaker's `readVionaProviderSpendCapUsdCentsFromEnv()`
would resolve to `0` and the breaker would be `open` (blocking 100% of real calls) until an
operator explicitly configures a cap. Merging this changes zero observable behavior today.

## 3. How the `VionaTwilioRealExecutionOutcome` union was extended without editing the existing line

Source (`vionaTwilioTestRealProviderAdapter.ts`):

```typescript
export type VionaTwilioRealExecutionOutcome =
  | Readonly<{ outcome: 'blockedOperator'; reason: 'flag_disabled' | 'missing_test_credentials' }>
  // Pack30D-5 — additive variant sharing the same `outcome: 'blockedOperator'` discriminant as the
  // line above (never edited); TypeScript merges both variants' `reason` literals on narrowing, so
  // `outcome.outcome === 'blockedOperator'` still exposes all three reasons via `outcome.reason`.
  | Readonly<{ outcome: 'blockedOperator'; reason: 'circuit_breaker_open_daily_cap_exceeded' }>
  | Readonly<{ outcome: 'blockedPolicy'; reason: 'invalid_from_number' | 'invalid_to_number' | 'empty_body' }>
  ...
```

TypeScript discriminated unions merge structurally on narrowing: when `outcome.outcome ===
'blockedOperator'` is checked, TypeScript widens to the union of *every* variant carrying that
literal tag, so `outcome.reason` is still typed as `'flag_disabled' | 'missing_test_credentials' |
'circuit_breaker_open_daily_cap_exceeded'`. This lets the new reason value be added as a genuinely
new line rather than a modification of the pre-existing one — confirmed by test 11 below (the
file's `git diff` vs. `origin/master` contains zero removed/modified lines).

## 4. Isolation from existing, already-live OpenAI call sites (verified)

```
$ git diff --stat origin/master -- src/services/ai/AIRouterService.ts src/services/marketing/AIPostGenerator.ts src/lib/viona/dispatcher/vionaIntentRouter.ts
(no output — zero diff)
```

`vionaOpenAiRealProviderAdapter.ts` never imports any of those files, and is never imported by any
of them (confirmed by source-scan test 10). It is also never wired into any HTTP route, Tool
Registry entry, or screen — `grep`-verified zero call sites outside its own test file.

## 5. Database migration — authored, not applied

`prisma/migrations/20260713120000_add_llm_router_task_type_viona_real_execution_content/migration.sql`
adds one `ALTER TYPE ... ADD VALUE` statement (additive-only, standard for enum expansion — no
existing column/table renamed or removed). Per this pack's own boundary and this repo's
established convention (Pack33's migration file used the identical disclaimer), **this migration
has not been applied to any database** in this change. `npx prisma generate` was run locally so
`@prisma/client`'s generated TypeScript types include the new enum member for `tsc --noEmit` to
pass — this does not touch any database schema, only the local generated client code.

## 6. Test results

```
PASS Pack30D-5 real-provider spend Circuit Breaker tests (12/12)
PASS Pack30D-4 Twilio Test-Credentials real-provider POC tests (13/13)
PASS Pack31 financial gateway & escrow tests (14/14 mapped test-plan cases)
PASS Pack32 agentic autonomous dispatcher tests (13/13 runnable test-plan cases + registry integrity check)
PASS Pack32.5 core system integration audit (4/4 end-to-end scenarios)
PASS Pack33 global omni-compliance & localization tests (16/16)
```

`npm run typecheck` — 0 errors. `npm run lint` — 0 errors, 180 pre-existing warnings (unrelated to
this change; none in any file touched/added by this pack).

### Regression-test fixture updates (disclosed)

Three pre-existing test files call `executeVionaTwilioTestPocReal()` directly with a full custom
`deps` object (mocked transport/credentials/audit-writer) but, naturally, predate the
`circuitBreakerCheck` dependency added by this pack. Without an override they fell through to the
new *default*, DB-backed breaker check, which — with no `PACK30D5_TWILIO_DAILY_CAP_USD_CENTS` env
var configured in the test environment — fail-closed to `open` and blocked the call, breaking
their happy-path assertions. Each was updated with one additive
`circuitBreakerCheck: async () => ({ state: 'closed' })` line so they continue to exercise exactly
what they exercised before (flag/validation/retry/idempotency/PII-scrub logic), unaffected by this
pack's new, orthogonal concern:

- `scripts/test-viona-pack30d2-real-provider-execution-poc.ts` (6 call sites)
- `scripts/test-viona-pack32-5-core-integration-audit.ts` (2 call sites)
- `scripts/test-viona-pack33-global-compliance.ts` (1 call site)

No business-logic assertion in any of these three files was changed, weakened, or removed — only
the new, additive DI seam was pinned to `'closed'` so each file's original intent is preserved.

### Known, pre-existing, non-required test-design limitation (not fixed, out of scope)

`scripts/test-viona-pack32-4-marketing-admin-ui.ts`'s own test 7 asserts a **0-line diff vs.
`origin/master`** for a fixed list of backend files including `prisma/schema.prisma` — a
point-in-time scope check written to prove *that* historical PR (#317) never touched backend
files. Because `origin/master` is a floating ref, any later, separately authorized pack that
legitimately touches `prisma/schema.prisma` (as this one does, additively) will always trip that
specific assertion when the script is re-run after such a change. This is not one of the required
regressions named in the approved plan (§7 test 12 lists only Pack30D-4/Pack31/Pack32/Pack32.5),
and fixing a past pack's test-design choice is outside this pack's file allowlist — documented here
rather than silently patched.

## 7. Boundaries held

- **ZERO-INFRA:** no Redis, no new Prisma table/model — only one additive enum value.
- **FAIL-CLOSED:** missing/invalid cap env var → breaker always `open` (verified test 6).
- **No OpenAI wrap:** zero diff on every existing, already-live OpenAI call site (verified test 10, §4).
- **No half-open probe:** verified test 9 — a second call in the same open window never re-attempts the network.
- **Production hard-block independent of the breaker:** verified test 7 (CRITICAL).
