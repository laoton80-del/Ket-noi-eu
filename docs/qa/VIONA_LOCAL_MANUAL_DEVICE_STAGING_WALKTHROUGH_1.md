# VIONA Local manual device + staging walkthrough — 1

**Pack:** `VIONA.LOCAL.MANUAL_DEVICE_STAGING_WALKTHROUGH.1`  
**Branch:** `pack-local-manual-device-staging-walkthrough-1`  
**Master baseline:** `f3aab1b` (`docs(runbook): merge local staging database verification`)  
**Date:** 2026-05-20  
**Type:** Manual QA checklist + execution log (no product, schema, or wallet changes)

## Summary

Operator checklist to validate **Local request-only / no-charge** pilot flows on **real device or staging web** in EN and VI, after automated certification:

- `docs/qa/VIONA_LOCAL_NO_CHARGE_E2E_QA_1.md`
- `docs/runbooks/VIONA_LOCAL_STAGING_DB_MIGRATION_VERIFICATION_1.md`

This document does **not** certify staging by itself. Record evidence in the tables below (screenshot ref, date, tester initials). Do not paste passwords, tokens, or connection strings.

**Automated preflight (pack author, 2026-05-20):** `check-local-staging-readiness`, Local E2E runner, and safe i18n guard passed on configured dev DB. **No physical device or staging build was exercised in the pack that authored this checklist.**

## Verdict

| Verdict | When to use |
|---------|-------------|
| **PASS** | All required rows below marked PASS with evidence; staging API + accounts confirmed |
| **PASS_WITH_LIMITATIONS** | Checklist published but device/staging not fully executed, or known VI badge limitation only |
| **BLOCKED** | Cannot reach staging API, missing `EXPO_PUBLIC_REST_API_BASE`, or auth blocked |

**Current verdict (checklist publication):** **PASS_WITH_LIMITATIONS**

| Field | Value |
|-------|--------|
| Verdict | PASS_WITH_LIMITATIONS |
| Reason | Manual device/staging execution pending operator |
| Tester | _fill on completion_ |
| Test date | _fill on completion_ |

## Scope

**In scope:** Local hub → My requests; merchant dashboard → Local request inbox; EN/VI banners; cancel/confirm/reject dialogs; ownership isolation; negative copy scan.

**Out of scope:** Wallet hold/settle, Tourism hold inbox, Firebase VIP, Home/logo polish, load testing, ops UI unless separately available.

## Core law (must hold during walkthrough)

- `walletMode`: `REQUEST_ONLY_NO_CHARGE`
- `walletPhase`: `NONE`
- No wallet hold, debit, release, refund, settlement, provider payout, platform fee
- No Firebase VIP bridge; no `Booking` / `TourismBooking` bridge from Local UI actions
- Merchant confirm/reject = status only; **not** payment capture

## References

| Doc / surface | Path / route |
|---------------|--------------|
| E2E certification | `docs/qa/VIONA_LOCAL_NO_CHARGE_E2E_QA_1.md` |
| Staging DB verification | `docs/runbooks/VIONA_LOCAL_STAGING_DB_MIGRATION_VERIFICATION_1.md` |
| Local hub | `LocalScreen` → tile `local.userRequestStatus.localTileTitle` |
| User requests | Route `LocalUserRequestStatus` — `GET /api/local/requests`, cancel, timeline |
| Merchant inbox | Route `LocalMerchantRequestInbox` — `GET/POST` merchant requests |
| Readiness probe | `npx tsx scripts/check-local-staging-readiness.ts` |

---

## 1. Environment checklist

