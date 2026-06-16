# VIONA Request Engine — Pack17 Live Read-Only Request Inbox Planning Packet

**Document type:** Future live read-only request inbox planning (docs-only — no implementation).
**Baseline:** `origin/master @ fab30f4` — `docs(kernel): sync handoff after Pack16 planning packet (#87)`.
**Related:** `docs/product/VIONA_REQUEST_PACK16_READ_ONLY_PERSISTENCE_API_PLANNING_PACKET.md`, `docs/ai-context/VIONA_KERNEL_HANDOFF_FAST_SAFE_GLOBAL_MODE.md`

---

## 1. Purpose

This document is a **docs-only planning packet** for the future Pack17 Live Read-only Request Inbox.

It does **not** implement UI.
It does **not** implement screens.
It does **not** implement API.
It does **not** create routes, controllers, or server code.
It does **not** create a persistence adapter.
It does **not** run DB commands.
It does **not** apply DB.
It does **not** run Prisma commands.
It does **not** change schema, migration, or runtime.
It does **not** unlock live inbox.
It does **not** unlock mutation.
It does **not** unlock merchant/operator execution.

Pack17 runtime UI and live inbox are **not implemented** in this pack. This is a **future-only** plan, not implementation. No API, mutation, or live runtime claim is made.

---

## 2. Current verified baseline

