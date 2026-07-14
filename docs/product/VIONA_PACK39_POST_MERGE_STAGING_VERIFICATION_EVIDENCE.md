# Pack39 — Post-Merge Staging Single-Classification Verification Evidence

Status: **EXECUTION COMPLETE** — verification-only staging run under operator phrase
`APPROVE_PACK39_POST_MERGE_STAGING_VERIFICATION`. No product-code, migration, secret, or remediation
action was performed.

## 1. Verified master SHA

`2866e6594decb433dd5b87bff48271acda821af0` — `docs(ai-context): close Pack39 after merged-master verification (#338)`

Includes Pack39 implementation (via PR #337 merge `3ae223a`) and canonical closure sync (PR #338).

## 2. PR merge states

| PR | Title | State | Merge commit |
|---|---|---|---|
| #336 | Pack39 planning packet | **MERGED** | `b41aceb` (planning) |
| #337 | Pack39 implementation | **MERGED** | `3ae223a8d03b87839861ad24f4132a506af01595` |
| #338 | Pack39 post-merge canonical closure sync | **MERGED** | `2866e6594decb433dd5b87bff48271acda821af0` |

## 3. Staging app

`viona-api-staging-eu` (hostname: `viona-api-staging-eu.fly.dev`)

## 4. Pre/post deployment health

| Check | Result |
|---|---|
| Pre-deploy `GET /health` | **HTTP 200** |
| Post-deploy `GET /health` | **HTTP 200** |

## 5. Local pre-deploy gate results (from verified `origin/master`)

| Gate | Result |
|---|---|
| Pack39 suite | **15/15 PASS** (~2.0s) |
| Pack37 suite | **27/27 PASS** (~1.9s) |
| Full local regression (23 suites, Pack36A live QA excluded) | **23/23 PASS** |
| Typecheck | **0 errors** |
| ESLint (Pack39 touched files) | **0 errors / 0 new warnings** |

No external provider or staging network call occurred during local gates.

## 6. Deployment result

Command: `fly deploy --app viona-api-staging-eu --remote-only`

| Field | Value |
|---|---|
| Result | **SUCCESS** |
| Pre-deploy image | `deployment-01KXG6G8Y1780EQNNWTMVKVM29` (version 21) |
| Post-deploy image | `deployment-01KXGC1AZ87H5B6D0DN2F6KH1K` |
| Deploy source | Verified merged `origin/master` @ `2866e6594decb433dd5b87bff48271acda821af0` |

No Prisma migrate command was run. No Fly secret import/set/rotate/delete was performed.
`OPENAI_API_KEY` secret **name** confirmed present on staging (`fly secrets list`); value was never read or printed.

## 7. Positive webhook QA result

Script: `npx tsx scripts/test-viona-pack36a-staging-webhook-qa.ts --check-idempotency --check-negative`

| Field | Value |
|---|---|
| `externalMessageId` | `pack36a-qa-1784034901332-9advwz` |
| HTTP status | **200** |
| `accepted` | **true** |
| `idempotentReplay` | **false** |
| `dispatchAccepted` | **true** |
| `requestId` | `e7759dbf-e078-4fa9-8c33-be4cfaf0af41` |
| `merchantQueryResult.toolName` | `merchant_schedule_availability_check` |
| `merchantQueryResult.dataAvailable` | **false** |
| `merchantQueryResult.replyText` | Non-empty honest Tier-2 phrased reply (differs from deterministic Tier-1 template) |

Example reply (redacted-safe): *"It looks like this merchant hasn't set up real-time schedule data at the moment."*

## 8. Idempotency replay result

| Field | Value |
|---|---|
| HTTP status | **200** |
| `idempotentReplay` | **true** |
| `requestId` | Same as first call (`e7759dbf-e078-4fa9-8c33-be4cfaf0af41`) |
| `webhookMessageAccepted` audit rows for same `externalMessageId` | **Exactly 1** (no second accepted audit row) |

## 9. Negative-signature control result

| Field | Value |
|---|---|
| HTTP status | **401** |
| Body | `Invalid signature` |
| Accepted request / dispatch side effect | **None** (control only) |

## 10. Audit evidence (read-only DB inspection, secrets/PII redacted)

**Positive request audit trail** (`requestId=e7759dbf-e078-4fa9-8c33-be4cfaf0af41`):

| Audit event ID | Type | Timestamp (UTC) | Notes |
|---|---|---|---|
| `c4f522d1-6c4d-4ce4-b495-64f91b1bbefb` | `webhookMessageAccepted` | 2026-07-14T13:15:01.350Z | `externalMessageId=pack36a-qa-1784034901332-9advwz` |
| `94670739-7871-4d31-b5a4-2a7c033a14a1` | `dispatcherToolSelected` | 2026-07-14T13:15:05.002Z | `toolName=merchant_schedule_availability_check`, `confidence=0.85` |

Exactly **one** `dispatcherToolSelected` row — consistent with a single classification decision driving dispatch.

## 11. Classification call count

Evidence source: read-only `LlmApiUsageLog` rows for `taskType=ROUTING_INQUIRY` in the QA time window
(2026-07-14T13:14:50Z–13:15:30Z), correlated with the positive webhook request timing.

| Metric | Count |
|---|---|
| **classificationCallCount** (large Pack38 prompt; `promptTokens=1008`) | **1** |
| **duplicateClassificationCallCount** (second large prompt for same request) | **0** |

Observed classification row:

- `LlmApiUsageLog` id `54b017a8-c2cb-4778-9a0f-50021d46f233` @ 2026-07-14T13:15:05.001Z
- `promptTokens=1008`, `completionTokens=79`, `model=gpt-4o-mini`

**Pass condition met:** `classificationCallCount = 1`, `duplicateClassificationCallCount = 0`.

## 12. Reply-formatting call count

| Metric | Count |
|---|---|
| **replyFormattingCallCount** (small non-tool-calling reply prompt; `promptTokens=103`) | **1** |

Observed reply-formatting row:

- `LlmApiUsageLog` id `8b70be06-88f9-4fd6-a3d2-77e5a6a6f22f` @ 2026-07-14T13:15:06.396Z
- `promptTokens=103`, `completionTokens=16`, `model=gpt-4o-mini`

This is **allowed** — Tier-2 merchant reply phrasing (`formatVionaMerchantReadOnlyQueryReply()`), not a second classification call.

## 13. How classification vs formatting calls were distinguished

Both paths log `taskType=ROUTING_INQUIRY` in `LlmApiUsageLog` / `[AIRouter]` output, so distinction uses **prompt token shape**, not task type alone:

| Call kind | Expected prompt token pattern | Observed |
|---|---|---|
| Classification (Intent Router / Pack38 few-shot prompt) | Large prompt (~1008 tokens in this environment) | **1 row @ 1008** |
| Duplicate classification (pre-Pack39 bug) | Second ~1008-token row in same request window | **0 rows** |
| Reply formatting (Tier-2 phrasing only) | Small prompt (~103 tokens; no tool registry / few-shot block) | **1 row @ 103** |

Pre-Pack39 staging baseline for the same QA message shape was **2× ~1008** classification calls + optional Tier-2 call. Post-Pack39 deploy observed **1× ~1008 + 1× ~103**.

## 14. Decision-drift verification (code + runtime)

**Code (merged on master):**

- `VionaWebhookMerchantAgentController.ts` computes `intentDecision` once, derives standing approval from that decision, then passes `precomputedIntentDecision: intentDecision` into `dispatchVionaAutonomousRequest()`.
- `vionaAutonomousDispatchService.ts` uses `input.precomputedIntentDecision ?? await routeVionaDispatchIntent(...)` — when precomputed is supplied, no second classification call is made.
- Defensive `findVionaToolRegistryEntry()` re-check remains unconditional.
- `operatorApprovalGranted` / `userConsentGranted` remain caller-supplied only (never LLM-inferred).

**Runtime (this QA request):**

- Single `dispatcherToolSelected` audit for `merchant_schedule_availability_check` matching HTTP `merchantQueryResult.toolName`.
- Single large-prompt LLM usage row — no duplicate classification signature.

## 15. Confirmations

- **No migration or secret change** occurred during this verification task.
- **No product code** was modified during this verification task.
- **No automatic remediation** was attempted.
- **No production deployment** occurred.

## 16. Final staging result

**`CLOSED_GREEN_SINGLE_CLASSIFICATION_VERIFIED`**

Pack39 post-merge staging behavior preserves the merchant webhook happy path, returns
`dispatchAccepted: true` for the established opening-hours QA message, performs **exactly one**
classification LLM call per positive webhook request, and preserves the optional separate Tier-2
reply-formatting call.
