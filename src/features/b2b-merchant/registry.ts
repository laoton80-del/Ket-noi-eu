/**
 * Future merchant console boundaries — wire into React Navigation when B2B app shell ships.
 * Keeps dashboards isolated per concern (CQRS-friendly: bookings read models vs settings writes).
 */
export const B2B_MERCHANT_ROUTE_GROUPS = {
  operations: ['BookingsList', 'BookingDetail', 'OrdersList', 'OrderDetail'] as const,
  catalog: ['ServicesCatalog', 'ResourcesCapacity'] as const,
  settings: ['BusinessProfile', 'HoursPhones', 'AiVoiceSettings'] as const,
  billing: ['Subscription', 'UsageLedger', 'PaymentMethods'] as const,
  analytics: ['CallVolume', 'ConversionFunnel', 'RevenueAttribution'] as const,
} as const;

export type B2BMerchantRouteGroup = keyof typeof B2B_MERCHANT_ROUTE_GROUPS;
