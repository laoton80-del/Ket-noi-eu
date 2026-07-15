import type { MerchantProfile } from '@prisma/client';

import { findMerchantProfileByOwnerUserId } from './vionaMerchantProfileService';

export type VionaRequestMerchantProfileResolution = 'none' | 'single' | 'ambiguous';

export type VionaRequestReadPrincipalContext = Readonly<{
  authUserId: string;
  merchantProfile: Readonly<{
    id: string;
    tenantId: string;
    isActive: boolean;
  }> | null;
  merchantProfileResolution: VionaRequestMerchantProfileResolution;
}>;

export type ResolveVionaRequestReadPrincipalContextDeps = Readonly<{
  findMerchantProfileByOwner?: (ownerUserId: string) => Promise<MerchantProfile | null>;
  findMerchantProfilesByOwner?: (ownerUserId: string) => Promise<readonly MerchantProfile[]>;
}>;

function mapMerchantProfile(
  profile: MerchantProfile,
): NonNullable<VionaRequestReadPrincipalContext['merchantProfile']> {
  return {
    id: profile.id,
    tenantId: profile.tenantId,
    isActive: profile.isActive,
  };
}

/**
 * Resolve server-owned read principal context for one authenticated HTTP/service request.
 * Performs at most one bounded MerchantProfile lookup by unique ownerUserId.
 */
export async function resolveVionaRequestReadPrincipalContext(
  authUserId: string,
  deps: ResolveVionaRequestReadPrincipalContextDeps = {},
): Promise<VionaRequestReadPrincipalContext> {
  const trimmedAuthUserId = authUserId.trim();
  if (trimmedAuthUserId.length === 0) {
    return {
      authUserId: '',
      merchantProfile: null,
      merchantProfileResolution: 'none',
    };
  }

  if (deps.findMerchantProfilesByOwner != null) {
    const profiles = await deps.findMerchantProfilesByOwner(trimmedAuthUserId);
    if (profiles.length > 1) {
      return {
        authUserId: trimmedAuthUserId,
        merchantProfile: null,
        merchantProfileResolution: 'ambiguous',
      };
    }
    if (profiles.length === 1) {
      return {
        authUserId: trimmedAuthUserId,
        merchantProfile: mapMerchantProfile(profiles[0]!),
        merchantProfileResolution: 'single',
      };
    }
    return {
      authUserId: trimmedAuthUserId,
      merchantProfile: null,
      merchantProfileResolution: 'none',
    };
  }

  const findByOwner = deps.findMerchantProfileByOwner ?? findMerchantProfileByOwnerUserId;
  const profile = await findByOwner(trimmedAuthUserId);
  if (profile == null) {
    return {
      authUserId: trimmedAuthUserId,
      merchantProfile: null,
      merchantProfileResolution: 'none',
    };
  }

  return {
    authUserId: trimmedAuthUserId,
    merchantProfile: mapMerchantProfile(profile),
    merchantProfileResolution: 'single',
  };
}
