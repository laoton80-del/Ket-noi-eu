# Pack40DR3A — Live Generation Fencing and Provider Reference Hardening Evidence

Operator authorization: `APPROVE_PACK40DR3A_LIVE_FENCING_PROVIDER_REFERENCE_HARDENING`

Classification: `READY_FOR_PACK40DR3A_LIVE_HARDENING_PR_REVIEW`

## Deployed-runtime markers

```text
PACK40DR3A_LIVE_GENERATION_FENCING_WIRED
PACK40DR3A_PROVIDER_REFERENCE_RUNTIME_POPULATION_WIRED
PACK40DR2_RECOVERY_RUNTIME_NOT_WIRED
PACK40D_INITIAL_CONTROLLED_MERCHANT_EXECUTION_REMAINS_CLOSED_GREEN
```

## 1. Verified baseline

| Item | Value |
|---|---|
| Master SHA (PR #380 merge) | `e632d6a2d28399e55883952bb240e9e4038e2ed0` |
| PR #380 | **MERGED** @ `e632d6a` (`2026-07-16T07:36:15Z`) — Pack40DR2 dormant recovery services |
| Branch | `feat/pack40dr3a-live-fencing-provider-reference` |
| Implementation commit | recorded at PR open time |

## 2. Generation source and propagation

- `leaseGeneration` originates from persisted attempt row (schema default **0** on claim).
- Pack40D2 `claimVionaRequestExecution` returns `leaseGeneration` from created attempt.
- Pack40D3B coordinator stores claim `leaseGeneration` and passes the same opaque token to gateway + finalize.
- Generation is **not** accepted from HTTP body, query, headers, tenant/profile envelope, or provider payload.

## 3. Generation-aware predicates (live path)

All post-claim mutations require exact attempt ID + lease owner + `leaseGeneration` + expected state:

| Transition | Service |
|---|---|
| `claimed → providerPending` | D3A `prepareVionaRequestExecutionAttemptForProvider` |
| `providerPending → providerSucceeded/Failed/outcomeUncertain` | D3A `recordPreparedVionaRequestExecutionAttemptProviderOutcome` |
| `providerSucceeded → completed` | D2 `finalizeVionaRequestExecutionCompleted` |
| `providerFailed → failed` | D2 `finalizeVionaRequestExecutionFailed` |

Repository `updateMany` CAS includes `leaseGeneration` on prepare, outcome record, and finalize transition helpers.

## 4. Stale-worker rejection

When `leaseGeneration` no longer matches (future recovery increment):

- provider preparation fails (`stale_lease_generation` / zero-row CAS);
- provider outcome record fails closed;
- terminal finalization fails closed (`stale_lease_generation`);
- coordinator returns `reconciliation_required` without provider retry;
- no request/event/audit side effects on stale generation.

## 5. Exact provider-reference persistence

- Bounded Twilio adapter success returns `providerExternalReference` (MessageSid) + digests.
- Gateway persists exact reference only from trusted adapter result in outcome-record Serializable transaction.
- Conflicting non-null replacement rejected via repository CAS (`null` or same value only).
- Same reference replay for same attempt is idempotent-safe.
- Partial unique index on `(providerName, providerExternalReference)` remains authoritative.

## 6. Privacy / redaction

- Exact `providerExternalReference` stored at rest only.
- Never returned on controller/API response contracts.
- Never placed in audit reason text or committed evidence fixtures.
- DR3A tests use synthetic opaque value `SMbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb` only.

## 7. Outcome-uncertain behavior

- No blind provider retry.
- `outcomeUncertain` preserves request `inProgress`.
- No escrow settle/refund/finalize on uncertain path.
- Exact reference persisted only when adapter actually returned one before uncertainty.

## 8. No recovery runtime

- Pack40DR2 services remain unimported by routes/controllers/orchestrator.
- No recovery endpoint, system-recovery principal construction, scheduler, worker, provider status lookup, or escrow reconciliation at runtime.

## 9. No DB / staging / provider / deploy action

**CONFIRMED** — local fake-Prisma/fake-adapter tests only.

## 10. Test and regression results

| Gate | Result |
|---|---|
| Pack40DR3A | **40/40 PASS** |
| Pack40DR2 | **85/85 PASS** |
| Pack40DR1 | **92/92 PASS** (DR3A wired-runtime allowlist; schema isolation preserved) |
| Pack40D3B | **54/54 PASS** |
| Pack40D3A | **62/62 PASS** |
| Pack40D2 | **112/112 PASS** |
| Pack40D1 | **47/47 PASS** |
| Pack40A / B / C + Pack40P + Pack31/30 | PASS |
| Non-staging `test-viona-pack*.ts` | **36/36 PASS** |
| `prisma validate` / `generate` | PASS |
| `tsc --noEmit` | PASS |
| ESLint (touched TS) | PASS |

## 11. Exact files changed

| Path | Role |
|---|---|
| `src/services/viona/vionaRequestIndirectStatusActionService.ts` | D2 claim returns generation; finalize requires generation |
| `src/services/viona/vionaRequestExecutionGatewayService.ts` | D3A generation-fenced prepare/record; reference persistence |
| `src/services/viona/vionaRequestExecutionOrchestrator.ts` | D3B generation propagation |
| `src/services/viona/vionaRequestExecutionProviderContract.ts` | Adapter result includes exact reference |
| `src/services/viona/vionaPack40D3TwilioGatewayAdapter.ts` | Returns exact reference on success |
| `src/repositories/vionaRequestExecutionAttemptRepository.ts` | Generation + reference CAS on live mutations |
| `src/services/viona/vionaRequestSystemRecoveryPrincipal.ts` | DR3A wired marker; DR2 historical marker retained |
| `scripts/test-viona-pack40dr3a-live-fencing-provider-reference.ts` | DR3A suite |
| `scripts/test-viona-pack40d2-execution-principal-indirect-writer.ts` | Regression updates |
| `scripts/test-viona-pack40d3a-provider-gateway-foundation.ts` | Regression updates |
| `scripts/test-viona-pack40d3b-controlled-runtime-wiring.ts` | Regression updates |
| `scripts/test-viona-pack40dr1-recovery-schema-foundation.ts` | DR3A wired-runtime allowlist |
| `scripts/test-viona-pack40dr2-dormant-recovery-services.ts` | DR3A population wired assertion |
| Evidence + tenant-scope plan + Kernel + Handoff | Canonical sync |

**Not changed:** schema/migrations, routes/controllers/auth boundary, recovery endpoint/worker, deployment/env files.

## 12. Preservation confirmations

| Marker | Status |
|---|---|
| Initial controlled Pack40D | **CLOSED/GREEN** (narrow scope preserved) |
| Pack40A/B/C | **CLOSED/GREEN** |
| Pack40DR1 staging schema | **APPLIED** |
| Pack40DR2 recovery services | **dormant / not wired** |
| Signed-webhook execution | **DISABLED** |
| `approvedInternalDispatch` | **UNWIRED** |
| Consumer/legacy execution | **UNSUPPORTED** |
| Pack40S | **UNIMPLEMENTED / NOT AUTHORIZED** |

## 13. Final classification

`READY_FOR_PACK40DR3A_LIVE_HARDENING_PR_REVIEW`

## 14. Recommended next authorization

Separately authorize **Pack40DR3B** operator recovery endpoint (authenticated internal recovery route wiring only — not automatic). Do not begin Pack40DR3B without explicit operator phrase. Pack40S remains unauthorized.
