# VIONA WAVE 3B — Home Luminous Default Mode Lock

**Task:** `VIONA.WAVE_3B.HOME_LUMINOUS_DEFAULT_MODE_LOCK.1`

## Product decision

Home looks best in **“Bật đèn”** (luminous / daylight boost) presentation. Home should keep this premium luminous state by default on the fashion desktop shell, without removing the global theme toggle or affecting other universes.

## Audit — current Home light/dark behavior

| Layer | Location | Behavior |
| --- | --- | --- |
| Global state | `useVionaHomeDaylightBoost()` | `localStorage` key `viona.daylightBoost.v1`, default **`false`** |
| Home gate | `HomeScreen.tsx` | `fashionDaylight = fashionHomeDesktopShellActive && daylightBoost` (before lock) |
| Shared consumers | `LocalScreen.tsx`, `useMiniAppShellChrome.ts` | Same hook; Local visuals largely theme-invariant |
| Home visuals | `HomeScreen.tsx` (~80+ branches) | Hero glow, world cards, For You, Care Heart, scroll chrome — all keyed off `fashionDaylight` |
| Command bar | `VionaFashionHomeCommandBar.tsx` | Rail gradient/border + utility hovers keyed off `daylightBoost` |

**Impact scope:** Changing `fashionDaylight` in `HomeScreen` only affects Home when the fashion desktop shell is active. Local/Travel/Academy routes and handlers are untouched.

## Implementation — Option A (least risky)

**Home-only luminous lock** via constant:

```ts
// fashionHomeDesktopShell.ts
export const HOME_FASHION_DESKTOP_LUMINOUS_MODE_LOCKED = true;
```

```ts
// HomeScreen.tsx
const fashionDaylight =
  fashionHomeDesktopShellActive &&
  (HOME_FASHION_DESKTOP_LUMINOUS_MODE_LOCKED || daylightBoost);
```

- Home always renders luminous when fashion desktop shell is active.
- Toggle still reads/writes global `daylightBoost` for Local and future shells.
- Toggle label/icon reflect **global preference** (`Bật đèn` / `Tắt đèn`), not Home’s locked visuals.
- Command bar rail uses `commandBarLuminous={fashionDaylight}` so rail matches locked Home; toggle button state stays on `daylightBoost`.

### Toggle / command bar behavior

| Control | Prop | Meaning when lock is on |
| --- | --- | --- |
| Home hero/cards/shell | `fashionDaylight` | Always luminous on fashion desktop |
| Rail gradient + utility hovers | `commandBarLuminous` | Luminous (matches Home) |
| Toggle active state + label | `daylightBoost` | Reflects global stored preference |

This avoids misleading rail styling (dark rail on bright Home) while keeping the toggle honest for cross-universe preference.

## Files changed

- `src/components/viona/fashionHomeDesktopShell.ts` — `HOME_FASHION_DESKTOP_LUMINOUS_MODE_LOCKED`
- `src/screens/HomeScreen.tsx` — luminous lock wiring; fixed Vietnamese toggle labels
- `src/components/viona/VionaFashionHomeCommandBar.tsx` — `commandBarLuminous` split
- `scripts/capture-home-luminous-default-mode-lock.mjs` — QA captures
- `docs/design/evidence/wave-3b-home-luminous-default-mode-lock/*` — screenshots

## Intentionally untouched

- `LocalScreen.tsx`, Travel/Academy/Account screens
- Routes, handlers, SOS gate, payment/wallet/AI/auth
- `App.tsx`, `global.css`, image assets
- Global dark mode and `useVionaHomeDaylightBoost` hook semantics

## Manual QA

1. Open `/home` fresh with `viona.daylightBoost.v1 = 0` → Home appears luminous.
2. Toggle theme button → label/icon updates; Home visuals stay luminous.
3. Navigate to Local → toggle preference still applies there.
4. SOS gate unchanged.

## Evidence

Captures at `docs/design/evidence/wave-3b-home-luminous-default-mode-lock/`:

- `home-luminous-lock-390x844.png`
- `home-luminous-lock-844x390.png`
- `home-luminous-lock-768x1024.png`
- `home-luminous-lock-1024x768.png`
- `home-luminous-lock-1366x768.png`

Run: `EXPO_CAPTURE_PORT=8093 node scripts/capture-home-luminous-default-mode-lock.mjs`
