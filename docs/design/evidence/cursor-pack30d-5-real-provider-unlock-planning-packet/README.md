# Pack30D-5 — Real-Provider Execution Unlock & Circuit Breaker: Planning Packet Evidence

**Operator phrase:** `APPROVE_PACK30D_5_REAL_PROVIDER_UNLOCK_PLANNING` — provided this session.
**Baseline:** `origin/master @ c0144f0` (PR #318 — Pack32 closure Kernel sync, merged).
**Branch:** `docs/pack30d-5-real-provider-planning`
**Plan:** `docs/internal-ops/VIONA_PACK30D_5_REAL_PROVIDER_PLAN.md`

---

## 1. Why this is docs-only

This packet defines the design for a future Circuit Breaker module and a future, symmetric
OpenAI real-execution adapter. No `.ts`/`.tsx`/`.prisma` file was created or modified to produce
this packet.

## 2. Source evidence backing the plan's naming correction (§0) and survey (§2)

**The actual flag — not `isRealExecutionAuthorized` — with its production hard-block:**

```14:35:src/lib/viona/realProviderAdapter/vionaRealProviderExecutionFlag.ts
export const VIONA_REAL_PROVIDER_EXECUTION_ENV_FLAG = 'PACK30_REAL_PROVIDER_EXECUTION_ENABLED';

export function isProductionEnvironment(env = process.env): boolean {
  try {
    return env.NODE_ENV === 'production';
  } catch {
    return true; // fail-closed → treat as production
  }
}

export function isRealProviderExecutionEnabled(env = process.env): boolean {
  try {
    if (isProductionEnvironment(env)) {
      return false;
    }
    return env[VIONA_REAL_PROVIDER_EXECUTION_ENV_FLAG] === 'true';
  } catch {
    return false;
  }
}
```

**Twilio adapter's existing blocked-path shape (the exact pattern the new breaker branch
mirrors):**

```308:325:src/lib/viona/realProviderAdapter/vionaTwilioTestRealProviderAdapter.ts
export async function executeVionaTwilioTestPocReal(
  input: ExecuteVionaTwilioTestPocInput,
  deps: ExecuteVionaTwilioTestPocDeps = {},
): Promise<VionaTwilioRealExecutionResult> {
  const isEnabled = deps.isEnabled ?? isRealProviderExecutionEnabled;
  const auditWriter = deps.auditWriter ?? appendVionaExecutionAuditEvent;

  if (!isEnabled()) {
    const outcome: VionaTwilioRealExecutionOutcome = { outcome: 'blockedOperator', reason: 'flag_disabled' };
    const auditWritten = await writeOutcomeAudit(input, 'executionBlockedOperator', outcome, auditWriter);
    return { requestId: input.requestId, actionId: input.actionId, outcome, auditWritten };
  }
```

**No circuit breaker exists anywhere in the repo today** (grep-verified, zero matches for
`circuitBreaker`/`circuit_breaker` outside this new plan's own text).

**Existing AI cost-guard modules are fixture/dry-run only — never wired to a live counter:**

```4:11:src/core/aiEnforcement/aiAutoPausePolicy.ts
export const DEFAULT_AI_AUTO_PAUSE_POLICY: AiAutoPausePolicy = Object.freeze({
  mode: 'dryRun',
  allowProductionEnforcement: false,
  requireHumanApprovalForPause: true,
  requireAuditLog: true,
  requireAdminNotification: true,
});
```

**OpenAI's `createRoutedChatCompletion()` — no flag, no production block, no cost cap
(confirms §0's Twilio-vs-OpenAI asymmetry):**

```85:97:src/services/ai/AIRouterService.ts
export async function createRoutedChatCompletion(input) {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is not configured');
  }
  const model = resolveRoutedModel(input.taskType);
  const client = new OpenAI({ apiKey });
  const completion = await client.chat.completions.create({ ...input.params, model });
  ...
}
```

**No Redis dependency (confirms §8's rejection rationale):**

```bash
$ grep -ri "\"redis\"\|\"ioredis\"" package.json
# (no output — not present)
```

**`LlmApiUsageLog` schema — has no cost field, confirming the plan's "derive USD via a documented
rate table" design rather than assuming a ready-made cost column:**

```774:788:prisma/schema.prisma
model LlmApiUsageLog {
  id               String            @id @default(uuid())
  taskType         LlmRouterTaskType
  model            String
  promptTokens     Int?
  completionTokens Int?
  totalTokens      Int?
  createdAt        DateTime          @default(now())
  userId           String?
  ...
}
```

**Pack31 escrow — confirmed per-request only, no daily/aggregate budget:**

```327:327:src/services/viona/vionaExecutionPlanRouteService.ts
export const VIONA_TWILIO_TEST_POC_ESTIMATED_COST_VIO = 0.01;
```

**The already-named, still-ungranted Pack30D-2 staging QA phrase this plan reuses in §5 step 5
(not inventing a competing name):** recorded in
`docs/ai-context/VIONA_KERNEL_HANDOFF_FAST_SAFE_GLOBAL_MODE.md` — `APPROVE_PACK30D_REAL_PROVIDER_EXECUTION_STAGING_QA`,
required YES / provided NO / recorded NO.

## 3. Drift Report

| Check | Result |
| --- | --- |
| Files changed by this packet | 2 (`VIONA_PACK30D_5_REAL_PROVIDER_PLAN.md`, this README) |
| `.ts` / `.tsx` / `.prisma` files created or modified | **ZERO** |
| `PACK30_REAL_PROVIDER_EXECUTION_ENABLED` (or any new flag) flipped | **NO** |
| New Prisma migration | **NO** |
| New dependency (Redis or otherwise) | **NO** |
| Real execution / auto-posting / production | **UNCHANGED — all remain BLOCKED / FORBIDDEN / NOT AUTHORIZED** |

## 4. Next step

A future, separate operator phrase (candidate: `APPROVE_PACK30D_5_REAL_PROVIDER_UNLOCK_IMPLEMENTATION`)
is required before the 9-file allowlist in the plan's §6 may be built. Staging QA remains gated by
the already-named, still-ungranted `APPROVE_PACK30D_REAL_PROVIDER_EXECUTION_STAGING_QA` phrase.
Production remains a categorically separate, unnamed, far-future gate.
