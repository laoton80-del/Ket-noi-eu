# Pack32.3 — Marketing Content API Route Wiring: Implementation Evidence

**Operator phrase:** `APPROVE_PACK32_3_MARKETING_CONTENT_ROUTE_IMPLEMENTATION` — provided this
session.
**Source master:** `5f173fe` — PR #314 merged (Pack32.3 planning packet).
**Branch:** `feat/pack32-3-marketing-route-implementation`
**Plan:** `docs/internal-ops/VIONA_PACK32_3_MARKETING_ROUTE_PLAN.md`

---

## 1. What was built

| # | File | Change | Purpose |
| --- | --- | --- | --- |
| 1 | `src/routes/adminRoutes.ts` | MODIFY (additive, +6 lines) | Registers `POST /marketing/generate-draft` under the existing, unmodified `authMiddleware` + `superAdminMiddleware` chain |
| 2 | `src/controllers/AdminMarketingController.ts` | MODIFY (additive, +85 lines) | New `postAdminMarketingGenerateDraft()` handler — validates request body, builds a templated `userMessage`, calls the existing, unmodified `dispatchVionaMarketingContentRequest()`, maps the result to `jsonOk`/`jsonFail` |
| 3 | `scripts/test-viona-pack32-3-marketing-route-wiring.ts` | NEW | 14/14 PASS |
| 4 | `docs/internal-ops/VIONA_PACK32_3_MARKETING_ROUTE_PLAN.md` | (already merged, PR #314) | Plan document |
| 5 | `docs/design/evidence/cursor-pack32-3-marketing-content-route-implementation/README.md` | NEW | This document |

Exactly matches the plan's §6 5-file allowlist.

---

## 2. Endpoint

`POST /api/admin/marketing/generate-draft` — behind the router-level `authMiddleware` (401 if
missing/invalid JWT) then `superAdminMiddleware` (403 if `req.authUserId`'s `Role !== ADMIN`),
exactly as every other `/api/admin/marketing/*` endpoint.

**Request body:** `{ topic: string, tone: string, targetLanguageCode: string }` — all three
required, non-empty after trim, length-capped (500/100/10 chars respectively).

**Success (200):** `{ success: true, data: { marketingPostId, content, toolName, confidence } }`.

**Failure mapping** (exactly per plan §3.2):

| Condition | Status |
| --- | --- |
| Missing/invalid field | `400` |
| Dispatch `reason: 'invalid_input'` | `400` |
| Dispatch `reason` ∈ `{unknown_tool, tool_input_schema_invalid, low_confidence, wrong_tool_category}` | `422` |
| Dispatch `reason` ∈ `{llm_call_failed, response_not_valid_json, content_generation_failed}` | `502` |
| Unexpected thrown error | `500` |

---

## 3. Zero-modification-kernel proof (mandatory boundary #2)

The 7 files the plan required to stay untouched all show a **0-line diff** vs `origin/master`,
verified both manually and by an automated test (test 14 in the new suite, which runs
`git diff --stat origin/master -- <file>` for each and asserts empty output):

- `src/services/viona/vionaMarketingContentDispatchService.ts`
- `src/services/marketing/AIPostGenerator.ts`
- `src/lib/viona/dispatcher/vionaToolRegistry.ts`
- `src/lib/viona/dispatcher/vionaIntentRouter.ts`
- `src/middleware/authMiddleware.ts`
- `src/middleware/superAdminMiddleware.ts`
- `src/utils/apiEnvelope.ts`

The DTO-to-text transformation (structured `{topic, tone, targetLanguageCode}` → templated
`userMessage` string) lives entirely inside the new `postAdminMarketingGenerateDraft()` controller
function, exactly as the Operator's boundary #2 required.

---

## 4. RBAC proof (mandatory boundary #3)

```6:14:src/routes/adminRoutes.ts
export const adminRouter = Router();

adminRouter.use(authMiddleware);
adminRouter.use(superAdminMiddleware);

adminRouter.get('/tourism-stats', (req, res, next) => {
  void AdminController.getTourismStats(req, res).catch(next);
});
```

The new route is registered further down the same file, after the same two router-level `.use()`
calls — it inherits the identical Admin-only gate as every other admin marketing endpoint. Tests 1
and 2 in the new suite assert (by source position) that both middleware registrations appear
*before* the new route registration in the file.

---

## 5. No-posting proof (mandatory boundary #4)

Test 13 in the new suite scans the new controller function's source body and asserts it contains
none of: `publishToFacebookPage`, `FacebookGraphAPI`, `tiktok` (case-insensitive), or
`MarketingPostStatus.PUBLISHED`. The only side effect possible, end-to-end, is exactly the one
Pack32.1 already guarantees: one `MarketingPost` row with status `DRAFT`.

---

## 6. Test suite (`scripts/test-viona-pack32-3-marketing-route-wiring.ts`) — 14/14 PASS

1–2. Source-scan: `authMiddleware`/`superAdminMiddleware` registered before the new route.
3. Happy path — exact response body shape, templated `userMessage` embeds all 3 fields.
4–7. Missing/whitespace-only required fields → `400`, dispatch never called.
8–10. Classification-rejection reasons (`low_confidence`, `unknown_tool`, `wrong_tool_category`) → `422`.
11. Upstream-failure reason (`content_generation_failed`) → `502`.
12. Injected dispatch throws → `500`, never crashes the process.
13. Source-scan — no Facebook/TikTok/publish reference in the new controller code.
14. Source-scan — 0-line diff on all 7 core files vs `origin/master`.

(Cases 15–16 — full-suite regression and `npm run typecheck`/`npm run lint` — run separately, see
§7 below, matching the established pattern from prior Pack32/Pack33 test scripts.)

---

## 7. Drift Report

| Check | Result |
| --- | --- |
| Files changed | Exactly the 3 code/test files in §1 — matches the plan's §6 allowlist |
| `prisma/schema.prisma` diff | **EMPTY** |
| `package.json` / lockfile diff | **EMPTY** |
| 7 core Pack32.1/middleware files diff | **EMPTY** (verified by `git diff --stat`, both manually and by the automated test) |
| New Facebook/TikTok/social-platform call | **NONE** |
| Auto-publish path added | **NO** |
| Production authorized | **NO** |

## 8. Quality gates

- `npm run typecheck` → 0 errors.
- `npm run lint` → 0 errors (180 pre-existing warnings elsewhere, unchanged; 0 new warnings in touched files).
- Full regression, **100% PASS**: Pack30A (13/13), Pack30B (17/17), Pack30D-1 (12/12), Pack30D-2
  hooks (11/11), Pack30D-4 Twilio POC (13/13), Pack30D-3 timeline (11/11), Pack31 escrow (14/14),
  Pack32 dispatcher (13/13), Pack32.5 (4/4), Pack33 (16/16), Pack32.1 (14/14), **Pack32.3 (14/14 —
  new)**.

Real execution against live (billable) providers remains **BLOCKED**. Automated social-media
posting remains **FORBIDDEN**. Production remains **NOT AUTHORIZED**.
