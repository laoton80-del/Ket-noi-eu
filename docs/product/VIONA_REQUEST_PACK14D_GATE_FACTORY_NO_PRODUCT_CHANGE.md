# VIONA Request Pack14D — Gate Factory (no product change)

**Document type:** Gate Factory refactor boundary.  
**Pack:** Pack14D  
**Baseline:** `origin/master @ 2c15ba9`

## Summary

Pack14D introduces a small Gate Factory helper layer (`scripts/lib/vionaPackDiffAllowlist.mjs`) to centralize Pack diff allowlist logic for VIONA Request Engine gate scripts.

This pack reduces repeated gate allowlist drift after Pack14C migration-file creation exposed many duplicated local Prisma/migration diff checks.

## What Pack14D does

- Adds shared pure Node helpers for Pack14C migration SQL path recognition and Prisma diff forbiddance.
- Migrates selected legacy Request Engine gate scripts to import the shared helper instead of duplicating local predicates.
- Adds Pack14D product doc, evidence README, and gate check script.

## What Pack14D does NOT do

- No product behavior change.
- No DB apply.
- No schema edit.
- No migration SQL edit.
- No API/adapter/mutation/runtime.
- No Admin Debug live data.
- No OPERATOR Prisma/Auth.
- No App.tsx, navigation, screens, or runtime changes.
- No payment, booking, SOS dispatch, wallet mutation, live AI, or merchant live execution.

## Pack14C remains migration-file-only

Pack14C created:

`prisma/migrations/20260615120000_add_viona_request_models/migration.sql`

`migrationCreated: true` means the migration file exists.  
`dbApplied: false` means the migration was not applied to any database.

DB apply remains blocked and requires a future explicit approval pack.

## Gate Factory purpose

Centralize narrow allowlist rules so future Request Engine packs do not require one-by-one edits across many gate scripts for the same Pack14C migration path exception.

Protections remain strong:

- `prisma/schema.prisma` is always forbidden in Pack14D gate context.
- Arbitrary `prisma/migrations/*` remains forbidden.
- Only the exact Pack14C migration SQL path may be allowed when Pack14C migration creation is recognized.
- Second migration folders/files remain forbidden.
- Runtime/API/UI paths remain forbidden.
