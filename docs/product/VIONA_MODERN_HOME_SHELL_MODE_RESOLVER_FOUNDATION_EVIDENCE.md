# VIONA — Modern Home Shell Mode Resolver Foundation Evidence

Operator authorization: `APPROVE_VIONA_MODERN_HOME_SHELL_MODE_RESOLVER_FOUNDATION`

Packet classification: `READY_FOR_VIONA_MODERN_HOME_SHELL_MODE_RESOLVER_PR_REVIEW`

## Markers

```text
VIONA_MODERN_HOME_SHELL_MODE_RESOLVER_FOUNDATION
PHASE_A_ZERO_VISUAL_ACTIVATION
COMPATIBILITY_WRAPPER_DESKTOP_PARITY
MOBILE_TABLET_METADATA_ONLY
PR395_PRESERVED
SOS_PHASE_1_PRESERVED
PHASE_B_NOT_AUTHORIZED
WAVE_2_NATIVE_NOT_RUN
PACK40DR_PRESERVED
PACK40S_NOT_AUTHORIZED
```

## 1. Baseline

| Field | Value |
|---|---|
| origin/master | `a51a633dc572eacfa5ed4898be7ff13fe5e734d0` (contains PR #392–#396) |
| Branch | `feat/viona-modern-home-shell-mode-resolver-foundation` |
| Phase A authorization | `APPROVE_VIONA_MODERN_HOME_SHELL_MODE_RESOLVER_FOUNDATION` |
| Plan | `docs/product/VIONA_MODERN_HOME_FASHION_SHELL_MOBILE_ACTIVATION_PLAN.md` (PR #396) |

## 2. Old predicate

`isFashionHomeDesktopShell` (pre-Phase-A):

- `platform === 'web'`
- `windowWidth >= 769` (`FASHION_HOME_DESKTOP_MIN_WIDTH`)
- `activeRole === 'B2C'`
- focused route is B2C Home (or `/home` pathname fallback)

## 3. New resolver

| Item | Value |
|---|---|
| File | `src/navigation/fashionHomeShellMode.ts` |
| API | `resolveFashionHomeShellMode(input) → 'legacy' \| 'mobile' \| 'tablet' \| 'desktop'` |
| Tablet metadata start | `FASHION_HOME_TABLET_MIN_WIDTH = 768` (activation plan) |
| Desktop render gate | 769 (same as `FASHION_HOME_DESKTOP_MIN_WIDTH`) |

## 4. Compatibility wrapper

```text
isFashionHomeDesktopShell(input) === (resolveFashionHomeShellMode(input) === 'desktop')
```

Implemented in `src/navigation/fashionHomeDesktopShell.ts`.

`HomeScreen` / `MainTabNavigator` / `ProfileSwitcher` continue to call `isFashionHomeDesktopShell` unchanged. No `HomeScreen` / `MainTabNavigator` edits in this pack.

## 5. Mode definitions (Phase A)

| Mode | Meaning | Renders Fashion-Tech desktop path? |
|---|---|---|
| `desktop` | web + B2C Home + width ≥ 769 | **Yes** (current) |
| `tablet` | web + B2C Home + width ≥ 768 and not desktop | **No** (metadata) |
| `mobile` | web + B2C Home + width &lt; 768 | **No** (metadata) |
| `legacy` | native / non-B2C / non-Home | **No** |

## 6. Source-derived breakpoints

| Constant | Value | Source |
|---|---:|---|
| `FASHION_HOME_DESKTOP_MIN_WIDTH` | 769 | Existing navigation helper |
| `FASHION_HOME_TABLET_MIN_WIDTH` | 768 | Merged activation plan matrix |

## 7. Parity proof

`npx tsx scripts/test-viona-modern-home-shell-mode-resolver-foundation.ts` compares a frozen pre-Phase-A reference predicate to `isFashionHomeDesktopShell` for the full matrix + NaN width + pathname fallback → **PASS** (identical truth table).

## 8. Zero-UX-diff proof

- No `HomeScreen.tsx` / `MainTabNavigator.tsx` / fashion visual component edits
- Mobile/tablet modes are non-rendering metadata
- Desktop boolean activation contract unchanged
- Browser non-change verification (below) confirms legacy vs Fashion-Tech path markers

## 9. Test matrix

| Suite | Result |
|---|---|
| Resolver + parity (`test-viona-modern-home-shell-mode-resolver-foundation.ts`) | **OK** |
| SOS Phase-1 | **OK** |
| SOS left-rail remediation | **OK** |
| Profile/Language Phase-2 | **OK** |
| Fashion desktop assertions (embedded in SOS/Profile suites) | **OK** |

## 10. SOS / Profile / Language regression

No edits to SOS, ProfileSwitcher, SmartTrio, or `VionaShellAccountLanguageActions`. Contract scripts remain green (exact-one SOS modal; chrome hosts preserved).

## 11. Typecheck / lint / smoke

| Gate | Result |
|---|---|
| `npx tsc --noEmit` | **OK** |
| `npx eslint` on touched TS | **OK** (`--max-warnings 0`) |
| `npm run smoke` | **OK** |

## 12. Changed paths

1. `src/navigation/fashionHomeShellMode.ts` (new)
2. `src/navigation/fashionHomeDesktopShell.ts`
3. `scripts/test-viona-modern-home-shell-mode-resolver-foundation.ts` (new)
4. `docs/product/VIONA_MODERN_HOME_SHELL_MODE_RESOLVER_FOUNDATION_EVIDENCE.md`
5. `docs/ai-context/VIONA_KERNEL_HANDOFF_FAST_SAFE_GLOBAL_MODE.md`
6. `Handoff_VIONA11726.txt`

## 13. Browser non-change verification (local Expo web `http://localhost:8081/home`)

| Width | Expected path | Observed markers |
|---:|---|---|
| 390 | legacy/hybrid | tabs=4; Proactive shortcuts; Open account hub; Language & market; SOS emergency entry ×1 |
| 430 | legacy/hybrid | same legacy markers; tabs present |
| 768 | legacy/hybrid | same legacy markers; Fashion-Tech desktop **not** active |
| 769 | Fashion-Tech desktop | VIONA Hub + Explore VIONA; no bottom account/language chrome; SOS emergency entry ×1 |
| 1024 | Fashion-Tech desktop | same Fashion-Tech markers as 769 |
| 1366 | Fashion-Tech desktop | same Fashion-Tech markers as 769 |

No changed hero family, tab visibility contract, command-bar gate, or SOS/profile/language host count relative to pre-Phase-A behavior at these widths.

## 14. Limitations

- Physical native **NOT RUN**
- Phase B mobile-web activation **NOT AUTHORIZED**
- Pack40DR preserved; Pack40S unauthorized

## 15. Final classification

`READY_FOR_VIONA_MODERN_HOME_SHELL_MODE_RESOLVER_PR_REVIEW`
