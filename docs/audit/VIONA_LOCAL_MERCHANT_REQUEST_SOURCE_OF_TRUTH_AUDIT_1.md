# VIONA.LOCAL.MERCHANT_REQUEST_SOURCE_OF_TRUTH_AUDIT.1

**Document ID:** `VIONA.LOCAL.MERCHANT_REQUEST_SOURCE_OF_TRUTH_AUDIT.1`  
**Type:** Read-only Local commercial / merchant-request source-of-truth audit (report only)  
**Branch:** `pack-af49-local-merchant-request-source-of-truth-audit`  
**Base master:** `2e6c624` — `docs(runbook): merge tourism staging access unblock checklist`  
**Date:** 2026-05-19  

**Governing law:** [VIONA Operating Protocol](../ai-context/VIONA_OPERATING_PROTOCOL.md), [Travel/Local Backend Source of Truth Audit](./VIONA_TRAVEL_LOCAL_BACKEND_SOURCE_OF_TRUTH_AUDIT_1.md) (prior; partially superseded for **Tourism** only), [Travel/Local Fulfillment Readiness Audit](./VIONA_TRAVEL_LOCAL_FULFILLMENT_READINESS_AUDIT_1.md), [Pack E Local Commerce Booking Clarity Audit](./VIONA_PACK_E_LOCAL_COMMERCE_BOOKING_CLARITY_AUDIT.md).

**Scope:** Universe **Local** (`LocalScreen`, classifieds, local commerce registry), **legacy Prisma `Booking`** paths reachable from Local, **Local Fixer** (Travel stack cross-link), **B2B merchant surfaces** that merchants may treat as “Local ops” (dashboard radar, inbound queue, salon dashboard). **Out of scope for Local packs:** `TourismBooking` hold/confirm/cancel (already on master — reference only for lifecycle comparison).

**Path map:** `src/screens/b2c/LocalScreen.tsx`, `src/screens/b2c/travel/LocalFixer*.tsx`, `src/screens/b2b/MerchantDashboardScreen.tsx`, `src/screens/b2b/InboundQueueScreen.tsx`, `src/screens/b2b/B2BBookingDashboard.tsx`, `src/services/bookingService.ts`, `src/services/api/BookingService.ts`, `src/state/b2bBooking.ts`, `src/state/wallet.ts`, `src/core/localCommerce/*`, `src/services/marketplace/bookingFlow.ts`.

---

## Summary

| Item | Result |
|------|--------|
| **Current readiness level** | **Not commercial-pilot-ready** for unified Local merchant request + fulfillment truth. Capability labels (`lite`, `requestOnly`, `demo`, `pilot`) are honest on tiles, but **no end-to-end Local request row** ties consumer action → merchant ACK → wallet policy → dispatch. |
| **Biggest source-of-truth risks** | (1) **Dual wallet ledgers** — classifieds VIP debits **Firebase `walletOps`** while demo lawyer booking locks **Prisma `Wallet`**. (2) **B2B merchant “confirm” is mock** — `InboundQueue` / dashboard radar do not read `Booking` or any Local request table. (3) **Classifieds VIP** charges real credits for **device-only listings** (no server listing SoT). (4) **Fixer checkout title “Thanh toán”** with no booking row or charge — copy/UX drift risk. |
| **Can Local safely move toward commercial pilot?** | **No** — not until a designed Local request state machine, merchant inbox API, and single wallet hold/release policy are implemented **without** faking ACK or dispatch. Tourism hold stack on master is the **reference pattern**, not a substitute for Local. |

**Tourism comparison (master @ `2e6c624`):** Tourism has Prisma `TourismBooking`, optional hold mode, `GET /api/tourism/bookings/merchant`, confirm/cancel/complete/ops-cancel, and merchant inbox UI. **Local legacy `Booking` has create + cancel + QR complete on server but no merchant list/confirm/reject API and no B2C Local UI wired to cancel/complete.**

---

## Current Local flows inventory

