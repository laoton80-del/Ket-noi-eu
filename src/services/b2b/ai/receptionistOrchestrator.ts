/**
 * Server-side orchestration facade — Cloud Function calls into these entry points.
 * UI / demo clients must not bypass Functions for writes that hit billing or booking locks.
 */
import type {
  B2BBusinessType,
  B2BInboundRouteResolution,
  B2BPricingGroup,
  BusinessBooking,
  BusinessOrder,
} from '../../../domain/b2b';
import { billingUsageIdempotencyKey } from '../reliability/idempotency';
import type { CreateBookingCommand } from '../engines/bookingEngineTypes';
import type { CreateOrderCommand } from '../engines/orderEngineTypes';
import type { B2BRepositoryBundle } from '../repositories';
import type { B2BDb } from '../engines/bookingEngine';
import { checkBookingAvailability, createBookingTransaction } from '../engines/bookingEngine';
import { checkOrderWindowCapacity, createOrderTransaction } from '../engines/orderEngine';
import { buildUsageBillingEventPayload } from '../billing/b2bBillingService';
import type { FlowContextBase, FlowTransition, ReceptionistFlowStep } from './receptionistFlowTypes';

export type ResolveTenantInput = { inboundNumberE164: string };

export async function resolveTenantByPhone(
  db: B2BDb,
  repos: B2BRepositoryDeps,
  input: ResolveTenantInput
): Promise<B2BInboundRouteResolution | null> {
  return repos.phoneRoute.getByInboundE164(db, input.inboundNumberE164);
}

export type RunAvailabilityInput = {
  tenantId: string;
  locationId: string;
  businessType: B2BBusinessType;
  startsAtMs: number;
  endsAtMs: number;
  resourceIds: string[];
  partySize?: number;
  fulfillment?: 'pickup' | 'delivery';
  windowStartMs?: number;
  windowEndMs?: number;
};

export type RunAvailabilityResult =
  | { kind: 'booking'; result: Awaited<ReturnType<typeof checkBookingAvailability>> }
  | { kind: 'order'; result: Awaited<ReturnType<typeof checkOrderWindowCapacity>> };

/** After AI extracted structured fields — branch by intent / business type. */
export async function runAvailabilityGate(
  db: B2BDb,
  input: RunAvailabilityInput & { mode: 'booking' | 'order' }
): Promise<RunAvailabilityResult> {
  if (input.mode === 'booking') {
    const result = await checkBookingAvailability(db, {
      tenantId: input.tenantId,
      locationId: input.locationId,
      businessType: input.businessType,
      startsAtMs: input.startsAtMs,
      endsAtMs: input.endsAtMs,
      resourceIds: input.resourceIds,
      partySize: input.partySize,
    });
    return { kind: 'booking', result };
  }
  const result = await checkOrderWindowCapacity(db, {
    tenantId: input.tenantId,
    locationId: input.locationId,
    windowStartMs: input.windowStartMs ?? input.startsAtMs,
    windowEndMs: input.windowEndMs ?? input.endsAtMs,
    fulfillment: input.fulfillment ?? 'pickup',
  });
  return { kind: 'order', result };
}

export type Repos = B2BRepositoryBundle;

/** Narrow bundle for early flow steps — omit full type dependency cycle. */
export type B2BRepositoryDeps = Pick<B2BRepositoryBundle, 'phoneRoute'>;

export type CommitBookingOrderDeps = Repos;

export async function commitBooking(
  db: B2BDb,
  _repos: CommitBookingOrderDeps,
  cmd: CreateBookingCommand
): Promise<Awaited<ReturnType<typeof createBookingTransaction>>> {
  void _repos;
  return createBookingTransaction(db, cmd);
}

export async function commitOrder(
  db: B2BDb,
  _repos: CommitBookingOrderDeps,
  cmd: CreateOrderCommand
): Promise<Awaited<ReturnType<typeof createOrderTransaction>>> {
  void _repos;
  return createOrderTransaction(db, cmd);
}

/**
 * Pure transition helper for logging / voice UX — function runtime maps step → prompts.
 */
export function nextStepAfterIntent(intent: FlowContextBase['intent']): ReceptionistFlowStep {
  if (
    intent === 'booking' ||
    intent === 'stay_booking' ||
    intent === 'order' ||
    intent === 'wholesale_order'
  ) {
    return 'collect_slots';
  }
  if (intent === 'transfer' || intent === 'faq') return 'completed';
  return 'collect_slots';
}

export type FlowAudit = { from: ReceptionistFlowStep; transition: FlowTransition };

export function auditTransition(from: ReceptionistFlowStep, transition: FlowTransition): FlowAudit {
  return { from, transition };
}

/** Build billing payload after successful persist — caller runs transactional write with wallet debit. */
export function usageBillingAfterBooking(
  tenantId: string,
  pricingGroup: B2BPricingGroup,
  booking: BusinessBooking
): ReturnType<typeof buildUsageBillingEventPayload> {
  return buildUsageBillingEventPayload({
    tenantId,
    pricingGroup,
    type: 'usage_successful_booking',
    idempotencyKey: billingUsageIdempotencyKey('booking', booking.id),
    reference: booking,
  });
}

export function usageBillingAfterOrder(
  tenantId: string,
  pricingGroup: B2BPricingGroup,
  order: BusinessOrder
): ReturnType<typeof buildUsageBillingEventPayload> {
  return buildUsageBillingEventPayload({
    tenantId,
    pricingGroup,
    type: 'usage_successful_order',
    idempotencyKey: billingUsageIdempotencyKey('order', order.id),
    reference: order,
  });
}
