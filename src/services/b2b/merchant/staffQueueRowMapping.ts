import type { BusinessBooking, BusinessOrder } from '../../../domain/b2b/models';
import { escalationHintFromHandoffBlock, operationalLineForBooking, operationalLineForOrder } from './staffQueueLabels';
import type { LiveStaffQueueRow } from './staffQueueTypes';

function timestampLabel(v: unknown): string {
  if (v && typeof v === 'object' && 'toDate' in v && typeof (v as { toDate: () => Date }).toDate === 'function') {
    try {
      return (v as { toDate: () => Date }).toDate().toLocaleString();
    } catch {
      return '—';
    }
  }
  return '—';
}

function docToBookingLite(id: string, d: Record<string, unknown>): BusinessBooking | null {
  try {
    return {
      id,
      tenantId: String(d.tenantId ?? ''),
      locationId: String(d.locationId ?? ''),
      status: d.status as BusinessBooking['status'],
      customerPhoneE164: d.customerPhoneE164 ? String(d.customerPhoneE164) : undefined,
      customerName: d.customerName ? String(d.customerName) : undefined,
      serviceIds: Array.isArray(d.serviceIds) ? (d.serviceIds as string[]) : [],
      resourceIds: Array.isArray(d.resourceIds) ? (d.resourceIds as string[]) : [],
      startsAt: d.startsAt as BusinessBooking['startsAt'],
      endsAt: d.endsAt as BusinessBooking['endsAt'],
      idempotencyKey: String(d.idempotencyKey ?? ''),
      sourceCallSessionId: d.sourceCallSessionId ? String(d.sourceCallSessionId) : undefined,
      notes: d.notes ? String(d.notes) : undefined,
      partySize: typeof d.partySize === 'number' ? d.partySize : undefined,
      b2bVertical: d.b2bVertical as BusinessBooking['b2bVertical'],
      stayCheckInDate: d.stayCheckInDate ? String(d.stayCheckInDate) : undefined,
      stayCheckOutDate: d.stayCheckOutDate ? String(d.stayCheckOutDate) : undefined,
      adults: typeof d.adults === 'number' ? d.adults : undefined,
      children: typeof d.children === 'number' ? d.children : undefined,
      roomUnitLabel: d.roomUnitLabel ? String(d.roomUnitLabel) : undefined,
      isInquiryOnly: d.isInquiryOnly === true,
      staffHandoffSummary: d.staffHandoffSummary ? String(d.staffHandoffSummary) : undefined,
      createdAt: d.createdAt as BusinessBooking['createdAt'],
      updatedAt: d.updatedAt as BusinessBooking['updatedAt'],
    };
  } catch {
    return null;
  }
}

function docToOrderLite(id: string, d: Record<string, unknown>): BusinessOrder | null {
  try {
    return {
      id,
      tenantId: String(d.tenantId ?? ''),
      locationId: String(d.locationId ?? ''),
      status: d.status as BusinessOrder['status'],
      lines: Array.isArray(d.lines) ? (d.lines as BusinessOrder['lines']) : [],
      customerPhoneE164: d.customerPhoneE164 ? String(d.customerPhoneE164) : undefined,
      customerName: d.customerName ? String(d.customerName) : undefined,
      fulfillment: (d.fulfillment as BusinessOrder['fulfillment']) ?? 'pickup',
      windowStart: d.windowStart as BusinessOrder['windowStart'],
      windowEnd: d.windowEnd as BusinessOrder['windowEnd'],
      idempotencyKey: String(d.idempotencyKey ?? ''),
      sourceCallSessionId: d.sourceCallSessionId ? String(d.sourceCallSessionId) : undefined,
      deliveryAddress: d.deliveryAddress ? String(d.deliveryAddress) : undefined,
      b2bVertical: d.b2bVertical as BusinessOrder['b2bVertical'],
      orderSegment: d.orderSegment as BusinessOrder['orderSegment'],
      wholesaleQualification: d.wholesaleQualification as BusinessOrder['wholesaleQualification'],
      lineClarifications: Array.isArray(d.lineClarifications)
        ? (d.lineClarifications as BusinessOrder['lineClarifications'])
        : undefined,
      palletOrVolumeHint: d.palletOrVolumeHint ? String(d.palletOrVolumeHint) : undefined,
      staffHandoffSummary: d.staffHandoffSummary ? String(d.staffHandoffSummary) : undefined,
      createdAt: d.createdAt as BusinessOrder['createdAt'],
      updatedAt: d.updatedAt as BusinessOrder['updatedAt'],
    };
  } catch {
    return null;
  }
}

export function liveStaffQueueRowFromBookingDoc(
  docId: string,
  d: Record<string, unknown>,
  queueDataSource: LiveStaffQueueRow['queueDataSource']
): LiveStaffQueueRow | null {
  const b = docToBookingLite(docId, d);
  if (!b) return null;
  const handoff = b.staffHandoffSummary?.trim() || '(Chưa có staffHandoffSummary trên document — kiểm tra phiên bản backend.)';
  const op = operationalLineForBooking(b);
  return {
    id: docId,
    source: 'booking',
    updatedAtLabel: timestampLabel(d.updatedAt ?? d.createdAt),
    customerLabel: b.customerName ?? b.customerPhoneE164 ?? '—',
    headline:
      b.b2bVertical === 'hospitality_stay'
        ? `Lưu trú · ${b.stayCheckInDate ?? '?'} → ${b.stayCheckOutDate ?? '?'}`
        : `Booking · ${b.status}`,
    operationalLine: op,
    escalationHint: escalationHintFromHandoffBlock(handoff),
    staffHandoffSummary: handoff,
    b2bVertical: b.b2bVertical,
    bookingStatus: b.status,
    isInquiryOnly: b.isInquiryOnly === true,
    queueDataSource,
  };
}

export function liveStaffQueueRowFromOrderDoc(
  docId: string,
  d: Record<string, unknown>,
  queueDataSource: LiveStaffQueueRow['queueDataSource']
): LiveStaffQueueRow | null {
  const o = docToOrderLite(docId, d);
  if (!o) return null;
  const handoff = o.staffHandoffSummary?.trim() || '(Chưa có staffHandoffSummary trên document.)';
  const lineHint = o.lines[0] ? `${o.lines[0].name} × ${o.lines[0].quantity}` : 'Đơn hàng';
  return {
    id: docId,
    source: 'order',
    updatedAtLabel: timestampLabel(d.updatedAt ?? d.createdAt),
    customerLabel: o.customerName ?? o.customerPhoneE164 ?? '—',
    headline: `Đơn · ${lineHint}`,
    operationalLine: operationalLineForOrder(o),
    escalationHint: escalationHintFromHandoffBlock(handoff),
    staffHandoffSummary: handoff,
    b2bVertical: o.b2bVertical,
    orderStatus: o.status,
    wholesaleQualification: o.wholesaleQualification,
    queueDataSource,
  };
}
