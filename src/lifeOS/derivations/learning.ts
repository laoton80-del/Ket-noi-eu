import type { UserSegment } from '../../context/AuthContext';
import { buildAdultLearningSnapshot, buildKidsLearningSnapshot } from '../../services/learning';

type LearningInput = {
  isLearningFullUnlocked?: boolean;
  isLearningUnlocked?: boolean;
  segment?: UserSegment;
};

export function deriveLearningState(input: LearningInput) {
  const hasUnlockedLearning = input.isLearningFullUnlocked === true || input.isLearningUnlocked === true;
  const segment: UserSegment = input.segment === 'child' ? 'child' : 'adult';
  const adultLearning = buildAdultLearningSnapshot({
    isLearningFullUnlocked: input.isLearningFullUnlocked === true,
    isLearningUnlocked: input.isLearningUnlocked === true,
  });
  const kidsLearning = buildKidsLearningSnapshot({
    hasUnlockedLearning,
  });
  return {
    segment,
    hasUnlockedLearning,
    currentLearningLevel: adultLearning.currentLevel,
    showEducationWidget: !hasUnlockedLearning,
    kidsLearningProgress: kidsLearning.progressPercent,
    learningProgress: segment === 'child' ? kidsLearning.progressPercent : hasUnlockedLearning ? 100 : 35,
    unlockedFullTrack: adultLearning.unlockedFullTrack,
  };
}
