# VIONA CI NPM Peer Dependency Audit

**Date:** 2026-05-06  
**Scope:** Fix CI `npm ci` peer resolution failure for React 19 + `react-native-fast-image@8.6.3` with minimal install policy change only.

---

## Root Cause

- `react-native-fast-image@8.6.3` declares peer `react: ^17 || ^18`.
- Repository uses `react@19.1.0`.
- In clean CI environments, `npm ci` enforces peer dependency checks and can fail with `ERESOLVE`.

---

## Immediate Fix Applied

- Added project-level `.npmrc` at repo root:

```ini
legacy-peer-deps=true
```

This keeps install behavior deterministic for CI without changing app logic or dependency graph in this PR.

---

## Why Not `--force`

- `--force` suppresses broader protections and can allow unsafe/invalid resolutions.
- `legacy-peer-deps=true` is narrower and explicit for peer conflict tolerance during install.
- This aligns with minimal-risk CI policy adjustment.

---

## Runtime / Business Logic Impact

- Runtime logic changed: **no**.
- App/business/payment/booking/AI/backend behavior changed: **no**.
- Only install policy and audit documentation were added.

---

## Validation Results

Commands executed:

1. `npm ci`  
   - **Result:** failed with OS-level file lock (`EPERM unlink`) at:
     - `node_modules/lightningcss-win32-x64-msvc/lightningcss.win32-x64-msvc.node`
   - This is not a peer-resolution failure; it indicates local file lock/permission interference.

2. `npm run typecheck`  
   - **Result:** failed locally after broken install state (`tsc` not found).

3. `npm run lint`  
   - **Result:** failed locally after broken install state (`expo` not found).

---

## Follow-up Debt

- Replace/remove `react-native-fast-image` with an Expo/React-19-compatible image solution in a dedicated compatibility task.
- For local rerun on Windows:
  - close any process locking native module files (editor/watcher/AV scan),
  - rerun `npm ci`,
  - then rerun `npm run typecheck` and `npm run lint`.

