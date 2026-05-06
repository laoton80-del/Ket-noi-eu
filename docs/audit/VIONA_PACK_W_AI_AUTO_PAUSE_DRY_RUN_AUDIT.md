# VIONA Pack W AI Auto-Pause Dry-Run Audit

## 1. Summary

**What was added**

- `src/core/aiEnforcement/aiAutoPauseTypes.ts` — `AiEnforcementMode`, `AiAutoPauseAction`, `AiAutoPauseDecision`, `AiAutoPausePolicy`.
- `src/core/aiEnforcement/aiAutoPausePolicy.ts` — `DEFAULT_AI_AUTO_PAUSE_POLICY` (dry-run, no production enforcement arm).
- `src/core/aiEnforcement/evaluateAiAutoPauseDecision.ts` — maps `AiUsageMeterResult` + policy → `AiAutoPauseDecision`.
- `src/core/aiEnforcement/index.ts` — barrel exports.
- `docs/ops/VIONA_AI_AUTO_PAUSE_DRY_RUN_RUNBOOK.md` — ops narrative.
- `scripts/ai-auto-pause-readiness-check.mjs` + npm script `ai:auto-pause-readiness`.
- i18n `aiEnforcement.preview.*`, `aiEnforcement.action.*`, `aiEnforcement.policy.defaultNotes` in `en.json` / `vi.json`.
- **Light** update to `AiUsageMeteringPreview`: shows dry-run enforcement **action** and `productionEnforced` (always false under default policy).

**Why dry-run before enforcement matters**

- Meter verdicts (`allow` / `warn` / `autoPause` / `blocked`) can be shown **without** mutating gateways, Twilio tasks, or merchant state.
- Product, CFO, and legal can agree on **action mapping** before any irreversible “pause feature” automation.

**Discovery (Windows)**

- Repository reads and targeted search were used in place of assuming `rg` on PATH.

## 2. Current Enforcement Gap

| Area | Gap | Risk | Fix |
|------|-----|------|-----|
| AI cost guard registry | Policy only; no runtime kill | Ops assumes registry = enforced | Dry-run UI + runbook |
| AI usage meter result | Verdict not wired to gateway | Silent overage if only UI | Future enforced mode + ledger |
| Admin evidence preview | Was meter-only | No pause story | Pack W: show `evaluateAiAutoPauseDecision` |
| AI Receptionist demo/pilot | No server pause | Cost / abuse | Later: server gate + idempotent log |
| Live interpreter / call | Voice COGS | Runaway minutes | CDR + meter + enforced policy (future) |
| Copilot / Leona / scanner | Client-only metering foundation | Misaligned caps | Same as above |
| Feature flags / kill switch | Not changed this pack | Accidental broad kill | Explicit future flag design only |

## 3. Auto-Pause Policy

- Default **`mode: dryRun`**.
- **`productionEnforced`** is **false** for all decisions under default policy paths that represent pause/block.
- **`requireHumanApprovalForPause: true`** gates moving to real `pauseFeature` even when `mode` becomes `enforced` in a future approved pack.
- **`allowProductionEnforcement: false`** in default policy — must be deliberately changed after approvals.

## 4. Decision Rules

| Verdict | Dry-run action (default policy) | Production enforcement later |
|---------|----------------------------------|--------------------------------|
| `allow` | `none` | Allow |
| `warn` | `warnUser` / `warnAdmin` | Soft throttle + ops visibility |
| `autoPause` | `requireManualApproval` | `pauseFeature` only with ledger + alerts + approval |
| `blocked` | `blockRequest` (recommended; `shouldBlock` false) | Hard `blockRequest` when enforced + allowed |

## 5. UI Evidence

| Item | Detail |
|------|--------|
| Where | `AiUsageMeteringPreview` on `AdminDashboardScreen` |
| What | Per fixture: translated **enforcement action** + `productionEnforced` boolean |
| Meaning | Shows **what would be recommended** under Pack W policy — not live enforcement |
| Why not production | `DEFAULT_AI_AUTO_PAUSE_POLICY.mode === 'dryRun'` and `allowProductionEnforcement === false` |

## 6. What This Does Not Do

- No **provider** calls.
- No **Twilio** calls.
- No **DB** / **Prisma** migrations or writes.
- No **payment**, **booking**, or **wallet** changes.
- No **production enforcement** in the default configuration.
- No **AI production tool** actions.

## 7. Safety

| Question | Answer |
|----------|--------|
| Payment touched? | **no** |
| Booking touched? | **no** |
| Wallet touched? | **no** |
| DB / Prisma touched? | **no** |
| AI production touched? | **no** |
| Twilio touched? | **no** |
| Route names changed? | **no** |
| Feature flags changed? | **no** |

## 8. Validation

Executed on branch `pack-w-ai-auto-pause-dry-run` (2026-05-06):

- `npm ci` — pass
- `npm run ci:expo-readiness` — pass (inside `ci:release-discipline` chain)
- `npm run typecheck` — pass
- `npm run lint` — pass (0 errors; existing repo warnings only)
- `npm run ci:release-discipline` — pass
- `npm run ai:cost-readiness` — pass
- `npm run twilio:sandbox-readiness` — pass
- `npm run ai:usage-readiness` — pass
- `npm run ai:usage-preview-readiness` — pass
- `npm run ai:auto-pause-readiness` — pass

## 9. Next Pack Recommendation

- **Admin alert** design (channel, dedupe, severity).
- **DB-backed usage log** only after tenant model + finance approval.
- **Enforced** auto-pause only after kill switch, audit sink, and support process are live.
