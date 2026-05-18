# VIONA.SOS.EMERGENCY_SCREEN_COPY_AUDIT.1

**Document ID:** `VIONA.SOS.EMERGENCY_SCREEN_COPY_AUDIT.1`  
**Type:** Read-only SOS / emergency copy audit (report only)  
**Branch:** `pack-af19-sos-emergency-copy-audit`  
**Base master:** `9982972` — `docs(design): merge design mode lock`  
**Prior waves:** Tier-1 cs/de completion (`feaeee7`), FR/JA/KO safety bundle (`9f38c23`), brand drift SOS fix (`bfb7c40`), global Active/Full lock (`f086b92`)  
**Date:** 2026-05-16  

**Governing law:** [VIONA Operating Protocol](../ai-context/VIONA_OPERATING_PROTOCOL.md) §10.5 / §17.1, [Design Mode Lock](../design/VIONA_DESIGN_MODE_LOCK.md), [Global Active/Full lock](./VIONA_GLOBAL_ACTIVE_FULL_STANDARD_LOCK_1.md), [Brand Drift Sweep](./VIONA_I18N_BRAND_DRIFT_SWEEP_1.md).

**Method:** ripgrep + `src/i18n/index.ts` `mergeSosWithEnglishBase()` analysis + locale key diff script. No app source changes in this pack.

---

## Summary

| Item | Result |
|------|--------|
| **Overall risk level** | **Low–medium** — Tier-1 locale expansion and prior SOS overlay fix removed most fake-dispatch / GPS-share / authority-contact claims. Remaining issues are **wording polish**, **orphan locale keys**, and **latent Home ping copy** (keys exist; UI wiring not found in `src/`). |
| **Highest-risk surfaces** | `home.sosPing*` (if/when wired — implies location share + “ping sent”); `ai_voice.accessibilityAnnounce` (screen reader: “Emergency shield opened”); `sos.reportQueuedTitle` (FR: “Signalement en file” — queue implication). |
| **Fixes needed?** | **Yes — small copy-only packs** recommended; no behavior change required for audit pass. |
| **Recommended next pack** | **`VIONA.SOS.HOME_PING_COPY_SAFETY.1`** (copy-only) + **`VIONA.SOS.LOCALE_ORPHAN_HYGIENE.1`** (copy-only). |

**Core finding:** Active SOS surfaces (`SOSModal`, `EmergencySOSScreen`, `TravelSosHubScreen`, `SosPlusProfileScreen`, hold gate / shield) use **honest, protocol-aligned** `sos.*` / `emergencySos.*` / `travelSosHub.*` / `sosPlus.*` strings. **No** locale file claims VIONA dispatches emergency services, auto-contacts authorities, or runs a live rescue team.

---

## Surfaces audited

| Surface | File(s) | Locale keys (primary) | Risk | Status | Notes |
|---------|---------|------------------------|------|--------|-------|
| **SOS guidance sheet (tabs)** | `src/screens/b2c/SOSModal.tsx` | `sos.guideTitle`, `sos.medicalTitle`, `sos.reportScamSub`, `sos.footerDisclaimer`, … | Low | **Safe** | No auto-dial; routing/embassy/trusted = alerts only. Mounted from `MainTabNavigator`. |
| **SOS hold gate** | `src/components/viona/VionaSosHoldGateModal.tsx` | `sos.gateTitle`, `sos.gateSub`, `sos.preLoginGateSub`, … | Low | **Safe** | Explicit: no automatic dispatch. |
| **SOS hold FAB** | `src/components/premium/SOSShieldComponent.tsx` | `sos.holdHelper`, `ai_voice.accessibilityAnnounce` | Low–med | **Needs copy fix** (a11y) | Hold UX safe; a11y string overstates “shield opened”. |
| **Emergency SOS screen** | `src/screens/EmergencySOSScreen.tsx` | `emergencySos.*` | Low | **Safe** | Dialer confirm; “VIONA does not dispatch”; location on-device reference only. |
| **Travel SOS hub** | `src/screens/b2c/travel/TravelSosHubScreen.tsx` | `travelSosHub.*`, `emergencySos.typeGeneralSub` | Low | **Safe** | Embassy = demo contact + user dialer; TTS pilot disclaimers. |
| **SOS Plus profile** | `src/screens/sos/SosPlusProfileScreen.tsx` | `sosPlus.*` | Low | **Safe** | Consents say future-only / not dispatch; local stub. |
| **SOS Plus info modal** | `src/components/viona/VionaSosPlusInfoModal.tsx` | `sos.plusInfo*`, `sos.basicTier*`, `sos.plusTier*` | Low | **Safe** | Planned/gated subscription copy. |
| **Home SOS entry** | `src/screens/HomeScreen.tsx` | `sos.chip`, hold gate keys | Low | **Safe** | Uses hold gate → in-app SOS; no `home.sosPing*` in code. |
| **Home SOS ping (latent)** | — (keys only) | `home.sosPing*` | Medium | **Needs copy fix** (if wired) | All 7 locales: “Share location…” / “Ping sent” — pilot disclaimer in body only. |
| **Legacy emergency modal** | `src/components/emergency/SOSModal.tsx` | `sos.legacy*` | Low | **Safe / unused** | No imports found in `src/`; dead path risk if re-wired. |
| **Mini-app shell SOS chip** | `src/components/viona/useMiniAppShellChrome.ts` | `shell.utility.safetyAssist` | Low | **Safe** | Label only. |
| **Global top rail** | `src/components/viona/VionaGlobalTopRail.tsx` | `shell.utility.safetyAssist` | Low | **Safe** | Entry to SOS flows. |

