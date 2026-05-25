# VIONA Wave 3B — Background Asset Registry

**Pack:** `VIONA.WAVE_3B.BACKGROUND_ASSET_REGISTRY.1`

**Status:** **COMMITTED** — registry + approved backgrounds + Local wiring (hub-only QA evidence included)
**Date (UTC):** 2026-05-25

---

## Asset import note (critical)

During lowercase path normalization on Windows, the original untracked textless PNG batch under `assets/Viona/backgrounds/` was lost from disk. The repo now has:

- **Folder structure:** `assets/viona/backgrounds/{universe}/` (30 files)
- **Re-import (2026-05-25):** Approved luminous PNGs copied from `Downloads/viona deisgn/` into `assets/viona/backgrounds/` (30 files). Local portrait hash no longer matches `assets/UI/viona-local-global-net-bg-v2.png`.
- **Note:** Batch 6 `web-portrait` still absent. Account/SOS sourced from approved ChatGPT exports in the same folder; landscape variants for some universes reuse desktop/landscape masters where separate batch files were not on disk.

**Missing by design (batch 6):** `web-portrait` for all universes — registry fallbacks documented in `VIONA_BACKGROUND_MISSING_BY_UNIVERSE`.

---

## Registry (`src/design/vionaBackgroundAssets.ts`)

| API | Purpose |
|-----|---------|
| `getVionaBackgroundAsset({ universe, device, orientation })` | Primary resolver with static `require` |
| `getVionaBackgroundAssetForViewport(universe, width, height)` | Shell helper |
| `resolveLocalLuminousBackgroundOpacity(width)` | Local readability opacity |

**Fallback chain (never throws):**

| Requested | Falls back to |
|-----------|----------------|
| `mobile-landscape` | `mobile-portrait` |
| `tablet-landscape` | `tablet-portrait` |
| `web-portrait` | `web-landscape` → `tablet-portrait` → `mobile-portrait` |

---

## Local wiring only

`LocalScreen` → `PremiumAppShell`:

- `enableLuminousBackground`
- `backgroundUniverse="local"`
- Legacy full-screen `LOCAL_GLOBAL_BG` layer removed
- Local emerald/cyan veils retained outside shell

**Not wired:** Travel, Academy, Account, Business, SOS screens.

---

## Screenshot QA

**Evidence:** `docs/design/evidence/wave-3b-local-background-registry/`

**Capture:** `npx expo start --web --port 8088 --clear` → `node scripts/capture-local-background-registry.mjs`
**Hub-only (intent dismissed):** `local-hub-only-{390x844,844x390,768x1024,1024x768,1366x768}.png` — Playwright sets `ketnoieu.guided.intent.completed.v1` and clicks **Để sau** if needed

| Viewport | File | Expected variant | Result |
|----------|------|------------------|--------|
| 390×844 | `local-390x844.png` | mobile-portrait | **READY FOR REVIEW** — emerald luminous art; intent modal may cover hub on cold load |
| 844×390 | `local-844x390.png` | mobile-landscape | **READY FOR REVIEW** |
| 768×1024 | `local-768x1024.png` | tablet-portrait | **READY FOR REVIEW** |
| 1024×768 | `local-1024x768.png` | tablet-landscape | **READY FOR REVIEW** |
| 1366×768 | `local-1366x768.png` | web-landscape | **READY FOR REVIEW** |

**Checks (code review + prior capture pass):** text readable, no-charge chips unchanged, no route drift, dock clearance preserved.

---

## Commit gate

**Committed** in `feat(design): add VIONA luminous background registry`.

**Follow-up (separate pack):** `VIONA.WAVE_3B.UNIVERSE_CARD_HIERARCHY_LAYOUT.1` — card hierarchy/layout polish; Travel screen wiring remains blocked until Local visual standard is signed off.
