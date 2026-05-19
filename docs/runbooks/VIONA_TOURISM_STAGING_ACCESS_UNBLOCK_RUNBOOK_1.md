# VIONA.TOURISM.STAGING_ACCESS_UNBLOCK_RUNBOOK.1

**Document ID:** `VIONA_TOURISM_STAGING_ACCESS_UNBLOCK_RUNBOOK_1`  
**Type:** Ops access / unblock checklist — docs-only; no runtime changes  
**Base master (authoring):** `ac7ec3f` — merge merchant booking inbox UI  

**Related:**

- [VIONA_OPERATING_PROTOCOL.md](../ai-context/VIONA_OPERATING_PROTOCOL.md)
- [VIONA_TOURISM_HOLD_PILOT_STAGING_RUNBOOK_1.md](./VIONA_TOURISM_HOLD_PILOT_STAGING_RUNBOOK_1.md)
- [VIONA_TOURISM_LEGACY_SETTLED_BACKFILL_RUNBOOK_1.md](./VIONA_TOURISM_LEGACY_SETTLED_BACKFILL_RUNBOOK_1.md)
- [VIONA_TOURISM_OPS_CANCEL_TIMEOUT_DESIGN_1.md](../architecture/VIONA_TOURISM_OPS_CANCEL_TIMEOUT_DESIGN_1.md)
- [VIONA_TOURISM_BOOKING_STATE_MACHINE_DESIGN_1.md](../architecture/VIONA_TOURISM_BOOKING_STATE_MACHINE_DESIGN_1.md)

**Scripts:** `scripts/backfills/backfill-tourism-settlement-metadata.ts`, `scripts/jobs/release-tourism-held-timeouts.ts`  
**Config:** `src/config/tourismSettlementMode.ts`

---

## Purpose

Unblock **live staging validation** for Tourism **hold-on-submit** mode by documenting exactly what credentials, environment variables, deploy targets, test users, JWTs, and database access must exist **before** [VIONA_TOURISM_HOLD_PILOT_STAGING_RUNBOOK_1](./VIONA_TOURISM_HOLD_PILOT_STAGING_RUNBOOK_1.md) can be executed.

This runbook does **not** execute the pilot. It is the **access gate** and handoff checklist for Engineering, Ops, and Finance.

**Core law (unchanged):**

- Money/ledger behavior must be **zero-loss**.
- Merchant UI must reflect backend truth (merchant inbox on `master` @ `ac7ec3f`).
- Do **not** fake confirmed booking, payment, or provider fulfillment.
- Do **not** enable production hold by default (`TOURISM_SETTLEMENT_MODE` unset → `legacy_settle_on_book`).

---

## Current blocker

As of authoring, the following block live staging pilot execution (`VIONA.TOURISM.HOLD_PILOT_STAGING_EXECUTION.1`):

| Blocker | Symptom | Impact |
|---------|---------|--------|
| Staging deploy target unavailable | No confirmed API revision serving `ac7ec3f` | Cannot call hold/confirm/cancel APIs |
| Staging `DATABASE_URL` unavailable or unreachable | `prisma migrate deploy` / backfill / dry-run fail (`ENOTFOUND`, auth errors) | Cannot migrate, backfill, or reconcile |
| Staging API base URL unavailable | App / curl cannot reach REST host | Cannot book, confirm, or cancel |
| Test merchant / tourist / admin JWTs unavailable | `401` on authenticated routes | Cannot run scenarios 1–5 |
| Pilot scenarios cannot be executed | No end-to-end evidence | Production hold remains blocked |
| **Production hold remains blocked** | By design until staging pass + sign-offs | Correct — do not bypass |

**Executor action:** Fill the tables below with real values in a **secure ticket** (1Password / vault). **Never** paste secrets or JWTs into this repo or chat logs.

---

## Required staging access

