# VIONA AI Receptionist Funnel Verification

## 1. Executive Summary
- Funnel Demo/Pilot hiện tại nhìn chung an toàn theo phạm vi Phase 1-4: route đã được gate, copy safety đã có, submit pilot vẫn local-only.
- Trong các màn hình funnel mục tiêu (`MerchantDashboard`, `SetupChecklist`, `DemoSimulator`, `PilotRequest`), không thấy call AI/Twilio/backend API/DB/payment/booking mutation trực tiếp cho flow demo/pilot request.
- Có file untracked bắt buộc cho funnel hiện tại (đặc biệt 2 screen mới + docs audit/contract); cần track trước khi đóng gói release branch.
- Có một điểm copy cần lưu ý: `B2BPaywallScreen` vẫn là paywall thương mại có Stripe sandbox CTA, không thuộc “pure safety funnel”; nên giữ tách biệt ngữ nghĩa để tránh hiểu nhầm pilot request = payment flow.

## 2. Funnel Map
Current intended funnel:

`MerchantDashboard` -> `AiReceptionistSetupChecklist` -> `AiReceptionistDemoSimulator` -> `AiReceptionistPilotRequest` -> local confirmation

Entry points hiện có:
- Merchant dashboard card: `View demo`, `Configure`, `Request pilot`
- Setup checklist: `View simulated demo`, `Request pilot`
- Demo simulator: `Configure setup`, `Request pilot`, `Back to merchant dashboard`
- Paywall có CTA phụ: `Continue to pilot request form`

## 3. Route / Gate Verification
| Route | File | Gate | Safe? | Notes |
|------|------|------|------|------|
| `MerchantDashboard` | `App.tsx` | `B2BWorkspaceGate` | Yes | B2B workspace access required |
| `AiReceptionistSetupChecklist` | `App.tsx` | `b2bAiReceptionistDemoEnabled || b2bAiReceptionistPilotEnabled` + `B2BWorkspaceGate` | Yes | Off state -> `MvpSurfaceDisabledScreen` |
| `AiReceptionistDemoSimulator` | `App.tsx` | `b2bAiReceptionistDemoEnabled || b2bAiReceptionistPilotEnabled` + `B2BWorkspaceGate` | Yes | Copy explicitly says simulated/local preview |
| `AiReceptionistPilotRequest` | `App.tsx` | `b2bAiReceptionistDemoEnabled || b2bAiReceptionistPilotEnabled` + `B2BWorkspaceGate` | Yes | Off state blocked by disabled screen |
| `InboundQueue` | `App.tsx` | Demo/Pilot gate + production sub-flag gate | Yes | Production actions additionally gated |
| `SmartCalendar` | `App.tsx` | Demo/Pilot gate + production sub-flag gate | Yes | Production safeguards present |

## 4. Runtime Side Effect Check
| Screen/File | API Call | DB Write | Twilio/AI Call | Payment | Booking Mutation | Result |
|------|------|------|------|------|------|------|
| `AiReceptionistSetupChecklistScreen.tsx` | No | No | No | No | No | Safe (read-only UI + flags/config) |
| `AiReceptionistDemoSimulatorScreen.tsx` | No | No | No | No | No | Safe (local simulated content only) |
| `AiReceptionistPilotRequestScreen.tsx` | No | No | No | No | No | Safe (local form state + local confirmation) |
| `MerchantDashboardScreen.tsx` (AI card path) | No direct call for AI funnel CTA | No | No | No (for AI CTA path) | No (for AI CTA path) | Safe for funnel CTA path |
| `B2BPaywallScreen.tsx` | No backend API for pilot CTA | No | No | Stripe sandbox alert + subscription helper exists | No | Mixed surface: safe for pilot CTA but also contains commercial/payment-related UX |

## 5. Consent / Privacy Check
- consent checkbox: **present** in `AiReceptionistPilotRequestScreen`
- blocked submit without consent: **yes** (inline error shown, confirmation blocked)
- local-only confirmation: **yes**
- no backend storage: **yes** (UI state only)
- copy matches contract: **mostly yes**, including full English consent meaning and local-only note
- confirmation adds consent status: **yes** (`Consent was captured locally for this demo draft.`)

## 6. Copy Safety Check
Verified core safety copy includes:
- simulated demo: **yes**
- no real call: **yes**
- no booking created: **yes**
- no payment: **yes**
- merchant confirmation required: **yes**
- AI may make mistakes: **yes**
- production requires approval/gates: **yes** (Setup + Dashboard + route gating messages)

Potential ambiguity to monitor:
- `B2BPaywallScreen` language is commercial/upgrade-heavy and references automation value; despite pilot CTA being separate, UX sequencing should avoid implying payment is required for submitting pilot intent in demo phase.

## 7. Git Hygiene
Untracked files relevant/required for this funnel currently include:
- `src/screens/b2b/AiReceptionistDemoSimulatorScreen.tsx`
- `src/screens/b2b/AiReceptionistPilotRequestScreen.tsx`
- `docs/ai-context/AI_RECEPTIONIST_LEAD_CAPTURE_CONTRACT.md`
- `docs/audit/VIONA_AI_RECEPTIONIST_PILOT_REQUEST_AUDIT.md`
- `docs/audit/VIONA_AI_RECEPTIONIST_LEAD_CAPTURE_BACKEND_PLAN.md`
- `docs/audit/VIONA_AI_RECEPTIONIST_DEMO_UX_AUDIT.md`

Tracked files modified and tied to funnel wiring:
- `App.tsx`
- `src/navigation/routes.ts`
- `src/screens/b2b/MerchantDashboardScreen.tsx`
- `src/screens/b2b/AiReceptionistSetupChecklistScreen.tsx`
- `src/screens/b2b/B2BPaywallScreen.tsx`

## 8. Typecheck / Lint
- `npm run typecheck`: **PASS**
- `npm run lint`: **PASS with warnings** (51 warnings, 0 errors; warnings appear pre-existing and not specific to this funnel work)

## 9. Remaining Risks
| Risk | Severity | Recommendation |
|------|------|------|
| Paywall copy may blur pilot-request vs paid-upgrade intent | Medium | Add explicit line in paywall pilot CTA block: pilot request submission is no-payment and local-only in current build |
| Untracked funnel files may be omitted in release branch | Medium | Track and commit all required funnel + contract docs as one reviewed change set |
| Consent currently English-only | Low | Optionally add Vietnamese equivalent below English copy while preserving contract meaning |
| No server persistence for pilot leads (by design) can lose drafts on app close | Low | Keep as Phase A by policy; communicate local-only limitation clearly (already present) |

## 10. Final Recommendation
**A. Funnel safe; track/commit and move to backend contract/lead capture later.**

Rationale:
- Safety boundaries are present and enforced in UI and navigation gates.
- No prohibited runtime side effects were detected in demo/pilot request flow.
- Contract-aligned consent/privacy behavior is in place for local-only phase.

