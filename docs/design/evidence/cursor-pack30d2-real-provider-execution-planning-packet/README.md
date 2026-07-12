# Evidence — Pack30D-2 Real-Provider Execution Planning Packet

**Packet ID:** `CURSOR_PACK30D2_REAL_PROVIDER_EXECUTION_PLANNING_DOCS_ONLY`
**Product doc (canonical):** `docs/product/VIONA_REQUEST_PACK30D_REAL_EXECUTION_PLAN.md`
**Source master:** `c161ee0` — PR #301 merged
**Branch:** `docs/pack30d-2-real-provider-execution-planning`

---

## Result classification

**`PACK30D2_REAL_PROVIDER_EXECUTION_PLANNING_PACKET_PREPARED_ONLY`**

Docs-only planning packet for the **real-provider execution stage** named in `VIONA_REQUEST_PACK30D_REAL_EXECUTION_DESIGN_PLAN_PACKET.md` §7.2/§10 step 5. Records the operator's phrase `APPROVE_PACK30D_REAL_PROVIDER_EXECUTION_STAGING_QA`, selects **Twilio (via Twilio's own official Test Credentials)** as the first POC provider, designs the `PACK30_REAL_PROVIDER_EXECUTION_ENABLED` feature flag (default `false`, hard-blocked in production), and hands off an exact file allowlist + test plan to a future, separate Pack30D-2 implementation pack. **Zero `.ts`/`.tsx` files touched. Zero real network calls. Zero implementation code.**

---

## Why this packet, and why planning rather than implementation

