import { awardPoints } from '../loyalty/LoyaltyService';

export type KidsLessonProgress = Readonly<{
  scansCompleted: number;
  pronunciationsCompleted: number;
}>;

export type KidsRewardResult = Readonly<{
  completed: boolean;
  shouldShowConfetti: boolean;
  vigTokensAwarded: number;
  threshold: number;
}>;

const LESSON_THRESHOLD = 5 as const;
const LESSON_REWARD_VIG_TOKENS = 50 as const;

/**
 * Awards parent wallet when child finishes a mini-lesson.
 * Trigger condition: at least 5 scans OR 5 pronunciations.
 */
export function evaluateKidsLessonReward(
  parentUserId: string,
  progress: KidsLessonProgress
): KidsRewardResult {
  const scansOk = progress.scansCompleted >= LESSON_THRESHOLD;
  const pronOk = progress.pronunciationsCompleted >= LESSON_THRESHOLD;
  const completed = scansOk || pronOk;
  if (!completed) {
    return {
      completed: false,
      shouldShowConfetti: false,
      vigTokensAwarded: 0,
      threshold: LESSON_THRESHOLD,
    };
  }
  const award = awardPoints(parentUserId, LESSON_REWARD_VIG_TOKENS, 'Hoàn thành bài học Tiếng Việt');
  return {
    completed: true,
    shouldShowConfetti: true,
    vigTokensAwarded: award.vigTokensAdded,
    threshold: LESSON_THRESHOLD,
  };
}