| Flow | User action | Current source of truth | Wallet / payment behavior | Merchant / provider behavior | Risk |
|------|-------------|-------------------------|---------------------------|------------------------------|------|
| **Classifieds browse** | Scroll feed on `LocalScreen` | **React `useState`** + `DEFAULT_POSTS` seed | None | None | **Low** |
| **Classifieds compose (normal)** | Post listing | **Device state only** — `setPosts([newPost, …])` | None | None | **Low** |
| **Classifieds VIP post** | Toggle VIP → submit | **Device state** after debit | **Debit** — `reserveAndCommitCredits` → Firebase `walletOps` | No merchant; no listing DB | **P1** |
| **Local commerce tiles** | Tap service / restaurant / housing / classifieds | **Static registry** (`localCommerceRegistry`) — status chips only | None on tap (mostly Leona prefill or scroll) | None | **Low** |
| **Demo lawyer booking** | Legal scan critical → “book lawyer” | **Prisma `Booking`** via `POST /api/bookings` | **Lock** — `balanceVIG` → `lockedBalanceVIG`, `BOOKING_LOCK` tx when price > 0 | **Server `PENDING`** — no merchant inbox; owner completes via **QR API** (not wired on Local UI) | **P2** |
| **Leona booking assist** | Tile / clarity CTA → `LeonaCall` prefill | None | None unless user enters separate monetized call flow | None | **Low** |
| **Legal document scan** | AI Trạng Sư scan | Server AI billing path | **Debit** (trusted charge / API — not Local booking) | N/A | **P2** (adjacent) |
| **Local Fixer catalog** | Browse fixers | **Static** `localFixerCatalog.ts` | None | None | **Low** |
| **Local Fixer checkout** | “Thuê” → checkout screen | **In-memory math** `LocalFixerService.calculateSplitPayment` | **No charge** — Stripe Connect plan helper only | No assignment / dispatch | **P2** (copy) |
| **Fixer earnings preview** | Navigate from checkout | Same static math | None | None | **Low** |
| **B2B merchant dashboard radar** | Accept / decline card | **Component `useState`** `INITIAL_RADAR` | None | **UI-only** `ACCEPTED` / `DECLINED` | **P1** |
| **B2B Inbound Queue** | Confirm inquiry | **Zustand** `state/b2bBooking.ts` | None | **`confirmBooking` → `status: confirmed`** in mock store | **P1** |
| **B2B salon dashboard** | Waitlist / timeline | **In-memory** `INITIAL_WAITLIST` / `INITIAL_TIMELINE` in `B2BBookingDashboard.tsx` | None | Mock salon ops | **P2** |
| **Tourism merchant inbox** (linked from dashboard) | Confirm / decline tourism | **Prisma `TourismBooking`** + inbox API | Hold/settle per tourism mode | **Real** for tourism only | **N/A Local** — do not conflate |
| **LifeOS marketplace auto-book** | CTA when enabled | **AsyncStorage** `marketplaceTransactions` + mock `status: confirmed` | Fee credits tracked locally | **Fake** “Đã chốt lịch” message | **P1** if flag enabled (`enableMarketplaceSurface` default **false**) |
| **Ultra Master demo booking** | Bento flow | Same as demo lawyer — `getDemoBookingPayload()` | Same Prisma lock path | Same gap | **P2** |

---

## Backend / data source inventory

