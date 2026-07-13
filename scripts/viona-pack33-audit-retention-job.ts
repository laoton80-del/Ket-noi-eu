/**
 * Pack33 — Global Data Retention batch job for `VionaRequestAuditEvent` (see
 * docs/product/VIONA_PACK33_GLOBAL_COMPLIANCE_PLAN.md §4.3).
 *
 * Thin I/O wrapper around the pure decision/transform functions in
 * `src/lib/viona/compliance/vionaAuditRetentionPolicy.ts` — this file owns the only DB read/write
 * in the retention flow; all policy logic stays unit-testable without a live database.
 *
 * SAFE BY DEFAULT: running this script with no arguments performs a **dry run** — it reports which
 * rows *would* be anonymized without writing anything. Pass `--apply` to actually anonymize rows.
 * This script is not wired into any cron/scheduler in this implementation increment (plan §7 item
 * 4: "designed to be safely runnable in dry-run mode") — scheduling it is a separate, future,
 * explicitly-authorized operational step.
 *
 * Run (dry run, default): `npx tsx scripts/viona-pack33-audit-retention-job.ts`
 * Run (apply):            `npx tsx scripts/viona-pack33-audit-retention-job.ts --apply`
 */

import { getPrisma } from '../src/lib/prisma';
import {
  anonymizeVionaAuditEventRow,
  shouldAnonymizeVionaAuditEventRow,
} from '../src/lib/viona/compliance/vionaAuditRetentionPolicy';

const BATCH_SIZE = 200;

async function runVionaPack33AuditRetentionJob(apply: boolean): Promise<void> {
  const prisma = getPrisma();
  const candidates = await prisma.vionaRequestAuditEvent.findMany({
    where: { anonymizedAt: null },
    select: { id: true, message: true, payloadJson: true, retentionRegion: true, createdAt: true },
    take: BATCH_SIZE,
    orderBy: { createdAt: 'asc' },
  });

  let scanned = 0;
  let eligible = 0;
  let anonymized = 0;

  for (const row of candidates) {
    scanned += 1;
    const isEligible = shouldAnonymizeVionaAuditEventRow({
      retentionRegion: row.retentionRegion,
      createdAt: row.createdAt,
      anonymizedAt: null,
    });
    if (!isEligible) continue;
    eligible += 1;

    if (!apply) continue;

    const anonymizedRow = anonymizeVionaAuditEventRow({
      message: row.message,
      payloadJson: row.payloadJson,
      retentionRegion: row.retentionRegion,
    });
    await prisma.vionaRequestAuditEvent.update({
      where: { id: row.id },
      data: {
        message: anonymizedRow.message,
        payloadJson: (anonymizedRow.payloadJson ?? undefined) as never,
        anonymizedAt: anonymizedRow.anonymizedAt,
      },
    });
    anonymized += 1;
  }

  console.log(
    `[pack33-audit-retention-job] mode=${apply ? 'APPLY' : 'DRY_RUN'} scanned=${scanned} eligible=${eligible} anonymized=${anonymized}`,
  );
  if (!apply && eligible > 0) {
    console.log(
      `[pack33-audit-retention-job] ${eligible} row(s) would be anonymized. Re-run with --apply to write changes.`,
    );
  }
}

const apply = process.argv.includes('--apply');
runVionaPack33AuditRetentionJob(apply).catch((error) => {
  console.error('[pack33-audit-retention-job] failed:', error);
  process.exit(1);
});
