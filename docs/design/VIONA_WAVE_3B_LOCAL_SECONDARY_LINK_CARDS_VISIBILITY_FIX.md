# VIONA Wave 3B — Local secondary link-card visibility fix

Task ID: `VIONA.WAVE_3B.LOCAL_SECONDARY_LINK_CARDS_VISIBILITY_FIX.1`

## Goal

Make the lower Local secondary link-cards — **Cho doanh nghiệp Việt**
(`LocalMerchantToolsSection`) and **Vũ trụ liên kết** (`LocalConnectedUniverseLinks`) — read as
clearly tappable secondary cards instead of looking disabled, while keeping them lighter than the
primary Local For You / hero cards.

## Root cause (why they looked disabled)

Each card dimmed itself **on top of** the section-level opacity in `LocalScreen`:

- `merchantToolsSection` wrapper opacity **0.82**, `connectedUniversesSection` wrapper **0.62**.
- Plus a per-card `opacity: 0.83 / 0.85`, plus very faint borders (`0.20 / 0.22` alpha).

Compounded, the effective border alpha dropped to ~0.11–0.14 and the whole card to ~0.53–0.68,
so the cards read as greyed-out / disabled. `LocalScreen` is out of scope for this task, so the
fix was done entirely inside the two card components.

## Secondary card visibility summary

Both `LocalMerchantToolsSection` and `LocalConnectedUniverseLinks` (identical treatment):

- **Removed the per-card `opacity` (0.83 / 0.85)** so the section opacity is the only dimmer —
  the card no longer double-dims into a disabled look.
- **Border**: `rgba(148,163,184,0.20–0.22)` → `rgba(166,182,204,0.38)` — visible but still a
  subtle hairline.
- **Surface fill**: `rgba(8,14,24,0.40–0.44)` → `rgba(10,16,28,0.5)` — a touch more definition.
- **Icon**: size `14 → 15` (accent colour unchanged), now undimmed → clearer.
- **Title**: `rgba(241,247,255,0.94)` → `rgba(244,249,255,0.98)` — slightly stronger contrast.
- **Subtitle**: unchanged (`rgba(176,194,218,0.78)`) — stays muted/secondary.
- **Hover / focus / press**: replaced the old dim-on-press (`opacity 0.7 / 0.72`) with a
  `*Active` state that **sharpens the border** (`rgba(198,214,234,0.58)`), lifts the fill, and
  adds a soft non-neon glow (`shadowRadius: 4`). Wired via `onHoverIn/Out` + `onFocus/Blur`
  (a single `activeId` state per section) so web hover and keyboard focus both give feedback.

### Hierarchy preserved
Cards remain secondary: they carry no photo, no edge-lit glass, small 15px icons, single-line
copy, and still sit under the 0.82 / 0.62 section opacity — visibly lighter than primary cards.
No heavy neon glow; section height is unchanged (only border/colour/opacity tuned).

## Handler preservation

All handlers and links are untouched (only styling + hover state added):

- Business hub (`onMerchantHub`) ✅
- Send booking assist (`onBookingAssist`) ✅
- AI Receptionist (`onAiReceptionist`) ✅
- Travel Lite link (`onTravel`, `travelEnabled`) ✅
- Business hub link (`onBusiness`) ✅
- Academy Lite link (`onAcademy`, `academyEnabled`) ✅

## Safety drift report

Purely presentational changes (border/fill/opacity/icon size/title alpha + hover-feedback state)
in two Local-only card components. No IA, routes, handlers, payment/wallet/VIO, AI/SOS,
backend/auth, classifieds, or merchant/B2B business logic touched. No horizontal overflow
(layout/flex unchanged).

## Evidence

`docs/design/evidence/wave-3b-local-final-hero-assets/*` re-captured at `EXPO_CAPTURE_PORT=8093`
across 390×844, 844×390, 768×1024, 1024×768, 1366×768.

## Commit status

NOT COMMITTED.
