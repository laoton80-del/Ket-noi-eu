# VIONA FC-P0 — Pack A2 Deterministic Behavioral Evidence Remediation

**Classification (this pack):** `READY_FOR_VIONA_FC_P0_LOCAL_PROVIDER_A2_DETERMINISTIC_BEHAVIORAL_EVIDENCE_REMEDIATION_PR_REVIEW`

**Operator authorization:** `APPROVE_VIONA_FC_P0_LOCAL_PROVIDER_A2_DETERMINISTIC_BEHAVIORAL_EVIDENCE_REMEDIATION`

**Mode:** controlled test / evidence remediation — NO shared migration apply, NO deploy, NO provider registration/activation, NO Pack B client wiring.

---

## 1. Canonical baseline

| Item | Value |
|---|---|
| Workspace | `C:\KNG\ket-noi-eu` |
| Baseline (PR #420 squash on master) | `ff0fdfa7752eacb265e94f1de75e676d57ae5c62` |
| Branch | `fix/viona-fc-p0-local-provider-a2-deterministic-behavioral-evidence-remediation` |
| Implementation HEAD | `38d4a9f441f10c13d9e81a60cf585fdd0d3c4dc7` |
| Original blocker | `BLOCKED_LOCAL_PROVIDER_A2_DB_BEHAVIOR_EVIDENCE_INSUFFICIENT` |

PR #420 reported A2 cases 30–43 PASS while the full DB behavior branch was skipped (`LocalProviderEligibility` unapplied / `42P01`). Critical registration, PATCH, lifecycle, audit, rollback, list, and non-admin 403 middleware paths were not executed.

---

## 2. Changed paths

| Path | Purpose |
|---|---|
| `src/services/local/localProviderEligibilityAuthorityTypes.ts` | Persistence/txn DI surface (storage only) |
| `src/services/local/localProviderEligibilityAuthorityPrisma.ts` | Production Prisma default deps + `$transaction` runner |
| `src/services/local/localProviderEligibilityOpsService.ts` | Optional deps; real orchestration; default Prisma |
| `src/services/local/localProviderEligibilityListService.ts` | Optional deps; selectable list; default Prisma |
| `src/services/local/localProviderEligibilityAuditWrite.ts` | Audit create via txn seam |
| `src/services/local/localProviderEligibilityAuditAppendOnlyGate.ts` | Gate matches audit-model mutations only |
| `src/controllers/LocalProviderController.ts` | Optional deps for testable handlers (routes unchanged) |
| `src/middleware/superAdminMiddleware.ts` | Optional 4th-arg role lookup (Express still uses Prisma) |
| `scripts/localProviderEligibilityDeterministicDoubles.ts` | Test-only in-memory store + commit/rollback + fixed clock |
| `scripts/test-local-provider-eligibility-read-ops-control.ts` | Cases 30–43 + rollback A–D executed deterministically |
| `docs/product/VIONA_FC_P0_LOCAL_PROVIDER_A2_DETERMINISTIC_BEHAVIORAL_EVIDENCE_REMEDIATION.md` | This evidence |
| `docs/ai-context/VIONA_KERNEL_HANDOFF_FAST_SAFE_GLOBAL_MODE.md` | Kernel sync |
| `Handoff_VIONA11726.txt` | Handoff sync (local notes) |

**Not changed:** Prisma schema; Pack A1 migration; seed; Pack B client; deploy config.

---

## 3. Test architecture

```
Production service orchestration (ops / list / audit assert)
        │
        ▼
LocalProviderAuthorityDeps (optional injection)
        │
   ┌────┴────┐
   │         │
Prisma     Deterministic harness (scripts/ only)
default    in-memory store + clone/commit/rollback + fixed clock
```

- Production routes call controllers with `(req, res)` → Prisma defaults.
- No env-activated fake; no global mutable singleton; no `42P01` fake-data fallback.
- Fake implements storage + txn mechanics only (no lifecycle / invariant / admin policy).

### Transaction model

1. Snapshot committed state.
2. Run real service callback against working copy.
3. Commit on success; restore on throw.
4. Counters: create/update/audit/commit/rollback.

### Fixed clock

`T1`–`T4` ISO timestamps via harness `clock.setNow` — production uses `() => new Date()`.

---

## 4. Executed results (cases 30–43)

Command: `npx tsx scripts/test-local-provider-eligibility-read-ops-control.ts` → **exit 0**

| Case | Result |
|---|---|
| 30 auth middleware 401/403/ADMIN + actor identity | PASS — executed middleware harness |
| 31 first registration + REGISTERED audit | PASS — deterministic store |
| 32 repeated registration idempotency | PASS |
| 33 changed PATCH DRAFT/ACTIVE/SUSPENDED | PASS |
| 34 no-change PATCH (zero update/audit) | PASS |
| 35–36 ACTIVE invariants + invalid name activation | PASS |
| 37 DRAFT→ACTIVE (+ failed invariant 409) | PASS |
| 38 DRAFT→RETIRED | PASS |
| 39 ACTIVE→SUSPENDED | PASS |
| 40 ACTIVE→RETIRED | PASS |
| 41 SUSPENDED→ACTIVE / SUSPENDED→RETIRED | PASS |
| 42 same-state / forbidden / RETIRED PATCH | PASS |
| 43 list filter/order/pagination/public DTO | PASS |
| Rollback A–D (audit fail / eligibility fail) | PASS |

Optional DB integration:  
`OPTIONAL_DB_INTEGRATION_SKIPPED_EXPECTED_NO_MIGRATION_APPLY` — table unapplied.  
**Does not gate cases 30–43 PASS.**

---

## 5. Rollback / atomicity proof

| Scenario | Outcome |
|---|---|
| A Register + audit fail | `invalid_input`; no eligibility; no audit; rollback=1 |
| B PATCH + audit fail | prior config/`updatedAt` preserved; no audit |
| C Activate + audit fail | status/timestamps unchanged; no audit |
| D Eligibility update fail | no audit; state unchanged |

---

## 6. Production Prisma-default + fake isolation

- `createPrismaLocalProviderAuthorityDeps()` is the default when deps omitted.
- Deterministic doubles live only under `scripts/`; source gate asserts no import from `src/`.
- Fake has no `lifecycleTimestampsForTransition` / `isLocalProviderSelectable` / `isAdminRole`.

---

## 7. Regression / CI matrix

| Command | Exit |
|---|---|
| `npx tsx scripts/test-local-provider-eligibility-schema-domain.ts` (A1 1–29) | 0 |
| `npx tsx scripts/test-local-provider-eligibility-read-ops-control.ts` | 0 |
| `npx tsc --noEmit` | 0 |
| `npm run ci:expo-readiness` | 0 |
| `npm run ci:release-discipline` | 0 |
| `npm run smoke` | 0 (via release-discipline) |
| Local create SoT / create-client / eligibility-contract / service-contract | 0 |
| Local list / timeline / cancel / status-display | 0 |
| `test-api-client-no-public-dev-jwt` | 0 |
| `check-mobile-no-prisma-client` | 0 |
| `npm run functions:verify-bundle` | 0 |
| Profile/Language phase-2 | 0 |
| Modern Home A/B/C | 0 |

---

## 8. Confirmations

1. No Prisma schema or migration modification.
2. No migration apply to shared DB.
3. No provider registration/activation on staging/production.
4. No Pack B client wiring — `PROVIDER_SELECTION_UNAVAILABLE` retained.
5. No deploy / live Local request.
6. FC-P0 remains blocked pending Pack B (+ later gates).
7. `REQUEST_ONLY_NO_CHARGE` preserved.
8. Phase C remains closed green.
9. Pack40S unauthorized.
10. Apple / EAS / Phase D2 deferred.

---

## 9. Exactly one next operator action

**Strict-review this remediation PR only.** Do **not** auto-authorize Pack B, migration apply, deploy, provider activation, or live QA.
