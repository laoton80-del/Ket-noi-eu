# VIONA Request Inbox ReferenceLab

## Pack3 Purpose

Pack3 adds a gated ReferenceLab preview route for the request inbox foundation. It lets product, design, and safety reviewers inspect the read-only request inbox, request detail, status badge, fixtures, and safety copy without wiring the surface into live consumer UI.

This follows Pack2 because Pack2 created the read-only request domain fixtures, selectors, safety copy, and display components. Pack3 only gives those artifacts a lab route for visual inspection.

## Lab-Only Route

The route is `VionaReferenceRequestInboxLab`.

It is registered only through the existing ReferenceLab stack helper and remains behind:

- master gate: `EXPO_PUBLIC_VIONA_REFERENCE_LABS_ENABLED=true`
- per-lab gate: `EXPO_PUBLIC_VIONA_REFERENCE_REQUEST_INBOX_LAB=true`

The route is not added to Home, Local, Travel, Academy, merchant tabs, or any live navigation affordance.

## Safety Boundaries

The preview must remain read-only:

- Read-only ReferenceLab preview
- Lab route only
- No payment captured
- Not booking confirmed
- No SOS dispatch
- Human confirmation required before any future action
- No API, DB, payment, booking, SOS, wallet, merchant execution, or live AI integration
- No navigation action is required inside the lab

## Future Path

Future productionization must happen in small gated steps:

1. Admin/operator route behind feature flag
2. Auth and role gate
3. Persistence/API after source-of-truth ownership is approved
4. Audit log for request reads, transitions, and operator actions
5. Human-confirmed actions only after safety gates pass
6. Merchant ops only after tenant, fulfillment, and operational readiness gates pass

## Do Not Remove Capability

If this lab is not ready for a broader audience, gate it instead of deleting it. The request inbox is part of the Global Vietnamese Companion OS path toward honest operator support, not a live booking, payment, SOS, wallet, or autonomous AI system.