| Model / service / store / API | Source type | Used by | Commercial risk |
|------------------------------|-------------|---------|-----------------|
| `ClassifiedPost` (TS type, not Prisma) | **Local React state** | `LocalScreen` | VIP paid posts not durable — **P1** |
| `DEFAULT_POSTS` | **Static seed** | `LocalScreen` | OK for demo |
| `localCommerceRegistry` | **Static config** | `LocalCommerceClarityBlock`, tiles | Labels only — OK |
| Prisma `Booking` + `Service` + `Business` | **Postgres** | `POST /api/bookings`, `BookingService` | Real lock; **no merchant list route** — **P1** |
| `POST /api/bookings/cancel` | **Postgres** + wallet release rules | **API only** — no audited Local/B2B inbox UI | Exposure gap — **P2** |
| `POST /api/bookings/complete-via-qr` | **Postgres** + settlement | B2B QR flows (not Local screen) | OK server-side |
| `TourismBooking` + tourism routes | **Postgres** | Tourism / Travel checkout — **not Local universe** | Reference lifecycle — **N/A** |
| `state/b2bBooking` Zustand | **In-memory mock** | `InboundQueueScreen`, AI receptionist hooks | **Fake ACK** — **P0** for ops trust |
| `MerchantDashboardScreen` radar | **In-memory mock** | B2B dashboard | **Fake ACK** — **P1** |
| `B2BBookingDashboard` waitlist | **In-memory mock** | Salon vertical demo | OK if labeled demo |
| `LOCAL_FIXER_PROFILES` | **Static catalog** | `LocalFixerScreen` | OK |
| `LocalFixerService` | **Pure functions** | Checkout / earnings screens | No persistence — OK |
| `walletOps` (Firebase functions) | **Firebase** credits | `reserveAndCommitCredits`, display `useWalletState` | **Split SoT** vs Prisma — **P0** |
| `GET /api/wallet/balance` (REST) | **Prisma `Wallet`** | Tourism checkout, some REST flows | Local VIP does not use this for debit — **P1** |
| `runMarketplaceAiBookingFlow` | **Local storage + mock confirmed** | LifeOS (gated off) | **P1** if enabled |
| `createBooking` client (`bookingService.ts`) | REST → Prisma | `LocalScreen` demo path | Env-gated — **P2** |

**No Prisma model** found for Local classifieds, fixer hire requests, or generic “service request” rows.

---

## Wallet / VIO Credits exposure

| Flow | Debit / lock / preview / free | Ledger source | Refund / reversal path | Risk |
|------|------------------------------|---------------|------------------------|------|
| Classifieds VIP | **Debit** (commit) | Firebase `walletOps` | `rollbackReservedCredits` exists — **not wired** on VIP post failure after commit | **P1** |
| Demo `POST /api/bookings` | **Lock** (pre-auth 100% list price) | Prisma `Wallet` + `BOOKING_LOCK` | `POST /api/bookings/cancel` — 80/20 split (server); **UI not wired** | **P2** |
| QR complete (legacy) | Release lock → pay merchant | Prisma transactions | Terminal | **P3** (B2B path) |
| Local Fixer checkout | **None** | N/A | N/A | **Low** (misleading “Thanh toán” title — **P2** copy) |
| Legal scan | **Debit** (flow-specific) | API / trusted charge | Flow-specific | Adjacent |
| Tourism (cross-link from Local tab) | Hold or legacy settle | Prisma | Tourism cancel/release APIs | **Out of Local scope** — compare only |
| Wallet chip on `LocalScreen` | Display | Firebase-synced `useWalletState` | May **not match** Prisma balance used by demo booking | **P1** |

**Rule violation risk:** Charging or locking VIO Credits without a **durable request row** and **merchant ACK policy** applies to **classifieds VIP** (debit without server request) and any future Local “pay to request” without design sign-off.

---

## Merchant ACK / fulfillment truth

### Where merchant confirmation exists (real)

| Surface | Mechanism | Backend row |
|---------|-----------|-------------|
| Legacy booking QR complete | Merchant/booker scans QR — `completeBookingViaQr` | `Booking` → `COMPLETED` |
| Tourism merchant inbox | `POST …/confirm`, inbox DTO `canConfirm` | `TourismBooking` |

### Where confirmation is mock / preview

| Surface | Behavior | User may believe |
|---------|----------|------------------|
| `InboundQueueScreen` | `confirmBooking(id)` updates Zustand only | Merchant accepted booking |
| `MerchantDashboardScreen` radar | Accept → local state `ACCEPTED` + i18n “acceptedMsg” | Order radar updated |
| `runMarketplaceAiBookingFlow` | Returns `status: 'confirmed'` + Vietnamese confirmation string | Leona secured booking |
| Classifieds success alert | “Đăng tin thành công” | Listing is live marketplace inventory (device only) |
| Local Fixer | No booking id | Hire / dispatch |

### Missing confirm / reject / cancel paths (Local-specific)

