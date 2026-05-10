# VIONA Action Grid Pattern

Reusable UI pattern for **feature actions** across VIONA: compact, premium **action cards** in a responsive grid instead of long vertical button lists.

**Design principle:** VIONA should feel like a calm **LifeOS command center** — clear, premium, readable, fast to scan, and safe to use.

---

## When to use this pattern

Prefer the Action Grid for **short, discrete actions** where the user is choosing what to do next:

- SOS actions (safety-critical: follow mobile rules below)
- Wallet actions
- Travel actions
- Local service actions
- Academy actions
- Business actions
- Account shortcuts
- Merchant tools
- B2B import actions

Each **action card** includes:

- **Icon** (clear, recognizable)
- **Title** (bold, scannable)
- **Short subtitle** (supporting context, not a paragraph)

**Surface:** dark navy (or manifesto-aligned dark surface) consistent with premium shells.  
**Border:** thin accent / “neon” edge in the **universe or feature accent** (e.g. safety red for SOS, teal for language context, blue for travel) — controlled, not loud.  
**Interaction (desktop web):** subtle hover and focus treatment (border/background lift, soft glow). Avoid nightclub / gaming / aggressive animation.  
**Spacing:** align rhythm with **Home hero cards** (padding, gap, corner radius from `vionaTokens` / `VionaSurface` intent when available).

---

## Responsive rules

### Desktop / wide tablet

- Use a **2–3 column** grid (choose column count by content count and minimum card width).
- Keep cards **compact** but readable; prioritize **scan speed** over density alone.

### Mobile / portrait

- **Default to 1 column** for **safety-critical** actions (e.g. SOS) and anywhere mis-tap risk is high.
- Use **2 columns** only when **touch targets remain comfortable** (minimum interactive height/width per platform guidelines; never compress SOS / payment / critical flows below safe sizes).
- **Never** make SOS, payment, or other **critical** actions too small to hit confidently.

---

## When **not** to use this pattern

Do **not** replace long scrollable content or dense data UI with action grids:

- Long **data** lists (infinite scroll, directory browsing)
- **Transaction** history
- **Chat** messages
- **Legal** text or disclosures
- **Settings** with many toggles and long labels
- **Tables** or **admin** logs / audit trails

Use list rows, tables, or dedicated reading layouts instead.

---

## Consistency and implementation

- **SOS** implementations must keep **honest copy** (no fake GPS sharing, no fake dispatch, no hardcoded emergency numbers, no “VIONA will call police/fire/ambulance” claims unless product truth changes).
- Prefer shared tokens and primitives (`vionaTokens`, `VionaSurface`, motion rules in the Global Experience Manifesto) so grids do not become one-off CSS.
- Reference: [VIONA Global Experience Manifesto](./VIONA_GLOBAL_EXPERIENCE_MANIFESTO.md) (card/surface rules, motion, safety).

---

## Summary checklist

| Check | Pass criteria |
| --- | --- |
| Desktop | 2–3 columns; cards compact; hover/focus subtle |
| Mobile | 1 column default for critical flows; 2 columns only if targets stay large |
| Visual | Dark navy surface; thin accent border; icon + title + short subtitle |
| SOS / payment | Touch-safe; no layout jump; no misleading claims |
| Wrong surface | Not used for lists, chat, legal walls, tables, admin logs |
