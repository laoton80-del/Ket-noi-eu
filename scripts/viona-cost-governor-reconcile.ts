/** One-shot bounded Cost Governor reconciliation worker. */
import { disconnectPrisma } from '../src/lib/prisma';
import { CostGovernorService } from '../src/services/ai/CostGovernorService';

function parseLimit(raw: string | undefined): number {
  if (raw === undefined) return 100;
  if (!/^[1-9]\d*$/.test(raw)) throw new Error('limit must be an integer between 1 and 500');
  const limit = Number(raw);
  if (!Number.isSafeInteger(limit) || limit > 500) throw new Error('limit must be an integer between 1 and 500');
  return limit;
}

async function main(): Promise<void> {
  const limit = parseLimit(process.argv[2]);
  try {
    const stats = await new CostGovernorService().reconcileStale(limit);
    console.log(JSON.stringify(stats));
  } finally {
    await disconnectPrisma();
  }
}

void main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : 'unknown error';
  console.error(`Cost Governor reconciliation did not complete: ${message.replace(/postgres(?:ql)?:\/\/[^\s@]+@/gi, 'postgresql://<redacted>@')}`);
  process.exitCode = 1;
});
