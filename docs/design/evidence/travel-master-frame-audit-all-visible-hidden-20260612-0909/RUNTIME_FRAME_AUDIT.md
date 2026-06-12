# Travel master hero frame — runtime DOM audit

**Port:** 8275 (fresh `expo start --web --clear`)  
**URL:** `http://localhost:8275/travel`  
**Runtime branch:** `viona/travel-active-layer-stacked-qa` (RefLab gate; hero frame metrics match `TravelScreen.tsx` on `05cfb19`)  
**Captured:** 2026-06-12 — see `RUNTIME_FRAME_AUDIT.json`

## Measured hero stage clip (`travel-dynamic-hero-stage`)

| Viewport | Width × Height (px) | Aspect ratio | Text layer width (px) |
| --- | --- | --- | --- |
| 1366×768 | **1334 × 410** | **3.254** | 620 (~46.5%) |
| 1024×768 | **992 × 402** | **2.469** | ~460 |
| 768×1024 (tablet portrait) | **568 × 320** | **1.775** | stack width |
| 390×844 (mobile portrait) | **358 × 300** | **1.193** | ~88% shell |
| 844×390 (mobile landscape) | **812 × 329** | **2.469** | — |
| 1024×1366 (tablet portrait large) | **992 × 402** | **2.469** | — |

## Default base hero image (cover dezoom layer)

At **1366×768** default state:

| Property | Value |
| --- | --- |
| Visible CSS box | **1853 × 569** px (extends past clip; `overflow: hidden` on `heroImageClip`) |
| Clip box | 1334 × 410 |
| `objectFit` | cover (via width/height % dezoom) |
| Asset | `travel-airport-web-normal-master-62h.png` |
| Natural size | **2172 × 724** (3:1) |

Dezoom factor ≈ **1/0.72 ≈ 138.9%** of clip — matches `TRAVEL_DYNAMIC_HERO_IMAGE_COVER_SCALE_NORMAL`.

## Active overlay image (hover translation / taxi / emergency)

| Hover | Overlay CSS box (1366×768) | Natural asset | Alt dezoom visible |
| --- | --- | --- | --- |
| Translation | **2668 × 820** | 2129×738 | Yes (larger raster than default) |
| Taxi | **2779 × 854** | 2129×738 | Yes |
| Emergency | **2668 × 820** | 2129×738 | Yes |

Base default layer remains mounted under overlay (same clip).

## Quick Help flagship card (`travel-flagship-*`)

| Viewport | Card bbox (translation) | Display aspect |
| --- | --- | --- |
| 1366×768 | **323 × 180** | 1.79 |
| 1024×768 | **238 × 180** | 1.32 |
| 768×1024 | **278 × 160** | 1.74 |
| 390×844 | **358 × 118** | 3.03 |

Cards use 2172×724 PNGs with `objectFit: cover` — heavy crop at mobile/narrow widths.

## Lighting network

`travel-hero-lighting-network` matches hero stage bounds: **1334 × 410** at 1366×768 (full bleed over hero, z-index 3).

## Fullscreen

**Not testable in automated run** — fullscreen shell button not matched by Playwright text selector.  
**Code path:** browser document fullscreen → `openingStageFullscreen` → hero target **376px** height, cover scale **0.70** (see `STATIC_CODE_AUDIT.md`).

## Screenshots

- `screenshot-default-*.png` — all viewports
- `screenshot-hover-{translation,taxi,emergency}-1366x768.png`
- `screenshot-hover-lighting-network-1366x768.png`
