/**
 * Merchant-facing handoff lines — **operational truth**, not marketing.
 * Use for console, SMS/email stubs, or staff queue; billing remains server-authoritative.
 */
import type { B2BBusinessType, BusinessBooking, BusinessCallSession, BusinessOrder } from '../../../domain/b2b/models';
import { fulfillmentEngineFamily, grocerySegmentLabel } from '../../../domain/b2b/b2bVerticalBridge';

export type HandoffEscalation = 'none' | 'staff_callback' | 'clarification_required' | 'rate_or_stock_confirm';

export type MerchantHandoffBlock = {
  title: string;
  lines: string[];
  escalation: HandoffEscalation;
  billableNote: string;
};

function verticalLabel(bt: B2BBusinessType | undefined): string {
  if (!bt) return 'Unknown vertical';
  switch (bt) {
    case 'hospitality_stay':
      return 'Hospitality · stay request';
    case 'grocery_wholesale':
      return 'Grocery · wholesale (đổ hàng)';
    case 'grocery_retail':
      return 'Grocery · retail';
    case 'potraviny':
      return 'Grocery · retail (legacy businessType; migrate to grocery_retail)';
    case 'nails':
      return 'Nails';
    case 'restaurant':
      return 'Restaurant';
    default:
      return bt;
  }
}

export function buildBookingHandoffSummary(booking: BusinessBooking): MerchantHandoffBlock {
  const bt = booking.b2bVertical;
  /** `pending_confirm` alone is ambiguous for non-stay verticals; tie “inquiry” wording to explicit flags or hospitality stay. */
  const inquiry =
    booking.isInquiryOnly === true || (bt === 'hospitality_stay' && booking.status === 'pending_confirm');
  const stayParts = [
    booking.stayCheckInDate && `Check-in: ${booking.stayCheckInDate}`,
    booking.stayCheckOutDate && `Check-out: ${booking.stayCheckOutDate}`,
    booking.adults != null && `Adults: ${booking.adults}`,
    booking.children != null && `Children: ${booking.children}`,
    booking.roomUnitLabel && `Room/unit: ${booking.roomUnitLabel}`,
  ].filter(Boolean) as string[];

  const lines: string[] = [
    `Vertical: ${verticalLabel(bt)}`,
    `Status: ${booking.status}`,
    inquiry ? 'Type: inquiry / awaiting staff confirmation (not a final sale).' : 'Type: committed booking record.',
    `Customer: ${booking.customerName ?? '—'} · ${booking.customerPhoneE164 ?? '—'}`,
    `Resources: ${booking.resourceIds.join(', ') || '—'}`,
    `Services: ${booking.serviceIds.join(', ') || '—'}`,
    ...stayParts,
    booking.partySize != null ? `Party size: ${booking.partySize}` : '',
    booking.notes ? `Notes: ${booking.notes}` : '',
  ].filter(Boolean);

  return {
    title: inquiry ? 'Stay / booking — inquiry' : 'Stay / booking — update',
    lines,
    escalation: inquiry ? 'staff_callback' : 'none',
    billableNote: inquiry
      ? 'No usage debit until policy marks billable confirm.'
      : 'Debit only if matching billing event exists on server.',
  };
}

export function buildOrderHandoffSummary(order: BusinessOrder): MerchantHandoffBlock {
  const seg = order.orderSegment ?? (order.b2bVertical === 'grocery_wholesale' ? 'wholesale' : 'retail');
  const qual = order.wholesaleQualification ?? 'needs_clarification';
  const wholesale = seg === 'wholesale';
  const lineSummaries = order.lines.map((l, i) => {
    const flag = l.needsClarification ? ' [CLARIFY]' : '';
    return `${i + 1}. ${l.name} × ${l.quantity}${flag}`;
  });
  const clar = order.lineClarifications?.length
    ? order.lineClarifications.map((c) => `Line ${c.lineIndex + 1}: ${c.vi ?? c.en ?? c.cs ?? '?'}`).join(' | ')
    : '';

  const lines: string[] = [
    `Vertical: ${verticalLabel(order.b2bVertical)} · segment: ${seg}`,
    `Fulfillment: ${order.fulfillment}`,
    `Status: ${order.status}`,
    wholesale ? `Wholesale stage: ${qual} (confirmed_for_fulfillment = OK to treat as firm).` : '',
    `Customer: ${order.customerName ?? '—'} · ${order.customerPhoneE164 ?? '—'}`,
    order.deliveryAddress ? `Address: ${order.deliveryAddress}` : '',
    order.palletOrVolumeHint ? `Volume hint: ${order.palletOrVolumeHint}` : '',
    'Lines:',
    ...lineSummaries,
    clar ? `Open questions: ${clar}` : '',
  ].filter(Boolean);

  let escalation: HandoffEscalation = 'none';
  if (wholesale && qual !== 'confirmed_for_fulfillment') escalation = 'clarification_required';
  if (order.lines.some((l) => l.needsClarification)) escalation = 'clarification_required';

  return {
    title: wholesale ? 'Wholesale order — intake' : 'Retail order — intake',
    lines,
    escalation,
    billableNote:
      wholesale && qual !== 'confirmed_for_fulfillment'
        ? 'Do not debit usage until wholesale is qualified and confirmed for fulfillment.'
        : 'Debit only after server posts usage_successful_order.',
  };
}

export function buildCallSessionHandoffSummary(
  session: BusinessCallSession,
  tenantBusinessType: B2BBusinessType
): MerchantHandoffBlock {
  const intent = session.detectedIntent ?? session.intent;
  const engine = fulfillmentEngineFamily(tenantBusinessType);
  const grocery = grocerySegmentLabel(tenantBusinessType);

  const lines: string[] = [
    `Call: ${session.externalCallId}`,
    `Intent: ${intent ?? 'unknown'}`,
    `Tenant vertical: ${verticalLabel(tenantBusinessType)}`,
    `Engine family: ${engine}`,
    grocery !== 'n/a' ? `Grocery segment: ${grocery}` : '',
    session.outcome ? `Outcome: ${session.outcome}` : '',
    session.failureCode ? `Failure: ${session.failureCode}` : '',
    session.bookingId ? `Linked booking: ${session.bookingId}` : '',
    session.orderId ? `Linked order: ${session.orderId}` : '',
    (() => {
      const parts = [
        session.billingEventId && `booking debit: ${session.billingEventId}`,
        session.orderBillingEventId && `order debit: ${session.orderBillingEventId}`,
      ].filter(Boolean) as string[];
      return parts.length ? `Billing refs: ${parts.join(' · ')}` : 'Billing refs: none on session';
    })(),
  ].filter(Boolean);

  let escalation: HandoffEscalation = 'none';
  if (intent === 'wholesale_order' || intent === 'transfer') escalation = 'staff_callback';
  if (intent === 'stay_booking') escalation = 'staff_callback';

  return {
    title: 'Inbound call — handoff',
    lines,
    escalation,
    billableNote:
      'Billing is authoritative on ledger only; this block is for staff next steps, not payment confirmation.',
  };
}

export function formatHandoffBlock(block: MerchantHandoffBlock): string {
  return [block.title, '', ...block.lines, '', `Escalation: ${block.escalation}`, `Billing: ${block.billableNote}`].join(
    '\n'
  );
}
