# Travel PNG asset dimension audit

**Source:** `ASSET_DIMENSION_AUDIT.json` (29 files)
**Scanned:** `assets/viona/dynamic-hero/travel/`, `assets/viona/travel/`, `_incoming-travel-master-v2-local-standard/` (README only; no v2 PNGs yet)

## Wired runtime assets (8)

| File | Dimensions | Aspect | Category |
| --- | --- | --- | --- |
| `travel-airport-web-normal-master-62h.png` | **2172 × 724** | 3.000 | master (default hero) |
| `travel-translation-assist-web-normal-source.png` | **2129 × 738** | 2.885 | alt hero overlay |
| `travel-rides-assist-web-normal-source.png` | **2129 × 738** | 2.885 | alt hero overlay |
| `travel-emergency-police-web-normal-source.png` | **2129 × 738** | 2.885 | alt hero overlay |
| `travel-airport-web-normal-card-62y.png` | **2172 × 724** | 3.000 | Quick Help card |
| `travel-translation-assist-web-normal-card-62y.png` | **2172 × 724** | 3.000 | Quick Help card |
| `travel-rides-assist-web-normal-card-62y.png` | **2172 × 724** | 3.000 | Quick Help card |
| `travel-emergency-police-web-normal-card-62y.png` | **2172 × 724** | 3.000 | Quick Help card |

## Unique dimension families on disk

| Size | Aspect | Count / role |
| --- | --- | --- |
| **2172 × 724** | 3.000 | Masters + 62y cards (wired) |
| **2129 × 738** | 2.885 | Wired alt hero sources |
| **2560 × 600** | 4.267 | `master-62z` candidate (not wired) |
| **2454 × 641** | 3.828 | Legacy `web-source` (not wired) |
| **2200 × 715** | 3.077 | Legacy `web-source` variants |
| **1916 × 821** | 2.333 | HOLD `assets/viona/travel/` perspective |
| **1672 × 941** | 1.777 | HOLD situation/destination art |

## Incoming v2 folder

`assets/viona/dynamic-hero/_incoming-travel-master-v2-local-standard/` — **spec only** (no PNGs dropped yet).

## Comparison to Local Bright standard

| Lane | Local Bright (reference) | Travel wired |
| --- | --- | --- |
| Ultra-wide master | **2590 × 607** (~4.27:1) | **2172 × 724** (3:1) |
| Measured Travel clip @ 1366×768 | — | **1334 × 410** (~3.25:1) |

**2590×607 does not match Travel’s measured desktop hero clip aspect.** Travel assets and runtime clip are closer to **3:1 – 3.3:1**, not Local’s ~4.27:1.

## Operator concern validated

Alternate **source** assets (2129×738) are slightly taller/narrower than the default master (2172×724) and are composed too tight for the **~3.25:1** full-bleed clip — consistent with operator feedback that dezoom cannot fully fix cropping.
