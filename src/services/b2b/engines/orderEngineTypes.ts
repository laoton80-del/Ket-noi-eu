import type { BusinessOrder, B2BBusinessType, B2BWholesaleQualificationStatus } from '../../../domain/b2b';

export type CreateOrderCommand = {
  tenantId: string;
  locationId: string;
  businessType: B2BBusinessType;
  lines: BusinessOrder['lines'];
  fulfillment: BusinessOrder['fulfillment'];
  windowStartMs: number;
  windowEndMs: number;
  customerPhoneE164?: string;
  customerName?: string;
  deliveryAddress?: string;
  idempotencyKey: string;
  sourceCallSessionId?: string;
  b2bVertical?: B2BBusinessType;
  orderSegment?: BusinessOrder['orderSegment'];
  wholesaleQualification?: B2BWholesaleQualificationStatus;
  lineClarifications?: BusinessOrder['lineClarifications'];
  palletOrVolumeHint?: string;
  notes?: string;
  /**
   * When true, server may post `usage_successful_order` + wallet debit.
   * Wholesale: debit only if `wholesaleQualification === 'confirmed_for_fulfillment'`.
   */
  billable?: boolean;
  staffHandoffSummary?: string;
};

export type CreateOrderResult =
  | { ok: true; order: BusinessOrder; billingEventId?: string }
  | { ok: false; code: string; message?: string };
