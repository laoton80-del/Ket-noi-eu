/**
 * G3 / M1 — Optional App Check header for Cloud Functions that use `verifyAppCheckForRequest`.
 * Does not add fake tokens; merges only when `getOptionalAppCheckHeader` succeeds (web ReCAPTCHA Enterprise
 * or native `@react-native-firebase/app-check` when initialized).
 */
import { getOptionalAppCheckHeader } from '../config/appCheckClient';

export async function mergeTrustBackendHeaders(base: Record<string, string>): Promise<Record<string, string>> {
  const out = { ...base };
  const token = await getOptionalAppCheckHeader();
  if (token) out['X-Firebase-AppCheck'] = token;
  return out;
}
