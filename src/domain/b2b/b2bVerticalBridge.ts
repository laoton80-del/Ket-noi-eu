import type { B2BBusinessType } from './models';

/**
 * Phase 3 — explicit mapping between **product verticals** and **fulfillment engine families**.
 * Firestore resource overlap + booking/order engines may still share implementations; this module is the
 * single place to read “what bucket does this tenant type use?” without hidden `potraviny` spread.
 */

/** Engine-shaped grouping (not necessarily 1:1 with Firestore collections). */
export type B2BFulfillmentEngineFamily =
  | 'nails'
  | 'restaurant'
  | 'grocery_retail_fulfillment'
  | 'grocery_wholesale_fulfillment'
  | 'hospitality_stay'
  /** Legacy tenant rows still storing `businessType: 'potraviny'` — treat like retail fulfillment until migrated. */
  | 'legacy_potraviny_fulfillment';

export function fulfillmentEngineFamily(bt: B2BBusinessType): B2BFulfillmentEngineFamily {
  switch (bt) {
    case 'nails':
      return 'nails';
    case 'restaurant':
      return 'restaurant';
    case 'grocery_retail':
      return 'grocery_retail_fulfillment';
    case 'grocery_wholesale':
      return 'grocery_wholesale_fulfillment';
    case 'hospitality_stay':
      return 'hospitality_stay';
    case 'potraviny':
      return 'legacy_potraviny_fulfillment';
  }
}

export function usesOrderIntentFlow(bt: B2BBusinessType): boolean {
  return (
    bt === 'grocery_retail' ||
    bt === 'grocery_wholesale' ||
    bt === 'potraviny'
  );
}

export function usesStayBookingIntentFlow(bt: B2BBusinessType): boolean {
  return bt === 'hospitality_stay';
}

/** Slot keys collected in voice before confirmation (see `bookingSlotExtraction`). */
export type B2BBookingSlotKey =
  | 'service'
  | 'time'
  | 'name'
  | 'stayCheckIn'
  | 'stayCheckOut'
  | 'occupancy';

export function requiredBookingSlotKeys(bt: B2BBusinessType): B2BBookingSlotKey[] {
  if (bt === 'hospitality_stay') {
    return ['stayCheckIn', 'stayCheckOut', 'occupancy', 'name'];
  }
  return ['service', 'time', 'name'];
}

/**
 * Retail vs wholesale vs legacy — for merchant copy and analytics. Does not imply separate Firestore engines yet.
 */
export function grocerySegmentLabel(bt: B2BBusinessType): 'retail' | 'wholesale' | 'legacy' | 'n/a' {
  if (bt === 'grocery_retail') return 'retail';
  if (bt === 'grocery_wholesale') return 'wholesale';
  if (bt === 'potraviny') return 'legacy';
  return 'n/a';
}