| Need | Status on master |
|------|------------------|
| `GET /api/bookings/merchant` (or Local namespace) | **Missing** for `Booking` |
| Merchant reject / release held funds | **Server:** `POST /api/bookings/cancel` — **no B2B UI** |
| Merchant confirm before settlement | **No** `CONFIRMED` transition on legacy `Booking` create path (QR-complete model differs from tourism hold) |
| Consumer cancel for Local service request | **No** dedicated Local UI |
| Fixer request create + merchant ACK | **Not implemented** |
| Classifieds → merchant lead | **Not implemented** |

### User copy — overpromise vs mitigated

| Location | Assessment |
|----------|------------|
| `localCommerce.*` + clarity block | **Mitigated** — `requestOnly`, safety notes |
| `home.universeLocalSub` (en) | **Mitigated** — “request first, merchant review required” |
| `bookingEscrowUi.ts` | **Mitigated** — request preview, not guaranteed booking |
| `LocalScreen` classifieds success | **Risk** — hardcoded Vietnamese success; no “device preview” |
| `LocalFixerScreen` hero | **Mitigated** — “xem trước / pilot (demo)” |
| `LocalFixerCheckoutScreen` title | **Risk** — “Thanh toán Thổ Địa” without payment |
| `b2b.radar.acceptedMsg` | **Risk** — implies operational accept without backend |

---

## Safety and copy risks

| Risk | Evidence | Severity |
|------|----------|----------|
| **Fake dispatch** | No fixer assignment model; Leona prefills deny auto-dispatch in travel copy | **P2** (fixer CTA “Thuê”) |
| **Fake confirmed booking** | B2B Zustand + marketplace mock; radar accept | **P1** |
| **Fake provider assignment** | Static fixer catalog; no `fixerId` on booking row | **P2** |
| **Payment / escrow overclaim** | Fixer “Thanh toán”; VIP debit without listing SoT | **P1** |
| **Dual wallet confusion** | VIP uses Firebase; demo booking uses Prisma REST | **P0** |
| **Tourism conflation** | Tourism inbox linked from merchant dashboard — merchants may assume same for Local services | **P2** ops training |

**Future copy corrections (behavior packs, not this audit):** classifieds success i18n; fixer CTA/title; B2B radar messages when wired to real API.

---

## Gaps versus Tourism hold / confirm / cancel lifecycle

| Tourism capability (master) | Local equivalent |
|----------------------------|------------------|
| `TourismBooking` row + settlement metadata | Legacy `Booking` only for env-gated demo — **not** general Local requests |
| `TOURISM_SETTLEMENT_MODE=hold` + `BOOKING_LOCK` | Legacy create uses lock — **no** Local product flag or inbox |
| `GET …/bookings/merchant` | **Missing** for `Booking` |
| `POST …/confirm` / `cancel` | Tourism only |
| Merchant inbox UI | Tourism only (`TourismMerchantInboxScreen`) |
| Display states + `actions.canConfirm` | Tourism only |
| Timeout dry-run worker | Tourism held rows only |
| Staging pilot runbooks | Tourism — Local not included |

**Implication:** Do **not** enable Local commercial debit by copying tourism hold env on the same screens without a **Local-specific** request model and inbox.

---

## Recommended Local state machine

Draft **safe** model for a future `LocalServiceRequest` (or extended `Booking`) — align naming with finance before schema:

| State | Meaning | Wallet (when policy enabled) |
|-------|---------|------------------------------|
| `REQUESTED` | Consumer submitted; visible to merchant | Optional **hold** of quoted VIO Credits |
| `MERCHANT_REVIEW` | Awaiting owner ACK (alias or sub-state of `REQUESTED`) | Hold maintained |
| `CONFIRMED` | Merchant accepted; fulfillment scheduled | Settle or retain hold per policy |
| `IN_PROGRESS` | Service actively delivered | Per vertical |
| `COMPLETED` | Fulfilled; terminal | Settlement final |
| `CANCELLED` | Rejected or expired before confirm | **Release** hold to consumer |
| `RELEASED` / `REFUNDED` | Ledger reversal completed | Terminal wallet state |

**Do not** skip `MERCHANT_REVIEW` → `CONFIRMED` for any flow that debits or locks credits.

---

## Recommended implementation sequence

