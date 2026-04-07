/**
 * M1 — Firebase App Check (client): **web + native (dev client / store builds)** with truth-first posture.
 *
 * - **Web (Expo web):** `firebase/app-check` + ReCAPTCHA Enterprise when `EXPO_PUBLIC_FIREBASE_APP_CHECK_SITE_KEY` is set.
 * - **iOS / Android (native bundle):** `@react-native-firebase/app-check` via `nativeAppCheckBridge.native.ts`
 *   (Play Integrity / App Attest / DeviceCheck, or **debug** in `__DEV__` or when
 *   `EXPO_PUBLIC_FIREBASE_APP_CHECK_USE_DEBUG_PROVIDER=1`). Requires a **development or production native build**
 *   with Firebase native config (`google-services.json` / `GoogleService-Info.plist`); **not** Expo Go.
 *
 * When `FIREBASE_APP_CHECK_ENFORCE=1` on Functions, clients must send a valid `X-Firebase-AppCheck` header.
 * Do not enable enforcement for native traffic until native builds are verified (see `scripts/trust-native-readiness.mjs`
 * and `FIREBASE_APP_CHECK_NATIVE_EXPECTED=1` on the server after verification).
 *
 * @see docs/G3_APP_CHECK_AND_RELEASE.md
 * @see docs/G5_PLATFORM_TRUST.md
 */
import { Platform } from 'react-native';

import { devLog } from '../utils/devLog';
import { getFirebaseApp, isFirebaseClientConfigured } from './firebaseApp';
import {
  describeNativeAppCheckBridge,
  ensureNativeRnFirebaseAppCheck,
  getNativeRnFirebaseAppCheckToken,
} from './nativeAppCheckBridge';

import type { AppCheck } from 'firebase/app-check';

let webInitAttempted = false;
let webAppCheckInstance: AppCheck | null = null;

export type AppCheckTokenSource = 'none' | 'web_recaptcha_enterprise' | 'native_rn_firebase';

export type AppCheckClientPosture = {
  platform: typeof Platform.OS;
  /** True when this client can obtain a real App Check JWT for the current platform (after init succeeds). */
  canAttachAppCheckToken: boolean;
  /** Human-readable reason when `canAttachAppCheckToken` is false. */
  reason: string;
  /** Where a successful token would come from; `none` if not attachable. */
  tokenSource: AppCheckTokenSource;
};

export type AppCheckTrustDiagnostics = {
  platform: typeof Platform.OS;
  posture: AppCheckClientPosture;
  /** Whether `getOptionalAppCheckHeader()` returned a non-empty token in this probe (no token logged). */
  headerProbeOk: boolean;
};

export function describeAppCheckClientPosture(): AppCheckClientPosture {
  if (!isFirebaseClientConfigured()) {
    return {
      platform: Platform.OS,
      canAttachAppCheckToken: false,
      reason: 'firebase_client_not_configured',
      tokenSource: 'none',
    };
  }

  if (Platform.OS === 'web') {
    const siteKey = process.env.EXPO_PUBLIC_FIREBASE_APP_CHECK_SITE_KEY?.trim() ?? '';
    if (!siteKey) {
      return {
        platform: 'web',
        canAttachAppCheckToken: false,
        reason: 'web_missing_EXPO_PUBLIC_FIREBASE_APP_CHECK_SITE_KEY',
        tokenSource: 'none',
      };
    }
    if (webAppCheckInstance) {
      return {
        platform: 'web',
        canAttachAppCheckToken: true,
        reason: 'initialized',
        tokenSource: 'web_recaptcha_enterprise',
      };
    }
    if (webInitAttempted) {
      return {
        platform: 'web',
        canAttachAppCheckToken: false,
        reason: 'init_failed_or_pending',
        tokenSource: 'none',
      };
    }
    return {
      platform: 'web',
      canAttachAppCheckToken: false,
      reason: 'not_yet_initialized',
      tokenSource: 'none',
    };
  }

  const nb = describeNativeAppCheckBridge();
  if (!nb.nativeBridgeActive) {
    return {
      platform: Platform.OS,
      canAttachAppCheckToken: false,
      reason: nb.reason ?? 'native_bridge_inactive',
      tokenSource: 'none',
    };
  }
  if (nb.initOk) {
    return {
      platform: Platform.OS,
      canAttachAppCheckToken: true,
      reason: 'native_rn_firebase_initialized',
      tokenSource: 'native_rn_firebase',
    };
  }
  if (nb.initAttempted && !nb.initOk) {
    return {
      platform: Platform.OS,
      canAttachAppCheckToken: false,
      reason: nb.lastError ? `native_init_failed:${nb.lastError}` : 'native_init_failed',
      tokenSource: 'none',
    };
  }
  return {
    platform: Platform.OS,
    canAttachAppCheckToken: false,
    reason: 'native_not_yet_initialized',
    tokenSource: 'none',
  };
}

