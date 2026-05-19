# VIONA.LOCAL.REQUEST_SCHEMA_DESIGN.1

**Document ID:** `VIONA.LOCAL.REQUEST_SCHEMA_DESIGN_1`  
**Type:** Architecture / Prisma schema design (docs only — **no** `schema.prisma` edit in this pack)  
**Branch:** `pack-af51-local-request-schema-design`  
**Base master:** `f75b63c` — `docs(architecture): merge local merchant ack state machine design`  
**Inputs:** [Local Merchant Request Source of Truth Audit](../audit/VIONA_LOCAL_MERCHANT_REQUEST_SOURCE_OF_TRUTH_AUDIT_1.md), [Local Merchant ACK State Machine Design](./VIONA_LOCAL_MERCHANT_ACK_STATE_MACHINE_DESIGN_1.md), [Operating Protocol](../ai-context/VIONA_OPERATING_PROTOCOL.md), `prisma/schema.prisma`  
**Date:** 2026-05-19  

**Design law:** Local is a commercial universe but **not commercial-pilot-ready**. Do not fake merchant fulfillment or dispatch. Do not charge, lock, debit, or imply escrow without this row + ACK + ledger policy. **Classifieds VIP is not Local booking escrow.**

---

## Summary

Local needs a **durable Postgres source of truth** — **`LocalServiceRequest`** — before any commercial request creation, merchant inbox, confirm/reject/cancel APIs, or wallet hold behavior ships.

| Decision | Recommendation |
|----------|----------------|
| **Why now** | Audit @ `183af32` found **no** Prisma row for fixer hire, generic service requests, or classifieds leads; mock B2B ACK; dual wallet ledgers. State machine design @ `f75b63c` defines transitions but cannot be implemented without schema. |
| **Model choice** | **New `LocalServiceRequest`** — do **not** overload `TourismBooking` or replace `Booking` wholesale. |
| **Default wallet mode** | `REQUEST_ONLY_NO_CHARGE` (or `NO_LEDGER_PREVIEW`) at row create — **not** hold until finance + migration pack. |
| **Amount type** | **`Float`** fields suffixed `VIG` to match existing `Wallet`, `Booking`, `TourismBooking` (ledger code uses `VIG_EPSILON`). Optional v2 migration to `Decimal` for finance reporting — out of scope v1. |
| **Next implementation pack** | `VIONA.LOCAL.REQUEST_SCHEMA_MIGRATION.1` after design approval — only then edit `prisma/schema.prisma` + migration. |

---

## Current baseline

| Gap | Today (master `f75b63c`) | Schema implication |
|-----|--------------------------|------------------|
| **No durable Local request row** | Classifieds = React state; fixer = static catalog; services = Leona prefill | Requires new table |
| **Dual wallet SoT** | Firebase `walletOps` (VIP) vs Prisma `Wallet` (demo `Booking`) | `walletMode` enum; no Firebase in row default |
| **Mock merchant ACK** | Zustand / dashboard radar | Inbox queries `businessId` + `status` indexes |
| **Classifieds VIP isolation** | Debit without listing row | **No** `LocalServiceRequest` for VIP; separate future `ClassifiedListing` or promotion ledger |
| **Tourism reference only** | `TourismBooking` + hold/inbox on master | Mirror **patterns**, separate table and routes |

---

## Recommended Prisma model draft

> **Not applied in this pack.** Below is the target shape for `VIONA.LOCAL.REQUEST_SCHEMA_MIGRATION.1`.

### Model: `LocalServiceRequest`

