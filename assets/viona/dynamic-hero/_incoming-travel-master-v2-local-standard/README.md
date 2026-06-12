# Travel master hero v2 — Local Bright standard (incoming staging)

Drop approved PNG masters here before wiring. **Do not commit raw generation outputs** until operator sign-off.

## Required filenames

1. `travel-translation-assist-web-normal-master-v2.png`
2. `travel-rides-assist-web-normal-master-v2.png`
3. `travel-emergency-police-web-normal-master-v2.png`

**Optional** (only if replacing the accepted default airport master later):

4. `travel-airport-web-normal-master-v2.png`

---

## Visual standard (Local Bright / premium master)

Each image must match the **Local Bright** ultra-wide master hero quality bar:

- Ultra-wide master hero composition for full-bleed desktop cover (not card/tile crop).
- Daylight, clean, realistic-premium airport environment.
- **No** text, logos, or UI baked into the image.
- **No** dark poster style.
- **No** heavy color overlay or semantic tint baked into the raster.
- Subject **smaller** than current Travel alternate masters by roughly **25–40%** (more scene visible).
- Subject must **not** touch or crop at the right edge.
- **No** cropped heads, faces, arms, hands, suitcase, car body, or officer uniform.
- **Left 45–55%**: calm negative space for hero title, subtitle, and chips.
- **Right 55–82%**: subject and action; keep important figures fully inside the safe area.
- Avoid extreme close-up framing.
- Avoid busy clutter behind the hero title column.

These assets are intended for the **active overlay** full-bleed hero layer. They must work with cover + art-direction nudge — **not** inset, contain, or right-side thumbnail panels.

---

## Per-file direction

### `travel-translation-assist-web-normal-master-v2.png`

**Scene:** airport language / help counter assistance.

- Traveler with suitcase and interpreter or service staff.
- **Both people fully visible** (head to mid-body minimum).
- Not a close-up; conversational assistance tone.
- Action and figures placed around **62–78%** image width.
- **Right edge:** breathing room (empty airport context, not a cropped shoulder).
- **Left side:** clean airport space for editorial text.

### `travel-rides-assist-web-normal-master-v2.png`

**Scene:** airport pickup / rides assistance.

- Car, driver, traveler, and suitcase in frame.
- Car **not** oversized; driver and traveler readable at human scale.
- **No** subject cut off at the right edge.
- Enough airport context (curb, signage blur, terminal depth) for premium realism.
- **Left side:** clean for text.

### `travel-emergency-police-web-normal-master-v2.png`

**Scene:** calm airport safety / police or security **guidance** (not dispatch).

- Traveler and officer or security staff visible.
- Non-alarming, safe, guidance tone.
- **No** emergency dispatch or “authorities contacted” implication.
- **No** panic, chase, or aggressive enforcement scene.
- **Right side:** breathing room after subjects.
- **Left side:** clean for text.

**Safety / honest product:** imagery must not imply live SOS dispatch, booking confirmation, payment, or official accreditation.

---

## Geometry guidance

| Item | Guidance |
| --- | --- |
| **Preferred source size** | **2590×607** (matches Local Bright master set) |
| **Acceptable source size** | **2400×607** or **2400×792** only if the current pipeline manifest expects that lane |
| **Target visible hero frame** | Wide desktop master; effective aspect ~**3.0:1** to **4.2:1** depending on viewport |
| **Safe text zone** | Left **0–48%** (keep low visual noise) |
| **Safe subject zone** | **58–82%** horizontal band |
| **Right edge margin** | At least **8–12%** empty / breathing space after the subject |
| **Top / bottom margin** | Do not crop heads, feet, suitcase handles, or car roof |
| **Render mode** | Full-bleed **cover** on active overlay; must survive dezoom without needing contain |

When composing, imagine the hero title block occupying the left half — subjects should never compete with or sit under that column.

---

## Acceptance checklist

Operator / art sign-off before wire:

- [ ] Left text zone clean
- [ ] Subject not too large
- [ ] No subject cut at right edge
- [ ] No baked-in color veil
- [ ] No fake booking / payment / SOS implication
- [ ] Works as full-bleed master
- [ ] Matches Local Bright premium clarity

---

## Wiring note (out of scope for this folder)

After assets pass checklist, a separate pack may map these files into `travelDynamicHeroAsset` / manifest entries and tune per-key art-direction constants in `TravelScreen.tsx`. **This folder is staging only.**