---

## Risky wording scan

| File / key | Phrase (representative) | Locale | Risk | Recommended action |
|------------|-------------------------|--------|------|-------------------|
| `home.sosPingCta` | “Share location with nearby VIONA community” | en (+ cs/de/fr/ja/ko) | **Medium** | Rephrase to **pilot community ping (demo)** — user-initiated, not GPS broadcast; clarify no authority alert. |
| `home.sosPingAlertTitle` | “Ping sent” | all | **Medium** | Use “Ping recorded (pilot)” or “Demo ping saved locally”. |
| `home.sosPingAlertBody` | “SOS ping sent with coordinates…” | all | **Low–med** | Body already says pilot / not authorities — tighten title + CTA. |
| `sos.reportQueuedTitle` | “Signalement en file” | fr | **Low–med** | Prefer “Note enregistrée” (align EN “Report queued” intent without implying live queue). |
| `sos.reportQueuedTitle` | “報告をキューに追加” / “신고 대기열에 추가” | ja / ko | **Low–med** | Align to “note saved locally” pattern (EN body is safe). |
| `ai_voice.accessibilityAnnounce` | “Emergency shield opened” / “Otevřen nouzový štít” | en / cs | **Low–med** | Use “SOS guidance opened (pilot)” — not active shield / response. |
| `ai_voice.aiShieldActive` | “AI Shield Active” | en (+ vi/cs/de) | **Low** | Not on main SOS sheet; avoid linking to emergency response in future UI. |
| `sos.gpsLocationShared` | Key name legacy; value “Location guidance ready” | en+ | **Low** | **Safe** text; optional key rename in hygiene pack (non-blocking). |
| `en.sos.reportQueuedBody` | contains “dispatch” | en | **Low** | **Safe** — negation (“No … dispatch”). |
| `de.sosPlus.consentLocationSub` | “kein Dispatch” | de | **Low** | **Safe** — negation. |
| `travelSosHub.gpsLineDemo` | straight-line distance (demo) | all | **Low** | **Safe** — demo framing. |
| `travelSosHub.embassyCallConfirmBody` | user places call; VIONA does not dispatch | all | **Low** | **Safe**. |

**Not found** in SOS locale namespaces (post–Tier-1): `GPS Location Shared`, `authorities contacted`, `embassy contacted`, `rescue verified`, `safety team watching`, `Twilio call`, `emergency call completed`, `police sent`, `ambulance sent` (as affirmative claims).

---

## Locale LQA summary

Runtime: `mergeSosWithEnglishBase()` overlays partial `sos` on English for `vi`, `cs`, `de`, `fr`, `ja`, `ko`. `emergencySos`, `travelSosHub`, `sosPlus` have **no** merge — must exist per locale or fall back to `en` via `fallbackLng`.

| Locale | Safe for pilot? | Missing critical keys | Fallback risk | Recommended fix |
|--------|-----------------|----------------------|---------------|-----------------|
| **en** | **Yes** | — | — | Canonical; keep as SoT for safety classes. |
| **vi** | **Yes** | — | `sos` full parity via merge | Maintain parity on safety key changes. |
| **cs** | **Yes** | `sos` only **21** local keys (81 inherit EN via merge) | EN backstop for `footerDisclaimer`, `gateSub`, etc. | **Safe** overlay strings; optional expand cs `sos` for LQA (not safety blocker). |
| **de** | **Yes** | Same as cs (21 local `sos`) | Same | Same as cs. |
| **fr** | **Yes** | — | — | Full `sos` (112 keys) + **10 orphan** legacy keys. |
| **ja** | **Yes** | — | — | Full `sos` + 10 orphans. |
| **ko** | **Yes** | — | — | Full `sos` + 10 orphans. |

