# VIONA Native Firebase Config CI Audit

Date: 2026-05-06
Owner: Codex (for VIONA)

## Root Cause

- CI strict trust gate (`TRUST_NATIVE_READINESS_STRICT=1`) fails when native Firebase files are absent at repo root:
  - `google-services.json`
  - `GoogleService-Info.plist`
- Security policy requires not committing real Firebase config files into git.

## Why Firebase Config Files Are Not Committed

- These files contain environment-specific native Firebase client configuration and should not be stored in repository history.
- Repository policy already ignores them via `.gitignore`.
- CI should materialize them from secure GitHub Actions secrets at runtime.

## Required GitHub Secrets

- `GOOGLE_SERVICES_JSON_B64`
- `GOOGLE_SERVICE_INFO_PLIST_B64`

## Script Added

- New script: `scripts/prepare-native-firebase-config.mjs`
- Behavior:
  - Reads `GOOGLE_SERVICES_JSON_B64` and `GOOGLE_SERVICE_INFO_PLIST_B64`
  - Decodes base64 payloads
  - Writes repo-root files:
    - `google-services.json`
    - `GoogleService-Info.plist`
  - Validates files exist after write
  - Logs only file creation messages (no secret output)
  - Fails clearly if env vars are missing:
    - `Missing GOOGLE_SERVICES_JSON_B64 and/or GOOGLE_SERVICE_INFO_PLIST_B64. Add GitHub Actions secrets or provide native Firebase config files locally.`

## Workflow Step Added

- Workflow updated: `.github/workflows/release-discipline.yml`
- Added step before release discipline gate:
  - `Prepare native Firebase config`
  - Runs `npm run prepare:native-firebase-config`
  - Injects required secrets from GitHub Actions env

## package.json Update

- Added script:
  - `"prepare:native-firebase-config": "node scripts/prepare-native-firebase-config.mjs"`

## Validation

- Local prepare script test: PASS (created both files without exposing secrets)
- `npm run typecheck`: PASS
- `npm run lint`: PASS (warnings only)

## User Action Completed

- Confirmed secrets were added:
  - `GOOGLE_SERVICES_JSON_B64`
  - `GOOGLE_SERVICE_INFO_PLIST_B64`

## Protected Scope Confirmation

- Payment touched: no
- Booking touched: no
- Wallet logic touched: no
- AI production action touched: no
- Prisma schema/migration touched: no
- Backend business logic touched: no
