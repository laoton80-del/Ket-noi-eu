# VIONA Request Engine — Pack17 Read-Only Inbox Implementation

**Document type:** Pack17 read-only inbox implementation record (local implementation only — no staging QA, DB writes, status POST, transitions, execution, or deploy in this pack).
**Packet ID:** `CURSOR_PACK17_READ_ONLY_INBOX_IMPLEMENTATION_STAGING_SAFE`
**Packet name:** `VIONA_REQUEST_PACK17_READ_ONLY_INBOX_IMPLEMENTATION`
**Source master:** `origin/master @ 2f21023` (`2f210236d68d052641ed143fa5ece9912d500f70`)
**Status after this pack:** `implemented_local_read_only_inbox`
**Related:** `docs/ai-context/VIONA_OPERATING_PROTOCOL.md`, `docs/product/VIONA_REQUEST_PACK17_READ_ONLY_INBOX_AUTHORIZATION_PACKET.md`, `docs/product/VIONA_REQUEST_PACK16_READ_ONLY_API_STAGING_QA_RESULT.md`

---

## 1. Operator authorization

| Field | Value |
| --- | --- |
| Operator phrase | `APPROVE_PACK17_READ_ONLY_INBOX_IMPLEMENTATION_STAGING_SAFE` |
| Implementation authorized | **YES** — read-only inbox UI/client layer only |
| Staging QA authorized | **NO** — requires `APPROVE_PACK17_READ_ONLY_INBOX_STAGING_QA` |
| DB writes authorized | **NO** |
| status POST authorized | **NO** |
| Transitions authorized | **NO** |
| Execution authorized | **NO** |
| Pack29 authorized | **NO** |
| Deploy/restart authorized | **NO** |
| Staging endpoint calls authorized | **NO** |

---

## 2. Pack16 baseline

| Field | Value |
| --- | --- |
| Pack16 status | `staging_read_only_qa_passed` |
| Pack16 staging QA result | `PASS_READ_ONLY_LIST_AND_DETAIL` |
| Verified read-only endpoints | `GET /api/viona/requests`, `GET /api/viona/requests/:id` |

---

## 3. API endpoints used (GET only)

| Method | Route | Usage |
| --- | --- | --- |
| `GET` | `/api/viona/requests` | Read-only inbox list |
| `GET` | `/api/viona/requests/:id` | Read-only request detail |

No `POST`, `PATCH`, `PUT`, or `DELETE` calls from Pack17 inbox layer.

---

## 4. UI behavior

| Behavior | Implementation |
| --- | --- |
| List read-only | `VionaRequestLiveListReadOnly` — select row to open detail |
| Detail read-only | `VionaRequestLiveDetailReadOnly` — status badge/label, timeline, participants, notes history |
| Loading state | List and detail `ActivityIndicator` |
| Empty state | List empty copy when no visible requests |
| Unauthorized state | HTTP **401** / **403** → sign-in required copy (no token logging) |
| Error state | Safe error copy + retry on list failure |
| Status display | Read-only badge/chip/text only — no action buttons |

---

## 5. Auth/session handling

| Rule | Implementation |
| --- | --- |
| Auth model | Existing REST JWT/session via `restApiFetchJson` + stored JWT |
| Client module | `src/services/vionaRequestReadOnlyApi.ts` (GET delegation only) |
| Token logging | **NO** — no headers, cookies, PINs, or PII in UI/debug output |
| Second auth model | **NO** |

---

## 6. Entry point

| Route | Entry |
| --- | --- |
| `VionaRequestLiveInbox` | Account hub (`CaNhanScreen`) tile — “VIONA requests” read-only |
| Deep link | `viona-requests-live-inbox` |

---

## 7. Files changed (this pack)

| Action | Path |
| --- | --- |
| Created | `src/services/vionaRequestReadOnlyApi.ts` |
| Modified | `src/screens/viona/VionaRequestLiveInboxScreen.tsx` |
| Modified | `src/components/viona/requests/VionaRequestLiveDetailReadOnly.tsx` |
| Modified | `src/components/viona/requests/VionaRequestLiveListReadOnly.tsx` |
| Created | `scripts/viona-pack17-read-only-inbox-check.mjs` |
| Created | `docs/product/VIONA_REQUEST_PACK17_READ_ONLY_INBOX_IMPLEMENTATION.md` |
| Created | `docs/design/evidence/cursor-pack17-read-only-inbox-implementation/README.md` |

---

## 8. Non-authorization (explicit)

| Item | Authorized |
| --- | --- |
| Staging QA | **NO** |
| DB writes | **NO** |
| status POST | **NO** |
| Transitions | **NO** |
| Execution | **NO** |
| Pack29 | **NO** |
| Deploy/restart | **NO** |
| Staging endpoint calls | **NO** |
| Prisma schema/migrations | **NO** |
| `.env*` changes | **NO** |

---

## 9. Future staging QA gate

Pack17 staging QA remains blocked until operator phrase:

`APPROVE_PACK17_READ_ONLY_INBOX_STAGING_QA`

---

## 10. Check script

`node scripts/viona-pack17-read-only-inbox-check.mjs`
