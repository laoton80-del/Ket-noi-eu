import cron, { type ScheduledTask } from 'node-cron';

import {
  type MarketingDraftCronResult,
  runMarketingAutoPosterJob,
} from '../../workers/marketingWorker';
import { logger } from '../../utils/Logger';

export type { MarketingDraftCronResult };

let autoPosterCron: ScheduledTask | undefined;

/** Minute 0, hours 9 and 18, every day — server local time unless `CRON_TZ` is set. */
const TWICE_DAILY_CRON = '0 9,18 * * *';

/** Manual / admin / test hook — same pipeline as scheduled job (draft in DB only). */
export async function runMarketingDraftCronJob(): Promise<MarketingDraftCronResult> {
  return runMarketingAutoPosterJob();
}

function safeRunJob(slot: 'morning' | 'evening'): void {
  void (async () => {
    try {
      const out = await runMarketingAutoPosterJob();
      logger.info({ draftId: out.draft.id, slot }, '[AutoPoster] AI draft saved');
    } catch (err) {
      logger.error({ err, slot }, '[AutoPoster] Scheduled job failed');
    }
  })();
}

/**
 * Optional in-process cron for the Express monolith. For serverless, disable this (`MARKETING_AUTO_POSTER_ENABLED=0`)
 * and invoke {@link runMarketingAutoPosterJob} from a scheduled worker / `npm run cron:marketing-draft`.
 */
export function startMarketingAutoPoster(): void {
  if (autoPosterCron) {
    logger.warn('[AutoPoster] Already started — skip duplicate start');
    return;
  }

  const tz = process.env.CRON_TZ?.trim();
  autoPosterCron = cron.schedule(
    TWICE_DAILY_CRON,
    () => {
      const h = new Date().getHours();
      const slot = h === 9 ? 'morning' : 'evening';
      safeRunJob(slot);
    },
    tz && tz.length > 0 ? { timezone: tz } : {}
  );

  logger.info(
    { cron: TWICE_DAILY_CRON, tz: tz ?? null },
    '[AutoPoster] Cron registered — draft-only (no Facebook); use marketingWorker for serverless'
  );
}

export function stopMarketingAutoPoster(): void {
  autoPosterCron?.stop();
  autoPosterCron = undefined;
}
