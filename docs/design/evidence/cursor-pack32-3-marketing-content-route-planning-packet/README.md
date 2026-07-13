# Pack32.3 — Marketing Content API Route Wiring: Planning Packet Evidence

**Operator phrase:** `APPROVE_PACK32_3_MARKETING_CONTENT_ROUTE_PLANNING` — provided this session.
**Baseline:** `origin/master @ 34c0c98` (PR #313 — Kernel/Handoff sync for Pack33 + Pack32.1, merged).
**Branch:** `docs/pack32-3-marketing-route-planning`
**Plan:** `docs/internal-ops/VIONA_PACK32_3_MARKETING_ROUTE_PLAN.md`

---

## 1. Why this is docs-only

This packet defines the design for a future HTTP route + controller wrapper around the existing,
unmodified `dispatchVionaMarketingContentRequest()` (PR #312). No `.ts`/`.tsx` file was created or
modified to produce this packet.

## 2. Source evidence backing the plan's §2 RBAC decision

**`vionaRouter` — `authMiddleware` only, no role check:**

```6:9:src/routes/vionaRoutes.ts
export const vionaRouter = Router();

vionaRouter.use(authMiddleware);
```

**`adminRouter` — `authMiddleware` then `superAdminMiddleware` on every route:**

```8:11:src/routes/adminRoutes.ts
export const adminRouter = Router();

adminRouter.use(authMiddleware);
adminRouter.use(superAdminMiddleware);
```

**`superAdminMiddleware` — requires `Role.ADMIN` looked up from the real `User` row, 403 otherwise:**

```7:35:src/middleware/superAdminMiddleware.ts
export async function superAdminMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.authUserId;
    if (typeof userId !== 'string' || userId.length === 0) {
      jsonFail(res, 'Unauthorized', 401);
      return;
    }

    const user = await getPrisma().user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (!user || user.role !== Role.ADMIN) {
      jsonFail(res, 'Forbidden: super-admin role required', 403);
      return;
    }

    next();
  } catch {
    jsonFail(res, 'Forbidden', 403);
  }
}
```

**Prisma `Role` enum — confirms no `OPERATOR` value exists yet:**

```14:24:prisma/schema.prisma
enum Role {
  B2C
  B2B
  B2B_EU
  B2B_VN
  ADMIN
  BROKER
}
```

**`vionaRequestRoleTenantAccessMatrix.ts` — confirms `OPERATOR` is documented as planned-but-not-implemented:**

```5:7:src/domain/requests/vionaRequestRoleTenantAccessMatrix.ts
 * OPERATOR is a planned ops role — not yet in Prisma Role enum or ServerUserRole.
```

**Sibling admin marketing routes this new endpoint will sit alongside (unmodified precedent):**

```8:31:src/routes/adminRoutes.ts
adminRouter.get('/marketing/posts', (req, res, next) => {
  void AdminMarketingController.getMarketingPosts(req, res).catch(next);
});

adminRouter.put('/marketing/posts/:id', (req, res, next) => {
  void AdminMarketingController.putMarketingPost(req, res).catch(next);
});

adminRouter.post('/marketing/posts/:id/publish', (req, res, next) => {
  void AdminMarketingController.postMarketingPostPublish(req, res).catch(next);
});

adminRouter.post('/marketing/posts/:id/approve-and-translate', (req, res, next) => {
  void AdminMarketingController.postMarketingApproveAndTranslate(req, res).catch(next);
});

adminRouter.delete('/marketing/posts/:id', (req, res, next) => {
  void AdminMarketingController.deleteMarketingDraft(req, res).catch(next);
});
```

**`dispatchVionaMarketingContentRequest()`'s exact, unmodified input/output shape (PR #312) that
the new controller will call as-is:**

```61:77:src/services/viona/vionaMarketingContentDispatchService.ts
export type DispatchVionaMarketingContentRequestInput = Readonly<{
  /** The natural-language request/intent text the Intent Router must classify. */
  userMessage: string;
}>;

export type VionaMarketingContentDispatchRejectionReason =
  | VionaDispatchRejectionReason
  | 'wrong_tool_category'
  | 'content_generation_failed';

export type DispatchVionaMarketingContentRequestResult =
  | Readonly<{ ok: true; toolName: string; marketingPostId: string; content: string; confidence: number }>
  | Readonly<{ ok: false; reason: VionaMarketingContentDispatchRejectionReason }>
  | Readonly<{ ok: false; reason: 'invalid_input' }>;
```

Note the input is a single `userMessage: string`, not structured `{topic, tone, targetLanguageCode}`
fields — this is why the plan's §4 data flow has the new Controller build a deterministic,
templated `userMessage` from the structured request DTO, rather than requiring any change to this
already-shipped, unmodified function signature.

## 3. Drift Report

| Check | Result |
| --- | --- |
| Files changed by this packet | 2 (`VIONA_PACK32_3_MARKETING_ROUTE_PLAN.md`, this README) |
| `.ts` / `.tsx` files created or modified | **ZERO** |
| `prisma/schema.prisma` diff | **EMPTY** |
| `package.json` / lockfile diff | **EMPTY** |
| Any route/controller registered | **NO** — planning only |
| Any test run | **NO** |
| Real execution / auto-posting / production | **UNCHANGED — all remain BLOCKED / FORBIDDEN / NOT AUTHORIZED** |

## 4. Next step

A future, separate operator phrase (e.g.
`APPROVE_PACK32_3_MARKETING_CONTENT_ROUTE_IMPLEMENTATION`) is required before the 5-file allowlist
in the plan's §6 may be implemented.
