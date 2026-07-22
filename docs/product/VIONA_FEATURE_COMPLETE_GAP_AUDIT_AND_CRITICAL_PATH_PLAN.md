# VIONA — Feature Complete Gap Audit and Critical Path Plan

**Operator authorization:** `APPROVE_VIONA_FEATURE_COMPLETE_GAP_AUDIT_AND_CRITICAL_PATH_PLAN`  
**Mode:** Strict read-only product / architecture audit (docs-only planning pack)  
**Canonical root:** `C:\KNG\ket-noi-eu`  
**Canonical master SHA:** `3d9fe752b567060f99de9ce3576e6d6d56f2af93`  
**Includes:** PR #406–#409 (iOS readiness remediation, expo-localization, Functions VIO label parity, blocked-safe Apple Developer evidence)  
**Branch:** `docs/viona-feature-complete-gap-audit-critical-path-plan`  
**Primary classification:** `READY_FOR_VIONA_FEATURE_COMPLETE_CRITICAL_PATH_IMPLEMENTATION`

```text
VIONA_FEATURE_COMPLETE_GAP_AUDIT
CRITICAL_PATH_PLAN
SOURCE_AND_ROUTE_REALITY_CHECKED
NO_RUNTIME_SOURCE_CHANGE
NO_DEPLOY
APPLE_EAS_PHASE_D2_DEFERRED
PHASE_C_CLOSED_GREEN_PRESERVED
PACK40DR_WAIT_STATE_PRESERVED
PACK40S_NOT_AUTHORIZED
```

---

## 0. Validation gates (read-only)

| Gate | Result |
|---|---|
| `npm run ci:expo-readiness` | **PASS** |
| `npm run ci:release-discipline` | **PASS** (includes typecheck, smoke, functions bundle verify, trust/commercial/security preflights) |
| Pre-existing Functions TypeScript debt (`"retail_taphoa"` vs `VoiceScenario`) | **Recorded separately** — not fixed in this pack; not in mobile EAS graph |
| Prisma generate / root `tsc --noEmit` | Exercised via release-discipline preflight — **PASS** |
| Modern Home Phase A/B/C | Closed green on master (docs + prior evidence) |
| SOS shell Phase 1 + Profile/Language Phase 2 | Closed green / merged on master |
| Mobile no-Prisma Local client contract | Present: `src/domain/local/localServiceRequestClientContract.ts` |
| JWT fail-closed (no `EXPO_PUBLIC_DEV_REST_JWT`) | Preserved from PR #406 lineage |
| Apple / EAS / Phase D2 | **Not reopened** |

---

## 1. Feature-complete definition (concrete gate)

VIONA is **FEATURE COMPLETE** only when all of the following are true:

1. **Each universe** (Local, Travel, Academy, Business, Account, SOS) has **one complete primary user journey** from reachable UI through active backend (or an honest, labeled free guidance journey for SOS Basic).
2. **Each paid universe** has a **working monetization boundary** (hard stop or no-charge pilot with explicit conversion path) — no unpaid unlimited expensive AI/provider usage.
3. **Expensive AI usage** has **hard quotas** enforced at runtime (not only planning registry) with graceful fallback.
4. **Authentication and account lifecycle** cover sign-up → login → logout → recovery → settings → GDPR erase; data export at least as FEATURE_COMPLETE_BLOCKER closed or explicitly deferred with severity.
5. **Critical backend routes** for primary journeys are **mounted, authorized, and verified** (automated and/or staging).
6. **No production-facing mock/placeholder** remains in core journeys (admin/dev labs may remain gated).
7. **Core failure / empty / offline** states exist on primary journeys.
8. **Operations** can inspect and safely intervene on Local requests and merchant execution without enabling unauthorized Pack40S / production dispatch.
9. **Security/privacy RELEASE_BLOCKER and FEATURE_COMPLETE_BLOCKER** items are closed.
10. **Required web + Android emulator validation** for primary journeys is complete.
11. **iOS physical validation** is **explicitly deferred** until the operator reopens Apple/EAS/Phase D2.
12. **No false production-readiness claims** (especially SOS dispatch, live Stripe default-ON, Pack40 real execution beyond narrow staging internal test-SMS).

**Scoring method (scorecard):** For each universe, score **0–4** where:  
`+1` primary journey reachable end-to-end in default product config;  
`+1` monetization/cost boundary honest and enforceable;  
`+1` no production-facing mock in that journey;  
`+1` verified on web and/or Android emulator (physical iOS not required).  
**Feature-complete threshold:** all six universes ≥ 3 **and** shared platform P0 blockers closed.  
Numeric % = `(sum of universe scores) / 24 × 100`, rounded to nearest integer.

---

## 2. Executive feature-complete scorecard

| Universe / layer | Score (0–4) | Status label | Primary blocker |
|---|---|---|---|
| Shared product shell | 3 | PARTIALLY_IMPLEMENTED → near-complete | Legacy hybrid still active; physical native Wave 2 deferred |
| Local | 2 | PARTIALLY_IMPLEMENTED | User **create** client UNWIRED; expiry job UNWIRED |
| Travel | 2 | PARTIALLY_IMPLEMENTED | Paid booking **default OFF**; discovery OK |
| Academy | 2 | PARTIALLY_IMPLEMENTED | Lite hubs + stream; not full learner journey |
| Business | 2 | PARTIALLY_IMPLEMENTED | Local inbox real; voice/marketing/catalog demo or gated |
| Account | 3 | PARTIALLY_IMPLEMENTED | Auth + erase OK; export missing; paid subscription UI stub |
| SOS | 2 | PARTIALLY_IMPLEMENTED | Basic guidance OK; Plus billing stub; no dispatch (correct) |
| **Total** | **16 / 24** | **~67%** | Not feature-complete |