```prisma
model LocalServiceRequest {
  id        String   @id @default(uuid())

  /// B2C user who submitted the request (canonical Local name — not `userId` alone in domain docs).
  requesterUserId String

  /// Merchant business under review. Required for merchant-inbox flows; optional only for pre-assignment fixer intents (v2).
  businessId      String

  /// Optional catalog line when request targets a known `Service` row.
  serviceId         String?

  /// Optional static fixer profile key from `localFixerCatalog` until provider User exists.
  fixerProfileKey   String?

  /// Assigned field provider (fixer employee / staff) — only source for “assigned” UI copy.
  assignedProviderUserId String?

  /// Bridge to legacy `Booking` when settlementMode = LEGACY_BOOKING_BRIDGE (nullable).
  legacyBookingId   String? @unique

  serviceType       LocalServiceType
  category          BizType?
  title             String
  description       String   @default("")
  locationText      String?
  city              String?
  countryCode       String?  // ISO 3166-1 alpha-2

  scheduledStartAt  DateTime?
  scheduledEndAt    DateTime?
  requestedAt       DateTime @default(now())
  merchantReviewDeadlineAt DateTime?

  confirmedAt       DateTime?
  rejectedAt        DateTime?
  cancelledAt       DateTime?
  completedAt       DateTime?
  expiredAt         DateTime?
  providerSettledAt DateTime?

  status            LocalServiceRequestStatus
  walletMode        LocalWalletMode @default(REQUEST_ONLY_NO_CHARGE)
  walletPhase       LocalWalletPhase @default(NONE)

  totalVioCredits           Float?
  heldVioCredits            Float?
  releasedVioCredits        Float?
  platformFeeVioCredits     Float?
  providerEarningsVioCredits Float?

  cancelReason      LocalCancelReason?
  rejectReason      LocalCancelReason?
  cancelledByRole   String?  // tourist | merchant | ops | system
  source            LocalRequestSource
  metadata          Json?

  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  requester         User     @relation(fields: [requesterUserId], references: [id], onDelete: Cascade)
  business          Business @relation(fields: [businessId], references: [id], onDelete: Cascade)
  service           Service? @relation(fields: [serviceId], references: [id], onDelete: SetNull)
  assignedProvider  User?    @relation("LocalRequestAssignedProvider", fields: [assignedProviderUserId], references: [id], onDelete: SetNull)
  legacyBooking     Booking? @relation(fields: [legacyBookingId], references: [id], onDelete: SetNull)

  @@index([requesterUserId, createdAt])
  @@index([businessId, status, createdAt])
  @@index([businessId, merchantReviewDeadlineAt])
  @@index([status, walletPhase])
  @@index([walletMode])
  @@index([legacyBookingId])
}
```

**Field notes:**

| Field | Rationale |
|-------|-----------|
| `requesterUserId` | Local-specific; avoids overloading “tourist” (Tourism) vs generic B2C booker. |
| `businessId` | **Required** in v1 for merchant inbox and owner ACL (`Business.ownerId`). Fixer-only requests without business: defer or use system placeholder business — **not** client-supplied owner. |
| `merchantOwnerId` | **Not stored** — derive `business.ownerId` in services; never trust client POST. |
| `serviceType` | Discriminator: `SERVICE_MENU`, `FIXER_HIRE`, `LEGAL_INTAKE`, `GENERIC_REQUEST`, etc. |
| `fixerProfileKey` | Static catalog id until fixer is a `User`. |
| `metadata` | Vertical extras (party size, language, Leona session id) — no wallet amounts in JSON alone. |
| Money fields | Snapshot at quote/submit; ledger reconciliation via `Transaction` + phases. |

---

## Proposed enums

### `LocalServiceRequestStatus`

| Value | Meaning | Allowed next (typical) | Wallet effect | Copy constraints |
|-------|---------|------------------------|---------------|------------------|
| `DRAFT` | Server-persisted draft (optional v1) | `REQUESTED`, delete | `NONE` | “Draft — not submitted” |
| `REQUESTED` | Row created; awaiting merchant | `MERCHANT_REVIEW`, terminals | Per `walletMode` | “Request submitted” |
| `MERCHANT_REVIEW` | In merchant inbox | `CONFIRMED`, `REJECTED`, `USER_CANCELLED`, `EXPIRED`, `OPS_CANCELLED` | Hold maintained if mode | “Pending merchant review” |
| `CONFIRMED` | Merchant ACK | `IN_PROGRESS`, `COMPLETED`, ops cancel* | Settle when mode allows | “Merchant confirmed” |
| `IN_PROGRESS` | Fulfillment started | `COMPLETED`, ops* | No new hold | “In progress” only if set |
| `COMPLETED` | Terminal success | — | Terminal | “Completed” |
| `REJECTED` | Merchant reject | — | `RELEASED` if held | “Declined” |
| `USER_CANCELLED` | Requester cancel pre-confirm | — | `RELEASED` if held | “You cancelled” |
| `OPS_CANCELLED` | Admin safety | — | Per playbook | “Cancelled by support” |
| `EXPIRED` | Review timeout | — | `RELEASED` if held | “Expired” |

