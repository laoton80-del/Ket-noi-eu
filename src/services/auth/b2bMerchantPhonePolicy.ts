/**
 * B2C: +84 (Vietnam dial) users are full customers.
 * B2B merchant registration: diaspora-only — +84 handsets cannot `registerMerchant()`.
 */

export const B2B_DOMESTIC_VIETNAM_PHONE_PREFIX = '+84' as const;

export const B2B_DOMESTIC_VIETNAM_PHONE_REJECT_MESSAGE =
  'Rất tiếc! Hệ thống kinh doanh B2B của KNG hiện chỉ hỗ trợ các doanh nghiệp Kiều bào đang hoạt động tại nước ngoài.' as const;

export class B2BDomesticVietnamPhoneNotAllowedError extends Error {
  readonly code = 'b2b_domestic_vn_phone' as const;

  constructor(message: string = B2B_DOMESTIC_VIETNAM_PHONE_REJECT_MESSAGE) {
    super(message);
    this.name = 'B2BDomesticVietnamPhoneNotAllowedError';
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/**
 * Normalizes user input toward E.164-style strings starting with `+` for prefix checks only.
 * Vietnam national mobile (`0…`) maps to `+84…` so domestic lines cannot bypass with omitted country code.
 */
export function normalizePhoneForB2BPrefixCheck(raw: string): string {
  let s = raw.trim().replace(/\s+/g, '');
  if (s.startsWith('00')) {
    s = `+${s.slice(2)}`;
  }
  if (!s.startsWith('+')) {
    const digits = s.replace(/\D/g, '');
    if (digits.length === 0) return s;
    if (digits.startsWith('84')) return `+${digits}`;
    if (digits.startsWith('0') && digits.length >= 9 && digits.length <= 11) {
      return `+84${digits.slice(1)}`;
    }
    return `+${digits}`;
  }
  return s;
}

/** True when the dial is Vietnam (+84), including common national `0…` forms — for B2B merchant policy only. */
export function isDomesticVietnamDialForMerchantPolicy(raw: string): boolean {
  const normalized = normalizePhoneForB2BPrefixCheck(raw);
  return normalized.startsWith(B2B_DOMESTIC_VIETNAM_PHONE_PREFIX);
}

/**
 * Validates MSISDN before any **B2B merchant** persistence (onboarding lead, Stripe Connect, dashboard provisioning).
 * Does **not** apply to B2C sign-in or profile completion.
 * @throws {B2BDomesticVietnamPhoneNotAllowedError} If the number is Vietnam +84 under merchant policy.
 */
export function registerMerchant(phoneNumber: string): void {
  if (isDomesticVietnamDialForMerchantPolicy(phoneNumber)) {
    throw new B2BDomesticVietnamPhoneNotAllowedError();
  }
}
