# VIONA.SOS.COUNTRY_EMERGENCY_ROUTING_MATRIX_AUDIT.1

**Document ID:** `VIONA.SOS.COUNTRY_EMERGENCY_ROUTING_MATRIX_AUDIT.1`  
**Type:** Read-only SOS country emergency number / `tel:` / routing audit (report only)  
**Branch:** `pack-af28-sos-country-routing-matrix-audit`  
**Base master:** `2d24975` — `fix(copy): merge app tour demo copy rebrand`  
**Prior audits:** [SOS Emergency Screen Copy](./VIONA_SOS_EMERGENCY_SCREEN_COPY_AUDIT_1.md) (`pack-af19`–`af22`), [Global Active/Full lock](./VIONA_GLOBAL_ACTIVE_FULL_STANDARD_LOCK_1.md)  
**Date:** 2026-05-19  

**Governing law:** [VIONA Operating Protocol](../ai-context/VIONA_OPERATING_PROTOCOL.md) §10.5 / §2.13, [Design Mode Lock](../design/VIONA_DESIGN_MODE_LOCK.md), [Global Active/Full lock](./VIONA_GLOBAL_ACTIVE_FULL_STANDARD_LOCK_1.md).

**Method:** ripgrep across `src/**` (Emergency/SOS/emergency/countryPacks/`tel:`/emergency digits), full read of dial surfaces and `countryPacks/packs.ts`. **No app source changes** in this pack.

---

## Summary

| Item | Result |
|------|--------|
| **Overall risk level** | **Medium** — User-facing **copy and disclaimers** on active SOS surfaces are largely aligned with Operating Protocol (no auto-dispatch, confirm-before-dial on `tel:`, location on-device only). **Routing truth** is **not** production-grade: emergency numbers are a **small static profile-country matrix**, dominated by **`112`**, with **no GPS-based routing**, **unused fallbacks**, and **known country mismatches** (e.g. UK). |
| **Highest-risk files/surfaces** | `src/config/countryPacks/packs.ts` (number SoT); `src/screens/EmergencySOSScreen.tsx` (displays profile number in title + dialer); `src/screens/LeTanScreen.tsx` (hardcoded “gọi 112”); `src/lifeOS/ui/suggestionBuilders.ts` (profile number in suggestion); `src/services/travel/EmergencySosService.ts` (GB script cites **999** while pack shows **112**). |
| **Behavior fixes needed?** | **Yes, eventually** — not in this audit pack. Priority: **location-aware or legally verified routing** before presenting a single digit as “local emergency”; wire or remove stale `sosAITriage` dial-buffer contract. |
| **Copy fixes needed?** | **Yes — small scoped copy packs** — advisory framing on `emergencySos.screenTitle`, LeTan 112 claim, LifeOS suggestion line, optional `sos.basicTierBody` “current country” tightening. |
| **Recommended next pack** | **`VIONA.SOS.ROUTING.COPY_DISCLAIMER.1`** (locale + 2–3 screen strings, copy-only) then **`VIONA.SOS.COUNTRY_PACK_LEGAL_VERIFY.1`** (ops/legal matrix + pack data, no code until signed). |

**Core finding:** VIONA **does not** auto-dial, auto-dispatch, or auto-share location from the audited production paths. The main gap is **presenting `resolveCountryPack(user.country).primaryNumber` as if it were the user’s current-location emergency number** when routing is **profile-based** and **mostly `112`**.

---

## Emergency number sources