**Required safe copy present (via en or locale):**

- `sos.footerDisclaimer` / `disclaimerNotReplacement` — **Yes** (fr/ja/ko/vi/en local; cs/de via EN merge).
- “Call local emergency number directly” — **Yes** (`routingSetupBody`, `legacyEmergencyAlertBody`, `emergencySos` dial copy).
- User places call / no auto-dispatch — **Yes** (`emergencySos.dialConfirmBody`, `sos.gateSub`).

---

## Orphan / mismatch key summary

| Namespace | Issue | Locales | Impact |
|-----------|-------|---------|--------|
| `sos.*` | **10 orphan keys** not in `en.json`: `fabAnnounce`, `sheetTitle`, `sheetSubtitle`, `gpsBanner`, `optionMedicalTitle`, `optionMedicalSub`, `optionPoliceTitle`, `optionPoliceSub`, `optionScamTitle`, `optionScamSub` | fr, ja, ko | **Low** — unused by `SOSModal` (uses `guideTitle`, `medicalTitle`, …). Hygiene: remove or migrate. |
| `sos.*` | cs/de retain legacy keys `medicalAmbulance`, `emergencyAssistance` in local overlay | cs, de | **Low** — superseded by EN merge for active keys; clutter only. |
| `home.sosPing*` | Keys in all locales; **no `t('home.sosPing')` usage** in `src/` | all | **Medium** — latent copy risk when feature ships. |

---

## Hardcoded phone / dialer / tel: summary

| Mechanism | Location | Behavior | Risk | Notes |
|-----------|----------|----------|------|-------|
| **Country pack primary number** | `src/config/countryPacks/packs.ts` | EU packs use `112`; shown in `EmergencySOSScreen` via `resolveCountryPack(user?.country)` | **Low–med** | Number is **routing config**, not “VIONA dispatches”. Copy requires user confirm + “does not dispatch”. **Legal/product:** country matrix maturity (Operating Protocol §10.5). |
| **`tel:` URI** | `EmergencySOSScreen.tsx`, `TravelSosHubScreen.tsx` | Opens device dialer **after** confirm (emergency) or alert (embassy demo) | **Low** | User-initiated. |
| **Hardcoded strings in screens** | SOS components | No literal “911”/“112” in TSX found outside country pack resolution | **Low** | Good. |

---

## Recommended next packs

| Priority | Pack ID | Target | Risk fixed | Type |
|----------|---------|--------|------------|------|
| **P1** | `VIONA.SOS.HOME_PING_COPY_SAFETY.1` | `home.sosPing*` in `en.json` + vi/cs/de/fr/ja/ko | Location-share / “sent” implication | **Copy-only** |
| **P1** | `VIONA.SOS.LOCALE_ORPHAN_HYGIENE.1` | `fr.json`, `ja.json`, `ko.json` (`sos` orphans); optional cs/de prune | Confusion / future misuse | **Copy-only** |
| **P2** | `VIONA.SOS.AI_VOICE_A11Y_COPY.1` | `ai_voice.accessibilityAnnounce` (+ cs/de/vi) | “Emergency shield opened” overstatement | **Copy-only** |
| **P2** | `VIONA.SOS.SAFETY_BUNDLE_EXTRACT.1` | `src/i18n/` structure + docs | Unsafe partial `sos` overrides | **Structural + docs** (per language strategy audit) |
| **P3** | `VIONA.SOS.COUNTRY_ROUTING_MATRIX.AUDIT.1` | `countryPacks`, `EmergencySOSScreen` | Displaying `112` as production truth for all users | **Legal / product / behavior** audit |

---

## Validation (this pack)

| Check | Result |
|-------|--------|
| App logic changed | **No** |
| Locale JSON changed | **No** |
| Docs only | **Yes** |
| `npm run typecheck` | Pass (expected) |
| `npm run lint` | Pass (0 errors) |
| `npm run smoke` | Pass |

---

## Confirmations

| Question | Answer |
|----------|--------|
| App logic / routes / backend / payment / wallet / Prisma / package changed? | **No** |
| SOS functionality removed? | **No** |
| Functions removed? | **No** |

---

*End of audit — `VIONA.SOS.EMERGENCY_SCREEN_COPY_AUDIT.1`*
