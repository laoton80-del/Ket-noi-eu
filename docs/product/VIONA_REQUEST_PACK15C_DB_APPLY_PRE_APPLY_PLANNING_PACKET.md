# VIONA Request Engine — Pack15C DB Apply Pre-Apply Planning Packet

**Document type:** DB apply command plan (docs-only — no execution).
**Baseline:** `origin/master @ 0a7d1a2` — `docs(requests): record Pack15B DB apply approval (#80)`.
**Related:** `docs/product/VIONA_REQUEST_PACK15A_DB_APPLY_READINESS_APPROVAL_PACKET.md`, `docs/product/VIONA_REQUEST_PACK15B_DB_APPLY_HUMAN_APPROVAL_RECORDED.md`, `docs/ai-context/VIONA_KERNEL_HANDOFF_FAST_SAFE_GLOBAL_MODE.md`

---

## 1. Purpose

Pack15C **pre-apply planning** prepares the exact DB apply command plan for the existing VIONA Request migration.

This packet does **not** apply DB.
This packet does **not** run DB commands.
This packet does **not** modify `prisma/schema.prisma`, migration SQL, API, adapter, mutation, or runtime.
This packet does **not** unlock API, mutation, or live product features.

It documents the approval chain, migration target, target environment requirements, backup/restore requirements, planned commands (not executed), stop-on-error behavior, and post-apply verification plan for a **future separate execution pack**.

- **Cursor/agent must not run Prisma DB commands** from this document.
- **Cursor/agent must not fill target environment or backup fields** unless explicit human operator facts are provided in an authorized execution pack.
- `agentMayFlipSignoff` remains `false`.

---

## 2. Current verified baseline

| Field | Value |
| --- | --- |
| Remote | `origin/master` |
| Commit | `0a7d1a2` |
| Message | `docs(requests): record Pack15B DB apply approval (#80)` |

### Parent chain (Request Engine)

