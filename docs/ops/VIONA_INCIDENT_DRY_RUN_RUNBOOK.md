# VIONA Incident Dry-Run Runbook

## 1. Purpose

- **Design** incident acknowledgement and status transitions **before** a DB-backed incident table exists.
- Keep **`productionPersisted: false`** on every `IncidentDryRunRecord` emitted by `buildIncidentDryRunRecord`.
- Avoid **fake** production incident logs, tickets, or notification sends from the mobile admin preview.

## 2. Sources

| `IncidentSource` | Typical use (later packs) |
|------------------|---------------------------|
| `aiUsage` | Metering breach, cap proximity. |
| `aiCost` | Registry / pricing misalignment. |
| `aiAutoPause` | Auto-pause enforcement events. |
| `aiAdminAlert` | Pack X admin alert preview pipeline (current dry-run wiring). |
| `telephony` | Voice / Twilio sandbox or production incidents. |
| `manualOps` | Human-filed incidents. |
| `system` | Platform health, cron, or infra signals. |

Pack Y fixtures currently originate from **`aiAdminAlert`** only.

## 3. Statuses

| Status | Meaning in Pack Y |
|--------|-------------------|
| `previewOnly` | Row is a **design projection** only (`IncidentDryRunRecord.status`). |
| `open` | Future: incident opened in DB. |
| `acknowledged` | Future: owner or on-call acknowledged. |
| `escalated` | Future: severity/time SLA breach. |
| `resolved` | Future: mitigated and closed. |
| `suppressed` | Future: benign / duplicate / false positive. |

`IncidentAcknowledgementPreview.nextStatus` shows a **simulated** transition (`acknowledged` vs `escalated`) for education — **not** written anywhere.

## 4. Owner Roles

| Role id | Display intent |
|---------|----------------|
| `pilotOwner` | Pilot Owner — primary for **critical** / **blocked** class signals. |
| `backupOwner` | Backup Owner — secondary on critical/blocked paths. |
| `merchantSuccessOwner` | Merchant Success Owner — primary for **warning** class merchant-facing risk. |
| `opsReviewer` | Ops Reviewer — **info** paths and secondary on warnings. |
| `none` | No backup role on low-severity rows. |

Additional roles (e.g. **Safety / Compliance Owner**) may appear in production RACI — not encoded in Pack Y defaults.

## 5. Dry-Run Acknowledgement

- **No DB write**, no Prisma migration, no ticket API.
- **No** email, Slack, SMS, or push.
- **Preview `nextStatus` only** — explains what would happen after a real acknowledgement in a future system.
- **`productionPersisted` remains false** on both the incident record and the acknowledgement preview.

The disabled **“Acknowledge (preview)”** control is **visual only** — it must not trigger persistence.

## 6. Production Requirements

Before persisting incidents or sending alerts:

- **DB-backed incident table** with tenant / merchant context and retention policy.
- **Audit log** of state transitions (`open` → `acknowledged` → …).
- **Owner assignment** and backup roster with timezone coverage.
- **Acknowledgement actor** identity (staff id, role, IP / device class).
- **Timestamps** and monotonic versioning for edits.
- **Evidence link** (e.g. `evidenceLabel`, meter snapshot id, alert id).
- **Escalation policy** (SLA, paging vs email).
- **Suppression policy** (dedupe, maintenance windows).
- **Support workflow** for affected merchants.

## 7. No-Go Conditions

- No **named owner** roster.
- No **audit log** sink for incident transitions.
- No **support path** for merchants.
- No **escalation policy** document.
- No **retention / privacy** decision for incident payloads.
- No **tenant/merchant** scoping for merchant-visible incidents.

## 8. Current Status

- **Dashboard preview only** (`AiIncidentDryRunPreviewPanel` under admin metering evidence).
- **No** outbound notifications.
- **No** DB writes from `src/core/incidents/**`.
