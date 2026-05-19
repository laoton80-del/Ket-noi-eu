/**
 * VIONA.TOURISM.LEGACY_SETTLED_BACKFILL.1
 *
 * Marks legacy settle-on-book TourismBooking rows after settlement metadata migration.
 * Default: dry-run. Apply only with --apply.
 *
 * Does NOT mutate Wallet, Transaction, booking status, or payout amounts.
 *
 * Prerequisite: npx prisma migrate deploy (20260519120000_tourism_settlement_metadata)
 *
 * Usage:
 *   npx tsx scripts/backfills/backfill-tourism-settlement-metadata.ts
 *   npx tsx scripts/backfills/backfill-tourism-settlement-metadata.ts --apply
 *   npx tsx scripts/backfills/backfill-tourism-settlement-metadata.ts --sample-limit 15
 */
import 'dotenv/config';

import {
  Prisma,
  TourismBookingStatus,
  TourismSettlementMode,
  TxType,
} from '@prisma/client';

import { disconnectPrisma, getPrisma } from '../../src/lib/prisma';

const REQUIRED_COLUMNS = [
  'settlementMode',
  'providerSettledAt',
  'createdAt',
  'updatedAt',
] as const;

const SAMPLE_DEFAULT = 10;

type TourismBookingRow = Readonly<{
  id: string;
  userId: string;
  businessId: string;
  status: TourismBookingStatus;
  totalPaidVIG: number;
  providerFeeVIG: number;
  touristFeeVIG: number;
  netProviderEarningsVIG: number;
  fxLockedAt: Date | null;
  startDate: Date;
  createdAt: Date | null;
  updatedAt: Date | null;
  providerSettledAt: Date | null;
  settlementMode: TourismSettlementMode;
}>;

type RowClass =
  | 'already_tagged'
  | 'candidate_legacy'
  | 'manual_review'
  | 'no_action';

type ClassifiedRow = Readonly<{
  row: TourismBookingRow;
  rowClass: RowClass;
  reason: string;
}>;

function parseArgs(argv: string[]): Readonly<{ apply: boolean; sampleLimit: number }> {
  let apply = false;
  let sampleLimit = SAMPLE_DEFAULT;
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]!;
    if (arg === '--apply') apply = true;
    else if (arg === '--help' || arg === '-h') {
      console.log(`Usage: npx tsx scripts/backfills/backfill-tourism-settlement-metadata.ts [--apply] [--sample-limit N]

  (default)  Dry-run — reports counts and sample IDs only.
  --apply      Write settlement metadata for eligible legacy rows.
  --sample-limit N   Max sample IDs per bucket (default ${SAMPLE_DEFAULT}).`);
      process.exit(0);
    } else if (arg === '--sample-limit') {
      sampleLimit = Number(argv[++i]);
    } else if (arg.startsWith('--sample-limit=')) {
      sampleLimit = Number(arg.slice('--sample-limit='.length));
    }
  }
  if (!Number.isFinite(sampleLimit) || sampleLimit < 1) {
    throw new Error('--sample-limit must be a positive number');
  }
  return { apply, sampleLimit };
}

function hasFeeSettlementSignal(row: TourismBookingRow): boolean {
  return row.netProviderEarningsVIG > 0 || row.providerFeeVIG + row.touristFeeVIG > 0;
}

function resolveProviderSettledAt(row: TourismBookingRow): Date {
  return row.providerSettledAt ?? row.fxLockedAt ?? row.updatedAt ?? row.startDate;
}

function resolveCreatedAt(row: TourismBookingRow): Date {
  return row.createdAt ?? row.fxLockedAt ?? row.startDate;
}

