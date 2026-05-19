# VIONA.WALLET.LEDGER_SOURCE_OF_TRUTH_AUDIT.1

**Document ID:** `VIONA.WALLET.LEDGER_SOURCE_OF_TRUTH_AUDIT.1`  
**Type:** Read-only wallet / VIO Credits / ledger source-of-truth audit (report only)  
**Branch:** `pack-af54-wallet-ledger-source-of-truth-audit`  
**Base master:** `5775b1a` — `feat(local): merge service request schema`  
**Date:** 2026-05-19  

**Governing law:** [VIONA Operating Protocol](../ai-context/VIONA_OPERATING_PROTOCOL.md), [Local Merchant Request Source of Truth Audit](./VIONA_LOCAL_MERCHANT_REQUEST_SOURCE_OF_TRUTH_AUDIT_1.md), [Local Request Schema Design](../architecture/VIONA_LOCAL_REQUEST_SCHEMA_DESIGN_1.md), [Local Merchant ACK State Machine Design](../architecture/VIONA_LOCAL_MERCHANT_ACK_STATE_MACHINE_DESIGN_1.md), [Travel/Local Backend Source of Truth Audit](./VIONA_TRAVEL_LOCAL_BACKEND_SOURCE_OF_TRUTH_AUDIT_1.md) (partially superseded for Tourism hold/inbox), [D8 Runtime Sensitive Money Paths](../D8_RUNTIME_SENSITIVE_MONEY_PATHS.md).

**Scope:** Every path that displays, debits, locks, releases, credits, or audits **VIO Credits** / internal **VIG** balances — Prisma `Wallet` + `Transaction`, Firebase `walletOps`, AsyncStorage cache, Stripe/payments microservice, tourism hold/settle, classifieds VIP, legal scan, legacy `Booking`, B2B surfaces, broker escrow, demo/mock copy. **Out of scope for behavior change in this pack:** runtime code, schema, migrations, APIs, UI.

**Prisma naming note:** Ledger rows use model **`Transaction`** (not `WalletTransaction`). Amount fields use `*VIG` in schema; public UX uses **VIO Credits** via `vioDisplayConfig` / `currency.ts`.

---

## Summary

| Item | Result |
|------|--------|
| **Current wallet readiness** | **Not safe for unified commercial spendable balance.** Tourism has a **mature Prisma hold/confirm/cancel path** when `TOURISM_SETTLEMENT_MODE=hold` is explicitly set; **default env still settles on book** (`legacy_settle_on_book`). B2C consumer burns (classifieds VIP, interpreter, Leona/LeTan, HocTap, cosmetics) use **Firebase `walletOps`**. Legal scan and tourism checkout use **Prisma**. Same user can see **different balances** on Home (REST overlay) vs Local (Firebase sync). |
| **Primary source-of-truth risks** | (1) **Dual spendable ledgers** — Firestore `wallets/{firebaseUid}.credits` vs Prisma `Wallet.balanceVIG` with no automatic sync. (2) **Top-up contract drift** — client sends `{ op: 'topup', amount, paymentEventId }`; deployed `walletOps` requires `{ packId, idempotencyKey }` and credits from `PACK_TRUTH_TABLE`. (3) **Third credit rail** — Stripe webhook can credit **Prisma** while Platform Pay top-up credits **Firebase**. (4) **P2P triplication** — Prisma `transferVIG`, Supabase `user_wallets` RPC, and client call to non-existent `walletOps` `p2pTransfer`. (5) **Local commercial debit before request SoT** — VIP debits Firebase with no durable listing/request row. |
| **Can Local safely use wallet yet?** | **No** for hold/debit/settlement. Schema `LocalServiceRequest` exists on master with safe defaults (`REQUEST_ONLY_NO_CHARGE`, `walletPhase = NONE`), but **DB migration not applied** on reachable dev/staging, **no request-create API**, **no merchant ACK API**, and **wallet SoT not unified**. Classifieds VIP must remain **isolated** from Local booking escrow semantics. |