| # | Check | Expected | Result | Evidence |
|---|--------|----------|--------|----------|
| E1 | Git `master` hash | `f3aab1b` or later merge of this pack | NOT RUN | |
| E2 | Branch under test | Staging build from `master` after Local packs | NOT RUN | |
| E3 | `EXPO_PUBLIC_REST_API_BASE` set on **device/staging build** | Points to **staging** API host (not accidental localhost unless intended) | NOT RUN | |
| E4 | App REST calls hit staging | Network tab / server logs show staging host | NOT RUN | |
| E5 | Staging Supabase project name (manual) | Operator records project label only | NOT RUN | _name only_ |
| E6 | `npx tsx scripts/check-local-staging-readiness.ts` on operator machine | `DATABASE_URL` set; note missing keys by name | NOT RUN | |
| E7 | No secrets in this doc or screenshots | Names only | NOT RUN | |

**Warning:** Do not run `prisma migrate deploy` on production/staging without explicit operator confirmation (`VIONA_LOCAL_STAGING_DB_MIGRATION_VERIFICATION_1.md`).

---

## 2. Account checklist

Use dedicated pilot accounts. **Do not record passwords or JWTs here.**

| Role | Account label (email or id) | Business linked | Result | Notes |
|------|------------------------------|-----------------|--------|-------|
| User A (requester) | | | NOT RUN | |
| User B (other requester) | | | NOT RUN | Cross-account test |
| Merchant M (owner) | | Business id: ___ | NOT RUN | Must own inbox scope |
| Merchant N (unrelated) | | | NOT RUN | Negative scope |
| Ops / super-admin | | | NOT RUN | Ops audit API only if tooling exists |

| # | Check | Result |
|---|--------|--------|
| A1 | User A can log in on device | NOT RUN |
| A2 | Merchant M owns the business used for test requests | NOT RUN |
| A3 | Merchant M dashboard shows Local inbox promo link | NOT RUN |

**Creating test data:** Consumer create UI may be limited; if no in-app create path, seed via `POST /api/local/requests` (authenticated as User A) per E2E scripts or ops seed — record method in notes.

---

## 3. Device / browser matrix

Mark **PASS**, **FAIL**, or **NOT RUN**. Record device model or browser + OS.

| Viewport | Target | Actual device / browser | Result | Notes |
|----------|--------|-------------------------|--------|-------|
| Mobile | 390×844 | | NOT RUN | |
| Tablet portrait | 768×1024 | | NOT RUN | |
| Tablet landscape | 1024×768 | | NOT RUN | |
| Desktop / web | 1366×768 | | NOT RUN | |

| # | Check | Result |
|---|--------|--------|
| D1 | Safe areas / scroll on user list | NOT RUN |
| D2 | Safe areas / scroll on merchant inbox | NOT RUN |
| D3 | Dialogs readable on smallest tested viewport | NOT RUN |

---

## 4. User walkthrough checklist

**Entry:** Log in as User A → **Local** tab (`LocalScreen`) → **My requests** tile → `LocalUserRequestStatus`.

| # | Step | Expected UI / API | Result | Evidence |
|---|------|-------------------|--------|----------|
| U1 | Open Local hub | “My requests” tile visible with no-charge subtitle | NOT RUN | |
| U2 | Open My requests | Title `local.userRequestStatus.title`; safety banner visible | NOT RUN | |
| U3 | List loads | Real rows from `GET /api/local/requests` (not hardcoded demo) | NOT RUN | |
| U4 | Safety banner EN | Contains: request-only / no-charge; no payment captured; not a paid booking; payment not enabled for Local flow | NOT RUN | |
| U5 | Status badge | Matches server status (e.g. Request submitted, Waiting for merchant review) | NOT RUN | |
| U6 | Wallet badge on row | **No payment has been captured** · **Request-only / no-charge** · **walletPhase NONE** | NOT RUN | |
| U7 | Filter chips | all / pending / confirmed / active / completed / closed filter list | NOT RUN | |
| U8 | Pending note | “Waiting for merchant review” when REQUESTED or MERCHANT_REVIEW | NOT RUN | |
| U9 | View timeline | Expand timeline; entries load from API | NOT RUN | |
| U10 | Cancel open request | Cancel visible only for REQUESTED / MERCHANT_REVIEW | NOT RUN | |
| U11 | Cancel dialog copy | No payment captured; payment not enabled; no wallet action implied | NOT RUN | |
| U12 | After cancel | Status USER_CANCELLED; cancel hidden | NOT RUN | |
| U13 | Confirmed row | Note: “Confirmed does not mean paid”; no cancel button | NOT RUN | |
| U14 | Rejected / expired row | “Merchant declined…” / “This request expired”; no cancel | NOT RUN | |
| U15 | Pull to refresh | List reloads without error | NOT RUN | |
| U16 | Missing API base | If `EXPO_PUBLIC_REST_API_BASE` unset: error state, not fake success | NOT RUN | |

