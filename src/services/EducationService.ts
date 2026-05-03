/**
 * Parent-funded lesson rewards: VIG is released only from `PiggyBank.lockedVigAmount`.
 * Treasury never mints VIG for lesson completion.
 *
 * TODO(cron): Run a daily job to find `PiggyBank` rows where `expiresAt < now()`. For each expired row,
 * move remaining `lockedVigAmount` back to the parent's main `Wallet.balanceVIG` (and clear piggy lock)
 * so lesson funds cannot rot indefinitely — requires idempotent ledger + audit rows.
 */

import { Prisma, PrismaClient, TxStatus, TxType } from '@prisma/client';

import { getPrisma } from '../lib/prisma';
import { createWalletForUser } from './WalletService';

const VIG_EPSILON = 1e-6;
const PIGGY_DEFAULT_TTL_MS = 30 * 24 * 60 * 60 * 1000;

function roundVig(n: number): number {
  return Math.round(n * 10_000) / 10_000;
}

export type CompleteLessonInput = Readonly<{
  parentUserId: string;
  childId: string;
  lessonId: string;
  /** 0–100 */
  score: number;
}>;

export type CompleteLessonOutput = Readonly<{
  lessonId: string;
  viStarAwarded: number;
  childViStarPointsTotal: number;
  vigRewarded: number;
  piggyLockedRemaining: number | null;
}>;

export type EducationServiceErrorCode =
  | 'invalid_input'
  | 'child_not_found'
  | 'piggy_not_found'
  | 'piggy_expired'
  | 'piggy_conflict'
  | 'concurrency_conflict';

export class EducationServiceError extends Error {
  readonly code: EducationServiceErrorCode;

  constructor(code: EducationServiceErrorCode, message: string) {
    super(message);
    this.name = 'EducationServiceError';
    this.code = code;
  }
}

/** ViStar (zero marginal cost): base + small score bonus, capped. */
function viStarDeltaForScore(score: number): number {
  const base = 10;
  const bonus = score > 80 ? 5 : 0;
  return base + bonus;
}

export type CreatePiggyBankInput = Readonly<{
  parentUserId: string;
  childId: string;
  lockedVigAmount: number;
  rewardPerLesson: number;
}>;

/**
 * Creates a PiggyBank with `expiresAt` = now + 30 days (orphan-fund TTL). Fails if a row already exists for the pair.
 */
export async function createPiggyBank(
  input: CreatePiggyBankInput,
  db: PrismaClient = getPrisma()
): Promise<Readonly<{ id: string; expiresAt: Date }>> {
  const parentUserId = input.parentUserId.trim();
  const childId = input.childId.trim();
  const locked = roundVig(input.lockedVigAmount);
  const reward = roundVig(input.rewardPerLesson);

  if (!parentUserId || !childId) {
    throw new EducationServiceError('invalid_input', 'parentUserId and childId are required');
  }
  if (parentUserId === childId) {
    throw new EducationServiceError('invalid_input', 'childId must differ from the parent');
  }
  if (!Number.isFinite(locked) || locked < 0 || !Number.isFinite(reward) || reward < 0) {
    throw new EducationServiceError('invalid_input', 'lockedVigAmount and rewardPerLesson must be finite numbers >= 0');
  }

  const expiresAt = new Date(Date.now() + PIGGY_DEFAULT_TTL_MS);

  try {
    const row = await db.piggyBank.create({
      data: {
        parentId: parentUserId,
        childId,
        lockedVigAmount: locked,
        rewardPerLesson: reward,
        expiresAt,
      },
    });
    return { id: row.id, expiresAt: row.expiresAt ?? expiresAt };
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
      throw new EducationServiceError('piggy_conflict', 'A PiggyBank already exists for this parent and child');
    }
    throw e;
  }
}

export async function completeLesson(
  input: CompleteLessonInput,
  db: PrismaClient = getPrisma()
): Promise<CompleteLessonOutput> {
  const parentUserId = input.parentUserId.trim();
  const childId = input.childId.trim();
  const lessonId = input.lessonId.trim();
  const { score } = input;

  if (!parentUserId || !childId || !lessonId) {
    throw new EducationServiceError('invalid_input', 'parentUserId, childId, and lessonId are required');
  }
  if (parentUserId === childId) {
    throw new EducationServiceError('invalid_input', 'childId must differ from the authenticated parent');
  }
  if (!Number.isFinite(score) || score < 0 || score > 100) {
    throw new EducationServiceError('invalid_input', 'score must be a finite number between 0 and 100');
  }

  const viStarDelta = viStarDeltaForScore(score);

  try {
    return await db.$transaction(
      async (tx) => {
        const [child, piggy] = await Promise.all([
          tx.user.findUnique({ where: { id: childId } }),
          tx.piggyBank.findUnique({
            where: { parentId_childId: { parentId: parentUserId, childId } },
          }),
        ]);

        if (!child) {
          throw new EducationServiceError('child_not_found', 'Child user not found');
        }
        if (!piggy) {
          throw new EducationServiceError(
            'piggy_not_found',
            'No PiggyBank for this parent and child; create one before completing lessons.'
          );
        }

        if (piggy.expiresAt !== null && piggy.expiresAt.getTime() <= Date.now()) {
          throw new EducationServiceError(
            'piggy_expired',
            'PiggyBank has expired; renew or wait for funds to be released by the platform cron job.'
          );
        }

        const updatedChild = await tx.user.update({
          where: { id: childId },
          data: { viStarPoints: { increment: viStarDelta } },
          select: { viStarPoints: true },
        });

        let vigRewarded = 0;
        let piggyLockedRemaining: number | null = piggy.lockedVigAmount;

        const reward = roundVig(piggy.rewardPerLesson);
        const eligibleVig =
          score > 80 && reward > VIG_EPSILON && piggy.lockedVigAmount + VIG_EPSILON >= reward;

        if (eligibleVig) {
          const dec = await tx.piggyBank.updateMany({
            where: {
              id: piggy.id,
              lockedVigAmount: { gte: reward },
            },
            data: { lockedVigAmount: { decrement: reward } },
          });

          if (dec.count === 1) {
            await createWalletForUser(childId, tx);
            const wallet = await tx.wallet.findUnique({ where: { userId: childId } });
            if (!wallet) {
              throw new EducationServiceError('invalid_input', 'Child wallet could not be provisioned');
            }

            await tx.wallet.update({
              where: { id: wallet.id },
              data: { balanceVIG: { increment: reward } },
            });

            await tx.transaction.create({
              data: {
                walletId: wallet.id,
                senderId: parentUserId,
                receiverId: childId,
                amountVIG: reward,
                feeAmount: 0,
                type: TxType.LESSON_REWARD,
                status: TxStatus.SUCCESS,
              },
            });

            vigRewarded = reward;
          }
        }

        const piggyAfter = await tx.piggyBank.findUnique({
          where: { id: piggy.id },
          select: { lockedVigAmount: true },
        });
        piggyLockedRemaining = piggyAfter?.lockedVigAmount ?? null;

        return {
          lessonId,
          viStarAwarded: viStarDelta,
          childViStarPointsTotal: updatedChild.viStarPoints,
          vigRewarded,
          piggyLockedRemaining,
        };
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        maxWait: 5000,
        timeout: 15_000,
      }
    );
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2034') {
      throw new EducationServiceError(
        'concurrency_conflict',
        'Lesson completion aborted due to a serialization conflict; safe to retry.'
      );
    }
    if (e instanceof EducationServiceError) throw e;
    throw e;
  }
}
