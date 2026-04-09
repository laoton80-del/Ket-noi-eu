import type { B2BBusinessType, B2BResourceKind, BusinessOrder } from './models';

/**
 * Engine policies keyed by `B2BBusinessType`.
 *
 * **Phase 3:** Retail / wholesale / legacy use **distinct** resource kind constants; overlap engines may still
 * share Firestore transaction code paths — see `b2bVerticalBridge.fulfillmentEngineFamily`.
 */

/** Resource kinds allowed per vertical. */
export const RESOURCE_KINDS_BY_BUSINESS: Record<B2BBusinessType, B2BResourceKind[]> = {
  nails: ['nail_table', 'foot_chair'],
  restaurant: ['restaurant_table'],
  grocery_retail: ['grocery_retail_fulfillment_slot'],
  grocery_wholesale: ['grocery_wholesale_fulfillment_slot'],
  hospitality_stay: ['hospitality_room'],
  potraviny: ['potraviny_fulfillment_slot'],
};

export type NailsBookingConstraints = {
  /** No overlap on same nail_table / foot_chair for [startsAt, endsAt). */
  enforceResourceExclusive: true;
  serviceDurationRequired: true;
};

export type RestaurantBookingConstraints = {
  partySizeMin: number;
  partySizeMax: number;
  tableCapacityMustFitParty: true;
};

export type PotravinyOrderConstraints = {
  allowDelivery: boolean;
  allowPickup: boolean;
  maxItemsPerOrder?: number;
};

export type GroceryRetailOrderConstraints = {
  allowDelivery: boolean;
  allowPickup: boolean;
  maxItemsPerOrder?: number;
};

export type GroceryWholesaleOrderConstraints = {
  allowDelivery: boolean;
  allowPickup: boolean;
  maxLinesPerOrder?: number;
  /** Require explicit line clarification before “qualified” state. */
  requireLineConfirmation: boolean;
};

export type HospitalityStayConstraints = {
  maxGuestsPerRoom?: number;
  minStayNights?: number;
  /** If true, voice/booking flow should label outcome as inquiry until staff confirms. */
  defaultInquiryFirst: boolean;
};

export type BusinessTypePolicy = {
  type: B2BBusinessType;
  nails?: NailsBookingConstraints;
  restaurant?: RestaurantBookingConstraints;
  potraviny?: PotravinyOrderConstraints;
  grocery_retail?: GroceryRetailOrderConstraints;
  grocery_wholesale?: GroceryWholesaleOrderConstraints;
  hospitality_stay?: HospitalityStayConstraints;
};

export function defaultPolicy(type: B2BBusinessType): BusinessTypePolicy {
  switch (type) {
    case 'nails':
      return {
        type,
        nails: { enforceResourceExclusive: true, serviceDurationRequired: true },
      };
    case 'restaurant':
      return {
        type,
        restaurant: { partySizeMin: 1, partySizeMax: 20, tableCapacityMustFitParty: true },
      };
    case 'potraviny':
      return {
        type,
        potraviny: { allowDelivery: true, allowPickup: true, maxItemsPerOrder: 80 },
      };
    case 'grocery_retail':
      return {
        type,
        grocery_retail: { allowDelivery: true, allowPickup: true, maxItemsPerOrder: 120 },
      };
    case 'grocery_wholesale':
      return {
        type,
        grocery_wholesale: {
          allowDelivery: true,
          allowPickup: true,
          maxLinesPerOrder: 200,
          requireLineConfirmation: true,
        },
      };
    case 'hospitality_stay':
      return {
        type,
        hospitality_stay: {
          maxGuestsPerRoom: 6,
          minStayNights: 1,
          /** Enforced on voice `commit_booking` via `billable: false` + `isInquiryOnly` (see Cloud Function). */
          defaultInquiryFirst: true,
        },
      };
  }
}

/** Engine hooks — implemented in services/b2b/engines (Firestore transactions). */
export type AvailabilityCheckInput = {
  tenantId: string;
  locationId: string;
  businessType: B2BBusinessType;
  startsAtMs: number;
  endsAtMs: number;
  resourceIds: string[];
  partySize?: number;
};

export type OrderCapacityInput = {
  tenantId: string;
  locationId: string;
  windowStartMs: number;
  windowEndMs: number;
  fulfillment: BusinessOrder['fulfillment'];
};
