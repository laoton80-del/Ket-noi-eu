# VIONA Request Inbox Read-Only Foundation

## Purpose

This pack adds a **read-only** Request Inbox foundation for future Admin, Merchant, and Operator request handling. It builds on PR #56 (Codex Batch 1):

- Capability/readiness matrix (Job A)
- Request Engine domain types and status machine (Job B)
- Automation safety phase gates (Job C)

This pack does **not** create live operations, APIs, database persistence, navigation routes, or payment/booking/SOS execution.

## Why read-only

Admin and merchant inboxes will eventually display user request workflow states. Before any route registration or live ops wiring, VIONA needs:

- typed fixtures with safe wording
- pure inbox selectors for filtering and grouping
- safety copy helpers that preserve production boundaries
- dormant UI components that can be mounted behind flags later

Read-only foundation prevents fake production claims and accidental live actions.

## What this supports (future)

| Surface | Future use | Required gate |
| --- | --- | --- |
| Admin inbox | Ops triage, human confirmation queue | Feature flag, ops owner, audit log |
| Merchant inbox | Partner response review | Auth/role gate, tenant isolation |
| Operator preview | Request status monitoring | Read-only until persistence exists |

Display states supported in fixtures and components:

- draft / submitted
- triage
- needsHumanConfirmation
- sentToPartner / partnerResponded
- completed / cancelled / failed

## Safety boundaries

- **submitted is not paid** — request submitted means draft left user control only.
- **partnerResponded is not booking confirmed** — partner reply is not fulfillment truth.
- **completed is not settled** — workflow terminal state is not ledger truth.
- **SOS remains guidance/handoff only** unless real ops/legal/backend readiness exists.
- **AI may classify, draft, and suggest** — AI may not autonomously pay, book, dispatch, refund, settle, or transfer funds out.

Safe labels used in components:

- Read-only preview
- Needs human confirmation
- No payment captured
- Not booking confirmed
- Ops readiness required
- SOS guidance only

## Explicitly not implemented

- API routes or network calls
- Database schema or migrations
- App.tsx or navigation wiring
- Home / Local / Travel / Academy live screen changes
- Payment, booking, wallet, auth, or SOS runtime execution
- Merchant actions or live partner dispatch
- Action buttons (components are display-only)

## Files

| File | Role |
| --- | --- |
| `src/domain/requests/vionaRequestFixtures.ts` | Safe sample requests across universes and statuses |
| `src/domain/requests/vionaRequestInboxSelectors.ts` | Pure filter/group/count helpers |
| `src/domain/requests/vionaRequestSafetyCopy.ts` | Status and universe safety labels |
| `src/components/viona/requests/*` | Dormant read-only UI components (unmounted) |
| `scripts/viona-request-inbox-readonly-check.mjs` | Pack validation gate |

## Future steps

1. Admin inbox route behind feature flag
2. Merchant inbox route behind auth/role gate
3. Request persistence and API layer
4. Immutable audit log for status transitions
5. Human-confirmed actions only after automation phase gates
6. Payment / booking / SOS ops only after readiness gates and ops sign-off

## Import guidance

Do not import inbox components into live screens until architecture review and flag gating are complete. Fixtures are for preview and tests only — not production data.