| Item | Required value | Owner | Status | Notes |
|------|----------------|-------|--------|-------|
| Staging API base URL | HTTPS origin for Express API (e.g. `https://staging-api.<domain>`) | Platform / DevOps | ☐ Blocked | Client: `EXPO_PUBLIC_REST_API_BASE` (app). Scripts/curl: same host + `/api/...` |
| Staging `DATABASE_URL` | PostgreSQL connection string for **staging only** | Platform / DBA | ☐ Blocked | Required for `prisma migrate deploy`, backfill, timeout dry-run. Use approved bastion/VPN if IP-restricted |
| Staging deploy pipeline / revision | Git SHA **`ac7ec3f`** or newer on `master` with tourism hold stack | Release train | ☐ Blocked | Confirm deploy manifest / container image digest matches merge commit |
| Staging env var control | Ability to set server env on staging workers | Platform / DevOps | ☐ Blocked | Must support `TOURISM_SETTLEMENT_MODE`, `VIGLOBAL_TREASURY_USER_ID`, `JWT_SECRET`, etc. |
| Staging logs access | API + worker logs (confirm/cancel errors, treasury misconfig) | Platform / SRE | ☐ Blocked | Needed for incident triage during pilot |
| Staging test tourist account | User id + login (OTP/email) with wallet `balanceVIG` ≥ 3× test booking + buffer | Product / QA | ☐ Blocked | Records: `touristUserId`, before/after wallet |
| Staging test merchant account | User id + login; owns tourism `Business` | Product / QA | ☐ Blocked | Records: `merchantUserId`, `businessId` |
| Staging test business owner JWT | Bearer token for merchant (`authMiddleware`) | Engineering / QA | ☐ Blocked | Issue via staging login; store in vault only |
| Staging test tourist JWT | Bearer token for tourist book/cancel | Engineering / QA | ☐ Blocked | For `POST /api/tourism/book`, tourist cancel scenario |
| Staging admin JWT (ops cancel) | Bearer token for `Role.ADMIN` / super-admin | Engineering / Security | ☐ Blocked | For `POST /api/tourism/bookings/:id/ops-cancel` (optional scenario 5 extension) |
| Test tourism product / business fixture | Active `TourismService` on merchant business; discover + quote + book | Product / QA | ☐ Blocked | Record `serviceId`, quoted `totalPaidVIG` |
| Treasury / platform account | `VIGLOBAL_TREASURY_USER_ID` set on staging; treasury `Wallet` row exists | Payments / Engineering | ☐ Blocked | Required for confirm settle; not for cancel-only paths |
| Permission: `prisma migrate deploy` | Approved on staging DB | DBA + Engineering | ☐ Blocked | Migration `20260519120000_tourism_settlement_metadata` |
| Permission: dry-run scripts | Approved read-only execution against staging | Engineering + Finance | ☐ Blocked | Backfill default dry-run; timeout dry-run default |
| Permission: backfill `--apply` | Written finance + engineering sign-off | Finance + Engineering | ☐ Blocked | Only after dry-run review per [LEGACY_SETTLED_BACKFILL_RUNBOOK](./VIONA_TOURISM_LEGACY_SETTLED_BACKFILL_RUNBOOK_1.md) |

**Status legend:** `☐ Blocked` → `☐ Ready` when value is verified in vault/ticket.

---

## Required environment variables

### Server (staging API workers)

| Variable | Required for pilot | Default / notes |
|----------|------------------|---------------|
| `DATABASE_URL` | **Yes** | Staging PostgreSQL only |
| `JWT_SECRET` | **Yes** | Must match token issuance; min length per `.env.example` |
| `TOURISM_SETTLEMENT_MODE` | **Yes** (step 8) | **Unset or `legacy_settle_on_book` until step 8.** Staging pilot only: `hold` or `hold_on_submit` |
| `TOURISM_HOLD_REVIEW_TIMEOUT_HOURS` | Optional (timeout dry-run) | Default **48**; staging pilot dry-run often **24** |
| `VIGLOBAL_TREASURY_USER_ID` | **Yes** (confirm scenarios) | Dedicated treasury `User` id; confirm fails with `treasury_not_configured` if missing |
| `AWS_*` / `AWS_SES_SENDER_EMAIL` | If OTP login used | Per `.env.example` for tourist/merchant login |
| `API_PORT` | Optional | Default server port if not behind reverse proxy |

**Production guard:** `TOURISM_SETTLEMENT_MODE` must remain **unset** or `legacy_settle_on_book` on production until explicit rollout gate pack.

Config reference: `src/config/tourismSettlementMode.ts` — unset env → `legacy_settle_on_book` (no hold without explicit opt-in).

### Client (staging app / manual API tests)

| Variable | Required for pilot | Notes |
|----------|------------------|-------|
| `EXPO_PUBLIC_REST_API_BASE` | **Yes** (app UI path) | Must point at staging API origin (no trailing path) |
| `EXPO_PUBLIC_FIREBASE_*` | If app auth uses Firebase | Per existing app conventions |

