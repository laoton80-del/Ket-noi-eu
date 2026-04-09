import type { PricingTierId } from '../config/countryPacks';
import type { DocumentVaultItem } from '../services/DocumentAlarmService';

export type ResidencyStatus = 'du_hoc' | 'lao_dong' | 'dinh_cu' | 'ti_nan';
export type SubscriptionPlan = 'free' | 'premium' | 'combo';
export type UserSegment = 'adult' | 'child';

export type AuthUser = {
  phone: string;
  name: string;
  country: string;
  countryTier: PricingTierId;
  residencyStatus: ResidencyStatus;
  visaType: string;
  visaExpiryDate: string;
  subscriptionPlan: SubscriptionPlan;
  segment: UserSegment;
  aiCallCredits: number;
  isLearningFullUnlocked: boolean;
  isLearningUnlocked: boolean;
  identityDocuments: Pick<DocumentVaultItem, 'id' | 'documentType' | 'expiryDate' | 'holderName'>[];
};
