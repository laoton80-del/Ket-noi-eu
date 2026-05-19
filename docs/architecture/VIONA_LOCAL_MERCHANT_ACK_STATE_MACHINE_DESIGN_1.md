# VIONA.LOCAL.MERCHANT_ACK_STATE_MACHINE_DESIGN.1

**Document ID:** `VIONA.LOCAL.MERCHANT_ACK_STATE_MACHINE_DESIGN_1`  
**Type:** Architecture / state-machine design (docs only — no behavior change in this pack)  
**Branch:** `pack-af50-local-merchant-ack-state-machine-design`  
**Base master:** `183af32` — `docs(audit): merge local merchant request source of truth`  
**Inputs:** [Local Merchant Request Source of Truth Audit](../audit/VIONA_LOCAL_MERCHANT_REQUEST_SOURCE_OF_TRUTH_AUDIT_1.md), [Tourism Booking State Machine Design](./VIONA_TOURISM_BOOKING_STATE_MACHINE_DESIGN_1.md), [Tourism Existing Rows Compatibility](./VIONA_TOURISM_EXISTING_ROWS_COMPATIBILITY_1.md), [Tourism Wallet Hold Implementation Prep](../audit/VIONA_TOURISM_WALLET_HOLD_IMPLEMENTATION_PREP_1.md), [Operating Protocol](../ai-context/VIONA_OPERATING_PROTOCOL.md)  
**Date:** 2026-05-19  

**Design law:** VIONA target state is **Active / Full** globally. **Local** is a commercial universe. Do not fake merchant fulfillment, dispatch, or provider assignment. Do not charge, lock, debit, or imply escrow without durable request state, merchant ACK, cancel/release policy, and ledger source-of-truth. **No function removal** in future packs without explicit deprecation plan.

**Scope:** Universe Local — service requests, fixer hire intents, classifieds monetization boundaries, legacy Prisma `Booking` compatibility, B2B merchant surfaces. **Out of scope:** Changing `TourismBooking` behavior (already hold-capable on master); implementing schema or APIs in this pack.

---

## Summary

| Item | Recommendation |
|------|----------------|
| **Recommended Local state machine** | Durable **`LocalServiceRequest`** (new Prisma entity — name TBD in schema pack) with status enum + parallel **`walletPhase`** + **`settlementMode`** (mirror tourism pattern). Lifecycle: **preview → REQUESTED / MERCHANT_REVIEW → CONFIRMED → IN_PROGRESS → COMPLETED** or terminal **REJECTED / USER_CANCELLED / OPS_CANCELLED / EXPIRED** with **`RELEASED`** wallet phase when holds involved. |
| **Readiness impact** | Local remains **not commercial-pilot-ready** until schema + create SoT + merchant inbox + confirm/reject/cancel APIs + wallet policy + UI truth packs land. This design **unblocks** those packs with a single contract. |
| **Minimum packs before commercial pilot** | (1) Request schema + create SoT, (2) merchant inbox API, (3) confirm/reject/cancel API, (4) wallet hold policy (single Prisma SoT), (5) classifieds VIP compatibility, (6) UI state truth, (7) staging pilot runbook + finance sign-off. **Do not** enable consumer Local debit on Firebase + device-only rows. |

**Tourism reference (master):** Reuse **patterns** from `TourismBooking` + `tourismMerchantInboxView` — **do not** route Local flows through tourism APIs or conflate merchant inboxes in UX without clear product labeling.

---

## Current audit baseline

From [VIONA_LOCAL_MERCHANT_REQUEST_SOURCE_OF_TRUTH_AUDIT_1.md](../audit/VIONA_LOCAL_MERCHANT_REQUEST_SOURCE_OF_TRUTH_AUDIT_1.md) @ `183af32`:

| Finding | Implication for design |
|---------|------------------------|
| **Dual wallet SoT** | Firebase `walletOps` (classifieds VIP, display chip) vs Prisma `Wallet` (demo `POST /api/bookings`). Local commercial policy must declare **one consumer spendable ledger** for request holds/debits. |
| **Mock merchant ACK** | `InboundQueueScreen` (Zustand) and `MerchantDashboardScreen` radar mutate local state only. Design requires **API-backed inbox** before any “Accept” CTA implies ACK. |
| **VIP classifieds debit risk** | `reserveAndCommitCredits` runs without server listing or request row. **Isolated** as `firebase_vip_isolated` — not a booking hold; separate product policy pack. |
| **Fixer checkout preview risk** | `LocalFixerCheckoutScreen` shows “Thanh toán” with no row/charge. Target: **REQUESTED** only after `POST` create; checkout remains **DRAFT/PREVIEW** until submit. |
| **Missing durable Local request row** | No Prisma model for fixer hire, generic service request, or classifieds lead. **Blocking** for hold/settle and merchant ACK. |

