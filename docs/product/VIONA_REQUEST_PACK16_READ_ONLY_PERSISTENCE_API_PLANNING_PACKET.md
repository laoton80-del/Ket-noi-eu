# VIONA Request Engine — Pack16 Read-Only Persistence API Planning Packet

**Document type:** Future read-only persistence API planning (docs-only — no implementation).
**Baseline:** `origin/master @ 61293b9` — `docs(kernel): sync handoff after Pack15C intake template (#85)`.
**Related:** `docs/product/VIONA_REQUEST_PACK15C_EXECUTION_INPUTS_INTAKE_TEMPLATE.md`, `docs/ai-context/VIONA_KERNEL_HANDOFF_FAST_SAFE_GLOBAL_MODE.md`

---

## 1. Purpose

This document is a **docs-only planning packet** for the future Pack16 read-only VIONA Request persistence API.

It does **not** implement API.
It does **not** create routes, controllers, or server code.
It does **not** create a persistence adapter.
It does **not** run DB commands.
It does **not** apply DB.
It does **not** run Prisma commands.
It does **not** change schema, migration, or runtime.
It does **not** unlock live request inbox or mutation.

Pack16 runtime/API is **not implemented** in this pack. This is a **future-only** plan, not implementation. No API, mutation, or live runtime claim is made.

---

## 2. Current verified baseline

| Field | Value |
| --- | --- |
| Remote | `origin/master` |
| Commit | `61293b9` |
| Message | `docs(kernel): sync handoff after Pack15C intake template (#85)` |
| Pack15C intake template | Complete on master (PR #84 @ `13793af`) |
| Pack15C decision | `B) NOT READY — missing target environment / backup / restore / operator go-no-go` |
| Execution inputs | All 15 default **`Missing`** |
| Intake template | **Not** execution approval |
| DB apply | **Blocked** |

Pack16 remains **blocked** until DB apply is successfully performed and Pack15D DB schema verification is complete.

---

## 3. Current blocked flags

| Flag | Value |
| --- | --- |
| `pack15ExecutionReady` | `false` |
| `pack15DbApplyPerformed` | `false` |
| `dbApplied` | `false` |
| `pack15ExecutionInputsIntakeTemplateActive` | `true` |
| `pack15ExecutionInputsComplete` | `false` |
| `pack16ReadOnlyPersistenceApiPlanningPacketActive` | `true` |
| `pack16RuntimeImplementationStarted` | `false` |
| `pack16ReadOnlyApiImplemented` | `false` |

---

## 4. Preconditions before any Pack16 implementation

Pack16 runtime implementation may **not** begin until **all** of the following are true:

1. All 15 Pack15C execution inputs are **complete** outside repo.
2. ChatGPT reviews the **completed** intake.
3. A separate execution-only Pack15C DB apply pack is **authorized**.
4. DB apply **succeeds**.
5. Pack15D DB schema verification confirms the **expected** schema.
6. **No** secrets were exposed.
7. **No** rollback/restore issue remains unresolved.

---

## 5. Future Pack16 scope

Future Pack16 scope is **read-only only**:

- Read existing VIONA Request records from persistence
- **No** mutation
- **No** status update
- **No** payment capture
- **No** booking confirmation
- **No** SOS dispatch
- **No** wallet mutation
- **No** live AI protected action
- **No** merchant live execution
- **No** OPERATOR Prisma/Auth escalation

Dedicated VIONA Request Store remains source-of-truth direction. Direct `LocalServiceRequest` reuse remains disallowed.

---

## 6. Future read-only API safety boundaries

Future Pack16 API implementation must include:

- Read-only endpoint behavior
- **No** writes
- **No** side effects
- **No** payment/booking/SOS/wallet truth change
- **No** `LocalServiceRequest` source-of-truth reuse
- **No** fake production claims
- Explicit Lite / Pilot / Beta / Coming Soon / Frozen wording if the feature is not production-ready
- Logging **without** secrets
- Error handling **without** exposing DB URLs or secrets
- i18n-safe user copy

---

## 7. Future data access assumptions

Assumptions remain **provisional** until DB apply and Pack15D schema verification:

- Request tables expected from migration
- Indexes expected from migration
- FK constraints expected from migration
- Actual schema must be **verified in Pack15D** before implementation
- **No** code may rely on unverified DB state

### Migration target reference

| Item | Path |
| --- | --- |
| Migration file | `prisma/migrations/20260615120000_add_viona_request_models/migration.sql` |

### Read-only audit summary (not DB apply evidence)

| Check | Result |
| --- | --- |
| CREATE TYPE count | `1` |
| CREATE TABLE count | `6` |
| CREATE INDEX count | `12` |
| ALTER TABLE count | `5` |
| DROP count | `0` |
| DELETE/TRUNCATE count | `0` |

Expected tables (from migration file — unverified until Pack15D): `VionaRequest`, `VionaRequestParticipant`, `VionaRequestSourceLink`, `VionaRequestStatusEvent`, `VionaRequestAuditEvent`, `VionaRequestAttachmentReference`.

This is **read-only audit evidence only**. It is **not** DB apply evidence.

---

## 8. Future implementation shape (planning only — not code)

Planning-level architecture only. **No executable code** in this packet.

| Layer | Future role (after Pack15D) |
| --- | --- |
| Prisma read-only query layer | Read-only queries against verified VIONA request tables — no writes |
| Service boundary | Read-only request retrieval; no mutation paths |
| Route/controller layer | Only in a **separate** Pack16 implementation pack after preconditions (§4) |
| Admin/debug read-only view | Later only, after read-only API exists |
| Mutation path | **Not** in Pack16 |
| AI action execution | **Not** in Pack16 |

---

## 9. Still blocked

The following remain **blocked**:

- DB apply
- Pack15C execution-only DB apply pack
- Pack15D DB schema verification
- Pack16 runtime implementation
- Read-only persistence API
- Live read-only request inbox
- Request mutation
- Admin Debug live data
- OPERATOR Prisma/Auth
- Payment capture
- Booking confirmation
- SOS dispatch
- Wallet mutation
- Live AI protected actions
- Live merchant execution

---

## 10. Stop list

Hard stop if any of the following appear in this planning pack or without authorized follow-on pack:

- Runtime/API files are changed
- Prisma schema or migration files are changed
- `.env` or secrets are touched
- DB command is run
- Prisma command is run
- DB apply is claimed
- Pack16 implementation is claimed
- Read-only API is claimed as live/production-ready without evidence
- Mutation, status, payment, booking, SOS, wallet, or live AI behavior is unlocked
- OPERATOR Prisma/Auth change appears
- Fake production claim appears
- Out-of-allowlist files changed

---

## 11. Next sequence

1. **Pack16 read-only persistence API planning packet** — this pack
2. Human/operator fills Pack15C intake template without secrets
3. ChatGPT reviews completed intake
4. **Pack15C execution-only DB apply pack** — only after all execution inputs and approval phrase
5. **Pack15D** — DB schema verification only after successful DB apply
6. **Pack16 read-only persistence API implementation** — only after Pack15D
7. **Pack17** — Live read-only request inbox
8. **Pack18** — Request mutation
9. **Pack19** — Merchant/operator workflow
10. **Pack20+** — AI request assistant / AI action foundation

---

## Evidence

`docs/design/evidence/cursor-pack16-read-only-persistence-api-planning-packet/README.md`
