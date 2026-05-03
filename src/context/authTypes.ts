import type { PricingTierId } from '../config/countryPacks';
import type { DocumentVaultItem } from '../services/DocumentAlarmService';

/** Client + server persona for dynamic home & onboarding (see `User.persona` in Prisma). */
export type UserPersona = 'EXPAT' | 'TOURIST';

/** Mirrors Prisma `Role` for navigation & merchant surfaces (local session). */
export type ServerUserRole = 'B2C' | 'B2B' | 'B2B_EU' | 'B2B_VN' | 'ADMIN' | 'BROKER';

/** Merchant roles that receive the **Merchant workspace** shell by default (unless `workspaceUiOverride`). */
export function isMerchantServerRole(role: ServerUserRole): boolean {
  return role === 'B2B' || role === 'B2B_EU' || role === 'B2B_VN';
}

export function normalizeServerUserRole(raw: unknown): ServerUserRole {
  if (
    raw === 'B2B_VN' ||
    raw === 'B2B_EU' ||
    raw === 'B2B' ||
    raw === 'ADMIN' ||
    raw === 'B2C' ||
    raw === 'BROKER'
  ) {
    return raw;
  }
  return 'B2C';
}

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
  persona: UserPersona;
  /** When true, Home shows the one-time persona picker after onboarding. */
  needsPersonaOnboarding: boolean;
  /** Prisma `User.id` when known (REST login / sync). */
  serverUserId?: string;
  /** Prisma `User.role` — drives B2B_VN merchant tab shell. */
  serverRole: ServerUserRole;
  /**
   * When `'consumer'`, app opens the standard ViGlobal Tabs shell on cold start (surfaces still gated by role server-side).
   * Cleared via profile update for brokers / merchants who want the workspace dashboard as default again.
   */
  workspaceUiOverride?: 'consumer';
  /** Mirrors `User.isKYCVerified` — VN merchants cannot receive QR payouts until true. */
  kycVerified: boolean;
  /** Mirrors `User.businessCategory` (e.g. TAXI, HOMESTAY, FOOD). */
  businessCategory?: string | null;
};