### Local script execution (from approved machine)

| Variable | Required when | Notes |
|----------|---------------|-------|
| `DATABASE_URL` | migrate, backfill, timeout dry-run | Same staging DB; VPN/bastion as required |
| `TOURISM_HOLD_REVIEW_TIMEOUT_HOURS` | timeout dry-run only | e.g. `24` for staging |

**Do not commit** `.env`, JWTs, or `DATABASE_URL` to the repository.

---

## Safe staging sequence

Execute in order. Do not skip finance review before `--apply`.

| Step | Action | Owner | Done |
|------|--------|-------|------|
| 1 | Deploy **`master` @ `ac7ec3f`** (or newer) to staging API | Release train | ☐ |
| 2 | Confirm revision (image digest / git SHA in deploy ticket) | Engineering | ☐ |
| 3 | `npx prisma migrate deploy` against staging `DATABASE_URL` | Engineering + DBA | ☐ |
| 4 | Legacy backfill **dry-run:** `npx tsx scripts/backfills/backfill-tourism-settlement-metadata.ts` | Engineering | ☐ |
| 5 | Engineering + finance review dry-run counts and samples | Finance + Engineering | ☐ |
| 6 | Apply backfill **only if approved:** `… --apply` | Engineering (signed) | ☐ |
| 7 | Re-run backfill dry-run; confirm `manual_review` / risky unknown pendings acceptable | Finance + Engineering | ☐ |
| 8 | Set **`TOURISM_SETTLEMENT_MODE=hold`** on **staging only**; restart workers | Platform / DevOps | ☐ |
| 9 | Execute hold pilot scenarios per [HOLD_PILOT_STAGING_RUNBOOK](./VIONA_TOURISM_HOLD_PILOT_STAGING_RUNBOOK_1.md) | Engineering + QA | ☐ |
| 10 | Timeout dry-run (see below); attach log to ticket | Engineering + Finance | ☐ |
| 11 | Record sign-offs (pilot + timeout + ledger reconciliation) | All gate owners | ☐ |

**Kill switch (any step):** revert staging to `TOURISM_SETTLEMENT_MODE=legacy_settle_on_book` and restart API — see hold pilot runbook rollback section.

---

## Data safety rules

- Never run backfill `--apply` on **production** without written **finance sign-off**.
- Never set **production** `TOURISM_SETTLEMENT_MODE=hold`.
- Never manually mutate `Wallet.balanceVIG` or `Wallet.lockedBalanceVIG` — use confirm/cancel/ops-cancel APIs only.
- Never bypass confirm/cancel APIs for ledger actions.
- Do **not** share JWTs in the repo, PRs, or Slack without redaction.
- Do **not** commit secrets (`.env`, tokens, connection strings).
- Timeout worker `--apply` remains **blocked** until `VIONA.TOURISM.TIMEOUT_RELEASE_WORKER.1` after dry-run sign-off.

---

## Pilot execution checklist

**Authoritative scenario steps:** [VIONA_TOURISM_HOLD_PILOT_STAGING_RUNBOOK_1.md](./VIONA_TOURISM_HOLD_PILOT_STAGING_RUNBOOK_1.md)

### Prerequisites (this unblock runbook)

- [ ] All **Required staging access** rows marked **Ready**
- [ ] All **Required environment variables** documented in vault
- [ ] Safe staging sequence steps 1–8 complete

### Required outputs (attach to pilot ticket)

| Output | Record |
|--------|--------|
| Booking IDs | `booking-hold-confirm`, `booking-hold-merchant-cancel`, `booking-hold-tourist-cancel` (+ any scenario 5 fixtures) |
| Wallet before/after | Tourist `balanceVIG`, `lockedBalanceVIG`; provider `balanceVIG`; treasury `balanceVIG` per scenario |
| Provider before/after | Same provider wallet columns |
| Treasury before/after | Same treasury wallet columns |
| API responses | Full JSON for book, confirm, cancel (including idempotent retries) |
| Ledger transaction IDs | `BOOKING_LOCK`, `BOOKING`, `PLATFORM_FEE`, `ESCROW_REFUND` rows per booking |
| Stranded `lockedBalanceVIG` count | **Must be 0** on cancelled bookings after scenarios 3–4 |
| Manual review rows | Backfill `manual_review` bucket empty or each ID documented |
| Sign-off table | See below |