function classifyRow(row: TourismBookingRow): ClassifiedRow {
  if (row.settlementMode === TourismSettlementMode.LEGACY_SETTLE_ON_BOOK && row.providerSettledAt != null) {
    return {
      row,
      rowClass: 'already_tagged',
      reason: 'LEGACY_SETTLE_ON_BOOK with providerSettledAt',
    };
  }

  if (
    row.settlementMode !== TourismSettlementMode.UNKNOWN &&
    row.settlementMode !== TourismSettlementMode.LEGACY_SETTLE_ON_BOOK
  ) {
    return {
      row,
      rowClass: 'already_tagged',
      reason: `settlementMode=${row.settlementMode}`,
    };
  }

  if (row.settlementMode === TourismSettlementMode.LEGACY_SETTLE_ON_BOOK && row.providerSettledAt == null) {
    return {
      row,
      rowClass: 'candidate_legacy',
      reason: 'LEGACY_SETTLE_ON_BOOK missing providerSettledAt (repair)',
    };
  }

  if (row.totalPaidVIG <= 0) {
    return {
      row,
      rowClass: 'no_action',
      reason: 'totalPaidVIG <= 0',
    };
  }

  if (row.providerSettledAt != null) {
    return {
      row,
      rowClass: 'already_tagged',
      reason: 'providerSettledAt already set',
    };
  }

  if (row.status === TourismBookingStatus.CANCELLED) {
    return {
      row,
      rowClass: 'manual_review',
      reason: 'CANCELLED with totalPaidVIG > 0',
    };
  }

  if (hasFeeSettlementSignal(row)) {
    return {
      row,
      rowClass: 'candidate_legacy',
      reason: 'fee/settlement signal on book',
    };
  }

  if (row.status === TourismBookingStatus.COMPLETED) {
    return {
      row,
      rowClass: 'candidate_legacy',
      reason: 'COMPLETED with totalPaidVIG > 0',
    };
  }

  return {
    row,
    rowClass: 'manual_review',
    reason: 'totalPaidVIG > 0 without fee signal or COMPLETED',
  };
}

async function assertMetadataColumnsExist(): Promise<void> {
  const prisma = getPrisma();
  const found = await prisma.$queryRaw<Array<{ column_name: string }>>`
    SELECT column_name::text AS column_name
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'TourismBooking'
      AND column_name IN (
        'settlementMode',
        'providerSettledAt',
        'createdAt',
        'updatedAt'
      )
  `;
  const names = new Set(found.map((r) => r.column_name));
  const missing = REQUIRED_COLUMNS.filter((c) => !names.has(c));
  if (missing.length > 0) {
    throw new Error(
      `TourismBooking metadata columns missing (${missing.join(', ')}). ` +
        'Run: npx prisma migrate deploy'
    );
  }
}

async function tryLedgerCorroboration(row: TourismBookingRow): Promise<boolean> {
  const prisma = getPrisma();
  if (row.fxLockedAt == null || row.netProviderEarningsVIG <= 0) {
    return false;
  }
  const business = await prisma.business.findUnique({
    where: { id: row.businessId },
    select: { ownerId: true },
  });
  if (!business?.ownerId) return false;

  const wallet = await prisma.wallet.findUnique({
    where: { userId: business.ownerId },
    select: { id: true },
  });
  if (!wallet) return false;

  const windowStart = new Date(row.fxLockedAt.getTime() - 5 * 60 * 1000);
  const windowEnd = new Date(row.fxLockedAt.getTime() + 5 * 60 * 1000);
  const epsilon = Math.max(0.01, row.netProviderEarningsVIG * 0.001);

  const match = await prisma.transaction.findFirst({
    where: {
      walletId: wallet.id,
      type: TxType.BOOKING,
      senderId: row.userId,
      createdAt: { gte: windowStart, lte: windowEnd },
      amountVIG: {
        gte: row.netProviderEarningsVIG - epsilon,
        lte: row.netProviderEarningsVIG + epsilon,
      },
    },
    select: { id: true },
  });
  return match != null;
}

function printSampleIds(label: string, ids: string[], limit: number): void {
  const sample = ids.slice(0, limit);
  console.log(`  ${label}: ${ids.length} (sample: ${sample.length ? sample.join(', ') : '—'})`);
}

