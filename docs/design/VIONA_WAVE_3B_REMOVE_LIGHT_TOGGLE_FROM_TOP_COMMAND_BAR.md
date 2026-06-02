# VIONA WAVE 3B — Remove Light Toggle From Top Command Bar

**Pack:** `VIONA.WAVE_3B.REMOVE_LIGHT_TOGGLE_FROM_TOP_COMMAND_BAR.1`

## Audit

| Surface | Component | Toggle wiring |
|---------|-----------|---------------|
| Home | `VionaFashionHomeCommandBar` | `HomeScreen` passed `onPressDaylightBoost` |
| Local | Custom `LocalShellUtilityBtn` in `LocalScreen` | `useVionaHomeDaylightBoost()` |
| Travel | `VionaGlobalTopRail` via `VionaMiniAppShell` | `useMiniAppShellChrome({ enableDaylightToggle: true })` |

Theme state: `useVionaHomeDaylightBoost` → localStorage `viona.daylightBoost.v1`. Home locks luminous via `HOME_FASHION_DESKTOP_LUMINOUS_MODE_LOCKED = true`.

## Change

`FASHION_HOME_COMMAND_RAIL_SHOW_DAYLIGHT_TOGGLE = false` gates visible toggle in shared rails. Button UI removed from Local custom rail. Home no longer passes toggle handlers.

Preserved: storage hook, luminous tokens, `daylightBoost` state, `commandBarLuminous` styling.

## Evidence

`docs/design/evidence/wave-3b-remove-light-toggle-from-top-command-bar/`

Capture: `node scripts/capture-remove-light-toggle-from-top-command-bar.mjs`
