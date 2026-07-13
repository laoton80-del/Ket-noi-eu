/**
 * Pack30D-5 — Read-only Circuit Breaker spend-window query (see
 * docs/internal-ops/VIONA_PACK30D_5_REAL_PROVIDER_PLAN.md §3.2). Aggregates over the existing,
 * unmodified `VionaRequestAuditEvent` table only — **no new table, no migration, no Redis**.
 * This module never writes anything; it only counts rows that the existing Twilio adapter
 * (`vionaTwilioTestRealProviderAdapter.ts`, Pack30D-4) already writes via
 * `appendVionaExecutionAuditEvent()`.
 *
 * Cost note: Twilio Test Credentials are documented by Twilio to never incur real cost — so
 * `VIONA_TWILIO_REAL_EXECUTION_ILLUSTRATIVE_COST_USD_CENTS_PER_CALL` below is an explicitly
 * illustrative, not-a-real-invoice-number constant (same disclaimer pattern already used
 * elsewhere in this repo, e.g. Pack33's retention-policy windows). It exists so the Circuit
 * Breaker's daily-cap mechanism is exercised meaningfully by count today, ahead of any future,
 * separately authorized real-cost provider joining this same breaker.
 *
 * The OpenAI-side query below (`queryVionaOpenAiRealExecutionSpendWindow`) counts **only**
 * `LlmApiUsageLog` rows tagged with the new, dedicated `VIONA_REAL_EXECUTION_CONTENT` task type —
 * this is the isolation boundary required by
 * docs/internal-ops/VIONA_PACK30D_5_REAL_PROVIDER_PLAN.md §3.2/§7 test 5, keeping this breaker from
 * ever counting (or being affected by) unrelated, already-live OpenAI features (chat,
 * translation, marketing drafts, legal scan). `VIONA_REAL_EXECUTION_CONTENT` is never written by
 * any existing call site today — only the new, unwired `vionaOpenAiRealProviderAdapter.ts` would
 * ever write it, and that adapter is not called by anything in this pack.
 */

import { LlmRouterTaskType } from '@prisma/client';

import { getPrisma } from '../../lib/prisma';
import type {
  VionaProviderCircuitBreakerProvider,
  VionaProviderSpendWindow,
} from '../../lib/viona/circuitBreaker/vionaProviderSpendCircuitBreaker';

/** Minimal Prisma surface this query depends on — enables dependency injection in unit tests. */
export type VionaProviderSpendWindowQueryPrismaClient = Readonly<{
  vionaRequestAuditEvent: Readonly<{
    count: (args: {
      where: { eventType: { in: readonly string[] }; createdAt: { gte: Date } };
    }) => Promise<number>;
  }>;
}>;

/**
 * The 3 Twilio real-execution event types Pack30D-4 already writes on every attempt. Never
 * includes Pack30A/30B mock-only preview event types (`executionMockInvoked`,
 * `executionPlanBuilt`) or any blocked-path event type — this breaker counts real-provider
 * attempts and outcomes only, not mock traffic or pre-flight denials.
 */
export const VIONA_TWILIO_REAL_EXECUTION_EVENT_TYPES = [
  'executionRealAttempted',
  'executionRealSucceeded',
  'executionRealFailedBounded',
] as const;

export const VIONA_TWILIO_REAL_EXECUTION_ILLUSTRATIVE_COST_USD_CENTS_PER_CALL = 1;

/** Pure — no I/O. Computes the UTC calendar-day window containing `nowMs`. */
export function computeVionaProviderSpendUtcDayWindow(
  nowMs: number,
): Readonly<{ windowStartIso: string; windowEndIso: string; windowStart: Date }> {
  const now = new Date(nowMs);
  const windowStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const windowEnd = new Date(windowStart.getTime() + 24 * 60 * 60 * 1000);
  return {
    windowStartIso: windowStart.toISOString(),
    windowEndIso: windowEnd.toISOString(),
    windowStart,
  };
}

export type QueryVionaTwilioSpendWindowDeps = Readonly<{
  prismaClient?: VionaProviderSpendWindowQueryPrismaClient;
  nowMs?: () => number;
}>;

/**
 * Counts Twilio real-execution attempts recorded in the existing audit ledger since the start of
 * the current UTC day, and converts that count into an estimated USD-cent spend for the Circuit
 * Breaker to compare against the admin-configured cap (`readVionaProviderSpendCapUsdCentsFromEnv`).
 * Read-only — never writes, never touches any other provider's rows.
 */
