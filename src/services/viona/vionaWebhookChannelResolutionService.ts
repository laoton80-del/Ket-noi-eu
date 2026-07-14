/**
 * Pack35 — B2B Omni-Channel Webhook & Agent Routing: channel -> merchant resolution.
 *
 * Resolves the untrusted `(channelType, channelExternalId)` pair claimed by an inbound webhook
 * payload to exactly one `VionaMerchantWebhookChannel` row + its linked `MerchantProfile` — the
 * payload's own claimed identity is never trusted for anything beyond this lookup key. See
 * docs/product/VIONA_PACK35_B2B_WEBHOOK_ROUTING_PLAN.md §4.3/§5.2.
 *
 * `VionaMerchantWebhookChannel.merchantProfileId` is an id-only reference (no Prisma
 * relation/foreign key — mirrors the existing `VionaRequestEscrowHold.holdTransactionId` "id
 * only" pattern in `prisma/schema.prisma`), so this file queries `MerchantProfile` directly via
 * `getPrisma()` rather than importing/modifying `vionaMerchantProfileService.ts` (explicitly
 * listed as untouched — plan §7).
 *
 * Deliberately split into two steps — `resolveVionaWebhookChannel()` (existence lookup only) and
 * `assertVionaWebhookChannelGate()` (active/tenant checks) — so the caller can run signature
 * verification (§4.2) *between* them, exactly matching the plan's §5.2 step ordering: an inactive
 * channel/merchant must still pass signature verification first (401 before 403), never leak its
 * inactive state to an unauthenticated caller via a different status code.
 */

import { getPrisma } from '../../lib/prisma';
import {
  assertVionaRequestTenantMatchesMerchant,
  type VionaMerchantTenantScopeCheckResult,
} from '../../lib/viona/merchant/vionaMerchantTenantScope';

export type ResolvedVionaWebhookChannel = Readonly<{
  channelId: string;
  channelType: string;
  channelExternalId: string;
  channelIsActive: boolean;
  /** Used directly as the HMAC verification key for this channel — see module header of
   *  `vionaWebhookSignatureVerificationService.ts` for why this is not a one-way password hash. */
  signingSecretHash: string;
  standingApprovalForReadOnlyToolsOnly: boolean;
  merchantProfileId: string;
  tenantId: string;
  merchantOwnerUserId: string;
  merchantIsActive: boolean;
  merchantToolScope: readonly string[];
}>;

export type ResolveVionaWebhookChannelResult =
  | Readonly<{ ok: true; channel: ResolvedVionaWebhookChannel }>
  | Readonly<{ ok: false; reason: 'channel_not_found' }>;

/**
 * Existence-only lookup — deliberately never checks `isActive` on either row (see module
 * header). Never throws; a missing channel row or a missing/dangling linked `MerchantProfile`
 * both resolve to the same `channel_not_found` reason, never a distinct code that could let an
 * unauthenticated caller distinguish "channel row missing" from "merchant row missing".
 */
export async function resolveVionaWebhookChannel(
  channelType: string,
  channelExternalId: string,
): Promise<ResolveVionaWebhookChannelResult> {
  const trimmedType = channelType.trim();
  const trimmedExternalId = channelExternalId.trim();
  if (trimmedType.length === 0 || trimmedExternalId.length === 0) {
    return { ok: false, reason: 'channel_not_found' };
  }

  const prisma = getPrisma();

  const channelRow = await prisma.vionaMerchantWebhookChannel.findUnique({
    where: { channelType_channelExternalId: { channelType: trimmedType, channelExternalId: trimmedExternalId } },
  });
  if (channelRow == null) {
    return { ok: false, reason: 'channel_not_found' };
  }

  const merchantRow = await prisma.merchantProfile.findUnique({ where: { id: channelRow.merchantProfileId } });
  if (merchantRow == null) {
    return { ok: false, reason: 'channel_not_found' };
  }

  return {
    ok: true,
    channel: {
      channelId: channelRow.id,
      channelType: channelRow.channelType,
      channelExternalId: channelRow.channelExternalId,
      channelIsActive: channelRow.isActive,
      signingSecretHash: channelRow.signingSecretHash,
      standingApprovalForReadOnlyToolsOnly: channelRow.standingApprovalForReadOnlyToolsOnly,
      merchantProfileId: merchantRow.id,
      tenantId: merchantRow.tenantId,
      merchantOwnerUserId: merchantRow.ownerUserId,
      merchantIsActive: merchantRow.isActive,
      merchantToolScope: merchantRow.toolScope,
    },
  };
}

export type VionaWebhookChannelGateResult =
  | Readonly<{ ok: true }>
  | Readonly<{ ok: false; reason: 'channel_inactive' | 'merchant_inactive' | 'tenant_mismatch' }>;

/**
 * Fail-closed ordering matches `assertVionaRequestTenantMatchesMerchant()`'s own convention:
 * channel-level inactive is checked first (it is this file's own, additional gate), then the
 * existing, unmodified Pack34 gate is reused verbatim for the merchant-level checks — never
 * reimplemented ad hoc.
 */
export function assertVionaWebhookChannelGate(channel: ResolvedVionaWebhookChannel): VionaWebhookChannelGateResult {
  if (!channel.channelIsActive) {
    return { ok: false, reason: 'channel_inactive' };
  }

  const tenantCheck: VionaMerchantTenantScopeCheckResult = assertVionaRequestTenantMatchesMerchant(channel.tenantId, {
    tenantId: channel.tenantId,
    isActive: channel.merchantIsActive,
  });
  if (!tenantCheck.ok) {
    return { ok: false, reason: tenantCheck.reason === 'merchant_inactive' ? 'merchant_inactive' : 'tenant_mismatch' };
  }

  return { ok: true };
}
