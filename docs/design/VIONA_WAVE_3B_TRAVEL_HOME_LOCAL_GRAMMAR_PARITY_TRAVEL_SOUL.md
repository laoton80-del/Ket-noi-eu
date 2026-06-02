# VIONA Wave 3B — Travel Home/Local Grammar Parity (Travel Soul)

**Wave ID:** `VIONA.WAVE_3B.TRAVEL_HOME_LOCAL_GRAMMAR_PARITY_TRAVEL_SOUL.1`
**Scope:** Travel hub opening stack only — no Home/Local/global/navigation changes.

## Goal

Re-align Travel with VIONA opening-stage grammar (Home + Local) while preserving midnight cinematic Travel identity.

## Grammar audit

| Layer | Home | Local | Travel (before) | Travel (after) |
|-------|------|-------|-----------------|----------------|
| Opening hero | Dynamic daylight hero + scrim | `LocalDynamicHero` | Cinematic midnight hero | Same asset/stage — unchanged |
| Hero → cards gap | 6px (`HERO_TO_CARD_GAP`) | 6px via `LocalOpeningStageLayout` | Pilot strip blocked flagship row | **6px** to flagship kicker |
| Flagship row | 4 world cards + kicker | 4 parity cards + kicker | Quick help below pilot strip | **3 quick-help flagship tiles** directly under hero |
| Utility grid | Quick action pills | Quick actions row | Scenarios below quick help | Scenarios after opening stage bridge |
| Secondary | SOS / wallet / promos | Classifieds, merchant, connected | Pilot + destination dominated fold | **Pilot + destination + local helper + connected chips** below scenarios |
| Connected links | In scroll secondary | `LocalConnectedUniverseLinks` in scroll | After inline dock (separate rail) | **In-scroll secondary chips** (Local pattern) |

## Why Travel felt disconnected

1. **Pilot strip above flagship row** — broke Home/Local hero → cards rhythm.
2. **Connected universes after dock** — felt like a separate rail, not secondary scroll content.
3. **Quick-help kicker** — heavy cyan glow vs Local uppercase semibold section labels.
4. **No opening-stage wrapper** — hero and flagship cards were not grouped as one first-screen unit.

## Structural changes

1. `travelOpeningStage` wraps hero + quick-help flagship row.
2. `travelOpeningGrammarMetrics` — Home `HERO_TO_CARD_GAP` (6px desktop), Local kicker→grid (4px), scenarios bridge (12px desktop).
3. Pilot strip moved to **secondary zone** (after scenario grid).
4. Connected links moved from `childrenAfterDock` into **secondary zone** as flex-wrap chips.
5. `TravelAppTile` quick-help variant — slightly taller flagship metrics + title emphasis.

## Travel-specific (preserved)

- Midnight canvas + cyan semantic glow
- Cinematic airport hero asset + stage metrics (Pack 2)
- Pilot/demo/lite/preview labels and strip copy
- Consent gate, safety disclaimers, EmergencySOS route
- All scenario handlers, Leona/interpreter flows
- Travel Lite positioning — no fake booking/OTA claims

## Evidence

Captures: `docs/design/evidence/wave-3b-travel-home-local-grammar-parity-travel-soul/`
Script: `scripts/capture-travel-home-local-grammar-parity-travel-soul.mjs`

## Commit recommendation

**New commit** — structural reorder (opening stack + connected-link placement) is a substantial Pack 5–class change; do not amend Pack 4 pilot-strip commit.
