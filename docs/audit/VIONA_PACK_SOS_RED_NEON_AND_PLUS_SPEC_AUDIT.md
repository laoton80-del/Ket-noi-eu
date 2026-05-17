# Audit pack: SOS red-neon desktop Home + SOS Plus spec (UI / docs only)

**Pack scope:** Desktop Home SOS presentation (top command shell + quick actions), optional pre-login stub on `LoginScreen`, hold-to-continue gate modal before invoking the **existing** in-app SOS handler, i18n keys, and product/audit documentation.  
**Explicitly out of scope:** payment logic, booking, wallet backend, API/DB/Prisma, Twilio, AI provider calls, feature flags, route renames, real PSTN automation, recording pipelines, entitlements for SOS Plus.

## Verification checklist

| Item | Evidence / note |
|------|------------------|
| “Safety Assist” removed from desktop Home chrome | Command bar + quick actions use `sos.chip` / shield icon; legacy `shell.utility.safetyAssist` value may remain `"SOS"` for compatibility |
| Red neon SOS | `vionaTokens.fashionTech.sosNeon`, `sosNeonGlow`; `VionaQuickActionPill` `sos` accent; command bar `sosBtn` styles |
| No floating SOS orb on fashion desktop | Unchanged: `MainTabNavigator` + `fashionHomeDesktopShell` still suppress `SOSFloatingButton` on fashion desktop |
| No floating Account/Language | Unchanged: `ProfileSwitcher` + `SmartTrioLanguageSheet` integration |
| No desktop bottom tab on `/home` | Unchanged: `fashionHomeHiddenTabBarStyle` |
| Hold gate | `VionaSosHoldGateModal` + `VionaSosHoldButton` — **3s press-and-hold** progress UI; on complete calls existing `homeCommand.triggerSafetyAssist()` (existing SOS sheet / triage behavior) |
| No new emergency calling/recording | Hold stub + docs; TODO comments in component source |
| Pre-login | `LoginScreen` SOS pill → `Alert` with `sos.preLoginTitle` / `preLoginBody` / `disclaimer` — **no navigation** to authenticated tabs |

## i18n (EN + VI)

New keys under `sos.*`: `chip`, `a11yChip`, `holdHelper`, `holdA11y`, `plusName`, `priceEur`, `disclaimer`, `preLoginTitle`, `preLoginBody`, `preLoginAck`, `cancelHold`, `gateTitle`, `gateSub`.

**Successor verification:** AF.SOS.1 implementation audit — `docs/audit/VIONA_AF_SOS_PLUS_SURFACE_AUDIT.md`.

## Files touched (this pack)

- `src/components/viona/VionaSosHoldButton.tsx` (new)
- `src/components/viona/VionaSosHoldGateModal.tsx` (new)
- `src/components/viona/index.ts` (exports)
- `src/components/viona/VionaFashionHomeCommandBar.tsx` (shield + `sos.chip`)
- `src/screens/HomeScreen.tsx` (hold gate wiring)
- `src/screens/LoginScreen.tsx` (pre-login SOS stub)
- `src/components/viona/VionaQuickActionPill.tsx` (unchanged behavior; consumer passes `shield` icon)
- `src/i18n/locales/en.json`, `src/i18n/locales/vi.json`
- `docs/product/VIONA_SOS_PLUS_PRODUCT_SPEC.md`
- `docs/audit/VIONA_PACK_SOS_RED_NEON_AND_PLUS_SPEC_AUDIT.md` (this file)

## Residual risk / follow-ups

- **Legal / privacy:** Any future voice triage, recording, or location sharing requires separate DPIA-style review per market.
- **Entitlements:** SOS Plus pricing copy is **positioning only** until billing product definitions exist.
- **Non-EN locales:** Other JSON locales fall back to English for missing `sos.*` keys until translated.

## Sign-off criteria for a future “implementation” pack

- [ ] Regional emergency number data source + maintenance process
- [ ] False-positive and abuse mitigations for voice keywords
- [ ] Consent flows for recording and location
- [ ] No marketing copy implying guaranteed rescue or official dispatch
