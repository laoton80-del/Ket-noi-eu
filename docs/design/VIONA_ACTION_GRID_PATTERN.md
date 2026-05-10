# VIONA Action Grid Pattern

**Pack:** AF.UI.1 — design-system definition (audit: [`VIONA_AF_UI_ACTION_GRID_AUDIT.md`](../audit/VIONA_AF_UI_ACTION_GRID_AUDIT.md)).

Reusable UI pattern for **feature actions** across VIONA: compact, premium **action cards** in a responsive grid instead of long vertical button lists where scanning matters.

**Design principle:** VIONA should feel like a calm **LifeOS command center** — clear, premium, readable, fast to scan, and safe to use — aligned with approved **Home** (multiverse / quick actions) and **SOS** (dark navy + thin accent + responsive grid) visual direction.

---

## Desktop / wide tablet

- Use a **2–3 column** card grid (pick column count from viewport width and minimum comfortable card width).
- Each action card includes **icon**, **title**, **short subtitle** (not paragraphs).
- **Dark navy** premium surface (fashion-tech canvas / elevated surfaces per `vionaTokens.fashionTech` or trust tokens as appropriate).
- **Thin neon / accent border** per universe or action category (controlled; not loud).
- **Subtle hover / focus** glow on web (border + soft shadow); no nightclub / gaming motion.
- **Equal card widths** within a row (e.g. `calc((100% - gaps) / n)` on web, or measured layout on native).
- **Readable hierarchy**: bold title, muted subtitle, sufficient tap height.
- Prefer **grid** over a **long vertical list** of feature actions when the set is small (roughly **4–12** discrete choices).

---

## Mobile / portrait

- **Default to 1 column** for **critical / safety** flows (SOS, payment-adjacent, irreversible actions).
- Use **2 columns** only when **touch targets stay comfortable** (minimum platform-friendly hit areas).
- **Never** compress SOS, wallet checkout, or other **critical** actions below safe sizes.

---

## When to use this pattern

Prefer the Action Grid for **short, discrete actions** where the user chooses what to do next:

- SOS actions (see honesty constraints below)
- Wallet **entry** actions (top up, send, vault — not transaction rows)
- Travel **hub** feature tiles (when not a data feed)
- Local **service** entry points
- Academy **learning** entry tiles
- Business / B2B **tool** shortcuts
- Account **shortcuts** (when not settings toggles)
- Merchant **tools**
- B2B wholesale / e-shop **import** shortcuts

**Spacing / tokens:** align rhythm with Home hero cards and SOS sheet — `vionaTokens` spacing, radius, shadows; prefer `VionaSurface` variants where they already match.

---

## When **not** to use this pattern

Do **not** replace long scrollable or dense data UI with action grids:

- **Transaction** history and ledger rows
- **Legal** text, disclosures, policies
- **Chat** messages and conversation threads
- Long **data** lists (infinite scroll, directories)
- **Tables** and dense comparisons
- **Admin** logs and audit trails
- **Settings** with many toggles and long labels

Use list rows, tables, or reading layouts instead.

---

## SOS-specific honesty (non-negotiable)

SOS implementations must keep **honest copy**: no fake GPS sharing, no fake dispatch, no hardcoded universal emergency numbers, no “VIONA will call police/fire/ambulance” unless product truth changes.

---

## Reference implementation (current code)

- **`src/screens/b2c/SOSModal.tsx`** — responsive grid (web breakpoints for 3×2 / 2-col / 1-col), per-card accent neon, `calc`-based equal thirds on wide web.

---

## Implementation roadmap (planning only for AF.UI.1)

1. Add a shared primitive (e.g. **`VionaActionCard`** + **`VionaActionGrid`**) that wraps layout + tokens; optionally wrap SOS behind the same API later without behavior change.
2. Pilot on **high-traffic** surfaces (see audit migration order).
3. Keep **Home Dynamic Hero** and **SOS behavior** stable unless a later pack explicitly scopes UI migration.

---

## Summary checklist

| Check | Pass criteria |
| --- | --- |
| Desktop | 2–3 columns; equal widths; hover/focus subtle |
| Mobile | 1 column default for critical; 2 columns only if targets stay large |
| Visual | Dark navy surface; thin accent border; icon + title + short subtitle |
| SOS / payment | Touch-safe; honest claims only |
| Wrong surface | Not used for lists, chat, legal walls, tables, admin logs |

---

## Related docs

- [VIONA Global Experience Manifesto](./VIONA_GLOBAL_EXPERIENCE_MANIFESTO.md) — §11 Action Grid summary + LifeOS tone
- [VIONA AF UI Action Grid Audit](../audit/VIONA_AF_UI_ACTION_GRID_AUDIT.md) — screen-by-screen status & migration order
