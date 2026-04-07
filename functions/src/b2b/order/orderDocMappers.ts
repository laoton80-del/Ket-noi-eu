import type { DocumentData } from 'firebase-admin/firestore';
import type { BusinessOrder } from '@app/domain/b2b/models';

export function docToOrder(id: string, d: DocumentData): BusinessOrder {
  return {
    id,
    tenantId: String(d.tenantId ?? ''),
    locationId: String(d.locationId ?? ''),
    status: d.status as BusinessOrder['status'],
    lines: Array.isArray(d.lines) ? (d.lines as BusinessOrder['lines']) : [],
    customerPhoneE164: d.customerPhoneE164 ? String(d.customerPhoneE164) : undefined,
    customerName: d.customerName ? String(d.customerName) : undefined,
    fulfillment: (d.fulfillment as BusinessOrder['fulfillment']) ?? 'pickup',
    windowStart: d.windowStart,
    windowEnd: d.windowEnd,
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
    createdAt: d.createdAt,
    updatedAt: d.updatedAt,
  };
}