| File | Number / source | Country / market basis | Fallback behavior | Risk | Notes |
|------|-----------------|------------------------|-------------------|------|-------|
| `src/config/countryPacks/packs.ts` | `EU_EMERGENCY`: primary **`112`**, fallback `['112']` | CZ, SK, PL, DE, FR, UK, GB, CH (listed packs) | Same as primary in data model; **not used in UI** | **P1** | Comment: “EU/EEA-style universal”; **UK/GB legally use 999** for many emergencies — **112 works in UK but is not the primary public number**. |
| `src/config/countryPacks/packs.ts` | VN: primary **`115`**, fallback **`113`, `114`** | `VN` pack only | Fallbacks **not surfaced** in dial UI | **P2** | Vietnam-specific; needs legal/ops sign-off for tourist copy. |
| `src/config/countryPacks/packs.ts` | `GLOBAL_UNLISTED_COUNTRY_PACK` (`ZZ`): **`112`** | Unknown / valid ISO not in table | Used when profile country empty or unlisted | **P1** | Safer than defaulting to CZ, but **112 is not universal** (US **911**, etc.). Must be framed as **guidance**, not guarantee. |
| `src/screens/EmergencySOSScreen.tsx` | `resolveCountryPack(user?.country).emergencyConfig.primaryNumber` | **User profile `country`** — **not** GPS | No UI use of `fallbackNumbers` | **P1** | Traveler in country A with profile B sees B’s number in **screen title** and dialer. |
| `src/lifeOS/ui/suggestionBuilders.ts` | Same `resolveCountryPack(input.userCountry)` | Profile country | N/A (text only) | **P1** | Vietnamese line: “gọi {number} ngay” — implies correctness. |
| `src/screens/LeTanScreen.tsx` | Hardcoded **“112”** in coach redirect text | N/A (fixed string) | Navigates to `EmergencySOS` (profile number may differ) | **P1** | Conflicts with non-EU profile or UK **999** narrative. |
| `src/services/travel/EmergencySosService.ts` | TTS scripts; GB medical VI line **“Please call 999”** | Host country in `getSosQuickActionScript(hostCountryCode)` | `default` generic English | **P1** | **Inconsistent** with `countryPacks` GB → **112** for dial path via `EmergencySOSScreen`. |
| `src/services/emergency/emergencyPhrasePacks.ts` | No digits — phrase templates with `{location}` | `resolveCountryPack(country).defaultLanguage` | English default lang | **P3** | Phrases say “My location is: …” — user must speak; location not auto-sent. |
| `src/i18n/locales/*.json` | `emergencySos.*`, `sos.*`, `travelSosHub.*` | i18n | EN merge for partial `sos` | **OK** | Strong disclaimers (`dialConfirmBody`, `footerDisclaimer`, `locationReferenceDisclaimer`). |

**Listed ISO packs today (9 + sentinel):** CZ, SK, PL, DE, FR, UK, GB, CH, VN, plus `ZZ` unlisted. **No US, AU, JP, KR, etc.**

---

## Dialer / tel: behavior

| File | Action | Confirm-before-dial? | Platform notes | Risk | Recommended action |
|------|--------|----------------------|----------------|------|-------------------|
| `src/screens/EmergencySOSScreen.tsx` | `Linking.openURL(\`tel:${emergencyNumber}\`)` after `Alert.alert` confirm | **Yes** — `dialConfirmTitle` / `dialConfirmCta` | Web styling present; **`tel:` on web** may noop or delegate to OS — not guarded | **P2** | Copy-only: add web hint in locale if needed; behavior pack: detect web + show “dial manually”. |
| `src/screens/b2c/travel/TravelSosHubScreen.tsx` | `tel:` for **embassy mission** demo phone | **Yes** — `embassyCallConfirmBody` | Demo dataset; disclaimer present | **P2** | Keep demo badge; legal verify mission numbers before live. |
| `src/screens/b2c/SOSModal.tsx` | Medical/police/fire → **alert only** (`routingSetupBody`); scam → local note alert; embassy → legacy embassy alert | **No `tel:`** | Mounted from `MainTabNavigator` | **OK** | Primary B2C SOS entry — safe. |
| `src/components/emergency/SOSModal.tsx` | Legacy sheet — alerts only | **No `tel:`** | **Unused** in `src/` imports (dead path) | **P3** | Hygiene: document or remove in future pack. |
| `src/services/emergency/sosAITriage.ts` | `initiateAITriage` → `LiveInterpreter` only | N/A | Comment claims dial buffer on `SOSModal` — **not wired**; **no callers** found | **P3** | Update docs / delete stale contract in hygiene pack. |
| `src/screens/RadarDiscoveryScreen.tsx` | `tel:` for mock contacts | Unknown | Non-SOS feature | **OK** | Out of SOS scope. |
| `src/screens/LeTanScreen.tsx` | Navigates to `EmergencySOS` (inherits confirm dial there) | Indirect | Coach text overstates **112** | **P1** | Copy fix: “open SOS guidance / local emergency number”. |

**Usage history:** `appendUsageHistory` logs `sos_call_*` on dial attempt — **does not** imply call connected or authorities contacted (**OK**).

