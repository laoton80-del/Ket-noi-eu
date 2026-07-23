# VIONA FC-P0 — Staging Provider Activation Result (E7)

**Primary classification:** `BLOCKED_E7_SEPARATE_VISIBILITY_ACTION_NOT_AUTHORIZED`

**Authorization:** `APPROVE_VIONA_FC_P0_LOCAL_PROVIDER_AUTHORITY_STAGING_PROVIDER_ACTIVATION`

**Mode:** Bounded staging-only authenticated mutation / exactly one activation attempt / stop-on-error / docs-evidence PR

**Canonical master (pre-execution):** `f59e723fd18ee4854c0e92739b81d085112802e0`

**Branch:** `docs/viona-fc-p0-local-provider-authority-staging-provider-activation-result`

```text
E7_ACTIVATION_AUTHORIZED_AND_ATTEMPTED
ACTIVATION_ATTEMPT_COUNT_1
ACTIVATION_HTTP_409_CONFLICT
BLOCKED_E7_SEPARATE_VISIBILITY_ACTION_NOT_AUTHORIZED
PROVIDER_REMAINS_DRAFT
VISIBILITY_REMAINS_FALSE
NO_ACTIVATED_AUDIT
NO_VISIBILITY_PATCH
NO_RETRY
NO_BUSINESS_USER_ROLE_MUTATION
NO_LOCAL_REQUEST
NO_DEPLOY
NO_SCHEMA_OR_MIGRATION_ACTION
NO_SECRET_EXPOSURE
REQUEST_ONLY_NO_CHARGE
PACK40S_NOT_AUTHORIZED
APPLE_EAS_PHASE_D2_DEFERRED
PHASE_C_CLOSED_GREEN
RISK_ACCEPTANCE_NOT_GRANTED_NOT_INVOKED
E8_THROUGH_E10_NOT_AUTHORIZED
```

---

## 1. Purpose

Activate only the already-registered Local provider for operator-approved fixture **VIONA Local Pilot Business M** (prefix `257f467a…`).

**Outcome:** Canonical activation was attempted once and rejected with **HTTP 409** because activation requires `publicB2cVisible === true`, while activation itself **does not** mutate visibility. Enabling visibility would require a separate `PATCH` — **not authorized** by this E7 phrase.

---

## 2. Pre-execution gates (passed)

| # | Item | Result |
|---|---|---|
| 1 | Canonical master | `f59e723…` clean / = `origin/master` |
| 2 | Staging target | `viona-api-staging-eu` / `fra` / `viona-staging-eu` / `euqbfanilcssjiwwtcby` |
| 3 | Fly v29 | `deployment-01KY798FWDYE8YM0ZD4QW98JP0` started |
| 4 | `/health` | **200** |
| 5 | Pack A1 migrate status | up to date; exit 0 |
| 6 | Provider lookup | exactly **1** row (prefix `257f467a…`) |
| 7 | Lifecycle / visibility | **DRAFT** / **false** |
| 8 | Types | `GENERIC_REQUEST` only |
| 9 | Timestamps | all null |
| 10 | Audit | **REGISTERED** only |
| 11 | Aggregates | eligibility **1** / audit **1** |

---

## 3. Canonical activation semantics (source)

| Field | Value |
|---|---|
| Endpoint | `POST /api/local/ops/providers/:businessId/activate` |
| Body | **Empty** (non-empty body → 400) |
| Role | `Role.ADMIN` (`superAdminMiddleware`) |
| Transition | DRAFT\|SUSPENDED → ACTIVE; audit `ACTIVATED` |
| Visibility on activate | **Unchanged** (`nextPublicB2cVisible = current.publicB2cVisible`) |
| Activate precondition | `publicB2cVisible === true` **and** non-empty `supportedServiceTypes` **and** valid Business display name (`localProviderEligibilityOpsService.ts`) |

Therefore: with DRAFT + `publicB2cVisible=false`, activate returns **conflict / 409**. Making visibility true requires separate `PATCH /api/local/ops/providers/:businessId` — **out of E7 authorization**.

---

## 4. Authentication

| Field | Result |
|---|---|
| Login | Exactly one staging `POST /api/auth/login` (phone retained; PIN via masked dialog) |
| Role | `ADMIN` |
| Token | Process memory only; cleared after attempt |
| Secrets in docs | **None** |

---

## 5. Activation execution

| Field | Value |
|---|---|
| Attempt count | **1** |
| Retries | **none** |
| Start UTC | `2026-07-23T16:37:09.755Z` |
| End UTC | `2026-07-23T16:37:09.878Z` |
| HTTP | **409** |
| Envelope | `success=false` (conflict / invalid transition) |
| Direct Prisma/SQL write | **none** |
| Visibility PATCH | **none** |

---

## 6. Post-attempt state (unchanged)

| Field | Value |
|---|---|
| Lifecycle | **DRAFT** |
| Visibility | **false** |
| Types | `GENERIC_REQUEST` |
| `activatedAt` / `suspendedAt` / `retiredAt` | all **null** |
| Audit sequence | **REGISTERED** only |
| Eligibility / audit totals | **1 / 1** |

Green conclusion `CONTROLLED_STAGING_PROVIDER_ACTIVATED_WITH_CANONICAL_VISIBILITY_AND_AUDIT_STATE` was **not** reached.

---

## 7. Why this is not a silent failure

Canonical source **requires** visibility true before ACTIVE and **does not** flip visibility during activate. E7 authorization forbids a separate visibility write. Stop condition matches:

`BLOCKED_E7_SEPARATE_VISIBILITY_ACTION_NOT_AUTHORIZED`

---

## 8. Explicit non-actions

- No second activation attempt
- No PATCH configuration / visibility
- No Business/User/Role mutation
- No Local request / functional QA
- No deploy / migration
- No E8–E10
- `REQUEST_ONLY_NO_CHARGE`; risk acceptance not granted/invoked

---

## 9. Next-stage marker

Canonical planning packet E8 phrase remains **NOT GRANTED** (client deploy decision). E7 activation remains incomplete until a **separately authorized** visibility configuration (or a future phrase that explicitly authorizes visibility+activate) is granted.

Do **not** invent an activation readiness marker that bypasses the visibility precondition.

---

## 10. Exactly one next operator action

**Decide whether to authorize a bounded staging visibility enablement (canonical `PATCH` with `publicB2cVisible=true` only) under a new explicit operator phrase, then re-authorize E7 activation — or stop.** Do not treat this blocked E7 result as visibility or activation authorization.
