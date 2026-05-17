/**
 * GDPR / ePrivacy — **granular consent** before accessing location (Travel) or microphone (Minh Khang Live Interpreter).
 * Stored locally; sync to backend consent table when REST profile exists.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY_TRAVEL_LOCATION = 'ketnoieu.compliance.consent.travelLocation.v1';
const KEY_INTERPRETER_MIC = 'ketnoieu.compliance.consent.interpreterMic.v1';

export type TravelLocationConsentState = 'unset' | 'granted' | 'declined';

export async function getTravelLocationConsentState(): Promise<TravelLocationConsentState> {
  const v = await AsyncStorage.getItem(KEY_TRAVEL_LOCATION);
  if (v === '1') return 'granted';
  if (v === '0') return 'declined';
  return 'unset';
}

export async function hasTravelLocationConsent(): Promise<boolean> {
  return (await getTravelLocationConsentState()) === 'granted';
}

export async function isTravelLocationPromptResolved(): Promise<boolean> {
  return (await getTravelLocationConsentState()) !== 'unset';
}

export async function setTravelLocationConsent(granted: boolean): Promise<void> {
  await AsyncStorage.setItem(KEY_TRAVEL_LOCATION, granted ? '1' : '0');
}

export async function hasInterpreterMicrophoneConsent(): Promise<boolean> {
  const v = await AsyncStorage.getItem(KEY_INTERPRETER_MIC);
  return v === '1';
}

export async function setInterpreterMicrophoneConsent(granted: boolean): Promise<void> {
  await AsyncStorage.setItem(KEY_INTERPRETER_MIC, granted ? '1' : '0');
}