---

## Wallet source inventory

| Source | Technology | Key files | Flows using it | Commercial risk |
|--------|------------|-----------|----------------|-----------------|
| **Prisma `Wallet`** | Postgres | `prisma/schema.prisma`, `src/services/WalletService.ts`, `src/controllers/WalletController.ts`, `src/routes/walletRoutes.ts` | Tourism book/confirm/cancel/complete/ops-cancel; legacy `Booking` lock; legal scan; REST balance; P2P transfer; AI gateway debit; Stripe webhook credit; QR merchant settlement; broker treasury locks | **P0** when same user also has Firebase credits |
| **Prisma `Transaction`** | Postgres | `WalletService.ts`, `TxType` enum | Audit lines per debit/credit/lock/release (`BOOKING`, `BOOKING_LOCK`, `PLATFORM_FEE`, `ESCROW_REFUND`, `AI_LEGAL_SCAN`, `P2P`, top-up, etc.) | **P1** — authoritative only for Prisma-wallet flows |
| **Firebase `walletOps`** | Firestore + Cloud Function | `functions/src/index.ts`, `functions/src/walletAuth.ts`, `functions/src/payments/paymentReceiptModel.ts`, `src/state/wallet.ts`, `src/services/walletFirebaseSession.ts` | B2C display balance; classifieds VIP; reserve/commit/rollback; trusted service (Leona/LeTan); interpreter/HocTap burns; wallet cosmetics; top-up grant path | **P0** — parallel spendable SoT |
| **Firestore subcollections** | Firebase | `verifiedTopups`, `verifiedCharges`, `trustedServiceCharges`, `holds`, `transactions` under wallet doc | Idempotent top-up/charge/hold audit | **P1** — not mirrored in Prisma |
| **AsyncStorage `STORAGE_KEYS.wallet`** | Device cache | `src/storage/storageKeys.ts`, `src/state/wallet.ts` | Hydrate wallet chip on launch; stale if sync fails | **P2** display-only drift |
| **REST wallet overlay** | Prisma via API | `src/services/viGlobalWalletApi.ts`, `applyRestApiVigBalance` in `wallet.ts` | Home `fetchBalance()` overwrites `credits` field with Prisma balance while other tabs use Firebase | **P0** session split-brain |
| **`sourceOfTruth.ts` doc** | Comment map | `src/storage/sourceOfTruth.ts` | States wallet authoritative = **Firebase only** — **omits** Prisma tourism/legal/REST | **P2** misleads refactors |
| **Stripe → Prisma** | Webhook | `src/services/api/StripeWebhookService.ts`, `creditWalletFromStripePaymentSucceeded` | Server-only credit after `payment_intent.succeeded` | **P1** third rail vs Firebase top-up |
| **Payments microservice** | External HTTP | `src/services/PaymentsService.ts`, `WalletTopUpScreen.tsx` | Platform Pay intent + verify before `topupCreditsServer` | **P1** receipt/idempotency coupling |
| **Supabase `user_wallets` P2P** | Supabase SQL | `supabase/migrations/20260430_add_wallet_p2p_transfer.sql`, `src/services/fintech/WalletService.ts` | Phone-based P2P fallback when `walletOps` op missing | **P0** if still reachable in prod |
| **KNG Rewards / loyalty** | AsyncStorage | `src/state/kngLoyaltyStore.ts`, `src/services/loyalty/LoyaltyService.ts` | Separate “VIG Tokens” — **not** spendable wallet | **P2** naming confusion |
| **Broker escrow** | Prisma `BrokerEscrow*` | `src/services/api/brokerEmpireEscrow.ts` | B2B treasury lock/release | **P2** B2B-only |
| **B2B `paidAdCredits`** | Business field | `src/services/b2b/AdBiddingService.ts` | Ad bidding — not consumer `Wallet` | **P2** |
| **Demo / mock** | In-memory / intercept | `src/services/ux/DemoSandbox.ts`, `CashOutScreen.tsx`, `WalletB2BScreen.tsx`, `tourismSettlementMode` `preview_only` | Fake balance 12_840; mock Xu cash-out; B2B Stripe tiers demo | **P1** copy/UX if demo flags leak to pilot |
| **`LocalServiceRequest` (schema only)** | Postgres (when migrated) | `prisma/schema.prisma`, migration `20260520120000_add_local_service_request` | **No runtime writer yet** — amount fields `*VioCredits` (`Float?`), defaults block hold | **P3** until APIs + migration applied |

