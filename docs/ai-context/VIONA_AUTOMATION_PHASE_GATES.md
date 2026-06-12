# VIONA Automation Phase Gates

## Purpose

This document defines the VIONA automation safety foundation for future AI and workflow automation. It separates safe explanation and drafting from protected actions that require human confirmation, operations readiness, audit logs, and source-of-truth systems.

Job C is docs/config only. It does not touch live AI services, UI, payment, booking, SOS, wallet, auth, database, or runtime routing.

## Automation phases

| Phase | Name | Meaning |
| --- | --- | --- |
| `phaseA_sourceOfTruth` | Foundation | Define source-of-truth systems, policy, owners, audit needs, and forbidden actions. |
| `phaseB_readOnlyCopilot` | Read-only copilot | AI may explain, classify, draft, translate, summarize, and suggest from approved data. |
| `phaseC_humanConfirmedAction` | Human-confirmed action | AI may prepare an action only after explicit human confirmation and audit logging. |
| `phaseD_limitedAutonomousGated` | Limited autonomous gated | Narrow automation may run only with feature flags, ops confirmation, monitoring, rollback, and owner approval. |

## Action categories

| Category | Meaning |
| --- | --- |
| `readOnly` | Explanation, classification, or summary from approved source-of-truth data. |
| `draftOnly` | Draft text or form data for a human to review. |
| `humanConfirmed` | Externally visible action after explicit user confirmation and audit logging. |
| `opsConfirmed` | Action requiring user confirmation plus operations approval and monitoring. |
| `prohibited` | Action blocked until future legal, backend, payment, SOS, tenant, or ops readiness is approved. |

## Prohibited actions

These action ids must remain blocked in the foundation config:

- `capturePayment`
- `refund`
- `settle`
- `payout`
- `bookTravelTicketHotel`
- `dispatchSosRescuePoliceAmbulance`
- `sendLegalMedicalAuthorityReport`
- `performIrreversibleAutonomousAction`

## Core law

AI can classify/draft/suggest.

AI cannot autonomously pay/book/dispatch/refund/settle/payout.

human confirmation and audit logs are required before future actions.

## Helper functions

The config exposes:

- `getAutomationPhaseGate(action)`
- `isAutomationActionAllowed(action, phase)`
- `requiresHumanConfirmation(action)`

These helpers are pure policy functions. They do not call a model, API, database, payment rail, booking system, SOS service, wallet, or live AI runtime.

## Promotion checklist

Before any future pack uses these gates at runtime, the pack must document:

1. Source-of-truth data for the action.
2. Feature flag and owner.
3. User confirmation copy and audit log.
4. Ops fallback and rollback.
5. Rate limit and cost guard for AI or telecom.
6. Tenant isolation for merchant/business actions.
7. Legal/privacy/market review for regulated or safety-sensitive actions.

## Non-removal rule

If an action is not ready, keep it in the safety map as `prohibited`. Do not delete it to make a checker green.
