# VIONA Kernel + Handoff — Fast Safe Global Mode

**Document type:** Canonical kernel and session handoff for VIONA engineering, product, and AI agents.
**Audience:** New ChatGPT / Cursor windows, staff, contractors, and automation executors.
**Baseline:** `origin/master @ d1c2089` — `docs(requests): record Pack15C backup availability evidence (#98)`
**Supersedes for Request Engine sequencing:** prior scattered pack pointers when this doc conflicts on pack order or blocked state — align to this handoff.
**Subordinate to:** `docs/ai-context/VIONA_OPERATING_PROTOCOL.md` and founder-signed **Master Blueprint** (`VIONA_FINAL_MASTER_BLUEPRINT_V2.md`). If conflict, stop and report drift risk.

---

## 1. Strategy

### VIONA Fast Safe Global Mode

VIONA advances as a **global AI action platform** for Vietnamese abroad and Vietnamese merchants overseas — not a single-vertical demo. **Fast Safe Global Mode** means:

- **Fast:** Cursor executes allowed work end-to-end (branch, inspect, edit allowlist, gates, commit, push, report) without waiting for human keystrokes on safe lanes.
- **Safe:** Critical path stays gated; no fake production, no DB apply, no live money/SOS/AI without explicit pack approval.
- **Global:** All universes belong in the product vision; internal labels (Lite / Pilot / Gated / Beta) control **what may be claimed now**, not whether a market or universe is in scope.

### Pipeline hóa VIONA

Request Engine and platform work move in **numbered packs** with human approval packets where required. Each pack has:

- explicit allowlist (files that may change)
- gate scripts that must PASS
- evidence README
- blocked list until the next approved pack

No pack may skip ahead on the critical path.

### Gate Factory

After Pack14C migration-file creation, many gate scripts duplicated Pack14C migration SQL allowlist logic. **Pack14D Gate Factory** (`scripts/lib/vionaPackDiffAllowlist.mjs`) centralizes that logic to **reduce repeated gate allowlist drift** and legacy false positives while **preserving gate semantics**.

### Cursor-first execution law

See §2 — Cursor is the default executor for safe, allowlisted work; ChatGPT owns direction and approval boundaries.

### Parallel low-risk lanes

UI polish, docs/specs, AI product contracts, GTM/business docs, i18n/safety copy, country launch matrix, and consent / do-not-call / audit policies may run **in parallel** when they do not touch forbidden paths or weaken gates.

### Critical path remains sequential

DB apply → schema verification → read-only API → read-only inbox → mutation → operator workflow → AI action foundation must follow the pack sequence in §13. No API/mutation/runtime ahead of approval.

---

## 2. Cursor-first execution law

### Cursor should execute (within allowlist + gates)

When a pack prompt defines allowed files and checks, **Cursor executes everything it can safely do**:

| Action | Cursor |
|--------|--------|
| Create branch | YES |
| Inspect codebase / docs | YES |
| Edit allowed files only | YES |
| Run gate / safety checks | YES |
| Commit (when pack requests) | YES |
| Push branch | YES |
| Report with evidence | YES |

### ChatGPT decides

| Domain | Owner |
|--------|--------|
| Product direction | ChatGPT (+ founder) |
| Architecture / safety boundaries | ChatGPT |
| Pack design and prompt writing | ChatGPT |
| Report review | ChatGPT |
| PR safety decision | ChatGPT / human |
| Next pack selection | ChatGPT |

### Cursor must NOT independently do

- DB apply (`prisma migrate dev/deploy`, `prisma db push`, or any DB mutation)
- Payment capture or booking confirmation
- SOS dispatch or emergency outcome claims
- AI calling live / protected telephony actions
- API / mutation / runtime production changes outside pack allowlist
- OPERATOR role changes (Prisma / Auth)
- Production readiness claims not backed by gates and evidence
- Any change outside the pack allowlist
- Weakening gate scripts or forbidden-claims checks

**Rule:** If a task conflicts with `VIONA_OPERATING_PROTOCOL.md` or this handoff, **stop and report drift risk** — do not improvise.

---

## 3. Product kernel

### What VIONA is

**VIONA** is the **Global AI action platform** for:

- **Vietnamese abroad** — life, travel, safety, services, income, community
- **Vietnamese merchants overseas** — bookings, operations, B2B, AI reception, local marketplace

Implementation shape: **Super App / Mini-App Platform** (Companion OS), not a single vertical.

### Universes

| Universe | Role |
|----------|------|
| **Home** | LifeOS hub, loyalty, cross-universe entry |
| **Local** | Local services marketplace, requests, merchant OS |
| **Travel** | Trip companion, interpreter, transport, emergency guidance |
| **Academy** | Learning, AI teacher, credentials (honest maturity labels) |
| **Business** | Merchant / B2B / wholesale / e-shop import |
| **Account** | Profile, wallet, settings, consent |
| **SOS** | Global Lifeline — safety entry; no fake dispatch |

### Core AI / business pillars

- **AI Companion / Chat AI**
- **Voice AI**
- **Call-for-me AI**
- **Live Interpreter AI**
- **AI Receptionist**
- **AI Callback / Sales Desk**
- **AI Operator**
- **SOS Voice Guard**
- **Academy AI Teacher**
- **Travel AI Companion**
- **Request Engine** — dedicated VIONA request store (in progress; see packs)
- **Merchant Business OS**
- **Local service marketplace**