---

## Flow inventory

| Flow | User action | Source-of-truth | Debit / lock / release / settle | Ledger row created? | Provider / treasury effect | Risk |
|------|-------------|-----------------|----------------------------------|---------------------|---------------------------|------|
| **Wallet display (most B2C)** | Open Home / Local / wallet screens | Firebase `walletOps` `get` + AsyncStorage | None | Firestore reads only | None | **P1** |
| **Home balance refresh** | Home focus / pull | Prisma REST `GET /api/wallet/balance` → `applyRestApiVigBalance` | Overlays `credits` in same Zustand store | Prisma read only | None | **P0** dual display |
| **Tourism book (default env)** | Tourism checkout submit | Prisma `Wallet` | **Immediate debit** tourist; credit provider + treasury at book | `Transaction` `BOOKING`, `PLATFORM_FEE` | Provider paid while `PENDING` | **P0** until hold mode default changes |
| **Tourism book (`TOURISM_SETTLEMENT_MODE=hold`)** | Submit request | Prisma | **Lock:** `balanceVIG↓`, `lockedBalanceVIG↑`, `BOOKING_LOCK` | Yes | None until confirm | **P1** (correct when env on) |
| **Tourism merchant confirm** | Inbox confirm | Prisma | Release lock; settle provider/treasury | `BOOKING` + `PLATFORM_FEE` | Provider + platform fee | **P1** |
| **Tourism cancel (held)** | User/merchant cancel | Prisma | Lock → spendable, `ESCROW_REFUND` | Yes | None | **P1** |
| **Tourism ops-cancel** | Ops role cancel | Prisma | Policy-driven release (held path) | Yes | Per policy | **P1** |
| **Tourism complete** | Merchant complete | Prisma | Status/metadata; blocks if hold unsettled | Usually no new wallet move if already settled | N/A | **P2** |
| **Tourism `preview_only`** | Demo checkout | Prisma row only | **No wallet mutation** | No | None | **P2** if used in prod |
| **Tourism timeout job** | Cron dry-run | Prisma read | **Dry-run only** (`scripts/jobs/release-tourism-held-timeouts.ts`) | No release yet | None | **P2** |
| **Classifieds VIP** | VIP post on `LocalScreen` | Firebase | `reserve` + `commit` = immediate debit | Firestore `holds` / commit | None; **no listing SoT** | **P1** |
| **Classifieds normal post** | Post listing | React state | None | None | None | Low |
| **Legal scan** | AI Trạng Sư scan | Prisma | Spendable debit | `AI_LEGAL_SCAN` | Platform (AI cost) | **P1** (Prisma while VIP uses Firebase) |
| **Demo lawyer booking** | Local critical → book | Prisma `Booking` | **Lock** `BOOKING_LOCK` when price > 0 | Yes | Merchant via QR complete path | **P2** |
| **Legacy booking cancel** | API cancel | Prisma | 80/20 release split | `ESCROW_REFUND` / penalty txs | Partial refund rules | **P2** (no Local UI) |
| **Local Fixer checkout** | “Thuê” / payment title | Static math only | **None** | None | None | **P2** misleading “Thanh toán” |
| **Leona / LeTan call** | Start charged call | Firebase `chargeTrustedService` | Direct debit | `trustedServiceCharges` | N/A | **P2** |
| **Interpreter / HocTap / voice** | Unlock / usage | Firebase `reserveAndCommitCredits` | Debit via hold pipeline | Firestore holds | N/A | **P2** |
| **Wallet top-up (client)** | Platform Pay → verify | Firebase (intended) | Credit increment | `verifiedTopups` | User balance ↑ | **P0** API mismatch risk |
| **Stripe webhook top-up** | Card success (server) | Prisma | `balanceVIG` credit | `Transaction` TOPUP + idempotency table | User balance ↑ (Prisma) | **P1** dual credit rails |
| **P2P transfer (REST)** | Send to user | Prisma | Atomic dual-wallet update | Two `Transaction` rows | Peer credit | **P1** |
| **P2P (fintech client)** | Send by phone | Firebase op **missing** → Supabase fallback | Varies | Supabase / none | **P0** |
| **QR merchant VIG** | Scan pay merchant | Prisma | Debit/credit split | Yes | Merchant | **P2** |
| **Broker Empire escrow** | B2B deal flow | Prisma escrow + treasury wallet | Lock until clearance | Escrow + wallet txs | Treasury | **P2** |
| **B2B Wallet screen** | View tiers / Connect | Mock Stripe UI | None (not VIG wallet) | None | None | Low (if labeled demo) |
| **Cash-out screen** | “Quy đổi tiền mặt” | Mock constants + `triggerMockBankPayoutApi` | N/A | None | Implies fiat withdraw | **P1** vs `VigTokenService` policy |
| **Demo sandbox** | Demo mode on | Mock REST balance 12_840 | N/A | None | None | **P2** |
| **LifeOS marketplace auto-book** | Gated CTA | AsyncStorage mock `confirmed` | Local fee tracking | None | Fake ACK | **P1** if flag on |
| **`LocalServiceRequest` (future)** | (not implemented) | Postgres (designed) | Default **no charge** | Future `Transaction` link TBD | TBD | Blocked |

