/**
 * VIONA.TOURISM.TIMEOUT_RELEASE_DRY_RUN.1
 *
 * Detects held TourismBooking rows past merchant review timeout. Default: dry-run (read-only).
 * Does NOT release funds, mutate wallets, or change booking status.
 *
 * Apply is blocked in this pack until VIONA.TOURISM.TIMEOUT_RELEASE_WORKER.1.
 *
 * Usage:
 *   npx tsx scripts/jobs/release-tourism-held-timeouts.ts
 *   npx tsx scripts/jobs/release-tourism-held-timeouts.ts --sample-limit 20
 *   TOURISM_HOLD_REVIEW_TIMEOUT_HOURS=24 npx tsx scripts/jobs/release-tourism-held-timeouts.ts
 */
import 'dotenv/config';

import { TourismSettlementMode, TxType } from '@prisma/client';

import { disconnectPrisma, getPrisma } from '../../src/lib/prisma';
import {
  classifyTourismHeldBookingTimeoutCandidate,
  resolveTourismHoldReviewTimeoutHours,
} from '../../src/services/tourism/tourismHeldBookingTimeoutEligibility';

const TOURISM_BOOKING_LOCK_PARTY = 'ViGlobalTourismBookingLock';
const VIG_EPSILON = 1e-6;
const SAMPLE_DEFAULT = 10;

type Args = Readonly<{
  apply: boolean;
  sampleLimit: number;
  bookingId: string | null;
}>;

type BucketKey =
  | 'eligible'
  | 'not_yet_due'
  | 'already_cancelled'
  | 'already_settled_or_terminal'
  | 'manual_review'
  | 'ineligible_mode_or_status'
  | 'missing_lock'
  | 'insufficient_locked_funds';

function parseArgs(argv: string[]): Args {
  let apply = false;
  let sampleLimit = SAMPLE_DEFAULT;
  let bookingId: string | null = null;

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]!;
    if (arg === '--apply') apply = true;
    else if (arg === '--help' || arg === '-h') {
      console.log(`Usage: npx tsx scripts/jobs/release-tourism-held-timeouts.ts [options]

  (default)  Dry-run — classify timeout candidates; no wallet or booking writes.
  --apply      BLOCKED in this pack (worker pack required after finance sign-off).
  --sample-limit N   Sample IDs per bucket (default ${SAMPLE_DEFAULT}).
  --booking-id <uuid>   Inspect a single booking.

Env:
  TOURISM_HOLD_REVIEW_TIMEOUT_HOURS  Default 48 (use 24 on staging pilot).`);
      process.exit(0);
    } else if (arg === '--sample-limit') {
      sampleLimit = Number(argv[++i]);
    } else if (arg.startsWith('--sample-limit=')) {
      sampleLimit = Number(arg.slice('--sample-limit='.length));
    } else if (arg === '--booking-id') {
      bookingId = argv[++i] ?? null;
    } else if (arg.startsWith('--booking-id=')) {
      bookingId = arg.slice('--booking-id='.length);
    }
  }

  return { apply, sampleLimit, bookingId };
}

