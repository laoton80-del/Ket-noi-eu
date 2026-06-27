# VIONA Request Engine — Pack25 Read-Only Status / Timeline Visibility Planning

**Document type:** Read-only visibility planning (docs-only — no implementation, deploy, live QA, or data mutation in this pack).
**Packet ID:** `CURSOR_PACK25_READ_ONLY_STATUS_TIMELINE_VISIBILITY_PLANNING_DOCS_ONLY`
**Baseline:** `origin/master @ 93842ec` — `docs(pack25): close status action gate and plan next scope (#168)`.
**Related:** `docs/product/VIONA_REQUEST_PACK25_STATUS_ACTION_GATE_CLOSURE_NEXT_SCOPE_PLANNING.md`, `docs/product/VIONA_REQUEST_PACK25_STATUS_ACTION_IDEMPOTENCY_REPLAY_LIVE_QA_PASS_EVIDENCE.md`, `src/services/viona/vionaRequestReadDto.ts`, `src/components/viona/requests/VionaRequestLiveDetailReadOnly.tsx`, `src/components/viona/requests/VionaRequestStatusBadge.tsx`

---

## 1. Planning summary

| Field | Value |
| --- | --- |
| Operating Protocol read | **YES** |
| Docs-only planning pack | **YES** |
| Current verified master | **`93842ec`** |
| Previous gate status | Pack25 status action / idempotency replay **CLOSED / GREEN** |
| This packet authorizes implementation | **NO** |
| This packet authorizes deploy | **NO** |
| This packet authorizes live QA | **NO** |
| This packet authorizes DB/data work | **NO** |
| This packet authorizes Pack26 | **NO** |
| Pack26 opened | **NO** |

**This packet plans** the safest next scope after Pack25 gate closure: **read-only request status and timeline visibility**. It does **not** authorize code, UI changes, deploy, live QA, new write actions, new transitions, or Pack26.

---

## 2. Prior gate reference (closure record)

| Outcome | Status |
| --- | --- |
| Pack25 status action API | **GREEN** |
| First transition | **201** — `submitted` → `triage` |
| Same-key replay | **200** — `idempotentReplay: true` |
| Duplicate status/audit events | **NO** |
| Note count | **0** |
| Legacy row modified | **NO** |
| Gate closure on master | **GREEN** — PR #168 @ `93842ec` |

**Closure recommendation carried forward:** proceed with read-only status/timeline visibility before any new write surface.

---

## 3. Recommended product scope (read-only only)

| Item | In scope | Out of scope |
| --- | --- | --- |
| Request detail status badge visibility | **YES** — show current `request.status` with safe labels | Status action buttons |
| Timeline / activity visibility | **YES** — unified read-only view of existing events | New write actions |
| Surface `action.status` audit events | **YES** — from existing `auditEvents` | New status transitions |
| Surface `action.note` audit events | **YES** — where already returned by detail API | Note submit expansion beyond current authorized lane |
| Owner / auth visibility boundaries | **Preserve** — same as `GET /api/viona/requests/:id` | Cross-tenant leakage |
| Existing route/API behavior | **Preserve** — no new endpoints in default plan | Backend changes unless separate read-only exposure packet |
| Status transition rules | **Preserve** — no new transitions | assign / confirm / cancel |
| Production / operational claims | **NO** fake claims | payment / booking / SOS / wallet / live AI |

**Copy guidance (neutral):** use labels such as **Status**, **Timeline**, **Activity**, **Updated**. Do not imply staff action, booking confirmation, payment capture, emergency dispatch, or production fulfillment.

---

## 4. Current master baseline (planning inventory — not changed in this pack)

| Layer | Finding |
| --- | --- |
| Detail API | `GET /api/viona/requests/:id` already returns `request`, `statusEvents`, `auditEvents`, `safety` read-only envelope |
| DTO | `VionaRequestDetailDto` includes `statusEvents[]` and `auditEvents[]` with `eventType`, `message`, `payloadJson`, timestamps |
| Live inbox UI | `VionaRequestLiveDetailReadOnly` renders raw status in meta line, separate **Status events**, **Notes**, and **Audit events** sections |
| Preview UI | `VionaRequestDetailReadOnly` + `VionaRequestStatusBadge` exist for mock/preview records — not wired to live REST detail |
| Note timeline helper | `mapVionaRequestNoteAuditTimelineItems` already maps `action.note` audit rows |

**Gap hypothesis (UI-only):** live detail lacks a prominent status badge, friendly `submitted` / `triage` labels, and a merged **Timeline / Activity** presentation for `statusEvents` plus non-note audit events (including `action.status`). Data is largely already available from GET detail.