\*Post-confirm ops cancel may require future clawback pack — schema allows `OPS_CANCELLED` from `CONFIRMED`/`IN_PROGRESS` with audit only.

**Client-only PREVIEW:** No row — quote screens before `POST /api/local/requests`.

### `LocalWalletMode` (settlement / product policy)

| Value | Meaning | Wallet on create | Settle timing |
|-------|---------|------------------|---------------|
| `NO_LEDGER_PREVIEW` | Demo / misconfig guard | None | None |
| `REQUEST_ONLY_NO_CHARGE` | **Default prod** until pilot | None | None |
| `HOLD_ON_SUBMIT` | Future pilot | Lock `totalVioCredits` | Not on create |
| `SETTLE_ON_CONFIRM` | Paired with hold | After confirm | `providerSettledAt` |
| `LEGACY_BOOKING_BRIDGE` | Points at `Booking` | Via `Booking.lockedAmountVIG` | QR complete path |
| `FIREBASE_VIP_ISOLATED` | **Not on `LocalServiceRequest`** | N/A | Classifieds only — do not use this enum value on rows |

### `LocalWalletPhase` (derived + persisted snapshot)

| Value | Meaning | Transitions in | User copy |
|-------|---------|----------------|-----------|
| `NONE` | No hold / preview | create in free modes | No hold language |
| `HELD` | Tourist funds locked | after hold txn | “VIO Credits on hold (in-app)” |
| `SETTLED` | Provider paid | after confirm settle | No “paid out” unless `providerSettledAt` |
| `RELEASED` | Hold returned | cancel/reject/expire | “VIO Credits released” |
| `REFUNDED` | Post-settle reversal (v2) | ops | Ops-only wording |
| `LEGACY_BRIDGE` | Legacy booking lock | bridge rows | Match `bookingEscrowUi` |
| `PREVIEW` | Explicit no-ledger | preview mode | “No charge in this build” |

### `LocalRequestSource`

| Value | Use |
|-------|-----|
| `LOCAL_SCREEN` | Universe Local tiles / composer |
| `FIXER_CHECKOUT` | Fixer hire submit |
| `LEONA_ASSIST` | Escalation from voice (metadata) |
| `LEGAL_SCAN` | Lawyer demo intake |
| `ADMIN_SEED` | Staging fixtures |
| `API_DIRECT` | Integrations |

### `LocalServiceType`

| Value | Use |
|-------|-----|
| `SERVICE_MENU` | Bookable `Service` under `Business` |
| `FIXER_HIRE` | Thổ địa / fixer intent |
| `GENERIC_REQUEST` | Free-form local commerce |
| `LEGAL_INTAKE` | Demo lawyer path |
| `CLASSIFIED_LEAD` | Future — **not** VIP promotion |

### `LocalCancelReason`

| Value | Typical actor | Wallet |
|-------|---------------|--------|
| `USER_CANCEL` | Requester | Release hold |
| `PROVIDER_REJECTED` | Merchant | Release hold |
| `EXPIRED` | System job | Release hold |
| `OPS_CANCEL` | Admin | Per playbook |
| `SYSTEM_SAFETY_RELEASE` | Admin | Release / manual review |
| `INSUFFICIENT_FUNDS` | Create failed | No row or rollback |
| `OTHER` | Any | Metadata string in `metadata` |

---

## Relationships and ownership

