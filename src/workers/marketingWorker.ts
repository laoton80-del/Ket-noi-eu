/**
 * Stateless marketing draft job — safe to invoke from **Vercel Cron**, **Cloudflare Workers** (scheduled),
 * or any serverless HTTP trigger. Requires `DATABASE_URL`, OpenAI keys, and Prisma reachability.
 *
 * **Vercel** (`api/cron/marketing-draft.ts` example):
 * ```ts
 * import { runMarketingAutoPosterJob } from '../src/workers/marketingWorker';
 * export default async function handler() {
 *   await runMarketingAutoPosterJob();
 *   return new Response('ok');
 * }
 * ```
 *
 * **Cloudflare**: call the same function from a Worker `scheduled` handler after bundling Prisma/OpenAI
 * (often easier to HTTP-call your Node API `POST /api/admin/trigger-auto-post` with a shared secret).
 */

import {
  type MarketingDailyStats,
  createMarketingDraftFromOpenAI,
} from '../services/marketing/AIPostGenerator';
import { logger } from '../utils/Logger';

export type MarketingDraftCronResult = Readonly<{
  readonly stats: MarketingDailyStats;
  readonly draft: Readonly<{
    readonly id: string;
    readonly content: string;
    readonly status: 'DRAFT';
    readonly createdAt: string;
  }>;
}>;

/**
 * AI Auto-Poster: stats → OpenAI → persist `MarketingPost` as **DRAFT only** (never Facebook).
 */
export async function runMarketingAutoPosterJob(): Promise<MarketingDraftCronResult> {
  const { draft, stats } = await createMarketingDraftFromOpenAI();
  const out: MarketingDraftCronResult = {
    stats,
    draft: {
      id: draft.id,
      content: draft.content,
      status: 'DRAFT',
      createdAt: draft.createdAt.toISOString(),
    },
  };
  logger.info({ draftId: out.draft.id }, '[marketingWorker] draft saved');
  return out;
}
