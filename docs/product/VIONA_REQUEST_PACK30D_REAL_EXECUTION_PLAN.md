# VIONA Request Engine — Pack30D-2 Real-Provider Execution Planning Packet

**Document type:** Planning packet (docs-only — no implementation, no real execution, no persistent audit write beyond design, no staging QA, no API calls, no deploy, no data mutation, no `.env*`/`.ts`/`.tsx` file touched in this pack).
**Packet ID:** `CURSOR_PACK30D2_REAL_PROVIDER_EXECUTION_PLANNING_DOCS_ONLY`
**Packet name:** `VIONA_REQUEST_PACK30D_REAL_EXECUTION_PLAN` (this is the **Pack30D-2 planning packet** named in `VIONA_REQUEST_PACK30D_REAL_EXECUTION_DESIGN_PLAN_PACKET.md` §10 step 5 / §7.2)
**Source master:** `c161ee0` — PR #301 merged (Pack30D-3 frontend audit trail timeline UI)
**Branch:** `docs/pack30d-2-real-provider-execution-planning`
**Status:** `pack30d2_real_provider_execution_planning_only`
**Result classification:** `PACK30D2_REAL_PROVIDER_EXECUTION_PLANNING_PACKET_PREPARED_ONLY`
**Related:** `docs/product/VIONA_REQUEST_PACK30D_REAL_EXECUTION_DESIGN_PLAN_PACKET.md` (§5, §7.2, §10), `docs/ai-context/VIONA_OPERATING_PROTOCOL.md` (§1.1, §2, §3)

---

## 0. Why this packet now — and why it is planning, not implementation

The operator issued the phrase `APPROVE_PACK30D_REAL_PROVIDER_EXECUTION_STAGING_QA` and asked to "unlock real provider execution." Per the operator's **own, previously-approved design** (`VIONA_REQUEST_PACK30D_REAL_EXECUTION_DESIGN_PLAN_PACKET.md`, merged as PR #289), that phrase does **not** directly authorize `executeReal()` implementation. §10 of that document defines the ladder explicitly:

| Step | Pack | Authorizes | Real provider calls |
| --- | --- | --- | --- |
| 5 | **Pack30D-2 planning packet (this packet)** | Would request phrase §7.2 and define the real-provider adapter's exact file allowlist, sandbox-only credentials, and hard-blocked feature flag | **NO (planning only)** |
| 6 | Pack30D-2 implementation | `executeReal()` behind `PACK30_REAL_PROVIDER_EXECUTION_ENABLED=false` by default, **sandbox/test credentials only, never live** | NO by default; sandbox only if separately enabled in a non-production environment |
| 7 | Pack30D-2 staging QA | Verify timeout/retry/circuit-breaker/error-taxonomy against a **test** endpoint | Sandbox/test only, never live |
| 8 | Production readiness packet (separate legal/ops/finance review) | The **only** step that could ever authorize a live call | Only after this step, if separately authorized |

The operator reviewed this exact conflict and explicitly chose to follow the documented ladder rather than skip to implementation. This packet **is** step 5 — it satisfies the phrase's intake by recording it and using it to author this plan, and it prepares everything step 6 (a future, separate implementation PR) will need. **It writes zero implementation code.**

---

## 1. Header — authorization state (this packet)

| Field | Value |
| --- | --- |
| Pack30D-2 planning authorized | **YES** — this packet |
| Phrase §7.2 (`APPROVE_PACK30D_REAL_PROVIDER_EXECUTION_STAGING_QA`) | **Required: YES \| Provided: YES (operator chat, this session) \| Recorded: YES — this document + evidence + Handoff** |
| Pack30D-2 **implementation** authorized | **NO** — requires a **separate**, future implementation PR scoped to §8 below |
| Real provider execution (any live or sandbox network call) | **NO** — this packet contains no code |
| Persistent audit write | **NO new write in this packet** (design only; extends the existing Pack30D-1 write path in the future implementation) |
| External side effects | **NO** |
| Staging QA authorized (this packet) | **NO** — deferred to a future Pack30D-2 staging QA pack (ladder step 7) |
| API calls authorized (this packet) | **NO** |
| DB write authorized | **NO** |
| Schema/migration authorized | **NO** |
| Deploy/restart authorized | **NO** |
| Production authorized | **NO** |
| `.ts`/`.tsx` file changes in this packet | **NO — zero, verified in §12 Drift Report** |

