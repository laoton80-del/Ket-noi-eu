# Pack32.3 — Marketing Content API Route Wiring (Planning Packet, Docs-Only)

**Operator phrase:** `APPROVE_PACK32_3_MARKETING_CONTENT_ROUTE_PLANNING` — provided this session.
**Status:** Design plan only. **No `.ts`/`.tsx` code written in this packet.**
**Predecessor:** PR #312 (Pack32.1 implementation — `dispatchVionaMarketingContentRequest()`),
PR #313 (Kernel/Handoff sync).
**Baseline:** `origin/master @ 34c0c98`.

---

## 1. Goal

Expose the existing, unmodified Pack32.1 marketing-content dispatcher
(`dispatchVionaMarketingContentRequest()`, `src/services/viona/vionaMarketingContentDispatchService.ts`)
over one new, **Admin/Operator-only** HTTP endpoint, so an authorized human can trigger a
`DRAFT` marketing post from the existing admin tooling instead of only from a future script/console
call. This pack is **API wiring only** — it adds a thin Controller + Route wrapper. It does not
change generation logic, does not add auto-publish, and does not touch any Pack32.1 service file.

---

## 2. RBAC design decision (mandatory boundary #2)

**Decision: mount the new route on the existing `adminRouter` (`src/routes/adminRoutes.ts`), not
on `vionaRouter`.**

Rationale, from the current, verified codebase (see evidence README for full source excerpts):

| Router | Auth chain today | Verdict |
|---|---|---|
| `vionaRouter` (`src/routes/vionaRoutes.ts`) | `authMiddleware` only — any authenticated user, no role check | **Rejected** — does not satisfy "Admin/Operator only, public user absolutely forbidden" |
| `adminRouter` (`src/routes/adminRoutes.ts`) | `authMiddleware` **then** `superAdminMiddleware` (requires `Role.ADMIN` in Prisma) on **every** route under `/api/admin/*`, including all existing marketing endpoints | **Selected** — the only router in this repo that already, structurally, blocks every non-admin caller before any handler runs |

**Endpoint:** `POST /api/admin/marketing/generate-draft` — a deliberate, documented deviation from
the Operator's illustrative example path (`POST /api/viona/marketing/generate-draft`). Nesting
under `/api/admin/marketing/...` (a) reuses the one already-enforced Admin-only middleware chain
in this repo instead of designing a new one, and (b) sits alongside the existing sibling endpoints
(`GET /marketing/posts`, `PUT /marketing/posts/:id`, `POST /marketing/posts/:id/publish`,
`POST /marketing/posts/:id/approve-and-translate`, `DELETE /marketing/posts/:id`) that already
manage the exact same `MarketingPost` rows this new endpoint will create.

**Known gap, documented transparently:** the Operator asked for "Admin/Operator" access. The
Prisma `Role` enum today is `B2C | B2B | B2B_EU | B2B_VN | ADMIN | BROKER` — **there is no
`OPERATOR` value**, and `vionaRequestRoleTenantAccessMatrix.ts` itself documents `'OPERATOR'` as "a
planned ops role — not yet in Prisma Role enum or ServerUserRole." This pack therefore enforces
**`Role.ADMIN` only**, via the existing, unmodified `superAdminMiddleware` — strictly more
restrictive than "Admin **or** Operator," never less. Adding a real `OPERATOR` role is out of
scope for this pack (would require a Prisma schema change, itself out of scope for this pack) and
is recorded here as a candidate for a future, separately-authorized pack if the Operator wants a
distinct, narrower-than-ADMIN ops role.

---

## 3. Endpoint design

### 3.1 Request

```
POST /api/admin/marketing/generate-draft
Authorization: Bearer <JWT of a Role.ADMIN user>
Content-Type: application/json

{
  "topic": "string, required, 1..500 chars",
  "tone": "string, required, 1..100 chars",
  "targetLanguageCode": "string, required, 1..10 chars (ISO-ish language code, e.g. \"vi\", \"cs\", \"de\")"
}
```

### 3.2 Response

**Success — `200`:**

```json
{
  "success": true,
  "data": {
    "marketingPostId": "uuid",
    "content": "the generated draft text",
    "toolName": "marketing_content_generator",
    "confidence": 0.93
  }
}
```

**Failure — envelope matches the existing `jsonFail()` shape (`{ success: false, error: string }`)
used by every other route in this repo:**

