import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEY_BUILDERS } from '../../storage/storageKeys';
import type { AutonomousConsentEnvelope } from './types';

function defaultConsent(userId: string): AutonomousConsentEnvelope {
  return {
    userId,
    b2c: {
      allowAutoVisaBooking: false,
      allowAutoAppointmentConfirmation: false,
      allowAutoOutboundCalls: false,
      maxCreditsPerAction: 99,
      maxCreditsPerDay: 199,
      allowedHours: { startHourLocal: 8, endHourLocal: 21 },
      requireConfirmationAboveCredits: 60,
    },
    b2b: {
      merchantRules: [],
    },
    updatedAt: new Date().toISOString(),
  };
}

export async function loadAutonomousConsent(userId: string): Promise<AutonomousConsentEnvelope> {
  const key = STORAGE_KEY_BUILDERS.autonomyConsent(userId);
  try {
    const raw = await AsyncStorage.getItem(key);
    if (!raw) return defaultConsent(userId);
    const parsed = JSON.parse(raw) as Partial<AutonomousConsentEnvelope>;
    if (!parsed?.b2c) return defaultConsent(userId);
    return {
      ...defaultConsent(userId),
      ...parsed,
      userId,
      b2c: { ...defaultConsent(userId).b2c, ...parsed.b2c },
      updatedAt: typeof parsed.updatedAt === 'string' ? parsed.updatedAt : new Date().toISOString(),
    };
  } catch {
    return defaultConsent(userId);
  }
}

export async function saveAutonomousConsent(consent: AutonomousConsentEnvelope): Promise<void> {
  const key = STORAGE_KEY_BUILDERS.autonomyConsent(consent.userId);
  await AsyncStorage.setItem(
    key,
    JSON.stringify({
      ...consent,
      updatedAt: new Date().toISOString(),
    })
  );
}
