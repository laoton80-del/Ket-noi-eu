import type { B2BBusinessType } from '../../domain/b2b/models';
import type { RunAvailabilityInput } from '../b2b/ai/receptionistOrchestrator';
import type { MarketplaceRankedMerchant } from './types';

/**
 * Maps marketplace merchants to B2B engine input.
 *
 * **Phase 3:** `grocery_retail` and `grocery_wholesale` map to **distinct** `B2BBusinessType` values.
 * `clinic` and other non-nails/restaurant B2C types still map to **`grocery_retail`** for shared fulfillment
 * semantics until a dedicated `clinic` B2B vertical exists (explicit, not hidden `potraviny`).
 * Legacy Firestore tenants may still use `businessType: 'potraviny'` — see `b2bVerticalBridge`.
 */
export function marketplaceBusinessTypeToB2B(mt: MarketplaceRankedMerchant['businessType']): B2BBusinessType {
  if (mt === 'nails') return 'nails';
  if (mt === 'restaurant') return 'restaurant';
  if (mt === 'grocery_retail') return 'grocery_retail';
  if (mt === 'grocery_wholesale') return 'grocery_wholesale';
  return 'grocery_retail';
}

export function toB2BAvailabilityInput(
  merchant: MarketplaceRankedMerchant,
  startsAtMs: number,
  endsAtMs: number
): (RunAvailabilityInput & { mode: 'booking' }) | null {
  if (!merchant.b2bTenantId || !merchant.b2bLocationId) return null;
  return {
    mode: 'booking',
    tenantId: merchant.b2bTenantId,
    locationId: merchant.b2bLocationId,
    businessType: marketplaceBusinessTypeToB2B(merchant.businessType),
    startsAtMs,
    endsAtMs,
    resourceIds: [],
    partySize: 1,
  };
}