async function main(): Promise<void> {
  const { apply, sampleLimit } = parseArgs(process.argv.slice(2));
  const mode = apply ? 'APPLY' : 'DRY-RUN';

  if (!process.env.DATABASE_URL?.trim()) {
    throw new Error('DATABASE_URL is not set. Configure database access before running this backfill.');
  }

  console.log(`[tourism-settlement-backfill] mode=${mode}`);

  await assertMetadataColumnsExist();
  const prisma = getPrisma();

  const rows = await prisma.tourismBooking.findMany({
    select: {
      id: true,
      userId: true,
      businessId: true,
      status: true,
      totalPaidVIG: true,
      providerFeeVIG: true,
      touristFeeVIG: true,
      netProviderEarningsVIG: true,
      fxLockedAt: true,
      startDate: true,
      createdAt: true,
      updatedAt: true,
      providerSettledAt: true,
      settlementMode: true,
    },
    orderBy: { startDate: 'asc' },
  });

  const classified = rows.map(classifyRow);

  const buckets: Record<RowClass, ClassifiedRow[]> = {
    already_tagged: [],
    candidate_legacy: [],
    manual_review: [],
    no_action: [],
  };
  for (const c of classified) {
    buckets[c.rowClass].push(c);
  }

  let ledgerChecked = 0;
  let ledgerMatched = 0;
  const ledgerSampleLimit = Math.min(sampleLimit, buckets.candidate_legacy.length);
  for (let i = 0; i < ledgerSampleLimit; i++) {
    const c = buckets.candidate_legacy[i]!;
    ledgerChecked++;
    if (await tryLedgerCorroboration(c.row)) ledgerMatched++;
  }

  console.log('\n[tourism-settlement-backfill] summary');
  console.log(`  total scanned: ${rows.length}`);
  console.log(`  already tagged: ${buckets.already_tagged.length}`);
  console.log(`  candidate legacy settled: ${buckets.candidate_legacy.length}`);
  console.log(`  manual review (left UNKNOWN): ${buckets.manual_review.length}`);
  console.log(`  no action: ${buckets.no_action.length}`);
  if (ledgerChecked > 0) {
    console.log(
      `  ledger corroboration (sample ${ledgerChecked}): ${ledgerMatched} matched provider BOOKING tx`
    );
  }

  console.log('\n[tourism-settlement-backfill] sample IDs');
  printSampleIds(
    'already_tagged',
    buckets.already_tagged.map((c) => c.row.id),
    sampleLimit
  );
  printSampleIds(
    'candidate_legacy',
    buckets.candidate_legacy.map((c) => c.row.id),
    sampleLimit
  );
  printSampleIds(
    'manual_review',
    buckets.manual_review.map((c) => c.row.id),
    sampleLimit
  );

  if (buckets.manual_review.length > 0) {
    console.log('\n[tourism-settlement-backfill] manual review reasons (first 5):');
    for (const c of buckets.manual_review.slice(0, 5)) {
      console.log(`  - ${c.row.id}: ${c.reason}`);
    }
  }

  if (!apply) {
    console.log('\n[tourism-settlement-backfill] dry-run complete — no rows updated.');
    console.log('Re-run with --apply after engineering + ledger sign-off.');
    return;
  }

  let updated = 0;
  let skipped = 0;

  for (const c of buckets.candidate_legacy) {
    const { row } = c;
    const where: Prisma.TourismBookingWhereInput = {
      id: row.id,
      settlementMode: {
        in: [TourismSettlementMode.UNKNOWN, TourismSettlementMode.LEGACY_SETTLE_ON_BOOK],
      },
      providerSettledAt: null,
    };

    const providerSettledAt = resolveProviderSettledAt(row);
    const createdAt = resolveCreatedAt(row);

    const result = await prisma.tourismBooking.updateMany({
      where,
      data: {
        settlementMode: TourismSettlementMode.LEGACY_SETTLE_ON_BOOK,
        providerSettledAt,
        createdAt,
      },
    });

    if (result.count === 1) {
      updated++;
    } else {
      skipped++;
    }
  }

  console.log('\n[tourism-settlement-backfill] apply complete');
  console.log(`  rows updated: ${updated}`);
  console.log(`  rows skipped (state changed / idempotent): ${skipped}`);
  console.log(`  rows left UNKNOWN (manual review): ${buckets.manual_review.length}`);
}

main()
  .catch((e: unknown) => {
    const msg = e instanceof Error ? e.message : String(e);
    console.error(`[tourism-settlement-backfill] FATAL: ${msg}`);
    process.exitCode = 1;
  })
  .finally(async () => {
    await disconnectPrisma();
  });
