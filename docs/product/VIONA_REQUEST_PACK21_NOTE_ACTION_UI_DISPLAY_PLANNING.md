# VIONA Request Engine — Pack21 Note Action UI/Display Planning

**Document type:** Note action UI/display planning (docs-only — no implementation).
**Baseline:** `origin/master @ 89fd14c` — `feat(pack20): implement narrow Viona request note action endpoint (#139)`.
**Related:** `docs/product/VIONA_REQUEST_PACK20_FIRST_NARROW_NOTE_ACTION_IMPLEMENTATION_RESULT.md`, `docs/product/VIONA_REQUEST_PACK17_LIVE_READ_ONLY_REQUEST_INBOX_IMPLEMENTATION_RESULT.md`, `docs/product/VIONA_REQUEST_PACK16_READ_ONLY_REQUEST_API_IMPLEMENTATION_RESULT.md`, `src/components/viona/requests/VionaRequestLiveDetailReadOnly.tsx`, `src/services/vionaRequestApi.ts`

---

## 1. Baseline

| Field | Value |
| --- | --- |
| Remote | `origin/master` |
| Commit | `89fd14c` |
| Message | `feat(pack20): implement narrow Viona request note action endpoint (#139)` |
| Pack15C DB apply | **Green** (PR #131) |
| Pack15D verification | **Green** (PR #133) |
| Pack16 read-only API | **Green** on master (PR #135 @ `6ddbc59`) |
| Pack17 live read-only inbox | **Green** on master (PR #136 @ `2ed1d29`) |
| Pack18 write/action planning | **Green** (PR #137) |
| Pack19 implementation planning | **Green** (PR #138) |
| Pack20 note action endpoint | **Green** on master (PR #139 @ `89fd14c`) |
| Pack21 UI/display planning authorized | **YES** — Nong Si Buong (planning only) |
| All user-triggered write/action UI | **Blocked** until separate implementation authorization |

---

## 2. Operator authorization

| Item | Value |
| --- | --- |
| Operator authorization present | **YES** |
| Operator | **Nong Si Buong** |
| Authorization scope | Pack21 request note action UI/display **planning** on current master only |
| UI code authorized in this pack | **NO** |
| Note POST from app UI authorized | **NO** |
| Status / assign / confirm / cancel authorized | **NO** |
| Payments / booking / SOS / wallet / live AI changes | **NO** |

**Operator quote (scope lock):**

> I, Nong Si Buong, authorize Pack21 request note action UI/display planning on current master only. Plan how the verified Pack20 note audit action should appear in the Pack17 live inbox/detail experience and prepare the next safe UI integration path. Do not create write/action UI yet, do not call the note POST endpoint from the app UI, do not implement status changes, assign, confirm, cancel, payments/booking/SOS/wallet/live AI, Prisma schema or migration changes, and do not print secrets. Keep all user-triggered write/action UI blocked until a separate implementation authorization pack is reviewed, merged, and verified.

---

## 3. Pack21 objective

Pack21 plans how **verified Pack20 note audit actions** should appear in the **Pack17 live read-only inbox/detail** experience and defines the **next safe UI integration path** — without implementing UI, without calling `POST /api/viona/requests/:id/actions/note` from the app, and without changing Pack16/Pack17/Pack20 runtime behavior.

---

## 4. Current verified foundation

| Layer | State on master |
| --- | --- |
| Pack16 read-only API | **Green** — `GET /api/viona/requests`, `GET /api/viona/requests/:id` |
| Pack17 live read-only inbox | **Green** — GET-only client; read-only banner; no action buttons |
| Pack20 note action API | **Green** — `POST /api/viona/requests/:id/actions/note` (server only; not wired in app UI) |
| Pack17 detail today | Shows generic **Audit events** section (`eventType` + `message`) from Pack16 detail DTO |
| Status / assign / confirm / cancel | **Blocked** — no routes, no UI |
| User-triggered write/action UI | **Blocked** — no input, no submit, no POST from client |

Pack20 note actions are already persisted as `VionaRequestAuditEvent` rows with `eventType: action.note` and safe note text in `payloadJson.note`. Pack16 detail read already returns `auditEvents[]` — Pack17 can display notes **read-only** from existing GET data without new API routes.

---

## 5. Display model (future read-only implementation)

**Label:** `FUTURE DISPLAY ONLY — NOT IMPLEMENTED IN PACK21`

### 5.1 Audit timeline entries

| Element | Rule |
| --- | --- |
| Placement | Request detail — dedicated **Notes / audit timeline** section (or refined **Audit events** subsection) |
| Source | Existing Pack16 `auditEvents[]` from `GET /api/viona/requests/:id` — **no new read endpoint** |
| Note events filter | Show entries where `eventType === 'action.note'` |
| Other audit types | May remain in separate generic audit list or grouped by type — planning preference: **note-first timeline** plus collapsed generic audit |

### 5.2 Safe field mapping

| DTO field | Display use |
| --- | --- |
| `eventType` | Map `action.note` → user-facing label **Note** (localized later) |
| `actorRoleLabel` | Safe actor label (e.g. requester, owner, participant) — no client-trusted role |
| `actorUserId` | **Do not display raw user id** unless already a safe display pattern exists; prefer role label |
| `message` | Secondary summary (e.g. “Request note appended.”) |
| `payloadJson.note` | Primary note body when present and string-typed — trim; max display length cap |
| `createdAt` | Timestamp — formatted locale-safe |
| `payloadJson.idempotencyKey` | **Do not display** |
| `payloadJson.clientCorrelationId` | **Do not display** |
| Full `payloadJson` | **Never render raw JSON** in UI |

### 5.3 Safety rules

| Rule | Detail |
| --- | --- |
| No raw payload leakage | Never dump `payloadJson` object to screen |
| No secrets | Do not surface tokens, credentials, URLs, or env-like strings |
| No internal IDs beyond existing patterns | Reuse Pack17 safe id display conventions only where already shown |
| No fake production claims | Notes are workflow evidence — not payment/booking/SOS truth |
| Empty state | “No notes yet” when no `action.note` events — distinct from generic empty audit |
| Ordering | Chronological ascending or descending — match status events convention (document in Pack22) |

---

## 6. Pack17 UI impact planning

**Label:** `PACK17 REMAINS READ-ONLY IN PACK21`

| Topic | Plan |
| --- | --- |
| Pack21 runtime change | **None** — planning only |
| Future Pack22 display location | `VionaRequestLiveDetailReadOnly` — enhance audit/notes section |
| List screen | Optional note count badge or last-note preview — **defer** unless Pack22 scope explicitly includes |
| Grouping / filter | Filter `auditEvents` by `eventType`; optional toggle “Notes only” vs “All audit” |
| Empty state | Dedicated copy when zero note events |
| Read-only safety copy | Retain banner: live read-only inbox · no actions · write/actions blocked |
| Input fields | **None in Pack21 or Pack22 read-only display pack** |
| Submit button | **None** |
| POST call | **None** — GET detail refresh only |

Pack17 must continue to use `fetchVionaRequestById` (GET-only) — no new client mutation helpers in read-only display packs.

---

## 7. Future write UI planning (later pack — separate authorization)

**Label:** `FUTURE WRITE UI ONLY — NOT AUTHORIZED IN PACK21`

A later pack (e.g. Pack23+) may add note **input** UI only after **separate operator authorization**. Planned requirements:

| Requirement | Rule |
| --- | --- |
| Explicit user action | User taps “Add note” — not automatic or AI-triggered |
| Validation | Client mirrors server rules: required non-empty note, max length, no URL-like content |
| Disabled / loading | Disable submit while in-flight; prevent double submit |
| Safe error display | Generic errors — no stack traces or DB messages |
| Idempotency key | Generate per submit attempt; send with POST body |
| Refresh after success | Reload detail via GET — show new audit timeline entry |
| No fake success | Success only after server 201/200 with audit event id |
| No offline queued write | **Forbidden** unless separately authorized pack |
| Scope | Note POST only — no status/assign/confirm/cancel controls |
| Safety copy | No payment settlement / booking fulfillment / emergency escalation implications |

---

## 8. Safety boundary (this planning pack)

| Item | State |
| --- | --- |
| Pack21 creates write/action UI | **NO** |
| Pack21 calls `POST .../actions/note` from app | **NO** |
| Pack21 implements status / assign / confirm / cancel | **NO** |
| Pack21 modifies Pack17 runtime | **NO** |
| Pack21 modifies Pack20 runtime | **NO** |
| Pack21 modifies Pack16 runtime | **NO** |
| Pack21 touches payments / booking / SOS / wallet / live AI | **NO** |
| Pack21 modifies Prisma schema or migrations | **NO** |
| Pack21 runs DB/Prisma/Supabase/SQL commands | **NO** |
| Pack21 inspects or prints secrets | **NO** |
| Pack21 authorizes Global Product Full Active Automation claims | **NO** |

---

## 9. Future Pack22 recommendation

| Option | Description | Safer? |
| --- | --- | --- |
| **Pack22 — read-only note/audit timeline display** | Enhance Pack17 detail to render `action.note` entries from existing Pack16 GET detail — no POST, no input | **YES — recommended first** |
| Pack23+ — note input UI | Add note field + submit calling Pack20 POST — only after separate authorization and Pack22 display verified | Later |

**Recommended sequence:**

| Pack | Lane |
| --- | --- |
| **Pack21** (this pack) | UI/display planning — docs-only |
| **Pack22** | Read-only note/audit timeline display implementation (GET-only client; Pack17 detail enhancement) |
| **Pack23+** | Note input/write UI — separate authorization only after Pack22 verified |

Pack22 should not add `fetchVionaRequestNote` POST helper until a dedicated write-UI authorization pack explicitly allows it.

---

## 10. Status flags

| Flag | Value |
| --- | --- |
| `pack16ReadOnlyApiVerified` | `true` |
| `pack17LiveReadOnlyInboxVerified` | `true` |
| `pack20NoteActionVerified` | `true` |
| `pack21NoteActionUiDisplayPlanningAuthorized` | `true` |
| `pack21NoteActionUiDisplayPlanningPrepared` | `true` |
| `pack21WriteActionUiCreated` | `false` |
| `pack21PostEndpointCalledFromUi` | `false` |
| `pack21StatusActionImplemented` | `false` |
| `pack21AssignConfirmCancelImplemented` | `false` |
| `allUserTriggeredWriteActionUiBlocked` | `true` |

---

## 11. Explicit non-authorization (this planning pack)

| Item | State |
| --- | --- |
| This pack implements UI code | **NO** |
| This pack modifies Pack17 inbox runtime | **NO** |
| This pack modifies Pack20 note action runtime | **NO** |
| This pack calls note POST from app UI | **NO** |
| This pack creates note input field | **NO** |
| This pack creates submit button | **NO** |
| This pack creates write/action UI | **NO** |
| This pack implements status changes | **NO** |
| This pack implements assign / confirm / cancel | **NO** |
| This pack modifies payments / booking / SOS / wallet / live AI | **NO** |
| This pack modifies Prisma schema | **NO** |
| This pack creates or edits migrations | **NO** |
| This pack runs DB/Prisma/Supabase/SQL commands | **NO** |
| This pack inspects or prints secrets | **NO** |
| Separate Pack22 implementation authorization required | **YES** — for read-only display code |
| Separate later authorization required for write UI | **YES** |

---

## 12. Still blocked

- Pack21 UI implementation
- Pack21 note POST from client
- Pack21 write/action input or submit controls
- Status / assign / confirm / cancel UI or API
- Payment / booking / SOS / wallet / live AI integration via request UI
- Offline queued note writes

---

## 13. Recommendation

| Recommendation | Status |
| --- | --- |
| **A) Safe to open PR** for docs-only Pack21 planning | **YES** — if gate-clean |
| Safe to implement read-only note display yet | **NO** — requires Pack22 authorization |
| Safe to add note input / POST from UI yet | **NO** |
| Next after merge/verify | **Pack22** — read-only note/audit timeline display implementation (GET-only) |

---

**Evidence:** `docs/design/evidence/cursor-pack21-note-action-ui-display-planning/README.md`
