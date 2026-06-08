# Restore plan — Pack 62LOCALBRIGHT_APPROVE

## Current state (post-approval)

- **Live** = operator-approved set (matches `_operator-approved-visual-set-62localbright/` SHA256)
- **Approved staging** = canonical operator copy
- **Backup** = previous final set (pre-superseded preview)

## Rollback to previous final set

If operator reverts visual decision, restore from A/B preview backup:

```powershell
cd c:\KNG\ket-noi-eu
$backup = "assets\viona\dynamic-hero\local\_backup-before-superseded-ab-preview-62localbright"
$live   = "assets\viona\dynamic-hero\local"
Get-ChildItem $backup -Filter "*62localbright.png" | ForEach-Object {
  Copy-Item $_.FullName (Join-Path $live $_.Name) -Force
}
```

## Re-apply operator-approved set

If live drifts, restore from approved staging:

```powershell
cd c:\KNG\ket-noi-eu
$approved = "assets\viona\dynamic-hero\_incoming-local-bright-62localbright\_operator-approved-visual-set-62localbright"
$live     = "assets\viona\dynamic-hero\local"
Get-ChildItem $approved -Filter "*62localbright.png" | ForEach-Object {
  Copy-Item $_.FullName (Join-Path $live $_.Name) -Force
}
```

## Verify after any restore

Compare SHA256 against:

- `assets/viona/dynamic-hero/_incoming-local-bright-62localbright/_operator-approved-visual-set-62localbright/APPROVAL_MANIFEST.md` (approved)
- OR `local/_backup-before-superseded-ab-preview-62localbright/BACKUP_MANIFEST.md` (previous final)

## Folders to preserve

| Folder | Action |
|--------|--------|
| `_superseded-semantic-fail-do-not-wire/` | **Keep** — audit lineage |
| `_backup-before-superseded-ab-preview-62localbright/` | **Keep** — rollback |
| `_operator-approved-visual-set-62localbright/` | **Keep** — canonical approved |

## Commit-readiness note

This pack prepares governance evidence only. A future commit should include:

1. Live `local/*-62localbright.png` (9 files)
2. `_operator-approved-visual-set-62localbright/` staging + `APPROVAL_MANIFEST.md`
3. Evidence folder `wave-3b-local-bright-operator-approved-visual-set-pack-62localbright/`
4. `semantic-operator-override.md` for release train audit trail

Do **not** delete backup or superseded folders in the same commit without explicit operator instruction.