---

## 5. Recommended implementation shape (future separate authorization)

| Principle | Recommendation |
| --- | --- |
| Reuse existing detail DTO | Prefer rendering fields already returned by `GET .../requests/:id` |
| Backend change default | **Avoid** — if current detail payload is sufficient, UI-only |
| Backend exception | If `action.status` payload fields are insufficient for safe read-only labels, open a **separate backend read-only exposure packet** — not bundled with UI |
| Size / reversibility | Small, isolated UI diff; easy rollback |
| Empty states | Safe copy when no status events / no activity — e.g. “No activity recorded yet.” |
| Write controls | **Do not add** status buttons, assign, confirm, cancel, or other deferred actions |
| Tests | Existing `tsc`, `smoke`, forbidden-claims must pass; add UI tests only if meaningful |

**Candidate touch points (planning only):**

- `src/components/viona/requests/VionaRequestLiveDetailReadOnly.tsx` — badge + timeline presentation
- Optional shared read-only display helpers under `src/components/viona/requests/` — no API writes
- Reuse `VionaRequestStatusBadge` or extend safe label mapping from `request.display.statusLabel` where applicable

---

## 6. Recommended acceptance criteria (future implementation authorization)

| # | Criterion |
| --- | --- |
| AC1 | Detail view shows **current request status** with clear, safe label (including `submitted` and `triage`) |
| AC2 | Detail view shows **timeline/activity** from existing status events and audit events |
| AC3 | Existing **`action.status`** rows are visible in timeline/activity (not hidden behind raw debug-only layout) |
| AC4 | Existing **`action.note`** rows remain visible where already supported |
| AC5 | **Empty timeline** state is neutral and non-misleading |
| AC6 | **No mutation controls** added (no status POST UI, no assign/confirm/cancel) |
| AC7 | **No new endpoint writes** added |
| AC8 | **No DB / schema / migration** changes in default UI-only path |
| AC9 | Owner/auth visibility unchanged — unauthorized users still cannot read out-of-scope rows |
| AC10 | Existing checks pass: `npx tsc --noEmit`, `npm run smoke`, forbidden-claims |

---

## 7. Explicitly deferred

| Category | Defer until |
| --- | --- |
| Status action UI buttons | Separate operator authorization |
| Assign / confirm / cancel | Deferred action categories |
| New request action categories | Separate packets |
| Payment / booking / SOS / wallet / live AI | Unchanged deferred boundary |
| Fresh end-to-end scoped row | Operator explicitly asks |
| Pack26 | Real defect or separate operator decision — **not opened** |

---

## 8. Decision recommendation

| Decision | Recommendation |
| --- | --- |
| Next scope | **Read-only status / timeline visibility** (this planning packet) |
| Proceed to implementation | **NOT in this packet** — requires separate explicit authorization |
| Default implementation path | **UI-only** rendering of existing GET detail fields |
| Backend changes | Only if separate read-only exposure gap is proven |
| Deploy / live QA | Separate authorization after implementation |

**Suggested operator authorization phrase (future):** staging-only, read-only UI visibility for existing request detail status badge and timeline/activity; no new write actions, transitions, backend schema changes, or Pack26.

---

## 9. Safety attestations (this docs pack)

| Check | Result |
| --- | --- |
| Code changed | **NO** |
| UI changed | **NO** |
| Deploy / Fly restart | **NO** |
| Live QA run | **NO** |
| Staging endpoint called | **NO** |
| Authentication performed | **NO** |
| Staging data mutated | **NO** |
| Request rows created/seeded/reset/rollback | **NO** |
| DB/Prisma/Supabase/SQL commands run | **NO** |
| Secrets/JWT/PIN/Auth headers/database URLs printed | **NO** |
| `.env*` changed | **NO** |
| Prisma schema/migrations changed | **NO** |
| Notes submitted | **NO** |
| New write actions added | **NO** |
| New transitions added | **NO** |
| Assign/confirm/cancel touched | **NO** |
| Payment/booking/SOS/wallet/live AI touched | **NO** |
| Pack26 opened | **NO** |

---

## 10. Next recommended step

1. **Merge this planning packet** and post-merge verify on master.
2. **Operator review:** if approved, authorize a separate **read-only status/timeline visibility implementation** packet scoped to UI-only changes unless a proven API read gap requires a backend read-only exposure packet.
3. **Do not** add status write UI, new transitions, or Pack26 without explicit authorization.

Pack26 remains **not opened**.
