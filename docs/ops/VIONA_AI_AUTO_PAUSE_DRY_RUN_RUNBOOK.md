# VIONA AI Auto-Pause Dry-Run Runbook

## 1. Purpose

- Design **auto-pause** and **block** behavior **before** any production gateway enforcement.
- Keep the **default policy** in `dryRun` mode so the app never silently pauses revenue-bearing AI or voice lanes.
- Prevent **accidental** feature shutdown and **fake** “enforced” UX when no DB-backed ledger or admin path exists.
- Pack W code lives in `src/core/aiEnforcement/**` and is **pure** (no providers, Twilio, DB, or payment hooks).

## 2. Modes

| Mode | Meaning |
|------|---------|
| `dryRun` | Compute recommended `AiAutoPauseAction` only; `productionEnforced`, `shouldBlock`, and `shouldPause` stay **false** for pause/block paths. |
| `auditOnly` | Same outward guarantees as `dryRun` in this pack; reserved for future “log-only” wiring without side effects. |
| `enforced` | May set `productionEnforced` / `shouldPause` / `shouldBlock` **only** when `allowProductionEnforcement === true` and rules below apply. Still **off** in default policy. |

## 3. Decision Mapping

| Usage meter verdict (`AiUsageMeterResult`) | Dry-run / auditOnly recommendation | Enforced behavior later (when explicitly enabled + approved) |
|-------------------------------------------|--------------------------------------|------------------------------------------------------------------|
| `allow` | `action: none` | Pass request; no pause. |
| `warn` | `warnUser` or `warnAdmin` (no block/pause flags) | Throttle, banner, or ops queue; optional admin notify. |
| `autoPause` | `requireManualApproval` (recommended) | After ledger + alerts: `pauseFeature` when `allowProductionEnforcement` and not gated by human approval policy. |
| `blocked` | `blockRequest` recommended with **no** `shouldBlock` in dry-run | Hard deny at gateway when `allowProductionEnforcement` and policy allows block. |

Default export `DEFAULT_AI_AUTO_PAUSE_POLICY` sets `mode: 'dryRun'` and `allowProductionEnforcement: false`, so **productionEnforced is never true** in stock builds.

## 4. Production Enforcement Requirements

Before flipping `mode` to `enforced` or setting `allowProductionEnforcement: true`, all of the following must exist and be owned:

- **DB-backed usage log** with idempotency and tenant ID.
- **Audit log** for every pause/block decision (`requireAuditLog` in policy).
- **Admin alert** path (pager / email / ticket) matching `requireAdminNotification`.
- **Kill switch** and **tenant / merchant feature flag** matrix approved by product + legal.
- **Named owner** on-call for AI spend and voice incidents.
- **Incident process** (rollback, comms, customer impact).
- **Support copy** for blocked or paused merchants (appeal, SLA, manual override).

## 5. No-Go Conditions

- No **usage ledger** or cap source of truth.
- No **admin notification** channel.
- No **audit log** sink.
- No **owner** for the enforcement lane.
- No **appeal / manual override** for false positives.
- No **support process** for merchants hit by pause.

## 6. Current Status

- **Dry-run only** in repository default policy.
- **No provider** HTTP/SDK calls from `aiEnforcement`.
- **No DB** writes or Prisma migrations in this pack.
- **No payment, booking, or wallet** impact.
