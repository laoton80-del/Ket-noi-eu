# Pack40DR3B — Operator Internal Recovery Endpoint Evidence

Operator authorization: `APPROVE_PACK40DR3B_OPERATOR_INTERNAL_RECOVERY_ENDPOINT`

Classification: `READY_FOR_PACK40DR3B_OPERATOR_RECOVERY_PR_REVIEW`

## Deployed-runtime markers

```text
PACK40DR3B_OPERATOR_INTERNAL_RECOVERY_ENDPOINT_WIRED
PACK40DR2_RECOVERY_RUNTIME_WIRED
PACK40DR2_DORMANT_RECOVERY_SERVICES_IMPLEMENTED
PACK40DR3A_LIVE_GENERATION_FENCING_WIRED
PACK40D_INITIAL_CONTROLLED_MERCHANT_EXECUTION_REMAINS_CLOSED_GREEN
```

Recovery/reconciliation is **not** CLOSED/GREEN — endpoint is locally wired only; no staging deployment.

## 1. Verified baseline

| Item | Value |
|---|---|
| Master SHA (PR #381 merge) | `219f47b7d0fe7e182ba28c8cee49ace9e32eddbe` |
| PR #381 | **MERGED** @ `219f47b` (`2026-07-16T08:28:39Z`) — Pack40DR3A live generation fencing |
| Branch | `feat/pack40dr3b-operator-internal-recovery-endpoint` |

## 2. Internal operator authorization

- Route: `POST /api/internal/viona/execution-attempts/:attemptId/recovery`
- Stack: deployment-stage gate → JWT `authMiddleware` → `superAdminMiddleware` (`Role.ADMIN`)
- Recovery principal constructed from `req.authUserId` + server-generated correlation ID only.
- Body `triggeringUserId`, tenant/profile, lease, provider reference, and request owner fields are ignored for authority.

## 3. Exact-attempt boundary

- One attempt ID from route param only; no request-ID recovery; no `findMany` scan.
- Coordinator loads exact attempt and derives request/merchant snapshots from persisted row.

## 4. Recovery orchestration (Pack40DR2 services)

Sequence per invocation:

1. `classifyRecoverableAttempt`
2. `acquireRecoveryLease` (generation increment + expired/unowned lease CAS)
3. `reconcileProviderOutcomeForRecovery` when `providerPending`/`outcomeUncertain` with exact reference
4. `reconcileEscrowForRecoveredProviderOutcome` when `providerSucceeded`/`providerFailed`
5. `finalizeRecoveredExecutionCompleted` / `finalizeRecoveredExecutionFailed`

Pack40D live orchestrator does **not** import DR2 services.

## 5. Provider exact lookup (read-only)

- `createPack40DR3TwilioExactStatusLookupAdapter` — GET-only, isolated from send adapter.
- One lookup maximum per invocation; no retry on transport uncertainty.
- Reference loaded from attempt row only; never returned in API/audit.

## 6. Escrow reconciliation

- `createPack40DR3RecoveryEscrowAdapter` wraps Pack31 settle/refund behind DR2 contract.
- Attempt-scoped idempotency key `escrow:{requestId}:{attemptId}:twilio_test_sms`.
- `outcomeUncertain` performs no escrow mutation.

## 7. Sanitized response categories

`recovered_completed`, `recovered_failed`, `remains_uncertain`, `already_terminal`, `operator_review_required`, `recovery_conflict`, `not_found` — no lease owner/generation, provider reference, escrow IDs, or raw provider payload.

## 8. No scheduler / worker / additional trigger

- No cron, queue, background worker, or startup recovery.
- Merchant execution POC route unchanged as sole Pack40D send trigger.

## 9. No staging / DB / live provider / deploy

- Tests use fake Prisma, fake lookup, fake escrow, mock controller context only.

## 10. Test and regression results

| Suite | Result |
|---|---|
| Pack40DR3B | **68/68 PASS** |
| Pack40DR3A | **40/40 PASS** |
| Pack40DR2 | **87/87 PASS** |
| Pack40DR1 | **95/95 PASS** |
| Pack40D3B / D3A / D2 / D1 | **54/54 · 62/62 · 112/112 · 47/47** |
| `prisma validate` / `tsc --noEmit` / ESLint (touched) | PASS |

## 11. Files changed

| File | Role |
|---|---|
| `src/routes/internalRoutes.ts` | Recovery route + superAdmin |
| `src/controllers/VionaInternalExecutionAttemptRecoveryController.ts` | Sanitized HTTP boundary |
| `src/services/viona/vionaRequestExecutionRecoveryCoordinator.ts` | DR2 orchestration |
| `src/services/viona/vionaPack40DR3TwilioExactStatusLookupAdapter.ts` | Read-only lookup |
| `src/services/viona/vionaPack40DR3RecoveryEscrowAdapter.ts` | Escrow adapter |
| `src/lib/viona/internalRoute/vionaInternalRecoveryRouteGate.ts` | Stage gate constants |
| `src/services/viona/vionaRequestSystemRecoveryPrincipal.ts` | DR3B markers |
| `scripts/test-viona-pack40dr3b-operator-internal-recovery-endpoint.ts` | DR3B suite |
| DR1/DR2/DR3A regression updates | Allowlist DR3B wiring |

**Unchanged:** `prisma/schema.prisma`, migrations, merchant POC controller, signed webhook, internal dispatch, Pack40A/B/C.

## 12. Next authorization

Separately authorize **Pack40DRD** staging recovery deployment only. Do not auto-continue. Pack40S remains unauthorized.
