# VIONA Request Engine — Pack25 Note Write UI Hardening and Verification Planning

**Document type:** Note write UI hardening and verification planning (docs-only — no implementation).
**Baseline:** `origin/master @ cbc799d` — `Viona/cursor pack24 first note input write UI implementation (#143)`.
**Related:** `docs/product/VIONA_REQUEST_PACK24_FIRST_NOTE_INPUT_WRITE_UI_IMPLEMENTATION_RESULT.md`, `docs/product/VIONA_REQUEST_PACK23_NOTE_INPUT_WRITE_UI_PLANNING.md`, `docs/product/VIONA_REQUEST_PACK22_READ_ONLY_NOTE_AUDIT_TIMELINE_DISPLAY_RESULT.md`, `docs/product/VIONA_REQUEST_PACK20_FIRST_NARROW_NOTE_ACTION_IMPLEMENTATION_RESULT.md`

---

## 1. Baseline

| Field | Value |
| --- | --- |
| Remote | `origin/master` |
| Commit | `cbc799d` |
| Message | `Viona/cursor pack24 first note input write UI implementation (#143)` |
| Pack15C DB apply | **Green** |
| Pack15D verification | **Green** (PR #133) |
| Pack16 read-only API | **Green** (PR #135) |
| Pack17 live read-only inbox | **Green** (PR #136) |
| Pack20 note action API | **Green** (PR #139) |
| Pack21 note action UI/display planning | **Green** (PR #140) |
| Pack22 read-only note/audit timeline | **Green** (PR #141) |
| Pack23 note input/write UI planning | **Green** (PR #142) |
| Pack24 first note input/write UI | **Green** (PR #143) |
| Pack25 planning authorized | **YES** — Nong Si Buong (planning only) |
| All non-note write/actions | **Blocked** until separate authorization packs |

---

## 2. Operator authorization

| Item | Value |
| --- | --- |
| Operating Protocol read | **YES** |
| Operator authorization present | **YES** |
| Operator | **Nong Si Buong** |
| Authorization scope | Pack25 request note write UI hardening and verification **planning** on current master only |
| Code implementation authorized in this pack | **NO** |
| Pack24 UI modification authorized in this pack | **NO** |
| New write actions authorized in this pack | **NO** |
| Status / assign / confirm / cancel authorized | **NO** |
| Payments / booking / SOS / wallet / live AI changes | **NO** |

**Operator quote (scope lock):**

> I, Nong Si Buong, authorize Pack25 request note write UI hardening and verification planning on current master only. Plan how to harden and verify the now-green Pack24 first user-triggered note input/write UI, including validation, idempotency, duplicate prevention, refresh behavior, audit timeline visibility, error/success copy, rollback, and manual QA. Do not implement code yet, do not add new write actions, do not implement status changes, assign, confirm, cancel, payments/booking/SOS/wallet/live AI, new server/API endpoints, Prisma schema or migration changes, and do not print secrets. Keep all non-note write/actions blocked until separate authorization packs are reviewed, merged, and verified.

---

## 3. Pack25 objective

Pack25 plans how to **harden and verify** the now-green Pack24 first user-triggered note input/write UI before opening any new write/action category. Pack25 does **not** implement code, does **not** modify Pack24 runtime files, and does **not** authorize additional write surfaces.

---

## 4. Current verified foundation

| Layer | State on master @ `cbc799d` |
| --- | --- |
| Pack16 read-only API | **Green** — `GET /api/viona/requests`, `GET /api/viona/requests/:id` |
| Pack17 live inbox/detail | **Green** — live read-only inbox with detail panel |
| Pack20 note action API | **Green** — `POST /api/viona/requests/:id/actions/note` (server only; unchanged by Pack24) |
| Pack22 read-only note/audit timeline | **Green** — `action.note` rows in Notes section from GET `auditEvents[]` |
| Pack24 note input/write UI | **Green** — `VionaRequestNoteInputWrite` below Pack22 timeline; POST via `appendVionaRequestNote` |
| Non-note write/actions | **Blocked** — no status/assign/confirm/cancel UI or client helpers |

### Pack24 implementation inventory (verification baseline)

| Area | Current Pack24 behavior (do not change in Pack25) |
| --- | --- |
| Client POST helper | `appendVionaRequestNote` in `src/services/vionaRequestApi.ts` — `restApiFetchJson` POST to `/api/viona/requests/:id/actions/note` |
| Input component | `VionaRequestNoteInputWrite.tsx` — multiline input, submit button, states |
| Validation | `validateVionaRequestNoteInput` — trim, max 4000, empty/too_long/unsafe (URL-like substrings) |
| Idempotency | Per-submit key in ref; reused on retry; reset on text change and after success |
| Refresh | `refreshDetailAfterNote` in `VionaRequestLiveInboxScreen` re-calls GET detail |
| Timeline | Pack22 `VionaRequestNoteAuditTimelineReadOnly` unchanged above input form |

---

## 5. Validation hardening plan

**Label:** `HARDENING PLAN — NOT IMPLEMENTED IN PACK25`

| Topic | Current Pack24 state | Hardening / verification plan |
| --- | --- | --- |
| Empty note | Client rejects trimmed empty string | Manual QA: submit with empty field; verify disabled submit when `trimmedLength === 0` |
| Whitespace-only | Treated as empty after trim | Manual QA: spaces/newlines only → blocked with “Enter a note before submitting.” |
| Max length | 4000 chars (`VIONA_REQUEST_NOTE_DISPLAY_MAX_LENGTH`) | Verify counter shows `trimmedLength/4000`; block submit at 4001+ with safe copy |
| Unsafe content | Rejects `http://` and `https://` substrings | Manual QA: paste URL-like text → “Note contains unsupported content.”; align with server rules on verify |
| User-facing errors | Mapped reasons only — no raw server body | Verify API errors show generic safe messages; never expose stack traces, tokens, or URLs |
| Secret leakage | Not implemented in UI copy | QA must confirm no JWT, env, or internal host strings in error toasts |
| Server parity | Client max 4000 mirrors Pack20 DTO | Future Pack26 may add contract test doc only if server limit changes — no schema change in Pack25/26 default |

### Validation copy reference (verify unchanged)

| Reason | Expected user copy |
| --- | --- |
| `empty` | Enter a note before submitting. |
| `too_long` | Note must be 4000 characters or fewer. |
| `unsafe` | Note contains unsupported content. |

---

## 6. Idempotency and duplicate prevention plan

**Label:** `HARDENING PLAN — NOT IMPLEMENTED IN PACK25`

| Topic | Current Pack24 state | Hardening / verification plan |
| --- | --- | --- |
| Key generation | `crypto.randomUUID()` or time-random fallback per submit attempt | Verify new key on each distinct submit after success or text edit |
| Retry same attempt | Same key held in `attemptIdempotencyKeyRef` until success or text change | Manual QA: simulate transient API failure → retry → same key sent; expect 201 or 200 |
| Reset on text change | `resetAttemptKey()` on `onChangeText` | Edit note after failed submit → new key on next submit |
| Reset after success | Ref cleared after successful POST | Success path must not reuse prior key for next note |
| 201 new note | Success copy: “Note recorded in audit trail.” | Verify HTTP 201 and non-replay `action.idempotentReplay` |
| 200 idempotent replay | Success copy: “Note already recorded.” | Verify when `status === 200` or `action.idempotentReplay === true` |
| Double-click submit | `submitting` guard returns early | Manual QA: rapid double-tap → single POST in network log |
| Slow network | Submit disabled while in flight | Verify input and button disabled during `submitting` |
| Duplicate timeline rows | Server idempotency + GET refresh | After 200 replay, timeline must show one row for that note content/key |
| Offline queue | Not implemented | Remains out of scope unless separately authorized |

---

## 7. Refresh and audit timeline visibility plan

**Label:** `HARDENING PLAN — NOT IMPLEMENTED IN PACK25`

| Topic | Plan |
| --- | --- |
| GET refresh after success | `onNoteSubmitted()` → `refreshDetailAfterNote` → `loadDetail(selectedId)` |
| Timeline update | Pack22 timeline re-renders from refreshed `auditEvents[]` |
| No optimistic fake row | Pack24 does not inject fake timeline entries — verify absent |
| Avoid duplicate rows | Idempotent replay must not add second `action.note` card for same logical submit |
| Refresh failure | If `onNoteSubmitted()` returns false, show: “Note recorded. Pull to refresh or re-open detail if the timeline does not update.” — must not claim failure of POST |
| Pack22 placement | New note appears in Notes section above input form, not in generic Audit events |
| Generic audit section | `filterNonNoteAuditEvents` excludes `action.note` — verify note not duplicated under “Audit events” |
| Audit visibility | Note row shows event type, message, actor, timestamp per Pack22 display rules |
| List refresh | `refreshDetailAfterNote` also calls `loadList()` — inbox summary stays consistent |

### Refresh verification checklist

| Step | Expected |
| --- | --- |
| 1. Submit valid note | POST 201 |
| 2. GET detail reload | New `action.note` in `auditEvents[]` |
| 3. Notes timeline | Exactly one new card with submitted text (truncated per display rules if long) |
| 4. Audit events section | No duplicate of same note event |
| 5. Request status field | Unchanged from pre-submit value |

---

## 8. Error and success copy plan

**Label:** `COPY VERIFICATION PLAN — NOT IMPLEMENTED IN PACK25`

All copy must **not** imply status change, booking confirmation, payment settlement, SOS dispatch, or global automation.

| Scenario | Expected safe copy |
| --- | --- |
| Empty validation | Enter a note before submitting. |
| Too long validation | Note must be 4000 characters or fewer. |
| Unsafe validation | Note contains unsupported content. |
| Network/API failure (generic) | Unable to record note. Try again. |
| Auth failure (401) | Sign in required to add a note. |
| Not found / no access (404) | Request not found or not accessible. |
| 201 success | Note recorded in audit trail. |
| 200 idempotent replay | Note already recorded. |
| Refresh failed after POST success | Note recorded. Pull to refresh or re-open detail if the timeline does not update. |
| Safety banner (detail) | Audited note action only. Does not change request status, booking, payment, or SOS. |
| Footer (detail) | Note submit only · No status change · Not booking confirmed · SOS guidance only · Other write/actions blocked |

### Copy forbidden in note write UI

- Do not claim status was updated, request was confirmed, or assignee changed.
- Do not claim payment was taken, booking was finalized, or emergency services were contacted.
- Do not show raw server error JSON, status codes in user-visible text, or internal endpoint paths.

---

## 9. Manual QA plan

**Label:** `MANUAL QA — TO BE EXECUTED BEFORE PACK26 OR NEXT WRITE CATEGORY`

| # | Case | Steps | Pass criteria |
| --- | --- | --- | --- |
| 1 | Submit valid note | Enter text → Submit note | 201; success copy; input cleared; timeline shows note after refresh |
| 2 | Empty note blocked | Tap submit with empty input | No POST; validation error; submit disabled when empty |
| 3 | Whitespace-only blocked | Enter spaces/newlines only | No POST; empty validation error |
| 4 | Too-long note blocked | Enter 4001+ chars | No POST; too-long error |
| 5 | Unsafe note blocked | Enter text with `https://` | No POST; unsafe error |
| 6 | Submit during loading disabled | Slow network; tap submit twice | Second tap ignored; single POST |
| 7 | API failure | Mock 500 or offline | Safe error; input preserved; idempotency key retained for retry |
| 8 | Refresh failure after submit | POST succeeds; GET detail fails | Success copy with refresh advisory; no fake timeline row |
| 9 | Retry after transient failure | Fail then succeed with same text | Same idempotency key on retry; note recorded once |
| 10 | Double-click submit | Rapid double-tap | One POST only |
| 11 | 201 new note | First submit of new note | “Note recorded in audit trail.”; one new timeline row |
| 12 | 200 idempotent replay | Retry with same key after success path | “Note already recorded.”; no duplicate timeline row |
| 13 | Timeline shows note after refresh | After 201 | Note visible in Pack22 Notes section |
| 14 | No duplicate in audit section | After submit | Generic Audit events section has no `action.note` duplicate |
| 15 | No status change | Compare status before/after | `request.status` unchanged |
| 16 | No assign/confirm/cancel UI | Inspect detail screen | No buttons or forms for other actions |
| 17 | Auth failure | Unauthenticated or expired JWT | 401 safe message; no side effects |
| 18 | Requester access | Submit as requester on own request | 201/200 per rules |
| 19 | Owner/participant access | Submit as allowed role | 201/200 per Pack20 access scope |
| 20 | Unauthorized access | Submit as non-participant | 404 safe message; no audit event created |

### QA environment notes

- Use non-production sandbox labels already present in Pack17 UI.
- Do not log or screenshot JWT tokens, env files, or internal host URLs.
- Record pass/fail in Pack26 evidence if hardening implementation is authorized.

---

## 10. Rollback plan

| Topic | Plan |
| --- | --- |
| Revert Pack24 UI only | Revert PR #143 / commits touching Pack24 client files listed in Pack24 result doc |
| Pack20 server | **Remains intact** — note POST endpoint unchanged |
| Pack22 timeline | **Remains intact** — read-only display continues from GET detail |
| Pack16 GET APIs | **Unchanged** |
| DB rollback | **Not required** for UI-only revert — notes already written remain in audit table |
| Prisma / migrations | **No rollback** — Pack24 did not change schema |
| Partial rollback | Future Pack26 hardening can be reverted independently if scoped to UI-only files |
| Feature flag (optional future) | `vionaRequestNoteInputEnabled` — planning suggestion only; not implemented in Pack25 |

### Pack24 files to revert if full note write UI removal needed

- `src/components/viona/requests/VionaRequestNoteInputWrite.tsx` (remove)
- `src/services/vionaRequestApi.ts` — remove `appendVionaRequestNote` block only
- `src/components/viona/requests/VionaRequestLiveDetailReadOnly.tsx` — remove input wiring
- `src/screens/viona/VionaRequestLiveInboxScreen.tsx` — remove `refreshDetailAfterNote` / `onNoteSubmitted`
- Restore read-only-only copy in detail/inbox banners

---

## 11. Future Pack26 recommendation

| Recommendation | Detail |
| --- | --- |
| Pack26 authorization | Separate **UI-only hardening implementation** authorization from Nong Si Buong if QA finds gaps |
| Scope | Harden Pack24 note write UI only — validation edge cases, copy tweaks, debounce, accessibility, optional feature flag |
| Exclusions | No new write actions; no status/assign/confirm/cancel; no payment/booking/SOS/wallet/live AI |
| Server | No new endpoints unless separately authorized; Pack20 runtime unchanged by default |
| Data | No Prisma schema or migration changes |
| When to skip Pack26 | If manual QA passes all cases in §9 without gaps — Pack25 verification may be sufficient |
| When Pack26 is needed | Double-submit race, refresh race, copy drift, a11y gaps, or demo-sandbox mock parity issues |

---

## 12. Status flags

| Flag | Value |
| --- | --- |
| `pack16ReadOnlyApiVerified` | `true` |
| `pack17LiveInboxVerified` | `true` |
| `pack20NoteActionApiVerified` | `true` |
| `pack22ReadOnlyNoteAuditTimelineVerified` | `true` |
| `pack24FirstNoteInputWriteUiVerified` | `true` |
| `pack25NoteWriteUiHardeningPlanningAuthorized` | `true` |
| `pack25NoteWriteUiHardeningPlanningPrepared` | `true` |
| `pack25CodeImplemented` | `false` |
| `pack25NewWriteActionsAdded` | `false` |
| `pack25StatusActionImplemented` | `false` |
| `pack25AssignConfirmCancelImplemented` | `false` |
| `pack25NewServerApiEndpointsCreated` | `false` |
| `allNonNoteWriteActionsBlocked` | `true` |

---

## 13. Explicit non-authorization (this planning pack)

| Item | State |
| --- | --- |
| Pack25 implements code | **NO** |
| Pack25 modifies Pack24 UI runtime | **NO** |
| Pack25 adds new write actions | **NO** |
| Pack25 implements status changes | **NO** |
| Pack25 implements assign / confirm / cancel | **NO** |
| Pack25 touches payments / booking / SOS / wallet / live AI | **NO** |
| Pack25 creates new server/API endpoints | **NO** |
| Pack25 modifies Prisma schema | **NO** |
| Pack25 creates or edits migrations | **NO** |
| Pack25 runs DB/Prisma/Supabase/SQL commands | **NO** |
| Pack25 inspects or prints secrets | **NO** |
| Pack25 authorizes Global Product Full Active Automation claims | **NO** |
| Separate Pack26 implementation authorization required for hardening code | **YES** (if gaps found) |

---

## 14. Still blocked

- Pack25 code implementation
- Pack25 Pack24 UI modifications
- Status / assign / confirm / cancel UI or API client helpers
- Payment / booking / SOS / wallet / live AI integration via request note UI
- New server/API endpoints
- Offline queued note writes
- Any write/action category beyond audited note append

---

## 15. Recommendation

| Recommendation | Status |
| --- | --- |
| **A) Safe to open PR** for docs-only Pack25 planning | **YES** — if gate-clean |
| Safe to implement hardening code yet | **NO** — requires separate Pack26 authorization if needed |
| Safe to open new write/action category yet | **NO** |
| Next after merge/verify | Execute §9 manual QA on Pack24; authorize Pack26 only if gaps require UI hardening |

---

**Evidence:** `docs/design/evidence/cursor-pack25-note-write-ui-hardening-verification-planning/README.md`
