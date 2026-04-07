export type AdultLearningLevel = 'A1' | 'A2' | 'B1' | 'B2';

export type AdultLearningSnapshot = {
  currentLevel: AdultLearningLevel;
  unlockedFullTrack: boolean;
};

type BuildAdultLearningInput = {
  isLearningFullUnlocked: boolean;
  isLearningUnlocked: boolean;
};

export function buildAdultLearningSnapshot(input: BuildAdultLearningInput): AdultLearningSnapshot {
  const unlockedFullTrack = input.isLearningFullUnlocked || input.isLearningUnlocked;
  return {
    currentLevel: unlockedFullTrack ? 'B2' : 'A1',
    unlockedFullTrack,
  };
}

