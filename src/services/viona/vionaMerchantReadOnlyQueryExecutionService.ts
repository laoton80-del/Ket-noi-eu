/**
 * Pack37 — B2B Dispatcher Realization: merchant read-only query execution (Option A MVP — see
 * docs/product/VIONA_PACK37_B2B_DISPATCHER_REALIZATION_PLAN.md §3.3/§3.4).
 *
 * A new, sibling execution path for the 2 Pack34 `'merchant_read_only_query'` tools
 * (`merchant_schedule_availability_check`, `merchant_inventory_stock_check`), called only from
 * `vionaAutonomousDispatchService.ts`'s own new switch cases — never from anywhere else, and never
 * calling back into that file. Structurally cannot reach the Pack31 escrow / Pack30D-4
 * real-provider pipeline: this file never imports `holdVionaRequestExecutionCost`,
 * `executeVionaTwilioTestPocReal`, `settleVionaRequestExecutionHold`, or
 * `previewVionaExecutionPlanRealProviderPocRoute` — the same category-isolation discipline
 * `vionaMarketingContentDispatchService.ts` already established for its own, different tool
 * category.
 *
 * Option A (zero-new-tables MVP, per plan §3.4): no real schedule/inventory table exists yet for
 * either tool, so every call deterministically returns `dataAvailable: false` with an honest,
 * fixed, English summary — never a fabricated answer. A future, separately-scoped increment (plan
 * §3.4 Option B) may add a real, tenant-scoped data source behind this exact same function
 * signature without requiring any change to `vionaAutonomousDispatchService.ts`'s own switch cases.
 *
 * Tenant safety: the persona resolved for reply-phrasing is only ever the persona belonging to a
 * `MerchantProfile` row whose own `tenantId` matches the caller-supplied `tenantId` — a mismatch
 * (or a missing row) resolves to the safe, default persona (`resolveMerchantAiPersona(null)`),
 * never a different tenant's persona (see `executeMerchantReadOnlyQuery`'s own doc comment).
 */

import type { MerchantProfile } from '@prisma/client';

import { findMerchantProfileById } from './vionaMerchantProfileService';
import { resolveMerchantAiPersona } from '../../lib/viona/merchant/vionaMerchantAiPersonaTypes';
import { formatVionaMerchantReadOnlyQueryReply } from '../../lib/viona/merchant/vionaMerchantReadOnlyQueryReplyFormatter';

export type VionaMerchantReadOnlyQueryToolName =
  | 'merchant_schedule_availability_check'
  | 'merchant_inventory_stock_check';

export type VionaMerchantReadOnlyQueryResult = Readonly<{
  toolName: VionaMerchantReadOnlyQueryToolName;
  /** Option A MVP — always `false` today; see module header. Never fabricated. */
  dataAvailable: false;
  /** Deterministic, English, machine-generated ground truth — never LLM-authored. */
  summary: string;
  /** What is actually returned to the caller — persona-phrased (Tier 1 or Tier 2). */
  replyText: string;
  detailJson: Readonly<Record<string, unknown>>;
}>;

export type ExecuteMerchantReadOnlyQueryInput = Readonly<{
  toolName: VionaMerchantReadOnlyQueryToolName;
  tenantId: string;
  merchantProfileId: string;
  toolInput: Readonly<Record<string, unknown>>;
}>;

export type ExecuteMerchantReadOnlyQueryDeps = Readonly<{
  findMerchantProfile?: (id: string) => Promise<MerchantProfile | null>;
  formatReply?: typeof formatVionaMerchantReadOnlyQueryReply;
}>;

function buildMerchantReadOnlyQuerySummary(toolName: VionaMerchantReadOnlyQueryToolName): string {
  switch (toolName) {
    case 'merchant_schedule_availability_check':
      return 'This merchant has not configured real-time schedule data yet.';
    case 'merchant_inventory_stock_check':
      return 'This merchant has not configured real-time inventory data yet.';
    default: {
      // Exhaustiveness guard — `toolName`'s own union type makes this unreachable; kept as a
      // defensive hard stop rather than an unchecked `never` cast, matching this codebase's own
      // convention (see `vionaAutonomousDispatchService.ts`'s `default` switch branch).
      const _exhaustive: never = toolName;
      return _exhaustive;
    }
  }
}

/**
 * Never throws beyond a Prisma call failing (the same contract
 * `previewVionaExecutionPlanRealProviderPocRoute()`'s own case already has — the webhook
 * controller's existing `try/catch` around the whole dispatch call already covers this). A
 * `merchantProfileId` that does not resolve, or that resolves to a *different* tenant than the
 * caller-supplied `tenantId`, never reads that row's persona — it resolves the safe, default
 * persona instead, mirroring `assertVionaRequestTenantMatchesMerchant()`'s own fail-closed spirit.
 */
export async function executeMerchantReadOnlyQuery(
  input: ExecuteMerchantReadOnlyQueryInput,
  deps: ExecuteMerchantReadOnlyQueryDeps = {},
): Promise<VionaMerchantReadOnlyQueryResult> {
  const findMerchantProfile = deps.findMerchantProfile ?? findMerchantProfileById;
  const formatReply = deps.formatReply ?? formatVionaMerchantReadOnlyQueryReply;

  const merchantProfile = await findMerchantProfile(input.merchantProfileId);
  const tenantMatches = merchantProfile != null && merchantProfile.tenantId === input.tenantId;
  const persona = resolveMerchantAiPersona(
    tenantMatches && merchantProfile != null
      ? { aiPersona: merchantProfile.aiPersona, isActive: merchantProfile.isActive }
      : null,
  );

  const summary = buildMerchantReadOnlyQuerySummary(input.toolName);
  const replyText = await formatReply({ toolName: input.toolName, dataAvailable: false, summary }, persona);

  return {
    toolName: input.toolName,
    dataAvailable: false,
    summary,
    replyText,
    detailJson: { toolInput: input.toolInput },
  };
}