| Condition | HTTP status | `error` message (illustrative) |
|---|---|---|
| Missing/invalid `Authorization` header | `401` | `Unauthorized` (unchanged — `authMiddleware`, not touched by this pack) |
| Authenticated but not `Role.ADMIN` | `403` | `Forbidden: super-admin role required` (unchanged — `superAdminMiddleware`, not touched by this pack) |
| `topic` / `tone` / `targetLanguageCode` missing, empty, or wrong type | `400` | `topic, tone, and targetLanguageCode are all required` |
| Dispatch result `ok:false`, `reason: 'invalid_input'` | `400` | `Invalid marketing content generation request` |
| Dispatch result `ok:false`, `reason` ∈ `{'unknown_tool','tool_input_schema_invalid','low_confidence','wrong_tool_category'}` | `422` | `Marketing content generation request could not be classified (<reason>)` |
| Dispatch result `ok:false`, `reason` ∈ `{'llm_call_failed','response_not_valid_json','content_generation_failed'}` | `502` | `Marketing content generation upstream failure (<reason>)` |
| Any unexpected thrown error | `500` | `Internal server error` (never leaks stack/detail — matches every existing controller in this repo) |

`wrong_tool_category` is listed defensively — it should never actually occur for this endpoint
(see §4), but if the Intent Router's classifier were ever to disagree, the endpoint must still
fail closed with a typed `422`, never a `500` or a silent pass-through.

---

## 4. Data flow (mandatory boundary #3)

```
HTTP POST /api/admin/marketing/generate-draft
  │
  ▼
authMiddleware (EXISTING, unmodified) — sets req.authUserId, 401 if missing/invalid JWT
  │
  ▼
superAdminMiddleware (EXISTING, unmodified) — 403 if req.authUserId's Role !== ADMIN
  │
  ▼
NEW controller handler (exact name TBD at implementation time, e.g.
  `postAdminMarketingGenerateDraft` in AdminMarketingController.ts)
  │  1. Parse + validate req.body: topic (string, required), tone (string, required),
  │     targetLanguageCode (string, required). Manual validation, matching the existing
  │     inline-validation style already used by every other function in this same file
  │     (readString-style helpers) rather than introducing a new Zod schema file for one field set.
  │  2. Build a deterministic, templated `userMessage` string from the three validated fields —
  │     e.g. `Draft a ${tone} marketing/social post about "${topic}" in the language identified by
  │     ISO code "${targetLanguageCode}".` — NEVER pass raw, un-templated user input as a
  │     free-form "do anything" prompt; the template's job is only to give the EXISTING,
  │     unmodified Intent Router (`vionaIntentRouter.ts`, Pack32) an unambiguous, on-topic sentence
  │     to classify — it is not a new classification path or a bypass of the classifier.
  │  3. Call `dispatchVionaMarketingContentRequest({ userMessage })` — the EXACT, unmodified
  │     Pack32.1 function, zero new parameters, zero DI overrides in production.
  │
  ▼
dispatchVionaMarketingContentRequest() (EXISTING, unmodified, PR #312)
  │  → routeVionaDispatchIntent() (EXISTING, unmodified, Pack32) — LLM classifies the templated
  │    message; because the template is deterministically marketing-shaped, it is expected to
  │    match `marketing_content_generator` with the `{ topic, tone, targetLanguageCode }` the
  │    Controller supplied — but the classifier's own confidence/schema checks still fully apply
  │    (documented residual non-determinism, see §7).
  │  → generateVionaMarketingContentDraft() (EXISTING, unmodified, Pack32.1) — calls the LLM,
  │    persists exactly one MarketingPost row, status DRAFT.
  │
  ▼
Controller maps the typed result to jsonOk()/jsonFail() (EXISTING helper, unmodified) per §3.2
  │
  ▼
HTTP Response (200 JSON draft, or a typed 4xx/5xx per §3.2)
```

**No new HTTP call to any social-media platform anywhere in this flow.** The only side effect
possible, end-to-end, is exactly what Pack32.1 already guarantees: one `MarketingPost` row with
status `DRAFT`. A human must still separately call the existing, unmodified
`PUT /api/admin/marketing/posts/:id` (edit), `POST /api/admin/marketing/posts/:id/approve-and-translate`,
or `POST /api/admin/marketing/posts/:id/publish` to ever make it public — none of those are touched
by this pack.

---

## 5. Explicit non-modification boundary (mandatory boundary #4)

This plan requires **zero** changes to any file that already implements Pack32.1 core logic.
Verbatim, unmodified at implementation time:

- `src/services/viona/vionaMarketingContentDispatchService.ts`
- `src/services/marketing/AIPostGenerator.ts` (incl. `generateVionaMarketingContentDraft()`)
- `src/lib/viona/dispatcher/vionaToolRegistry.ts`
- `src/lib/viona/dispatcher/vionaIntentRouter.ts`
- `src/middleware/authMiddleware.ts`
- `src/middleware/superAdminMiddleware.ts`
- `src/utils/apiEnvelope.ts` (`jsonOk`/`jsonFail`)

The implementation pack must prove this with a `git diff --stat` / source-scan showing those files
at a 0-line diff — the same Drift Report discipline used in PR #303/#307/#312.

