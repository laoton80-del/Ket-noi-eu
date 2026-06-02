# VIONA.WAVE_3B.TRAVEL_BOTTOM_NAV_ACTIONS_MATCH_LOCAL.1

## Goal
Add bottom inline navigation actions to Travel scroll content matching Local grammar: **Quay lại** + **Trang chủ**.

## Local audit
- Component: `VionaBottomEscapeBar` inline after connected universes section
- Buttons: 2 only (`showBack`, `showHome`) — no current-page pill
- Labels: `shell.miniapp.back` / `shell.miniapp.home` (i18n → Quay lại / Trang chủ)
- Style: glass rail, 44px pills, icon + label, hover lift on web
- Actions: `goBack()` with Home fallback; `navigate('Tabs', { screen: MAIN_TAB.B2C.home })`
- Tail spacer: `hubScrollTail` after bar

## Travel gap
- Desktop web (`showDock: false`) had **no** bottom escape bar
- Mobile shell dock showed 3 buttons (back + home + Travel current) — not Local grammar

## Fix
- Inline `VionaBottomEscapeBar` after Vũ trụ liên kết section
- `showDock: false` on shell (Local parity — 2-button footer only)
- `goHome` / `onBackPress` handlers mirror LocalScreen
- Cyan travel divider + scroll tail spacing

## Evidence
`docs/design/evidence/wave-3b-travel-bottom-nav-actions-match-local/`

Capture: `node scripts/capture-travel-bottom-nav-actions-match-local.mjs`