**Verdict:** Product is a coherent shell with several strong islands (Modern Home, Local list/inbox, staging B2B webhook path, SOS Basic honesty). It is **not** feature-complete until Local create + AI/runtime cost hard-stops + Account export/privacy blockers + production-facing mock removal on core journeys land.

---

## 3. Six-universe capability matrix

| Capability | Implementation status | Verification | Key source proof |
|---|---|---|---|
| **LOCAL — discovery UI** | PARTIALLY_IMPLEMENTED / UI_ONLY (classifieds) | WEB_MANUAL_VERIFIED (partial) | `src/screens/b2c/LocalScreen.tsx` |
| **LOCAL — request create** | BACKEND_ONLY_NO_UI (API) + UNWIRED (client) | AUTOMATED_VERIFIED (server tests/scripts); client **none** | `POST` `src/routes/localRoutes.ts` → `LocalRequestController.postCreateLocalServiceRequest`; **no** POST in `localUserRequestApi.ts` |
| **LOCAL — user list / timeline / cancel** | IMPLEMENTED_ACTIVE_NOT_VERIFIED (full E2E product) | AUTOMATED_VERIFIED (unit/route) | `LocalUserRequestStatusScreen.tsx`, `localUserRequestApi.ts` |
| **LOCAL — merchant confirm/reject** | IMPLEMENTED_ACTIVE_NOT_VERIFIED | AUTOMATED_VERIFIED | `LocalMerchantRequestInboxScreen.tsx`, `localRoutes.ts` |
| **LOCAL — expiry apply** | UNWIRED | VERIFICATION_UNRESOLVED | `localRequestExpiryApplyService.ts` — no route/cron mount |
| **LOCAL — notifications / review / dispute** | NOT_IMPLEMENTED | — | — |
| **LOCAL — no-charge pilot** | IMPLEMENTED_ACTIVE_VERIFIED (server contract) | AUTOMATED_VERIFIED | `REQUEST_ONLY_NO_CHARGE` in create + client contract |
| **TRAVEL — discovery** | IMPLEMENTED_ACTIVE | WEB_MANUAL_VERIFIED (partial) | `TravelHubScreen`, `GET /api/tourism/discover` |
| **TRAVEL — paid checkout** | IMPLEMENTED_NOT_ACTIVE (default) | PRODUCTION_NOT_VERIFIED | Gated by `liveStripePaymentEnabled` in `App.tsx` / `featureFlags.ts` |
| **TRAVEL — held booking / merchant inbox** | IMPLEMENTED_ACTIVE (server); UI gated | STAGING_LIVE_VERIFIED (partial tourism paths) | `tourismRoutes.ts`, `TourismMerchantInboxScreen.tsx` |
| **ACADEMY — hub / AI teacher stream** | PARTIALLY_IMPLEMENTED | VERIFICATION_UNRESOLVED (full journey) | `AcademyScreen.tsx`, `LiveAiTeacherScreen.tsx`, `AiStreamClient.ts` |
| **ACADEMY — certificates** | UI_ONLY / PLACEHOLDER_OR_DEMO | — | `CertificateGenerator.tsx` |
| **ACADEMY — WebRTC tutoring** | NOT_IMPLEMENTED (Academy); WebRTC elsewhere | PHYSICAL_IOS_NOT_RUN | Travel/comms `CallScreen.tsx` |
| **BUSINESS — B2B tabs / Local inbox** | IMPLEMENTED_ACTIVE | WEB_MANUAL_VERIFIED (partial) | `MainTabNavigator.tsx`, merchant inbox |
| **BUSINESS — catalog / dashboard** | MOCK_OR_FIXTURE_ONLY / UI_ONLY | — | `MerchantDashboardScreen.tsx` in-memory catalog |
| **BUSINESS — AI receptionist production** | IMPLEMENTED_NOT_ACTIVE | STAGING_LIVE_VERIFIED (webhook read-only path) | Flags OFF; Pack34–39 staging |
| **BUSINESS — inbound voice webhook** | PLACEHOLDER_OR_DEMO | — | Functions returns **501** without JSON bridge |
| **ACCOUNT — auth lifecycle** | IMPLEMENTED_ACTIVE | WEB_MANUAL_VERIFIED (partial) | `LoginScreen`, `OtpScreen`, `authRoutes.ts` |
| **ACCOUNT — Personal Hub / language** | IMPLEMENTED_ACTIVE_VERIFIED (shell) | WEB_MANUAL_VERIFIED | `CaNhanScreen.tsx`, Phase 2 evidence |
| **ACCOUNT — wallet / VIO display** | PARTIALLY_IMPLEMENTED | AUTOMATED_VERIFIED (ledger services) | `WalletScreen.tsx`, `walletRoutes.ts`, Functions `walletOps` |
| **ACCOUNT — GDPR erase** | IMPLEMENTED_ACTIVE | AUTOMATED_VERIFIED | `POST /api/users/gdpr/erase` |
| **ACCOUNT — data export** | NOT_IMPLEMENTED | — | No export route in `userRoutes.ts` |
| **SOS — Basic entry / hold / dialer** | IMPLEMENTED_ACTIVE_VERIFIED (shell) | WEB_MANUAL_VERIFIED; ANDROID_EMULATOR_VERIFIED (Home/SOS chrome context) | `VionaGlobalSosShellAction`, `SOSModal.tsx`, `EmergencySOSScreen.tsx` |
| **SOS — trusted contacts** | PARTIALLY_IMPLEMENTED (local storage) | VERIFICATION_UNRESOLVED | `SosPlusProfileScreen.tsx` |
| **SOS — Plus billing** | PLACEHOLDER_OR_DEMO / NOT_IMPLEMENTED | — | `sosPlusModels.ts` `local_stub`; routes note not billing-backed |
| **SOS — provider dispatch** | OUT_OF_SCOPE_FOR_FEATURE_COMPLETE (until authorized Live Automation) | — | Protocol: no fake dispatch |

