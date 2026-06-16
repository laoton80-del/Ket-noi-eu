# VIONA Kernel + Handoff — Fast Safe Global Mode

**Document type:** Canonical kernel and session handoff for VIONA engineering, product, and AI agents.  
**Audience:** New ChatGPT / Cursor windows, staff, contractors, and automation executors.  
**Baseline:** `origin/master @ 3de7667` — `chore(requests): add Gate Factory for request gates (#77)`  
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

DB apply → schema verification → read-only API → read-only inbox → mutation → operator workflow → AI action foundation must follow the pack sequence in §10. No API/mutation/runtime ahead of approval.

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
| Commit | `3de7667` |
| Message | `chore(requests): add Gate Factory for request gates (#77)` |

All new work branches from this SHA unless a later pack explicitly updates this handoff.

---

## 6. Completed milestones (Request Engine chain)

| Pack | Milestone | Notes |
|------|-----------|--------|
| Pack10C | Human SoT approval recorded | Source-of-truth signoff path |
| Pack11 | Dedicated store schema design contract | No LocalServiceRequest SoT reuse |
| Pack11B | Schema-design human approval | Recording only |
| Pack12 | Prisma schema readiness boundary | Gates for schema work |
| Pack13A | Prisma schema implementation approval packet | Human packet prepared |
| Pack13B | Prisma schema implementation approval recorded | Human approval on file |
| Pack13C | VIONA Request Prisma schema models added | Schema in `prisma/schema.prisma` |
| Pack14A | Migration readiness approval packet | Blank/pending → human review |
| Pack14B | Migration human approval recorded | Enables migration **file** planning only |
| Pack14C | Migration file creation complete | `origin/master @ 2c15ba9` |
| Pack14D | Gate Factory no-product-change complete | `origin/master @ 3de7667` |

---

## 7. Pack14C state (current)

| Item | State |
|------|--------|
| Migration file | `prisma/migrations/20260615120000_add_viona_request_models/migration.sql` |
| Migration SQL | Additive-only |
| `prisma/schema.prisma` in Pack14C | Unchanged |
| `migrationCreated` | `true` |
| `prismaMigrationActive` | `true` |
| `pack14MigrationCreationOnly` | `true` |
| `dbApplied` | `false` |
| API / adapter / mutation / runtime | None |
| DB apply | **Blocked** |

Product doc: `docs/product/VIONA_REQUEST_PACK14C_PRISMA_MIGRATION_CREATION_ONLY.md`  
Evidence: `docs/design/evidence/cursor-request-pack14c-prisma-migration-creation-only/README.md`  
Gate: `node scripts/viona-request-pack14c-prisma-migration-creation-check.mjs`

---

## 8. Pack14D state (current)

| Item | Path / note |
|------|-------------|
| Gate Factory helper | `scripts/lib/vionaPackDiffAllowlist.mjs` |
| Pack14D check | `scripts/viona-request-pack14d-gate-factory-check.mjs` |
| Product doc | `docs/product/VIONA_REQUEST_PACK14D_GATE_FACTORY_NO_PRODUCT_CHANGE.md` |
| Evidence | `docs/design/evidence/cursor-request-pack14d-gate-factory/README.md` |

**Purpose:**

- Centralize Pack14C migration allowlist logic
- Reduce repeated legacy gate false positives
- Preserve gate semantics (schema always forbidden in Pack14D context; only exact Pack14C migration SQL path may be allowed when recognized)

**Pack14D did NOT change:** product/runtime, `prisma/schema.prisma`, migration SQL, or DB apply. Full gates PASS on master @ `3de7667`.

---

## 9. Current blocked list

Still **blocked** until future approved packs:

- DB apply
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

---

## 10. Next sequence (critical path)

Execute in order — do not skip:

1. **Pack15A** — DB apply readiness approval packet  
2. **Pack15B** — Record DB apply human approval  
3. **Pack15C** — DB apply only, if approved  
4. **Pack15D** — DB schema verification  
5. **Pack16** — Read-only persistence API  
6. **Pack17** — Live read-only request inbox  
7. **Pack18** — Request mutation  
8. **Pack19** — Merchant / operator workflow  
9. **Pack20+** — AI request assistant / AI action foundation  

---

## 11. Parallel lanes (low risk)

May run in parallel when allowlisted and gate-clean:

- UI polish (no routing/money/auth semantic drift)
- Docs / specs (including this handoff)
- AI product contracts
- GTM / business docs
- i18n / safety copy
- Country launch matrix
- Consent / do-not-call / audit policies

---

## 12. Stop list (hard stops)

Stop immediately and report if asked to:

- Apply DB without Pack15B approval and Pack15C scope
- Add API or mutation ahead of Pack16–18 sequence
- Add OPERATOR role ahead of pack
- Enable live AI call, SOS, payment, or booking ahead of gates
- Make broad unrelated repo changes during a narrow pack
- Weaken gate scripts, allowlists, or forbidden-claims checks
- Claim production/live behavior in docs or UI without evidence

---

## Quick start for a new session

1. Read this file and `docs/ai-context/VIONA_OPERATING_PROTOCOL.md`.
2. Confirm baseline: `git rev-parse origin/master` → expect `3de7667` until updated.
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
| `docs/product/VIONA_REQUEST_PACK14C_*` / `PACK14D_*` | Pack14C/14D boundaries |

---

**Pack14E:** This document — kernel + handoff sync after Pack14C migration-file-only, Pack14D Gate Factory, Fast Safe Global Mode, and Cursor-first execution law. Evidence: `docs/design/evidence/cursor-pack14e-kernel-handoff-fast-safe-global-mode/README.md`.
