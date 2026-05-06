# VIONA Pack Z Global Production Gate Audit

**Audit date:** 2026-05-06  
**Branch:** `pack-z-global-production-gate-audit`  
**Scope:** Documentation synthesis + repo validation + read-only ripgrep-style evidence (no application logic changes, no Prisma/migrations, no API/auth/payment/booking changes).

---

## 1. Executive Summary

### Current maturity level

VIONA is **strong on engineering discipline and safety posture for demo/pilot**: Expo config resolves, TypeScript passes, release discipline and commercial/security/trust prefights run clean, and **AI cost / usage / auto-pause / admin-alert / incident / Twilio sandbox** foundations are present with **automated readiness scripts** that pass. Product copy and guard registries still **explicitly frame** many flows as **demo, pilot, gated, or manual-ops-required**. The **AI cost guard registry** marks **every** tracked feature with `productionReady: false`, including frozen `outboundMarketingDraft`.

### Recommended next gate

**Operate at “Internal demo + controlled merchant pilot rehearsal”** with **manual ops in the loop**, **no production Twilio**, **no production AI tool actions**, and **no flip of metering/alerts/incident paths to live DB or real outbound notifications** until dedicated packs complete those transitions with explicit approvals.

### Top 5 blockers

1. **All `productionReady: false`** in `AI_COST_GUARD_REGISTRY` — production AI cost posture is planning/dry-run aligned, not signed off for global production AI spend.
2. **AI usage metering / admin alerts / incidents / auto-pause** are validated as **modules + runbooks + UI preview/dry-run**, not as **authoritative DB-backed production enforcement** (per prior pack intent; no migration in this audit).
3. **Twilio / voice production**: repo is **sandbox-readiness** oriented; real pilot voice requires **credentials, consent, recording policy**, and ops approval — not toggled here.
4. **Payment / ledger / Stripe / booking / broker**: codepaths exist (wallet, booking UI, broker service) but **global production go** requires **legal, reconciliation, refund/chargeback ops**, and **server-authoritative** verification outside this audit.
5. **Lint debt (50 warnings)** and **legacy brand strings** (`ViGlobal`, `Kết Nối Global`, `KNG` in places) — UX/trust consistency risk for public beta.

### Top 5 strengths

1. **CI-style scripts** for expo, ops pilot docs, AI cost firewall, usage metering, Twilio sandbox anchors, auto-pause, admin alerts, incidents — all **PASS** in baseline run.
2. **Clear pilot/demo language** in locale strings (e.g. `vi.json`) stating **no production automation**, **manual ops**, **no AI payment** in pilot — aligns with safety narrative.
3. **`aiCostGuardRegistry`** gives structured caps, units, risk labels — good CFO/cost firewall scaffolding.
4. **Mini-app registry + Smart Trio core files** present under `src/core/miniapps` and `src/core/i18n`.
5. **Trust / commercial / native Firebase** prefights integrated into `ci:release-discipline` path.

---

## 2. Validation Results

Commands run on **Windows**, repo `c:\KNG\ket-noi-eu`, after `npm ci`.

| Command | Result | Notes |
|--------|--------|--------|
| `npm ci` | **PASS** | Exit 0; npm reported 4 moderate audit advisories (not auto-fixed). |
| `npm run ci:expo-readiness` | **PASS** | `[expo-readiness-check] PASS`. Sentry plugin warns missing org/project in config (env fallback). Loads `.env` / `.env.local` during check — operators should avoid sharing logs containing keys. |
| `npm run typecheck` | **PASS** | `prisma generate` + `tsc --noEmit` exit 0. |
| `npm run lint` | **PASS (warnings)** | **0 errors, 50 warnings** (unused vars, hook deps, import order, unused eslint-disable, etc.). |
| `npm run ci:release-discipline` | **PASS** | Chains expo readiness, native firebase prep, security + commercial prefights, trust native + preflight:release (typecheck, smoke, functions bundle, trust-preflight). |
| `npm run ops:readiness` | **PASS** | Commercial pilot ops doc anchors + `.env.example` key names. |
| `npm run ai:cost-readiness` | **PASS** | 9 features, registry + runbook. |
| `npm run twilio:sandbox-readiness` | **PASS** | Pilot lanes, runbook, telephony sources. |
| `npm run ai:usage-readiness` | **PASS** | Metering types, pure meter, fixtures, runbook. |
| `npm run ai:usage-preview-readiness` | **PASS** | Preview component, i18n, audit doc. |
| `npm run ai:auto-pause-readiness` | **PASS** | aiEnforcement dry-run + runbook. |
| `npm run ai:admin-alert-readiness` | **PASS** | aiAlerts dry-run + runbook + i18n anchors. |
| `npm run incident:dry-run-readiness` | **PASS** | incidents dry-run + panel + runbook + i18n. |
| `npm run gate:production-readiness` | **PASS** | After adding `scripts/global-production-gate-check.mjs` + package script (see §11). |