---

## 6. File allowlist (future implementation pack)

| # | File | Change | Purpose |
|---|---|---|---|
| 1 | `src/routes/adminRoutes.ts` | MODIFY (additive — one new route line) | Register `POST /marketing/generate-draft` under the existing, unmodified `authMiddleware` + `superAdminMiddleware` chain |
| 2 | `src/controllers/AdminMarketingController.ts` | MODIFY (additive — one new exported function) | New handler: parse/validate body, build templated `userMessage`, call `dispatchVionaMarketingContentRequest()`, map result to `jsonOk`/`jsonFail` |
| 3 | `scripts/test-viona-pack32-3-marketing-route-wiring.ts` | NEW | Controller-level tests (fake `Request`/`Response`, fake injected dispatch function — mirrors `scripts/test-viona-pack30b-execution-plan-route.ts`'s no-live-HTTP-server pattern) |
| 4 | `docs/internal-ops/VIONA_PACK32_3_MARKETING_ROUTE_PLAN.md` | (this file) | Design plan |
| 5 | `docs/design/evidence/cursor-pack32-3-marketing-content-route-planning-packet/README.md` | NEW (this packet) | Evidence + source excerpts backing §2's RBAC decision |

No Prisma schema change. No new `package.json` dependency (Zod is already a dependency but this
plan deliberately chooses manual, inline validation to match the immediate-neighbor functions in
`AdminMarketingController.ts` — a future implementer may substitute a Zod schema if preferred,
without changing this plan's RBAC/data-flow/non-modification boundaries).

---

## 7. Test plan (for the future implementation pack)

Controller-level (no live HTTP server, fake `Request`/`Response`, injected fake dispatch function
— mirrors the existing `previewVionaExecutionPlanRoute()` controller test style):

1. Missing/invalid `Authorization` → `401` (asserts `authMiddleware` is present on the route chain — not re-testing its internals, which are already covered elsewhere).
2. Authenticated, non-`ADMIN` role → `403` (asserts `superAdminMiddleware` is present on the route chain — ditto).
3. `ADMIN` + valid `{topic, tone, targetLanguageCode}` + fake dispatch returns `ok:true` → `200`, response body exactly `{ marketingPostId, content, toolName, confidence }`.
4. Missing `topic` → `400`, fake dispatch function never called.
5. Missing `tone` → `400`, fake dispatch function never called.
6. Missing `targetLanguageCode` → `400`, fake dispatch function never called.
7. Empty-string `topic` (whitespace-only) → `400`, fake dispatch function never called.
8. Fake dispatch returns `ok:false, reason:'low_confidence'` → `422`.
9. Fake dispatch returns `ok:false, reason:'unknown_tool'` → `422`.
10. Fake dispatch returns `ok:false, reason:'wrong_tool_category'` (defensive path) → `422`.
11. Fake dispatch returns `ok:false, reason:'content_generation_failed'` → `502`.
12. Fake dispatch throws synchronously/asynchronously → `500`, never crashes the process.
13. **Source-scan (CRITICAL):** the new controller function never calls `publishToFacebookPage`/`FacebookGraphAPI`/any social-platform function, and never sets `MarketingPostStatus` to anything other than what `generateVionaMarketingContentDraft()` already defaults to.
14. **Source-scan (CRITICAL):** `git diff`/read of the 7 files listed in §5 shows **zero** line changes.
15. **Regression:** existing Pack32.1 test suite (`test-viona-pack32-1-marketing-content-generator.ts`, 14/14) and Pack32 test suite (13/13) both still pass unmodified — proving this pack's route wrapper introduces no behavior change to the wrapped functions.
16. Full project regression (`npm run typecheck`, `npm run lint`, all existing Pack25–33 test scripts) — 100% PASS required before that future PR may be opened.

---

## 8. Explicit non-authorization boundary

This packet is **planning only**. It does **not**:

- Write, modify, or generate any `.ts`/`.tsx` file.
- Change `adminRoutes.ts`, `AdminMarketingController.ts`, or any Pack32.1 service file.
- Add a Prisma migration, a new `Role` enum value, or a new middleware file.
- Run any test, call any LLM, or write any `MarketingPost` row.
- Authorize implementation. A future, separate operator phrase (e.g.
  `APPROVE_PACK32_3_MARKETING_CONTENT_ROUTE_IMPLEMENTATION`) is required before the file allowlist
  in §6 may be built.

Real execution (Pack30D-4 Twilio POC) remains **BLOCKED**. Automated social-media posting remains
**FORBIDDEN** — this pack does not add, plan, or imply an auto-publish path; every `MarketingPost`
row this future endpoint could ever create still requires the existing, separate, human-operated
`publish` action to become public. Production remains **NOT AUTHORIZED**.