### Sign-off table (pilot)

| Role | Name | Date | Ticket / link |
|------|------|------|---------------|
| Pilot executor (Engineering) | | | |
| Finance / Ledger | | | |
| Product / Safety | | | |
| Operations | | | |

---

## Timeout dry-run checklist

**Command (read-only — no wallet writes):**

```bash
TOURISM_HOLD_REVIEW_TIMEOUT_HOURS=24 npx tsx scripts/jobs/release-tourism-held-timeouts.ts
```

Optional: `--sample-limit 20`, `--booking-id <uuid>` for single-row inspection.

**`--apply` is blocked** in current `master` — dry-run only until `VIONA.TOURISM.TIMEOUT_RELEASE_WORKER.1`.

### Required output fields (from script summary)

| Metric | Pass expectation |
|--------|------------------|
| Eligible count | Documented; finance review if > 0 before any future worker |
| Missing `BOOKING_LOCK` count | **0** before production hold / worker apply |
| Insufficient locked funds count | **0** before production hold / worker apply |
| Manual review count | **0** or each ID triaged |
| Total VIO Credits locked (eligible candidates) | Recorded for finance |
| Oldest eligible age (hours) | Recorded |
| Finance sign-off | Required if eligible > 0 or any risk bucket > 0 |

Attach full console log to ticket.

### Sign-off (timeout dry-run)

| Role | Name | Date | Notes |
|------|------|------|-------|
| Engineering | | | Dry-run log linked |
| Finance / Ledger | | | Approved to proceed toward worker pack or hold prod gate |

---

## Production guard

**Production hold remains blocked** until **all** of the following:

| Gate | Evidence |
|------|----------|
| Staging pilot scenarios 1–5 pass | [HOLD_PILOT_STAGING_RUNBOOK](./VIONA_TOURISM_HOLD_PILOT_STAGING_RUNBOOK_1.md) + ticket attachments |
| Timeout dry-run passes (no unresolved risk buckets) | Log + finance sign-off above |
| Finance / ledger sign-off | Reconciliation checklist complete |
| Product / safety sign-off | Hold copy, merchant inbox, escalation path |
| Ops / support sign-off | Kill switch and open-held-row playbook |
| Explicit production rollout gate | **`VIONA.TOURISM.HOLD_PRODUCTION_ROLLOUT_GATE.1`** (separate pack; env-only change on prod after approval) |

Until then:

- Production `TOURISM_SETTLEMENT_MODE`: **unset** or `legacy_settle_on_book` only.
- No timeout worker `--apply` on production.
- No production backfill `--apply` without finance approval.

---

## Local pre-flight (no staging DB required)

Eligibility unit scripts (no database):

```bash
npx tsx scripts/test-tourism-confirm-settle-eligibility.ts
npx tsx scripts/test-tourism-cancel-release-eligibility.ts
npx tsx scripts/test-tourism-merchant-inbox-actions.ts
npx tsx scripts/test-tourism-ops-cancel-policy.ts
npx tsx scripts/test-tourism-timeout-release-eligibility.ts
npx tsx scripts/test-tourism-merchant-inbox-ui-display.ts
```

---

## Unblock handoff template (ticket body)

Copy into staging-access ticket when requesting unblock:

```
VIONA.TOURISM.STAGING_ACCESS_UNBLOCK — request

Target master: ac7ec3f+
Staging API: <fill>
Staging DB access: <fill — method only, not connection string in ticket title>
Deploy revision confirmed: <fill>
Tourist test user: <fill>
Merchant test user: <fill>
Business / service ids: <fill>
Treasury user id configured: yes/no
JWTs: stored in <vault path>
Pilot executor: <name>
Finance reviewer: <name>
```

---

## Recommendation after access granted

1. Complete **Safe staging sequence** (steps 1–8).
2. Run **`VIONA.TOURISM.HOLD_PILOT_STAGING_EXECUTION.1`** against [HOLD_PILOT_STAGING_RUNBOOK](./VIONA_TOURISM_HOLD_PILOT_STAGING_RUNBOOK_1.md).
3. Run **timeout dry-run**; obtain finance sign-off.
4. Do **not** enable production hold until **`VIONA.TOURISM.HOLD_PRODUCTION_ROLLOUT_GATE.1`**.

---

*End of runbook.*