| Relation | Rule |
|----------|------|
| **Requester** | `requesterUserId` → `User` (B2C). Only requester (or ops) may tourist-cancel per API policy. |
| **Business** | `businessId` → `Business`. Merchant inbox: `WHERE businessId IN (SELECT id FROM Business WHERE ownerId = :authUserId)`. |
| **Owner scope** | **Never** accept `merchantOwnerId` from client. Resolve `Business.ownerId` server-side for confirm/reject. |
| **Assigned provider** | Optional `assignedProviderUserId` → `User`. Set only by merchant confirm or ops — enables dispatch copy. |
| **Service** | Optional FK to `Service` for priced menu bookings. |
| **Legacy bridge** | Optional 1:1 `legacyBookingId` → `Booking`. |
| **Wallet / Transaction** | v1: no FK on `Transaction` (matches tourism). Correlate by `idempotencyKey` pattern `local-request:{id}:{transition}`. v2 optional: `localServiceRequestId` on `Transaction`. |
| **Indexes** | `(businessId, status, createdAt)` merchant inbox; `(requesterUserId, createdAt)` history; `(status, walletPhase)` ops jobs; `(merchantReviewDeadlineAt)` timeout worker. |

Add inverse relations on `User`, `Business`, `Service`, `Booking` in migration pack.

---

## State transition compatibility

| State machine (ACK design) | Prisma `LocalServiceRequestStatus` | `LocalWalletPhase` |
|----------------------------|-----------------------------------|--------------------|
| DRAFT / PREVIEW (client) | no row or `DRAFT` | `NONE` / `PREVIEW` |
| REQUESTED | `REQUESTED` | `NONE` or `HELD` |
| MERCHANT_REVIEW | `MERCHANT_REVIEW` | `HELD` if hold mode |
| CONFIRMED | `CONFIRMED` | `SETTLED` when `providerSettledAt` set |
| IN_PROGRESS | `IN_PROGRESS` | `SETTLED` |
| COMPLETED | `COMPLETED` | `SETTLED` |
| REJECTED | `REJECTED` | `RELEASED` |
| USER_CANCELLED | `USER_CANCELLED` | `RELEASED` |
| OPS_CANCELLED | `OPS_CANCELLED` | policy |
| EXPIRED | `EXPIRED` | `RELEASED` |
| RELEASED / REFUNDED | (phase) | `RELEASED` / `REFUNDED` |

**Forbidden:** `MERCHANT_REVIEW` → `COMPLETED` without `CONFIRMED`.

---

## Wallet policy compatibility

| Mode | Schema support |
|------|----------------|
| `no_ledger_preview` | `walletMode = NO_LEDGER_PREVIEW`, `walletPhase = PREVIEW`, money fields null |
| `request_only_no_charge` | **Default** `@default(REQUEST_ONLY_NO_CHARGE)`, `walletPhase = NONE` |
| `hold_on_submit_future` | `walletMode = HOLD_ON_SUBMIT`, `heldVioCredits = totalVioCredits`, phase `HELD` |
| `settle_on_confirm_future` | `walletMode = SETTLE_ON_CONFIRM`, `providerSettledAt` required before phase `SETTLED` |
| `legacy_booking_bridge` | `legacyBookingId` + `walletMode = LEGACY_BOOKING_BRIDGE` |
| `firebase_vip_isolated` | **No row** on `LocalServiceRequest` |

**Rules:**

- Env default for new rows: `REQUEST_ONLY_NO_CHARGE` — not `HOLD_ON_SUBMIT`.
- This pack: **no** wallet mutations.
- `providerSettledAt` null until confirm settle path runs.
- No trigger in DB to move wallet — application layer only (`WalletService` future pack).

---

## Existing Booking compatibility

| Question | Answer |
|----------|--------|
| Reuse `Booking` vs new model? | **New `LocalServiceRequest`** for unified Local product; **bridge** legacy rows. |
| Why not extend `Booking` only? | `Booking` is QR-completion-centric (`completionQrTokenHash`, `timeSlot`, salon shape); fixer/generic requests need flexible scheduling + ACK states + `serviceType`. |
| Migration risks | Existing `Booking` rows **unchanged**. New flows write `LocalServiceRequest` + optional `legacyBookingId`. |
| QR complete | Keep `POST /api/bookings/complete-via-qr` for bridged `Booking`; map display to Local inbox via bridge FK. |
| Demo lawyer | Continue `POST /api/bookings` until cutover; then create `LocalServiceRequest` with `LEGACY_BOOKING_BRIDGE` + link id. |
| Destructive migration | **Forbidden** — no drop/rename of `Booking`. |

