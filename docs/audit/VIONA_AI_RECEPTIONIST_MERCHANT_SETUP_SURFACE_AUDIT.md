# VIONA AI Receptionist Merchant Setup Surface Audit

## 1. Executive Summary
- **Recommended entry point:** `src/screens/b2b/MerchantDashboardScreen.tsx` as a new guarded card block ("Lễ Tân AI Setup & Cutover").
- **Merchant dashboard fit:** Yes. This is already the primary B2B control plane and currently links to receptionist-adjacent surfaces (`InboundQueue`, `B2BPromotionSettings`), so adding setup visibility here is consistent.
- **Existing AI Receptionist routes:** `InboundQueue` and `SmartCalendar` are already mounted and gated in `App.tsx`; `AiEye` exists but is B2C/demo-oriented camera flow, not merchant setup.
- **Need new screen?:** Yes, a small **new read-only setup screen** is recommended (e.g. `AiReceptionistSetupChecklistScreen`) for checklist/status/CTA UI without executing runtime actions.

## 2. Candidate Screens

| Screen/File | Current Purpose | Fit For AI Receptionist Setup? | Risk | Recommendation |
|-------------|-----------------|-------------------------------|------|----------------|
| `src/screens/b2b/MerchantDashboardScreen.tsx` | B2B merchant home/control surface | **High** | Low (UI-only addition) | Add entry card + status summary + CTA to setup checklist screen |
| `src/screens/b2b/InboundQueueScreen.tsx` | Queue handling for receptionist inquiries | Medium | Medium (contains action buttons that look operational) | Keep as operational/demo queue; do not use as primary setup entry |
| `src/screens/b2b/SmartCalendarScreen.tsx` | Calendar + voice receptionist operational cockpit | Medium | High (contains production-like payment/KYC/AI states) | Keep as downstream gated surface; avoid using it as first setup surface |
| `src/screens/AiEyeScreen.tsx` | Camera/vision flow (B2C oriented) | **No** | High (wrong domain and mental model) | Exclude from merchant setup |
| `src/screens/b2b/B2BPaywallScreen.tsx` | B2B pricing/upgrade toll station | Low-Medium | Medium (commercial focus, not cutover governance) | Optional secondary CTA ("Request pilot"), not checklist host |
| `src/screens/commercial/PartnerOnboardingScreen.tsx` | Partner lead onboarding | Low | Medium (pre-merchant funnel, not receptionist operations) | Do not place setup here |

## 3. Recommended UX
- Add a **new dashboard card** on `MerchantDashboardScreen`:
  - Title: "Lễ Tân AI"
  - Subtext: demo/pilot/prod state
  - Chips: `Demo`, `Pilot`, `Production Locked` / `Production Eligible`
  - CTA group: `View demo`, `Configure`, `Request pilot`
- Add a **dedicated setup checklist screen** (read-only/control UI only):
  - section A: Demo/Pilot status
  - section B: Merchant cutover checklist items from `B2B_AI_RECEPTIONIST_MERCHANT_CUTOVER_CHECKLIST`
  - section C: Production lock banner when production/sub-flags are off
  - section D: "Do not run live automation yet" safety note
- Keep `InboundQueue` and `SmartCalendar` as **post-entry operational surfaces**, not onboarding origin.
- Ensure all CTA navigation respects `App.tsx` gates so disabled states land on `MvpSurfaceDisabledScreen`, not runtime workflows.

## 4. Required Feature Flags
- `b2bAiReceptionistDemoEnabled`
- `b2bAiReceptionistPilotEnabled`
- `b2bAiReceptionistProductionEnabled`
- `b2bAutoBookingEnabled`
- `b2bAutoInventoryEnabled`
- `b2bAutoBillPrintEnabled`
- `b2bAutoPaymentEnabled`

## 5. Do Not Touch
- Prisma
- payment
- booking mutation
- Twilio
- OpenAI/Gemini
- inventory
- bill printing

## 6. Proposed Code Task
1. **Create one new screen**: `src/screens/b2b/AiReceptionistSetupChecklistScreen.tsx`
   - Read-only rendering from `src/core/ai-receptionist/aiReceptionistFeatureConfig.ts` and `src/core/ai-receptionist/merchantCutoverChecklistConfig.ts`.
   - No API mutation calls, no direct runtime integrations.
2. **Add one route** in `RootStackParamList` and mount in `App.tsx` under B2B gated group via `B2BWorkspaceGate`.
3. **Add one entry card** in `MerchantDashboardScreen` linking to the new setup checklist route.
4. **Flag-driven UI states**:
   - Demo off -> disabled card/message.
   - Pilot on/off -> status chip.
   - Production/sub-flags off -> locked banner with "coming soon / requires cutover" copy.
5. **Optional CTA wiring**:
   - `View demo` -> navigate `InboundQueue` (still gated).
   - `Configure` -> navigate checklist screen sections.
   - `Request pilot` -> `B2BPaywall` or support/contact intent (UI-only).

This is the smallest safe Phase 2 UI scope that stays aligned with the blueprint and keeps production-risk actions closed.