---

## 5. Merchant walkthrough checklist

**Entry:** Log in as Merchant M → **Merchant Dashboard** → Local service request inbox → `LocalMerchantRequestInbox`.

| # | Step | Expected UI / API | Result | Evidence |
|---|------|-------------------|--------|----------|
| M1 | Dashboard link | `b2b.localInbox` title + request-only subtitle | NOT RUN | |
| M2 | Inbox loads | Rows from `GET /api/local/merchant/requests` for owned business only | NOT RUN | |
| M3 | Safety banner | Same no-charge framing as user screen (EN) | NOT RUN | |
| M4 | Confirm request | Button “Confirm request”; dialog: status only, no payment captured | NOT RUN | |
| M5 | After confirm | Status CONFIRMED; note “Confirmed does not mean paid”; confirm/reject disabled | NOT RUN | |
| M6 | Decline other request | Button “Decline request”; dialog: no payment / no wallet | NOT RUN | |
| M7 | After reject | Status REJECTED; actions disabled | NOT RUN | |
| M8 | Wallet badge on rows | No payment has been captured · request-only · walletPhase NONE | NOT RUN | |
| M9 | No settlement copy | No escrow, settlement, payout, provider paid, VIG as product term | NOT RUN | |
| M10 | Filter chips | Merchant filters work | NOT RUN | |
| M11 | Empty state | Copy when no requests | NOT RUN | |

---

## 6. Cross-account safety

| # | Check | Result | Evidence |
|---|--------|--------|----------|
| X1 | User B cannot see User A request ids in list/timeline | NOT RUN | |
| X2 | Merchant N does not see Merchant M scoped requests | NOT RUN | |
| X3 | Ops audit `GET /api/local/ops/requests/:id/audit-events` | NOT RUN / N/A | No dedicated ops UI on master — API-only |

---

## 7. EN / VI copy checklist

Switch app language (profile / settings) between English and Vietnamese.

| # | Check | EN | VI | Result | Notes |
|---|--------|----|----|--------|-------|
| L1 | User safety banner | PASS expected | PASS expected | NOT RUN | |
| L2 | Merchant safety banner | PASS expected | PASS expected | NOT RUN | |
| L3 | My requests tile subtitle | PASS expected | PASS expected | NOT RUN | |
| L4 | Confirm / decline dialog bodies | PASS expected | PASS expected | NOT RUN | |
| L5 | Cancel dialog body | PASS expected | PASS expected | NOT RUN | |
| L6 | **Status badge on card** | EN helper strings | May remain **EN** | NOT RUN | **Known limitation:** `local.*.statusCopy` in `vi.json` not wired to `t()`; badges use `localUserRequestStatusUi.ts` / `localMerchantInboxUi.ts` English literals |
| L7 | Wallet badge on card | EN literals | May remain EN | NOT RUN | Same limitation |

**VI limitation policy:** Not a blocker for pilot if banners/dialogs/tile are VI-correct; file follow-up pack to wire `statusCopy`.

---

## 8. Negative copy checklist (visible UI during walkthrough)

Confirm **none** of the following appear on Local user/merchant screens (except safe negations in §9).

