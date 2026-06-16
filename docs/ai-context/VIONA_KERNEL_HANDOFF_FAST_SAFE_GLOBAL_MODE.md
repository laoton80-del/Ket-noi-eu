# VIONA Kernel + Handoff — Fast Safe Global Mode

**Document type:** Canonical kernel and session handoff for VIONA engineering, product, and AI agents.
**Audience:** New ChatGPT / Cursor windows, staff, contractors, and automation executors.
**Baseline:** `origin/master @ 32a5826` — `docs(requests): record Pack15C Supabase DB secret audit (#90)`
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
| Commit | `32a5826` |
| Message | `docs(requests): record Pack15C Supabase DB secret audit (#90)` |
| Previous master | `5876b94` — `docs(kernel): sync handoff after Pack17 planning packet (#89)` |
| Previous latest (prior to #89) | `cd92428` — `docs(requests): add Pack17 live read-only inbox planning packet (#88)` |

All new work branches from `32a5826` unless a later pack explicitly updates this handoff.

Pack15C Supabase DB secret location audit evidence is **complete and green** on master (PR #90). Pack15C execution readiness decision remains **`B) NOT READY`**. Pack16 read-only persistence API **planning packet** is **fully complete and green** on master. Pack17 live read-only request inbox **planning packet** is **fully complete and green** on master. Pack17 kernel/handoff sync is **complete and green** on master (PR #89). Pack16 is **planning-only / future-only** — runtime/API is **not implemented**. Pack17 is **planning-only / future-only** — runtime/UI/inbox is **not implemented**. DB secret **key-name presence** is confirmed; secret **values** are **not verified**. DB apply is **not performed**. DB apply, Pack15D, Pack16 runtime/API, and Pack17 runtime/UI/inbox remain **blocked**.

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

### Current classification

| Item | State |
|------|--------|
| Pack15C DB secret presence | `PRESENT` by key name only |
| Secret value validity | `NOT VERIFIED` |
| DB connection | `NOT ATTEMPTED` |
| Classification | **A) LOCAL PRESENT** plus **B) HOST SECRET NAME PRESENT** |
| Execution readiness | `NO-GO` |
| DB apply remains blocked | `true` |

Evidence: `docs/product/VIONA_REQUEST_PACK15C_SUPABASE_DB_SECRET_LOCATION_AUDIT_EVIDENCE.md`, `docs/design/evidence/cursor-pack15c-supabase-db-secret-location-audit-evidence/README.md`

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
| `pack15DbSecretPresenceByKeyNameOnly` | `true` |
| `pack15DbSecretValuesVerified` | `false` |
| `pack15DbConnectionAttempted` | `false` |
| `pack16ReadOnlyPersistenceApiPlanningPacketActive` | `true` |
| `pack16RuntimeImplementationStarted` | `false` |
| `pack16ReadOnlyApiImplemented` | `false` |
| `pack17LiveReadOnlyInboxPlanningPacketActive` | `true` |
| `pack17RuntimeImplementationStarted` | `false` |
| `pack17LiveReadOnlyInboxImplemented` | `false` |

Product docs: `docs/product/VIONA_REQUEST_PACK14C_PRISMA_MIGRATION_CREATION_ONLY.md`, `docs/product/VIONA_REQUEST_PACK15C_DB_APPLY_PRE_APPLY_PLANNING_PACKET.md`, `docs/product/VIONA_REQUEST_PACK15C_EXECUTION_READINESS_DECISION_PACKET.md`, `docs/product/VIONA_REQUEST_PACK15C_EXECUTION_INPUTS_INTAKE_TEMPLATE.md`, `docs/product/VIONA_REQUEST_PACK15C_SUPABASE_DB_SECRET_LOCATION_AUDIT_EVIDENCE.md`, `docs/product/VIONA_REQUEST_PACK16_READ_ONLY_PERSISTENCE_API_PLANNING_PACKET.md`, `docs/product/VIONA_REQUEST_PACK17_LIVE_READ_ONLY_REQUEST_INBOX_PLANNING_PACKET.md`

Gate Factory (Pack14D): `scripts/lib/vionaPackDiffAllowlist.mjs`, `scripts/viona-request-pack14d-gate-factory-check.mjs`

---

## 8. Pack15C execution readiness decision

**Decision (read-only audit):** `B) NOT READY — missing target environment / backup / restore / operator go-no-go`