function sampleIds(ids: string[], limit: number): string[] {
  return ids.slice(0, Math.max(0, limit));
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));

  if (args.apply) {
    console.error(
      '[tourism-timeout-release] FATAL: --apply is blocked in TIMEOUT_RELEASE_DRY_RUN.1. ' +
        'Complete finance sign-off on dry-run output, then ship VIONA.TOURISM.TIMEOUT_RELEASE_WORKER.1.'
    );
    process.exit(1);
  }

  const timeoutHours = resolveTourismHoldReviewTimeoutHours();
  const now = new Date();

  const buckets: Record<BucketKey, string[]> = {
    eligible: [],
    not_yet_due: [],
    already_cancelled: [],
    already_settled_or_terminal: [],
    manual_review: [],
    ineligible_mode_or_status: [],
    missing_lock: [],
    insufficient_locked_funds: [],
  };

  let scanned = 0;
  let eligibleVigTotal = 0;
  let oldestEligibleAgeMs = 0;

  const rows = await getPrisma().tourismBooking.findMany({
    where: args.bookingId
      ? { id: args.bookingId }
      : { settlementMode: TourismSettlementMode.HOLD_ON_SUBMIT },
    select: {
      id: true,
      userId: true,
      status: true,
      settlementMode: true,
      providerSettledAt: true,
      confirmedAt: true,
      createdAt: true,
      fxLockedAt: true,
      startDate: true,
      totalPaidVIG: true,
    },
    orderBy: [{ createdAt: 'asc' }, { startDate: 'asc' }],
  });

  scanned = rows.length;

  for (const row of rows) {
    const classification = classifyTourismHeldBookingTimeoutCandidate(
      {
        status: row.status,
        settlementMode: row.settlementMode,
        providerSettledAt: row.providerSettledAt,
        confirmedAt: row.confirmedAt,
        createdAt: row.createdAt,
        fxLockedAt: row.fxLockedAt,
        startDate: row.startDate,
        totalPaidVIG: row.totalPaidVIG,
      },
      now,
      timeoutHours
    );

    if (classification.bucket !== 'eligible') {
      buckets[classification.bucket].push(row.id);
      continue;
    }

    const { totalPaidVIG, userId } = row;

    if (totalPaidVIG <= VIG_EPSILON) {
      buckets.eligible.push(row.id);
      continue;
    }

    const wallet = await getPrisma().wallet.findUnique({
      where: { userId },
      select: { id: true, lockedBalanceVIG: true },
    });

    if (!wallet) {
      buckets.manual_review.push(row.id);
      continue;
    }

    const lockHold = await getPrisma().transaction.findFirst({
      where: {
        walletId: wallet.id,
        type: TxType.BOOKING_LOCK,
        senderId: userId,
        receiverId: TOURISM_BOOKING_LOCK_PARTY,
        amountVIG: { gte: totalPaidVIG - VIG_EPSILON, lte: totalPaidVIG + VIG_EPSILON },
      },
      select: { id: true },
    });

    if (!lockHold) {
      buckets.missing_lock.push(row.id);
      continue;
    }

    if (wallet.lockedBalanceVIG + VIG_EPSILON < totalPaidVIG) {
      buckets.insufficient_locked_funds.push(row.id);
      continue;
    }

    buckets.eligible.push(row.id);
    eligibleVigTotal += totalPaidVIG;
    if (classification.ageMs > oldestEligibleAgeMs) {
      oldestEligibleAgeMs = classification.ageMs;
    }
  }

  const mode = 'DRY-RUN';
  console.log(`[tourism-timeout-release] mode=${mode}`);
  console.log('');
  console.log('[tourism-timeout-release] summary');
  console.log(`  timeoutHours: ${timeoutHours}`);
  console.log(`  scanned HOLD_ON_SUBMIT rows: ${scanned}`);
  console.log(`  eligible candidates (ready for future release): ${buckets.eligible.length}`);
  console.log(`  not yet due: ${buckets.not_yet_due.length}`);
  console.log(`  already cancelled (skipped): ${buckets.already_cancelled.length}`);
  console.log(`  already settled/terminal (skipped): ${buckets.already_settled_or_terminal.length}`);
  console.log(`  manual review: ${buckets.manual_review.length}`);
  console.log(`  ineligible mode/status: ${buckets.ineligible_mode_or_status.length}`);
  console.log(`  missing BOOKING_LOCK: ${buckets.missing_lock.length}`);
  console.log(`  insufficient lockedBalanceVIG: ${buckets.insufficient_locked_funds.length}`);
  console.log(`  totalVIG in eligible candidates: ${eligibleVigTotal.toFixed(4)}`);
  console.log(
    `  oldest eligible age (hours): ${(oldestEligibleAgeMs / (60 * 60 * 1000)).toFixed(2)}`
  );
  console.log('');
  console.log('[tourism-timeout-release] sample booking IDs');
  for (const key of Object.keys(buckets) as BucketKey[]) {
    const ids = buckets[key];
    if (ids.length === 0) continue;
    console.log(`  ${key}: ${sampleIds(ids, args.sampleLimit).join(', ')}`);
  }
  console.log('');
  console.log('[tourism-timeout-release] recommended next action');
  if (buckets.missing_lock.length > 0 || buckets.insufficient_locked_funds.length > 0) {
    console.log(
      '  1) Resolve risk/manual-review rows before any auto-release worker.'
    );
  }
  if (buckets.eligible.length > 0) {
    console.log(
      '  2) Engineering + finance review this dry-run log; then ship TIMEOUT_RELEASE_WORKER.1 with --apply.'
    );
  } else {
    console.log('  No eligible timeout candidates — no worker apply recommended.');
  }
  console.log('  3) Do NOT enable production TOURISM_SETTLEMENT_MODE=hold until pilot sign-off.');
  console.log('');
  console.log('[tourism-timeout-release] dry-run complete — no rows updated.');
}

main()
  .catch((e) => {
    console.error('[tourism-timeout-release] FATAL:', e instanceof Error ? e.message : e);
    process.exit(1);
  })
  .finally(() => disconnectPrisma());