---

## 3. Gate Matrix

| Gate | Status | Evidence | Blocker | Recommendation |
|------|--------|----------|---------|----------------|
| **Internal demo** | **Conditional** | Typecheck + smoke + expo readiness green; B2C/B2B surfaces navigable; demo/pilot copy explicit. | 50 ESLint warnings; Sentry not fully configured in expo plugin; Mapbox tokens empty in sampled config output. | **Go** for **staff-only** demo with scripted flows; fix high-noise warnings in a dedicated hygiene pack if demo recording is imminent. |
| **Controlled merchant pilot** | **Conditional** | Ops runbook anchors; telephony pilot registry + Twilio sandbox doc check; AI Receptionist pilot UX + manual-ops strings; commercial preflight passes. | No **`productionReady: true`** cost features; Twilio/voice not executed in this validation; real merchant SLA needs **human queue** + **legal intake**. | Run **pilot with manual confirmation** only; follow `VIONA_COMMERCIAL_PILOT_*` docs; no autonomous booking/payment claims. |
| **Public beta** | **Fail** | Core app builds in CI discipline. | Pervasive demo/pilot/gated labeling; brand debt (`ViGlobal` / `KNG` / legacy strings); lint warnings; production enforcement not proven at scale. | **Do not** market as full production; complete trust, brand, and enforcement packs first. |
| **Global production** | **Fail** | Strong foundational docs and scripts. | Payment/ledger settlement guarantees, global compliance, AI production tool policy, DB-authoritative metering, incident response with live paging — **not** gate-complete per registry + audit scope. | Treat as **north star**; sequence **pilot → metering DB → alerts live → incident live → payments hardening** with CFO sign-off each step. |

---

## 4. Universe Readiness

| Universe | Current readiness | Strength | Gap | Next action |
|----------|-------------------|----------|-----|-------------|
| **1. Survival & Protection OS** | **Conditional** | SOS/travel safety surfaces exist in navigation and copy; pilot disclaimers in i18n. | Emergency flows are **not** a substitute for authorities (stated in copy). | Keep **pilot** posture; partner with local emergency numbers per market before production claims. |
| **2. Language Freedom OS** | **Conditional** | Smart Trio core (`src/core/i18n`), Live Interpreter consent flow referenced in codebase. | `minhKhangTranslator` / `liveInterpreter` cost entries are **gated/pilot** with `productionReady: false`. | Load-test interpreter UX; legal disclaimer review for medical/legal interpretation. |
| **3. Local Commerce OS** | **Conditional** | Local screens, merchant flows, commercial spine config present. | Many strings say **pilot — không fulfill**; Mapbox empty in config sample. | Merchant pilot checklist; clarify fulfillment vs discovery in each market. |
| **4. Travel Companion OS** | **Conditional** | Travel screens, flight assistant, companion flows; “KNG Travel” branding still appears in some travel UI. | Mixed **VIONA vs legacy travel** naming. | Brand normalization pack (content-only) + affiliate/disclosure audit for flight mocks. |
| **5. Income & Growth OS** | **Conditional** | Broker dashboard, referrals, growth events in codebase. | Broker UUID and account linking complexity; zero-loss rules depend on server discipline. | Ops verification of broker payout rules on **staging** ledger (out of scope here). |
| **6. B2B AI Receptionist / Merchant OS** | **Conditional** | Pilot request screens, demo simulator, safety acknowledgements in `vi.json`. | **Explicit** pilot: manual ops, no AI payment, no inventory change. | Execute **commercial pilot runbook**; keep human-in-loop until Twilio + CRM integrations approved. |
| **7. AI Cost / Safety / Ops Layer** | **Strong foundation / not production-enforced** | Registry caps, dry-run modules, runbooks, readiness scripts all green. | **All** `productionReady: false`; outbound marketing draft **frozen** with zero caps. | Next pack: selective **`productionReady`** review with CFO + eng (no automatic flip without design). |

---

## 5. Technical Readiness