---

## Firebase vs Prisma risk

### Where Firebase `walletOps` is used

- **Authoritative for B2C spendable display:** `useWalletState()` → `syncWalletFromServer()` → `POST …/walletOps` `{ op: 'get' }`.
- **Debits:** `charge`, `chargeTrustedService`, `reserve` / `commit` / `rollback` (VIP, interpreter, cosmetics, etc.).
- **Credits:** `topup` (pack-id + idempotency-key contract on server).
- **Security:** Firebase ID token (+ optional App Check); wallet doc keyed by Firebase `uid` — **not** automatically the same id as Prisma `User.id` unless account linking is guaranteed.

### Where Prisma `Wallet` is used

- **Server JWT flows:** `GET /api/wallet/balance`, `POST /api/wallet/transfer`.
- **Tourism commercial path:** checkout, hold, confirm, cancel, ops-cancel, complete (`WalletService.ts`).
- **Legacy `Booking`:** lock on create, cancel release, QR complete settlement.
- **Legal scan:** `AIController` → `debitSpendableVigForAiGateway`.
- **Stripe webhook:** `creditWalletFromStripePaymentSucceeded`.
- **AI gateway / QR merchant / broker** paths in `WalletService.ts`.

### Can balances diverge?

**Yes.** There is **no** reconciliation job or single write-through bridge between Firestore `credits` and Prisma `balanceVIG`. A user who tops up via Firebase and books tourism via Prisma (or vice versa) can have **different spendable amounts** on different screens.

### Can both affect user-visible spendable balance?

**Yes.**

- **Firebase path:** Local, Leona, HocTap, VIP, global wallet screens (`syncWalletFromServer`).
- **Prisma overlay:** `HomeScreen` may call `fetchBalance()` and `applyRestApiVigBalance`, writing Prisma balance into the **same** `credits` field used for Firebase display — last writer wins per session, not a merge.

### Can Firebase VIP be mistaken for escrow / booking hold?

**Yes — product risk, not technical equivalence.**

- VIP uses **immediate commit** on Firebase credits (one-phase burn), with **no** `LocalServiceRequest` / `Booking` row and **no** merchant ACK.
- Tourism **hold** uses Prisma `lockedBalanceVIG` + merchant confirm + cancel release — true two-phase commercial pattern.
- Marketing copy on Local must **not** describe VIP as “held until merchant accepts” or escrow. Schema design explicitly isolates classifieds VIP from `LocalServiceRequest`.

