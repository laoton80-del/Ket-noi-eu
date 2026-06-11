# Travel dynamic-hero existing assets — approval manifest

**Pack:** PACK_TRAVEL_USE_EXISTING_DYNAMIC_HERO_ASSETS  
**Date:** 2026-06-11  
**Branch:** `viona/travel-multi-scene-restore`

## Operator statement

Operator identified correct Travel images in `C:\KNG\ket-noi-eu\assets\viona\dynamic-hero\travel`. Previous Travel restore image set in `assets/viona/travel/` remains **HOLD** — not deleted, not final-approved.

## Acceptance note

**Use only after visual slot QA passes.**

## Safety note

**Artwork only.** No booking, payment, SOS dispatch, emergency routing, or production automation behavior changed.

## Selected files

| Slot | Filename | Source path | Target path | Dimensions | SHA256 |
| ---- | -------- | ----------- | ----------- | ---------- | ------ |
| Main hero / airport journey | `travel-airport-web-normal-master-62h.png` | `C:/KNG/ket-noi-eu/assets/viona/dynamic-hero/travel/` | `assets/viona/dynamic-hero/travel/` | 2172×724 (3:1) | `29e529874018a10c56f19b29a147a40e3dc522a9934e4641558d63d7557dc3e3` |
| Quick Help Airport card | `travel-airport-web-normal-card-62y.png` | same | same | 2172×724 (3:1) | `50f3d218e0a8b1d8227cd7ae60a55bb5c938f6b52323e8beb941dd42fc0a90aa` |
| Quick Help Translation card | `travel-translation-assist-web-normal-card-62y.png` | same | same | 2172×724 (3:1) | `2e6c102088e15dfad22b780605fcae9e0b446dd4c33e5e2c4e86425d267de980` |
| Translation hero hover | `travel-translation-assist-web-normal-source.png` | same | same | 2129×738 (2.885:1) | `f2841467b903e8e439913ed4f3102f0e1dd7c1a1ab23421511b2f5c32e1c2ffb` |
| Quick Help Rides card | `travel-rides-assist-web-normal-card-62y.png` | same | same | 2172×724 (3:1) | `759c6e0d25bf08ee757da9a42e9c068abb7ac4f50649a082f8c7d755798059d0` |
| Rides hero hover | `travel-rides-assist-web-normal-source.png` | same | same | 2129×738 (2.885:1) | `9d7d0d1aafbb6efee7a8e854dffbf3f71f8d6f799dbe72faf7074104c58a5ba2` |
| Quick Help Emergency card | `travel-emergency-police-web-normal-card-62y.png` | same | same | 2172×724 (3:1) | `9fdaedbfd17d7fac52ab66706d08c2290a8d56535b95cd3f79dc7a083bbf459f` |
| Emergency hero hover | `travel-emergency-police-web-normal-source.png` | same | same | 2129×738 (2.885:1) | `17c8525a6a0f23502035f629dfe5128f2a66d049a608d3c7af976bebac4d3f4d` |

## Neutral fallbacks (no dedicated source asset)

| UI slot | Wired to | Note |
| ------- | -------- | ---- |
| Transit/MHD situation hover | Airport master | No transit asset in source folder |
| Hotel/stay hover | Airport master | No hotel asset in source folder |
| Hospital hover | Airport master (via journey key) | No hospital asset in source folder |
| Shopping hover | Airport master (via global key) | No shopping asset in source folder |
| Restaurant / local concierge band | Airport master | No local-support asset; Paris guide rejected |
| Perspective cards | Retained HOLD assets in `assets/viona/travel/` | Not in dynamic-hero source folder |
| Destination lens / situation bg | Retained HOLD assets in `assets/viona/travel/` | Not in dynamic-hero source folder |

## Selection rationale

- **62y** card variants: middle editorial balance across airport/translation/rides/emergency groups.
- **master-62h** for main hero: standard 3:1 web-normal master (operator-listed preference).
- **web-normal-source** (not legacy `web-source`) for hover heroes: wide 2129×738 lane matches measured ~3.25:1 hero frame without portrait card stretch.

## Excluded from runtime

- Previous HOLD set: `assets/viona/travel/viona-travel-*` (flagship/hero slots only — perspective/destination/situation-bg retained)
- `viona-travel-hero-default-1600x520.png` one-image fallback
- `dynamic-interpreter-assist` Paris guide drift asset
- `_incoming`, `_superseded`, semantic-fail paths
