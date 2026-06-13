# VIONA Operator Inbox Admin Route Readiness

## Why Pack5 exists

Pack5 defines the readiness contract for promoting the Operator Request Inbox from ReferenceLab-only preview (Pack4, merged in PR #59) toward a future Admin Debug read-only operator route. It is a docs/config/check-script bridge only — no route, no UI wiring, no runtime behavior.

Current master baseline after PR #59: `origin/master @ 35220c8` with `VionaReferenceRequestOperatorInboxLab` available behind ReferenceLab master and per-lab gates.

## Current State

- ReferenceLab operator preview exists and is merged on master.
- Read-only operator preview uses fixtures and Pack2 domain helpers only.
- Admin route is **not active** in this pack.
- Production/live operator ops are **not active**.

## Why Admin Debug Route Is Deferred

The Admin Debug route in `App.tsx` is a separate gated surface with its own demo/admin semantics. Admin Debug route is deferred until:

App.tsx is not touched in Pack5. Future Pack6 may add an admin debug read-only operator route behind a feature flag — still without mutations.

1. A dedicated feature flag is defined and owned.
2. An admin role gate is specified.
3. An operator runbook and audit log plan exist.
4. Read-only mode is the only permitted first promotion.

Jumping directly from ReferenceLab to live admin execution would blur readiness labels and risk fake production claims.

## Why App.tsx Is Not Touched in Pack5

`App.tsx` admin debug blocks are not the same as ReferenceLab registration. Pack5 encodes readiness only.

## Why LocalMerchantRequestInbox / TourismMerchantInbox Are Not Targets

`LocalMerchantRequestInbox` and `TourismMerchantInbox` are live B2B merchant execution surfaces with tenant boundaries. The VIONA request-engine operator inbox is an admin/operator triage concept. Pack5 forbids using merchant inbox routes as the request-engine operator route target.

## Required Future Route Gates

1. **Dedicated feature flag** — separate from ReferenceLab master/per-lab gates.
2. **Admin role gate** — operator/admin role required before route mount.
3. **Read-only mode** — first admin promotion is preview/triage only.
4. **Audit log plan** — required before any mutation path is designed.
5. **Request persistence/API** — required later; not in Pack5.
6. **Human-confirmed actions** — required before any future protected action.
7. **Merchant operations** — only after tenant, fulfillment, and operational readiness gates pass.

## Explicit Non-Goals (Pack5)

- No live admin route
- No API
- No DB
- No payment
- No booking
- No SOS dispatch
- No wallet
- No live AI
- No merchant execution

## Required Safe Copy

Pack5 and future promotions must preserve honest boundaries:

- Read-only operator preview
- Admin route not active in this pack
- No payment captured
- Not booking confirmed
- No SOS dispatch
- No live merchant execution
- Human confirmation required before any future protected action
- API and persistence are future gates

## Future Pack6 Recommendation

Add an admin debug read-only operator route behind a dedicated feature flag only. Render fixture or read-only data. Still no mutations, no payment, no booking, no SOS dispatch, no wallet mutation, no live AI action, and no merchant execution.

## Config Reference

See `src/config/vionaOperatorInboxAdminReadiness.ts` for typed phases, maturity labels, safety flags, and forbidden promotions.
