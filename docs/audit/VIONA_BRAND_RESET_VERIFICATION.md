# VIONA Brand Reset P0 — Verification Report

**Auditor role:** Brand QA (read-only verification; no code changes in this pass)  
**Repo snapshot:** `git status` clean (no uncommitted changes at verification time)  
**Date:** 2026-05-05  

---

## 1. Executive summary

Recent commits establish a coherent **VIONA** shell for identity, core **vi/en/cs/de** locale strings, **VIONA asset pack** under `assets/brand/viona/`, and **Expo** icon/splash/favicon/adaptive paths in `app.config.js` / `app.json`. Targeted P0 screens (`B2BPaywallScreen`, `MeshRadar`) and shared wallet biometric copy in `strings.ts` align with the audit patterns when grep-scoped.

**Gaps:** Public-facing legacy strings remain in multiple flows—notably **`WelcomeScreen`** (still driven by `src/config/brandConfig.ts` with `publicName: 'ViGlobal'`), **`ViralWrapScreen`** (ViGlobal tagline, hashtags, a11y label), **`GlobalWalletScreen`** (“Ví Global”), and **non-P0 locales** (`fr.json`, `ja.json`, `ko.json` hub/SOS copy). Widespread **ViGlobal / Kết Nối Global / VIG Token** wording persists across marketing, academy, commercial, alerts, and server/email defaults—mix of user-visible UI and internal/documentation layers (see sections 2–3).

**Verdict for strict external demo:** **Not fully ready** until first-run welcome and high-share surfaces are aligned; acceptable for **internal technical demo** if stakeholders avoid those routes/locales (section 10).

---

## 2. Public legacy brand remnants still found

Method: `rg` over `src/**/*.{tsx,ts,json}` for: `ViGlobal`, `Kết Nối Global`, `VIG Token`, `VIG Tokens`, `nạp VIG`, `Ví Global`. (`KNG` is intentionally narrow-listed below—high volume in comments/routes; call out only clear **user-facing** examples.)

### High-impact (likely user-visible soon)

| Area | Finding |
|------|---------|
| **Welcome / first paint** | `WelcomeScreen.tsx` imports `BRAND_CONFIG` from `src/config/brandConfig.ts` → renders **`ViGlobal`** as logo text, legacy tagline, “Powered by KNG Ecosystem”. |
| **Stale brand module** | `src/config/brandConfig.ts`: `publicName: 'ViGlobal'`, `supportEmail: 'support@viglobal.app'` — conflicts with `brandConfig` / `APP_BRAND` VIONA spine. |
| **Share / viral** | `ViralWrapScreen.tsx`: ViGlobal in `viralTagline`, share hashtags `#ViGlobal`, `accessibilityLabel="ViGlobal"`. |
| **Wallet UX** | `GlobalWalletScreen.tsx`: “**Ví Global**”, biometric prompt “mở **Ví Global**”. |
| **Live interpreter / AI energy** | `liveInterpreterService.ts`, `AIEngine.ts`: English user message “top up **VIG Tokens**”. |
| **LifeOS** | `LifeOSDashboard.tsx`: copy still “**VIG Token**”. |
| **Payments pricing labels** | `PaymentsService.ts`: labels like “**VIG Token**/cuộc”. |
| **Loyalty UX** | `LoyaltyService.ts` user message “**VIG Token**”; `CertificateGenerator.tsx` / academy UI “**VIG Token**”. |
| **Merchant trial trap** | `v7MerchantTrialTrap.ts`: merchant-facing “**VIG Token** top-up required…”. |
| **Alerts / titles** | Examples: `RoleSelectionScreen`, `CaNhanScreen`, `TienIchScreen`, `PartnerOnboardingScreen`, `ProSubscriptionPaywall`, `ultraMasterBookingFlow` — **Kết Nối Global** or **ViGlobal** in `Alert` titles or headings. |
| **Voice onboarding** | `voiceClient.ts`: CSKH script references **Kết Nối Global**. |
| **QR / permissions** | `QRScannerScreen.tsx`: “**ViGlobal** uses your camera…”. |
| **Live Activity** | `liveActivityService.ts`: title **Kết Nối Global**. |
| **Notifications fallback** | `centralDispatcherExecution.ts`: default title **ViGlobal**. |

### Locales outside P0 (public JSON strings)

