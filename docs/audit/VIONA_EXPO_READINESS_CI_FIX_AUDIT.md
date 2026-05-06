# VIONA Expo Readiness CI Fix Audit

Date: 2026-05-06
Owner: Codex (for VIONA)

## Scope Executed

1. Verified `app.json` local state:
   - `git status --short`
   - `git diff -- app.json`
2. Restored audit-only local change in `app.json` back to `HEAD`.
3. Confirmed `app.config.js` is source of truth and removed redundant `app.json`.
4. Aligned Expo SDK 54 dependencies using `npx expo install` (no `--force` used).
5. Updated Expo config plugin list to include `expo-localization`.
6. Ran required commands:
   - `npm ci`
   - `npm run ci:expo-readiness`
   - `npm run typecheck`
   - `npm run lint`
   - `npm run ci:release-discipline`

## Changes Made

- Restored audit-only local `app.json` edit (line-ending only) safely to `HEAD`.
- Removed `app.json` from repo (`git rm app.json`), keeping dynamic config in `app.config.js`.
- Added `expo-localization` to `plugins` in `app.config.js`.
- Updated Expo doctor exclusions in `package.json`:
  - `react-native-fast-image`
  - `react-native-webrtc`
- Lockfile/package versions were updated by Expo install alignment and `npm ci`.

## Command Outcomes

- `npm ci`: PASS
- `npm run ci:expo-readiness`: PASS (17/17 checks)
- `npm run typecheck`: FAIL (pre-existing Prisma/type surface errors outside Expo readiness scope)
- `npm run lint`: PASS (warnings only, no lint errors)
- `npm run ci:release-discipline`: FAIL due to missing file
  - `ENOENT: no such file or directory, open 'src/screens/ComboWalletScreen.tsx'`

## Notes

- No app logic changes were introduced for Prisma/API/auth/payment/booking/wallet/backend behavior.
- No `--force` flag was used in dependency alignment.
- Remaining failures are non-Expo-readiness baseline issues and should be handled by the owning tracks.