/**
 * Best-effort init. Web: Firebase JS App Check. Native: RN Firebase App Check (modular).
 */
export async function ensureFirebaseAppCheckInitialized(): Promise<boolean> {
  if (Platform.OS === 'web') {
    if (webAppCheckInstance) return true;
    if (webInitAttempted) return false;

    const app = getFirebaseApp();
    if (!app) {
      webInitAttempted = true;
      return false;
    }

    const siteKey = process.env.EXPO_PUBLIC_FIREBASE_APP_CHECK_SITE_KEY?.trim() ?? '';
    if (!siteKey) {
      webInitAttempted = true;
      return false;
    }

    webInitAttempted = true;

    const debugTok = process.env.EXPO_PUBLIC_FIREBASE_APP_CHECK_DEBUG_TOKEN?.trim();
    const debugFlag = process.env.EXPO_PUBLIC_FIREBASE_APP_CHECK_DEBUG === '1';

    try {
      if (typeof window !== 'undefined') {
        const w = window as Window & { FIREBASE_APPCHECK_DEBUG_TOKEN?: boolean | string };
        if (debugTok) w.FIREBASE_APPCHECK_DEBUG_TOKEN = debugTok;
        else if (debugFlag) w.FIREBASE_APPCHECK_DEBUG_TOKEN = true;
      }

      const { initializeAppCheck, ReCaptchaEnterpriseProvider } = await import('firebase/app-check');
      webAppCheckInstance = initializeAppCheck(app, {
        provider: new ReCaptchaEnterpriseProvider(siteKey),
        isTokenAutoRefreshEnabled: true,
      });

      if (__DEV__) {
        devLog('appCheck', 'app_check_initialized_web', { siteKeyPresent: true });
      }
      return true;
    } catch (e) {
      webAppCheckInstance = null;
      if (__DEV__) {
        devLog('appCheck', 'app_check_init_failed', { message: e instanceof Error ? e.message : String(e) });
      }
      return false;
    }
  }

  return ensureNativeRnFirebaseAppCheck();
}

/** Short-lived token for `X-Firebase-AppCheck`, or null if not available. */
export async function getOptionalAppCheckHeader(): Promise<string | null> {
  if (Platform.OS === 'web') {
    await ensureFirebaseAppCheckInitialized();
    if (!webAppCheckInstance) return null;
    try {
      const { getToken } = await import('firebase/app-check');
      const { token } = await getToken(webAppCheckInstance, false);
      return token?.trim() ? token : null;
    } catch {
      return null;
    }
  }

  await ensureNativeRnFirebaseAppCheck();
  return getNativeRnFirebaseAppCheckToken(false);
}

/**
 * Dev / support: one structured snapshot — does **not** log the token. Prefer in __DEV__ or gated diagnostics.
 */
export async function getAppCheckTrustDiagnostics(): Promise<AppCheckTrustDiagnostics> {
  const header = await getOptionalAppCheckHeader();
  const posture = describeAppCheckClientPosture();
  return {
    platform: Platform.OS,
    posture,
    headerProbeOk: Boolean(header),
  };
}
