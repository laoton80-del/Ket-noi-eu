/**
 * M1 — Web bundle: no native App Check module. Real tokens use `appCheckClient` web path only.
 */
export type NativeAppCheckBridgeDescribe = {
  nativeBridgeActive: boolean;
  reason?: string;
  initAttempted?: boolean;
  initOk?: boolean;
  lastError?: string | null;
  providerMode?: 'debug' | 'production_attestation';
};

export function describeNativeAppCheckBridge(): NativeAppCheckBridgeDescribe {
  return { nativeBridgeActive: false, reason: 'web_bundle_no_rn_firebase' };
}

export async function ensureNativeRnFirebaseAppCheck(): Promise<boolean> {
  return false;
}

export async function getNativeRnFirebaseAppCheckToken(_forceRefresh?: boolean): Promise<string | null> {
  return null;
}