| Forbidden term / phrase | User My requests | Merchant inbox | Result |
|-------------------------|------------------|----------------|--------|
| paid booking (without “not a”) | | | NOT RUN |
| escrow | | | NOT RUN |
| deposit | | | NOT RUN |
| refund / release | | | NOT RUN |
| payout | | | NOT RUN |
| settlement | | | NOT RUN |
| provider paid | | | NOT RUN |
| guaranteed booking / guaranteed lead | | | NOT RUN |
| dispatched / provider assigned | | | NOT RUN |
| VIG (public product term) | | | NOT RUN |
| cash-out / withdraw | | | NOT RUN |
| payment captured (without “no payment has been”) | | | NOT RUN |

### Safe negations (allowed)

- Confirmed does not mean paid
- not a paid booking / chưa phải đặt lịch đã thanh toán
- No payment has been captured / chưa thu khoản thanh toán nào
- Payment is not enabled for this Local request flow

---

## 9. Wallet / money safety checklist

| # | Check | Result |
|---|--------|--------|
| W1 | No VIO Credits deduct on create/confirm/reject/cancel | NOT RUN |
| W2 | No navigation to checkout / wallet hold from Local inbox flows | NOT RUN |
| W3 | No “merchant has been paid” or “funds held” messaging | NOT RUN |
| W4 | Confirmed status does not open payment sheet | NOT RUN |
| W5 | Firebase walletOps not triggered by Local actions | NOT RUN | Infer from absence of wallet UI + API law |

---

## 10. Known limitations

| Limitation | Impact |
|------------|--------|
| Manual staging/device not executed when checklist published | Verdict stays PASS_WITH_LIMITATIONS until operator completes tables |
| `EXPO_PUBLIC_REST_API_BASE` may be missing on dev machine | Device build must set staging API explicitly |
| VI status badges may show EN | Documented; banners/dialogs should still be VI |
| No consumer create UI guaranteed on Local hub | May need API/seed to create first request |
| Multi-instance rate limits not load-tested | E2E only |
| Wallet / commercial / Tourism hold not enabled | By design for Local pilot |
| Ops audit has API only | Cross-account ops UI not required for this walkthrough |
| `request-audit-runtime-2` intermittent in composed E2E | Retry once if automating preflight |

---

## 11. Operator actions required

1. Label staging Supabase project and confirm migrations applied (`VIONA_LOCAL_STAGING_DB_MIGRATION_VERIFICATION_1.md`).
2. Build or install app with **`EXPO_PUBLIC_REST_API_BASE`** = staging API URL.
3. Provision User A, User B, Merchant M, Merchant N (no secrets in this doc).
4. Create at least two requests (User A → Merchant M business) via available UI or `POST /api/local/requests`.
5. Execute §3–§9 tables; set verdict to **PASS** or **PASS_WITH_LIMITATIONS** with evidence.
6. Do **not** enable wallet hold, settlement, or Tourism bridge for Local pilot sign-off.

---

## 12. Execution log (automated preflight — pack author)

| Command | Result | Date |
|---------|--------|------|
| `npx tsx scripts/check-local-staging-readiness.ts` | PASS — `DATABASE_URL`/`DIRECT_URL` set; `EXPO_PUBLIC_REST_API_BASE` **missing** on author machine | 2026-05-20 |
| `npx tsx scripts/test-local-no-charge-e2e-qa.ts` | PASS (24+6) | 2026-05-20 |
| `npx tsx scripts/test-local-safe-i18n-copy-pass.ts` | PASS | 2026-05-20 |

---

## 13. Next recommendation

| Option | Action |
|--------|--------|
| **A** | Merge this checklist; operator completes staging/device pass |
| **B** | Wire VI `statusCopy` into runtime status badges |
| **C** | Local no-charge pilot readiness handoff (accounts + staging build + sign-off) |
| **D** | Stop/reassess if BLOCKED on env or API |

After operator PASS: proceed to **C**; if only VI badges lag, ship with **PASS_WITH_LIMITATIONS** and schedule **B**.
