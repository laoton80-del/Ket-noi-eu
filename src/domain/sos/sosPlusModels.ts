/**
 * SOS Plus entitlement & consent — frontend models (AF.SOS.2).
 * Server reconciliation is future work; local stub must stay visibly labeled in UI.
 */

export type SosPlusPlanId = 'free' | 'sos_plus';

/** Where entitlement truth will eventually come from; today only `local_stub` is populated. */
export type SosPlusEntitlementSource = 'local_stub';

export type SosPlusEntitlementSnapshot = Readonly<{
  source: SosPlusEntitlementSource;
  planId: SosPlusPlanId;
  /**
   * Device-only preview of Plus UI state — does not grant paid rights or server features.
   * Turn off before interpreting entitlements as billing truth.
   */
  simulatePlusActive: boolean;
  updatedAtIso: string;
}>;

export type SosConsentSnapshot = Readonly<{
  locationSharing: boolean;
  audioRecording: boolean;
  videoRecording: boolean;
  trustedContactAlert: boolean;
  emergencyCallAssistance: boolean;
  /** ISO8601 when user last acknowledged the legal block; cleared when toggled off. */
  legalDisclaimerAcceptedAt: string | null;
}>;

export type SosTrustedContact = Readonly<{
  id: string;
  displayName: string;
  /** Stored as-dialed string; E.164 normalization is a future layer. */
  phoneE164: string;
}>;

export type SosPreferredLanguageCode = 'en' | 'vi';

export type SosPlusLocalProfileSnapshot = Readonly<{
  entitlement: SosPlusEntitlementSnapshot;
  consent: SosConsentSnapshot;
  trustedContacts: readonly SosTrustedContact[];
  emergencyCountryIso2: string;
  preferredLanguageCode: SosPreferredLanguageCode;
}>;

export const DEFAULT_SOS_CONSENT: SosConsentSnapshot = {
  locationSharing: false,
  audioRecording: false,
  videoRecording: false,
  trustedContactAlert: false,
  emergencyCallAssistance: false,
  legalDisclaimerAcceptedAt: null,
};

export function createDefaultStubEntitlement(nowIso: string): SosPlusEntitlementSnapshot {
  return {
    source: 'local_stub',
    planId: 'free',
    simulatePlusActive: false,
    updatedAtIso: nowIso,
  };
}
