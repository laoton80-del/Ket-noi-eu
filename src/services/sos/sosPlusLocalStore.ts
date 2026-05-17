/**
 * Device-local SOS Plus profile persistence (AF.SOS.2).
 * Not server authoritative — replace with signed server snapshot when backend exists.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  type SosConsentSnapshot,
  type SosPlusEntitlementSnapshot,
  type SosPlusLocalProfileSnapshot,
  type SosTrustedContact,
  createDefaultStubEntitlement,
  DEFAULT_SOS_CONSENT,
  type SosPreferredLanguageCode,
} from '../../domain/sos/sosPlusModels';

const STORAGE_KEY = 'viona.sos_plus.local_profile.v1';

type PersistedV1 = Readonly<{
  v: 1;
  entitlement: SosPlusEntitlementSnapshot;
  consent: SosConsentSnapshot;
  trustedContacts: SosTrustedContact[];
  emergencyCountryIso2: string;
  preferredLanguageCode: SosPreferredLanguageCode;
}>;

const DEFAULT_COUNTRY = 'VN';

function isoNow(): string {
  return new Date().toISOString();
}

function sanitizeContacts(raw: unknown): SosTrustedContact[] {
  if (!Array.isArray(raw)) return [];
  const out: SosTrustedContact[] = [];
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue;
    const o = item as Record<string, unknown>;
    const id = typeof o.id === 'string' ? o.id : '';
    const displayName = typeof o.displayName === 'string' ? o.displayName.trim() : '';
    const phoneE164 = typeof o.phoneE164 === 'string' ? o.phoneE164.trim() : '';
    if (!id || !displayName || !phoneE164) continue;
    out.push({ id, displayName, phoneE164 });
    if (out.length >= 3) break;
  }
  return out;
}

function coercePersisted(raw: string | null): PersistedV1 | null {
  if (!raw) return null;
  try {
    const p = JSON.parse(raw) as Partial<PersistedV1>;
    if (p.v !== 1 || !p.entitlement || !p.consent) return null;
    return {
      v: 1,
      entitlement: {
        source: 'local_stub',
        planId: p.entitlement.planId === 'sos_plus' ? 'sos_plus' : 'free',
        simulatePlusActive: Boolean(p.entitlement.simulatePlusActive),
        updatedAtIso: typeof p.entitlement.updatedAtIso === 'string' ? p.entitlement.updatedAtIso : isoNow(),
      },
      consent: {
        locationSharing: Boolean(p.consent.locationSharing),
        audioRecording: Boolean(p.consent.audioRecording),
        videoRecording: Boolean(p.consent.videoRecording),
        trustedContactAlert: Boolean(p.consent.trustedContactAlert),
        emergencyCallAssistance: Boolean(p.consent.emergencyCallAssistance),
        legalDisclaimerAcceptedAt:
          typeof p.consent.legalDisclaimerAcceptedAt === 'string' ? p.consent.legalDisclaimerAcceptedAt : null,
      },
      trustedContacts: sanitizeContacts(p.trustedContacts),
      emergencyCountryIso2:
        typeof p.emergencyCountryIso2 === 'string' && p.emergencyCountryIso2.length === 2
          ? p.emergencyCountryIso2.toUpperCase()
          : DEFAULT_COUNTRY,
      preferredLanguageCode: p.preferredLanguageCode === 'vi' ? 'vi' : 'en',
    };
  } catch {
    return null;
  }
}

export async function loadSosPlusLocalProfile(): Promise<SosPlusLocalProfileSnapshot> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  const parsed = coercePersisted(raw);
  const now = isoNow();
  if (!parsed) {
    return {
      entitlement: createDefaultStubEntitlement(now),
      consent: { ...DEFAULT_SOS_CONSENT },
      trustedContacts: [],
      emergencyCountryIso2: DEFAULT_COUNTRY,
      preferredLanguageCode: 'en',
    };
  }
  return {
    entitlement: parsed.entitlement,
    consent: parsed.consent,
    trustedContacts: parsed.trustedContacts,
    emergencyCountryIso2: parsed.emergencyCountryIso2,
    preferredLanguageCode: parsed.preferredLanguageCode,
  };
}

export async function saveSosPlusLocalProfile(snapshot: SosPlusLocalProfileSnapshot): Promise<void> {
  const payload: PersistedV1 = {
    v: 1,
    entitlement: {
      ...snapshot.entitlement,
      updatedAtIso: isoNow(),
    },
    consent: snapshot.consent,
    trustedContacts: [...snapshot.trustedContacts].slice(0, 3),
    emergencyCountryIso2: snapshot.emergencyCountryIso2,
    preferredLanguageCode: snapshot.preferredLanguageCode,
  };
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
}
