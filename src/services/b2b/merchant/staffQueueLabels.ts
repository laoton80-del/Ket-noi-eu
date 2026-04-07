import type { BusinessBooking, BusinessOrder } from '../../../domain/b2b/models';

/**
 * Short staff-facing status lines — truthful, not “final sale” language for inquiries.
 * Phase 3.2 — used when rendering persisted Firestore rows in Le Tân dev queue.
 */
export function operationalLineForBooking(b: Pick<BusinessBooking, 'status' | 'isInquiryOnly' | 'b2bVertical'>): string {
  const stay = b.b2bVertical === 'hospitality_stay';
  if (b.isInquiryOnly === true || (stay && b.status === 'pending_confirm')) {
    return stay
      ? 'Lưu trú · ghi nhận yêu cầu (inquiry) — không phải xác nhận phòng/giá cuối; chưa debit usage trên luồng inquiry.'
      : 'Ghi nhận / chờ xác nhận — kiểm tra billing event trước khi coi là đã tính phí.';
  }
  if (b.status === 'pending_confirm') return 'Chờ xác nhận nội bộ.';
  if (b.status === 'confirmed') return 'Đã xác nhận — kiểm tra ledger nếu cần biết đã debit usage hay chưa.';
  return `Trạng thái: ${b.status}`;
}

export function operationalLineForOrder(
  o: Pick<BusinessOrder, 'status' | 'orderSegment' | 'wholesaleQualification' | 'b2bVertical'>
): string {
  const wholesale =
    o.orderSegment === 'wholesale' || o.b2bVertical === 'grocery_wholesale';
  if (!wholesale) {
    if (o.status === 'pending_confirm') return 'Đơn retail · chờ xác nhận — chưa chắc đã debit.';
    return `Đơn retail · ${o.status}`;
  }
  const q = o.wholesaleQualification ?? 'needs_clarification';
  if (q === 'needs_clarification') return 'Đổ hàng · cần làm rõ dòng hàng — chưa debit usage (giai đoạn intake).';
  if (q === 'qualified_pending_confirm')
    return 'Đổ hàng · đủ điều kiện sơ bộ — chờ xác nhận fulfillment; chưa chắc đã debit.';
  if (q === 'confirmed_for_fulfillment')
    return 'Đổ hàng · đã xác nhận fulfillment — kiểm tra billing event cho usage debit.';
  return `Đổ hàng · ${q}`;
}

export function escalationHintFromHandoffBlock(text: string): string | undefined {
  const m = text.match(/Escalation:\s*([^\n]+)/);
  if (!m) return undefined;
  const v = m[1].trim();
  if (v === 'none') return undefined;
  return v.replace(/_/g, ' ');
}
