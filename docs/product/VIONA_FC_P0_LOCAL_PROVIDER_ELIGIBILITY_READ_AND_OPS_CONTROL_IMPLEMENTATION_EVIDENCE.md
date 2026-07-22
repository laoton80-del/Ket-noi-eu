# VIONA — FC-P0 Local Provider Eligibility Authority  
## Pack A2 — Read and Ops Control Implementation Evidence

**Operator authorization:** `APPROVE_VIONA_FC_P0_LOCAL_PROVIDER_ELIGIBILITY_AUTHORITY_READ_AND_OPS_CONTROL`  
**Mode:** `IMPLEMENTATION_ONLY_NO_DEPLOY_NO_MIGRATION_APPLY_NO_PROVIDER_ACTIVATION`  
**Primary classification:** `READY_FOR_VIONA_FC_P0_LOCAL_PROVIDER_ELIGIBILITY_READ_AND_OPS_CONTROL_PR_REVIEW`

```text
PACK_A2_READ_AND_OPS_CONTROL
ROLE_ADMIN_VIA_SUPERADMIN_MIDDLEWARE
GET_API_LOCAL_PROVIDERS
OPS_REGISTER_PATCH_ACTIVATE_SUSPEND_RETIRE
APPEND_ONLY_AUDIT_WRITES
NO_CLIENT_WIRING
NO_MIGRATION_APPLY
NO_PROVIDER_REGISTRATION_OR_ACTIVATION_IN_STAGING
NO_DEPLOY
NO_LIVE_LOCAL_REQUEST
FC_P0_STILL_BLOCKED_PENDING_PACK_B
REQUEST_ONLY_NO_CHARGE_PRESERVED
PACK40S_NOT_AUTHORIZED
APPLE_EAS_PHASE_D2_DEFERRED
PHASE_C_CLOSED_GREEN
```

---

## 1. Canonical Pack A1 baseline