### 1. `VIONA.LOCAL.MERCHANT_ACK_STATE_MACHINE_DESIGN.1`

| Field | Value |
|-------|--------|
| **Target files** | New `docs/architecture/VIONA_LOCAL_MERCHANT_ACK_STATE_MACHINE_DESIGN_1.md`; references `Booking` vs new entity decision |
| **Allowed changes** | Design doc only |
| **Do-not-touch** | Wallet settlement code, tourism routes, production env |
| **Validation** | Design review — Engineering + Finance + Product |
| **Risk / sign-off** | **P0** — blocks all Local wallet packs |

### 2. `VIONA.LOCAL.REQUEST_CREATE_SOURCE_OF_TRUTH.1`

| Field | Value |
|-------|--------|
| **Target files** | Prisma model (if approved), `POST /api/local/requests` or extend `Booking`; migrate; `LocalScreen` / classifieds server persistence |
| **Allowed changes** | Schema + create API + durable listing/request rows |
| **Do-not-touch** | `TOURISM_SETTLEMENT_MODE`; tourism wallet functions |
| **Validation** | `prisma migrate`, integration tests, no debit until ACK design signed |
| **Risk / sign-off** | Finance for any wallet column |

### 3. `VIONA.LOCAL.MERCHANT_INBOX_API.1`

| Field | Value |
|-------|--------|
| **Target files** | `GET /api/local/requests/merchant` (or `/api/bookings/merchant` if unified), view service mirroring `tourismMerchantInboxView.ts` |
| **Allowed changes** | Read-only inbox DTO + `actions` flags |
| **Do-not-touch** | Settlement until confirm pack |
| **Validation** | Unit tests for action derivation; no UI required in pack |
| **Risk / sign-off** | Engineering |

### 4. `VIONA.LOCAL.CONFIRM_REJECT_CANCEL_API.1`

| Field | Value |
|-------|--------|
| **Target files** | `POST …/confirm`, `…/cancel`; wire to wallet hold/release mirroring tourism eligibility helpers |
| **Allowed changes** | API + `WalletService` Local-specific entry points |
| **Do-not-touch** | Production hold flags; tourism regression tests must pass |
| **Validation** | Eligibility scripts; staging pilot (Local-specific runbook) |
| **Risk / sign-off** | **Finance mandatory** |

### 5. `VIONA.LOCAL.WALLET_HOLD_POLICY.1`

| Field | Value |
|-------|--------|
| **Target files** | `src/config/localSettlementMode.ts` (or unified policy), bridge Firebase vs Prisma **or** deprecate VIP Firebase debit |
| **Allowed changes** | Single consumer spendable SoT; hold/release |
| **Do-not-touch** | Classifieds VIP commit until policy approved |
| **Validation** | Reconciliation scripts; dual-ledger test cases |
| **Risk / sign-off** | **P0** — blocks VIP commercialization |

### 6. `VIONA.LOCAL.UI_STATE_TRUTH.1`

| Field | Value |
|-------|--------|
| **Target files** | `LocalScreen`, `MerchantDashboardScreen`, `InboundQueueScreen`, fixer screens, `en.json` / `vi.json` local keys |
| **Allowed changes** | UI reads inbox API; badges; remove mock confirm **or** gate as demo-only |
| **Do-not-touch** | Broad nav redesign |
| **Validation** | UI display tests; copy safety checklist |
| **Risk / sign-off** | Product / Safety |

---

## Prior audit drift note

[VIONA_TRAVEL_LOCAL_BACKEND_SOURCE_OF_TRUTH_AUDIT_1.md](./VIONA_TRAVEL_LOCAL_BACKEND_SOURCE_OF_TRUTH_AUDIT_1.md) (base `8f21ee9`) listed missing tourism merchant inbox and hold — **superseded on master `2e6c624` for Tourism only.** This document is the **Local-focused** audit; re-use tourism docs for staging pilot, not for Local commercial enablement.

---

## Sign-off record (template)

| Role | Name | Date | Notes |
|------|------|------|-------|
| Audit author (Engineering) | | | |
| Finance / Ledger | | | |
| Product / Safety | | | |
| Operations | | | |

---

*End of audit.*