---

## 4. Shared-platform capability matrix

| Capability | Status | Verification | Proof |
|---|---|---|---|
| Home shell resolver | IMPLEMENTED_ACTIVE_VERIFIED | WEB + ANDROID_EMULATOR | `fashionHomeShellMode.ts`, Phase A–C evidence |
| Mobile / tablet / desktop Home | IMPLEMENTED_ACTIVE_VERIFIED | WEB_MANUAL_VERIFIED | `HomeScreen.tsx` |
| Native adaptive Home | IMPLEMENTED_ACTIVE_VERIFIED | ANDROID_EMULATOR_VERIFIED; PHYSICAL_ANDROID blocked; PHYSICAL_IOS_NOT_RUN | Phase C / D1 / iOS EAS evidence |
| Six-universe navigation | IMPLEMENTED_ACTIVE | WEB_MANUAL_VERIFIED | `MainTabNavigator.tsx` |
| Left rail / bottom nav | IMPLEMENTED_ACTIVE_VERIFIED | WEB_MANUAL_VERIFIED | `MainTabNavigator.tsx` |
| Deep links | IMPLEMENTED_ACTIVE | VERIFICATION_UNRESOLVED (full matrix) | `App.tsx` `rootLinking` |
| Exact-one SOS / Profile / Language | IMPLEMENTED_ACTIVE_VERIFIED | WEB_MANUAL_VERIFIED | `vionaGlobalSosShellVisibility.ts`, Phase 1–2 evidence |
| Auth entry | IMPLEMENTED_ACTIVE | WEB_MANUAL_VERIFIED | Stack: Login / Otp / Role / SetupProfile |
| B2C/B2B role switch | IMPLEMENTED_ACTIVE | WEB_MANUAL_VERIFIED | `ProfileSwitcher.tsx`, `userStore.ts` |
| Personal Hub | IMPLEMENTED_ACTIVE | WEB_MANUAL_VERIFIED | `PersonalHub` → `CaNhanScreen.tsx` |
| Legacy Home fallback | IMPLEMENTED_ACTIVE | ANDROID_EMULATOR_VERIFIED | `viona-home-legacy-hybrid-root` retained by design |
| Feature-flag MVP gates | IMPLEMENTED_ACTIVE | AUTOMATED_VERIFIED | `featureFlags.ts`, `mvpGateByFlag` |
| Offline / empty / error (global) | PARTIALLY_IMPLEMENTED | VERIFICATION_UNRESOLVED | Per-screen; not universal |
| Accessibility | PARTIALLY_IMPLEMENTED | VERIFICATION_UNRESOLVED | No dedicated a11y suite found as product gate |
| Web / native parity | PARTIALLY_IMPLEMENTED | ANDROID_EMULATOR_VERIFIED; PHYSICAL_IOS_NOT_RUN | Phase C; Wave 2 not run |

---

## 5. Active versus source-only feature matrix

| Feature | Active in default product? | Source exists? | Notes |
|---|---|---|---|
| Modern Home adaptive | **Yes** | Yes | Closed green Phase C |
| Local list / inbox / cancel | **Yes** (when provisioned) | Yes | Create missing on client |
| Local create API | Server **yes** / Client **no** | Yes (server) | Primary journey broken |
| Tourism discovery | **Yes** | Yes | |
| Tourism live Stripe checkout | **No** (flag OFF) | Yes | Correct fail-closed default |
| Academy lite + AI stream | **Yes** (flag ON) | Yes | Not full product journey |
| B2B dashboard tabs | **Yes** | Yes | Much demo data |
| B2B production receptionist / auto-book | **No** | Partial | Flags OFF; voice 501 |
| VIONA Request inbox (parallel engine) | Role/admin gated | Yes | Separate from LocalServiceRequest |
| Pack40D internal Twilio test-SMS | Staging internal only | Yes | Production hard-blocked |
| Pack40S | **No** | Plan only | NOT AUTHORIZED |
| AssistantChat / Concierge | **No** | Yes | Typed in `routes.ts`; **not mounted** in `App.tsx` |
| Cash-out / VIG economy | **No** | Yes | Flag OFF |
| SOS Plus paid | **No** | Spec + stub UI | |
| Reference labs | Dev flag | Yes | |

---

## 6. Monetization and unit-economics matrix