The operator's initial instruction asked to implement `executeReal()` against real providers (Twilio/OpenAI) directly. Before writing any code, the agent re-read the operator's own, previously-approved `VIONA_REQUEST_PACK30D_REAL_EXECUTION_DESIGN_PLAN_PACKET.md` (PR #289) and found that its §10 staged-rollout ladder requires a **planning packet** (requesting phrase §7.2, defining the file allowlist, sandbox-only credentials, and the feature flag) **before** any implementation — mirroring exactly how every prior Pack29/Pack30 stage worked (design → phrase → plan → implementation, never skipped). The agent surfaced this conflict to the operator via an explicit multiple-choice question rather than proceeding unilaterally in either direction (implementing real calls immediately, or refusing outright). The operator reviewed the options and explicitly chose to follow the documented ladder — this packet **is** that planning step.

---

## Confirmed state (baseline)

| Item | Value |
| --- | --- |
| Current verified master | `c161ee0` |
| Source PR #301 | **MERGED** — Pack30D-3 frontend audit trail timeline UI |
| Pack30D-1 (PR #296) | MERGED — audit ledger writer |
| Pack30D-2 state-machine hooks (PR #300) | MERGED — `stateTransition` event type |
| Pack30D-3 frontend UI (PR #301) | MERGED — read-only Audit Trail Timeline |
| `executeReal()` anywhere in the repo | **Does not exist** — confirmed by repo-wide search |
| `PACK30_REAL_PROVIDER_EXECUTION_ENABLED` anywhere in the repo | **Does not exist** — confirmed by repo-wide search |
| Real execution | **BLOCKED** |
| Production | **NOT AUTHORIZED** |

---

## Design summary

### Provider selection (§3 of the plan)

- **Selected: Twilio**, using Twilio's own officially documented **Test Credentials** mechanism — verified via Twilio's public documentation this session (`https://www.twilio.com/docs/iam/test-credentials`): test-credential calls are guaranteed by Twilio itself to never charge the account, never send a real SMS, and never connect to a real phone number. Deterministic success/failure simulation is available via Twilio's published "magic phone numbers."
- **Deferred: OpenAI** — no analogous zero-cost test mode exists; every real call against a real key is a real, billable call. Not suitable as the *first* POC.
- **Deferred: AWS SES** — even "sandbox mode" delivers a real email to a real (verified) inbox; too close to the forbidden "email to real users" surface.
- **Credential isolation rule:** the future implementation must use new `TWILIO_TEST_ACCOUNT_SID`/`TWILIO_TEST_AUTH_TOKEN` variables and must never reference the existing live `TWILIO_ACCOUNT_SID`/`TWILIO_AUTH_TOKEN`/`TWILIO_PHONE_NUMBER` already used elsewhere in the app for unrelated, live product features (telephony pilot, marketing outbound).

### Feature-flag design (§4 of the plan)

- `PACK30_REAL_PROVIDER_EXECUTION_ENABLED` — defaults to `false` for any unset/empty/non-`"true"` value.
- **Hard-blocked in production regardless of the flag's literal value** — `flagEnabled && !isProductionEnvironment()`. A misconfigured `true` in production still results in a `blocked_operator` outcome.
- Only ever gates the new `executeReal()` path; the existing `executeMock()` (Pack30A) is never affected by this flag.
- No runtime/remote toggle — env var + redeploy only, an auditable, deliberate act.

### Adapter scope for the POC (§5 of the plan)

- Single action family: `sms_notification_v1_test_credentials_only`.
- `validateIntent()` refuses any target number that is not one of Twilio's documented magic numbers.
- `executeReal()` checks the flag first, bounded 10s timeout, try/catch, audits every outcome before returning.
- `rollback()` is a documented no-op (`not_applicable`) — no rollback semantics exist for an SMS send.

### Audit-ledger binding (§7 of the plan)

- Reuses the existing `appendVionaExecutionAuditEvent` (PR #296) and the existing, already-defined event types `executionRealAttempted`/`executionRealSucceeded`/`executionRealFailedBounded`/`executionBlockedOperator` — **no schema change, no new event type needed.**
- `payloadJson` restricted to an explicit, non-secret allowlist of fields; never the auth token, headers, or raw provider request/response body.
- Write happens on every exit path (success, bounded failure, or flag-disabled short-circuit); a write failure never masks the real outcome returned to the caller (same non-blocking contract as Pack30D-1/30D-2).

---

## Exact file allowlist (future Pack30D-2 implementation PR only — NOT this packet)

| # | Path | Change type |
| --- | --- | --- |
| 1 | `src/lib/viona/realProviderAdapter/vionaTwilioTestRealProviderAdapter.ts` | NEW |
| 2 | `src/lib/viona/realProviderAdapter/vionaRealProviderExecutionFlag.ts` | NEW |
| 3 | `src/domain/requests/vionaRequestAuditEventTypes.ts` | NO CHANGE (event types already exist from PR #296) |
| 4 | `src/services/viona/vionaExecutionPlanRouteService.ts` | MODIFY (narrow — opt-in `mode` field only, default behavior byte-for-byte unchanged) |
| 5 | `scripts/test-viona-pack30d2-real-provider-execution-poc.ts` | NEW |
| 6 | `docs/design/evidence/cursor-pack30d2-real-provider-execution-poc-implementation/README.md` | NEW |

No other files may be touched — no `prisma/schema.prisma`, no `src/lib/viona/executionPlan/*`/`src/lib/viona/mockAdapter/*`, no frontend/UI file, no other route/controller, no package/lockfile (unless a genuinely new dependency is separately called out), no `.env*` value changes.

---

## Required test plan (future Pack30D-2 implementation, 13 cases)

Covers: feature-flag disabled, production hard-block, happy path against Twilio Test Credentials, deterministic magic-number failure case, simulated timeout + single retry, idempotent replay, cost/usage-ceiling evidence (test-credentials-only proof per call), audit-write-failure non-blocking contract, credential-isolation source-scan (no live Twilio env var name referenced), secret-marker source-scan, `VionaRequest.status` unchanged, full regression suite (Pack29/30A/30B/30D-1/30D-2/30D-3), and `tsc`/`lint` quality gates. Full detail in the plan document §9.

---

## Staged rollout ladder (repeated for traceability)

| Step | Authorizes | Real provider calls |
| --- | --- | --- |
| Pack30D (design, PR #289) | Design only | NO |
| Pack30D-1 (PR #296) | Durable audit writes, mock-only route | NO |
| Pack30D-2 state-machine hooks (PR #300) | Durable audit writes, state transitions | NO |
| Pack30D-3 frontend UI (PR #301) | Read-only audit trail display | NO |
| **Pack30D-2 real-provider planning (THIS PACKET)** | Provider selection, flag design, allowlist, test plan | **NO — planning only** |
| Pack30D-2 real-provider implementation (future) | `executeReal()` against Twilio Test Credentials only | NO live calls; Test-Credentials-only (Twilio-guaranteed cost-free/side-effect-free) |
| Pack30D-2 staging QA (future) | Verify timeout/retry/circuit-breaker against Test Credentials on staging | Test-Credentials-only |
| Production readiness packet (future, separate legal/ops/finance review) | The only step that could ever authorize a live, billable, real-SMS call | NOT requested, NOT authorized, NOT in scope of any pack so far |

---

## Explicit NO / YES assertions (this packet)

| Assertion | Value |
| --- | --- |
| Planning document written | **YES** |
| Provider selected (Twilio, Test Credentials only) | **YES** |
| Feature-flag designed | **YES** |
| Feature-flag implemented in code | **NO** |
| `executeReal()` implementation written | **NO** |
| Any `.ts`/`.tsx` file touched | **NO** |
| Real network call made (sandbox or live) | **NO** |
| `.env*` value changes | **NO** |
| Deploy/restart | **NO** |
| Staging QA run | **NO** |
| Production | **NO** |
| Secrets printed | **NO** |
| Phrase §7.2 provided and recorded | **YES** |
| Phrase §7.2 authorizes implementation directly | **NO — authorizes proceeding through this planning packet first** |

---

## Drift Report

| Check | Result |
| --- | --- |
| `.ts` / `.tsx` files created or modified | **0 — verified via `git diff --name-only` against `origin/master`** |
| `prisma/schema.prisma` diff | **EMPTY** |
| `.env*` diff | **EMPTY** |
| `package.json` / lockfile diff | **EMPTY** |
| New route / controller | **NONE** |
| Real provider / network code | **NONE** — one illustrative, explicitly-labeled-non-executable snippet inside the markdown plan document only |
| Secrets printed | **NONE** |

---

## Files changed (this packet)

| Action | Path |
| --- | --- |
| Created | `docs/product/VIONA_REQUEST_PACK30D_REAL_EXECUTION_PLAN.md` |
| Created | `docs/design/evidence/cursor-pack30d2-real-provider-execution-planning-packet/README.md` |

---

## Next gate

1. **Open PR** for this planning packet — docs-only, exactly the two files above.
2. **Merge and post-merge verify.**
3. **Docs-only Kernel/Handoff sync** — separate pack; record this packet + the phrase intake on master.
4. **Hold** — no Pack30D-2 implementation from this packet.
5. Only then prepare a **separate Pack30D-2 implementation pack** with exactly the file allowlist above, targeting Twilio Test Credentials only.

Pack29 execution-preview dry-run gate remains **CLOSED_GREEN**. Real execution remains **BLOCKED**. Production remains **NOT AUTHORIZED**. PR chain **#251 → #301** preserved.
