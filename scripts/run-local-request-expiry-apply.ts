/**
 * VIONA.LOCAL.REQUEST_EXPIRY_WORKER_APPLY_NO_WALLET.1
 *
 * Applies merchant-review timeout expiry on eligible LocalServiceRequest rows.
 * REQUEST_ONLY_NO_CHARGE / walletPhase NONE only — no wallet or booking side effects.
 *
 * Usage:
 *   VIONA_ALLOW_LOCAL_EXPIRY_APPLY=true npx tsx scripts/run-local-request-expiry-apply.ts
 *   VIONA_ALLOW_LOCAL_EXPIRY_APPLY=true npx tsx scripts/run-local-request-expiry-apply.ts --max-rows 50
 *   VIONA_ALLOW_LOCAL_EXPIRY_APPLY=true npx tsx scripts/run-local-request-expiry-apply.ts --request-id <uuid>
 */
import 'dotenv/config';

import { disconnectPrisma, getPrisma } from '../src/lib/prisma';
import { applyLocalRequestExpiry } from '../src/services/local/localRequestExpiryApplyService';

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
      console.log(`Usage: VIONA_ALLOW_LOCAL_EXPIRY_APPLY=true npx tsx scripts/run-local-request-expiry-apply.ts [options]

  Applies expiry on eligible Local requests (status + deadline + wallet guards).

  --max-rows N        Cap candidates processed per run (optional).
  --request-id <uuid> Apply to a single request if eligible.

Requires:
  DATABASE_URL
  VIONA_ALLOW_LOCAL_EXPIRY_APPLY=true`);
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
      '[local-request-expiry-apply] FATAL: DATABASE_URL is not set. Refusing to run.'
    );
    process.exit(1);
  }
}

function requireApplyGuard(): void {
  if (process.env.VIONA_ALLOW_LOCAL_EXPIRY_APPLY?.trim() !== 'true') {
    console.error(
      '[local-request-expiry-apply] FATAL: Refusing to apply expiry mutations. ' +
        'Set VIONA_ALLOW_LOCAL_EXPIRY_APPLY=true to acknowledge intentional apply.'
    );
    process.exit(1);
  }
}

async function main(): Promise<void> {
  requireDatabaseUrl();
  requireApplyGuard();

  const args = parseArgs(process.argv.slice(2));
  const result = await applyLocalRequestExpiry(getPrisma(), {
    requestId: args.requestId,
    maxRows: args.maxRows,
  });

  console.log(JSON.stringify(result, null, 2));
}

void main()
  .catch((err) => {
    console.error('[local-request-expiry-apply] FATAL:', err);
    process.exitCode = 1;
  })
  .finally(() => disconnectPrisma());