---

## UI copy / safety claims

| File / key | Phrase or behavior | Risk | Recommended action |
|------------|-------------------|------|-------------------|
| `emergencySos.screenTitle` | `SOS · {{number}}` — prominent digit | **P1** | Add subtitle/disclaimer: number is **guidance from profile country**, may not match **current location**. |
| `emergencySos.headerSubtitle` | “VIONA does not dispatch emergency services” | **OK** | Keep. |
| `emergencySos.dialConfirmBody` | User places call; no dispatch | **OK** | Keep. |
| `emergencySos.locationReferenceDisclaimer` | On-device only; not sent to authorities | **OK** | Keep. |
| `sos.footerDisclaimer` | Does not replace local services; call local number | **OK** | Keep on all SOS surfaces. |
| `sos.basicTierBody` | “tuned to your **current country or region** when routing exists” | **P2** | Copy: “profile country” or “when configured” until location-aware routing ships. |
| `travelSosHub.gpsLineDemo` | Straight-line distance (demo) | **OK** | Demo framing present. |
| `travelSosHub.embassyCallConfirmBody` | Demo contact; user places call | **OK** | Keep. |
| `LeTanScreen` coach | “gọi **112** khẩn cấp” | **P1** | Replace with protocol-safe redirect (no fixed digit). |
| `lifeOS` suggestion | “gọi **{emergencyNumber}** ngay” | **P1** | Soften: “use SOS screen for guidance” + local number disclaimer. |
| `emergencyPhrasePacks` | “My location is: {location}” | **P3** | OK for user-read TTS; ensure `{location}` empty when permission denied (already handled). |
| `sosAITriage.ts` header | “before any PSTN emergency dial” | **P3** | Misleading — b2c `SOSModal` does not dial; update comment. |

**No P0 found** in active code: no auto `tel:` without confirm on audited SOS paths; no “authorities contacted” success toasts after dialer open.

---

## Country routing readiness matrix

| Market / group | Current support | Confidence | Legal / ops verification needed | Suggested launch gate |
|----------------|-----------------|------------|--------------------------------|------------------------|
| EU packs (CZ, SK, PL, DE, FR, CH) | `112` via profile country | **Low–medium** | **Yes** — confirm 112 framing; country-specific services (ambulance vs police split) | Do not market as “verified matrix” until signed sheet per country |
| UK / GB | `112` in pack; TTS says **999** | **Low** | **Yes** — align pack + scripts to **999** or dual-label copy | Block “authoritative UK number” until fixed |
| Vietnam | `115` (+ unused 113/114) | **Medium** | **Yes** — tourist vs resident numbering | Pilot OK with advisory disclaimer |
| Global unlisted (`ZZ`) | `112` default | **Low** | **Yes** — US/Asia/Africa need explicit packs or “unknown → no primary digit” UX | **Gate:** show “call local emergency number” without digit when country unknown |
| US / CA / AU / JP / KR / … | **Not in `COUNTRY_PACKS`** | **None** | Full matrix row + legal | **Gate:** no single-digit CTA until pack exists |
| Travel SOS hub | GPS for **embassy** distance only; dial via `EmergencySOS` | **Medium** | Embassy demo list marked “verify before production” in code | Keep demo badges; separate from PSTN matrix |

---

## Required safety copy checklist

| Principle | Status in codebase |
|-----------|-------------------|
| Local emergency disclaimer (call local number if immediate danger) | **Present** — `sos.footerDisclaimer`, `routingSetupBody`, `legacyEmergencyAlertBody` |
| User-control disclaimer | **Present** — `dialConfirmBody`, hold gates, no auto-dial in `SOSModal` |
| No dispatch disclaimer | **Present** — `emergencySos.headerSubtitle`, `dialConfirmBody` |
| No auto location-share disclaimer | **Present** — `locationReferenceDisclaimer`, `reportScamSub`, `home.sosPing*` (latent keys) |
| Unknown-country fallback | **Partial** — `ZZ` → **112** (digit shown); **missing** “we don’t know your local number” UX |
| Numbers are advisory / not legally complete | **Partial** — disclaimers exist but **title shows digit authoritatively** |

---

## Audit questions (answers)

