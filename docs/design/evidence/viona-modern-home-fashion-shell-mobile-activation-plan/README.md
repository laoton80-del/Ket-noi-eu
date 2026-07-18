# Evidence — Modern Home Fashion Shell Mobile Activation Plan

**Packet:** Docs-only architecture plan  
**Authorization:** `APPROVE_VIONA_MODERN_HOME_FASHION_SHELL_MOBILE_ACTIVATION_PLAN`  
**Baseline:** `origin/master @ fec4a74b3f71d7a6973fce4d6836bd4f233c0a80`  
**Plan:** `docs/product/VIONA_MODERN_HOME_FASHION_SHELL_MOBILE_ACTIVATION_PLAN.md`

## Markers

```text
DOCS_ONLY
NO_SOURCE_IMPLEMENTATION
NO_RUNTIME_ACTIVATION
NO_BREAKPOINT_CHANGE
NO_WORKTREE_RECOVERY
NO_DEVICE_PASS_CLAIM
PR395_MERGED_KEEP_UNCHANGED
```

## Read-only source inspected

- `src/navigation/fashionHomeDesktopShell.ts` — web + width ≥ 769 gate
- `src/screens/HomeScreen.tsx` — dual-path fashion vs legacy blocks
- `src/screens/b2c/DashboardB2CScreen.tsx` — legacy accordion content
- `src/navigation/MainTabNavigator.tsx` — SOS + PR #395 chrome hosts; fashion tab-bar hide
- `src/components/viona/fashionHomeDesktopShell.ts` — layout tokens / web helpers
- `src/components/viona/VionaFashionHomeCommandBar.tsx` — desktop command rail (minWidth / hover)
- `src/components/viona/VionaFashionWorldCard.tsx`
- `src/components/viona/VionaShellAccountLanguageActions.tsx`
- `src/components/viona/VionaGlobalSosShellAction.tsx`
- ProfileSwitcher / Smart Trio language components (capability preservation)
- AE3 audit + Fashion-Tech design docs

## Gate evidence (current master)

| Condition | Effect |
|---|---|
| `platform !== 'web'` | Fashion shell never activates (native always legacy path) |
| `windowWidth < 769` | Fashion shell never activates (mobile web legacy/hybrid) |
| Fashion active | Tab bar hidden; command bar owns Account/Language/SOS entry |
| Fashion inactive + SOS chrome mount | PR #395 Account/Language + Phase-1 SOS in tab chrome |

## Historical worktree recovery

**Not required.** Diagnosis remains `MODERN_MOBILE_UI_ALREADY_ON_MASTER_BUT_NOT_ACTIVE`.  
Dirty Local/Travel asset worktrees are not a Home shell replacement and were not copied.

## PR #395 compatibility

Merged on master (`fec4a74`). Disposition: **`KEEP_MERGED_PHASE2_UNCHANGED`**.  
Mobile fashion activation must preserve exact-one Account/Language hosts (typically keep tab chrome on mobile; command bar remains desktop).

## Explicit non-claims

- No source implementation  
- No Fashion-Tech shell activation  
- No breakpoint / platform predicate change  
- No physical iOS/Android PASS  
- Pack40DR preserved; Pack40S unauthorized  

## Classification

`READY_FOR_VIONA_MODERN_HOME_MOBILE_ACTIVATION_PLAN_PR_REVIEW`
