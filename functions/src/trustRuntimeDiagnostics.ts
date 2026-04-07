/**
 * G2 / M1 — one-shot cold-start log of server-side trust-related env posture.
 * Does not log secrets; values are booleans / short string labels only.
 */
import { logger } from 'firebase-functions/v2';

let logged = false;

export function logRuntimeTrustPostureOnce(): void {
  if (logged) return;
  logged = true;
  const appCheckEnforced = process.env.FIREBASE_APP_CHECK_ENFORCE?.trim() === '1';
  const appCheckNativeExpected = process.env.FIREBASE_APP_CHECK_NATIVE_EXPECTED?.trim() === '1';
  const aiProxyAuthRequired = process.env.AI_PROXY_REQUIRE_AUTH?.trim() !== '0';
  const receiptEnforced = process.env.WALLET_TOPUP_REQUIRE_PAYMENT_RECEIPT?.trim() === '1';
  const trustProfile = (process.env.RUNTIME_TRUST_PROFILE ?? 'pilot_default').trim() || 'pilot_default';
  logger.info('[trust_runtime] cold_start_posture', {
    trust_profile: trustProfile,
    app_check_enforced: appCheckEnforced,
    app_check_native_expected: appCheckNativeExpected,
    ai_proxy_auth_required: aiProxyAuthRequired,
    wallet_topup_receipt_enforced: receiptEnforced,
    wallet_topup_receipt_require_wallet_uid: process.env.WALLET_TOPUP_RECEIPT_REQUIRE_WALLET_UID?.trim() === '1',
    wallet_topup_receipt_require_credits_grant: process.env.WALLET_TOPUP_RECEIPT_REQUIRE_CREDITS_GRANT?.trim() === '1',
  });

  if (appCheckEnforced) {
    if (appCheckNativeExpected) {
      logger.info('[trust_runtime] app_check_enforce_with_native_expected', {
        reminder:
          'FIREBASE_APP_CHECK_ENFORCE=1 and FIREBASE_APP_CHECK_NATIVE_EXPECTED=1: operators assert iOS/Android clients send X-Firebase-AppCheck (M1: @react-native-firebase/app-check). Revoke NATIVE_EXPECTED if store builds regress. Web uses EXPO_PUBLIC_FIREBASE_APP_CHECK_SITE_KEY. See docs/G5_PLATFORM_TRUST.md',
      });
    } else {
      const webOnlyAck = process.env.FIREBASE_APP_CHECK_WEB_ONLY_ENFORCEMENT?.trim() === '1';
      if (webOnlyAck) {
        logger.warn('[trust_runtime] app_check_enforce_WEB_ONLY_ACK', {
          reminder:
            'FIREBASE_APP_CHECK_WEB_ONLY_ENFORCEMENT=1: operators assert this deployment is never hit by native/Expo Go without tokens (401 on gated HTTPS when enforce=1). If native traffic shares this URL, fix routing or set FIREBASE_APP_CHECK_NATIVE_EXPECTED=1 after M1 verification. docs/G5_PLATFORM_TRUST.md',
        });
      } else {
        logger.error('[trust_runtime] app_check_enforce_WITHOUT_native_expected_UNSAFE_DEFAULT', {
          reminder:
            'FIREBASE_APP_CHECK_ENFORCE=1 without FIREBASE_APP_CHECK_NATIVE_EXPECTED=1: native dev-client/store builds that lack a valid App Check token will get 401 on aiProxy/walletOps/b2bStaffQueueSnapshot. Expo Go cannot send native App Check. After verifying native tokens E2E, set FIREBASE_APP_CHECK_NATIVE_EXPECTED=1. For deliberately web-only enforced backends, set FIREBASE_APP_CHECK_WEB_ONLY_ENFORCEMENT=1 (see docs/G5_PLATFORM_TRUST.md).',
        });
      }
    }
  }
}