### Top-up contract mismatch (concrete)

| Layer | Payload |
|-------|---------|
| Client `topupCreditsServer` | `{ op: 'topup', amount, paymentEventId }` |
| `walletOps` handler | Requires `packId`, `idempotencyKey`; credits from `PACK_TRUTH_TABLE[packId]`; receipt gate may use `idempotencyKey` as receipt doc key |

Ops/docs (`functions/RECEIPT_TRUTH.md`, `functions/WALLET_MIGRATION.md`) discuss `paymentEventId`; implementation and client are **not aligned**. Risk: silent top-up failure, wrong pack credit, or operators assuming amount-driven grants.

### Documentation drift

- `sourceOfTruth.ts` and `D8_RUNTIME_SENSITIVE_MONEY_PATHS.md` label **`walletOps` as ledger authoritative** for client wallet — **incomplete** vs Prisma tourism/legal/REST paths added since D8.

---

## Tourism as reference path

### Why Tourism hold is the safer commercial pattern (when enabled)

| Property | Tourism hold mode (`TOURISM_SETTLEMENT_MODE=hold`) |
|----------|-----------------------------------------------------|
| Settlement mode | Explicit env opt-in — default remains `legacy_settle_on_book` |
| Submit behavior | **Lock** spendable → `lockedBalanceVIG`, `BOOKING_LOCK` tx |
| Merchant ACK | `confirmTourismHeldBookingAsMerchant` — release lock, pay provider/treasury |
| Cancel / release | `cancelTourismHeldBooking`, ops-cancel, eligibility scripts |
| Audit | Prisma `Transaction` rows with typed `TxType` |
| Inbox | `GET /api/tourism/bookings/merchant`, merchant UI on master |
| Timeout | Dry-run job classifies eligibility — release implementation gated |
| Preview | `preview_only` mode creates row **without** ledger mutation |

### Why Tourism does **not** automatically solve Local

| Gap | Reason |
|-----|--------|
| Different table | `LocalServiceRequest` ≠ `TourismBooking` — separate routes and policies |
| Different universe | Local includes classifieds, fixer, services — not tourism catalog |
| Wallet SoT split | Local VIP already burns **Firebase**; tourism uses **Prisma** |
| Default tourism env | **Legacy settle on book** still immediate debit — Local must not copy legacy by default |
| No Local APIs | Request create, merchant inbox, confirm/reject/cancel **not shipped** |
| Classifieds isolation | VIP must **not** map to `LocalServiceRequest` or hold semantics |
| Migration gate | `20260520120000_add_local_service_request` **not applied** on reachable DB |

**Use Tourism as a pattern library for `VIONA.LOCAL.WALLET_HOLD_POLICY.1` — not as a drop-in ledger.**

---

## Local wallet gate

Local wallet **hold / debit / settle** remains **blocked** until **all** of the following:

| Gate | Status @ `5775b1a` |
|------|-------------------|
| `LocalServiceRequest` migration applied on dev/staging | **Blocked** — `prisma migrate deploy` failed (Supabase tenant unreachable) |
| Request create SoT API (`VIONA.LOCAL.REQUEST_CREATE_SOURCE_OF_TRUTH.1`) | **Not implemented** |
| Merchant ACK API (inbox + confirm/reject/cancel) | **Not implemented** |
| Cancel / release policy aligned with state machine design | **Not implemented** |
| Wallet SoT = **Prisma-only** for Local commercial flows **or** approved compatibility layer with reconciliation | **Not met** — Firebase VIP still active |
| Finance sign-off for any `HOLD_ON_SUBMIT` / `SETTLE_ON_CONFIRM` on Local rows | **Required** — schema allows enums; defaults forbid hold |
| Public copy audit for hold/refund/escrow claims | **Recommended** before pilot |

