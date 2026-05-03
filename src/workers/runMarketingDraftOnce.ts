/**
 * One-shot CLI / cron container entry: `npm run cron:marketing-draft`
 * (no Express — pay only for this process duration on ephemeral infra).
 */

import 'dotenv/config';

import { flushLogsForShutdown } from '../utils/Logger';
import { runMarketingAutoPosterJob } from './marketingWorker';

void (async () => {
  try {
    const out = await runMarketingAutoPosterJob();
    // eslint-disable-next-line no-console
    console.log(JSON.stringify({ ok: true, draftId: out.draft.id }));
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error(e);
    process.exitCode = 1;
  } finally {
    await flushLogsForShutdown();
  }
})();
