# Current live source map — Pack 62LOCALBRIGHT_APPROVE

## Live folder (production wiring target)

```
assets/viona/dynamic-hero/local/
```

## Approved staging (operator canonical copy)

```
assets/viona/dynamic-hero/_incoming-local-bright-62localbright/_operator-approved-visual-set-62localbright/
```

## Lineage

| Stage | Path | Role |
|-------|------|------|
| Original superseded | `_superseded-semantic-fail-do-not-wire/` | Source lineage (retained, do-not-wire label) |
| A/B preview backup | `local/_backup-before-superseded-ab-preview-62localbright/` | Previous final set rollback |
| Operator approved | `_operator-approved-visual-set-62localbright/` | **Canonical approved staging** |
| Live | `local/*-62localbright.png` | **Currently matches approved SHA256** |

## Runtime require map (unchanged)

| Key | Master | Card |
|-----|--------|------|
| default / overview | `local-overview-web-normal-master-62localbright.png` | — |
| myRequests | `local-my-requests-web-normal-master-62localbright.png` | `local-my-requests-web-normal-card-62localbright.png` |
| bookingAssist | `local-booking-assist-web-normal-master-62localbright.png` | `local-booking-assist-web-normal-card-62localbright.png` |
| legalWealth | `local-legal-wealth-web-normal-master-62localbright.png` | `local-legal-wealth-web-normal-card-62localbright.png` |
| browseServices | `local-browse-services-web-normal-master-62localbright.png` | `local-browse-services-web-normal-card-62localbright.png` |

**Code files (read-only this pack):**

- `src/components/viona/local/localDynamicHeroAssets.ts`
- `src/design/vionaLocalHeroAssets.ts`

## SHA256 parity proof

`proof.json` → `liveMatchesApproved: true`, `approvedMatchesSupersededSource: true`
