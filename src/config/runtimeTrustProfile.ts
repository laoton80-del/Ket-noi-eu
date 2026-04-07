/**
 * G5 / M1 — Client runtime trust **profile** (honest web vs native).
 *
 * **Web:** `X-Firebase-AppCheck` when `EXPO_PUBLIC_FIREBASE_APP_CHECK_SITE_KEY` + web init succeed.
 * **Native (M1):** same header when `@react-native-firebase/app-check` initializes in a **dev client / store**
 * build with Firebase native config — not Expo Go.
 *
 * Optional label for release notes / analytics (does not change security):
 * `EXPO_PUBLIC_RELEASE_TRUST_PROFILE=native_pilot | web_commercial | mixed_pilot` (default: mixed_pilot).
 *
 * @see docs/G5_PLATFORM_TRUST.md
 */
import { Platform } from 'react-native';

import { devLog, devWarn } from '../utils/devLog';

import { describeAppCheckClientPosture } from './appCheckClient';

export type ExpoReleaseTrustProfileLabel = 'mixed_pilot' | 'native_pilot' | 'web_commercial';

export function readExpoReleaseTrustProfileLabel(): ExpoReleaseTrustProfileLabel {
  const raw = process.env.EXPO_PUBLIC_RELEASE_TRUST_PROFILE?.trim().toLowerCase() ?? '';
  if (raw === 'native_pilot') return 'native_pilot';
  if (raw === 'web_commercial') return 'web_commercial';
  return 'mixed_pilot';
}

let nativeAppCheckNagLogged = false;

/**
 * Dev-only: log once on native when App Check is **not** attachable but release profile suggests commercial-native posture.
 */
export function maybeLogNativeAppCheckEnforcementRiskOnce(): void {
  if (!__DEV__ || nativeAppCheckNagLogged) return;
  if (Platform.OS === 'web') return;
  nativeAppCheckNagLogged = true;
  const posture = describeAppCheckClientPosture();
  if (posture.canAttachAppCheckToken) {
    devLogRuntimeTrustNativeReady(posture);
    return;
  }
  const profile = readExpoReleaseTrustProfileLabel();
  if (profile === 'web_commercial') return;
  devWarn('runtimeTrust', 'native_build_app_check_not_ready', {
    platform: posture.platform,
    reason: posture.reason,
    tokenSource: posture.tokenSource,
    enforcementRisk:
      'If Cloud Functions use FIREBASE_APP_CHECK_ENFORCE=1 without FIREBASE_APP_CHECK_NATIVE_EXPECTED=1, verify native tokens before enforcing. This build has not obtained an App Check token yet (missing native Firebase files, Expo Go, or init failure).',
    doc: 'docs/G5_PLATFORM_TRUST.md',
  });
}

function devLogRuntimeTrustNativeReady(posture: ReturnType<typeof describeAppCheckClientPosture>): void {
  if (!__DEV__) return;
  devLog('runtimeTrust', 'native_app_check_bridge_active', {
    platform: posture.platform,
    tokenSource: posture.tokenSource,
    doc: 'docs/G5_PLATFORM_TRUST.md',
  });
}