| File | Pattern |
|------|---------|
| `src/i18n/locales/fr.json` | ViGlobal Command Center / scroll kicker (hub/tourism/SOS-style keys present in file). |
| `src/i18n/locales/ja.json` | Same class of strings. |
| `src/i18n/locales/ko.json` | Same class of strings. |

### P0-scoped locale / shared strings (audit targets)

| Target | Result for listed patterns |
|--------|----------------------------|
| `vi.json`, `en.json`, `cs.json`, `de.json` | **No matches** for the patterns above. |
| `strings.ts` | **No matches** for those patterns (wallet biometric uses VIO/VIONA-aligned wording). |
| `HomeScreen.tsx` | **No matches** (logo asset wired to VIONA pack; see section 6). |
| `B2BPaywallScreen.tsx` | **No matches**. |
| `MeshRadar.tsx` | **No matches**. |

### `nạp VIG`

- **No matches** in `src` for exact phrase `nạp VIG` at verification time. (Related concepts may still appear as “top-up VIG Tokens” in English.)

---

## 3. Internal legacy names allowed (non-goals for P0 copy sweep)

Examples that are **acceptable to defer** unless product mandates zero literal mentions in repo:

- **Identifiers / constants:** `ViGlobalBookingLock`, `ViGlobalCancellationPenalty`, `ViGlobalAI`, `ViGlobalPlatformAI`, channel/participant names, ledger keys.
- **Module/file naming:** `viGlobalWalletApi.ts`, `viGlobalUserPersonaApi.ts`, REST path commentary (`ViGlobal Express API`).
- **Internal brand spine:** `APP_BRAND.internalName` / `masterName`, `brandConfig.legacyNames`, `brandNameForSurface('b2b'|'internal')` returning KNG / master name where intentionally internal.
- **Docs-only / comments:** File headers describing historical “ViGlobal blueprint”, typography comment referencing wordmark, etc.
- **Demo/marketing automation:** `DemoSandbox.ts`, `AIPostGenerator.ts`, outbound sales templates—often internal or synthetic; still risky if surfaced verbatim to end users.

---

## 4. App config / asset check

### Git

- `git status --short`: **clean** (empty).
- `git log --oneline -15` (abbreviated):  
  `f615516` fix(brand): clean remaining public legacy copy  
  `84990da` docs: add VIONA brand localization and web UI audits  
  `5518174` feat(brand): integrate VIONA app assets  
  `5015b3a` feat(brand): update VIONA app identity and core i18n  
  … (older commits omitted)

### `app.config.js` (verified)

- `expo.name`: **VIONA**
- `icon` / `ios.icon`: `./assets/brand/viona/app-icon.png`
- `splash.image`: `./assets/brand/viona/splash.png`, `backgroundColor`: **`#071936`**
- `android.adaptiveIcon.foregroundImage`: `./assets/brand/viona/adaptive-icon.png`, `backgroundColor`: **`#071936`**
- `web.favicon`: `./assets/brand/viona/favicon.png`; `themeColor` / `backgroundColor`: **`#071936`**
- Plugin **`expo-splash-screen`**: image → `./assets/brand/viona/splash.png`, backgrounds **`#071936`** (light + dark)
- **Unchanged per historical intent:** `slug`, `scheme`, `bundleIdentifier`, `package`
- **Note:** `expo-notifications` plugin still uses `./assets/images/icon.png` and color `#0B2A66` — not the VIONA pack foreground (optional P1 alignment).

### `app.json` (verified)

- Mirrors VIONA asset paths and **`#071936`** splash / adaptive background where keys exist.
- Does not duplicate full `web` theme fields present in `app.config.js` (expected when JS config is source of truth).

### `assets/brand/viona/*`

All five expected files **present**:

- `app-icon.png`, `adaptive-icon.png`, `splash.png`, `favicon.png`, `logo-in-app.png`

---

## 5. i18n check by locale

| Locale file | Assessment (patterns §2) |
|-------------|-------------------------|
| `vi.json` | **Clean** on audited legacy patterns. |
| `en.json` | **Clean**. |
| `cs.json` | **Clean**. |
| `de.json` | **Clean**. |
| `fr.json`, `ja.json`, `ko.json` | **ViGlobal** / Command Center strings **still present** in tourism/hub/SOS-related keys (not part of P0 cs/de sweep). |

