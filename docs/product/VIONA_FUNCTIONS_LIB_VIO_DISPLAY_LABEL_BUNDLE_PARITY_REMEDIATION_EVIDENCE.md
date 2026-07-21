# VIONA — Functions/lib VIO Display-Label Bundle Parity Remediation

Operator authorization: `APPROVE_VIONA_FUNCTIONS_LIB_VIO_DISPLAY_LABEL_BUNDLE_PARITY_REMEDIATION`

Primary classification: `READY_FOR_VIONA_FUNCTIONS_LIB_VIO_LABEL_BUNDLE_PARITY_PR_REVIEW`

## Markers

```text
VIONA_FUNCTIONS_LIB_VIO_DISPLAY_LABEL_BUNDLE_PARITY_REMEDIATION
EXPECTED_GENERATED_PARITY_UPDATE
FUNCTIONS_BUNDLE_REBUILD_DETERMINISTIC
CI_RELEASE_DISCIPLINE_PASS
NO_SOURCE_BEHAVIOR_CHANGE
NO_MANUAL_GENERATED_EDIT
NO_DEPLOY
PHASE_C_CLOSED_GREEN_PRESERVED
EAS_IOS_DEVELOPMENT_BUILD_NOT_AUTHORIZED
IOS_PHASE_D2_NOT_AUTHORIZED
PACK40DR_PRESERVED
PACK40S_NOT_AUTHORIZED
```

## 1. Baseline

| Field | Value |
|---|---|
| origin/master | `da65a2c42ea24a10d62327bef8d94116204d9d20` |
| Contains | PR #406 + merged PR #407 (localization + readiness pins) |
| Branch | `chore/viona-functions-lib-vio-label-bundle-parity` |
| Canonical root | `C:\KNG\ket-noi-eu` |
| Minimum ancestor | `f21a750` (PR #406) present |

PR #407 lane: already **MERGED** on baseline master before this pack; this branch was cut from that master and does **not** push to or edit the former PR #407 feature branch.

## 2. Original failure

| Check | Pre-change status on this baseline |
|---|---|
| `npm run ci:expo-readiness` | **PASS** (pins already synced via merged #407) |
| `npm run functions:verify-bundle` | **FAIL** — `functions/lib/index.js` dirty after `npm run build --prefix functions` (`node esbuild.mjs`) |
| Dirty before rebuild | none (clean tree) |
| Dirty after rebuild | `M functions/lib/index.js` only |

Failing parity classification: **EXPECTED_GENERATED_PARITY_UPDATE** (VIO display-label bundle lag).

## 3. Generated files changed

| Generated path | Classification |
|---|---|
| `functions/lib/index.js` | EXPECTED_GENERATED_PARITY_UPDATE |

No other `functions/lib` files changed. Not broad drift.

## 4. Source-of-truth mapping

| Generated artifact | Canonical source (already on master) |
|---|---|
| Bundled `vioDisplayConfig` object | `src/core/monetization/vioDisplayConfig.ts` |
| Bundled `getVioCreditsLabel()` | `src/core/monetization/vioDisplayLabels.ts` |
| Call-site amount labels using that helper | `src/services/PaymentsService.ts` (imported into Functions via `@app` alias in `functions/esbuild.mjs`) |
| Bundle entry | `functions/src/index.ts` → `functions/lib/index.js` |

No `functions/src/**` or `src/**` edits required or performed.

## 5. VIO label parity summary

| Location | Old generated | New generated |
|---|---|---|
| Call credit `amountLabel` | hardcoded `VIG Token/cuộc` | `${getVioCreditsLabel()}/cuộc` → **VIO Credits** |
| Le Tan booking `amountLabel` | hardcoded `VIG Token/lượt` | `${getVioCreditsLabel()}/lượt` → **VIO Credits** |

Also embeds committed `vioDisplayConfig` (`publicCreditName: "VIO Credits"`, etc.). Display-label only; no calculation/value-semantics change.

## 6. Canonical build

```text
npm run functions:build
→ npm run build --prefix functions
→ node esbuild.mjs
```

Verify gate used by release discipline:

```text
npm run functions:verify-bundle
→ node scripts/verify-functions-bundle.mjs
```

(`ci:release-discipline` → `preflight:release` → `preflight:with-functions` → `functions:verify-bundle`)

## 7. Deterministic two-run rebuild

| Run | SHA-256 of `functions/lib/index.js` |
|---|---|
| First rebuild | `6619F7642D30AF0D437311FE7A3C0E5B2830F98449E7E08E4E20FCA475F9C2CF` |
| Second rebuild (no source change) | identical |

Classification: `FUNCTIONS_BUNDLE_REBUILD_DETERMINISTIC`

No manual edits to generated JS.

## 8. Validation

| Gate | Result |
|---|---|
| `npm run functions:verify-bundle` (with staged/committed parity) | OK |
| `npm run ci:release-discipline` | **PASS** |
| Root `npx tsc --noEmit` | OK |
| Modern Home Phase A/B/C | OK |
| SOS / Profile-Language | OK |
| Local contract + apiClient JWT + mobile no-Prisma | OK |
| `package.json` / lockfiles | unchanged |
| `functions/src/**` / `src/**` | unchanged |

Note (out of pack): `npm run typecheck --prefix functions` reports a pre-existing TS error in `functions/src/b2b/voice/processVoiceOrchestrationRequest.ts` (`"retail_taphoa"` vs `VoiceScenario`). That check is **not** part of `ci:release-discipline`; not introduced by this pack.

## 9. Exact changed paths

- `functions/lib/index.js`
- `docs/product/VIONA_FUNCTIONS_LIB_VIO_DISPLAY_LABEL_BUNDLE_PARITY_REMEDIATION_EVIDENCE.md`
- `docs/ai-context/VIONA_KERNEL_HANDOFF_FAST_SAFE_GLOBAL_MODE.md`
- `Handoff_VIONA11726.txt`

## 10. Forbidden actions confirmation

Did **not**: edit source, packages, scripts, app.config, ios/android, deploy Functions/Firebase/EAS, Prebuild, Phase D2, or modify the former PR #407 branch.

## 11. Final classification

`READY_FOR_VIONA_FUNCTIONS_LIB_VIO_LABEL_BUNDLE_PARITY_PR_REVIEW`
