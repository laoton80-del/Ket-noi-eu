/**
 * SOS — **AI-first triage** before any PSTN emergency dial (112/911/115).
 * Routes to **Minh Khang** via `LiveInterpreter` (persona policy `minh_khang` on that route).
 *
 * **Never** invoke `Linking.openURL('tel:…')` until the UI buffer in {@link SOSModal} elapses.
 */

import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import type { RootStackParamList } from '../../navigation/routes';

/** Minimum delay (ms) before native emergency dial UI may arm — product/legal buffer after AI handoff. */
export const V7_SOS_EMERGENCY_DIAL_BUFFER_MS = 10_000 as const;

/**
 * First-line triage: open Live Interpreter (Minh Khang) for distress assessment.
 * Does **not** place a phone call.
 */
export function initiateAITriage(
  navigation: NativeStackNavigationProp<RootStackParamList>
): void {
  navigation.navigate('LiveInterpreter', {
    guidedEntry: true,
    scenario: 'general',
  });
}