`src/i18n/strings.ts`: **Clean** on audited patterns for wallet/biometric locales verified in prior work.

---

## 6. Logo / icon / splash / favicon check

| Surface | Status |
|---------|--------|
| Expo **app icon** | `./assets/brand/viona/app-icon.png` |
| **Splash** | `./assets/brand/viona/splash.png`, navy **`#071936`** |
| **Android adaptive** | `./assets/brand/viona/adaptive-icon.png`, bg **`#071936`** |
| **Web favicon** | `./assets/brand/viona/favicon.png` |
| **Home in-app logo** | `HomeScreen.tsx` → `require('.../assets/brand/viona/logo-in-app.png')` |
| **Viral wrap header image** | `ViralWrapScreen.tsx` → same `logo-in-app.png` path (copy around it still says ViGlobal — section 2) |
| **Push notification small icon (Android)** | Still `./assets/images/icon.png` in plugin config — legacy path |

---

## 7. Logic safety check

This verification **did not modify** runtime logic. Observed changes from brand commits are **configuration and copy/asset paths** only; **slug/scheme/bundle ID/package** unchanged. No evidence in this pass that Prisma, auth, payment, or booking math was altered by the brand-reset commits (consistent with commit titles and file scope).

---

## 8. Typecheck / lint result

| Command | Result |
|---------|--------|
| `npm run typecheck` | **Pass** (`tsc --noEmit`) |
| `npm run lint` | **Pass with warnings**: **0 errors**, **51 warnings** (pre-existing style/hooks/import issues across unrelated files) |

---

## 9. Remaining P1 / P2 work

**P1 (demo-blocking for brand consistency)**

1. Replace or remove `src/config/brandConfig.ts` usage; align **`WelcomeScreen`** with `brandConfig` / `APP_BRAND` VIONA public spine.
2. **`ViralWrapScreen`**: ViGlobal tagline, hashtags, a11y label → VIONA / VIO Credits naming policy.
3. **`GlobalWalletScreen`**: retire “Ví Global” in favor of VIONA / VIO Credits wallet language.
4. Sweep **alert titles and onboarding hero** still saying Kết Nối Global / ViGlobal (`RoleSelectionScreen`, `CaNhanScreen`, `TienIchScreen`, commercial flows, etc.).
5. **`fr` / `ja` / `ko`** JSON: parity pass with vi/en for hub/SOS/tourism public strings.
6. Align **`expo-notifications`** icon with VIONA asset (or documented intentional exception).

**P2 (credit taxonomy & depth)**

1. Standardize user-visible **VIG Token(s)** → **VIO Credits** / **VIO Points** per product rules (`LifeOSDashboard`, `PaymentsService` labels, loyalty/academy, English depletion messages, merchant trap copy).
2. Email/server defaults (`EmailOtpService` `MAIL_BRAND_NAME`, `PaymentController` / `VietQRService` purpose strings) if customer-visible.
3. Academy certificates / share SVGs (`ShareAchievementButton`, `CertificateGenerator`) — ViGlobal marks.
4. Optional: reduce **ViGlobal** mentions in AI prompts and demo sandboxes if any output is shown to prospects.

---

## 10. Final recommendation: ready / not ready for demo

| Scenario | Recommendation |
|----------|----------------|
| **Strict external PR / App Store story** | **Not ready** — first-run welcome still shows **ViGlobal**; viral share and multiple alerts contradict VIONA-only messaging. |
| **Internal stakeholder demo** (avoid Welcome, Viral Wrap, FR/JA/KO, wallet lock strings) | **Ready with documented caveats** — core **vi/en/cs/de** JSON, targeted P0 screens, and Expo visuals align with VIONA P0. |
| **Production readiness** | **Not ready** — complete P1 minimum plus regression pass on notifications and payment descriptors. |

---

## Appendix: Commands run

```bash
git status --short
git log --oneline -15
npm run typecheck
npm run lint
```

Manual review: `app.config.js`, `app.json`, `src/config/appBrand.ts`, listed locale files, `strings.ts`, `HomeScreen.tsx`, `B2BPaywallScreen.tsx`, `ViralWrapScreen.tsx`, `MeshRadar.tsx`, repository-wide pattern search as summarized in §2–3.
