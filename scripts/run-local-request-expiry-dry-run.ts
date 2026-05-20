/**
 * VIONA.LOCAL.REQUEST_EXPIRY_WORKER_DRY_RUN.1
 *
 * Read-only dry-run: lists LocalServiceRequest rows past merchantReviewDeadlineAt
 * in REQUESTED / MERCHANT_REVIEW. Does not mutate DB, wallet, or bookings.
 *
 * Usage:
 *   npx tsx scripts/run-local-request-expiry-dry-run.ts
 *   npx tsx scripts/run-local-request-expiry-dry-run.ts --max-rows 50
 *   npx tsx scripts/run-local-request-expiry-dry-run.ts --request-id <uuid>
 */
import 'dotenv/config';

import { disconnectPrisma, getPrisma } from '../src/lib/prisma';
import { runLocalRequestExpiryDryRun } from '../src/services/local/localRequestExpiryDryRunService';

type Args = Readonly<{
  maxRows: number | undefined;
  requestId: string | null;
}>;

function parseArgs(argv: string[]): Args {
  let maxRows: number | undefined;
  let requestId: string | null = null;

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]!;
    if (arg === '--help' || arg === '-h') {
      console.log(`Usage: npx tsx scripts/run-local-request-expiry-dry-run.ts [options]

  (default)  Dry-run — list eligible Local requests; no writes.

  --max-rows N        Cap rows returned (optional).
  --request-id <uuid> Inspect a single request.

Requires DATABASE_URL.`);
      process.exit(0);
    } else if (arg === '--max-rows') {
      maxRows = Number(argv[++i]);
    } else if (arg.startsWith('--max-rows=')) {
      maxRows = Number(arg.slice('--max-rows='.length));
    } else if (arg === '--request-id') {
      requestId = argv[++i] ?? null;
    } else if (arg.startsWith('--request-id=')) {
      requestId = arg.slice('--request-id='.length);
    }
  }

  return { maxRows, requestId };
}

function requireDatabaseUrl(): void {
  if (!process.env.DATABASE_URL?.trim()) {
    console.error(
      '[local-request-expiry-dry-run] FATAL: DATABASE_URL is not set. Refusing to run.'
    );
    process.exit(1);
  }
}

async function main(): Promise<void> {
  requireDatabaseUrl();

  const args = parseArgs(process.argv.slice(2));
  const result = await runLocalRequestExpiryDryRun(getPrisma(), {
    requestId: args.requestId,
    maxRows: args.maxRows,
  });

  console.log(JSON.stringify(result, null, 2));
}

void main()
  .catch((err) => {
    console.error('[local-request-expiry-dry-run] FATAL:', err);
    process.exitCode = 1;
  })
  .finally(() => disconnectPrisma());