**Updated reason:** DB secret key-name presence is now confirmed (`DATABASE_URL` and `DIRECT_URL` in local `.env` and as Fly staging secret names on `viona-api-staging-eu`), but execution readiness remains **NO-GO** because target environment/provider/host confirmation, backup/snapshot, restore/rollback, named operator, operator go/no-go, and distinct execution approval phrase are still incomplete. Secret **values** were not printed, copied, or verified.

Execution remains **blocked** because the 15 required execution inputs are **not complete**.

Pack15B approval permits **planning only** — it is **not** execution approval. DB apply remains **blocked** until all 15 execution inputs are complete **outside repo**, reviewed by ChatGPT, and separately approved in an **execution-only pack**. A separate execution-only pack must **not** be created or run until those conditions are satisfied.

### Required before DB apply can proceed

DB apply cannot proceed until **all** are true:

1. Target environment explicitly selected.
2. DB provider/host explicitly confirmed.
3. Execution context selected: local `.env`, Fly secrets, or another controlled context.
4. Valid server-side DB secret values confirmed without exposing them.
5. Backup/snapshot completed.
6. Restore/rollback procedure documented.
7. Restore owner confirmed.
8. Restore confidence confirmed.
9. Named execution operator confirmed.
10. Stop-on-error behavior confirmed.
11. Post-apply verification plan confirmed.
12. Operator go/no-go confirmed.
13. Separate execution approval phrase provided.
14. ChatGPT reviews completed intake.
15. Separate execution-only DB apply pack is authorized.

Evidence: `docs/design/evidence/cursor-request-pack15c-execution-readiness-decision-packet/README.md`, `docs/design/evidence/cursor-pack15c-supabase-db-secret-location-audit-evidence/README.md`

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

1. Human confirms target environment, likely **staging**.
2. Human confirms DB provider/host, likely **Supabase**.
3. Human confirms execution context: local `.env`, Fly secrets, or another controlled environment.
4. Human confirms named operator and execution machine.
5. Human takes real DB backup/snapshot and records timestamp/evidence location without secrets.
6. Human documents restore/rollback owner and procedure.
7. Human confirms stop-on-error and post-apply verification plan.
8. Human provides target-specific execution approval phrase only after all above are ready.
9. **ChatGPT reviews GO/NO-GO** on completed intake (§9).
10. **Pack15C execution-only DB apply pack** — only after §8 required-before-apply list is satisfied
11. **Pack15D** — DB schema verification (only after successful DB apply)
12. **Pack16** — Read-only persistence API implementation (only after Pack15D)
13. **Pack17** — Live read-only request inbox implementation (only after Pack16 read-only API)
14. **Pack18** — Request mutation planning / implementation (only after read-only inbox is verified)
15. **Pack19** — Merchant / operator workflow
16. **Pack20+** — AI request assistant / AI action foundation

Safe parallel lanes (docs, audits, UI polish without DB/runtime/API/mutation) may continue while the above remains blocked.

---

## 14. Parallel lanes (low risk)

May run in parallel when allowlisted and gate-clean:

- Docs / kernel / handoff updates (including this handoff)
- Read-only audits
- Product specs
- Evidence docs
- UI polish packs that avoid DB/runtime/API/mutation and preserve existing routes
- Design evidence cleanup
- i18n copy safety review
- Non-runtime planning packets
- Filling intake template only with **non-secret** confirmations
- Backup/restore planning docs without secrets
- AI product contracts
- GTM / business docs
- Country launch matrix
- Consent / do-not-call / audit policies

### Forbidden safe-lane drift

- No broad refactor
- No architecture rewrite
- No DB apply
- No DB connection test
- No Prisma schema/migration edits
- No Prisma migration/apply/status command
- No Supabase DB command
- No `.env` value printing
- No `.env` modification
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
2. Confirm baseline: `git rev-parse origin/master` → expect `32a5826` until updated.
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

**Pack15C handoff sync (Supabase DB secret audit):** This document updated after Pack15C Supabase DB secret location audit evidence merged @ `32a5826` (PR #90). DB secret presence is `PRESENT` by key name only; secret values `NOT VERIFIED`; DB connection `NOT ATTEMPTED`. Decision remains `B) NOT READY`. DB apply, Pack15D, Pack16 runtime/API, and Pack17 runtime/UI/inbox remain blocked. Evidence: `docs/design/evidence/cursor-pack15c-kernel-handoff-sync-after-supabase-db-secret-audit/README.md`.
