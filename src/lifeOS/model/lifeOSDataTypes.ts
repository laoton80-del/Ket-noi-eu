import type { UserSegment } from '../../context/AuthContext';

export type LifeOSData = {
  userProfile: {
    segment: UserSegment;
  };
  userCountry?: string;
  visaExpiryDate: string | null;
  daysToExpiry: number | null;
  showLegalWidget: boolean;
  legalUrgencyLine: string | null;
  pricing: {
    legalLeona: number;
    leonaOutbound: number;
    interpreterSession: number;
    leTanBooking: number;
  };
  lowCreditThreshold: number;
  showLowCreditBanner: boolean;
  minActionCost: number;
  smartWalletLine: string;
  creditBalance: number;
  isLowBalance: boolean;
  hasUnlockedLearning: boolean;
  currentLearningLevel: 'A1' | 'A2' | 'B1' | 'B2';
  showEducationWidget: boolean;
  kidsLearning: {
    progressPercent: number;
  };
  learningProgress: number;
  autonomyHint: string | null;
  holidayActions: string[];
  marketplaceSuggestion: string | null;
  actions: {
    onPressBookLeona: () => void;
    onPressTopUp: () => void;
    onPressUpgradeLearning: () => void;
    onPressCallHelp: () => void;
    onPressInterpreter: () => void;
    onPressCallAssist: () => void;
    onPressFindServices: () => void;
    onPressMarketplaceAutoBook: () => void;
  };
};