| Field | Value |
|---|---|
| Canonical root | `C:\KNG\ket-noi-eu` |
| Pack A1 verified master | `97d9ee01f6159a7ed7d48ac3b422ddb4359bca60` (PR #419) |
| Branch | `feat/viona-fc-p0-local-provider-eligibility-read-ops-control` |
| Prisma schema / migration | **Unchanged** (Pack A1 structures reused) |

---

## 2. Exact changed paths

| Path | Purpose |
|---|---|
| `src/routes/localRoutes.ts` | Mount GET `/providers` + ops provider routes |
| `src/controllers/LocalProviderController.ts` | B2C read + ADMIN ops HTTP adapters |
| `src/services/local/localProviderEligibilityValidation.ts` | Query/body validation, unknown-key rejection, reason bound |
| `src/services/local/localProviderEligibilityListService.ts` | Selectable provider list + public DTO |
| `src/services/local/localProviderEligibilityOpsService.ts` | Register/PATCH/activate/suspend/retire |
| `src/services/local/localProviderEligibilityAuditWrite.ts` | Append-only audit `create` helper |
| `scripts/test-local-provider-eligibility-read-ops-control.ts` | A2 cases 30–43 |
| `scripts/test-local-provider-eligibility-schema-domain.ts` | Drop obsolete A1 “no A2 routes” gate |
| `package.json` | `test:local-provider-eligibility-read-ops-control` |
| Evidence + Kernel + Handoff | This pack sync |

**Not touched:** Prisma schema/migration; Local client composer/source; Pack B wiring; deploy config.

---

## 3. GET `/api/local/providers`

Chain: `authMiddleware` → `validateLocalProviderListQuery` → `getLocalProviders` → `listSelectableLocalProviders`

| Query | Rules |
|---|---|
| `limit` | optional; default 50; 1–100 |
| `skip` | optional; default 0; ≥0 |
| `serviceType` | optional canonical `LocalServiceType`; invalid → 400 |

Selectable predicates: Business exists + valid name + eligibility ACTIVE + public + non-empty types (+ optional type filter).  
Order: Business.name ASC, businessId ASC.  
Envelope: `{ items, pagination: { limit, skip, returned } }` — no `hasMore`.  
Empty → 200 / `[]` / `returned: 0`.

Public DTO only: `businessId`, `displayName`, `supportedServiceTypes`.

---

## 4. Ops routes (Role.ADMIN)

| Method | Path |
|---|---|
| POST | `/api/local/ops/providers` |
| PATCH | `/api/local/ops/providers/:businessId` |
| POST | `/api/local/ops/providers/:businessId/activate` |
| POST | `/api/local/ops/providers/:businessId/suspend` |
| POST | `/api/local/ops/providers/:businessId/retire` |

Authority: `authMiddleware` + `superAdminMiddleware` (`Role.ADMIN`).  
`actorUserId` from `req.authUserId` only.

Ops DTO (canonical lifecycle remediation):

```ts
{ businessId, status, publicB2cVisible, supportedServiceTypes,
  activatedAt, suspendedAt, retiredAt, updatedAt } // ISO strings / null
```

---

## 5. Registration / PATCH / lifecycle

| Operation | Semantics |
|---|---|
| First register | 201; DRAFT defaults; REGISTERED audit (null/null/`[]` prior) |
| Repeat register | 200; no overwrite; no `updatedAt`; no audit |
| PATCH change | one update + CONFIG_UPDATED; no lifecycle stamp mutation |
| PATCH no-change | 200; no update; no audit |
| ACTIVE private/empty PATCH | 409 |
| RETIRED every PATCH | 409 |
| Activate | DRAFT/SUSPENDED → ACTIVE with invariants; same-state 200/no audit |
| Suspend | ACTIVE → SUSPENDED; optional reason ≤280 audit-only |
| Retire | DRAFT/ACTIVE/SUSPENDED → RETIRED; terminal |

Forbidden transitions → 409; no mutation/audit.

---

## 6. Audit + append-only

- `createLocalProviderEligibilityAuditEvent` — create only inside mutation `$transaction`
- Actor: `ROLE_ADMIN` + authenticated admin user id
- Append-only source gate still green across services/controllers/routes
- No physical delete APIs

---

## 7. A2 tests 30–43

`npx tsx scripts/test-local-provider-eligibility-read-ops-control.ts` → **OK**  
`db=skipped` — eligibility table unapplied (`NO_MIGRATION_APPLY`); no staging authority rows created.  
Covered via validation/lifecycle/source/controller stubs + append-only gate; disposable DB path included for when table is applied in isolation.

---

## 8. Pack A1 regression + other gates

| Command | Result |
|---|---|
| A1 cases 1–29 | PASS |
| `npx prisma validate` | PASS |
| `npx tsc --noEmit` | PASS |
| `ci:expo-readiness` | PASS |
| `ci:release-discipline` | PASS (recorded below) |
| Local create-client / contract / status / list / timeline / cancel / create-sot | PASS |
| JWT / mobile no-Prisma / Functions bundle / smoke / Profile-Language | PASS |
| Modern Home A/B/C + SOS | PASS |

---

## 9. Confirmations

1. No Pack B client wiring — `PROVIDER_SELECTION_UNAVAILABLE` retained; no client call to GET providers  
2. No Prisma schema/migration change  
3. Migration not applied; no staging register/activate  
4. No deploy / live Local request  
5. FC-P0 still blocked pending Pack B (+ later execution)  
6. `REQUEST_ONLY_NO_CHARGE` preserved  
7. Phase C closed green; Pack40S unauthorized; Apple/EAS/Phase D2 deferred  

---

## 10. Exactly one next operator action

Strict read-only review of this Pack A2 PR.  
Do **not** merge as FC-P0 closed.  
Do **not** apply migration.  
Do **not** auto-authorize Pack B, deploy, provider activation, or live QA.

---

## 11. Final classification

`READY_FOR_VIONA_FC_P0_LOCAL_PROVIDER_ELIGIBILITY_READ_AND_OPS_CONTROL_PR_REVIEW`
