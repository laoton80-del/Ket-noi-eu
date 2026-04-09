/**
 * M1 — iOS / Android: `@react-native-firebase/app-check` modular API (DeviceCheck / App Attest / Play Integrity).
 *
 * **Truly implemented:** when this file is bundled (dev client / release native build), init + `getToken` run
 * against the native Firebase SDK. **Not available:** Expo Go, web, or builds without native Firebase config
 * (`google-services.json` / `GoogleService-Info.plist` + Console App Check providers).
 *
 * Debug / simulators: set `EXPO_PUBLIC_FIREBASE_APP_CHECK_USE_DEBUG_PROVIDER=1` and register
 * `EXPO_PUBLIC_FIREBASE_APP_CHECK_NATIVE_DEBUG_TOKEN` (or shared `EXPO_PUBLIC_FIREBASE_APP_CHECK_DEBUG_TOKEN`)
 * in Firebase Console → App Check → Manage debug tokens. `__DEV__` defaults to debug provider when no
 * production attestation is desired locally.
 *
 * @see https://rnfirebase.io/app-check/usage
 * @see docs/G5_PLATFORM_TRUST.md
 */
import { getApp } from '@react-native-firebase/app';
import type { AppCheck } from '@react-native-firebase/app-check';

/* Modular package re-exports `ReactNativeFirebaseAppCheckProvider` in a way some TS configs treat as type-only.
 * Runtime export exists (see dist/module/modular.js). */
// eslint-disable-next-line @typescript-eslint/no-require-imports
const rnfbAppCheck = require('@react-native-firebase/app-check') as {
  ReactNativeFirebaseAppCheckProvider: new () => { configure(options: Record<string, unknown>): void };
  initializeAppCheck: (app: ReturnType<typeof getApp>, options: unknown) => Promise<AppCheck>;
  getToken: (instance: AppCheck, forceRefresh?: boolean) => Promise<{ token: string }>;
};
const { ReactNativeFirebaseAppCheckProvider, initializeAppCheck, getToken } = rnfbAppCheck;

export type NativeAppCheckBridgeDescribe = {
  nativeBridgeActive: boolean;
  reason?: string;
  initAttempted: boolean;
  initOk: boolean;
  /** Last init error code / message (no secrets). */
  lastError: string | null;
  /** Intended provider mode for observability. */
  providerMode: 'debug' | 'production_attestation';
};

let initAttempted = false;
let nativeAppCheckInstance: AppCheck | null = null;
let lastInitError: string | null = null;

function readSharedDebugToken(): string | undefined {
  const a = process.env.EXPO_PUBLIC_FIREBASE_APP_CHECK_NATIVE_DEBUG_TOKEN?.trim();
  const b = process.env.EXPO_PUBLIC_FIREBASE_APP_CHECK_DEBUG_TOKEN?.trim();
  return a || b || undefined;
}

function shouldUseAppCheckDebugProvider(): boolean {
  if (process.env.EXPO_PUBLIC_FIREBASE_APP_CHECK_USE_DEBUG_PROVIDER === '1') return true;
  return __DEV__;
}

export function describeNativeAppCheckBridge(): NativeAppCheckBridgeDescribe {
  return {
    nativeBridgeActive: true,
    initAttempted,
    initOk: nativeAppCheckInstance !== null,
    lastError: lastInitError,
    providerMode: shouldUseAppCheckDebugProvider() ? 'debug' : 'production_attestation',
  };
}

/**
 * Initializes RN Firebase App Check once. Safe to call multiple times.
 * Returns true when an `AppCheck` instance is ready for `getToken`.
 */
export async function ensureNativeRnFirebaseAppCheck(): Promise<boolean> {
  if (nativeAppCheckInstance) return true;
  if (initAttempted) return false;

  initAttempted = true;
  lastInitError = null;

  try {
    const app = getApp();
    const debugToken = readSharedDebugToken();
    const debug = shouldUseAppCheckDebugProvider();

    const rnfbProvider = new ReactNativeFirebaseAppCheckProvider();
    rnfbProvider.configure({
      android: {
        provider: debug ? 'debug' : 'playIntegrity',
        debugToken,
      },
      apple: {
        provider: debug ? 'debug' : 'appAttestWithDeviceCheckFallback',
        debugToken,
      },
      web: {
        provider: 'reCaptchaV3',
        siteKey: process.env.EXPO_PUBLIC_FIREBASE_APP_CHECK_SITE_KEY?.trim() || 'unused-web-key',
      },
    });

    nativeAppCheckInstance = await initializeAppCheck(app, {
      provider: rnfbProvider,
      isTokenAutoRefreshEnabled: true,
    });
    return true;
  } catch (e) {
    nativeAppCheckInstance = null;
    lastInitError = e instanceof Error ? e.message : String(e);
    return false;
  }
}

export async function getNativeRnFirebaseAppCheckToken(forceRefresh = false): Promise<string | null> {
  const ok = await ensureNativeRnFirebaseAppCheck();
  if (!ok || !nativeAppCheckInstance) return null;
  try {
    const { token } = await getToken(nativeAppCheckInstance, forceRefresh);
    return token?.trim() ? token : null;
  } catch {
    return null;
  }
}