| Stream | Payer | Value | Trigger | Price model | Cost driver | Margin risk | Abuse risk | Backend required | Status |
|---|---|---|---|---|---|---|---|---|---|
| Local no-charge pilot | — | Request lifecycle | Create/confirm | Free pilot | Ops time | Low (by design) | Spam requests | Local API + expiry + rate limit | PARTIALLY_IMPLEMENTED |
| Local paid conversion (future) | User/merchant | Guaranteed fulfillment | Post-pilot | Fee / commission | Payments + escrow | Medium | Chargeback | Stripe + wallet | NOT_IMPLEMENTED (conversion) |
| Travel booking commission | Traveler | Real booking | Checkout | Commission | Stripe + inventory | High if unpaid AI | Fraud | Live Stripe + settlement | IMPLEMENTED_NOT_ACTIVE |
| Academy AI usage | Learner | Tutor time | Stream/message | Credits / sub | OpenAI | **High** if uncapped | Prompt abuse | Quotas + wallet charge | UNIT_ECONOMICS_CONDITIONALLY_SAFE (partial charging; registry not productionReady) |
| Business SaaS / paywall | Merchant | Inbox + tools | Role access | Subscription | Support + AI | Medium | Shared accounts | Stripe subscription | PARTIALLY_IMPLEMENTED / UI |
| AI receptionist | Merchant | Lead handling | Webhook / voice | SaaS + usage | LLM + Twilio | **High** if voice ON | Looping calls | Quotas + flags | UNIT_ECONOMICS_CONDITIONALLY_SAFE (staging read-only) |
| VIO Credits top-up | User | Wallet balance | Purchase | Pack | Stripe webhook | Medium | Double-credit | `walletOps` + Stripe | PARTIALLY_IMPLEMENTED |
| SOS Basic | — | Guidance + dialer | Hold | Free | — | Low | Accidental tap (mitigated) | Shell only | IMPLEMENTED_ACTIVE |
| SOS Plus | User | Trusted contacts / extras | Subscribe | Recurring | Support | Medium | False urgency | Stripe SKU | NOT_IMPLEMENTED |
| Broker commissions | Broker | Network take | Attributed sale | Commission | — | — | Fake attribution | Ledger | MOCK_OR_FIXTURE_ONLY |

### Recommended minimum viable monetization architecture (plan only — not implemented)

