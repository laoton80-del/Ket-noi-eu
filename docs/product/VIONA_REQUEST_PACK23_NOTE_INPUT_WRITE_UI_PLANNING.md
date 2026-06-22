# VIONA Request Engine — Pack23 Note Input/Write UI Planning

**Document type:** Note input/write UI planning (docs-only — no implementation).
**Baseline:** `origin/master @ bee6f7b` — `feat(pack22): add read-only note audit timeline to Pack17 live detail (#141)`.
**Related:** `docs/product/VIONA_REQUEST_PACK22_READ_ONLY_NOTE_AUDIT_TIMELINE_DISPLAY_RESULT.md`, `docs/product/VIONA_REQUEST_PACK21_NOTE_ACTION_UI_DISPLAY_PLANNING.md`, `docs/product/VIONA_REQUEST_PACK20_FIRST_NARROW_NOTE_ACTION_IMPLEMENTATION_RESULT.md`, `src/components/viona/requests/VionaRequestLiveDetailReadOnly.tsx`, `src/services/vionaRequestApi.ts`

---

## 1. Baseline

| Field | Value |
| --- | --- |
| Remote | `origin/master` |
| Commit | `bee6f7b` |
| Message | `feat(pack22): add read-only note audit timeline to Pack17 live detail (#141)` |
| Pack15C DB apply | **Green** (PR #131) |
| Pack15D verification | **Green** (PR #133) |
| Pack16 read-only API | **Green** (PR #135) |
| Pack17 live read-only inbox | **Green** (PR #136) |
| Pack20 note action API | **Green** (PR #139) |
| Pack21 UI/display planning | **Green** (PR #140) |
| Pack22 read-only note/audit timeline | **Green** (PR #141) |
| Pack23 planning authorized | **YES** — Nong Si Buong (planning only) |
| All user-triggered write/action UI | **Blocked** until separate Pack24 implementation authorization |

---

## 2. Operator authorization

| Item | Value |
| --- | --- |
| Operator authorization present | **YES** |
| Operator | **Nong Si Buong** |
| Authorization scope | Pack23 request note input/write UI **planning** on current master only |
| UI code authorized in this pack | **NO** |
| Note POST from app UI authorized in this pack | **NO** |
| Input fields / submit buttons authorized in this pack | **NO** |
| Status / assign / confirm / cancel authorized | **NO** |
| Payments / booking / SOS / wallet / live AI changes | **NO** |

**Operator quote (scope lock):**

> I, Nong Si Buong, authorize Pack23 request note input/write UI planning on current master only. Plan the future user-triggered note input UI that may call the verified Pack20 `POST /api/viona/requests/:id/actions/note` endpoint after a separate implementation authorization. Do not implement UI code yet, do not call the note POST endpoint from app UI, do not create input fields or submit buttons, do not implement status changes, assign, confirm, cancel, payments/booking/SOS/wallet/live AI, Prisma schema or migration changes, and do not print secrets. Keep all user-triggered write/action UI blocked until a separate Pack24 implementation authorization pack is reviewed, merged, and verified.

---

## 3. Pack23 objective

Pack23 plans the **future user-triggered note input/write UI** that may call the verified Pack20 `POST /api/viona/requests/:id/actions/note` endpoint — **only after separate Pack24 implementation authorization** — without implementing UI, without calling POST from the app, and without changing Pack16/Pack17/Pack20/Pack22 runtime behavior.

---

## 4. Current verified foundation

| Layer | State on master |
| --- | --- |
| Pack16 read-only API | **Green** — `GET /api/viona/requests`, `GET /api/viona/requests/:id` |
| Pack17 live read-only inbox | **Green** — GET-only client; read-only banner |
| Pack20 note action API | **Green** — `POST /api/viona/requests/:id/actions/note` (server only) |
| Pack21 display planning | **Green** — read-only display path defined |
| Pack22 read-only timeline | **Green** — `action.note` rows in Notes section from `auditEvents[]` |
| Current Pack17 UI | **Read-only** — no input, no submit, no POST |
| User-triggered write/action UI | **Blocked** |

---

## 5. Future Pack24 UI placement plan

**Label:** `FUTURE UI ONLY — NOT IMPLEMENTED IN PACK23`

| Topic | Plan |
| --- | --- |
| Placement | Below Pack22 **Notes** read-only timeline in `VionaRequestLiveDetailReadOnly` (or sibling component) |
| Visual separation | Clear divider/copy: “Add note” form **below** read-only history — history never editable inline |
| Pack22 timeline | **Unchanged** — continues to render from GET detail `auditEvents[]` |
| Duplication avoidance | After successful POST, refresh GET detail once; timeline appends new row — do not optimistically duplicate |
| Confusion avoidance | Form labeled as future write action; timeline labeled read-only history; no mixed edit-in-place on timeline rows |

---

## 6. Future note input behavior plan

**Label:** `FUTURE INPUT BEHAVIOR — NOT IMPLEMENTED IN PACK23`

| Behavior | Plan |
| --- | --- |
| Note text input | Single multiline text field (future Pack24) |
| Character limit | Align with server max (4000 chars); show remaining count |
| Validation | Required non-empty trimmed string; block over-limit before submit |
| Unsafe content | Mirror server rules (no URL-like content); show safe validation message |
| Disabled state | Disabled when loading, when unauthenticated, or when detail not loaded |
| Loading state | Disable input + submit while POST in flight |
| Success state | Clear input; show non-fake success copy; refresh GET detail |
| Error state | Generic safe message; preserve user text for retry |
| Retry guidance | Allow retry with same idempotency key for in-flight duplicate protection |
| Detail refresh | Call existing `fetchVionaRequestById` after 201/200 success |
| No fake success | Success only after server response with audit event metadata |

---

## 7. Future API call plan

**Label:** `FUTURE API CALL ONLY — NOT IMPLEMENTED IN PACK23`

| Item | Plan |
| --- | --- |
| Endpoint | `POST /api/viona/requests/:id/actions/note` — existing Pack20 route only |
| New server endpoint | **NO** |
| Request body | `{ note }` or `{ noteText }` (match Pack20 controller acceptance) |
| Optional fields | `idempotencyKey`, `clientCorrelationId` |
| Auth | Existing REST JWT bridge via `restApiFetchJson` pattern |
| Status mutation | **NO** |
| Assign / confirm / cancel | **NO** |
| Client helper | Future `appendVionaRequestNote` in `vionaRequestApi.ts` — **Pack24 only** |

---

## 8. Idempotency plan

**Label:** `FUTURE IDEMPOTENCY — PLANNING ONLY`

| Topic | Plan |
| --- | --- |
| Key generation | Generate one `idempotencyKey` per explicit user submit attempt (e.g. UUID) |
| Reuse on retry | Same key for automatic retry of failed network call for that attempt |
| New submit | New key when user taps submit again after success or intentional new note |
| 201 vs 200 | Treat 201 as new note created; 200 idempotent replay as success without duplicate timeline row |
| UI feedback | On replay, refresh detail once; do not show duplicate success toasts |
| Storage | In-memory per submit attempt only — no offline queue unless separately authorized |

---

## 9. Permission and safety copy

| Topic | Future copy rule |
| --- | --- |
| Audited action | Explain note is recorded in audit trail |
| No status change | “Adding a note does not change request status.” |
| No booking/payment/SOS | No implication of booking confirmation, payment settlement, or emergency escalation |
| No production automation | Honest readiness labels; not production-ready automation claims |
| Read-only history | Keep Pack22 timeline banner: read-only history above write form |

---

## 10. Testing plan for future Pack24

**Label:** `FUTURE TEST PLAN — NOT EXECUTED IN PACK23`

| Scenario | Expected |
| --- | --- |
| No write before submit | Input edits do not call POST until explicit submit |
| Successful note submit | POST → 201 → GET refresh → new timeline row |
| Loading state | Input/submit disabled during request |
| Validation error | Empty/over-limit/unsafe input blocked client-side with safe message |
| API error | Generic error; input preserved |
| Idempotent retry | Same key on retry → 200 replay; no duplicate row |
| Timeline refresh | GET detail shows exactly one new note after success |
| No status change | Request status unchanged in detail |
| No duplicate rows | Idempotent replay does not duplicate timeline cards |
| Auth failure | 401 → safe message; no POST side effects |
| Access boundaries | Requester/owner/participant only — 404 for unauthorized |

---

## 11. Rollback plan

| Topic | Plan |
| --- | --- |
| Pack24 revert | Remove Pack24 UI/input/submit/POST helper files only |
| Pack20 server | **Unchanged** — note endpoint remains |
| Pack22 timeline | Continues working from GET detail after Pack24 revert |
| Feature flag (optional future) | `vionaRequestNoteInputEnabled` default false until verified — planning suggestion only |

---

## 12. Future Pack24 recommendation

| Recommendation | Detail |
| --- | --- |
| Pack24 authorization | Separate implementation authorization from Nong Si Buong required |
| Scope | First user-triggered note input UI only |
| API | Call verified Pack20 note endpoint only — no new server routes |
| Exclusions | No status/assign/confirm/cancel; no payment/booking/SOS/wallet/live AI; no Prisma/migrations |
| Prerequisite | Pack22 read-only timeline verified green on master (satisfied @ `bee6f7b`) |

---

## 13. Status flags

| Flag | Value |
| --- | --- |
| `pack16ReadOnlyApiVerified` | `true` |
| `pack17LiveReadOnlyInboxVerified` | `true` |
| `pack20NoteActionApiVerified` | `true` |
| `pack21NoteActionUiDisplayPlanningVerified` | `true` |
| `pack22ReadOnlyNoteAuditTimelineVerified` | `true` |
| `pack23NoteInputWriteUiPlanningAuthorized` | `true` |
| `pack23NoteInputWriteUiPlanningPrepared` | `true` |
| `pack23UiCodeImplemented` | `false` |
| `pack23NoteInputCreated` | `false` |
| `pack23SubmitButtonCreated` | `false` |
| `pack23PostEndpointCalledFromUi` | `false` |
| `pack23StatusActionImplemented` | `false` |
| `pack23AssignConfirmCancelImplemented` | `false` |
| `allUserTriggeredWriteActionUiBlocked` | `true` |

---

## 14. Explicit non-authorization (this planning pack)

| Item | State |
| --- | --- |
| This pack implements UI code | **NO** |
| This pack creates input fields | **NO** |
| This pack creates submit buttons | **NO** |
| This pack calls note POST from app UI | **NO** |
| This pack creates write/action UI | **NO** |
| This pack implements status changes | **NO** |
| This pack implements assign / confirm / cancel | **NO** |
| This pack modifies Pack17/Pack20/Pack22 runtime | **NO** |
| This pack modifies payments / booking / SOS / wallet / live AI | **NO** |
| This pack modifies Prisma schema | **NO** |
| This pack creates or edits migrations | **NO** |
| This pack runs DB/Prisma/Supabase/SQL commands | **NO** |
| This pack inspects or prints secrets | **NO** |
| This pack authorizes Global Product Full Active Automation claims | **NO** |
| Separate Pack24 implementation authorization required | **YES** |

---

## 15. Still blocked

- Pack23 UI implementation
- Pack23 note input / submit controls
- Pack23 note POST from client
- Status / assign / confirm / cancel UI or API
- Payment / booking / SOS / wallet / live AI integration via request note UI
- Offline queued note writes

---

## 16. Recommendation

| Recommendation | Status |
| --- | --- |
| **A) Safe to open PR** for docs-only Pack23 planning | **YES** — if gate-clean |
| Safe to implement note input UI yet | **NO** — requires Pack24 authorization |
| Safe to call note POST from UI yet | **NO** |
| Next after merge/verify | **Pack24** — separate note input/write UI implementation authorization |

---

**Evidence:** `docs/design/evidence/cursor-pack23-note-input-write-ui-planning/README.md`