| Area | Status | Notes |
|------|--------|-------|
| **Mini-app registry / resolver** | **PASS** | `miniAppRegistry.ts`, `resolveMiniAppEntry.ts`, `presentMiniAppEntry.ts` present. |
| **Smart Trio** | **PASS** | `smartTrioConfig.ts`, `resolveSmartTrioLocale.ts`, types + index. |
| **Travel direction** | **Conditional** | Dual-direction architecture documented in repo; implementation split across screens/services — **legacy “KNG Travel”** strings remain in travel UI files. |
| **Local commerce clarity** | **Conditional** | Copy often says pilot / no fulfill — good honesty; needs ops-backed fulfillment definition per city. |
| **AI Receptionist pilot** | **Conditional** | Strong safety copy; demo + pilot CTAs distinguished in i18n. |
| **Commercial ops** | **PASS** | `ops:readiness`, `commercial:preflight` within release discipline. |
| **AI cost firewall** | **PASS (doc/registry)** | Script + runbook; registry complete for 9 features. |
| **Twilio sandbox readiness** | **PASS (doc/code anchors)** | Not a live dial test in this audit. |
| **AI usage metering** | **PASS (pure meter + fixtures)** | DB persistence not validated as production here. |
| **Admin alert / incident dry-run** | **PASS** | Preview/builders + admin UI anchors per scripts. |
| **Expo / native / Firebase** | **Conditional** | Readiness PASS; trust native labels `repo_ready_pending_console`; Sentry partial. |
| **CI / release discipline** | **PASS** | `ci:release-discipline` exit 0. |
| **i18n locale coverage** | **Conditional** | `vi.json` rich with pilot safety; verify parity for `en.json` for same safety strings in a dedicated i18n pack. |
| **Legacy copy / brand debt** | **Gap** | `brandConfig.ts` lists legacy names; `strings.ts`, `voiceClient.ts`, travel/fixers still mention ViGlobal / Kết Nối Global / KNG. |
| **Lint warning debt** | **Gap** | 50 warnings — no errors. |
| **Direct `navigation.navigate` debt** | **Observed** | Many legitimate navigations across screens (~counts in grep: widespread in `src/screens`, minimal in `src/components`). Not inherently wrong; centralize only if product standard requires. |
| **Package / dependency risk** | **Conditional** | RN 0.81 / Expo 54; overrides on async-storage; npm audit moderate — track separately. |
| **`react-native-fast-image`** | **Mitigated in config** | Listed in Expo doctor `exclude` in `package.json` — known community package risk accepted. |
| **`react-native-webrtc`** | **Risk** | Also excluded from directory check; high compliance/security sensitivity for recordings — keep **pilot** only with legal review. |

**Repo search (summarized):** Patterns `TODO|FIXME|productionReady|pilot|demo|sandbox|…` hit heavily in **`src/i18n/locales/vi.json`** (intentional product posture) and `functions/lib`. Payment/booking/broker hits concentrate in **`LeTanScreen`**, **`WalletService`**, **`BrokerService`**, B2C travel checkout — **production readiness** is **not** asserted by this audit.

---

## 6. Commercial Readiness

| Area | Status | Notes |
|------|--------|-------|
| **Local commerce monetization** | **Conditional** | Config + paywalls exist; fulfillment is pilot-limited per copy. |
| **Merchant pilot intake** | **Conditional** | Runbooks + pilot request flows; needs **human** intake queue. |
| **AI Receptionist pilot pricing** | **Conditional** | VIO / credits language in app; CFO must reconcile **liability** vs **usage**. |
| **VIO Credits liability** | **Risk** | Wallet + credits UX; legal/treasury review required before public beta. |
| **Broker / helper / student income** | **Conditional** | `BrokerService` encodes share logic — **server** must remain authoritative. |
| **Payment / ledger / Stripe** | **Not gate-complete** | Stripe test key appeared in local expo config output during readiness — **rotate if exposed**; production Stripe needs webhook + reconciliation ops. |
| **Refund / provider / manual ops** | **Conditional** | Pilot copy assumes **manual ops** confirmation — aligns with zero-loss if humans gate edge cases. |
| **Zero-loss monetization** | **Design intent strong** | `zeroLossPolicy` and financial rules files present — **enforcement** is org/process dependent. |

---

## 7. AI Safety / Cost / Ops Readiness

