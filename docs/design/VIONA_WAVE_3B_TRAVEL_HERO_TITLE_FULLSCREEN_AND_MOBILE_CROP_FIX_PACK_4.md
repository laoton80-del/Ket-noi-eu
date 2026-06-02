# VIONA Wave 3B — Travel Hero Title Fullscreen & Mobile Crop Fix PACK_4

**Task ID:** `VIONA.UI.TRAVEL.HERO_TITLE_FULLSCREEN_AND_MOBILE_CROP_FIX.PACK_4`  
**Scope:** `src/screens/b2c/TravelScreen.tsx` — dynamic hero title typography and mobile stage height only.

## Fullscreen title (Pack 4)

| Token | Pack 3 | Pack 4 |
|-------|--------|--------|
| LARGE fontSize | 52px | **48px** |
| LARGE lineHeight ratio | 1.08 | **1.09** |
| LARGE maxWidth | 820px | **840px** |
| COMPACT / DESKTOP fontSize | 50px | **48px** |

Normal web tokens **unchanged** (57px large / 52px desktop).

## Mobile 390 crop fix

- `stageMinHeight` 236 → **300**, `stageMaxHeight` 368 → **428**
- Title 29px → **27px**, lineHeight ratio **1.18**
- Subtitle 16px → **15.5px**, lineHeight **1.52**
- Tighter vertical rhythm + **24/30px** stack padding (wired to DOM)
- Compact landscape path: min **268** / max **392**

## Evidence

`docs/design/evidence/wave-3b-travel-hero-title-fullscreen-and-mobile-crop-fix-pack-4/`
