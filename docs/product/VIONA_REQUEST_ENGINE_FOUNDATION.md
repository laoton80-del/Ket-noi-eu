# VIONA Request Engine Foundation

## Purpose

The VIONA Request Engine is the future typed spine for Local, Travel, Business, Account, SOS, Academy, Home, and B2B Wholesale request flows. Job B creates domain types and a status machine only.

This pack does not create API routes, database schema, UI, payment, booking, merchant execution, SOS action, or live AI action.

## Domain types

The foundation defines:

| Type | Purpose |
| --- | --- |
| `VionaRequestUniverse` | Universe ownership for the request. |
| `VionaRequestIntent` | User or operator intent class. |
| `VionaRequestStatus` | Workflow state. |
| `VionaRequestRiskLevel` | Safety and operations risk tier. |
| `VionaRequestHumanConfirmationState` | Human-confirmation state for protected workflows. |

Required statuses:

- `draft`
- `submitted`
- `triage`
- `needsHumanConfirmation`
- `sentToPartner`
- `partnerResponded`
- `completed`
- `cancelled`
- `failed`

## Safety notes

- submitted is not paid; it only means the request left draft state.
- partnerResponded is not booking confirmed; it only means a partner reply exists.
- completed is not settled; it only means this request workflow reached its current terminal state.
- SOS request is guidance/handoff only unless ops ready.

## Future support

The Request Engine can later support:

| Capability | Future use | Required gate |
| --- | --- | --- |
| User request | User creates a request draft and submits intent. | Auth/session, audit log, safety label. |
| Admin triage | Ops reviews request risk and next action. | Ops owner, runbook, audit log. |
| Merchant/partner inbox | Partner receives a request after triage. | Tenant isolation, human confirmation, partner eligibility. |
| Audit log | Every status transition records actor and reason. | Immutable source of truth and monitoring. |
| Human-confirmed AI | AI drafts classification, replies, and next steps. | Human confirmation before protected action. |

## Status machine rule

`canTransitionRequestStatus(from, to)` and `explainRequestStatusTransition(from, to)` are pure helpers. They do not mutate data and do not call a network, database, payment rail, booking system, SOS system, wallet, or AI service.

## Forbidden in Job B

Do not add:

- DB schema
- API route
- UI screen
- merchant execution
- payment flow
- booking flow
- SOS action
- wallet action
- live AI action

## Import guidance

Future packs may import these types into runtime only after architecture review. Until then, this foundation is documentation and type-safe planning for request flows.