| Control | Status | Notes |
|---------|--------|-------|
| **AI cannot write DB** | **Not proven globally in this audit** | Dry-run modules suggest conservative design; **no** blanket proof without full data-layer review. |
| **AI cannot charge money** | **Stated in product copy for pilot** | i18n explicitly says AI Receptionist does not collect money in pilot/demo. |
| **AI cannot confirm booking / payment / inventory / bill** | **Stated for pilot** | Pilot acknowledgements in `vi.json` (manual merchant confirm). |
| **Consent / recording** | **Partial** | Interpreter consent UI; telephony recording needs **jurisdiction-specific** policy before production Twilio. |
| **Medical / legal / financial disclaimer** | **Present in multiple strings** | e.g. briefing alerts “not professional advice (demo)”. |
| **Prompt / tool armor** | **Not exhaustively audited** | Requires security review pack + red team. |
| **Tenant safety** | **Conditional** | B2B domain paths use tenant-scoped collections in code comments/paths — **staging penetration test** recommended. |
| **Cost caps** | **Registry** | Numeric caps exist; `productionReady` false. |
| **Usage metering** | **Pure meter + preview** | Script PASS; DB-backed metering is **next-phase**. |
| **Admin alerts** | **Dry-run** | Script PASS; real notification channels not validated. |
| **Incident process** | **Dry-run** | Runbook + fixtures; paging integration is ops. |
| **Human fallback** | **Strong (copy + pilot)** | Manual ops emphasized throughout AI Receptionist pilot strings. |

---

## 8. Trust / Legal / Compliance Readiness

| Area | Status | Notes |
|------|--------|-------|
| **Privacy / data minimization** | **Conditional** | Firebase/App Check trust docs referenced in preflight output. |
| **Telecom / recording / TCPA-like regimes** | **Gap for global** | Twilio sandbox only; legal per market. |
| **Consumer finance / credits** | **Gap** | VIO / credits — disclosures and issuer model need counsel. |
| **Travel / insurance / emergency** | **Gap** | Do not imply insured rescue. |
| **B2B contracts** | **Conditional** | Pilot runbooks exist; contract templates outside repo scope. |

---

## 9. Brand / UX / i18n Readiness

| Area | Status | Notes |
|------|--------|-------|
| **Primary brand VIONA** | **PASS** | Expo config `name` / web manifest VIONA. |
| **Legacy strings** | **Gap** | Grep shows `ViGlobal`, `Kết Nối Global`, `KNG`, Prague/Berlin sample community content — some intentional (legacy list), some user-facing. |
| **Pilot / demo transparency** | **PASS** | Excellent clarity in Vietnamese locale for pilot limitations. |
| **English parity** | **Unknown from this audit** | Spot-check `en.json` in follow-up pack. |

---

## 10. Blockers Before Controlled Merchant Pilot

| Priority | Blocker |
|----------|---------|
| **P0** | **Human ops queue** staffed for lead review, booking confirmation, and escalation (per runbook). |
| **P0** | **Legal / merchant agreement** template signed for pilot geography. |
| **P1** | **Environment hygiene**: Twilio **test** credentials confined to staging; no production flags enabled accidentally. |
| **P1** | **Sentry / observability** minimum viable for pilot cohort size. |
| **P2** | **Lint warnings** triage for files merchants may demo (B2B dashboard, Receptionist). |

---

## 11. Blockers Before Public Beta

| Priority | Blocker |
|----------|---------|
| **P0** | Resolve **brand debt** and **misleading demo strings** in user-visible EN/VI paths. |
| **P0** | **DB-backed authoritative metering** + **audit trail** for AI usage and billing disputes. |
| **P1** | **Payment + refund + chargeback** playbooks tested on staging with **real** PSP test mode end-to-end. |
| **P1** | **App Check / trust** profile for production traffic (native + web). |
| **P2** | **Mapbox** or alternative map provider keys for markets where maps are promised. |

---

## 12. Blockers Before Global Production

| Priority | Blocker |
|----------|---------|
| **P0** | **`productionReady: true`** only after CFO + eng sign-off **per feature** in `AI_COST_GUARD_REGISTRY`. |
| **P0** | **Global legal matrix** (telecom, payments, employment, travel packaging, health claims). |
| **P0** | **Incident response** with on-call, **real** admin alerts, and **postmortem** process — not dry-run only. |
| **P1** | **Multi-region data residency** decisions if EU + VN + US users. |
| **P1** | **Broker payout** reconciliation audited by finance. |
| **P2** | Dependency upgrades for moderate npm advisories. |

---

## 13. Recommended Next 5 Packs

