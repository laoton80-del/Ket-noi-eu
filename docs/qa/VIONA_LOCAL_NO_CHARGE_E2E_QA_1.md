# VIONA Local no-charge E2E QA — certification 1

**Pack:** `VIONA.LOCAL.NO_CHARGE_E2E_QA.1`  
**Branch:** `pack-local-no-charge-e2e-qa-1`  
**Master tested:** `4c7e719` (`feat(local): merge user request status UI`)  
**Date:** 2026-05-20  
**Type:** QA / readiness only (no product behavior changes)

## Summary

Automated certification of the Local **request-only / no-charge** lane on `master` after merging:

- Merchant request inbox UI minimum (`b2c6d41` / `e45dd3a`)
- User request list API (`6ebb748` / `e87a0ee`)
- User request status UI minimum (`b0c66b4` / `4c7e719`)

All required **integration scripts** and **UI display-helper scripts** passed in a sequential QA run against the configured dev/staging `DATABASE_URL`. Tourism regression scripts passed with no Local-induced failures. **Manual mobile/web walkthrough** and **staging deployment verification** were not executed in this pack.

## Pilot readiness verdict

**PASS_WITH_LIMITATIONS**

| Ready | Not verified in this pack |
|-------|---------------------------|
| API lifecycle (create, list, cancel, merchant confirm/reject, ops cancel) | Production/staging env parity |
| Ownership and auth gates (script-level) | Real JWT flows on device (Expo) |
| Wallet invariants (`REQUEST_ONLY_NO_CHARGE`, `walletPhase NONE`, no `WalletTransaction`) | Responsive visual QA on 390×844 / tablet (manual) |
| Public timeline filtering | Rate-limit under concurrent load |
| UI helper forbidden-copy guards | End-user i18n review on physical devices |

## Local no-charge law (certified scope)

Local `LocalServiceRequest` rows in this lane must remain:

- `walletMode`: `REQUEST_ONLY_NO_CHARGE`
- `walletPhase`: `NONE`
- No wallet hold, debit, release, refund, settlement, provider payout, or platform fee
- No Firebase VIP bridge, no `Booking` / `TourismBooking` bridge
- No fake merchant acknowledgement or AI-driven status mutation

## API coverage

| Endpoint | Auth | Certified by |
|----------|------|----------------|
| `POST /api/local/requests` | `authMiddleware` | `test-local-request-create-source-of-truth.ts` |
| `GET /api/local/requests` | `authMiddleware` | `test-local-user-request-list-api.ts` |
| `POST /api/local/requests/:id/cancel` | `authMiddleware` | `test-local-user-request-cancel-api.ts` |
| `GET /api/local/requests/:id/timeline` | `authMiddleware` | `test-local-user-request-timeline-1.ts` |
| `GET /api/local/merchant/requests` | `authMiddleware` (merchant owner) | `test-local-merchant-request-inbox-api.ts` |
| `POST /api/local/merchant/requests/:id/confirm` | `authMiddleware` + rate limit | `test-local-merchant-request-confirm-api.ts` |
| `POST /api/local/merchant/requests/:id/reject` | `authMiddleware` + rate limit | `test-local-merchant-request-reject-api.ts` |
| `GET /api/local/ops/requests/:id/audit-events` | `authMiddleware` + `superAdminMiddleware` | `test-local-audit-read-api-1.ts` |
| `POST /api/local/ops/requests/:id/cancel` | `authMiddleware` + `superAdminMiddleware` + rate limit | `test-local-ops-request-cancel-api.ts` |

Mutation routes use `createLocalMutationRateLimiter` per `src/routes/localRoutes.ts`.

## UI coverage (type/navigation + copy helpers)

| Surface | Route / entry | Helper test |
|---------|---------------|-------------|
| Merchant inbox | `LocalMerchantRequestInbox` ← B2B dashboard | `test-local-merchant-inbox-ui-display.ts` |
| User request status | `LocalUserRequestStatus` ← Local hub “My requests” tile | `test-local-user-request-status-ui-display.ts` |
| Local hub CTA only | `LocalScreen` → `navigation.navigate('LocalUserRequestStatus')` | Smoke/typecheck registry |