Legacy **`Booking`** (salon/lawyer demo): real lock + cancel + QR complete — **compatibility lane**, not the unified Local request model without migration design.

---

## Recommended Local request states

### Primary status (`LocalServiceRequest.status` — proposed)

Use a **single** Prisma enum (exact name in schema pack). **`MERCHANT_REVIEW`** may be stored explicitly or derived as `REQUESTED` + `merchantReviewDeadlineAt` not passed — v1 recommends **explicit `MERCHANT_REVIEW`** after row persistence for inbox clarity.

| State | Who enters | Who transitions out | Wallet effect | Merchant / provider effect | User-facing copy (allowed) | Forbidden claims |
|-------|------------|---------------------|---------------|----------------------------|----------------------------|------------------|
| **DRAFT / PREVIEW** | Client quote screens, fixer checkout before submit | User submits → create row | **`walletPhase=NONE`**; mode `no_ledger_preview` or `request_only_no_charge` | None | “Preview”, “estimate”, “not submitted” | “Booked”, “confirmed”, “paid”, “dispatched” |
| **REQUESTED** | `POST` create (consumer) | Merchant opens review → `MERCHANT_REVIEW` (optional auto), or timeout/cancel terminals | Per **`settlementMode`** (see [Wallet policy](#wallet-policy)) | Row visible in merchant inbox; **no** fulfillment | “Request submitted”, “pending merchant review” | “Merchant confirmed”, “provider assigned”, “escrow secured” |
| **MERCHANT_REVIEW** | System on create or merchant first view | Merchant confirm/reject; user cancel; ops; expiry job | Hold maintained if `hold_on_submit_future` | Owner must ACK or reject | “Merchant reviewing your request” | “Accepted”, “on the way”, “completed” |
| **CONFIRMED** | Merchant `POST …/confirm` | Merchant start service → `IN_PROGRESS`; ops cancel (policy); complete path | **Settle on confirm** (future): release hold → pay provider per policy | ACK timestamps; **no dispatch** unless `assignedProviderId` set | “Merchant confirmed your request” | “Guaranteed service”, “paid out to provider” (unless `providerSettledAt`) |
| **IN_PROGRESS** | Merchant or system (vertical-specific) | `COMPLETED` or ops cancel (policy) | No new hold; settlement already per policy | Service delivery in progress — **no fake GPS/dispatch** | “In progress” (if backend sets flag) | “Driver assigned” without row field |
| **COMPLETED** | Merchant complete API / QR legacy bridge | Terminal | Terminal ledger | Fulfillment closed | “Completed” | “Refundable” unless policy |
| **REJECTED** | Merchant `POST …/reject` | Terminal | **RELEASED** — full hold return (pre-settle) | No fulfillment | “Request declined”, “VIO Credits released” | “Refunded” (post-settle sense) before settle |
| **USER_CANCELLED** | Tourist `POST …/cancel` before confirm | Terminal | **RELEASED** if hold | No fulfillment | “You cancelled”, “hold released” | “Refund processed” (card) |
| **OPS_CANCELLED** | Admin `POST …/ops-cancel` | Terminal | Per ops playbook (release or manual review) | Ops audit reason required | “Cancelled by support” | Silent balance change |
| **EXPIRED** | Timeout worker (merchant review deadline) | Terminal | **RELEASED** — same as reject (no penalty v1) | No fulfillment | “Expired — merchant did not respond” | “Confirmed” |
| **RELEASED / REFUNDED** | *(wallet phase, not always top-level status)* | Terminal wallet | Tourist spendable restored; **no** provider credit | — | “VIO Credits released (in-app)” | “Bank refund” |

**Forbidden transitions (launch):**

- `REQUESTED` / `MERCHANT_REVIEW` → `COMPLETED` without `CONFIRMED` (mirrors tourism guard).
- `CONFIRMED` → `REJECTED` with provider already settled without ops clawback pack.
- Any transition that debits or locks without a persisted row id.

### Parallel fields (recommended — mirror tourism)

| Field | Purpose |
|-------|---------|
| `walletPhase` | `NONE` \| `HELD` \| `SETTLED` \| `RELEASED` \| `LEGACY_*` \| `PREVIEW` |
| `settlementMode` | `no_ledger_preview` \| `request_only_no_charge` \| `hold_on_submit` \| `settle_on_confirm` \| `legacy_booking_bridge` \| `firebase_vip_isolated` (classifieds only) |
| `merchantReviewDeadlineAt` | Timeout anchor (UTC; not `timeSlot` for fixer) |
| `confirmedAt`, `rejectedAt`, `cancelledAt`, `cancelReason`, `cancelledByRole` | Audit |
| `assignedProviderId` / `fixerProfileId` | Optional — **only** source for “assigned” copy |

---

## Wallet policy

Design **separate modes** — env or per-vertical config (`LOCAL_SETTLEMENT_MODE` / row-level `settlementMode`). **Production default:** `request_only_no_charge` or `no_ledger_preview` until finance signs hold pilot.

| Mode | When used | Debit / lock | Settle | Classifieds VIP |
|------|-----------|--------------|--------|-----------------|
| **`no_ledger_preview`** | Demos, missing API, pilot tiles | None | None | N/A |
| **`request_only_no_charge`** | Commercial Lite phase 1 | None | None | Still isolated |
| **`hold_on_submit_future`** | After wallet pack + staging pilot | Hold on `REQUESTED` (`BOOKING_LOCK` pattern) | **Not** on create | **Never** for VIP |
| **`settle_on_confirm_future`** | Paired with hold | Hold until `CONFIRMED` | Provider/treasury credit on confirm | **Never** |
| **`legacy_booking_bridge`** | Existing Prisma `Booking` rows | Existing lock at create | QR `complete-via-qr` | Map to `Booking.id` FK optional |
| **`firebase_vip_isolated`** | Classifieds VIP only | Firebase `walletOps` commit | N/A — **not** escrow | **Separate** product; not Local request hold |

### Rules (non-negotiable)

1. **No debit or lock without durable request row** (`LocalServiceRequest` or explicit legacy `Booking` bridge).
2. **No merchant settlement before `CONFIRMED`** (and `providerSettledAt` if column adopted).
3. **No release/refund wording** without ledger tx or `walletPhase=RELEASED` derived from server.
4. **Classifieds VIP must not** use Local booking hold/settle paths — monetization is “listing promotion”, not merchant service ACK.
5. **Single consumer spendable SoT** for Local service holds: **Prisma `Wallet`** (align with tourism); Firebase display must reconcile or VIP must move to REST.
6. **Idempotency:** `requestId` + transition name on all wallet mutations.

### Comparison to legacy `Booking`

| Aspect | Legacy `Booking` | Target Local request |
|--------|------------------|----------------------|
| Hold at create | 100% list → `lockedBalanceVIG` | Same pattern when `hold_on_submit` enabled |
| Cancel | 80/20 penalty split | v1: **100% release** on pre-confirm reject/cancel (simpler); penalty v2 |
| Complete | QR handshake | Keep for verticals that need QR; optional parallel to `COMPLETED` |
| Merchant inbox | Missing | **Required** new API |

---

## Merchant ACK model

| Requirement | Design |
|-------------|--------|
| **Inbox** | `GET /api/local/requests/merchant` (or unified `/api/merchant/requests?universe=local`) — owner-scoped, filters `REQUESTED` / `MERCHANT_REVIEW` |
| **Confirm** | `POST /api/local/requests/:id/confirm` — auth owner; → `CONFIRMED`; settle if mode allows; set `confirmedAt` |
| **Reject** | `POST /api/local/requests/:id/reject` — → `REJECTED`; reason `PROVIDER_REJECTED` or custom; release hold |
| **Tourist cancel** | `POST /api/local/requests/:id/cancel` — before confirm → `USER_CANCELLED`; release hold |
| **Complete** | `POST /api/local/requests/:id/complete` — only from `CONFIRMED` or `IN_PROGRESS` → `COMPLETED` |
| **Timeout** | Default **48h** (`LOCAL_MERCHANT_REVIEW_TIMEOUT_HOURS`); staging **24h**; job → `EXPIRED` + release (reuse tourism timeout **pattern**, separate worker pack) |
| **Ops cancel** | `POST /api/local/requests/:id/ops-cancel` — `authMiddleware` + `superAdminMiddleware`; reasons `OPS_CANCEL` \| `SYSTEM_SAFETY_RELEASE` |
| **QR complete compatibility** | Legacy `Booking`: keep `POST /api/bookings/complete-via-qr` for bridged rows (`settlementMode=legacy_booking_bridge`). New Local entity: QR optional v2 — do not fake QR on fixer without token issuance |
| **Actions DTO** | Mirror tourism: `canConfirm`, `canCancel`, `canComplete`, `canReject` — **UI reads flags only** |
| **Audit** | Append-only events: `created`, `hold_placed`, `confirmed`, `rejected`, `cancelled`, `expired`, `completed`, `ops_cancel` |

**B2B UI rule:** Remove or gate mock `confirmBooking` / radar accept until inbox API wired; show **“Demo queue”** badge if still mock.

---

## Flow-specific mapping

| Flow | Current behavior | Target state model | Migration / compatibility | Risk |
|------|------------------|-------------------|---------------------------|------|
| **Local fixer** | Static catalog; checkout = math only; “Thuê” → preview screen | **DRAFT/PREVIEW** on checkout; **REQUESTED** after `POST` with `fixerProfileId`, hours, quote | New row type `FIXER_HIRE`; no Stripe charge until policy pack; Connect plan stays preparatory | **P2** until create API |
| **Local services** (tiles → Leona / future book) | Leona prefill; no row | **DRAFT** client; **REQUESTED** on server create when service booking ships | Link `businessId`, `serviceId` from `Service` catalog | **P1** product scope |
| **Classifieds VIP** | Firebase debit; device-only post | **`firebase_vip_isolated`** — **not** `LocalServiceRequest` | Separate `ClassifiedListing` entity or stay promotion-only; no merchant ACK | **P0** if treated as booking |
| **Classifieds normal** | Local state only | No wallet; optional future **REQUESTED** for “contact merchant” leads | v2 | Low |
| **Demo lawyer booking** | `POST /api/bookings` lock; env IDs | **`legacy_booking_bridge`** → `Booking` row; map status to display states | Do not break `BookingService`; add inbox bridge or migrate row | **P2** |
| **Marketplace auto-book** | Mock `confirmed` in storage; flag **off** | **Disabled** or **DRAFT** only until real inbox | Keep `enableMarketplaceSurface: false` | **P1** if enabled |
| **B2B inbound queue** | Zustand mock | Read **Local** + **Tourism** inboxes separately; mock labeled demo | Replace confirm with API calls | **P0** ops trust |
| **Dashboard radar** | Local accept/decline state | Same as inbox — **no** accept without API 200 | Tourism inbox tile already real for tourism | **P1** |

---

## Copy safety rules

| Rule | Detail |
|------|--------|
| Request submitted | Use “request submitted”, “sent for merchant review” — not “booking confirmed”. |
| Merchant review | “Merchant review required” / “pending merchant review” on `REQUESTED` / `MERCHANT_REVIEW`. |
| No dispatch | Do not show “on the way”, “driver assigned”, “fixer dispatched” unless `assignedProviderId` or `fixerAssignmentStatus` set by server. |
| No provider assigned | Provider name from **row** only; static catalog names are “preview”. |
| Payment / escrow | “VIO Credits on hold (in-app)” only when `walletPhase=HELD`; “released” when `RELEASED`; never “escrow secured” without ledger. |
| Terminology | **VIO Credits** only in user-facing copy (not VIG). |
| Confirmed | Only when `status=CONFIRMED` or `confirmedAt` set. |
| Paid to provider | Only when `providerSettledAt` (or equivalent) set. |
| Classifieds VIP | “Listing promotion fee” — not “booking deposit”. |
| Fixer checkout title | Replace “Thanh toán” with “Request preview” until charge path exists. |
| B2B radar | “Demo radar” or bind to inbox states. |

Align keys with `localCommerce.*` and extend `localHub.*` in **UI pack only** — not in this design pack.

---

## Recommended implementation sequence

### 1. `VIONA.LOCAL.REQUEST_SCHEMA_DESIGN.1`

| | |
|-|-|
| **Target files** | `docs/architecture/VIONA_LOCAL_REQUEST_SCHEMA_DESIGN_1.md`, Prisma schema proposal |
| **Allowed** | Enum definitions, FK to `Business` / `User` / `Service`, migration plan vs `Booking` |
| **Do-not-touch** | Runtime services, tourism schema |
| **Validation** | Design review Engineering + Finance |
| **Sign-off** | **P0** — blocks all code packs |

### 2. `VIONA.LOCAL.REQUEST_CREATE_SOURCE_OF_TRUTH.1`

| | |
|-|-|
| **Target files** | `POST /api/local/requests`, service layer, optional `LocalScreen` / fixer submit |
| **Allowed** | Create row `REQUESTED`; mode `request_only_no_charge` first |
| **Do-not-touch** | `TOURISM_SETTLEMENT_MODE`, tourism wallet functions |
| **Validation** | Integration tests; no wallet debit in v1 slice |
| **Sign-off** | Engineering |

### 3. `VIONA.LOCAL.MERCHANT_INBOX_API.1`

| | |
|-|-|
| **Target files** | `GET /api/local/requests/merchant`, `localMerchantInboxView.ts` (mirror tourism) |
| **Allowed** | Read-only DTO + `actions` derivation |
| **Do-not-touch** | Settlement |
| **Validation** | Unit tests for action flags |
| **Sign-off** | Engineering |

### 4. `VIONA.LOCAL.CONFIRM_REJECT_CANCEL_API.1`

| | |
|-|-|
| **Target files** | `POST …/confirm`, `…/reject`, `…/cancel`, `…/complete`, `…/ops-cancel`; eligibility helpers |
| **Allowed** | State transitions + wallet when mode enabled |
| **Do-not-touch** | Production hold flags until staging pilot |
| **Validation** | Eligibility scripts (mirror tourism test pattern) |
| **Sign-off** | **Finance mandatory** if VIO Credits move |

### 5. `VIONA.LOCAL.WALLET_HOLD_POLICY.1`

| | |
|-|-|
| **Target files** | `src/config/localSettlementMode.ts`, `WalletService` Local hold/release/settle |
| **Allowed** | Prisma-only consumer debit for Local requests |
| **Do-not-touch** | Classifieds VIP until pack 6 |
| **Validation** | Reconciliation checklist; tourism regression tests still pass |
| **Sign-off** | **P0** Finance + Engineering |

### 6. `VIONA.LOCAL.CLASSIFIEDS_VIP_LEDGER_COMPATIBILITY.1`

| | |
|-|-|
| **Target files** | `LocalScreen.submitPost`, `walletOps` or REST migration, listing persistence |
| **Allowed** | Isolate VIP from booking hold; durable listing row |
| **Do-not-touch** | Local request hold paths |
| **Validation** | No dual-charge; VIP failure rollback |
| **Sign-off** | Finance + Product |

### 7. `VIONA.LOCAL.UI_STATE_TRUTH.1`

| | |
|-|-|
| **Target files** | `LocalScreen`, `InboundQueueScreen`, `MerchantDashboardScreen`, fixer screens, `en.json` / `vi.json` |
| **Allowed** | Inbox UI, badges, remove mock confirm or gate as demo |
| **Do-not-touch** | Broad nav redesign |
| **Validation** | UI display helper tests; copy safety checklist |
| **Sign-off** | Product / Safety |

---

## Launch gates

**Local commercial pilot blocked** until **all** are true:

| Gate | Owner |
|------|-------|
| Durable request source-of-truth exists (`LocalServiceRequest` or documented `Booking` bridge with inbox) | Engineering |
| Merchant ACK API (`confirm` / `reject`) implemented and staging-tested | Engineering |
| Cancel / release policy exists (tourist + merchant + timeout + ops) | Engineering + Finance |
| Wallet policy documented and enabled only on staging (`LOCAL_SETTLEMENT_MODE`) | Finance |
| Copy aligns with backend truth (no mock ACK in production paths) | Product / Safety |
| Classifieds VIP isolated from booking hold or migrated to single SoT | Finance |
| Finance / ledger sign-off for any VIO Credits hold or settle | Payments & Ledger |
| Ops aware of kill switch (`request_only_no_charge` / legacy mode) | Operations |

**Parallel track:** Tourism staging hold pilot does **not** satisfy Local gates.

---

## Relationship to Tourism (master)

| Tourism (shipped pattern) | Local (this design) |
|---------------------------|---------------------|
| `TourismBooking` + settlement metadata | `LocalServiceRequest` + `settlementMode` |
| `GET /api/tourism/bookings/merchant` | `GET /api/local/requests/merchant` |
| Hold / confirm / cancel / ops-cancel | Same **transition semantics**, separate routes |
| `tourismMerchantInboxView.ts` | `localMerchantInboxView.ts` (future) |
| Staging runbooks | **Separate** Local hold pilot runbook (future) |

---

## Sign-off record (template)

| Role | Name | Date | Notes |
|------|------|------|-------|
| Design author (Engineering) | | | |
| Finance / Ledger | | | |
| Product / Safety | | | |
| Operations | | | |

---

*End of design document.*