**Allowed now:** schema-only defaults (`REQUEST_ONLY_NO_CHARGE`, `walletPhase = NONE`), docs, eligibility scripts, tourism regression unchanged.

**Forbidden now:** enabling `LocalWalletMode.HOLD_ON_SUBMIT` in production config, wiring Local UI to debit, implying escrow or withdrawable value, bridging Classifieds VIP to `LocalServiceRequest`.

---

## Public copy / naming risks

| Risk | Evidence | Mitigation pack |
|------|----------|-----------------|
| **VIG (code/API) vs VIO Credits (UI)** | Prisma fields `balanceVIG`; controllers say “Insufficient VIG”; i18n / `vioDisplayConfig.publicCreditName` = “VIO Credits” | `VIONA.WALLET.PUBLIC_COPY_LEDGER_TERMS_AUDIT.1` |
| **KNG / legacy product names** | Routes/comments “KNG Travel”, `LoyaltyService` “KNG Rewards” | Copy + IA sweep |
| **Cash-out / withdraw** | `CashOutScreen`, merchant “cash out to bank”, referral cash-out nav vs `VigTokenService.assertVigFiatWithdrawalForbidden` | Policy enforcement at routes + copy |
| **Escrow overclaim** | Internal `TxType.ESCROW_*`; `bookingEscrowUi` uses “acknowledgement” (good); tourism i18n “held” when hold mode on | Tie copy to **actual** `walletMode` / env |
| **Refund overclaim** | Tourism cancel releases **held** funds; legacy booking cancel 80/20; **no** tourism refund in legacy settle mode | Per-flow footnotes |
| **Provider-paid overclaim** | Legacy tourism settles provider at book while `PENDING` | Hold mode + inbox copy |
| **“Thanh toán” without charge** | `LocalFixerCheckoutScreen` title | Rename to preview/request |
| **VIP success implies marketplace** | Alert after device-only post | Listing SoT pack (non-wallet) |

**Policy anchor:** `src/core/monetization/vioDisplayConfig.ts` — `isWithdrawableCash: false`, `legacyCode: 'VIG'`.

---

## Recommended wallet SoT direction

**Recommendation: Prisma `Wallet` + `Transaction` as the single commercial spendable ledger for B2C/B2B commercial flows that imply merchant settlement, hold, or refund — with Firebase `walletOps` relegated to an explicit legacy/isolation boundary until migrated.**

| Option | Verdict |
|--------|---------|
| **A. Prisma canonical** | **Preferred** for Tourism (done), Local requests (future), legal scan, legacy booking, Stripe webhook alignment, REST balance |
| **B. Firebase isolated** | **Interim only** for non-commercial burns (pilot micro-charges) **if** labeled non-settlement and **cannot** be shown as the same balance used for tourism/local hold |
| **C. Compatibility layer** | **Required short-term** if Firebase cannot be turned off immediately: uid↔userId map, single balance read API, dual-write or one-way sync with reconciliation alerts — **must be designed before Local hold** |

**Do not** implement Local commercial debit on Firebase while Prisma holds tourism funds for the same persona without finance-approved partition (separate wallets or explicit sub-accounts).

**Classifieds VIP:** keep on Firebase **or** migrate with `VIONA.WALLET.FIREBASE_VIP_ISOLATION_POLICY.1` — never alias as Local escrow.

---

## Recommended implementation sequence

