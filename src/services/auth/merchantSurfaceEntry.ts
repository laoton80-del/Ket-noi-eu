import { checkMerchantSurfacesAllowedByGps } from '../context/diasporaMerchantGate';
import { isDomesticVietnamDialForMerchantPolicy } from './b2bMerchantPhonePolicy';

export type MerchantSurfaceAccessDenied =
  | { readonly denied: true; readonly kind: 'vn_dial' }
  | { readonly denied: true; readonly kind: 'gps_vn'; readonly message: string };

export type MerchantSurfaceAccessResult = MerchantSurfaceAccessDenied | { readonly denied: false };

/**
 * B2B merchant surfaces: +84 handsets are B2C-only; GPS in Vietnam also blocks merchant workspace (diaspora ops).
 */
export async function evaluateMerchantSurfaceAccess(
  userPhone: string | undefined
): Promise<MerchantSurfaceAccessResult> {
  if (isDomesticVietnamDialForMerchantPolicy(userPhone ?? '')) {
    return { denied: true, kind: 'vn_dial' };
  }
  const gate = await checkMerchantSurfacesAllowedByGps();
  if (!gate.allowed) {
    return { denied: true, kind: 'gps_vn', message: gate.message };
  }
  return { denied: false };
}
