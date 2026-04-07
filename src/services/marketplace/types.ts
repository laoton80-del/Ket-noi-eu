/**
 * Product-layer merchant verticals (UI + discovery). Grocery variants stay distinct; B2B maps 1:1 via
 * `b2bMarketplaceAdapter.marketplaceBusinessTypeToB2B` (retail vs wholesale).
 */
export type MarketplaceBusinessType =
  | 'nails'
  | 'restaurant'
  | 'clinic'
  | 'grocery_retail'
  | 'grocery_wholesale'
  | 'general';

export type MarketplaceUserContext = {
  location?: string | null;
  language: string;
  businessType: MarketplaceBusinessType;
  requestedTimeIso?: string | null;
};

export type MarketplaceMerchant = {
  id: string;
  name: string;
  businessType: MarketplaceBusinessType;
  locationHint?: string;
  distanceKm: number;
  rating: number;
  available: boolean;
  priceTier: 1 | 2 | 3;
  supportsAiBooking: boolean;
  b2bTenantId?: string;
  b2bLocationId?: string;
};

export type MarketplaceRankedMerchant = MarketplaceMerchant & {
  score: number;
  rankingReason: string[];
};

export type MarketplaceBestServiceResult = {
  selected: MarketplaceRankedMerchant | null;
  candidates: MarketplaceRankedMerchant[];
};

export type MarketplaceBookingResult = {
  status: 'confirmed' | 'failed';
  merchantId: string;
  feeCredits: number;
  conversionValue: number;
  outboundCallPrefill: string;
  confirmationMessage: string;
};

export type MarketplaceTransactionEvent = {
  bookingId: string;
  merchantId: string;
  businessType: MarketplaceBusinessType;
  status: 'confirmed' | 'failed';
  feeCredits: number;
  conversionValue: number;
  createdAt: number;
};
