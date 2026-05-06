# VIONA CI Stability Follow-up Audit

Date: 2026-05-06
Owner: Codex (for VIONA)

## Root Cause: Typecheck Failure

- After `npm ci`, Prisma client generated types were not guaranteed to be refreshed for the current install state.
- This caused widespread TypeScript errors from `@prisma/client` missing exports during `npm run typecheck`.

## Typecheck Fix Applied

- Updated `package.json` script:
  - from: `tsc --noEmit`
  - to: `npm run db:generate && tsc --noEmit`
- This keeps type generation deterministic without changing Prisma schema/migrations.

## Root Cause: Expo Readiness Failure

- `ci:expo-readiness` using `expo install --check` failed intermittently with Expo CLI runtime error:
  - `TypeError: Body is unusable: Body has already been read`
- Failure was runtime/tooling related rather than package alignment intent.

## Expo Readiness Fix Applied

- Added deterministic local check script: `scripts/expo-readiness-check.mjs`.
- Script behavior:
  1. runs `npx expo config --type public`
  2. reads `package.json`
  3. fails if `app.json` exists
  4. validates pinned Expo SDK 54 versions:
     - `expo`: `~54.0.34`
     - `expo-dev-client`: `~6.0.21`
     - `expo-file-system`: `~19.0.22`
     - `expo-image-picker`: `~17.0.11`
     - `expo-localization`: `~17.0.8`
     - `expo-notifications`: `~0.32.17`
     - `expo-print`: `~15.0.8`
     - `expo-sharing`: `~14.0.8`
     - `expo-updates`: `~29.0.17`
     - `@react-native-community/slider`: `5.0.1`
  5. validates `expo.doctor.reactNativeDirectoryCheck.exclude` includes:
     - `react-native-fast-image`
     - `react-native-webrtc`
  6. prints explicit pass/fail report
- Updated `package.json`:
  - `ci:expo-readiness` -> `node scripts/expo-readiness-check.mjs`

## WalletService Status

- `src/services/WalletService.ts` was verified as line-ending-only change:
  - regular diff: empty content
  - `--ignore-space-at-eol` diff: empty content
- File was safely restored with:
  - `git restore --worktree -- src/services/WalletService.ts`

## Protected Scope Confirmation

- App business logic touched: **No**
- Payment/Stripe/webhook touched: **No**
- Booking mutation touched: **No**
- Wallet math/logic touched: **No**
- Broker payout touched: **No**
- AI production action touched: **No**
- Prisma schema/migration touched: **No**

## Validation Results

- `npm ci`: PASS
- `npm run ci:expo-readiness`: PASS (deterministic script)
- `npm run typecheck`: PASS
- `npm run lint`: PASS (warnings only)
- `npm run ci:release-discipline`: PASS

## Remaining Debt

- Replace `react-native-fast-image` with actively maintained/new-architecture-friendly alternative.
- Validate long-term posture for `react-native-webrtc` support/new-architecture readiness.
- Periodically run `npx expo-doctor` manually when Expo CLI runtime stability improves.
