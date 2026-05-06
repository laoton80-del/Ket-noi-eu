/**
 * Client-safe auth helpers for ViGlobal (B2B dial policy only).
 * Express / server code must import `loginWithPhoneAndPin` and session types from `./api/AuthService` directly
 * so Metro never bundles `jsonwebtoken` into the Expo web graph via this barrel.
 */
export {
  B2B_DOMESTIC_VIETNAM_PHONE_PREFIX,
  B2B_DOMESTIC_VIETNAM_PHONE_REJECT_MESSAGE,
  B2BDomesticVietnamPhoneNotAllowedError,
  isDomesticVietnamDialForMerchantPolicy,
  normalizePhoneForB2BPrefixCheck,
  registerMerchant,
} from './auth/b2bMerchantPhonePolicy';
