export type KidsLearningSnapshot = {
  progressPercent: number;
};

type BuildKidsLearningInput = {
  hasUnlockedLearning: boolean;
};

export function buildKidsLearningSnapshot(input: BuildKidsLearningInput): KidsLearningSnapshot {
  return {
    progressPercent: input.hasUnlockedLearning ? 100 : 35,
  };
}