| Pack name | Why now | Scope | Risks | No-go rules |
|-----------|---------|-------|-------|-------------|
| **Pack AA — Merchant pilot rehearsal (ops)** | Gate matrix is **conditional** on people/process. | Dry-run intake with 1–3 merchants using **existing** app build; log issues in ops checklist only. | Low tech risk; **reputational** if ops understaffed. | No Twilio prod; no AI auto-actions; no schema changes. |
| **Pack AB — DB-backed AI usage log (design + migration)** | Metering is pure/dry-run today. | Prisma models + append-only writer + **feature-flagged** read path — **separate PR** with migration review. | Migration mistakes; PII in logs. | No dropping columns; no silent prod enable. |
| **Pack AC — Real admin alert channel (staging)** | Dry-run only today. | Wire SES/Slack/pager to **staging** tenant first; idempotency keys. | Alert storms; cost. | No prod until staging soak. |
| **Pack AD — Twilio sandbox smoke (staging numbers)** | Readiness scripts ≠ live call. | Scripted inbound/outbound on **sandbox** numbers; consent banner audit. | Compliance; accidental prod route. | No production outbound; record **opt-in** only. |
| **Pack AE — Brand + i18n debt (content)** | Public beta blocked on copy/legacy names. | Replace user-visible ViGlobal/KNG strings where inappropriate; align `en.json` safety with `vi.json`. | Large diff noise. | No navigation route renames; no feature-flag behavior change without product sign-off. |

---

## 14. Go / No-Go Decision

| Gate | Decision |
|------|----------|
| **Internal demo** | **Conditional Go** |
| **Controlled merchant pilot** | **Conditional Go** (manual ops, no production telephony/AI money autonomy) |
| **Public beta** | **No-Go** |
| **Global production** | **No-Go** |

---

## 15. Final Recommendation

**What to do next**

1. Treat **Pack AA (ops rehearsal)** + **Pack AE (brand/i18n debt)** as the **lowest-regret** sequence alongside keeping **all** `productionReady` flags **false** until a CFO-backed review explicitly flips individual features.  
2. Run **`npm run gate:production-readiness`** in CI or pre-release to ensure docs/core anchors stay present.  
3. If **`npm run lint`** warnings are noisy for demos, schedule a **small-scope lint hygiene** PR touching only obvious unused imports/vars — **not** mixed with feature work.

**What not to do next**

- Do **not** enable **production Twilio**, **production AI receptionist autonomous actions**, or **production metering enforcement** as a “big bang” without **Pack AB–AD** style sequencing.  
- Do **not** market **public beta** while demo/pilot strings still dominate core journeys.

**Requires user / security / account setup**

- **Sentry** org/project or env-based config for release builds.  
- **Mapbox** (or equivalent) tokens if map marketing claims apply.  
- **Twilio** account + **verified** caller ID + **recording consent** workflow per jurisdiction.  
- **Stripe** production keys, webhooks, and **finance reconciliation** owners.  
- **Firebase console** steps referenced in trust docs (`commercial_native_app_check: repo_ready_pending_console`).

---

## Appendix A — Direct answers to Pack Z questions

1. **Internal demo ready?** **Yes, conditional** — engineering baseline green; warn on lint + Sentry + secrets in logs.  
2. **Controlled merchant pilot ready?** **Conditional** — with manual ops + legal + staging-only telephony/AI policy.  
3. **Public beta ready?** **No.**  
4. **Global production ready?** **No.**  
5. **Blockers before enabling:**  
   - **Real merchant pilot:** human intake, contracts, staging discipline, no `productionReady` AI autonomy.  
   - **Twilio sandbox smoke:** credentials + numbers + consent/recording policy + ops runbook execution (not just script).  
   - **DB-backed usage log:** schema + writer + privacy review (**Pack AB**).  
   - **Real admin notifications:** staging soak + dedupe + on-call (**Pack AC**).  
   - **Payment/ledger/Stripe:** webhook correctness, reconciliation, refunds, treasury sign-off.  
   - **Production AI Receptionist:** flip **`productionReady`** only with cost caps, tool restrictions, and human fallback proven.  
6. **Next safest pack:** **Pack AA — Merchant pilot rehearsal (ops-only)** plus **Pack AE — Brand/i18n alignment** (content-only PRs).

---

## Appendix B — Evidence commands (reproduce)

Ripgrep-equivalent searches were performed with workspace `grep` tooling; on a local machine use:

`rg "TODO|FIXME|productionReady|pilot|demo|sandbox" docs src scripts package.json`  
(and the other patterns from the Pack Z brief).

Key file citation for cost posture:

```7:21:src/core/aiCost/aiCostGuardRegistry.ts
export const AI_COST_GUARD_REGISTRY: Readonly<Record<AiCostFeatureId, AiCostGuardDefinition>> = {
  aiReceptionistDemo: {
    featureId: 'aiReceptionistDemo',
    labelKey: 'aiCost.feature.aiReceptionistDemo',
    status: 'demoOnly',
    includedUsage: 30,
    hardCap: 60,
    unit: 'request',
    resetWindow: 'session',
    requiresUpgrade: false,
    requiresHumanApproval: false,
    autoPauseOnCap: true,
    providerCostRisk: 'low',
    productionReady: false,
```