**This packet authorizes planning for the real-provider stage only.** It does not authorize implementation, any network call (sandbox or live), persistent audit writes, external side effects, staging QA, DB writes, deploy/restart, or production behavior.

---

## 2. Baseline

| Item | State |
| --- | --- |
| Current verified master | `c161ee0` |
| Source PR | **PR #301 merged** — Pack30D-3 frontend audit trail timeline UI |
| Pack30D-1 (audit ledger writer) | **MERGED** (PR #296) — `appendVionaExecutionAuditEvent`, `executionPlanBuilt`/`executionMockInvoked`/etc. event types live |
| Pack30D-2 (state-machine audit hooks) | **MERGED** (PR #300) — `stateTransition` event type |
| Pack30D-3 (frontend audit trail UI) | **MERGED** (PR #301) — read-only Audit Trail Timeline on the live detail screen |
| Pack30B route on master | `POST /api/viona/requests/:id/actions/execution-plan-preview` — **mock-only**, wired only to the Pack30A mock adapter |
| `executeReal()` | **Not implemented anywhere in the codebase** — confirmed by repo-wide search |
| `PACK30_REAL_PROVIDER_EXECUTION_ENABLED` | **Does not exist anywhere in the codebase** — confirmed by repo-wide search |
| Real execution | **BLOCKED** |
| Production | **NOT AUTHORIZED** |

---

## 3. Provider selection for the first real-provider POC (design decision)

### 3.1 Candidates surveyed in the existing codebase

| Provider | Already integrated elsewhere in the app? | Native sandbox/test mode? | Cost model | Selected? |
| --- | --- | --- | --- | --- |
| **Twilio** (SMS) | Yes — `TWILIO_ACCOUNT_SID`/`TWILIO_AUTH_TOKEN`/`TWILIO_PHONE_NUMBER` already power live telephony/marketing features elsewhere (`src/services/liveInterpreterService.ts`, `src/core/telephony/*`, `src/services/marketing/OutboundAiSalesService.ts`) | **YES** — Twilio publishes official **Test Credentials** (separate `TestAccountSid`/`TestAuthToken`, visible on the Twilio Console) plus documented **"magic phone numbers"** that deterministically simulate success and every major failure class, with **zero charge, no real SMS sent, no connection to any real phone number** ([Twilio docs, verified this session](https://www.twilio.com/docs/iam/test-credentials)) | Real mode: per-SMS (~$0.0079-0.05 depending on destination). **Test-credentials mode: always $0.00** | **YES — POC provider** |
| **OpenAI** | Yes — `OPENAI_API_KEY` already powers `src/services/OpenAIService.ts`, `src/services/ai/AIGateway.ts`, AI Copilot | **NO** — OpenAI has no free "test credentials" mode; every real call against a real key incurs a real, billable token cost, however small | Token-metered, real cost on every call, no bounded-zero-cost mode | **NO — deferred**, see §3.3 |
| **AWS SES** (email) | Yes — `AWS_ACCESS_KEY_ID`/`AWS_SECRET_ACCESS_KEY`/`AWS_SES_SENDER_EMAIL` already used for transactional email | Partial — SES "sandbox mode" restricts sending to verified addresses only, but a real email is still delivered to a real inbox | Low cost, but delivers a **real** email to a **real** address even in "sandbox" | **NO — deferred**, real-recipient side effect too close to "email to real users" (explicitly forbidden, §11) |
| Generic outbound webhook | No existing integration | N/A — would require a purpose-built receiver | N/A | **NO — deferred**, no existing infrastructure to safely receive/verify it |

### 3.2 Decision: Twilio SMS, via Twilio's own official Test Credentials, is the POC provider

Twilio is selected as the **first, and only, real-provider POC target** for the future Pack30D-2 implementation increment, for one decisive reason: **Twilio's Test Credentials are a first-party, officially documented mechanism that makes "sandbox/test-mode" a verifiable, structural property of the call itself** — not merely a convention the application promises to honor. When authenticated with the Test Account SID:

- Twilio does **not** charge the account.
- Twilio does **not** send a real SMS to a real phone number.
- Twilio does **not** connect to any number in the live account.
- Success and every documented failure class (invalid number, unroutable number, no international permission, blocked number, non-SMS-capable number, full queue) can be **deterministically** triggered using Twilio's published "magic numbers," which is exactly what the required test plan (§9) needs for the timeout/error-taxonomy test cases from the original design (`VIONA_REQUEST_PACK30D_REAL_EXECUTION_DESIGN_PLAN_PACKET.md` §5.4).

This directly satisfies the operator's requirement (§3 of the operator's instruction this session): *"Provider cụ thể sẽ được tích hợp đầu tiên làm POC và yêu cầu biến môi trường (Credentials) bắt buộc phải là Sandbox/Test-mode."*

### 3.3 OpenAI explicitly deferred, not selected

OpenAI is **not** selected as the POC provider because it has no analogous zero-cost test mode — any call against a real `OPENAI_API_KEY`, even a "test," is a real, billable, real-provider call, which is precisely the class of risk this planning packet exists to avoid for the **first** POC. If a future pack wants an LLM-provider POC, it would need its own, separate planning packet defining a hard token/spend ceiling (e.g. a dedicated low-quota key, `max_tokens` hard cap, and a per-day spend circuit breaker) — **not proposed here**, and **not required** for Pack30D-2, since the adapter interface (§5) is provider-agnostic and Twilio alone is sufficient to prove out `executeReal()`, the feature flag, retry/circuit-breaker logic, and the audit binding end-to-end.

### 3.4 Credential requirement — mandatory, non-negotiable

The future Pack30D-2 implementation **must** use **new, distinct** environment variables and **must never** read the existing live `TWILIO_ACCOUNT_SID` / `TWILIO_AUTH_TOKEN` / `TWILIO_PHONE_NUMBER` (already used by other, unrelated, live product features in this app):

| New env var (future implementation only — not added in this packet) | Purpose |
| --- | --- |
| `TWILIO_TEST_ACCOUNT_SID` | Twilio's official Test Account SID (from the Twilio Console "Test Credentials" panel) |
| `TWILIO_TEST_AUTH_TOKEN` | Twilio's official Test Auth Token (same panel) |
| `PACK30_REAL_PROVIDER_EXECUTION_ENABLED` | Feature flag — see §4 |

A repo-wide drift check (§9, test case 9) in the future implementation PR **must** assert that the new adapter module **never** references `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, or `TWILIO_PHONE_NUMBER` (the existing live variable names) anywhere in its source.

---

## 4. Feature-flag design — `PACK30_REAL_PROVIDER_EXECUTION_ENABLED`

**Scope:** Design only. Not implemented in this packet.

### 4.1 Default and hard-block rules

| Rule | Requirement |
| --- | --- |
| Default value | **`false`** if the environment variable is unset, empty, or any value other than the exact string `"true"` |
| Production hard-block | The flag check **must** be `flagEnabled && !isProductionEnvironment()` — i.e. even if `PACK30_REAL_PROVIDER_EXECUTION_ENABLED=true` is somehow set in a production environment (misconfiguration, copy-paste error), `executeReal()` **must still refuse to run** and return a `blocked_operator`-class result. Production can never enable this flag's effect, regardless of the literal env value |
| No runtime toggle | The flag is read once at adapter construction (or per-call from `process.env`, but never cached across a request boundary in a way that could be raced) — no admin UI, no DB-backed toggle, no remote-config toggle in this or the next increment. Flipping it requires an environment-variable change and a redeploy, which is itself an auditable, deliberate act |
| Fail closed on ambiguity | Any error reading the flag (e.g. `process.env` access throws in an unexpected runtime) **must** resolve to "disabled," never to "enabled" |
| Explicit, separate from mock path | The existing `executeMock()` path (Pack30A, unchanged) is **never** gated by this flag — mock execution remains always-available regardless of the flag's value. The flag **only** ever gates the new `executeReal()` method |

### 4.2 Proposed implementation shape (design only — illustrative, not final code)

```ts
// Illustrative only — not implemented in this packet.
export function isRealProviderExecutionEnabled(): boolean {
  if (isProductionEnvironment()) return false; // hard-blocked, cannot be overridden by the flag
  return process.env.PACK30_REAL_PROVIDER_EXECUTION_ENABLED === 'true';
}
```

`isProductionEnvironment()` would reuse whatever existing environment-detection helper the repo already has (to be identified and reused, not reinvented, in the future implementation PR — no new environment-detection mechanism should be invented if one already exists).

### 4.3 Where the flag is checked

The flag is checked **inside** `executeReal()`, as its first statement, before any payload construction or network call. If disabled, `executeReal()` returns a `blocked_operator` result immediately (see error taxonomy, design packet §5.4) — it never falls through to a real call "by accident" via any other code path, and no other function in the adapter is permitted to bypass this check.

---

## 5. Real-provider adapter — scope for the POC (extends design packet §5, narrowed to Twilio-only)

**Scope:** Design only. Not implemented in this packet.

| Method | Behavior for this POC |
| --- | --- |
| `describe()` | Returns `{ providerName: 'twilio', actionFamily: 'sms_notification_v1_test_credentials_only', riskCategory: 'sandbox_only' }` |
| `validateIntent(intent)` | Rejects any intent whose target phone number is **not** one of Twilio's documented magic numbers (§6) — the adapter refuses to even attempt to build a payload for a real-looking phone number in this POC |
| `buildRequestPayload(intent, context)` | Builds `{ From: <magic 'From' number>, To: <magic 'To' number>, Body: <bounded, non-secret string> }` — pure function, no network call |
| `executeMock(intent, context)` | **Unchanged** — Pack30A's existing mock adapter behavior; this POC never touches it |
| `executeReal(intent, context)` | Checks the flag (§4.3); if enabled, calls the Twilio SMS API using **only** `TWILIO_TEST_ACCOUNT_SID`/`TWILIO_TEST_AUTH_TOKEN`; wraps the call in a single bounded timeout (proposed 10s, per the original design packet §5.3) and try/catch; on any outcome (success or failure), calls the audit-ledger writer (§7) before returning |
| `rollback(metadata)` | Not applicable to an SMS send (no rollback semantics for a message); documented as a no-op for this POC, returning `not_applicable` |

**Explicitly out of scope for the Pack30D-2 implementation increment:** any action family other than `sms_notification_v1_test_credentials_only`; any provider other than Twilio; any write to `VionaRequest.status`; any change to the Pack30B route's response shape.

---

## 6. Test-mode phone numbers (Twilio "magic numbers") to be used by the future test plan

| Value | Role | Simulated outcome |
| --- | --- | --- |
| `+15005550006` | `From` | Passes all validation — used as the sender in every POC test case |
| `+15005550001` | `To` | Invalid phone number (error 21211/21212) |
| `+15005550002` | `To` | Twilio can't route to this number (error 21612) |
| `+15005550003` | `To` | Account lacks international permission (error 21408) |
| `+15005550004` | `To` | Number blocked for the account (error 21610) |
| `+15005550009` | `To` | Number can't receive SMS (error 21614) |
| Any other syntactically valid `To` number | `To` | Validated normally / simulated success |

No number from any real pilot persona, and no number from the app's existing telephony pilot registry (`src/core/telephony/telephonyPilotRegistry.ts`), may ever be used as an input to `executeReal()` in this POC — only the magic numbers above.

---

## 7. Audit-ledger binding for real-provider calls (extends the existing Pack30D-1 writer, no new table)

**Scope:** Design only. Reuses the existing `appendVionaExecutionAuditEvent` function (PR #296) and the existing `VionaRequestAuditEvent` table — **no schema change**.

| Outcome | `eventType` (already defined, PR #296 §6.2 of the design packet) | `payloadJson` (proposed fields, non-secret only) |
| --- | --- | --- |
| Real call attempted | `executionRealAttempted` | `{ actionFamily, idempotencyKey, provider: 'twilio', testCredentialsUsed: true }` |
| Real call succeeded | `executionRealSucceeded` | `{ actionFamily, idempotencyKey, provider: 'twilio', providerResponseStatus, latencyMs }` |
| Real call failed (bounded) | `executionRealFailedBounded` | `{ actionFamily, idempotencyKey, provider: 'twilio', errorClass, errorCode, latencyMs, retried: boolean }` |
| Flag disabled / production hard-block | `executionBlockedOperator` | `{ actionFamily, reason: 'real_provider_execution_flag_disabled' }` |

**Non-negotiable rule carried over from Pack30D-1:** `payloadJson` must never contain `TWILIO_TEST_AUTH_TOKEN`, any header value, or any raw provider request/response body — only the specific, allowlisted fields above. This must be enforced by the same kind of secret-marker drift check already used in the Pack30D-1/30D-2/30D-3 test scripts.

The write call happens in a `finally`-equivalent position (i.e. on **every** code path out of `executeReal()` — success, bounded failure, or flag-disabled short-circuit) so that no real-provider attempt, of any outcome, is ever left unaudited. A write failure must never mask or replace the real outcome returned to the caller (same non-blocking contract as every prior Pack30D increment).

---

## 8. Exact file allowlist — Pack30D-2 implementation (future increment only, NOT this packet)

**Label:** `FUTURE IMPLEMENTATION ONLY — NOT BUILT IN THIS PLANNING PACKET`
**Precondition:** This planning packet merged and post-merge verified; no additional phrase needed beyond the one already recorded in §1 (the phrase authorizes proceeding to this exact allowlist, not to anything broader).

| # | Path | Change type | Purpose |
| --- | --- | --- | --- |
| 1 | `src/lib/viona/realProviderAdapter/vionaTwilioTestRealProviderAdapter.ts` | **NEW** | The `describe()`/`validateIntent()`/`buildRequestPayload()`/`executeReal()`/`rollback()` methods, scoped exactly as §5; imports the Twilio SDK (already a dependency elsewhere in the repo — no new package unless the future PR finds otherwise, in which case that addition must be called out explicitly in that PR) |
| 2 | `src/lib/viona/realProviderAdapter/vionaRealProviderExecutionFlag.ts` | **NEW** | `isRealProviderExecutionEnabled()` per §4, reusing the repo's existing environment-detection helper (to be identified in that PR, not invented) |
| 3 | `src/domain/requests/vionaRequestAuditEventTypes.ts` | **NO CHANGE** | `executionRealAttempted`/`executionRealSucceeded`/`executionRealFailedBounded`/`executionBlockedOperator` already exist (added by Pack30D-1, PR #296) — nothing to add |
| 4 | `src/services/viona/vionaExecutionPlanRouteService.ts` | **MODIFY (narrow)** | Only to route a caller-supplied, explicitly-opt-in `mode: 'real_provider_test_poc'` request field to the new adapter's `executeReal()` instead of `executeMock()` — the existing default behavior (no such field present) is **byte-for-byte unchanged**; this is the **only** touch point into the existing Pack30A/30B code |
| 5 | `scripts/test-viona-pack30d2-real-provider-execution-poc.ts` | **NEW** | `tsx`-based unit tests per §9, using Twilio Test Credentials + magic numbers only |
| 6 | `docs/design/evidence/cursor-pack30d2-real-provider-execution-poc-implementation/README.md` | **NEW** | Evidence doc for that future implementation PR |

**No other files may be touched.** In particular: **no changes** to `prisma/schema.prisma`, `src/lib/viona/executionPlan/*`, `src/lib/viona/mockAdapter/*` (Pack30A mock adapter itself, untouched), any frontend/UI file (`src/components/**`, `src/screens/**`, `app/**`), any route/controller file beyond the one narrow call-site in item 4, package/lockfiles (unless a genuinely new Twilio SDK dependency is required, which must be called out explicitly and separately approved before that PR opens), or `.env*` (adding the **names** `TWILIO_TEST_ACCOUNT_SID`/`TWILIO_TEST_AUTH_TOKEN`/`PACK30_REAL_PROVIDER_EXECUTION_ENABLED` to `.env.example`-style documentation is allowed; setting real **values** in any committed file is never allowed).

| Area | Allowed in the future Pack30D-2 implementation pack |
| --- | --- |
| Real network call to Twilio, using **Test Credentials only** | **YES** — this is the one, narrow exception to "no real provider call" that has existed since Pack29 |
| Real network call using **live** Twilio credentials | **NO — NEVER**, in this or any future increment, without a separate production-readiness packet (§10 step 8) |
| Real network call to any provider other than Twilio | **NO** |
| `VionaRequest.status` mutation | **NO** |
| New DB tables / migrations | **NO** |
| New HTTP routes | **NO** — reuses the existing Pack30B route, opt-in field only |
| Frontend/UI changes | **NO** |
| Deploy scripts / infra | **NO** |
| Staging QA / authenticated calls against this new path | **NO** — separate future pack (ladder step 7) |

---

## 9. Required test plan — Pack30D-2 implementation (future increment only)

| # | Test case | Category (per operator instruction) | Expected outcome |
| --- | --- | --- | --- |
| 1 | Flag disabled (unset / `false` / any non-`"true"` value) | Feature-flag | `executeReal()` returns `blocked_operator` immediately; **zero** network call attempted (verified by a network-call spy/mock throwing if invoked) |
| 2 | Flag `"true"` **and** `isProductionEnvironment()` returns `true` | Feature-flag / production hard-block | `executeReal()` still returns `blocked_operator` — production can never override the hard-block |
| 3 | Flag `"true"`, non-production, magic `From`=`+15005550006`, valid `To` | Happy path | Real call succeeds against Twilio Test Credentials (zero cost, zero real SMS, per Twilio's own guarantee); one `executionRealSucceeded` audit row written with no secrets in `payloadJson` |
| 4 | Flag `"true"`, non-production, `To`=`+15005550009` | Network/error-class error | Bounded failure (`provider_rejected`-class), no retry (not a retryable class); one `executionRealFailedBounded` row written |
| 5 | Flag `"true"`, non-production, simulated timeout (mock the HTTP layer to hang past the bound) | Network error | Call aborts at the configured timeout; treated as `provider_timeout` → `failed_bounded`, eligible for the single automatic retry (same idempotency key) per the design packet §5.3 |
| 6 | Idempotent replay — same idempotency key called twice within the replay window | Idempotency | Second call returns the **stored** first result; **zero** additional real network call attempted |
| 7 | Cost/usage ceiling check | "Kiểm tra giới hạn" (usage-limit check, per operator instruction) | Because Twilio Test Credentials are used exclusively, **every** test in this suite must independently assert `providerResponseIsSimulated: true`-equivalent evidence (e.g. the `TestAccountSid` prefix in the request URL) so that a real quota/spend ceiling is provably never exercised in this POC. (A future, separate LLM-provider POC — not Pack30D-2 — would need an actual token/spend ceiling test, since OpenAI has no zero-cost test mode; not applicable here.) |
| 8 | Audit write failure (simulated) | Non-blocking contract | `executeReal()`'s return value to the caller is unaffected; the write failure is logged, never thrown, never surfaces as a `5xx` |
| 9 | Source-scan drift: no live Twilio env var name referenced | Credential isolation | `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER` (existing live variable names) must not appear anywhere in the new adapter/flag files |
| 10 | Source-scan drift: no secret-like content in any `payloadJson` fixture | Secret hygiene | Same secret-marker check pattern already used in the Pack30D-1/2/3 test scripts |
| 11 | `VionaRequest.status` unchanged before/after every call in the suite | Regression | Unchanged from every prior Pack30 increment |
| 12 | Existing Pack29/30A/30B/30D-1/30D-2/30D-3 test scripts | Regression | **PASS** unchanged |
| 13 | `tsc --noEmit` / `npm run lint` | Quality gate | **PASS**, 0 errors |

---

## 10. Staged rollout ladder (unchanged from the design packet, repeated here for traceability)

| Step | Pack | Authorizes | Real provider calls |
| --- | --- | --- | --- |
| 1 | Pack30D (design) | Design only | NO |
| 2 | Pack30D Kernel/Handoff sync | Docs-only record | NO |
| 3 | Pack30D-1 implementation (PR #296) | Durable audit writes, existing mock-only route | NO |
| 4 | Pack30D-2 state-machine hooks (PR #300) | Durable audit writes, state transitions | NO |
| 5 | Pack30D-3 frontend UI (PR #301) | Read-only audit trail display | NO |
| 6 | **Pack30D-2 real-provider planning (THIS PACKET)** | Provider selection (Twilio Test Credentials), feature-flag design, file allowlist, test plan | **NO — planning only** |
| 7 | Pack30D-2 real-provider implementation (future, separate PR, exact allowlist in §8) | `executeReal()` against **Twilio Test Credentials only** | **NO live calls; Test-Credentials-only calls, which Twilio itself guarantees are cost-free and side-effect-free** |
| 8 | Pack30D-2 staging QA (future, separate pack) | Verify timeout/retry/circuit-breaker/error-taxonomy against Twilio Test Credentials on a staging deployment | Test-Credentials-only |
| 9 | Production readiness packet (separate; legal/ops/finance review per `VIONA_OPERATING_PROTOCOL.md` §1.1, §2, §3) | The **only** step that could ever authorize a **live**, billable, real-SMS-sending call | **NO — not requested, not authorized, not in scope of any pack in this chain so far** |

**Rule, reaffirmed:** Nothing in this packet, and nothing the future Pack30D-2 implementation would build per §8, ever sends a real SMS, ever calls a live credential, or ever reaches a real phone number. The **only** thing "real" about "Pack30D-2 real-provider execution" in this entire chain is that the *code path* through `executeReal()` and a genuine Twilio HTTP endpoint is exercised — using a mechanism Twilio itself designed and documents specifically to make that path side-effect-free.

---

## 11. Non-goals / forbidden scope (unchanged, reaffirmed)

| Forbidden category | Status |
| --- | --- |
| Production | **FORBIDDEN** |
| Live provider call (any provider, any credential that is not a documented test/sandbox credential) | **FORBIDDEN** |
| Real SMS to any real phone number | **FORBIDDEN** |
| Real email to any real address | **FORBIDDEN** |
| Real OpenAI/LLM call in this POC | **FORBIDDEN** (deferred, §3.3) |
| Payment capture / refund | **FORBIDDEN** |
| Confirmed booking | **FORBIDDEN** |
| SOS dispatch / call | **FORBIDDEN** |
| Live AI calling / tool execution | **FORBIDDEN** |
| Merchant outbound commitment | **FORBIDDEN** |
| `VionaRequest.status` mutation from this lane | **FORBIDDEN** |
| DB / Prisma / Supabase / SQL commands run directly | **FORBIDDEN** |
| Schema change / migration | **FORBIDDEN** |
| Runtime / source changes **in this packet** | **FORBIDDEN** — verified empty in §12 |
| `.env*` value changes | **FORBIDDEN** |
| Deploy / restart | **FORBIDDEN** |
| Secrets printed | **FORBIDDEN** |

---

## 12. Drift Report (this packet)

| Check | Result |
| --- | --- |
| `.ts` / `.tsx` file created or modified | **NONE — 0 files** (verified: `git diff --name-only` against `origin/master` for this branch contains only the two markdown files listed in §14) |
| `prisma/schema.prisma` diff | **EMPTY** |
| `.env*` diff | **EMPTY** |
| `package.json` / lockfile diff | **EMPTY** |
| New route / controller | **NONE** |
| Real provider / network code | **NONE** (this document contains one illustrative, non-executable TypeScript snippet in §4.2, explicitly marked "Illustrative only — not implemented in this packet"; it is not part of any `.ts`/`.tsx` source file) |
| Secrets printed | **NONE** — no credential value of any kind appears anywhere in this document |
| Real execution enabled | **NO** |
| Production authorized | **NO** |

---

## 13. Explicit NO / YES assertions (this packet)

| Assertion | Value |
| --- | --- |
| Planning / design document written | **YES** |
| Provider selected for POC (Twilio, Test Credentials only) | **YES** |
| Feature-flag design (`PACK30_REAL_PROVIDER_EXECUTION_ENABLED`, default false, production hard-blocked) | **YES — designed** |
| Feature-flag **implemented** in code | **NO** |
| Exact file allowlist for future implementation | **YES — §8** |
| Test plan for future implementation | **YES — §9** |
| `executeReal()` implementation written | **NO** |
| Any `.ts`/`.tsx` file touched | **NO** |
| Real provider code written | **NO** |
| Real network call made (sandbox or live) | **NO** |
| Deploy/restart | **NO** |
| Staging QA run | **NO** |
| DB / Prisma / Supabase / SQL commands run | **NO** |
| Migration / schema change | **NO** |
| `.env*` value changes | **NO** |
| Production | **NO** |
| Secrets printed | **NO** |
| Phrase §7.2 (`APPROVE_PACK30D_REAL_PROVIDER_EXECUTION_STAGING_QA`) provided and recorded | **YES** |
| Phrase §7.2 authorizes implementation directly | **NO — it authorizes proceeding through this planning packet first, per the ladder in §10, exactly as the operator's own prior design specified** |

---

## 14. Files changed (this packet)

| Action | Path |
| --- | --- |
| Created | `docs/product/VIONA_REQUEST_PACK30D_REAL_EXECUTION_PLAN.md` (this document) |
| Created | `docs/design/evidence/cursor-pack30d2-real-provider-execution-planning-packet/README.md` |

**No other file is touched by this packet.**

---

## 15. Recommended next step

1. **Open PR** for this planning packet — docs-only; exactly the two files in §14.
2. **Merge and post-merge verify.**
3. **Docs-only Kernel/Handoff sync** — separate pack; record this planning packet + the phrase intake on master.
4. Only then prepare a **separate Pack30D-2 implementation pack** with exactly the file allowlist in §8 and the test plan in §9 — targeting **Twilio Test Credentials only**, never live credentials, with the feature flag hard-blocked in production per §4.
5. **Do not implement any part of §8 from this packet.** Do not add `TWILIO_TEST_ACCOUNT_SID`/`TWILIO_TEST_AUTH_TOKEN`/`PACK30_REAL_PROVIDER_EXECUTION_ENABLED` to any `.env*` file from this packet.
6. After a future Pack30D-2 implementation and its own staging QA, the **only** remaining step before any live, billable, real-SMS-sending call could ever be authorized is a separate production-readiness packet with legal/ops/finance review (§10 step 9) — not proposed or scheduled by this packet.

Pack29 execution-preview dry-run gate remains **CLOSED_GREEN**. Real execution remains **BLOCKED**. Production remains **NOT AUTHORIZED**. PR chain **#251 → #301** preserved.

Evidence: `docs/design/evidence/cursor-pack30d2-real-provider-execution-planning-packet/README.md`