| Field | Value |
| --- | --- |
| Remote | `origin/master` |
| Commit | `fab30f4` |
| Message | `docs(kernel): sync handoff after Pack16 planning packet (#87)` |
| Pack16 planning packet | Complete on master (PR #86 @ `a885425`) |
| Pack16 status | **Planning-only / future-only** — runtime/API **not implemented** |
| Pack15C decision | `B) NOT READY — missing target environment / backup / restore / operator go-no-go` |
| Execution inputs | All 15 default **`Missing`** |
| Intake template | **Not** execution approval |
| DB apply | **Blocked** |

Pack17 remains **blocked** until Pack16 read-only persistence API is implemented and verified. Pack16 implementation remains **blocked** until DB apply succeeds and Pack15D DB schema verification passes.

---

## 3. Current blocked flags

### Current flags (Pack15C / Pack16)

| Flag | Value |
| --- | --- |
| `pack15ExecutionReady` | `false` |
| `pack15DbApplyPerformed` | `false` |
| `dbApplied` | `false` |
| `pack15ExecutionInputsComplete` | `false` |
| `pack16ReadOnlyPersistenceApiPlanningPacketActive` | `true` |
| `pack16RuntimeImplementationStarted` | `false` |
| `pack16ReadOnlyApiImplemented` | `false` |

### Future-only Pack17 flags (this planning packet)

| Flag | Value |
| --- | --- |
| `pack17LiveReadOnlyInboxPlanningPacketActive` | `true` |
| `pack17RuntimeImplementationStarted` | `false` |
| `pack17LiveReadOnlyInboxImplemented` | `false` |

---

## 4. Preconditions before any Pack17 implementation

Pack17 runtime implementation may **not** begin until **all** of the following are true:

1. All 15 Pack15C execution inputs are **complete** outside repo.
2. ChatGPT reviews the **completed** intake.
3. A separate execution-only Pack15C DB apply pack is **authorized**.
4. DB apply **succeeds**.
5. Pack15D DB schema verification confirms the **expected** schema.
6. Pack16 read-only persistence API is **implemented** and **verified**.
7. Pack16 read-only API has **no** mutation, **no** side effects, and **no** fake production claims.
8. **No** secrets were exposed.
9. **No** rollback/restore issue remains unresolved.

---

## 5. Future Pack17 product scope

Future Pack17 scope is **read-only request inbox only**.

### Future Pack17 may show

- Request list
- Request detail preview
- Request type/category
- Requester display-safe summary
- Created time
- Status display-only
- Market/country display-only if available
- Merchant/admin assignment display-only if available
- Safety/readiness banners
- Empty state
- Loading state
- Error state
- “Not live yet” / “read-only preview” wording when needed

### Future Pack17 must not include

- Status update
- Accept/decline
- Payment capture
- Booking confirmation
- SOS dispatch
- Wallet mutation
- Merchant live execution
- OPERATOR Prisma/Auth escalation
- AI action execution
- Callback automation
- Notification sending
- External provider calls
- Irreversible action

Dedicated VIONA Request Store remains source-of-truth direction. Direct `LocalServiceRequest` reuse remains disallowed.

---

## 6. Future user groups

Planning copy and boundaries for future audiences:

| Group | Future role (read-only) |
| --- | --- |
| Internal admin/debug viewer | View request list and detail for diagnostics — no live mutation |
| Merchant read-only viewer | View assigned or relevant requests — no accept/decline/payment |
| Operator read-only viewer | View operational context — no dispatch or protected actions |
| User/customer read-only request history | Later — view own request history — no status change from inbox |

Role/auth implementation is **not** part of this pack. OPERATOR Prisma/Auth remains **blocked**.

---

## 7. Future UI design direction

Planning only — **no UI code** in this packet.

VIONA design doctrine for future Pack17 implementation:

- **Home** remains UI standard
- Use **Premium App Tiles** where applicable
- Use **compact request cards** for inbox rows
- Use **short title** and **subtitle**
- Use **semantic status chips**
- Use clear **“read-only”** and **“not final action”** language
- Avoid dashboard bloat
- Avoid fake production wording
- Keep **mobile-first** layout
- Preserve QA targets for future implementation: **390×844**, **768×1024**, **1024×768**, **1366×768**

---

## 8. Future safety and copy boundaries

Future Pack17 must show safety copy such as:

- “Read-only preview”
- “No action has been taken”
- “This does not confirm booking, payment, dispatch, or merchant acceptance”
- “Some data may be unavailable until persistence is fully verified”

No copy may imply:

- Booking confirmation
- Payment capture or wallet movement
- Merchant acceptance
- SOS dispatch or emergency outcome
- AI-completed action
- Operator-executed action
- Production readiness beyond verified state

---

## 9. Future data dependency assumptions

Assumptions remain **provisional** until Pack15D and Pack16 implementation.

Pack17 may depend **only** on verified read-only API response from Pack16 — **not** directly on unverified DB state.

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

This is **read-only audit evidence only**. It is **not** DB apply evidence.

---

## 10. Future architecture shape (planning only — not code)

Planning-level architecture only. **No executable code** in this packet.

| Layer | Future role (after Pack16) |
| --- | --- |
| Pack16 read-only persistence API | Provides verified read-only request data |
| Pack17 inbox UI | Consumes Pack16 read-only API only |
| Pack17 display layer | Request list and detail preview — read-only |
| Database writes | **None** from Pack17 |
| Request status mutation | **None** from Pack17 |
| Payment/booking/SOS/wallet/live AI | **Not** called from Pack17 |
| AI action execution | **Not** created by Pack17 |
| OPERATOR Prisma/Auth | **Not** introduced by Pack17 |

Pack17 displays request inbox UI only. Pack17 does **not** write to database. Pack17 does **not** mutate request status.

---

## 11. Still blocked

The following remain **blocked**:

- DB apply
- Pack15C execution-only DB apply pack
- Pack15D DB schema verification
- Pack16 runtime implementation
- Pack16 read-only persistence API
- Pack17 runtime implementation
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

## 12. Stop list

Hard stop if any of the following appear in this planning pack or without authorized follow-on pack:

- Runtime/UI files are changed
- Screens/components are changed
- API/routes/controllers/server files are changed
- Prisma schema or migration files are changed
- `.env` or secrets are touched
- DB command is run
- Prisma command is run
- DB apply is claimed
- Pack16 implementation is claimed
- Pack17 implementation is claimed
- Live inbox is claimed as implemented
- Read-only API is claimed as live
- Mutation/status/payment/booking/SOS/wallet/live AI is unlocked
- OPERATOR Prisma/Auth change appears
- Fake production claim appears
- Out-of-allowlist files changed

---

## 13. Next sequence

1. **Pack17 live read-only request inbox planning packet** — this pack
2. Human/operator fills Pack15C intake template without secrets
3. ChatGPT reviews completed intake
4. **Pack15C execution-only DB apply pack** — only after all execution inputs and approval phrase
5. **Pack15D** — DB schema verification only after successful DB apply
6. **Pack16 read-only persistence API implementation** — only after Pack15D
7. **Pack17 live read-only request inbox implementation** — only after Pack16 read-only API
8. **Pack18** — Request mutation planning / implementation only after read-only inbox is verified
9. **Pack19** — Merchant/operator workflow
10. **Pack20+** — AI request assistant / AI action foundation

---

## Evidence

`docs/design/evidence/cursor-pack17-live-read-only-request-inbox-planning-packet/README.md`
