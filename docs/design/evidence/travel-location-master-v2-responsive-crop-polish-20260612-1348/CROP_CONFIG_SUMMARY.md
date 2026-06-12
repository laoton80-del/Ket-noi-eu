# Location master v2 — responsive crop config

**Pack:** `PACK_TRAVEL_LOCATION_MASTER_V2_RESPONSIVE_CROP_POLISH`  
**File:** `src/screens/b2c/TravelScreen.tsx`  
**Scope:** Top hero `objectPosition` only (default airport layer + Prague/Paris/Berlin overlays)

## Tiers

| Tier | Rule |
|------|------|
| `mobilePortrait` | width &lt; 768 |
| `tabletPortrait` | width ≥ 768, height &gt; width |
| `tabletLandscape` | 768 ≤ width &lt; 1024, landscape |
| `desktop` | 1024 ≤ width &lt; 1366 |
| `largeDesktop` | width ≥ 1366 |
| `fullscreen` | opening stage fullscreen |

## objectPosition by location

| Location | mobilePortrait | tabletPortrait | tabletLandscape | desktop | largeDesktop | fullscreen |
|----------|----------------|----------------|-----------------|---------|--------------|------------|
| airport | 82% 40% | 72% 43% | 66% 44% | 58% 46% | 58% 46% | 58% 44% |
| prague | 64% 48% | 62% 50% | 60% 50% | 58% 50% | 58% 50% | 58% 48% |
| paris | 70% 48% | 66% 50% | 62% 50% | 60% 50% | 60% 50% | 60% 48% |
| berlin | 68% 48% | 64% 50% | 60% 50% | 58% 50% | 58% 50% | 58% 48% |

## Notes

- **Airport mobile** shifts focal right (82%) so the traveler/person stays in frame on narrow portrait clips.
- **Desktop / 1024×768** retains prior focal values (58–60% horizontal).
- Quick Help card `objectPosition` (`TRAVEL_FLAGSHIP_CARD_OBJECT_POSITION`) unchanged.
- Hero-only v2 mapping (`TRAVEL_HERO_LOCATION_MASTER_V2_*`) unchanged.