---

## Classifieds VIP compatibility

| Rule | Detail |
|------|--------|
| Isolation | VIP remains **`firebase_vip_isolated`** — Firebase `walletOps`, not `LocalServiceRequest`. |
| No escrow copy | Listing promotion fee — not merchant service hold. |
| No request row | VIP success must not imply `REQUESTED` / merchant review. |
| Future pack | `VIONA.LOCAL.CLASSIFIEDS_VIP_LEDGER_COMPATIBILITY.1` — optional `ClassifiedListing` table; still not booking escrow. |
| Unification | Do not set `LocalServiceRequest` from `submitPost` until policy + single ledger audit complete. |

---

## API implications (design only — not implemented)

| Method | Path | Purpose |
|--------|------|---------|
| `POST` | `/api/local/requests` | Create → `REQUESTED` / `MERCHANT_REVIEW` |
| `GET` | `/api/local/requests/me` | Requester history |
| `GET` | `/api/local/requests/merchant` | Owner-scoped inbox + `actions` DTO |
| `POST` | `/api/local/requests/:id/confirm` | → `CONFIRMED` + settle if mode |
| `POST` | `/api/local/requests/:id/reject` | → `REJECTED` + release |
| `POST` | `/api/local/requests/:id/cancel` | Requester → `USER_CANCELLED` |
| `POST` | `/api/local/requests/:id/complete` | → `COMPLETED` from `CONFIRMED`/`IN_PROGRESS` |
| `POST` | `/api/local/requests/:id/ops-cancel` | Admin + `superAdminMiddleware` |

Auth: `authMiddleware` on all; merchant routes verify `business.ownerId === authUserId`.

---

## Migration and rollout plan

| Step | Pack | Schema touch |
|------|------|--------------|
| 1 | **`VIONA.LOCAL.REQUEST_SCHEMA_MIGRATION.1`** | Add model + enums + indexes; empty table; no wallet code |
| 2 | `VIONA.LOCAL.REQUEST_CREATE_SOURCE_OF_TRUTH.1` | `POST` create; default free mode |
| 3 | `VIONA.LOCAL.MERCHANT_INBOX_API.1` | Read APIs |
| 4 | `VIONA.LOCAL.CONFIRM_REJECT_CANCEL_API.1` | Transitions (still free mode until step 6) |
| 5 | `VIONA.LOCAL.UI_STATE_TRUTH.1` | UI reads API |
| 6 | `VIONA.LOCAL.WALLET_HOLD_POLICY.1` | Enable `HOLD_ON_SUBMIT` staging only + finance sign-off |

**Backfill:** No backfill required for greenfield table. Optional link script for open `Booking` demo rows → bridge FK (manual).

---

## Risks and blocked items

| Risk | Mitigation |
|------|------------|
| Dual wallet SoT | Wallet pack declares Prisma-only for Local holds; VIP stays isolated |
| Mock ACK | Inbox API + UI pack removes fake confirm |
| Legacy `Booking` overlap | `legacyBookingId` bridge + docs for QR |
| Copy overclaim | UI pack + `providerSettledAt` / `assignedProviderUserId` gates |
| Wallet hold not allowed yet | Default `REQUEST_ONLY_NO_CHARGE` in schema |
| Production commercial pilot | **Blocked** until steps 1–6 + sign-offs |

---

## Validation plan for future schema pack

When `VIONA.LOCAL.REQUEST_SCHEMA_MIGRATION.1` runs:

| Check | Command / action |
|-------|------------------|
| Prisma schema | `npx prisma validate` |
| Client generate | `npx prisma generate` |
| Migration dry-run | `npx prisma migrate dev --create-only` review SQL |
| CI | `npm run typecheck` |
| Tourism regression | All six `scripts/test-tourism-*.ts` — must still pass |
| Local relation tests | Add `scripts/test-local-request-schema-relations.ts` (future) |
| Seed | Staging fixtures: requester, business, `REQUESTED` row, no wallet |

---

## Sign-off (template)

| Role | Name | Date |
|------|------|------|
| Engineering | | |
| Finance / Ledger | | |
| Product / Safety | | |

---

*End of design document.*