1. **Where defined?** `src/config/countryPacks/packs.ts` → `emergencyConfig.primaryNumber` / `fallbackNumbers`.
2. **Basis?** **Profile country** (`user.country`) for dial UI; **defaultLanguage** for phrases; **GPS** only for embassy proximity and on-device location label — **not** for PSTN selection.
3. **Confirm-before-dial?** **Yes** on `EmergencySOSScreen` and embassy call on `TravelSosHubScreen`. **No** on main `SOSModal` (no dial).
4. **Guaranteed correct for current location?** **UI can imply it** via `screenTitle` + profile number — **not guaranteed** (**P1**).
5. **VIONA routes calls?** **No** — opens device dialer only (**OK**).
6. **Contacts authorities / embassy?** **No** — map search / demo mission dial with confirm; embassy tile on `EmergencySOSScreen` is map search only (**OK**).
7. **Auto location share?** **No** to authorities from audited screens; location fetched for **on-device display** and phrase text (**OK** with disclaimer).
8. **Success after dialer?** **No** — only usage history / failed dialer alert (**OK**).
9. **112 global fallback?** **Yes** for EU packs + `ZZ` — **not safely framed** as universal (**P1**).
10. **Country packs documented as advisory?** **In i18n partially**; **not** next to the digit in screen title (**gap**).
11. **Platform web/iOS/Android?** Same `Linking.openURL('tel:')` — web behavior **unverified** in code (**P2**).
12. **Safe fallback when unknown?** **`ZZ` → 112** — weaker than “no digit + call local emergency” (**P1**).

---

## Recommended next packs

| Priority | Pack ID | Target files | Risk fixed | Type | Do-not-touch |
|----------|---------|--------------|------------|------|--------------|
| **P1** | `VIONA.SOS.ROUTING.COPY_DISCLAIMER.1` | `en.json` + tier-1 locales (`emergencySos.*`, `sos.basicTierBody`), `LeTanScreen.tsx`, `suggestionBuilders.ts` | Authoritative digit / 112 / “current country” implications | **Copy-only** | `countryPacks/packs.ts`, `tel:` logic |
| **P1** | `VIONA.SOS.COUNTRY_PACK_LEGAL_VERIFY.1` | `docs/audit/` matrix spreadsheet + `packs.ts` after sign-off | Wrong UK/US/SEA numbers | **Legal/ops + data** | Prisma, routes, Twilio |
| **P2** | `VIONA.SOS.ROUTING.WEB_TEL_GUARD.1` | `EmergencySOSScreen.tsx`, `TravelSosHubScreen.tsx` | Web `tel:` noop / false confidence | **Behavior** (minimal) | Payment, SOS Plus billing |
| **P2** | `VIONA.SOS.ROUTING.LOCATION_AWARE.2` | `EmergencySOSScreen`, `resolveCountryPack` call sites | Profile vs travel location mismatch | **Behavior** (needs legal) | Auto-dial without confirm |
| **P3** | `VIONA.SOS.AITRIAGE_DOC_HYGIENE.1` | `sosAITriage.ts`, legacy `components/emergency/SOSModal.tsx` | Stale dial-buffer docs | **Docs / dead code** | Live interpreter behavior |

---

## Files inspected (primary)

- `src/config/countryPacks/packs.ts`, `types.ts`, `index.ts`
- `src/screens/EmergencySOSScreen.tsx`
- `src/screens/b2c/SOSModal.tsx`
- `src/screens/b2c/travel/TravelSosHubScreen.tsx`
- `src/services/travel/EmergencySosService.ts`
- `src/services/emergency/emergencyLocation.ts`, `emergencyPhrasePacks.ts`, `sosTelemetry.ts`, `sosAITriage.ts`
- `src/components/viona/VionaSosHoldGateModal.tsx`, `VionaSosHoldButton.tsx`
- `src/components/premium/SOSShieldComponent.tsx`
- `src/screens/LeTanScreen.tsx` (SOS redirect)
- `src/lifeOS/ui/suggestionBuilders.ts`
- `src/i18n/locales/en.json` (`sos`, `emergencySos`, `travelSosHub`)

---

## Validation (this pack)

- `npm run typecheck` — pass (no source changes)
- `npm run lint` — pass (0 errors)
- `npm run smoke` — pass
- **App logic:** unchanged
- **SOS/Home components:** unchanged
- **Routes / nav / auth / payment / wallet / Prisma / packages:** unchanged
