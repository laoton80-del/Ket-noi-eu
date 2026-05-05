# VIONA AI Receptionist Pilot Request Audit

## 1. Executive Summary
- **Recommended direction:** Keep `B2BPaywall` as the pricing/info surface, but create a separate **Pilot Request Form** screen for lead capture. Do not reuse `B2BPaywall` for input collection.
- **Form reuse:** There is no shared generic form component in `src/components` suitable for direct reuse. The closest pattern is the inline `TextInput` + local `useState` approach in `PartnerOnboardingScreen` and `SalesLeadCRM`.
- **Backend need now:** Not required for Phase 4 audit target. The safest first step is **local-only draft intake** with explicit "not submitted to backend" copy.
- **Safest lead capture path:** Merchant enters pilot interest fields in-app, reviews a local preview, and gets a confirmation state that clearly says request is pending internal follow-up and **not yet provisioned**.

## 2. Candidate Screens

| Screen/File | Current Purpose | Fit For Pilot Request? | Risk | Recommendation |
|-------------|-----------------|------------------------|------|----------------|
| `src/screens/b2b/B2BPaywallScreen.tsx` | SaaS plan/paywall + Stripe-oriented upgrade/cancel actions | Partial fit (CTA host only) | High if reused for form because it already carries billing language and Stripe flows | Keep as destination from "Request pilot", add a dedicated CTA to new pilot form screen |
| `src/screens/b2b/AiReceptionistDemoSimulatorScreen.tsx` | Local simulated demo UX with safe disclaimers | Good entry point | Low | Keep CTA path from demo into pilot form (via paywall or direct) |
| `src/screens/b2b/AiReceptionistSetupChecklistScreen.tsx` | Read-only safety/cutover checklist | Good context gate before request | Low | Keep CTA to pilot request flow; include "pilot request is non-production" copy |
| `src/screens/b2b/MerchantDashboardScreen.tsx` | Merchant operational hub + AI beta card | Good top-level entry | Low | Keep "Request pilot" CTA here; route to paywall then pilot form |
| `src/screens/commercial/PartnerOnboardingScreen.tsx` | Partner intake with `registerMerchant` and `trackGrowthEvent` | Weak fit | Medium/High (invokes auth/growth service side effects) | Reuse only UI style patterns, not submission logic |
| `src/screens/admin/SalesLeadCRM.tsx` | Internal telesales CRM with mock outreach tools | Not fit for merchant-facing pilot form | High (admin-only semantics, outbound/twilio-like mock flows) | Do not reuse in merchant flow |

## 3. Recommended UX
Proposed safe flow:

1. **Demo Simulator** (`AiReceptionistDemoSimulator`)
   - Merchant sees simulated value and safety boundaries.
2. **Configure Checklist** (`AiReceptionistSetupChecklist`)
   - Merchant reviews production prerequisites.
3. **Request Pilot** (`B2BPaywall` CTA)
   - Merchant sees plan framing and pilot positioning.
4. **Pilot Request Form** (new screen, local-only mode first)
   - Collect structured pilot info into local state only.
   - Show "Preview draft" section before confirmation.
5. **Confirmation / next step**
   - "Request saved on device/session draft" (or "ready for backend handoff").
   - No promise of automatic approval, activation, or go-live timeline.

## 4. Data Fields
Recommended pilot intake fields:

- business name
- industry
- city/country
- contact phone/email
- languages needed
- missed calls estimate
- desired automation
- preferred pilot date
- notes

Recommended add-ons for safety clarity:
- explicit acknowledgment checkbox: "AI may make mistakes; merchant confirmation required."
- optional "current booking volume per day" (for pilot sizing, still local-only in first pass)

## 5. Safety Boundaries
- no payment
- no Twilio
- no AI runtime
- no DB write unless backend exists and is approved
- no promise of production activation
- no fake approval

Additional boundary notes from current codebase context:
- Do not attach pilot request submission to `B2BPaywall` billing actions.
- Do not reuse partner onboarding submission path (`registerMerchant`, `trackGrowthEvent`) for this phase.
- Keep pilot request copy aligned with existing simulated/demo language: preview, draft, pending merchant confirmation.

## 6. Proposed Code Task
Smallest safe implementation task:

- **Screen choice:** Add a new merchant-facing screen, e.g. `AiReceptionistPilotRequestScreen` (do not overload `B2BPaywall` body with form logic).
- **Route:** Add one new route in `RootStackParamList`, mount in `App.tsx` under existing B2B group and gate with `b2bAiReceptionistDemoEnabled || b2bAiReceptionistPilotEnabled`.
- **CTA wiring:**
  - `B2BPaywall`: add CTA "Continue to pilot request form".
  - `AiReceptionistDemoSimulator`: keep "Request pilot" -> `B2BPaywall` (or direct to new form after paywall confirmation block).
  - `AiReceptionistSetupChecklist` and `MerchantDashboard`: keep existing `Request pilot` path.
- **Mode:** Local-only first (React state only, optional session-lifetime draft), no API call.
- **API-ready preparation:** Define a typed payload interface in screen file (or local type module) but leave submit handler as no-op/local confirmation until backend endpoint is approved.

