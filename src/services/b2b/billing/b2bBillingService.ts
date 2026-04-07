import type { BusinessBillingEvent, BusinessBooking, BusinessOrder, B2BPricingGroup } from '../../../domain/b2b';
import { creditsPerSuccessfulInbound } from './b2bUsagePricing';

export type EmitUsageBillingInput = {
  tenantId: string;
  pricingGroup: B2BPricingGroup;
  type: 'usage_successful_booking' | 'usage_successful_order';
  idempotencyKey: string;
  reference: BusinessBooking | BusinessOrder;
};

/**
 * Server must: transactionally create BusinessBillingEvent + debit tenant wallet.
 * Client must never call this directly in production.
 */
export function buildUsageBillingEventPayload(input: EmitUsageBillingInput): Omit<BusinessBillingEvent, 'id' | 'createdAt'> {
  const credits = creditsPerSuccessfulInbound(input.pricingGroup);
  return {
    tenantId: input.tenantId,
    type: input.type,
    creditsDelta: -Math.abs(credits),
    idempotencyKey: input.idempotencyKey,
    referenceType: input.type === 'usage_successful_booking' ? 'booking' : 'order',
    referenceId: input.reference.id,
    pricingGroup: input.pricingGroup,
    metadata: {
      source: 'inbound_ai_receptionist',
      ...(input.reference.b2bVertical ? { b2bVertical: input.reference.b2bVertical } : {}),
      ...('isInquiryOnly' in input.reference && input.reference.isInquiryOnly === true
        ? { billingNote: 'inquiry_only_not_debited_here' }
        : {}),
      ...(input.type === 'usage_successful_order' && 'orderSegment' in input.reference && input.reference.orderSegment
        ? { orderSegment: input.reference.orderSegment }
        : {}),
      ...(input.type === 'usage_successful_order' &&
      'wholesaleQualification' in input.reference &&
      input.reference.wholesaleQualification
        ? { wholesaleQualification: input.reference.wholesaleQualification }
        : {}),
    },
  };
}
