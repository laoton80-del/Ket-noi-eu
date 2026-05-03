/**
 * Canonical auth surface for ViGlobal (barrel).
 * Phone+PIN login lives in `./api/AuthService`; B2B dial policy in `./auth/b2bMerchantPhonePolicy`.
 * Email OTP and server-only flows are wired from Express controllers — do not import Prisma modules from UI.
 */
export type { AuthLoginFailureReason, AuthLoginResult, AuthLoginSuccess, AuthUserProfile } from './api/AuthService';
export { loginWithPhoneAndPin } from './api/AuthService';

export {
  B2B_DOMESTIC_VIETNAM_PHONE_PREFIX,
  B2B_DOMESTIC_VIETNAM_PHONE_REJECT_MESSAGE,
  B2BDomesticVietnamPhoneNotAllowedError,
  isDomesticVietnamDialForMerchantPolicy,
  normalizePhoneForB2BPrefixCheck,
  registerMerchant,
} from './auth/b2bMerchantPhonePolicy';