| Order | Pack | Purpose | Allowed files (typical) | Do-not-touch | Validation | Sign-off gate |
|-------|------|---------|-------------------------|--------------|------------|---------------|
| 0 | **DB: apply Local migration** | Deploy `20260520120000_add_local_service_request` | Ops env only | Production | `prisma migrate deploy`, `migrate status` | Dev/staging DBA |
| 1 | `VIONA.WALLET.PUBLIC_COPY_LEDGER_TERMS_AUDIT.1` | Align VIO Credits / hold / refund / no-cash-out copy with actual ledger behavior | `src/i18n/**`, copy modules, footnotes | Wallet math, APIs | typecheck, lint, copy scripts if any | CPO + Trust |
| 2 | `VIONA.WALLET.FIREBASE_VIP_ISOLATION_POLICY.1` | Document and enforce VIP vs Local vs tourism ledger boundaries; rollback story | Docs, feature flags, `LocalScreen` guards | Tourism hold logic | schema defaults test, manual QA | Payments owner |
| 3 | `VIONA.LOCAL.REQUEST_CREATE_SOURCE_OF_TRUTH.1` | Durable Local request rows; **no** hold by default | Local API service, controller, routes | `WalletService` hold paths, Firebase VIP | typecheck, tourism regression, new Local create tests | Architect |
| 4 | `VIONA.LOCAL.MERCHANT_INBOX_API.1` | Merchant list/filter requests | Tourism inbox patterns as reference | Wallet debit | inbox API tests | Mini-app owner |
| 5 | `VIONA.LOCAL.CONFIRM_REJECT_CANCEL_API.1` | ACK transitions without wallet settle unless policy allows | State machine + eligibility modules | Hold enablement | state machine scripts | Ops + Trust |
| 6 | `VIONA.LOCAL.WALLET_HOLD_POLICY.1` | Hold/settle/release for Local **only** after unified SoT | `WalletService.ts` (Local-specific), Local services | Classifieds VIP, Firebase bridge without design | finance reconciliation scripts | **Finance sign-off** |
| — | Top-up contract fix (behavior) | Align client `topupCreditsServer` with `packId` + `idempotencyKey` | `wallet.ts`, `WalletTopUpScreen`, `walletOps` docs | Tourism ledger | wallet smoke, receipt strictness scripts | Payments owner |
| — | Balance read unification (behavior) | Single session SoT for Home + Local | `wallet.ts`, `viGlobalWalletApi`, `sourceOfTruth.ts` | Prisma schema | dual-balance QA | Architect |

---

## Blockers

| Blocker | Detail |
|---------|--------|
| Dev/staging DB migration | `20260520120000_add_local_service_request` not applied — Supabase `ENOTFOUND` on last apply attempt |
| Dual ledger | Firebase + Prisma both spendable for same persona |
| Top-up contract | Client/server field mismatch |
| Local runtime | No request create / merchant inbox / confirm APIs |
| Local wallet | Hold/debit blocked by policy + gates above |
| Production Local commercial pilot | **Blocked** |
| Tourism production hold | Still requires explicit `TOURISM_SETTLEMENT_MODE=hold` + staging sign-off (separate from Local) |

---

## Cross-reference index

| Doc | Relevance |
|-----|-----------|
| `VIONA_LOCAL_MERCHANT_REQUEST_SOURCE_OF_TRUTH_AUDIT_1.md` | Local flows, mock ACK, VIP vs Prisma booking |
| `VIONA_LOCAL_REQUEST_SCHEMA_DESIGN_1.md` | `LocalServiceRequest` wallet defaults |
| `VIONA_LOCAL_MERCHANT_ACK_STATE_MACHINE_DESIGN_1.md` | Transitions before wallet settle |
| `VIONA_TRAVEL_LOCAL_BACKEND_SOURCE_OF_TRUTH_AUDIT_1.md` | Pre-hold tourism findings (partially superseded) |
| `VIONA_TOURISM_WALLET_HOLD_IMPLEMENTATION_PREP_1.md` | Tourism hold implementation prep |
| `functions/WALLET_MIGRATION.md`, `functions/RECEIPT_TRUTH.md` | Firebase wallet contracts |

---

## Audit completion checklist (this pack)

- [x] Inventory Prisma, Firebase, AsyncStorage, mock paths  
- [x] Flow table includes tourism, VIP, fixer, lawyer demo, legal scan, B2B, top-up, display  
- [x] Firebase vs Prisma divergence documented  
- [x] Tourism reference vs Local gate documented  
- [x] Public copy risks listed  
- [x] Recommended SoT direction and pack sequence  
- [x] No runtime/schema/API/UI changes in this branch  
