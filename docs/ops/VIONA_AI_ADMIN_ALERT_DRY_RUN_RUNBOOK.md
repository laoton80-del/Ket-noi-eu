# VIONA AI Admin Alert Dry-Run Runbook

## 1. Purpose

- **Preview** what admins would see when AI usage metering and cost guards signal risk — **before** any real notification delivery.
- Avoid **fake production alerting** (no SES, Slack, SMS, or push from Pack X code paths).
- Keep `productionSendEnabled` **false** on every `AiAdminAlertDefinition` produced by `buildAiAdminAlertPreview`.
- Pack X is **design + in-app dashboard copy only**; persistence and outbound channels ship in later packs after approvals.

## 2. Alert Severity

| Severity | Meaning | Example |
|----------|---------|---------|
| `info` | Within policy; FYI only | Meter verdict `allow` |
| `warning` | Soft risk — review context | Meter verdict `warn` (cap proximity, margin, unit mismatch) |
| `critical` | Auto-pause or high-loss path recommended | Meter verdict `autoPause` |
| `blocked` | Hard deny by guard | Meter verdict `blocked`, frozen feature, missing guard |

## 3. Channels

| Channel | Pack X status |
|---------|----------------|
| `dashboard` | Shown in `AiAdminAlertPreviewPanel` / admin metering preview. |
| `email` | **Later** — requires SES template + suppression list + owner approval. |
| `slack` | **Later** — requires workspace integration + secrets (not in repo). |
| `sms` | **Later** — Twilio / policy gate; see telephony runbooks. |
| `manualOps` | Recommended alongside dashboard for `warning` and above in dry-run copy. |

## 4. Dry-Run Rules

- **No actual delivery** of email, Slack, SMS, or push.
- **No secrets** read by `aiAlerts` modules.
- **No DB** writes, no incident rows, no acknowledgement state machine.
- **Preview only** — `AiAdminAlertPreview.previewOnly === true` and alert `status === 'previewOnly'` from the builder.

## 5. Production Requirements

Before enabling real sends:

- **DB-backed usage log** with tenant ID and idempotency.
- **Admin notification provider** (SES/Slack/etc.) with rate limits and opt-out.
- **Incident log** store with correlation IDs.
- **Owner assignment** and escalation roster.
- **Suppression / acknowledgement** workflow (avoid alert storms).
- **Escalation policy** (when to page vs email).
- **Support workflow** for merchants affected by pause or block.

## 6. No-Go Conditions

- No **named owner** for AI cost incidents.
- No **incident process** (open → mitigate → close).
- No **usage evidence** tied to tenant (ledger).
- No **support path** for false positives.
- No **alert suppression** or dedupe rules.
- No **audit log** sink for outbound notifications.

## 7. Current Status

- **Dashboard preview only** (`AdminDashboardScreen` via metering preview).
- **No** email, Slack, or SMS sends from this pack.
- **No** DB writes from `src/core/aiAlerts/**`.
- **No** provider or Twilio calls.
