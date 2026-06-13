# VIONA Operator Request Inbox ReferenceLab

## Pack4 Purpose

Pack4 adds a gated ReferenceLab preview route for the future Admin/Operator request triage view. It lets product, design, trust, and safety reviewers inspect operator-facing queue groupings, human-confirmation fixtures, partner-response fixtures, terminal statuses, and operator-safe copy without wiring the surface into live admin UI, merchant inboxes, or consumer navigation.

This follows Pack2 and Pack3 because Pack2 created the read-only request domain fixtures, selectors, safety copy, and display components, and Pack3 added the consumer-facing request inbox ReferenceLab preview. Pack4 only gives operator triage artifacts a separate lab route for visual inspection.

## Why Pack4 Stays ReferenceLab-Only

The operator triage surface is not ready for live admin execution. Pack4 is intentionally lab-only so reviewers can validate queue semantics, safety copy, and grouped counts without implying live merchant execution, payment capture, booking confirmation, SOS dispatch, or autonomous AI action.

Pack4 does not use the Admin debug App.tsx block yet. Existing admin debug routes in `App.tsx` are inline demo surfaces behind separate admin debug gates. Pack4 does not touch `App.tsx` because operator inbox preview must remain isolated behind ReferenceLab master and per-lab gates until auth/role gates, persistence, and audit logging are approved.

## Why It Does Not Use LocalMerchantRequestInbox or TourismMerchantInbox

Pack4 does not use LocalMerchantRequestInbox or TourismMerchantInbox. `LocalMerchantRequestInbox` and `TourismMerchantInbox` are live B2B merchant execution surfaces. Pack4 is an operator triage preview only. Merchant inboxes must not be repurposed for admin preview work because that would blur tenant boundaries and risk fake production claims.

## Lab-Only Route

The route is `VionaReferenceRequestOperatorInboxLab`.

It is registered only through the existing ReferenceLab stack helper and remains behind:

- master gate: `EXPO_PUBLIC_VIONA_REFERENCE_LABS_ENABLED=true`
- per-lab gate: `EXPO_PUBLIC_VIONA_REFERENCE_REQUEST_OPERATOR_INBOX_LAB=true`

The route is not added to Home, Local, Travel, Academy, merchant tabs, admin debug blocks, or any live navigation affordance.

## Safety Boundaries

The preview must remain read-only:

- Operator ReferenceLab preview
- Read-only queue
- Lab route only
- No payment captured
- Not booking confirmed
- No SOS dispatch
- Human confirmation required before any future action
- No live merchant execution
- No API, DB, payment, booking, SOS, wallet, merchant execution, or live AI integration
- No navigation action is required inside the lab

## Future Path

Future productionization must happen in small gated steps:

1. Operator route behind feature flag
2. Auth and role gate
3. Request persistence/API after source-of-truth ownership is approved
4. Audit log for request reads, transitions, and operator actions
5. Human-confirmed actions only after safety gates pass
6. Merchant ops only after tenant, fulfillment, and operational readiness gates pass

## Do Not Remove Capability

If this lab is not ready for a broader audience, gate it instead of deleting it. The operator request inbox is part of the Global Vietnamese Companion OS path toward honest operator support, not a live booking, payment, SOS, wallet, or autonomous AI system.