| Pack | Milestone | SHA |
| --- | --- | --- |
| Pack14C | Migration file creation complete | `2c15ba9` |
| Pack14D | Gate Factory no-product-change complete | `3de7667` |
| Pack14E | Fast Safe Global Mode kernel + handoff merged | `8517da6` (PR #78) |
| Pack15A | DB apply readiness approval packet | `5196f8a` (PR #79) |
| Pack15B | DB apply human approval recorded | `0a7d1a2` (PR #80) |

Pack15B is complete and sync-verified on master before this planning packet.

---

## 3. Approval chain

| Step | Status |
| --- | --- |
| Pack15A created readiness packet | Complete on master |
| Pack15B recorded exact human approval phrase | Complete on master |
| Approval allows Pack15C **planning** | YES |
| Approval means DB apply already happened | **NO** |

### Exact human approval phrase (Pack15B)

```txt
APPROVED Pack15 DB apply readiness for the existing VIONA Request migration. I confirm DB apply may be planned next, but not performed in Pack15B.
```

- **Approval source:** Human owner/user (ChatGPT)
- **Approval date:** 2026-06-16

`pack15DbApplyApproved: true` and `pack15DbApplyPermitted: true` permit **planning** Pack15C. They are **not** DB apply evidence.

---

## 4. Migration target

| Item | Path |
| --- | --- |
| Migration folder | `prisma/migrations/20260615120000_add_viona_request_models/` |
| Migration file | `prisma/migrations/20260615120000_add_viona_request_models/migration.sql` |

### Migration SQL summary (read-only inspection)

Additive-only migration created in Pack14C. No `DROP TABLE`, `DROP COLUMN`, or data-wipe statements observed.

Creates:

- Enum: `VionaRequestSourceLinkStatus`
- Tables: `VionaRequest`, `VionaRequestParticipant`, `VionaRequestSourceLink`, `VionaRequestStatusEvent`, `VionaRequestAuditEvent`, `VionaRequestAttachmentReference`
- Indexes and foreign keys (CASCADE on child tables)

Rules:

- **Existing migration only** — this is the sole target for future DB apply
- **No new migration** in Pack15C planning or execution without separate approval
- **No schema edits** in Pack15C planning packet
- **No DB apply** in this planning packet
- **No API / adapter / mutation / runtime** yet

Dedicated VIONA Request Store remains source-of-truth direction. Direct `LocalServiceRequest` reuse remains disallowed.

---

## 5. Target environment decision

**Target environment is NOT yet selected inside this repository.**

A human/operator must explicitly confirm before any future DB apply execution pack runs.

### Required human/operator checklist (all default unchecked)

- [ ] Target environment name selected:
  - [ ] local
  - [ ] staging
  - [ ] production
  - [ ] other: *(specify outside repo)*
- [ ] Database provider/host confirmed **outside repo**
- [ ] Database URL/secret confirmed **outside repo** and **not committed**
- [ ] Responsible operator name recorded
- [ ] Execution machine/context recorded
- [ ] Expected maintenance window documented if needed
- [ ] Expected user impact documented
- [ ] Final go/no-go decision recorded

### Hard rule

**If target environment is not explicitly selected, DB apply must not run.**

---

## 6. Backup and restore plan

### Required checklist (all default unchecked)

- [ ] Backup/snapshot method identified
- [ ] Backup owner identified
- [ ] Backup timestamp to be recorded **before** apply
- [ ] Restore procedure identified
- [ ] Restore test or confidence level recorded
- [ ] Rollback limitations documented
- [ ] Responsible operator confirmed

### Hard rule

**If backup/restore is unclear, DB apply must not run.**

---

## 7. Command plan

**No command was run in this planning packet.**

Planned command shape for **future Pack15C execution-only pack** review (placeholders only — no secrets):

```bash
# Future Pack15C execution only — do not run in this planning packet
# Ensure DATABASE_URL points to the explicitly approved target DB environment.
npx prisma migrate deploy
```

Pre-check commands allowed only in the future execution pack when environment is confirmed:

```bash
# Future execution pack only
npx prisma migrate status
```

Requirements for future execution:

- Command must **stop on any non-zero exit**
- Command output must be recorded as evidence (redact secrets)
- Secrets must **never** be printed or committed
- `DATABASE_URL` must point to the explicitly approved target only

---

## 8. Stop-on-error behavior

Future DB apply execution must **stop immediately** if:

- Wrong environment suspected
- Missing backup/restore confirmation
- Migration status unexpected
- Pending migration mismatch with master copy
- Destructive SQL detected in migration file
- Command exits non-zero
- Schema verification fails
- Secrets appear in logs or evidence files
- Runtime/code diff appears in the execution pack
- Operator is unsure

Do not retry blindly. Document failure and escalate before retry.

---

## 9. Post-apply verification plan

Future execution pack must verify (Pack15D may formalize):

- Prisma migration status after apply (`npx prisma migrate status`)
- Database schema contains expected VIONA request tables:
  - `VionaRequest`
  - `VionaRequestParticipant`
  - `VionaRequestSourceLink`
  - `VionaRequestStatusEvent`
  - `VionaRequestAuditEvent`
  - `VionaRequestAttachmentReference`
- Migration `20260615120000_add_viona_request_models` recorded in Prisma migrations table
- No runtime changes included in execution pack
- No API/mutation enabled
- No payment/booking/SOS/wallet/live AI behavior unlocked
- Evidence recorded without secrets

### Expected future target state (only if apply succeeds — NOT current state)

| Flag | Future value after successful execution |
| --- | --- |
| `dbApplied` | `true` |
| `pack15DbApplyPerformed` | `true` |

**Current state remains `dbApplied: false` and `pack15DbApplyPerformed: false` until execution pack succeeds with evidence.**

---

## 10. Current state flags

| Flag | Value |
| --- | --- |
| `migrationCreated` | `true` |
| `prismaMigrationActive` | `true` |
| `pack14MigrationCreationOnly` | `true` |
| `pack15DbApplyReadinessPacketActive` | `true` |
| `pack15DbApplyApproved` | `true` |
| `pack15DbApplyPermitted` | `true` |
| `pack15DbApplyPlanningPacketActive` | `true` |
| `pack15DbApplyPerformed` | `false` |
| `dbApplied` | `false` |

---

## 11. Still blocked after this planning packet

Still **blocked** until future approved execution and later packs:

- DB apply until explicit execution pack with confirmed environment and backup/restore
- Read-only API
- Persistence adapter
- Request mutation
- Admin Debug live data
- OPERATOR Prisma / Auth
- Payment capture
- Booking confirmation
- SOS dispatch
- Wallet mutation
- Live AI protected actions
- Live merchant execution

DB apply alone creates database tables — not product behavior.

---

## 12. Safety and zero-loss boundaries

- **No fake production claims**
- **No DB apply in this planning packet**
- **No DB commands in this planning packet**
- **No secrets in docs/logs**
- **No payment capture**
- **No booking confirmation**
- **No SOS dispatch**
- **No wallet mutation**
- **No live AI protected actions**
- **No merchant live execution**
- **No OPERATOR Prisma/Auth changes**
- **No API/mutation ahead of sequence** (Pack16–18)
- **No direct `LocalServiceRequest` source-of-truth reuse**
- **No payment/booking/SOS/wallet truth encoded into request lifecycle**

Admin Debug remains fixture-only. Audit log is not a payment ledger.

---

## 13. Stop list for this docs-only pack

**Hard stop** if:

- Migration SQL differs from master copy
- `prisma/schema.prisma` or migration SQL diff appears
- Runtime / API / mutation changes appear
- `.env` or secrets files appear in diff
- Payment / booking / SOS / wallet / live AI changes appear
- OPERATOR role / auth changes appear
- Prisma DB command was run
- DB apply evidence appears in this planning packet
- Destructive SQL detected in migration file
- Out-of-allowlist files changed
- Gates or forbidden-claims checks fail

---

## 14. Next sequence

Execute in order — do not skip:

1. **Pack15C planning packet** — this document (docs-only)
2. **Pack15C execution-only DB apply pack** — only after target environment and backup/restore are explicitly confirmed
3. **Pack15D** — DB schema verification
4. **Pack16** — Read-only persistence API
5. **Pack17** — Live read-only request inbox
6. **Pack18** — Request mutation
7. **Pack19** — Merchant / operator workflow
8. **Pack20+** — AI request assistant / AI action foundation

---

## Safety acknowledgements

- No DB apply performed in this planning packet.
- No Prisma DB commands run in this planning packet.
- No production/live persistence claims.
- OPERATOR is still not Prisma/Auth.
- No payment, booking, SOS, wallet, live AI, or merchant live execution authorized.
