import type { Prisma } from '@prisma/client';

export type VionaRequestNoteMerchantProfileResolution = 'none' | 'single' | 'ambiguous';

export type VionaRequestNotePrincipalContext = Readonly<{
  authUserId: string;
  merchantProfile: Readonly<{
    id: string;
    ownerUserId: string;
    tenantId: string;
    isActive: boolean;
  }> | null;
  merchantProfileResolution: VionaRequestNoteMerchantProfileResolution;
}>;

const MERCHANT_PROFILE_AUTH_SELECT = {
  id: true,
  ownerUserId: true,
  tenantId: true,
  isActive: true,
} as const;

export type NotePrincipalMerchantProfileClient = Pick<
  Prisma.TransactionClient,
  'merchantProfile'
>;

export type ResolveVionaRequestNotePrincipalContextDeps = Readonly<{
  findMerchantProfilesByOwner?: (
    ownerUserId: string,
  ) => Promise<
    readonly Readonly<{
      id: string;
      ownerUserId: string;
      tenantId: string;
      isActive: boolean;
    }>[]
  >;
}>;

/**
 * Resolve server-owned note-mutation principal context inside an interactive transaction.
 * Performs at most one bounded MerchantProfile lookup by unique ownerUserId on the tx client.
 */
export async function resolveVionaRequestNotePrincipalContext(
  authUserId: string,
  tx: NotePrincipalMerchantProfileClient,
  deps: ResolveVionaRequestNotePrincipalContextDeps = {},
): Promise<VionaRequestNotePrincipalContext> {
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
        merchantProfile: profiles[0]!,
        merchantProfileResolution: 'single',
      };
    }
    return {
      authUserId: trimmedAuthUserId,
      merchantProfile: null,
      merchantProfileResolution: 'none',
    };
  }

  const profile = await tx.merchantProfile.findUnique({
    where: { ownerUserId: trimmedAuthUserId },
    select: MERCHANT_PROFILE_AUTH_SELECT,
  });

  if (profile == null) {
    return {
      authUserId: trimmedAuthUserId,
      merchantProfile: null,
      merchantProfileResolution: 'none',
    };
  }

  return {
    authUserId: trimmedAuthUserId,
    merchantProfile: profile,
    merchantProfileResolution: 'single',
  };
}
