# Pack40DS — Staging Controlled Indirect Execution QA Evidence

Operator authorization: `APPROVE_PACK40DS_STAGING_CONTROLLED_INDIRECT_EXECUTION_QA`

QA invariants: **PASS** (one merchant execution; one Twilio test-SMS; denials/duplicate zero side effects)

Evidence PR classification: `READY_FOR_PACK40DS_QA_EVIDENCE_PR_REVIEW`

Pack40D remains **not CLOSED/GREEN** until evidence merge and any subsequent operator closure sync.

## Deployed-state markers (unchanged posture)

```text
PACK40D_CONTROLLED_INDIRECT_EXECUTION_DEPLOYED_TO_STAGING
PACK40D_SIGNED_WEBHOOK_EXECUTION_DISABLED
PACK40D_RECOVERY_RECONCILIATION_NOT_IMPLEMENTED
```

Live execution QA for this controlled path is complete under this authorization; signed-webhook execution and recovery remain disabled/unimplemented.

## 1. Verified master SHA

`bd72de56953ad90fccf653059ad42b4ebd0bbea9`

## 2. PR #374 merge state

- State: **MERGED**
- Title: `docs(viona): Pack40DD staging controlled indirect execution deployment evidence`
- Merged at: `2026-07-15T21:18:06Z`
- Merge commit: `bd72de56953ad90fccf653059ad42b4ebd0bbea9`
- URL: https://github.com/laoton80-del/Ket-noi-eu/pull/374

## 3. Branch and evidence commit

- Branch: `chore/pack40ds-staging-controlled-indirect-execution-qa`
- Starting HEAD = verified master: `bd72de5`
- Evidence commit: recorded at PR open time
- Evidence PR: opened; **not merged**

## 4. Staging release/image

| Field | Value |
|---|---|
| App | `viona-api-staging-eu` |
| Release | **v27** (complete) |
| Image tag | `deployment-01KXKSKRTN49GJW82A1ZAA8PXQ` |
| Image ref | `registry.fly.io/viona-api-staging-eu:deployment-01KXKSKRTN49GJW82A1ZAA8PXQ` |
| Pack40D tie | Pack40DD evidence + image contains Pack40D2 / Pack40D3A / Pack40D3B wiring |

## 5. Redacted environment identities

| Identity | Label |
|---|---|
| API | `https://viona-api-staging-eu.fly.dev` |
| Database | `db.euqbfanilcssjiwwtcby.supabase.co` (staging project ref verified) |
| Twilio destination | magic test destination (anonymized digest only; not printed) |

## 6. Single enabled trigger

`internalAuthenticatedController` → `POST /api/internal/viona/trigger-real-twilio-poc`

## 7. Disabled triggers

- `signedMerchantWebhook` — provider execution disabled
- `approvedInternalDispatch` — unwired (no runtime caller)

## 8. Fixture discovery

| Fixture | Result |
|---|---|
| Merchant (triage, exact active merchant provenance, dual-role owner) | **Eligible** — used for POST D/E |
| Consumer (triage, `scopeKind=consumer`, `merchantProfileId=null`, same pilot) | **Available** — used for POST A |
| Legacy (`legacyUnresolved`, same pilot) | **Available** — used for POST B |
| Nonexistent valid-format UUID | Generated — used for POST C |
| Optional non-owner | **Not exercised** (covered locally; absolute POST cap remains 5) |

Markers (synthetic, master-short-SHA derived) verified absent before execution:

- `pack40ds-execution-bd72de5`
- `pack40ds-correlation-bd72de5`
- `pack40ds-sms-bd72de5`

## 9. Safe provider-destination proof

Forced staging Twilio magic test destination from existing internal route gate. Not a customer number. Intended for staging test SMS. One send authorized. Destination not printed or committed. Anonymized presence digest recorded in live script logs only.

## 10. Pre-QA invariants (sanitized)

| Check | Result |
|---|---|
| Release/image | v27 / Pack40DD image |
| Merchant fixture | triage; active MerchantProfile; no active attempt |
| QA markers | absent |
| Pack40A/B/C | CLOSED/GREEN |
| Signed-webhook execution | disabled |
| Internal dispatch | unwired |
| Recovery | unimplemented |

## 11. Consumer denial result

POST A — **Denied** (HTTP 404). No attempt / status / event / audit / escrow / provider side effects.

## 12. Legacy denial result

POST B — **Denied** (HTTP 404). No attempt / status / event / audit / escrow / provider side effects.

## 13. Nonexistent result

POST C — **Denied** (HTTP 404). No attempt / escrow / provider side effects. Sanitized existence-leak-safe category.

## 14. Authorized merchant execution result

POST D — **Success**. Source-derived completed contract.

Lifecycle:

```text
request: triage → inProgress → completed
attempt: claimed → providerPending → providerSucceeded → completed
escrow: attempt-scoped hold → settled
provider: one single-shot Twilio test-SMS
```

## 15. Duplicate invocation result

POST E — **Denied** (HTTP 404). Zero side effects (no new attempt, escrow, event, audit, or provider call). Terminal `completed` unchanged.

## 16. Attempt lifecycle

One new execution attempt → terminal `completed`; `providerResultDigest` present; `providerIdempotencyKey` present; `finalizedAt` present; active attempts for request = 0.

