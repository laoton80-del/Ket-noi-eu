import { getAppCheck } from 'firebase-admin/app-check';
import { logger } from 'firebase-functions/v2';
import type { Request } from 'firebase-functions/v2/https';

/**
 * Firebase App Check (optional enforcement).
 *
 * ## Web vs native posture (D5 — explicit)
 *
 * | Platform | Sends `X-Firebase-AppCheck` when | With `FIREBASE_APP_CHECK_ENFORCE=1` |
 * |----------|-----------------------------------|--------------------------------------|
 * | **Expo web** | `EXPO_PUBLIC_FIREBASE_APP_CHECK_SITE_KEY` set + init OK | Can pass if token valid |
 * | **iOS/Android native** (dev client / store, Firebase plist/json) | `@react-native-firebase/app-check` bridge | Can pass if token valid |
 * | **Expo Go** | **Never** (no native bridge) | **401** `app_check_token_required` — do not claim native App Check |
 *
 * **Default (unset `FIREBASE_APP_CHECK_ENFORCE`):** App Check not required; Firebase **ID token** (or AI proxy rules) remain gates.
 *
 * **Unsafe combo (hard to miss):** `FIREBASE_APP_CHECK_ENFORCE=1` without `FIREBASE_APP_CHECK_NATIVE_EXPECTED=1` logs
 * **`app_check_enforce_WITHOUT_native_expected_UNSAFE_DEFAULT`** at **error** on cold start unless
 * `FIREBASE_APP_CHECK_WEB_ONLY_ENFORCEMENT=1` documents web-only routing. See `trustRuntimeDiagnostics.ts` + `docs/G5_PLATFORM_TRUST.md`.
 *
 * When enforcement is off but a token is present, we verify best-effort for observability only.
 *
 * **Surfaces (G2):** `aiProxy`, `walletOps`, `b2bStaffQueueSnapshot`. Missing token with enforcement off is **silent**;
 * invalid tokens emit `*_optional` warnings when enforcement is off.
 */
export async function verifyAppCheckForRequest(
  req: Request,
  context: 'aiProxy' | 'walletOps' | 'b2bStaffQueue'
): Promise<{ ok: true } | { ok: false; status: number; error: string }> {
  const enforce = process.env.FIREBASE_APP_CHECK_ENFORCE?.trim() === '1';
  const token = String(req.header('X-Firebase-AppCheck') ?? req.header('x-firebase-appcheck') ?? '').trim();

  if (!token) {
    if (enforce) {
      logger.error(`[${context}] app_check_missing_enforced`, {
        trust_gate: 'app_check',
        context,
        enforce: true,
        doc: 'docs/G5_PLATFORM_TRUST.md',
      });
      return { ok: false, status: 401, error: 'app_check_token_required' };
    }
    return { ok: true };
  }

  try {
    await getAppCheck().verifyToken(token);
    if (!enforce) {
      logger.info(`[${context}] app_check_ok_optional`, { trust_gate: 'app_check', context, enforce: false });
    }
    return { ok: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'verify_failed';
    if (enforce) {
      logger.warn(`[${context}] app_check_invalid`, { message: msg });
      return { ok: false, status: 401, error: 'app_check_invalid' };
    }
    logger.warn(`[${context}] app_check_invalid_optional`, { message: msg });
    return { ok: true };
  }
}
