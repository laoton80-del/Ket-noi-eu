# Recommended Travel master v2 generation sizes

Based on static code audit + runtime DOM measurements + on-disk asset dimensions.
**Do not use Local Bright 2590×607 blindly for Travel** — measured Travel desktop clip is **~3.25:1**, not **~4.27:1**.

## 1. Best web/desktop master generation size

**Primary recommendation: 2600 × 800 px** (aspect **3.25:1**)

Rationale:

- Matches measured hero clip at 1366×768: **1334 × 410** (3.254:1).
- Closer to runtime than current 2172×724 (3:1) or 2129×738 (2.885:1).
- Acceptable alternate: **2400 × 738** (~3.26:1) if pipeline prefers round numbers.

**Not recommended as primary:** 2590×607 (Local Bright) unless Travel hero stage aspect is changed to match Local.

## 2. Tablet landscape (1024×768)

Measured clip: **992 × 402** (2.469:1 — height capped, aspect constant kicks in).

- **One ultra-wide master can serve** if composed with safe zones; cover crop will trim top/bottom more at this breakpoint.
- Optional tuned crop export: **2400 × 972** (2.47:1) — lower priority than desktop master.

## 3. Tablet portrait (768×1024, 1024×1366)

Measured clip: **568 × 320** to **992 × 402** depending on width.

- Same master with cover + `objectPosition` is current architecture.
- **Separate tablet portrait master not required** if v2 composition keeps subject center-right and text-safe left third.
- If art team wants pixel-perfect: **1600 × 900** (16:9) card-grade crops for marketing only — not required for runtime.

## 4. Mobile portrait (390×844)

Measured clip: **358 × 300** (1.19:1 — very tall/narrow effective frame).

- **Do not author a dedicated mobile master** — cover crop from web master is intentional.
- Ensure subject stays in **right 55–70%** so mobile center-crop does not amputate faces.

## 5. One master vs multiple masters

| Use case | Recommendation |
| --- | --- |
| Full-bleed hero (default + alt overlay) | **One family at ~3.25:1** (2600×800) for translation/rides/emergency v2 + optional airport v2 |
| Quick Help cards | **Separate card artwork** at **2172 × 724** or **1920 × 640** (3:1) — displayed at ~1.3–1.8:1 with cover |
| Fullscreen mode | **No separate asset** — code dezoom 0.70 on same master |
| Mobile | **No separate asset** |

**One-size ultra-wide master sufficient for hero:** YES, at **~3.25:1** (not 2590×607).
**Separate responsive crops needed:** YES for **card tiles only**; optional later for marketing.

## 6. Safe-zone coordinates (for 2600 × 800 master)

| Zone | Horizontal (px) | % | Guidance |
| --- | --- | --- | --- |
| Text / negative space | 0 – **1248** | 0 – 48% | Calm airport background; no faces, no busy detail |
| Subject / action | **1508 – 2132** | 58 – 82% | Traveler, staff, car, officer fully visible |
| Right breathing margin | **2288 – 2600** | 88 – 100% | 8–12% empty after subject |
| Top margin | 0 – **80** | — | No cropped heads |
| Bottom margin | **720 – 800** | — | Feet, suitcase, car wheels visible |

## 7. v2 filename mapping (from staging spec)

Drop into `_incoming-travel-master-v2-local-standard/`:

1. `travel-translation-assist-web-normal-master-v2.png` → **2600×800**
2. `travel-rides-assist-web-normal-master-v2.png` → **2600×800**
3. `travel-emergency-police-web-normal-master-v2.png` → **2600×800**
4. Optional `travel-airport-web-normal-master-v2.png` → **2600×800**

Card variants (if regenerated): keep **3:1** (~2172×724) with subject centered for tile crop.

## Next step

**A) Generate v2 images at audited size/safe zones** — then wire in a follow-up pack (not this audit).
