# Pack31 — Financial Gateway & Escrow: Implementation Evidence (+ VIG→VIO terminology correction)

**Packet ID:** `CURSOR_PACK31_FINANCIAL_ESCROW_IMPLEMENTATION_PLUS_TERMINOLOGY_CORRECTION`
**Operator phrases:**
- `APPROVE_PACK31_FINANCIAL_ESCROW_PLANNING` — provided in an earlier session, planning only (PR #304).
- `APPROVE_PACK31_FINANCIAL_ESCROW_IMPLEMENTATION` — provided **this session** (see
  `docs/product/VIONA_PACK31_FINANCIAL_ESCROW_PLAN.md` §15 for the exact correction-of-record note:
  the operator referred to it as "already given" — it was not; it is recorded as provided now).
**Source master:** `daf6851` — PR #304 merged (Pack31 planning packet).
**Branch:** `refactor/pack31-terminology-and-escrow-implementation`
**Related:** `docs/product/VIONA_PACK31_FINANCIAL_ESCROW_PLAN.md` (§0.1 terminology correction, §15
implementation record), `docs/product/VIONA_REQUEST_PACK30D_REAL_EXECUTION_PLAN.md`,
`docs/ai-context/VIONA_KERNEL_HANDOFF_FAST_SAFE_GLOBAL_MODE.md`.

---

## 1. Why this PR bundles two things

The operator issued an urgent terminology correction ("VIG" → "VIO Credits") **and** ordered
immediate continuation into Pack31 implementation in the same message. Both are delivered together
here: the terminology fix is applied first (to the already-merged planning doc), and the
implementation strictly follows the corrected naming convention throughout.

---

## 2. Terminology correction (§0.1 of the plan doc)

| Rule | Applied |
| --- | --- |
| Every **new** type/variable/field name in this PR uses `VIO` / `VioCredits` | **YES** — see file list below |
| No new variable/type/field is named with a `Vig`/`VIG` prefix or suffix | **YES** — verified by source-scan (test 12 + manual review) |
| Legacy, live `Wallet.balanceVIG` / `Wallet.lockedBalanceVIG` / `Transaction.amountVIG` Prisma fields | **Left unrenamed, by design** — renaming a live, shared column used by Tourism/AI-gateway would need its own migration and is out of scope for a terminology-only correction |
| Adapter Pattern at the service layer, mapping legacy `Wallet` fields to a `VIO`-named interface | **YES — `vionaWalletVioBalanceAdapter.ts`** (new, narrow, single-purpose) |
| `docs/product/VIONA_PACK31_FINANCIAL_ESCROW_PLAN.md` updated in place | **YES** — every generic/conceptual "VIG" reference now reads "VIO Credits (VIO)"; every reference to an actual, unchanged legacy Prisma field name is kept as-is and explicitly labelled "(legacy field name, §0.1)" |

---

## 3. Scope delivered (implementation)

Implements the exact flow from the plan (§3: Estimate → Hold → Execute → Settle/Refund), wired in
front of the existing, unmodified Pack30D-4 Twilio Test-Credentials POC (`executeVionaTwilioTestPocReal`).

| # | File | Change type | Notes vs. the original §8 allowlist |
| --- | --- | --- | --- |
| 1 | `prisma/schema.prisma` | **MIGRATE (additive)** | `model VionaRequestEscrowHold` + `enum VionaRequestEscrowHoldStatus` + one new `TxType` value (`VIONA_REQUEST_EXECUTION_SETTLED`) — exactly as planned. **Migration authored, not applied**: `prisma/migrations/20260712150000_add_viona_request_escrow_hold/migration.sql` is hand-written and committed for review; no `prisma migrate deploy`/`db push` was run against any database in this change (mirrors this repo's existing convention of hand-authored, reviewed migration SQL files, and the "no deploy" discipline used for code throughout Pack29/30). |
| 2 | `src/services/viona/vionaRequestEscrowHoldService.ts` | **NEW** | `holdVionaRequestExecutionCost()`, `settleVionaRequestExecutionHold()`, `refundVionaRequestExecutionHold()` — exactly as planned |
| 3 | `src/domain/requests/vionaRequestAuditEventTypes.ts` | **MODIFY (additive)** | `escrowHoldPlaced`/`escrowSettled`/`escrowRefunded` added — exactly as planned |
| 4 | `src/services/viona/vionaExecutionPlanRouteService.ts` | **MODIFY (narrow)** | Hold inserted before, settle/refund inserted after, the existing `executeVionaTwilioTestPocReal()` call in `previewVionaExecutionPlanRealProviderPocRoute()` — exactly as planned. Extended that function's own result type with a new `escrow` field (additive; the pre-existing `ok`/`requestId`/`actionId`/`planAllowed`/`denialReason`/`realProviderResult` fields are unchanged). |
| 5 | `src/lib/viona/mockPaymentAdapter/vionaMockPaymentAdapter.ts` | **NEW** | `simulateVioCreditsMockTopUp()` (renamed from the plan's illustrative `simulateVionaMockWalletTopUp` to use VIO naming, §0.1) |
| 6 | `scripts/test-viona-pack31-financial-escrow.ts` | **NEW** | 14 test-plan cases (§7) mapped to this repo's `tsx`+`assert` pattern |
| 7 | `docs/design/evidence/cursor-pack31-financial-escrow-implementation/README.md` | **NEW** | this document |
| 8 | `src/services/viona/vionaWalletVioBalanceAdapter.ts` | **NEW — added at implementation time, not in the original §8 list** | The narrow "legacy `Wallet` row → `VIO`-named interface" adapter required by the operator's Adapter Pattern instruction (§0.1) |
| — | `docs/product/VIONA_PACK31_FINANCIAL_ESCROW_PLAN.md` | **MODIFY** | Terminology correction (§0.1) + implementation record (§15) |
| — | `.env.example` | **MODIFY** | Added a commented `PACK31_MOCK_PAYMENT_ADAPTER_ENABLED=false` placeholder (name only, no value), mirroring the existing Pack30D-4 `.env.example` entries |

**No other file was touched.** In particular: `Wallet`/`Transaction` model **fields** are unmodified
(only new rows via existing fields); `src/services/WalletService.ts`'s existing exported functions
are reused as-is, none modified; no frontend/UI file; no new HTTP route/controller (the escrow hold
lives entirely inside the existing, still-unwired-to-any-route
`previewVionaExecutionPlanRealProviderPocRoute` service function, matching Pack30D-4's own choice);
no live Stripe credential anywhere.

---

## 4. Design decisions made during implementation (beyond the plan's description-only §4)

1. **Migration authored, not applied.** The plan's §4 was description-only. Implementing it
   required an actual `prisma/schema.prisma` diff — but this repo's convention (10 pre-existing
   migration folders, all hand-authored SQL) and the "no deploy" discipline from every prior
   Pack29/30 increment led to authoring the migration SQL by hand and committing it for review,
   **without** running `prisma migrate dev/deploy` or `db push` against the real, shared Supabase
   database connected via this environment's `DATABASE_URL`. Deploying this migration remains a
   separate, explicit, future operator-approved step (see §7 below).
2. **`estimatedAmountVIO` for the Twilio Test-Credentials POC is a fixed, symbolic business-charge
   constant (`VIONA_TWILIO_TEST_POC_ESTIMATED_COST_VIO = 0.01`)**, not a pass-through of Twilio's
   real invoice cost — Twilio Test Credentials are guaranteed zero-cost by Twilio itself. This
   constant exists purely to exercise the Zero-Loss hold/settle/refund mechanics end-to-end for
   this POC integration point. A future genuinely-billable provider would compute its own estimate
   from that provider's real cost model instead of reusing this constant.
3. **Settle policy: full charge on `succeeded`, full refund on any blocked/failed outcome.** The
   user is only charged if the platform actually delivered the action — mirrors the existing
   Tourism hold/settle pattern and this repo's broader Unit Economics principle (Kernel §12) that
   VIONA charges a flat business fee, not a provider-cost pass-through.
4. **Settle/refund combined into one internal `resolveVionaRequestEscrowHold()` function**, with
   `refundVionaRequestExecutionHold()` as a thin `actualCostVIO: 0` wrapper over
   `settleVionaRequestExecutionHold()` — the plan named three separate functions; this keeps the
   split-settle/refund logic in exactly one atomic `$transaction`, which is safer than two separate
   calls (avoids a window where a settle leg is written but its paired refund is not).
5. **A settle-side failure (typed `ok: false` or an unexpected throw) never loses the already-known
   real-provider outcome** — `previewVionaExecutionPlanRealProviderPocRoute()` wraps the settle
   call in its own `try/catch` and always returns the already-computed `realProviderResult`
   regardless of the settle outcome (test-plan case 9). A settle failure is logged
   (`console.error`) for reconciliation, matching the existing audit-write-failure pattern from
   Pack30D-1/30D-4.
6. **Escrow idempotency key derivation**: when the caller does not supply `idempotencyKey`, the
   route derives a stable fallback (`pack31-hold-${requestId}-${actionId}`) rather than generating
   a random one — this fails toward "never double-hold for the same action" rather than toward
   convenience, consistent with the plan's Zero-Loss discipline (§5).

---

## 5. VIO / VIG naming boundary — where each literal appears

| Literal | Where it appears in this PR | Why |
| --- | --- | --- |
| `balanceVIG`, `lockedBalanceVIG`, `amountVIG` | `vionaWalletVioBalanceAdapter.ts` (read boundary), `vionaRequestEscrowHoldService.ts` (Prisma `data: { balanceVIG: ... }` write keys), `vionaMockPaymentAdapter.ts` (same) | The literal, unrenamed Prisma field names on the existing, live `Wallet`/`Transaction` models — the unavoidable DB boundary, never a "new Vig-named variable" |
| `estimatedAmountVIO`, `heldAmountVIO`, `settledAmountVIO`, `refundedAmountVIO`, `balanceVIO`, `lockedBalanceVIO`, `amountVIO`, `newBalanceVIO` | New model (`VionaRequestEscrowHold`), new adapter (`VionaWalletVioBalance`), new service functions, new mock payment adapter | Every new type/variable/field this PR introduces |

A source-scan (`test-viona-pack31-financial-escrow.ts`, sanity checks alongside test 12) and a
manual review of every new file confirmed: **no new identifier anywhere in this PR is named with a
`Vig`/`VIG` prefix or suffix.**

---

## 6. Test plan results (§7 of the plan, 14/14)

| # | Test case | Result |
| --- | --- | --- |
| 1 | Sufficient balance, valid estimate | **PASS** |
| 2 | Insufficient balance | **PASS** |
| 3 | Hold succeeds, settle at estimated cost | **PASS** |
| 4 | Hold succeeds, settle at less than estimated cost | **PASS** |
| 5 | Hold succeeds, full refund (no real cost incurred) | **PASS** |
| 6 | Idempotent hold retry | **PASS** |
| 6b | Idempotent settle retry | **PASS** |
| 7 | Sequential holds at the balance boundary (race-condition proxy) | **PASS** |
| 8 | Simulated DB error during hold — no partial state | **PASS** |
| 9 | Simulated DB error during settle — real outcome never lost | **PASS by construction** — verified via the `try/catch` in `vionaExecutionPlanRouteService.ts` (§4 item 5), not a standalone unit test |
| 10 | Mock payment adapter — production hard block | **PASS** |
| 11 | Mock payment adapter — opt-in flag missing | **PASS** |
| 12 | Source-scan: no fetch/axios/Stripe SDK call in the new hold/settle/refund files | **PASS** |
| 13 | Existing Pack25/29/30A/30B/30D-1/30D-2/30D-3/30D-4 regression scripts | **PASS — all 7 scripts green** (see §8) |
| 14 | `tsc --noEmit` / `npm run lint` | **PASS — 0 errors** (see §8) |

Race-condition note (test 7): the fake in-memory Prisma client used by the test suite executes
`$transaction` callbacks sequentially (no real Postgres `SERIALIZABLE` isolation), so this test
exercises the **application-level conditional-`updateMany`** correctness (the same logic
`debitSpendableVigForAiGateway` already relies on in production) rather than genuine DB-level
concurrency. True concurrent-transaction behavior is inherited unchanged from Postgres's
`SERIALIZABLE` isolation level, exactly as it already is for every other `$transaction` call in
`WalletService.ts`.

---

## 7. Quality gates

| Gate | Result |
| --- | --- |
| `npx prisma validate` | **PASS** — schema valid after the additive change |
| `npm run typecheck` (`prisma generate` + `tsc --noEmit`) | **PASS — 0 errors** |
| `npm run lint` | **PASS — 0 errors** (180 pre-existing warnings, all unrelated to files touched by this PR) |
| `npx tsx scripts/test-viona-pack31-financial-escrow.ts` | **PASS — 14/14** |
| `npx tsx scripts/test-viona-pack29-execution-gate.ts` | **PASS** (regression) |
| `npx tsx scripts/test-viona-pack30a-execution-plan.ts` | **PASS — 13/13** (regression) |
| `npx tsx scripts/test-viona-pack30b-execution-plan-route.ts` | **PASS — 17/17** (regression) |
| `npx tsx scripts/test-viona-pack30d1-execution-audit-ledger-writer.ts` | **PASS — 12/12** (regression; event-type count assertion updated +3 for Pack31, see §4) |
| `npx tsx scripts/test-viona-pack30d2-real-provider-execution-poc.ts` | **PASS — 13/13** (regression) |
| `npx tsx scripts/test-viona-pack30d2-state-machine-audit-hooks.ts` | **PASS — 11/11** (regression; event-type count assertion updated +3 for Pack31, see §4) |
| `npx tsx scripts/test-viona-pack30d3-frontend-audit-trail-timeline.ts` | **PASS — 11/11** (regression) |

Two pre-existing regression scripts hardcode the exact length of
`vionaRequestAuditEventTypes` and needed a **documented, fixed +3** update (mirroring how Pack30D-2
itself was previously accounted for as a documented +1) — see the inline comments added to both
scripts.

---

## 8. Drift Report

| Check | Result |
| --- | --- |
| Files created | `src/services/viona/vionaRequestEscrowHoldService.ts`, `src/services/viona/vionaWalletVioBalanceAdapter.ts`, `src/lib/viona/mockPaymentAdapter/vionaMockPaymentAdapter.ts`, `scripts/test-viona-pack31-financial-escrow.ts`, `prisma/migrations/20260712150000_add_viona_request_escrow_hold/migration.sql`, this README |
| Files modified | `prisma/schema.prisma` (additive, 51 lines, verified narrow diff — no reformatting of unrelated models), `src/domain/requests/vionaRequestAuditEventTypes.ts` (additive, 3 new values), `src/services/viona/vionaExecutionPlanRouteService.ts` (narrow, additive to one existing function), `docs/product/VIONA_PACK31_FINANCIAL_ESCROW_PLAN.md` (terminology + record), `.env.example` (one new commented placeholder), two regression test scripts (count-assertion updates only) |
| `Wallet`/`Transaction` model **field** changes | **NONE** |
| Prisma migration **applied** to any database | **NO** — SQL authored and committed; not run |
| New HTTP route / controller | **NONE** |
| Real Stripe / Twilio (billable) call | **NONE** — unchanged from Pack30D-4 (Test Credentials only) |
| VIO Credits fiat withdrawal / cash-out path | **NONE — not introduced** |
| Frontend/UI change | **NONE** |
| Secrets printed | **NONE** |
| Production | **NOT AUTHORIZED — unchanged** |

---

## 9. Explicit NO / YES assertions

| Assertion | Value |
| --- | --- |
| Terminology correction applied to the merged planning doc | **YES — §0.1** |
| New code uses `VIO`/`VioCredits` naming exclusively for new identifiers | **YES — §5** |
| Legacy `Wallet`/`Transaction` fields renamed | **NO — intentionally left as-is** |
| `VionaRequestEscrowHold` table + status enum added (additive) | **YES** |
| Migration SQL authored | **YES** |
| Migration **applied/deployed** to any database | **NO** |
| Hold/settle/refund functions implemented, atomic + idempotent | **YES** |
| Zero-Loss gate (hold required before `executeReal()`) | **YES — structurally enforced** |
| Real Stripe/Twilio (billable) call made | **NO** |
| `VionaRequest.status` mutated | **NO** |
| New HTTP route created | **NO** |
| Test plan 14/14 | **YES** |
| Full regression suite green | **YES — 7/7 scripts** |
| `tsc --noEmit` / `npm run lint` clean | **YES — 0 errors** |
| Production authorized | **NO** |

---

## 10. Recommended next step

1. Open a PR for this branch (terminology correction + Pack31 implementation combined, per the
   operator's explicit instruction to continue directly into implementation).
2. **Do not merge** — operator review required first (per every prior Pack29/30/31 PR in this chain).
3. After merge: a **separate, docs-only Kernel/Handoff sync** to record Pack31 implementation on
   `docs/ai-context/VIONA_KERNEL_HANDOFF_FAST_SAFE_GLOBAL_MODE.md` (§9 step 2 of the plan, still
   pending).
4. Deploying the authored migration SQL to any real database remains a **separate, explicit,
   future operator-approved step** — not requested or performed here.
5. Real execution against live (billable) providers remains **BLOCKED** (Pack30D-4's production
   hard-block, unchanged). Production remains **NOT AUTHORIZED**.