No Home/logo redesign. Classifieds VIP paths on `LocalScreen` were not modified in Local inbox/status packs.

## State transition coverage

| Transition | Script evidence |
|------------|-----------------|
| Create → `REQUESTED` | create source-of-truth |
| Merchant confirm → `CONFIRMED` | merchant confirm API |
| Merchant reject → `REJECTED` | merchant reject API |
| User cancel → `USER_CANCELLED` (REQUESTED / MERCHANT_REVIEW only) | user cancel API |
| Ops cancel → `OPS_CANCELLED` | ops cancel API |
| Expiry apply → `EXPIRED` + audit | expiry dry-run (read-only), expiry apply |
| Confirm/reject idempotency & negative status | confirm/reject API scripts |
| Audit runtime on mutations | audit-runtime 1–3 |

## Auth / ownership coverage

- **Requester list:** only `requesterUserId === auth user` (`test-local-user-request-list-api.ts`)
- **Merchant inbox:** only requests on businesses owned by merchant (`test-local-merchant-request-inbox-api.ts`)
- **Timeline:** requester must own row; 404 otherwise (`test-local-user-request-timeline-1.ts`)
- **Ops audit/cancel:** super-admin middleware (`test-local-ops-request-cancel-api.ts`, `test-local-audit-read-api-1.ts`)
- **Unauthenticated list:** controller returns 401 (`test-local-user-request-list-api.ts`)

## Audit / timeline coverage

- **User timeline:** public-safe events only; ops/expiry internal types omitted (`test-local-user-request-timeline-1.ts`)
- **Ops audit read:** read-only event list for super-admin (`test-local-audit-read-api-1.ts`)
- **Audit on mutations:** append-only audit rows, no wallet side effects (`test-local-request-audit-runtime-1.ts` … `3.ts`)

## Expiry coverage

- **Dry-run:** identifies candidates without mutating (`test-local-request-expiry-dry-run.ts`)
- **Apply:** status-only `EXPIRED` + audit (`test-local-request-expiry-apply.ts`)
- No `WalletTransaction` delta in scripts

## Rate-limit coverage

- `test-local-rate-limit-abuse-guard-1.ts` — mutation endpoints protected (in-memory guard; per-process)

## Wallet safety coverage

Scripts assert or enforce:

- Default/create: `REQUEST_ONLY_NO_CHARGE` + `walletPhase NONE`
- No increase in `prisma.transaction` / wallet ledger counts on list/read/expiry dry-run paths
- No `WalletService`, `walletOps`, or `reserveAndCommitCredits` in `src/routes/localRoutes.ts`, `src/controllers/LocalRequestController.ts`, or `src/services/local/*` (safety grep)

## Tourism regression coverage

All six scripts **PASS** (no Local changes in Tourism files):

- `test-tourism-confirm-settle-eligibility.ts`
- `test-tourism-cancel-release-eligibility.ts`
- `test-tourism-merchant-inbox-actions.ts`
- `test-tourism-ops-cancel-policy.ts`
- `test-tourism-timeout-release-eligibility.ts`
- `test-tourism-merchant-inbox-ui-display.ts`

## Validation run (2026-05-20)

| Check | Result |
|-------|--------|
| `git diff --check` | PASS |
| `npm run typecheck` | PASS |
| `npm run lint` | PASS (0 errors; pre-existing warnings) |
| `npm run smoke` | PASS |
| `npx prisma validate` | PASS |
| `npx prisma generate` | PASS (via typecheck) |

### Local scripts (sequential QA run)

| Script | Result |
|--------|--------|
| `test-local-request-schema-defaults.ts` | PASS |
| `test-local-request-create-source-of-truth.ts` | PASS |
| `test-local-user-request-list-api.ts` | PASS |
| `test-local-user-request-status-ui-display.ts` | PASS |
| `test-local-user-request-cancel-api.ts` | PASS |
| `test-local-merchant-request-inbox-api.ts` | PASS |
| `test-local-merchant-request-confirm-api.ts` | PASS |
| `test-local-merchant-request-reject-api.ts` | PASS |
| `test-local-ops-request-cancel-api.ts` | PASS |
| `test-local-merchant-inbox-ui-display.ts` | PASS |
| `test-local-user-request-timeline-1.ts` | PASS |
| `test-local-audit-read-api-1.ts` | PASS |
| `test-local-request-expiry-dry-run.ts` | PASS |
| `test-local-request-expiry-apply.ts` | PASS |
| `test-local-rate-limit-abuse-guard-1.ts` | PASS |
| `test-local-request-audit-runtime-1.ts` | PASS |
| `test-local-request-audit-runtime-2.ts` | PASS |
| `test-local-request-audit-runtime-3.ts` | PASS |