1. Keep **Local** on `REQUEST_ONLY_NO_CHARGE` until create+expiry+rate-limit are live; then add optional paid boost — never unpaid provider automation.
2. Keep **Travel/Fixer checkout** behind explicit live-Stripe flag until inventory + refund path verified.
3. Enforce **runtime AI hard caps** (per user/day + per tenant/month) on all OpenAI/Twilio entry points before any default-ON production AI surface.
4. Sell **Business** as: Local merchant inbox + staging-proven webhook receptionist (read-only tools) + paywall — not voice auto-booking.
5. Ship **SOS Plus** only as billing-backed entitlement after Basic remains free and labeled.
6. **VIO Credits** remain the single consumer AI budget rail; display labels must stay ledger-honest (PR #408 preserved).

---

## 7. AI cost-exposure matrix

| Capability | Provider | Who pays | Exposure | User quota | Plan limit | Hard stop | Fallback | Monetization link | Economics class |
|---|---|---|---|---|---|---|---|---|---|
| Leona / B2C assistant | OpenAI / Functions `aiProxy` | Platform unless credits | Medium–High | Registry planning defaults | Registry | Partial (RPM in Functions); UI not all wired | Mock delay / error | Credits / upgrade flags | COST_MODEL_UNRESOLVED → treat as **UNIT_ECONOMICS_UNSAFE** until runtime enforce |
| Academy stream | WSS academy stream | Platform / credits | High | Partial screen charge | Unclear | Unresolved | Disconnect | Credits | UNIT_ECONOMICS_CONDITIONALLY_SAFE |
| Live interpreter | Provider adapter | User (upgrade) | Medium | Registry | Gated | Flag gate | Blocked UI | Upgrade | UNIT_ECONOMICS_CONDITIONALLY_SAFE |
| B2B receptionist (staging webhook) | OpenAI on Fly | Platform (staging) | Medium | Staging ops | Staging | Stage gate | Honest “not configured” | Future SaaS | UNIT_ECONOMICS_CONDITIONALLY_SAFE |
| B2B voice inbound | Twilio + LLM | Platform if enabled | **Very High** | None production | Flag OFF | 501 / flags | Fail closed | SaaS+usage | UNIT_ECONOMICS_UNSAFE if enabled without caps |
| Content / marketing gen | OpenAI / fixtures | Ops | Medium | Admin only | — | Admin gate | Mock feeds | — | MOCK_OR_FIXTURE_ONLY |
| VIONA real execution | Twilio / OpenAI | Platform | High | Pack gates | Pack40 narrow | Deployment stage middleware | Mock adapters | Escrow Pack31 | UNIT_ECONOMICS_CONDITIONALLY_SAFE (staging internal only) |

**Registry note:** `src/core/aiCost/aiCostGuardRegistry.ts` — all listed features `productionReady: false`; caps are **planning defaults**, not proof of runtime enforcement on every UI path. Functions `AI_PROXY_MAX_RPM` exists for proxy RPM — insufficient alone for product FC.

---

## 8. Backend and operations matrix

| Area | Status | Notes |
|---|---|---|
| Express mount (`src/app.ts`) | IMPLEMENTED_ACTIVE | `/api/auth`, `/local`, `/tourism`, `/viona`, `/wallet`, `/pay`, `/edu`, `/ai`, `/business`, `/broker`, `/internal`, `/admin`, … |
| AuthN / AuthZ | IMPLEMENTED_ACTIVE | JWT session; role gates; internal stage gate |
| Idempotency | PARTIALLY_IMPLEMENTED | Present on money/local paths selectively |
| Local expiry job | UNWIRED | Services exist; no scheduler/HTTP |
| Notifications (email/SMS/push) | PARTIALLY_IMPLEMENTED | Push token routes; Local lifecycle notifications missing |
| Webhook verification | IMPLEMENTED_ACTIVE (staging verified) | Pack36A+ merchant webhook |
| Pack40 recovery | PARTIALLY_IMPLEMENTED / DEFERRED_BY_OPERATOR | DR endpoint safety PASS; functional recovery blocked on fixture; **Pack40S NOT AUTHORIZED** |
| Observability | PARTIALLY_IMPLEMENTED | Sentry plugin present; org/project env fallback |
| Feature flags | IMPLEMENTED_ACTIVE | Fail-closed defaults for money/production AI |
| Staging | IMPLEMENTED_ACTIVE_VERIFIED (selected packs) | `viona-api-staging-eu` |
| Production deploy / real execution | DEFERRED_BY_OPERATOR / hard-blocked | Do not claim readiness |
| Admin/ops tools | PARTIALLY_IMPLEMENTED | LocalOpsAudit; many admin screens mock |

---

## 9. Security / privacy blocker matrix

| Gap | Severity | Status |
|---|---|---|
| Public JWT fail-closed | RELEASE_BLOCKER (closed) | Closed in PR #406 lineage |
| Mobile Prisma boundary | RELEASE_BLOCKER (closed for Local client) | Client contract; re-verify on native builds |
| Account data export (GDPR) | FEATURE_COMPLETE_BLOCKER | NOT_IMPLEMENTED |
| Account deletion (erase) | — | IMPLEMENTED_ACTIVE |
| Consent / privacy policy coverage | BETA_BLOCKER | Partial product surfaces; legal cert out of scope |
| Emergency / location data retention policy | FEATURE_COMPLETE_BLOCKER | Spec honesty OK; retention ops unresolved |
| AI prompt/response storage retention | BETA_BLOCKER | Unresolved product policy |
| Child/education data (Academy) | FEATURE_COMPLETE_BLOCKER if under-13 marketed | Unresolved |
| Payment data (Stripe) | RELEASE_BLOCKER when live payments ON | Webhook path exists; client gated OFF |
| Secret boundaries / no secrets in evidence | — | Preserved this pack |
| Cookie/web consent | OPTIONAL / POST_BETA | Unresolved |
| Pack40 unauthorized trigger enablement | RELEASE_BLOCKER if violated | Must remain gated |

---

## 10. Test and verification matrix

| Layer | Status |
|---|---|
| Unit / content-scan / pack regression scripts | Broad VIONA pack coverage (Pack29–40*) |
| Integration / API | Strong on Local + VionaRequest + B2B staging packs |
| UI / web visual QA | Modern Home + SOS shell browser gates green |
| Android emulator QA | Phase C **PASS** |
| Android physical QA | Phase D1 **BLOCKED_NO_STABLE_PHYSICAL_ANDROID_DEVICE** |
| iOS physical QA | **PHYSICAL_IOS_NOT_RUN** |
| Staging live QA | Pack36A–40D/DR safety selected paths |
| Production verification | **PRODUCTION_NOT_VERIFIED** (intentional) |
| Performance / a11y / security suites | PARTIAL / VERIFICATION_UNRESOLVED as FC gates |
| Recovery tests | Pack40DRS0 safety PASS; functional recovery blocked |

### Deferred Apple / iOS lane (not implementation bugs)

| Marker | Status |
|---|---|
| `APPLE_DEVELOPER_ACCESS_DEFERRED_BY_OPERATOR` | Active — no Apple teams for Expo account (PR #409) |
| `IOS_EAS_DEVELOPMENT_BUILD_DEFERRED` | Active — no build started |
| `IOS_PHYSICAL_PHASE_D2_NOT_RUN` | Active — unauthorized |

---

## 11. Mock / placeholder / unwired inventory

| ID | Class | Item | Proof |
|---|---|---|---|
| M1 | UNWIRED / CONTAINED | Local request create client | Create client + UUID/guard on master; Tourism coupling contained (PR #414); **provider eligibility authority missing** → `PROVIDER_SELECTION_UNAVAILABLE` |
| M2 | UNWIRED | Local expiry apply job | Service only |
| M3 | UNWIRED | AssistantChat / Concierge / Discover / Services stack | Not in `App.tsx` |
| M4 | MOCK_OR_FIXTURE_ONLY | Broker / war room / admin profit | Mock dashboards |
| M5 | MOCK_OR_FIXTURE_ONLY | Merchant dashboard catalog/radar | In-memory |
| M6 | MOCK_OR_FIXTURE_ONLY | Viral wrap offline | `MOCK_WRAP` |
| M7 | MOCK_OR_FIXTURE_ONLY | VIONA mock payment adapter | Dev-only; prod hard-blocked |
| M8 | PLACEHOLDER_OR_DEMO | B2B inbound voice | Functions **501** |
| M9 | PLACEHOLDER_OR_DEMO | Stripe subscription cancel demo | `StripeSubscriptionService.ts` |
| M10 | PLACEHOLDER_OR_DEMO | SOS Plus billing | `local_stub` |
| M11 | UI_ONLY | Local classifieds VIP composer | Not LocalServiceRequest API |
| M12 | NOT_IMPLEMENTED | Local reviews / disputes | — |
| M13 | NOT_IMPLEMENTED | GDPR data export | — |
| M14 | GATED_OFF | Live Stripe tourism/fixer | Default OFF |
| M15 | GATED_OFF | B2B production automation flags | Default OFF |
| M16 | DEFERRED_BY_OPERATOR | Pack40S | NOT AUTHORIZED |
| M17 | DEFERRED_BY_OPERATOR | Pack40DR functional recovery | Wait for fixture |

---

## 12. P0 / P1 critical-path roadmap

### Primary critical path (smallest sequence to feature-complete)

| Order | Pack | Priority | Scope | Size | Parallel? | Auth phrase |
|---|---|---|---|---|---|---|
| 0a | **FC-P0 Local create client + containment lineage** | P0 (done partial) | Local | — | MERGED | PR #412 create client; #413 UUID/guard; #414 Tourism coupling containment **verified on master** — create UI still `PROVIDER_SELECTION_UNAVAILABLE` |
| 0b | **FC-P0-LOCAL-PROVIDER-ELIGIBILITY-AUTHORITY-BOUNDARY** | P0 (docs) | Local | S | PR #415 MERGED @ `dc5c625` | plan phrase |
| 0c | **FC-P0-LOCAL-PROVIDER-AUTHORITY-PLAN-LIFECYCLE-REMEDIATION** | P0 (docs) | Local | S | PR #416 MERGED @ `435ddcd0f59b6e9295755398a54482788d7948ed` | lifecycle remediation |
| 0d | **FC-P0-LOCAL-PROVIDER-AUTHORITY-AUDIT-READINESS-REMEDIATION** | P0 (docs) | Local | S | PR #417 MERGED @ `d3bd2935b7ff8029eb5e4c96869c70f1bf1a54ac`; reviewed head `c581a78`; strict review blocked timestamps/referential/PATCH | audit readiness |
| 0e | **FC-P0-LOCAL-PROVIDER-AUTHORITY-TIMESTAMP-REFERENTIAL-PATCH-FINALIZATION** | P0 (docs) | Local | S | Locks timestamps, Restrict graph, REGISTERED prior-list, PATCH matrix | `APPROVE_VIONA_FC_P0_LOCAL_PROVIDER_AUTHORITY_PLAN_TIMESTAMP_REFERENTIAL_PATCH_FINALIZATION` |
| 1 | **FC-P0-LOCAL-PROVIDER-ELIGIBILITY-AUTHORITY-SCHEMA-DOMAIN (A1)** | P0 | Local | M | After 0e merge+verify | `APPROVE_VIONA_FC_P0_LOCAL_PROVIDER_ELIGIBILITY_AUTHORITY_SCHEMA_DOMAIN_ENFORCEMENT` |
| 1a | **FC-P0-LOCAL-PROVIDER-ELIGIBILITY-AUTHORITY-READ-OPS (A2)** | P0 | Local | M | After A1 verified | `APPROVE_VIONA_FC_P0_LOCAL_PROVIDER_ELIGIBILITY_AUTHORITY_READ_OPS_ROUTES` |
| 1b | **FC-P0-LOCAL-PROVIDER-AUTHORITY-CLIENT-WIRING (B)** | P0 | Local | M | After A2 verified | `APPROVE_VIONA_FC_P0_LOCAL_PROVIDER_AUTHORITY_CLIENT_WIRING` |
| 2 | **FC-P0-AI-RUNTIME-COST-HARD-STOP** | P0 | Shared AI | L | After Local FC-P0 closure (1b verified) | `APPROVE_VIONA_FC_P0_AI_RUNTIME_COST_HARD_STOP` |
| 3 | **FC-P0-ACCOUNT-GDPR-EXPORT** | P0 | Account | S | After or with 2 | `APPROVE_VIONA_FC_P0_ACCOUNT_GDPR_EXPORT` |
| 4 | **FC-P1-LOCAL-EXPIRY-AND-RATE-LIMIT** | P1 | Local | M | After Local create closed | `APPROVE_VIONA_FC_P1_LOCAL_EXPIRY_AND_RATE_LIMIT` |
| 5 | **FC-P1-CORE-JOURNEY-MOCK-REMOVAL** | P1 | Local/Business UI honesty | M | Parallel with 4 | `APPROVE_VIONA_FC_P1_CORE_JOURNEY_MOCK_REMOVAL` |
| 6 | **FC-P1-TRAVEL-DISCOVERY-PRIMARY-JOURNEY** | P1 | Travel (non-paid or held path) | M | Parallel | `APPROVE_VIONA_FC_P1_TRAVEL_PRIMARY_JOURNEY` |
| 7 | **FC-P1-ACADEMY-PRIMARY-LEARNER-SLICE** | P1 | Academy | M | Parallel | `APPROVE_VIONA_FC_P1_ACADEMY_PRIMARY_LEARNER_SLICE` |
| 8 | **FC-P1-BUSINESS-MERCHANT-VALUE-SLICE** | P1 | Business | L | After Local create closed | `APPROVE_VIONA_FC_P1_BUSINESS_MERCHANT_VALUE_SLICE` |
| 9 | **FC-P1-MONETIZATION-BOUNDARY-WIRE** | P1 | Shared | L | After AI hard-stop | `APPROVE_VIONA_FC_P1_MONETIZATION_BOUNDARY_WIRE` |
| 10 | **FC-P2-SOS-PLUS-BILLING-OR-DEFER** | P2 | SOS | M | Later | `APPROVE_VIONA_FC_P2_SOS_PLUS_BILLING_OR_EXPLICIT_DEFER` |
| 11 | **FC-P2-WEB-ANDROID-FC-QA** | P2 | Shared QA | M | After P0/P1 | `APPROVE_VIONA_FC_P2_WEB_ANDROID_FEATURE_COMPLETE_QA` |

iOS/Apple packs remain **out of this critical path** until operator reopens the lane.

**FC-P0 Local create status:** **STILL BLOCKED** — Tourism coupling contained (PR #414); missing Local provider eligibility authority. AI hard-stop and GDPR export remain **after** Local FC-P0 closure. No deploy/live QA authorized. Apple/EAS/Phase D2 deferred.

### Pack cards (P0–P1 detail)

#### FC-P0-LOCAL-PROVIDER-ELIGIBILITY-AUTHORITY (current critical blocker)

| Field | Value |
|---|---|
| Universe | Local |
| Problem | First-time B2C create cannot select a Local-eligible provider; Tourism discover rejected; no schema/route authority |
| Boundary plan | `docs/product/VIONA_FC_P0_LOCAL_PROVIDER_ELIGIBILITY_AUTHORITY_BOUNDARY_AND_IMPLEMENTATION_PLAN.md` |
| Architecture | Minimal `LocalProviderEligibility` 1:1 Business; ops/superAdmin owner; `GET /api/local/providers`; create-service enforcement |
| Next impl phrase | `APPROVE_VIONA_FC_P0_LOCAL_PROVIDER_ELIGIBILITY_AUTHORITY_SCHEMA_DOMAIN_ENFORCEMENT` (**unauthorized** until timestamp/referential/PATCH finalization reviewed/merged/verified) |
| Client wiring phrase | `APPROVE_VIONA_FC_P0_LOCAL_PROVIDER_AUTHORITY_CLIENT_WIRING` (after A2 verified) |
| Lifecycle remediation | `docs/product/VIONA_FC_P0_LOCAL_PROVIDER_AUTHORITY_PLAN_LIFECYCLE_WRITE_AUDIT_CONSISTENCY_REMEDIATION.md` (PR #416 MERGED) |
| Audit readiness remediation | `docs/product/VIONA_FC_P0_LOCAL_PROVIDER_AUTHORITY_PLAN_AUDIT_MODEL_AND_IMPLEMENTATION_READINESS_REMEDIATION.md` (PR #417 MERGED) |
| Timestamp/referential/PATCH finalization | `docs/product/VIONA_FC_P0_LOCAL_PROVIDER_AUTHORITY_PLAN_TIMESTAMP_REFERENTIAL_PATCH_FINALIZATION.md` (**authoritative**) |

#### FC-P0-LOCAL-REQUEST-CREATE-CLIENT (lineage — partial)

| Field | Value |
|---|---|
| Universe | Local |
| Problem | Backend create exists; mobile/web user cannot submit LocalServiceRequest via product UI/API client |
| Exact outcome | User can create a no-charge Local request from the locked host surface; list/timeline/cancel continue to work; merchant can confirm/reject |
| **Implementation boundary** | **LOCKED** — see `docs/product/VIONA_FC_P0_LOCAL_REQUEST_CREATE_CLIENT_IMPLEMENTATION_BOUNDARY_ADDENDUM.md` (resolves `BLOCKED_LOCAL_CREATE_IMPLEMENTATION_BOUNDARY_UNRESOLVED`) |
| Exact entry surface | Reach: `TabLocal`/`LocalScreen` → `local-tile-my-requests` → stack `LocalUserRequestStatus`. Host: `LocalUserRequestStatusScreen` in-screen create composer (**no new Stack.Screen**). Reject Leona booking-assist, classifieds VIP, merchant inbox, VionaRequest inbox |
| Exact endpoint | `POST /api/local/requests` — `authMiddleware` → `createLocalMutationRateLimiter('create_request')` → `postCreateLocalServiceRequest` → `createLocalServiceRequest`; success **201** |
| Exact DTO | Required: `businessId`, `serviceType`, `title`, `source: "LOCAL_SCREEN"`; optional fields per controller; forbidden keys = `DANGEROUS_LOCAL_REQUEST_CREATE_BODY_KEYS`; identity/status/wallet server-derived |
| Auth | Session JWT via `getRestApiJwt` / `restApiFetchJson`; no `EXPO_PUBLIC_DEV_REST_JWT`; server `req.authUserId` only |
| UI states | `IDLE` → `VALIDATION_ERROR` / `SUBMITTING` / `CREATED_SUCCESS` / `AUTH_REQUIRED_OR_EXPIRED` / `RATE_LIMITED` / `SERVER_VALIDATION_ERROR` / `NETWORK_RESULT_UNKNOWN` / `SERVER_ERROR` |
| Duplicate-submit | Rate limit ≠ idempotency; one in-flight POST; no auto-retry; `NETWORK_RESULT_UNKNOWN` → refresh list before any manual resubmit; no schema idempotency key in FC-P0 |
| Post-create | Stay on `LocalUserRequestStatusScreen`; refresh list; expand created `id` (exactly one destination) |
| Lineage | PR #412 MERGED; #413 MERGED (UUID/guard); #414 MERGED+VERIFIED (Tourism containment). **Provider authority still missing** → FC-P0 still blocked |
| Dependencies | Provider eligibility Pack A then Pack B (see boundary plan) |
| Allowed | Paths listed in boundary addendum §10 |
| Forbidden / non-goals | Boundary addendum §11 (payment, schema, Pack40S, Apple/EAS/D2, deploy, AI create path, etc.) |
| Required tests | Boundary addendum §12 (18 focused items) |
| Deploy boundary | `IMPLEMENTATION_ONLY_NO_DEPLOY` — staging live create QA needs separate auth |
| Size | **M** |
| Parallel | No (first) |
| Implementation phrase | `APPROVE_VIONA_FC_P0_LOCAL_REQUEST_CREATE_CLIENT` — **still unauthorized** until boundary addendum review + merge + verify |

#### FC-P0-AI-RUNTIME-COST-HARD-STOP

| Field | Value |
|---|---|
| Problem | `aiCostGuardRegistry` planning-only; expensive surfaces can run without proven hard commercial stop |
| Outcome | Every default-ON AI entry enforces per-user/day hard cap + fail-closed when over; metering recorded |
| Allowed | AI proxy / usage meter / feature gates / wallet charge hooks; docs |
| Forbidden | Enabling B2B voice production; Pack40S; SOS Live Automation |
| Size | **L** |

#### FC-P0-ACCOUNT-GDPR-EXPORT

| Field | Value |
|---|---|
| Problem | Erase exists; export missing |
| Outcome | Authenticated user can export personal data package via API + Account UI entry |
| Size | **S** |

#### FC-P1-LOCAL-EXPIRY-AND-RATE-LIMIT

| Field | Value |
|---|---|
| Problem | Expiry services unwired; spam risk on free pilot |
| Outcome | Scheduled or ops-triggered expiry apply + create rate limits |
| Forbidden | Unauthorized recovery triggers |
| Size | **M** |

#### FC-P1-CORE-JOURNEY-MOCK-REMOVAL

| Field | Value |
|---|---|
| Problem | Classifieds/VIP and merchant dashboard demo data can be mistaken for live product |
| Outcome | Core Local/Business journeys either wire to real APIs or show honest empty/preview labels; mocks demoted to labs |
| Size | **M** |

#### Remaining P1 packs

- **Travel:** one complete discovery → intent (or held booking when flag ON) journey with honest payment labeling.  
- **Academy:** one complete lesson+progress slice with quota.  
- **Business:** merchant can onboard + use Local inbox + webhook receptionist without operator file edits; catalog not fake-success.  
- **Monetization wire:** VIO credit spend on AI + Business paywall + explicit SOS Plus deferral or Stripe SKU.

### P2 / P3 (post primary path)

- Empty/offline/error hardening, a11y, observability dashboards  
- Mount or delete orphan AssistantChat/Concierge routes  
- Pack36B Merchant Admin UI (deferred)  
- Physical Android when device available; iOS when Apple team linked  

---

## 13. Deferred Apple / iOS lane record

| Item | Classification |
|---|---|
| Apple Developer team | `BLOCKED_APPLE_DEVELOPER_ACCOUNT_UNAVAILABLE` (PR #409 @ `3d9fe75`) |
| EAS iOS development build | Not started |
| Device registration / credentials | Not started |
| Phase D2 | Unauthorized / not run |
| Treatment in FC plan | **OUT_OF_SCOPE_FOR_FEATURE_COMPLETE** until operator reopens — not scored as implementation defect |

---

## 14. Recommended single next implementation pack

**Immediate docs gate:** Local provider authority timestamp / referential / PATCH finalization.  
Phrase: `APPROVE_VIONA_FC_P0_LOCAL_PROVIDER_AUTHORITY_PLAN_TIMESTAMP_REFERENTIAL_PATCH_FINALIZATION`

**Immediate next implementation pack (unauthorized until that finalization is reviewed, merged, and verified):**  
**`FC-P0-LOCAL-PROVIDER-ELIGIBILITY-AUTHORITY-SCHEMA-DOMAIN` (Pack A1)**  
Phrase: `APPROVE_VIONA_FC_P0_LOCAL_PROVIDER_ELIGIBILITY_AUTHORITY_SCHEMA_DOMAIN_ENFORCEMENT`

Canonical (authoritative): `docs/product/VIONA_FC_P0_LOCAL_PROVIDER_AUTHORITY_PLAN_TIMESTAMP_REFERENTIAL_PATCH_FINALIZATION.md`  
Prior: PR #417 audit readiness MERGED @ `d3bd2935b7ff8029eb5e4c96869c70f1bf1a54ac`  
Parent plan: `docs/product/VIONA_FC_P0_LOCAL_PROVIDER_ELIGIBILITY_AUTHORITY_BOUNDARY_AND_IMPLEMENTATION_PLAN.md` (PR #415)

Sequence: **A1 (schema/domain/create enforce) → A2 (read/ops routes) → B (client wiring)**.  
FC-P0 still blocked. AI hard-stop after Local FC-P0 closure. No Apple/Pack40S/deploy.

---

## 15. Audit method notes

- Source truth preferred over docs; docs used for verification status.  
- “Source exists” ≠ “active” ≠ “verified” — kept separate.  
- Capability matrix `preview` labels for Travel/Academy/Account remain directionally correct for unpaid/final-authority claims.  
- Pack40D staging internal Twilio test-SMS is **not** global real-execution readiness.  
- No secrets printed.

---

## 16. Exact changed paths (this pack)

- `docs/product/VIONA_FEATURE_COMPLETE_GAP_AUDIT_AND_CRITICAL_PATH_PLAN.md`
- `docs/ai-context/VIONA_KERNEL_HANDOFF_FAST_SAFE_GLOBAL_MODE.md`
- `Handoff_VIONA11726.txt`

## 17. Final classification

`READY_FOR_VIONA_FEATURE_COMPLETE_CRITICAL_PATH_IMPLEMENTATION`
