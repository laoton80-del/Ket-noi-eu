# VIONA — Local Dynamic Hero Title One Line Final Microfix

**Pack ID:** `VIONA.WAVE_3B.LOCAL_DYNAMIC_HERO_TITLE_ONE_LINE_FINAL_MICROFIX.1`

## Fix

- Local desktop title **40px** / lh **1.14** (was 42px)
- Editorial wrapper uses `editorialCopyCol` only (no `copyCol` padding leak)
- @1366+ web: `whiteSpace: nowrap` + tighter letterSpacing **-0.48** for one-line headline
- Wrapper width unchanged (**980px** @1366)

## Target copy

`Dịch vụ Việt, gần bạn hơn` — exactly **1 line** on desktop.

## Capture

`node scripts/capture-local-dynamic-hero-title-one-line-final-microfix.mjs`
