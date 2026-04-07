import { useIsFocused, useNavigation } from '@react-navigation/native';
import { useMemo } from 'react';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth, type UserSegment } from '../context/AuthContext';
import type { RootStackParamList } from '../navigation/routes';
import { useWalletState } from '../state/wallet';
import { LAUNCH_PILOT_CONFIG } from '../config/launchPilot';
import { computeDaysToExpiry, getLegalUrgencyLine } from '../lifeOS/derivations/legal';
import { deriveLearningState } from '../lifeOS/derivations/learning';
import { deriveContextualSuggestions } from '../lifeOS/derivations/suggestions';
import { deriveLifeOSPricing, deriveWalletStatus } from '../lifeOS/derivations/wallet';
import { buildLifeOSActions } from '../lifeOS/hooks/buildLifeOSActions';
import type { LifeOSData } from '../lifeOS/model/lifeOSDataTypes';
import { useNearestVaultExpiry } from './useNearestVaultExpiry';

export type { LifeOSData };

type Nav = NativeStackNavigationProp<RootStackParamList>;

export function useLifeOSData(): LifeOSData {
  const navigation = useNavigation<Nav>();
  const isFocused = useIsFocused();
  const { user } = useAuth();
  const wallet = useWalletState();
  const nearestVaultExpiryDate = useNearestVaultExpiry(isFocused);

  return useMemo(() => {
    const visaFromProfile = user?.visaExpiryDate?.trim() ? user.visaExpiryDate : null;
    const visaExpiryDate = visaFromProfile ?? nearestVaultExpiryDate;
    const daysToExpiry = visaExpiryDate ? computeDaysToExpiry(visaExpiryDate) : null;
    const learning = deriveLearningState({
      isLearningFullUnlocked: user?.isLearningFullUnlocked === true,
      isLearningUnlocked: user?.isLearningUnlocked === true,
      segment: user?.segment,
    });
    const segment: UserSegment = learning.segment;
    const pricing = deriveLifeOSPricing(user?.country);
    const credits = wallet.credits;
    const walletStatus = deriveWalletStatus(credits, pricing);
    const { holidayActions, marketplaceSuggestion } = deriveContextualSuggestions(user?.country, daysToExpiry);

    return {
      userProfile: {
        segment,
      },
      userCountry: user?.country,
      visaExpiryDate,
      daysToExpiry,
      showLegalWidget: daysToExpiry !== null && daysToExpiry < 90,
      legalUrgencyLine: getLegalUrgencyLine(daysToExpiry),
      pricing,
      lowCreditThreshold: walletStatus.lowCreditThreshold,
      showLowCreditBanner: walletStatus.showLowCreditBanner,
      minActionCost: walletStatus.minActionCost,
      smartWalletLine: walletStatus.smartWalletLine,
      creditBalance: credits,
      isLowBalance: walletStatus.isLowBalance,
      hasUnlockedLearning: learning.unlockedFullTrack,
      currentLearningLevel: learning.currentLearningLevel,
      showEducationWidget: learning.showEducationWidget,
      actions: buildLifeOSActions(navigation, { userCountry: user?.country, segment }),
      kidsLearning: {
        progressPercent: learning.kidsLearningProgress,
      },
      learningProgress: learning.learningProgress,
      autonomyHint:
        typeof daysToExpiry === 'number' && daysToExpiry <= 90
          ? 'Bạn có thể bật chế độ tự động gia hạn khi gần đến hạn (theo consent và chính sách).'
          : null,
      holidayActions,
      marketplaceSuggestion: LAUNCH_PILOT_CONFIG.enableMarketplaceSurface ? marketplaceSuggestion : null,
    };
  }, [navigation, nearestVaultExpiryDate, user, wallet.credits]);
}
