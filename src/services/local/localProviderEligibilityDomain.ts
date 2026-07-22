/**
 * Local provider eligibility domain helpers (FC-P0 Pack A1).
 *
 * Pure selectability / service-type / create-validation rules.
 * Does not mutate eligibility or write eligibility audit events.
 */
import {
  LocalProviderEligibilityStatus,
  type LocalServiceType,
} from '@prisma/client';

export type LocalProviderEligibilitySnapshot = Readonly<{
  status: LocalProviderEligibilityStatus;
  publicB2cVisible: boolean;
  supportedServiceTypes: readonly LocalServiceType[];
}>;

export type LocalProviderBusinessSnapshot = Readonly<{
  id: string;
  name: string;
}>;

/** Non-empty trimmed Business display name required for ACTIVE selectability. */
export function isValidLocalProviderBusinessDisplayName(name: string | null | undefined): boolean {
  return typeof name === 'string' && name.trim().length > 0;
}

/**
 * IS_LOCAL_PROVIDER_SELECTABLE — does not mutate eligibility when name is invalid.
 */
export function isLocalProviderSelectable(input: {
  business: LocalProviderBusinessSnapshot | null | undefined;
  eligibility: LocalProviderEligibilitySnapshot | null | undefined;
}): boolean {
  const { business, eligibility } = input;
  if (!business) return false;
  if (!eligibility) return false;
  if (eligibility.status !== LocalProviderEligibilityStatus.ACTIVE) return false;
  if (eligibility.publicB2cVisible !== true) return false;
  if (eligibility.supportedServiceTypes.length === 0) return false;
  if (!isValidLocalProviderBusinessDisplayName(business.name)) return false;
  return true;
}

/**
 * IS_LOCAL_PROVIDER_ALLOWED_FOR_SERVICE_TYPE
 */
export function isLocalProviderAllowedForServiceType(input: {
  business: LocalProviderBusinessSnapshot | null | undefined;
  eligibility: LocalProviderEligibilitySnapshot | null | undefined;
  serviceType: LocalServiceType;
}): boolean {
  if (!isLocalProviderSelectable(input)) return false;
  return input.eligibility!.supportedServiceTypes.includes(input.serviceType);
}

export type LocalProviderCreateEligibilityFailure =
  | 'business_not_found'
  | 'provider_not_available'
  | 'service_type_not_supported';

/**
 * Create-path eligibility verdict (safe mappings; no status leakage in message layer).
 */
export function validateLocalProviderEligibilityForCreate(input: {
  business: LocalProviderBusinessSnapshot | null | undefined;
  eligibility: LocalProviderEligibilitySnapshot | null | undefined;
  serviceType: LocalServiceType;
}):
  | Readonly<{ ok: true }>
  | Readonly<{ ok: false; reason: LocalProviderCreateEligibilityFailure }> {
  if (!input.business) {
    return { ok: false, reason: 'business_not_found' };
  }

  if (!input.eligibility) {
    return { ok: false, reason: 'provider_not_available' };
  }

  if (input.eligibility.status !== LocalProviderEligibilityStatus.ACTIVE) {
    return { ok: false, reason: 'provider_not_available' };
  }

  if (input.eligibility.publicB2cVisible !== true) {
    return { ok: false, reason: 'provider_not_available' };
  }

  if (!isValidLocalProviderBusinessDisplayName(input.business.name)) {
    return { ok: false, reason: 'provider_not_available' };
  }

  if (input.eligibility.supportedServiceTypes.length === 0) {
    return { ok: false, reason: 'provider_not_available' };
  }

  if (!input.eligibility.supportedServiceTypes.includes(input.serviceType)) {
    return { ok: false, reason: 'service_type_not_supported' };
  }

  return { ok: true };
}

/** Canonical REGISTERED no-prior discriminator fields (for Pack A2 writers / A1 schema tests). */
export function buildRegisteredPriorState(): Readonly<{
  priorStatus: null;
  priorPublicB2cVisible: null;
  priorSupportedServiceTypes: [];
}> {
  return {
    priorStatus: null,
    priorPublicB2cVisible: null,
    priorSupportedServiceTypes: [],
  };
}

export function isRegisteredNoPriorState(input: {
  eventType: string;
  priorStatus: LocalProviderEligibilityStatus | null | undefined;
  priorPublicB2cVisible: boolean | null | undefined;
}): boolean {
  return (
    input.eventType === 'REGISTERED' &&
    input.priorStatus == null &&
    input.priorPublicB2cVisible == null
  );
}
