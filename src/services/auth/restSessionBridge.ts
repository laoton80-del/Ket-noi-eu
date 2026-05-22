import { normalizeCountryCodeOrSentinel, resolveCountryPack } from '../../config/countryPacks';
import type { AuthUser, SubscriptionPlan, UserPersona } from '../../context/authTypes';
import { normalizeServerUserRole } from '../../context/authTypes';
import type { RestAuthUser } from '../restAuthClient';

/** Normalize display phone from LoginScreen (`+420 910000001` → E.164-ish, no spaces). */
export function normalizePhoneForRestLogin(displayPhone: string): string {
  return displayPhone.trim().replace(/\s+/g, '');
}

function mapServerTierToSubscription(tier: string): SubscriptionPlan {
  const u = tier.toUpperCase();
  if (u === 'POWER' || u === 'ELITE') return 'premium';
  return 'free';
}

/** Map REST `/api/auth/login` user payload into local `AuthUser` session snapshot. */
export function mapRestAuthUserToAuthUser(rest: RestAuthUser, displayPhone?: string): AuthUser {
  const phone = displayPhone?.trim()
    ? normalizePhoneForRestLogin(displayPhone)
    : normalizePhoneForRestLogin(rest.phoneNumber);
  const profile = rest.profile;
  const country = normalizeCountryCodeOrSentinel(profile?.country);
  const countryTier = resolveCountryPack(country).pricingTier;
  const persona: UserPersona = rest.persona === 'TOURIST' ? 'TOURIST' : 'EXPAT';
  const serverRole = normalizeServerUserRole(rest.role);
  const fullName = profile?.fullName?.trim() ?? '';

  return {
    phone,
    name: fullName.length > 0 ? fullName : phone,
    country,
    countryTier,
    residencyStatus: 'lao_dong',
    visaType: '',
    visaExpiryDate: '',
    subscriptionPlan: mapServerTierToSubscription(rest.tier),
    segment: 'adult',
    aiCallCredits: 0,
    isLearningFullUnlocked: false,
    isLearningUnlocked: false,
    identityDocuments: [],
    persona,
    needsPersonaOnboarding: fullName.length < 2,
    serverUserId: rest.id,
    serverRole,
    kycVerified: rest.isKYCVerified === true,
    businessCategory: rest.businessCategory ?? null,
  };
}

export function restUserHasCompletedProfile(rest: RestAuthUser): boolean {
  return (rest.profile?.fullName?.trim().length ?? 0) >= 2;
}
