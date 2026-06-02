# VIONA Wave 3B — Local Card Material Lab (Neon Prompts)

Pack: `VIONA.WAVE_3B.LOCAL_CARD_MATERIAL_LAB_FROM_NEON_PROMPTS.1`

## Visual truth

`docs/design/reference/viona-reference-local-card-my-requests.png`

## Stack

- **React Native** `StyleSheet` + **Expo** `expo-linear-gradient`
- **Web:** `box-shadow` / `text-shadow` via RN web styles + `vionaReferenceCardWebGlass()`
- **Not used:** Tailwind / NativeWind (not configured in repo)

## Lab files

| Piece | File |
|-------|------|
| Neon material card + side-by-side lab | `src/components/viona/reference/VionaNeonCardLab.tsx` |
| Hero micro-scene (reused) | `src/components/viona/reference/engine/labs/myRequests/MyRequestsHeroScene.tsx` |
| Material overlays (reused) | `VionaSpecularOverlayLab`, `VionaRefractionOverlayLab`, `VionaLuminousFloorLab` |
| Neon glow helper (web shadow string) | `src/components/ui/neonCardTheme.ts` (`neonCardBoxShadow`) |

## Dev route (env-gated)

- URL: `/viona-neon-card-lab`
- `EXPO_PUBLIC_VIONA_NEON_CARD_LAB=true` (restart Expo after set)
- Not enabled in `__DEV__` alone

## Capture

```bash
EXPO_PUBLIC_VIONA_NEON_CARD_LAB=true npx expo start --web --port 8088
node scripts/capture-viona-neon-card-lab.mjs
```

Evidence: `docs/design/evidence/wave-3b-local-card-material-lab-from-neon-prompts/`

## Material approach

1. **Gradient wrapper** — outer `LinearGradient` with `padding: 1` (no `borderWidth` on shell).
2. **Black crystal body** — `rgba(0,1,3,0.92)` fill; no milky green card wash.
3. **Semantic color** — emerald on rim, specular, refraction, glow, pill, scene only.
4. **Overlays** — top-left specular, inner rim + lower caustic, luminous floor (subtle).
5. **Typography** — bright emerald title + soft glow; three-line muted subtitle; sample `LOCAL` pill.
6. **Scene** — `MyRequestsHeroScene` in lower 72% at ~0.92 opacity (mesh, starburst, pin, platform glow).

## Scoring (0–10 each)

| Dimension | Gate |
|-----------|------|
| Black crystal body | ≥ 8 |
| Gradient border | ≥ 8 |
| Edge glow | ≥ 8 |
| Inner rim / refraction | ≥ 8 |
| Typography glow | ≥ 8 |
| Icon / scene integration | ≥ 8 |
| Same product family | ≥ 8 |

**Any &lt; 8 → NOT MATCHED.** Do not integrate to production Local.

## QA run (2026-05-27)

Capture: `docs/design/evidence/wave-3b-local-card-material-lab-from-neon-prompts/` (5 viewports)
Command: `EXPO_PUBLIC_VIONA_NEON_CARD_LAB=true npx expo start --web --port 8092` + `VIONA_WEB_BASE=http://localhost:8092 node scripts/capture-viona-neon-card-lab.mjs`

| Dimension | Score | Notes |
|-----------|------:|-------|
| Black crystal body | 7.5 | Near-black achieved; reference PNG still reads slightly greener/milkier in body |
| Gradient border | 7.5 | 1px wrapper rim visible; top-left accent not as crisp as reference crop |
| Edge glow | 7.5 | Soft emerald halo; reference outer bloom slightly broader |
| Inner rim / refraction | 7.5 | Specular + lower caustic present; inner rim lighter than reference |
| Typography glow | 8.0 | Title hue/glow close; three-line subtitle rhythm matched |
| Icon / scene integration | 7.5 | Hero scene + platform glow; pin scale/placement still slightly high vs reference |
| Same product family | 8.0 | Reads as VIONA Local emerald flagship |

**Verdict: NOT MATCHED** (gradient border, edge glow, scene integration &lt; 8).

## Safety

- No production `LocalScreen`, `PremiumAppTile`, or `LocalCommandCenterPanel` changes
- No payment / wallet / AI / SOS / i18n / other-universe edits
- Request-status check in hero scene only (not payment success)
