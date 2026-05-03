/**
 * GPS-based gate: merchant/B2B workspace surfaces are for diaspora operations outside Vietnam.
 * Users physically detected in Vietnam may still use B2C (travel, wallet, learning, etc.).
 */

import { getTravelContext } from './UserContextService';

export const MERCHANT_GPS_VIETNAM_BORDER_MESSAGE =
  'Kết Nối Global: tài khoản và công cụ doanh nghiệp (B2B) chỉ dành cho Kiều bào hoạt động ngoài lãnh thổ Việt Nam. Bạn vẫn có thể dùng đầy đủ dịch vụ B2C — ví dụ đặt khách sạn cho chuyến đi Châu Âu, ví, học tập.' as const;

export class MerchantSurfacesBlockedInVietnamGpsError extends Error {
  readonly code = 'merchant_gps_vn_border' as const;

  constructor(message: string = MERCHANT_GPS_VIETNAM_BORDER_MESSAGE) {
    super(message);
    this.name = 'MerchantSurfacesBlockedInVietnamGpsError';
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export type MerchantGpsGateOptions = Readonly<{
  /** Forwarded to `getTravelContext` — avoid persisting welcome city when only checking policy. */
  readonly skipPersistCity?: boolean;
}>;

/**
 * Throws when reverse-geocoded country is Vietnam — caller should keep user on B2C flows only.
 */
export async function assertMerchantSurfacesAllowedByGps(
  options?: MerchantGpsGateOptions
): Promise<void> {
  const ctx = await getTravelContext({
    skipPersistCity: options?.skipPersistCity ?? true,
  });
  if (ctx.isDomesticVN) {
    throw new MerchantSurfacesBlockedInVietnamGpsError();
  }
}

export type MerchantGpsGateResult =
  | { readonly allowed: true }
  | { readonly allowed: false; readonly message: string };

/** Same policy as `assertMerchantSurfacesAllowedByGps`, but returns a result for UI (`Alert`) instead of throwing on GPS border. */
export async function checkMerchantSurfacesAllowedByGps(
  options?: MerchantGpsGateOptions
): Promise<MerchantGpsGateResult> {
  try {
    await assertMerchantSurfacesAllowedByGps(options);
    return { allowed: true };
  } catch (e) {
    if (e instanceof MerchantSurfacesBlockedInVietnamGpsError) {
      return { allowed: false, message: e.message };
    }
    throw e;
  }
}
