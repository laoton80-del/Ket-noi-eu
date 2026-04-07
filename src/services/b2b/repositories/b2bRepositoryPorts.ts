/**
 * Repository ports — Firestore (client SDK on merchant app, Admin SDK in Cloud Functions).
 * Implementations live in app (optional) or functions (authoritative for webhooks).
 */
import type {
  B2BInboundRouteResolution,
  BusinessBillingEvent,
  BusinessBooking,
  BusinessCallSession,
  BusinessLocation,
  BusinessOrder,
  BusinessResource,
  BusinessService,
  BusinessStaffAccount,
  BusinessTenant,
} from '../../../domain/b2b';
import type { B2BDb } from '../engines/bookingEngine';

export type DocRef<T> = { id: string; data: T };

export interface PhoneRouteRepository {
  getByInboundE164(db: B2BDb, e164: string): Promise<B2BInboundRouteResolution | null>;
}

export interface TenantRepository {
  getTenant(db: B2BDb, tenantId: string): Promise<BusinessTenant | null>;
}

export interface LocationRepository {
  getLocation(db: B2BDb, tenantId: string, locationId: string): Promise<BusinessLocation | null>;
}

export interface ServiceRepository {
  listByLocation(db: B2BDb, tenantId: string, locationId: string): Promise<BusinessService[]>;
}

export interface ResourceRepository {
  listByLocation(db: B2BDb, tenantId: string, locationId: string): Promise<BusinessResource[]>;
}

export interface BookingRepository {
  listOverlappingForResources(
    db: B2BDb,
    tenantId: string,
    locationId: string,
    resourceIds: string[],
    startsAtMs: number,
    endsAtMs: number,
    excludeBookingId?: string
  ): Promise<BusinessBooking[]>;
  getByIdempotencyKey(db: B2BDb, tenantId: string, idempotencyKey: string): Promise<BusinessBooking | null>;
}

export interface OrderRepository {
  getByIdempotencyKey(db: B2BDb, tenantId: string, idempotencyKey: string): Promise<BusinessOrder | null>;
}

export interface CallSessionRepository {
  getByExternalCallId(db: B2BDb, tenantId: string, externalCallId: string): Promise<BusinessCallSession | null>;
  getByIdempotencyKey(db: B2BDb, tenantId: string, idempotencyKey: string): Promise<BusinessCallSession | null>;
}

export interface BillingEventRepository {
  getByIdempotencyKey(db: B2BDb, tenantId: string, idempotencyKey: string): Promise<BusinessBillingEvent | null>;
}

export interface StaffRepository {
  listByTenant(db: B2BDb, tenantId: string): Promise<BusinessStaffAccount[]>;
}

export type B2BRepositoryBundle = {
  phoneRoute: PhoneRouteRepository;
  tenant: TenantRepository;
  location: LocationRepository;
  serviceActive: ServiceRepository;
  resource: ResourceRepository;
  booking: BookingRepository;
  order: OrderRepository;
  callSession: CallSessionRepository;
  billingEvent: BillingEventRepository;
  staff: StaffRepository;
};
