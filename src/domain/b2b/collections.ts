/**
 * Firestore layout — all business data under tenants/{tenantId}/...
 * Phone routing uses a global index for O(1) lookup from inbound DID.
 *
 * Tenant boundary rule: tenantId for orchestration is always derived from the inbound DID (`to`)
 * via `b2b_phone_routes`, not from client-supplied tenant hints.
 */

export const B2B_ROOT = {
  tenants: 'b2b_tenants',
  locations: 'locations',
  services: 'business_services',
  resources: 'business_resources',
  bookings: 'business_bookings',
  orders: 'business_orders',
  callSessions: 'business_call_sessions',
  billingEvents: 'business_billing_events',
  staff: 'business_staff_accounts',
  /** Maps E.164 inbound number → tenant + location (written only by backend). */
  phoneRouteIndex: 'b2b_phone_routes',
} as const;

export function tenantDocPath(tenantId: string): string {
  return `${B2B_ROOT.tenants}/${tenantId}`;
}

export function tenantSubcollection(tenantId: string, name: string): string {
  return `${tenantDocPath(tenantId)}/${name}`;
}

export function locationCollectionPath(tenantId: string): string {
  return tenantSubcollection(tenantId, B2B_ROOT.locations);
}

export function locationDocPath(tenantId: string, locationId: string): string {
  return `${locationCollectionPath(tenantId)}/${locationId}`;
}

export function servicesCollectionPath(tenantId: string): string {
  return tenantSubcollection(tenantId, B2B_ROOT.services);
}

export function resourcesCollectionPath(tenantId: string): string {
  return tenantSubcollection(tenantId, B2B_ROOT.resources);
}

export function bookingsCollectionPath(tenantId: string): string {
  return tenantSubcollection(tenantId, B2B_ROOT.bookings);
}

export function ordersCollectionPath(tenantId: string): string {
  return tenantSubcollection(tenantId, B2B_ROOT.orders);
}

export function callSessionsCollectionPath(tenantId: string): string {
  return tenantSubcollection(tenantId, B2B_ROOT.callSessions);
}

export function staffCollectionPath(tenantId: string): string {
  return tenantSubcollection(tenantId, B2B_ROOT.staff);
}

export function billingEventsCollectionPath(tenantId: string): string {
  return tenantSubcollection(tenantId, B2B_ROOT.billingEvents);
}

export function phoneRouteDocPath(e164: string): string {
  const key = e164.replace(/[^\d+]/g, '');
  return `${B2B_ROOT.phoneRouteIndex}/${key}`;
}