## 17. Request transition lifecycle

Exactly two transitions: `triage → inProgress → completed`.

## 18. Transition-event delta

**+2** (exactly two).

## 19. Execution-audit delta

**+2** successful indirect execution audits (`execution_service`). Additional non-counted best-effort rows may exist outside the indirect-execution audit contract; required delta is the two indirect audits.

## 20. Escrow hold/settlement result

Exactly one attempt-scoped hold at approved test amount (`0.01` VIO, within safe cap). Hold settled after provider success. No refund/release. No unrelated escrow mutation.

## 21. Provider invocation count

**1** (single-shot Twilio transport). Duplicate and denials add **0**.

## 22. Provider-result proof

Gateway returned known success; attempt reached `providerSucceeded` then `completed`; result digest present; wrapper single-shot; duplicate did not invoke provider.

## 23. Twilio read-only lookup result or limitation

**Limitation** — optional exact-message Twilio status lookup **not performed**. Provider proof relies on gateway success + durable attempt digests without retaining or printing message SID / destination. No additional Twilio API calls.

## 24. Denied side-effect count

**0** across consumer, legacy, and nonexistent.

## 25. Duplicate-delivery side-effect count

**0**

## 26. Transport certainty

**Certain** — all five POSTs returned definitive HTTP responses. No uncertain-outcome stop; no blind retry.

## 27. Live limitations (local-only; not live-passed)

Not deliberately manufactured or live-proven:

- Twilio timeout / uncertain provider acceptance
- Escrow settlement or refund failure
- Mid-execution profile deactivation / tenant drift
- Lease expiry race / concurrent workers
- Audit/event failure paths

Covered by Pack40D local suites only.

## 28. Post-QA preservation

| Check | Result |
|---|---|
| Request count | Unchanged |
| Provenance distribution | Unchanged |
| MerchantProfile count/owner/tenant/activity | Unchanged |
| Consumer fixture | Unchanged (denied) |
| Legacy fixture | Unchanged (`legacyUnresolved`) |
| Merchant request | Exactly one: `triage → completed` |
| Attempts | +1 completed; 0 active for request |
| Transition events | +2 for successful request |
| Indirect execution audits | +2 |
| Escrow | +1 hold settled |
| Provider | Exactly one send |
| Duplicate / denials | Zero side effects |
| Pack40C direct `action.status` | Not used |
| Note events | None added |
| Signed-webhook execution | Did not occur |
| `approvedInternalDispatch` | Remained unwired |
| Cleanup / reverse transition | None |
| Recovery / reconciliation | None |

## 29. Privacy confirmation

No request/attempt/user/tenant/profile/escrow IDs, Twilio SID, phone numbers, tokens, credentials, SMS destination, request content, or provider payloads printed or committed.

## 30. Confirmation no direct DB mutation

Database access was **read-only**. All mutations occurred solely via the five authorized execution POSTs.

## 31. Confirmation no deployment/migration/secret/production action

**Confirmed.** No deploy, migrate, secret change, or production access.

## 32. Confirmation signed-webhook / internal-dispatch execution remained disabled

**Confirmed.**

## 33. Confirmation recovery remains unimplemented

**Confirmed.**

## 34. Confirmation Pack40A/B/C remain CLOSED/GREEN

**Confirmed** (unchanged).

## 35. Pack40D controlled-scope QA classification

Controlled merchant indirect execution path verified end-to-end on staging v27 under single enabled trigger. Pack40D product closure still pending evidence merge + operator closure.

## 36. Closure recommendation

After this evidence PR merges and canonical docs sync: Pack40D controlled staging execution QA may be marked green for this bounded path. **Do not** enable signed-webhook execution, internal dispatch, recovery, or Pack40S without separate authorization. Pack40D overall CLOSED/GREEN remains operator-gated.

## 37. Final classification

`READY_FOR_PACK40DS_QA_EVIDENCE_PR_REVIEW`

## Exact POST matrix executed

| Step | Case | Result |
|---|---|---|
| A | Consumer fail-closed | Denied HTTP 404; side effects 0 |
| B | Legacy fail-closed | Denied HTTP 404; side effects 0 |
| C | Nonexistent | Denied HTTP 404; side effects 0 |
| D | Authorized merchant execution | Success; provider send 1; escrow settled |
| E | Duplicate completed-request | Denied HTTP 404; side effects 0 |

Actual POST count: **5**. Other write-capable HTTP: **0**. Live Twilio sends: **1**.

## Local quality gates (pre-live)

| Gate | Result |
|---|---|
| Pack40DS static suite | PASS |
| Pack40D3B | 54/54 PASS |
| Pack40D3A | 62/62 PASS |
| Pack40D2 | 112/112 PASS |
| Pack40D1 | 47/47 PASS |
| Pack40A/B/C | PASS |
| Relevant Pack31/30 regressions | PASS |
| Prisma validate/generate | PASS |
| TypeScript | PASS |
| ESLint Pack40DS scripts | PASS |
| Complete non-staging `test-viona-pack*.ts` | TOTAL_FAILS=0 |

## Recommended next operator action

Merge this evidence PR (docs/scripts only), then authorize any Pack40D closure sync phrase if desired. Do **not** authorize recovery, additional triggers, or Pack40S from this result alone.