### Monetization (design targets — not all live)

Premium / credits, B2B SaaS, request fees, AI call fees, merchant subscription, future marketplace revenue. **Zero-loss mindset:** no unlimited AI subsidy; caps, audit, and honest labels until rails are live.

---

## 4. Safety doctrine

Non-negotiable boundaries for all packs and agents:

1. **No fake production claims** — UI and docs must not imply paid, booked, dispatched, verified, or live AI outcomes without backing systems.
2. **No direct `LocalServiceRequest` source-of-truth reuse** for the VIONA Request Engine dedicated store.
3. **No payment / booking / SOS / wallet truth encoded into request lifecycle** before governed packs unlock those domains.
4. **High-risk actions** require consent, confirmation, audit, country rules, and escalation paths.
5. **SOS** does not claim dispatch or rescue unless real legal/ops readiness exists; users must see emergency-service disclaimers.
6. **Marketing / callback calls** require consent, opt-out, audit, and no spam.
7. **AI must not impersonate the user** or silently mutate protected domains (inventory, bills, payroll, payment state).

Canonical checker: `node scripts/viona-forbidden-claims-check.mjs` (strict mode for release-sensitive docs).

---

## 5. Current verified master

| Field | Value |
|-------|--------|
| Remote | `origin/master` |
| Commit | `d1c2089` |
| Message | `docs(requests): record Pack15C backup availability evidence (#98)` |
| Previous master | `6b8a7ac` — `docs(kernel): sync handoff after Pack15C backup method selection (#97)` |
| Previous latest (prior to #97) | `1232af4` — `docs(requests): record Pack15C backup method selection (#96)` |

All new work branches from `d1c2089` unless a later pack explicitly updates this handoff.

Pack15C backup availability/timestamp evidence is **complete and green** on master (PR #98). Pack15C Kernel/Handoff sync after backup method selection is **complete and green** (PR #97). Pack15C backup method selection plan upgrade evidence is **complete and green** (PR #96). Pack15C execution readiness is **`PARTIAL — backup available and timestamp confirmed, but restore procedure / stop-on-error / Pack15D plan / operator GO / execution approval are still missing; not GO`**. Decision remains **`B) NOT READY`**. Pack16 read-only persistence API **planning packet** is **fully complete and green** on master. Pack17 live read-only request inbox **planning packet** is **fully complete and green** on master. Pack16 is **planning-only / future-only** — runtime/API is **not implemented**. Pack17 is **planning-only / future-only** — runtime/UI/inbox is **not implemented**. Human dashboard evidence confirms **plan upgrade**, **dashboard backup available** (`PHYSICAL`), and latest visible backup timestamp **`18 Jun 2026 02:04:53 (+0000)`** for `viona-staging-eu`; restore buttons visible; restore **not executed** or **tested**; restore procedure **PARTIAL**. Operator go/no-go remains **NO-GO**. Secret **values** are **not verified**. DB apply is **not performed**. DB apply, Pack15D, Pack16 runtime/API, and Pack17 runtime/UI/inbox remain **blocked**.

---

## 6. Completed milestones (Request Engine chain — green)

| Pack | Milestone | SHA / PR |
|------|-----------|----------|
| Pack10C | Human SoT approval recorded | — |
| Pack11 | Dedicated store schema design contract | — |
| Pack11B | Schema-design human approval | — |
| Pack12 | Prisma schema readiness boundary | — |
| Pack13A | Prisma schema implementation approval packet | — |
| Pack13B | Prisma schema implementation approval recorded | — |
| Pack13C | VIONA Request Prisma schema models added | — |
| Pack14A | Migration readiness approval packet | — |
| Pack14B | Migration human approval recorded | — |
| Pack14C | Migration file creation complete | `2c15ba9` |
| Pack14D | Gate Factory no-product-change complete | `3de7667` |
| Pack14E | Fast Safe Global Mode kernel + handoff | `8517da6` (PR #78) |
| Pack15A | DB apply readiness approval packet | `5196f8a` (PR #79) |
| Pack15B | Human approval recording (planning only) | `0a7d1a2` (PR #80) |
| Pack15C | DB apply pre-apply planning packet | `70d747a` (PR #81) |
| Pack15C | Execution readiness decision packet | `64ccd56` (PR #82) |
| Pack15C | Kernel/handoff sync after readiness decision | `eca97e4` (PR #83) |
| Pack15C | Execution inputs intake template | `13793af` (PR #84) |
| Pack15C | Kernel/handoff sync after intake template | `61293b9` (PR #85) |
| Pack16 | Read-only persistence API planning packet | `a885425` (PR #86) |
| Pack16 | Kernel/handoff sync after planning packet | `fab30f4` (PR #87) |
| Pack17 | Live read-only request inbox planning packet | `cd92428` (PR #88) |
| Pack17 | Kernel/handoff sync after planning packet | `5876b94` (PR #89) |
| Pack15C | Supabase DB secret location audit evidence | `32a5826` (PR #90) |
| Pack15C | Kernel/handoff sync after Supabase DB secret audit | `75bf9c8` (PR #91) |
| Pack15C | Target confirmation intake update evidence | `5df9477` (PR #92) |
| Pack15C | Kernel/handoff sync after target confirmation | `9f0fea7` (PR #93) |
| Pack15C | Backup/restore dashboard evidence | `d042bac` (PR #94) |
| Pack15C | Kernel/handoff sync after backup restore evidence | `28262e1` (PR #95) |
| Pack15C | Backup method selection plan upgrade evidence | `1232af4` (PR #96) |
| Pack15C | Kernel/handoff sync after backup method selection | `6b8a7ac` (PR #97) |
| Pack15C | Backup availability/timestamp evidence | `d1c2089` (PR #98) |

---

## 7. Current DB/runtime state

| Item | State |
|------|--------|
| Migration file | `prisma/migrations/20260615120000_add_viona_request_models/migration.sql` |
| Migration SQL (read-only audit) | Additive-only — **not** DB apply evidence |
| CREATE TYPE enum count | `1` |
| CREATE TABLE count | `6` |
| CREATE INDEX count | `12` |
| ALTER TABLE count | `5` (FK `ADD CONSTRAINT` only) |
| DROP count | `0` |
| DELETE/TRUNCATE count | `0` |
| API / adapter / mutation / runtime | None — Pack16/Pack17 planning only; no read-only API or live inbox |
| Pack16 runtime/API | **Blocked** — implementation not started |
| Pack17 runtime/UI/inbox | **Blocked** — implementation not started |
| DB apply | **Blocked** |
| DB apply performed | **No** |
| Backup blocker (historical) | **Free Plan** — superseded by PR #98 human dashboard evidence showing PRO plan and scheduled backups |

### Pack15C target confirmation state (non-secret)

Human owner non-secret confirmation recorded (PR #92):

| Item | State |
|------|--------|
| Target environment | `CONFIRMED — staging` |
| Supabase DB target | `CONFIRMED — viona-staging-eu` |
| Supabase project ref | `CONFIRMED — euqbfanilcssjiwwtcby` |
| `laoton80-del's Project` | `legacy / paused / do-not-use-yet` |
| Execution context | `local operator machine using local .env` |
| Fly `viona-api-staging-eu` | Backend app / deploy host — **not** the Supabase project itself |
| Fly DB secret names | `DATABASE_URL` / `DIRECT_URL` deployed (names only; values **not** inspected) |

Evidence: `docs/product/VIONA_REQUEST_PACK15C_TARGET_CONFIRMATION_INTAKE_UPDATE_EVIDENCE.md`, `docs/design/evidence/cursor-pack15c-target-confirmation-intake-update-evidence/README.md`

### Pack15C DB secret location audit state (no values)

Earlier `.env.local`-only check was **incomplete**. Read-only audit evidence (PR #90) records key-name presence only.

| Item | State |
|------|--------|
| `.env.local` | `PRESENT` |
| `.env.local::DATABASE_URL` | `MISSING` |
| `.env.local::DIRECT_URL` | `MISSING` |
| `.env` | `PRESENT` |
| `.env::DATABASE_URL` | `PRESENT` |
| `.env::DIRECT_URL` | `PRESENT` |
| Fly staging app | `viona-api-staging-eu` |
| Fly secret name `DATABASE_URL` | `Deployed` |
| Fly secret name `DIRECT_URL` | `Deployed` |
| Values printed | **No** |
| Values copied into docs | **No** |
| `.env` modified | **No** |
| DB connection attempted | **No** |
| Prisma command run | **No** |
| Supabase DB command run | **No** |

### Pack15C backup/restore dashboard state (non-secret)

Human-provided Supabase Dashboard screenshot observation recorded (PR #94):

| Item | State |
|------|--------|
| Source | Human-provided Supabase Dashboard screenshot / non-secret visual observation |
| Cursor logged into Supabase Dashboard | **No** |
| Backup page available | `YES` |
| Backup available | `NO` |
| Backup type | `Dashboard backup unavailable on Free Plan` |
| Backup timestamp | `MISSING / N/A` |
| Evidence location/name | `Supabase Dashboard > Database > Backups > Scheduled backups — Free Plan does not include project backups` |
| Restore option visible | `YES` |
| Restore procedure | `PLANNED_ONLY — not executable without backup method` |
| Restore owner | `Nong Si Buong` |
| Restore confidence | `low` |
| Restore tested | `NO` |
| Operator go/no-go | `NO-GO` |

Evidence: `docs/product/VIONA_REQUEST_PACK15C_BACKUP_RESTORE_DASHBOARD_EVIDENCE.md`, `docs/design/evidence/cursor-pack15c-backup-restore-dashboard-evidence/README.md`

### Pack15C backup method selection state (non-secret)

Human backup method selection recorded (PR #96):

| Item | State |
|------|--------|
| Backup method selected | `plan upgrade` |
| Backup method selected by human | `YES` |
| Target | `viona-staging-eu` |
| Operator | `Nong Si Buong` |
| Current go/no-go | `NO-GO for now` |
| Plan upgrade performed by Cursor | `NO` |
| Plan upgrade confirmed by human | `NO / not yet` |
| Backup confirmed | `NO` |
| Backup timestamp | `MISSING / none yet` |
| Restore executable | `NO` |
| Restore confidence | `low` |
| Restore tested | `NO` |
| DB apply remains blocked | `YES` |

Evidence: `docs/product/VIONA_REQUEST_PACK15C_BACKUP_METHOD_SELECTION_PLAN_UPGRADE_EVIDENCE.md`, `docs/design/evidence/cursor-pack15c-backup-method-selection-plan-upgrade-evidence/README.md`

### Pack15C backup availability/timestamp state (non-secret)

Human-provided Supabase Dashboard backup availability and timestamp evidence recorded (PR #98):

| Item | State |
|------|--------|
| Plan upgrade confirmed by human | `YES` |
| Dashboard backup available | `YES` |
| Backup type | `PHYSICAL` |
| Latest visible backup timestamp | `18 Jun 2026 02:04:53 (+0000)` |
| Visible backup list count | `8` |
| Target | `viona-staging-eu` |
| Operator | `Nong Si Buong` |
| Restore buttons visible | `YES` |
| Restore tested | `NO` |
| Restore executed | `NO` |
| Restore procedure documented/executable | `PARTIAL — Restore buttons visible, but procedure not yet documented and restore not tested` |
| Restore confidence | `medium, not high` |
| Current go/no-go | `NO-GO for now` |
| DB apply remains blocked | `YES` |

Visible backup list (non-secret timestamps only):

```text
18 Jun 2026 02:04:53 (+0000) — PHYSICAL
17 Jun 2026 02:04:32 (+0000) — PHYSICAL
16 Jun 2026 02:09:05 (+0000) — PHYSICAL
15 Jun 2026 02:09:40 (+0000) — PHYSICAL
14 Jun 2026 02:05:01 (+0000) — PHYSICAL
13 Jun 2026 02:08:32 (+0000) — PHYSICAL
12 Jun 2026 02:08:08 (+0000) — PHYSICAL
11 Jun 2026 02:08:39 (+0000) — PHYSICAL
```

Evidence: `docs/product/VIONA_REQUEST_PACK15C_BACKUP_AVAILABILITY_TIMESTAMP_EVIDENCE.md`, `docs/design/evidence/cursor-pack15c-backup-availability-timestamp-evidence/README.md`

### Current classification

| Item | State |
|------|--------|
| Pack15C DB secret presence | `PRESENT` by key name only |
| Secret value validity | `NOT VERIFIED` |
| DB connection | `NOT ATTEMPTED` |
| Classification | **A) LOCAL PRESENT** plus **B) HOST SECRET NAME PRESENT** |
| Execution readiness | `PARTIAL — backup available and timestamp confirmed, but restore procedure / stop-on-error / Pack15D plan / operator GO / execution approval are still missing; not GO` |
| DB apply remains blocked | `true` |

### Current 15-input state

| # | Input | Classification |
| --- | --- | --- |
| 1 | Target environment | `CONFIRMED — staging` |
| 2 | DB provider / host | `CONFIRMED — Supabase Postgres project viona-staging-eu / ref euqbfanilcssjiwwtcby` |
| 3 | Execution context | `CONFIRMED CANDIDATE — local operator machine using local .env` |
| 4 | Server-side DB secret presence | `PRESENT_BY_KEY_NAME_ONLY` |
| 5 | Secret value validity evidence | `NOT_VERIFIED` |
| 6 | Backup / snapshot evidence | `CONFIRMED — dashboard backup available; latest visible backup timestamp 18 Jun 2026 02:04:53 (+0000)` |
| 7 | Restore / rollback procedure | `PARTIAL — Restore buttons visible, but restore procedure not yet documented and restore not tested` |
| 8 | Restore owner | `CONFIRMED CANDIDATE — Nong Si Buong` |
| 9 | Restore confidence | `CONFIRMED — medium, because backup exists and restore option is visible; not high because restore is untested` |
| 10 | Named execution operator | `CANDIDATE_FROM_CHAT` |
| 11 | Stop-on-error behavior | `PLANNED_ONLY` |
| 12 | Post-apply verification plan | `PLANNED_ONLY` |
| 13 | Operator go/no-go | `NO-GO` |
| 14 | Separate execution approval phrase | `MISSING` |
| 15 | Separate execution-only DB apply pack authorization | `BLOCKED` |

Evidence: `docs/product/VIONA_REQUEST_PACK15C_TARGET_CONFIRMATION_INTAKE_UPDATE_EVIDENCE.md`

Evidence (backup availability/timestamp): `docs/product/VIONA_REQUEST_PACK15C_BACKUP_AVAILABILITY_TIMESTAMP_EVIDENCE.md`, `docs/design/evidence/cursor-pack15c-backup-availability-timestamp-evidence/README.md`

Evidence (backup method selection): `docs/product/VIONA_REQUEST_PACK15C_BACKUP_METHOD_SELECTION_PLAN_UPGRADE_EVIDENCE.md`, `docs/design/evidence/cursor-pack15c-backup-method-selection-plan-upgrade-evidence/README.md`

Evidence (backup/restore dashboard): `docs/product/VIONA_REQUEST_PACK15C_BACKUP_RESTORE_DASHBOARD_EVIDENCE.md`, `docs/design/evidence/cursor-pack15c-backup-restore-dashboard-evidence/README.md`

Evidence (secret audit): `docs/product/VIONA_REQUEST_PACK15C_SUPABASE_DB_SECRET_LOCATION_AUDIT_EVIDENCE.md`, `docs/design/evidence/cursor-pack15c-supabase-db-secret-location-audit-evidence/README.md`

### Current flags

| Flag | Value |
|------|--------|
| `migrationCreated` | `true` |
| `prismaMigrationActive` | `true` |
| `pack14MigrationCreationOnly` | `true` |
| `pack15DbApplyReadinessPacketActive` | `true` |
| `pack15DbApplyApproved` | `true` |
| `pack15DbApplyPermitted` | `true` |
| `pack15DbApplyPlanningPacketActive` | `true` |
| `pack15ExecutionReadinessAudited` | `true` |
| `pack15ExecutionReady` | `false` |
| `pack15DbApplyPerformed` | `false` |
| `dbApplied` | `false` |
| `pack15ExecutionInputsIntakeTemplateActive` | `true` |
| `pack15ExecutionInputsComplete` | `false` |
| `pack15TargetEnvironmentConfirmed` | `true` |
| `pack15TargetEnvironment` | `staging` |
| `pack15SupabaseTargetConfirmed` | `true` |
| `pack15SupabaseTargetProjectLabel` | `viona-staging-eu` |
| `pack15SupabaseTargetProjectRef` | `euqbfanilcssjiwwtcby` |
| `pack15LegacyPausedProjectDoNotUse` | `true` |
| `pack15ExecutionContextSelected` | `local operator machine using local .env` |
| `pack15BackupMethodSelected` | `true` |
| `pack15BackupMethod` | `plan_upgrade` |
| `pack15PlanUpgradeSelected` | `true` |
| `pack15PlanUpgradePerformedByCursor` | `false` |
| `pack15PlanUpgradeConfirmedByHuman` | `true` |
| `pack15BackupPageAvailable` | `true` |
| `pack15BackupType` | `PHYSICAL` |
| `pack15BackupSnapshotConfirmed` | `true` |
| `pack15DashboardBackupAvailable` | `true` |
| `pack15DashboardBackupUnavailableReason` | `Free Plan` (historical — superseded by PR #98) |
| `pack15BackupTimestamp` | `18 Jun 2026 02:04:53 (+0000)` |
| `pack15VisibleBackupRows` | `8` |
| `pack15RestoreOptionVisible` | `true` |
| `pack15RestoreExecuted` | `false` |
| `pack15RestoreRollbackConfirmed` | `false` |
| `pack15RestoreProcedureExecutable` | `false` |
| `pack15RestoreProcedureStatus` | `PARTIAL` |
| `pack15RestoreOwnerConfirmed` | `true` |
| `pack15RestoreOwner` | `Nong Si Buong` |
| `pack15RestoreConfidence` | `medium_not_high` |
| `pack15RestoreTested` | `false` |
| `pack15OperatorGoNoGo` | `false` |
| `pack15ExecutionApprovalPhraseProvided` | `false` |
| `pack15ExecutionOnlyDbApplyPackAuthorized` | `false` |
| `pack15DbSecretPresenceByKeyNameOnly` | `true` |
| `pack15DbSecretValuesVerified` | `false` |
| `pack15DbConnectionAttempted` | `false` |
| `pack16ReadOnlyPersistenceApiPlanningPacketActive` | `true` |
| `pack16RuntimeImplementationStarted` | `false` |
| `pack16ReadOnlyApiImplemented` | `false` |
| `pack17LiveReadOnlyInboxPlanningPacketActive` | `true` |
| `pack17RuntimeImplementationStarted` | `false` |
| `pack17LiveReadOnlyInboxImplemented` | `false` |

Product docs: `docs/product/VIONA_REQUEST_PACK14C_PRISMA_MIGRATION_CREATION_ONLY.md`, `docs/product/VIONA_REQUEST_PACK15C_DB_APPLY_PRE_APPLY_PLANNING_PACKET.md`, `docs/product/VIONA_REQUEST_PACK15C_EXECUTION_READINESS_DECISION_PACKET.md`, `docs/product/VIONA_REQUEST_PACK15C_EXECUTION_INPUTS_INTAKE_TEMPLATE.md`, `docs/product/VIONA_REQUEST_PACK15C_SUPABASE_DB_SECRET_LOCATION_AUDIT_EVIDENCE.md`, `docs/product/VIONA_REQUEST_PACK15C_TARGET_CONFIRMATION_INTAKE_UPDATE_EVIDENCE.md`, `docs/product/VIONA_REQUEST_PACK15C_BACKUP_RESTORE_DASHBOARD_EVIDENCE.md`, `docs/product/VIONA_REQUEST_PACK15C_BACKUP_METHOD_SELECTION_PLAN_UPGRADE_EVIDENCE.md`, `docs/product/VIONA_REQUEST_PACK15C_BACKUP_AVAILABILITY_TIMESTAMP_EVIDENCE.md`, `docs/product/VIONA_REQUEST_PACK16_READ_ONLY_PERSISTENCE_API_PLANNING_PACKET.md`, `docs/product/VIONA_REQUEST_PACK17_LIVE_READ_ONLY_REQUEST_INBOX_PLANNING_PACKET.md`

Gate Factory (Pack14D): `scripts/lib/vionaPackDiffAllowlist.mjs`, `scripts/viona-request-pack14d-gate-factory-check.mjs`

---

## 8. Pack15C execution readiness decision

**Decision (read-only audit):** `B) NOT READY`

**Pack15C execution readiness:** `PARTIAL — backup available and timestamp confirmed, but restore procedure / stop-on-error / Pack15D plan / operator GO / execution approval are still missing; not GO`

**DB apply remains blocked:** `true`

**Updated reason:** Backup availability and timestamp are now confirmed by human dashboard evidence, but restore has not been executed or tested, restore procedure still needs to be documented, stop-on-error and Pack15D post-apply verification plan remain planned-only, operator go/no-go remains NO-GO, and no distinct execution approval phrase has been provided. Target environment and Supabase target remain confirmed (`staging`, `viona-staging-eu` / `euqbfanilcssjiwwtcby`, execution context `local operator machine using local .env`). Execution-only DB apply pack authorization remains incomplete. DB secret key-name presence remains confirmed; secret **values** were not printed, copied, or verified.

Execution remains **blocked** because required execution inputs are **not complete**.

Pack15B approval permits **planning only** — it is **not** execution approval. Target confirmation (PR #92), backup/restore dashboard evidence (PR #94), backup method selection (PR #96), and backup availability/timestamp evidence (PR #98) are **not** execution approval. DB apply remains **blocked** until restore procedure is documented, restore is tested, operator GO, execution approval phrase, ChatGPT intake review, and separate execution-only pack authorization are complete.

### Required before DB apply can proceed

DB apply cannot proceed until **all** are true:

1. Human documents executable restore/rollback procedure from the visible Restore action.
2. Human confirms restore owner for the actual restore method.
3. Human confirms restore tested status.
4. Human confirms stop-on-error behavior for execution run.
5. Human confirms post-apply verification / Pack15D plan.
6. Human provides explicit operator GO.
7. Human provides distinct execution approval phrase.
8. Separate execution-only DB apply pack is created and authorized.

Evidence: `docs/design/evidence/cursor-request-pack15c-execution-readiness-decision-packet/README.md`, `docs/design/evidence/cursor-pack15c-supabase-db-secret-location-audit-evidence/README.md`, `docs/design/evidence/cursor-pack15c-target-confirmation-intake-update-evidence/README.md`, `docs/design/evidence/cursor-pack15c-backup-restore-dashboard-evidence/README.md`, `docs/design/evidence/cursor-pack15c-backup-method-selection-plan-upgrade-evidence/README.md`, `docs/design/evidence/cursor-pack15c-backup-availability-timestamp-evidence/README.md`

---

## 9. Execution inputs intake template

**Template on master:** `docs/product/VIONA_REQUEST_PACK15C_EXECUTION_INPUTS_INTAKE_TEMPLATE.md`

All 15 inputs default to **`Missing`** until human/operator completes them outside repo (no secrets in docs):

1. Target environment: local / staging / production / other
2. Database provider/host
3. `DATABASE_URL` / secret confirmed outside repo, not committed
4. Named responsible execution operator
5. Execution machine/context
6. Maintenance window / user impact
7. Explicit execution go/no-go
8. Backup/snapshot method
9. Backup owner
10. Pre-apply backup timestamp evidence
11. Restore procedure
12. Restore test/confidence level
13. Rollback limitations
14. Restore/rollback operator
15. Distinct execution approval phrase for actual `npx prisma migrate deploy` on named target

### Intake boundaries

- Intake template is **not** execution approval
- Pack15B phrase remains **planning only**
- Execution approval must be **distinct**, **explicit**, and **target-specific**
- Secrets must be confirmed **outside repo only**
- `DATABASE_URL` must **not** be pasted into docs
- `.env` must **not** be committed or printed

Evidence: `docs/design/evidence/cursor-pack15c-execution-inputs-intake-template/README.md`

---

## 10. Pack16 planning packet status

**Planning packet on master:** `docs/product/VIONA_REQUEST_PACK16_READ_ONLY_PERSISTENCE_API_PLANNING_PACKET.md`

| Item | State |
|------|--------|
| Pack16 scope | **Future-only** — planning packet complete; **not** runtime implementation |
| Pack16 implementation gate | **Blocked** until DB apply succeeds and **Pack15D** schema verification passes |
| Read-only persistence API | **Not implemented** — no live read-only API |
| Persistence adapter | **None** from this pack |
| API / routes / controllers / server | **Unchanged** — no files modified by Pack16 planning |

Evidence: `docs/design/evidence/cursor-pack16-read-only-persistence-api-planning-packet/README.md`

---

## 11. Pack17 planning packet status

**Planning packet on master:** `docs/product/VIONA_REQUEST_PACK17_LIVE_READ_ONLY_REQUEST_INBOX_PLANNING_PACKET.md`

| Item | State |
|------|--------|
| Pack17 scope | **Future-only** — planning packet complete; **not** runtime/UI/inbox implementation |
| Pack17 implementation gate | **Blocked** until Pack16 read-only persistence API exists and is **verified** |
| Pack16 implementation gate | **Blocked** until DB apply succeeds and **Pack15D** schema verification passes |
| Live read-only request inbox | **Not implemented** — no live inbox |
| UI / screens / components | **Unchanged** — no files modified by Pack17 planning |
| API / routes / controllers / server | **Unchanged** — no files modified by Pack17 planning |

Evidence: `docs/design/evidence/cursor-pack17-live-read-only-request-inbox-planning-packet/README.md`

---

## 12. Current blocked list

Still **blocked** until future approved packs and missing execution inputs are satisfied:

- DB apply
- Pack15C execution-only DB apply pack
- Pack15D DB schema verification
- Pack16 runtime implementation
- Pack16 read-only persistence API
- Pack17 runtime implementation
- Live read-only request inbox
- Request mutation (Pack18)
- Admin Debug live data
- OPERATOR Prisma / Auth
- Payment capture
- Booking confirmation
- SOS dispatch
- Wallet mutation
- Live AI protected actions
- Live merchant execution

---

## 13. Next sequence (critical path)

Execute in order — do not skip:

1. Human documents executable restore/rollback procedure from visible Restore action.
2. Human confirms restore owner for the actual restore method.
3. Human confirms restore tested status.
4. Human confirms stop-on-error behavior for execution run.
5. Human confirms Pack15D post-apply verification plan.
6. Human gives explicit operator GO.
7. Human provides distinct execution approval phrase.
8. **ChatGPT reviews GO/NO-GO** on completed intake (§9).
9. **Pack15C execution-only DB apply pack** — only after §8 required-before-apply list is satisfied
10. **Pack15D** — DB schema verification (only after successful DB apply)
11. **Pack16** — Read-only persistence API implementation (only after Pack15D)
12. **Pack17** — Live read-only request inbox implementation (only after Pack16 read-only API)
13. **Pack18** — Request mutation planning / implementation (only after read-only inbox is verified)
14. **Pack19** — Merchant / operator workflow
15. **Pack20+** — AI request assistant / AI action foundation

Safe parallel lanes (docs, audits, UI polish without DB/runtime/API/mutation) may continue while the above remains blocked.

---

## 14. Parallel lanes (low risk)

May run in parallel when allowlisted and gate-clean:

- Docs / kernel / handoff updates (including this handoff; sync after #98)
- Restore/rollback procedure evidence without secrets
- Restore confidence/test status evidence
- Stop-on-error confirmation evidence
- Pack15D post-apply verification plan docs-only
- Operator GO intake only after restore path is documented
- Execution approval phrase only after all prerequisites complete
- Pack15C intake filling only with **non-secret** confirmations
- Read-only audits
- Product specs and docs-only planning
- Evidence docs
- UI polish packs that avoid DB/runtime/API/mutation and preserve existing routes
- i18n copy safety review
- AI product contracts
- GTM / business docs
- Country launch matrix
- Consent / do-not-call / audit policies

### Forbidden safe-lane drift

- No DB apply
- No DB connection test
- No Prisma schema/migration edits
- No Prisma migration/apply/status command
- No Supabase DB command
- No `.env` value printing
- No `.env` modification
- No dashboard login automation
- No Restore click/run by Cursor
- No restore-executed claim
- No restore-tested claim without human evidence
- No execution GO claim
- No backup timestamp changes without human evidence
- No broad refactor
- No architecture rewrite
- No API/routes/controllers/server implementation
- No persistence adapter implementation
- No Pack16 runtime/API
- No Pack17 runtime/UI/inbox
- No UI/screens/components implementation for Pack17
- No request mutation
- No payment/booking/SOS/wallet truth changes
- No fake production claims
- No OPERATOR Prisma/Auth changes
- No live AI protected action unlocks
- No secrets in docs/logs

---

## 15. Stop list (hard stops)

Stop immediately and report if asked to:

- Apply DB before all 15 execution inputs (§9) are complete, reviewed by ChatGPT, and a separate execution-only pack is explicitly authorized
- Run any of: `prisma migrate dev`, `prisma migrate deploy`, `prisma migrate status`, `prisma db push`, `prisma db execute`, or any command that connects to or mutates a database (outside an authorized execution-only pack with confirmed environment and backup/restore)
- Add API or mutation ahead of Pack16–18 sequence
- Add OPERATOR role ahead of pack
- Enable live AI call, SOS, payment, or booking ahead of gates
- Make broad unrelated repo changes during a narrow pack
- Weaken gate scripts, allowlists, or forbidden-claims checks
- Claim production/live behavior in docs or UI without evidence

---

## Quick start for a new session

1. Read this file and `docs/ai-context/VIONA_OPERATING_PROTOCOL.md`.
2. Confirm baseline: `git rev-parse origin/master` → expect `d1c2089` until updated.
3. Read the active pack prompt allowlist and forbidden list.
4. Branch from `origin/master`; run gates before commit.
5. Cursor executes; ChatGPT reviews report and PR safety.

### Related canonical docs

| Doc | Purpose |
|-----|---------|
| `VIONA_OPERATING_PROTOCOL.md` | Global rules, SOS/B2B, agent charter |
| `VIONA_FINAL_MASTER_BLUEPRINT_V2.md` | Founder product blueprint |
| `docs/operating/VIONA_PROJECT_KERNEL.md` | Commercial / Local pilot kernel (parallel track) |
| `docs/ai-context/TASK_HANDOFF_TEMPLATE.md` | Per-task handoff template |
| `docs/product/VIONA_REQUEST_PACK14C_*` / `PACK14D_*` / `PACK15C_*` / `PACK16_*` / `PACK17_*` | Pack14C–17 boundaries |

---

**Pack14E:** Initial kernel + handoff sync after Pack14C migration-file-only, Pack14D Gate Factory, Fast Safe Global Mode, and Cursor-first execution law. Evidence: `docs/design/evidence/cursor-pack14e-kernel-handoff-fast-safe-global-mode/README.md`.

**Pack15C handoff sync (readiness decision):** Updated after Pack15C execution readiness decision merged @ `64ccd56` (PR #82). Evidence: `docs/design/evidence/cursor-pack15c-kernel-handoff-sync-after-readiness-decision/README.md`.

**Pack15C handoff sync (intake template):** Updated after Pack15C execution inputs intake template merged @ `13793af` (PR #84) and kernel sync @ `61293b9` (PR #85). Evidence: `docs/design/evidence/cursor-pack15c-kernel-handoff-sync-after-intake-template/README.md`.

**Pack16 handoff sync (planning packet):** Updated after Pack16 read-only persistence API planning packet merged @ `a885425` (PR #86) and kernel sync @ `fab30f4` (PR #87). Evidence: `docs/design/evidence/cursor-pack16-kernel-handoff-sync-after-planning-packet/README.md`.

**Pack17 handoff sync (planning packet):** Updated after Pack17 live read-only request inbox planning packet merged @ `cd92428` (PR #88) and kernel sync @ `5876b94` (PR #89). Evidence: `docs/design/evidence/cursor-pack17-kernel-handoff-sync-after-planning-packet/README.md`.

**Pack15C handoff sync (Supabase DB secret audit):** Updated after Pack15C Supabase DB secret location audit evidence merged @ `32a5826` (PR #90) and kernel sync @ `75bf9c8` (PR #91). Evidence: `docs/design/evidence/cursor-pack15c-kernel-handoff-sync-after-supabase-db-secret-audit/README.md`.

**Pack15C handoff sync (target confirmation):** Updated after Pack15C target confirmation intake update evidence merged @ `5df9477` (PR #92) and kernel sync @ `9f0fea7` (PR #93). Evidence: `docs/design/evidence/cursor-pack15c-kernel-handoff-sync-after-target-confirmation/README.md`.

**Pack15C handoff sync (backup/restore dashboard):** Updated after Pack15C backup/restore dashboard evidence merged @ `d042bac` (PR #94). Dashboard backup unavailable on Free Plan for `viona-staging-eu`; restore owner `Nong Si Buong`; restore confidence `low`; operator NO-GO. Readiness `PARTIAL — target confirmed, backup blocker confirmed, not GO`. Decision remains `B) NOT READY`. DB apply, Pack15D, Pack16 runtime/API, and Pack17 runtime/UI/inbox remain blocked. Evidence: `docs/design/evidence/cursor-pack15c-kernel-handoff-sync-after-backup-restore-dashboard-evidence/README.md`.

**Pack15C handoff sync (backup restore evidence):** Updated after Pack15C backup/restore dashboard kernel sync merged @ `28262e1` (PR #95). Evidence: `docs/design/evidence/cursor-pack15c-kernel-handoff-sync-after-backup-restore-dashboard-evidence/README.md`.

**Pack15C handoff sync (backup method selection):** Updated after Pack15C backup method selection plan upgrade evidence merged @ `1232af4` (PR #96). Human selected **plan upgrade** as intended backup path for `viona-staging-eu`; operator `Nong Si Buong`; current go/no-go `NO-GO for now`; plan upgrade **not yet confirmed** at time of #96; no backup confirmed; no backup timestamp; restore **not executable**; restore confidence `low`. Readiness `PARTIAL — backup method selected, but plan upgrade / actual backup / restore path not yet confirmed; not GO`. Decision remains `B) NOT READY`. DB apply, Pack15D, Pack16 runtime/API, and Pack17 runtime/UI/inbox remain blocked. Evidence: `docs/design/evidence/cursor-pack15c-kernel-handoff-sync-after-backup-method-selection-plan-upgrade/README.md`.

**Pack15C handoff sync (backup availability/timestamp):** This document updated after Pack15C backup availability/timestamp evidence merged @ `d1c2089` (PR #98). Plan upgrade **confirmed by human**; dashboard backup **available** (`PHYSICAL`); latest visible backup timestamp `18 Jun 2026 02:04:53 (+0000)`; 8 visible backup rows; restore buttons visible; restore **not executed** or **tested**; restore procedure **PARTIAL**; restore confidence `medium, not high`; operator `Nong Si Buong`; current go/no-go `NO-GO for now`. Readiness `PARTIAL — backup available and timestamp confirmed, but restore procedure / stop-on-error / Pack15D plan / operator GO / execution approval are still missing; not GO`. Decision remains `B) NOT READY`. DB apply, Pack15D, Pack16 runtime/API, and Pack17 runtime/UI/inbox remain blocked. Evidence: `docs/design/evidence/cursor-pack15c-kernel-handoff-sync-after-backup-availability-timestamp-evidence/README.md`.