export async function queryVionaTwilioSpendWindow(
  deps: QueryVionaTwilioSpendWindowDeps = {},
): Promise<VionaProviderSpendWindow> {
  const prismaClient = deps.prismaClient ?? (getPrisma() as unknown as VionaProviderSpendWindowQueryPrismaClient);
  const nowMs = deps.nowMs ?? (() => Date.now());
  const { windowStartIso, windowEndIso, windowStart } = computeVionaProviderSpendUtcDayWindow(nowMs());

  const callCount = await prismaClient.vionaRequestAuditEvent.count({
    where: {
      eventType: { in: VIONA_TWILIO_REAL_EXECUTION_EVENT_TYPES },
      createdAt: { gte: windowStart },
    },
  });

  const provider: VionaProviderCircuitBreakerProvider = 'twilio';
  return {
    provider,
    windowStartIso,
    windowEndIso,
    callCount,
    estimatedSpendUsdCents: callCount * VIONA_TWILIO_REAL_EXECUTION_ILLUSTRATIVE_COST_USD_CENTS_PER_CALL,
  };
}

/** Minimal Prisma surface for the OpenAI-side window query — DI-friendly, mirrors the Twilio one. */
export type VionaOpenAiSpendWindowQueryPrismaClient = Readonly<{
  llmApiUsageLog: Readonly<{
    aggregate: (args: {
      where: { taskType: LlmRouterTaskType; createdAt: { gte: Date } };
      _sum: { totalTokens: true };
      _count: { _all: true };
    }) => Promise<{ _sum: { totalTokens: number | null }; _count: { _all: number } }>;
  }>;
}>;

/**
 * Illustrative, not-a-real-invoice USD-cents-per-1000-tokens rate table, keyed by the exact model
 * string `resolveRoutedModel()` (`AIRouterService.ts`) would assign to `VIONA_REAL_EXECUTION_CONTENT`
 * today (`gpt-4o-mini`, per its `default`/fast-tier branch — see that file's routing switch).
 * Any model string not in this table falls back to the more expensive of the two known rates
 * (fail-closed toward *overestimating* spend, never underestimating it).
 */
export const VIONA_OPENAI_ILLUSTRATIVE_USD_CENTS_PER_1000_TOKENS: Readonly<Record<string, number>> = {
  'gpt-4o-mini': 0.06,
  'gpt-4o': 1.0,
};

const VIONA_OPENAI_FALLBACK_USD_CENTS_PER_1000_TOKENS = Math.max(
  ...Object.values(VIONA_OPENAI_ILLUSTRATIVE_USD_CENTS_PER_1000_TOKENS),
);

export type QueryVionaOpenAiRealExecutionSpendWindowDeps = Readonly<{
  prismaClient?: VionaOpenAiSpendWindowQueryPrismaClient;
  nowMs?: () => number;
}>;

/**
 * Counts only `VIONA_REAL_EXECUTION_CONTENT`-tagged `LlmApiUsageLog` rows since the start of the
 * current UTC day and converts summed `totalTokens` into an estimated USD-cent spend. Read-only —
 * never writes, never touches any other `taskType`'s rows.
 */
export async function queryVionaOpenAiRealExecutionSpendWindow(
  deps: QueryVionaOpenAiRealExecutionSpendWindowDeps = {},
): Promise<VionaProviderSpendWindow> {
  const prismaClient = deps.prismaClient ?? (getPrisma() as unknown as VionaOpenAiSpendWindowQueryPrismaClient);
  const nowMs = deps.nowMs ?? (() => Date.now());
  const { windowStartIso, windowEndIso, windowStart } = computeVionaProviderSpendUtcDayWindow(nowMs());

  const aggregate = await prismaClient.llmApiUsageLog.aggregate({
    where: {
      taskType: LlmRouterTaskType.VIONA_REAL_EXECUTION_CONTENT,
      createdAt: { gte: windowStart },
    },
    _sum: { totalTokens: true },
    _count: { _all: true },
  });

  const totalTokens = aggregate._sum.totalTokens ?? 0;
  const ratePerThousand =
    VIONA_OPENAI_ILLUSTRATIVE_USD_CENTS_PER_1000_TOKENS['gpt-4o-mini'] ??
    VIONA_OPENAI_FALLBACK_USD_CENTS_PER_1000_TOKENS;

  const provider: VionaProviderCircuitBreakerProvider = 'openai';
  return {
    provider,
    windowStartIso,
    windowEndIso,
    callCount: aggregate._count._all,
    estimatedSpendUsdCents: Math.ceil((totalTokens / 1000) * ratePerThousand),
  };
}
