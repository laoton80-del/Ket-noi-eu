# Visual decision record — Pack 62LOCALBRIGHT_APPROVE

## Decision

**APPROVED** — Promote superseded Local Bright preview set to operator-approved visual set.

## Decision maker

Operator (explicit verbal/written approval in pack mission).

## Date

2026-06-08

## Options considered

| Option | Description | Outcome |
|--------|-------------|---------|
| A | Keep previous final set (`_backup-before-superseded-ab-preview-62localbright`) | Rejected — operator found hover heroes less premium |
| B | Keep superseded preview live (current state) | **Selected** — operator approved |
| C | Hybrid re-export with semantic-correct baking | Deferred — not required for this governance pack |

## Evidence reviewed

- `wave-3b-local-bright-superseded-ab-preview-pack-62localbright/` screenshots
- In-app preview at `http://localhost:8094/local`
- Luminance comparison: superseded hover masters brighter (+24–41% mean L on key heroes)

## Rationale

1. **Premium feel:** Sunlit editorial photography reads more high-end in hero frame.
2. **Hover brightness:** my-requests, booking-assist, legal-wealth, browse-services heroes feel more alive on hover.
3. **Full-bleed fit:** Same 2590×607 / 1672×941 frames; existing `fullBleedCover` runtime unchanged.
4. **No behavioral risk:** Asset swap only; no routes, payment, auth, booking, or SOS logic touched.

## Semantic WARN acceptance

Operator accepts automated semantic FAIL as **WARN** for this pack. In-app accent networks (cyan / gold / violet per card) appear coherent; governance downgrade documented in `semantic-operator-override.md`.

## Approved artifact location

```
assets/viona/dynamic-hero/_incoming-local-bright-62localbright/_operator-approved-visual-set-62localbright/
```

Live `assets/viona/dynamic-hero/local/` matches approved SHA256 set.
