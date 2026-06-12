# CODEX_REQUEST_INBOX_READONLY_FOUNDATION Evidence

## Scope

Pack 2 creates read-only Request Inbox foundation: fixtures, selectors, safety copy, and dormant UI components. No API, DB, navigation, payment, booking, SOS execution, or live AI runtime.

Builds on PR #56 (`2520dc3`).

## Files

- `docs/product/VIONA_REQUEST_INBOX_READONLY_FOUNDATION.md`
- `src/domain/requests/vionaRequestFixtures.ts`
- `src/domain/requests/vionaRequestInboxSelectors.ts`
- `src/domain/requests/vionaRequestSafetyCopy.ts`
- `src/domain/requests/index.ts`
- `src/components/viona/requests/VionaRequestInboxReadOnly.tsx`
- `src/components/viona/requests/VionaRequestStatusBadge.tsx`
- `src/components/viona/requests/VionaRequestDetailReadOnly.tsx`
- `src/components/viona/requests/index.ts`
- `scripts/viona-request-inbox-readonly-check.mjs`
- `docs/design/evidence/codex-request-inbox-readonly-foundation/README.md`

## Validation

- `node scripts/viona-request-inbox-readonly-check.mjs`
- Full master gate suite (capability, request domain, automation safety, forbidden claims, AI readiness, route inventory, tsc, smoke)

## Safety notes

- Components are dormant and unmounted — no App.tsx or navigation changes.
- Fixtures use safe negation wording only (e.g. "not paid", "not booking confirmed").
- No fake production claims for payment, booking, SOS dispatch, or settlement.