### Composed runner

`npx tsx scripts/test-local-no-charge-e2e-qa.ts` — runs all 18 Local + 6 Tourism scripts (loads `.env` via `dotenv/config`).

| Run | Result |
|-----|--------|
| First composed run (same session) | FAIL on `merchant-request-reject-api` (`P2002` phone collision after prior scripts) |
| Retry `test-local-merchant-request-reject-api.ts` alone | PASS |
| Second full composed run | **PASS** (24 Local + 6 Tourism) |

## Safety grep (Local lane files)

Scoped: `src/routes`, `src/controllers/LocalRequestController.ts`, `src/services/local`, `src/screens/b2b/LocalMerchantRequestInboxScreen.tsx`, `src/screens/b2b/localMerchantInboxUi.ts`, `src/screens/b2c/LocalUserRequestStatusScreen.tsx`, `src/screens/b2c/localUserRequestStatusUi.ts`, `src/services/localUserRequestApi.ts`, `src/services/localMerchantInboxApi.ts`, `local.userRequestStatus` / `local.merchantInbox` i18n keys.

| Finding | Assessment |
|---------|------------|
| No `WalletService` / `walletOps` / `reserveAndCommitCredits` in Local backend services | OK |
| Forbidden payment terms in UI helpers | Only in `LOCAL_*_FORBIDDEN_COPY` test guard arrays |
| `local.userRequestStatus` / `local.merchantInbox` i18n | Safe no-charge copy; “Confirmed does not mean paid” intentional |
| Tourism / checkout / legacy i18n elsewhere | Pre-existing; out of Local pack scope |

## Known flakes

1. **`User.phoneNumber` unique constraint (`P2002`)** — integration tests use time-derived phones; rapid sequential or composed runs can collide. **Mitigation:** re-run failing script; consider `randomUUID()` suffix in test helpers (future hygiene, not this pack).
2. **`test-local-request-audit-runtime-2.ts`** — historically intermittent in CI-like environments; **PASS** in this certification run.
3. **`test-local-rate-limit-abuse-guard-1.ts`** — may emit minimal stdout; exit code 0 treated as PASS.

## Known blockers (pilot)

None blocking **automated** no-charge certification on `master` with `DATABASE_URL`.

Pilot gaps (manual / ops):

- Staging DB migration state vs `prisma/schema` not re-verified here
- No signed manual test matrix on physical devices
- No load test of rate limit across multiple app instances
- Local **create** UI may still route through legacy booking/demo paths on `LocalScreen` (classifieds/VIG adjacent); request-only **API** is certified, not every Local hub tile flow

## Confirmations (this pack)

- Docs + optional test runner only
- No runtime API/UI behavior changes
- No schema/migration changes
- No wallet/payment/Firebase VIP changes
- No Tourism file changes
- No Home/logo/polish changes
- No new unsafe payment/escrow/settlement copy in Local user/merchant status surfaces

## Recommendation

| Option | Action |
|--------|--------|
| **A** | Merge QA certification (`pack-local-no-charge-e2e-qa-1`) |
| **B** | Safe i18n copy pass (Tourism vs Local lane separation) |
| **C** | Staging DB + migration verification before external pilot |
| **D** | Stop / reassess if staging env unavailable |

**Suggested next step:** **C** then manual **PASS** promotion after device walkthrough of Local → My requests → cancel/timeline and B2B merchant inbox confirm/reject.

## Reproduce

```bash
git checkout master   # 4c7e719
# ensure DATABASE_URL in .env
npx tsx scripts/test-local-no-charge-e2e-qa.ts
```

Or run individual scripts listed in `scripts/test-local-no-charge-e2e-qa.ts`.
