import type { Firestore } from 'firebase-admin/firestore';
import { FieldValue } from 'firebase-admin/firestore';
import { logger } from 'firebase-functions/v2';

import { billingEventsCollectionPath, ordersCollectionPath, tenantDocPath } from '@app/domain/b2b/collections';
import type { B2BWholesaleQualificationStatus, BusinessOrder, BusinessTenant } from '@app/domain/b2b/models';
import { buildUsageBillingEventPayload } from '@app/services/b2b/billing/b2bBillingService';
import { creditsPerSuccessfulInbound } from '@app/services/b2b/billing/b2bUsagePricing';
import {
  buildOrderHandoffSummary,
  formatHandoffBlock,
} from '@app/services/b2b/merchant/merchantHandoffSummary';
import { billingUsageIdempotencyKey } from '@app/services/b2b/reliability/idempotency';

import { docToOrder } from './orderDocMappers';

export type B2BOrderStaffOpsRequest = {
  action: 'set_wholesale_qualification';
  tenantId: string;
  orderId: string;
  wholesaleQualification: Extract<
    B2BWholesaleQualificationStatus,
    'qualified_pending_confirm' | 'confirmed_for_fulfillment'
  >;
  /**
   * When moving to `confirmed_for_fulfillment`, defaults true — posts usage debit if not already billed.
   * Set false to update operational state only (no wallet movement).
   */
  requestUsageDebit?: boolean;
};

export type B2BOrderStaffOpsResponse =
  | { ok: true; orderId: string; billingEventId?: string; wholesaleQualification: B2BWholesaleQualificationStatus }
  | { ok: false; error: string };

/**
 * Trusted webhook (HMAC) — advances wholesale pipeline; optional usage debit when order is confirmed for fulfillment.
 */
export async function processOrderStaffOpsRequest(
  db: Firestore,
  body: B2BOrderStaffOpsRequest
): Promise<B2BOrderStaffOpsResponse> {
  if (body.action !== 'set_wholesale_qualification') {
    return { ok: false, error: 'unsupported_action' };
  }
  const tenantId = body.tenantId?.trim();
  const orderId = body.orderId?.trim();
  if (!tenantId || !orderId) {
    return { ok: false, error: 'missing_tenantId_or_orderId' };
  }

  const orderRef = db.doc(`${ordersCollectionPath(tenantId)}/${orderId}`);
  const tenantRef = db.doc(tenantDocPath(tenantId));
  const billingCol = db.collection(billingEventsCollectionPath(tenantId));

  try {
    const out = await db.runTransaction(async (tx) => {
      const [orderSnap, tenantSnap] = await Promise.all([tx.get(orderRef), tx.get(tenantRef)]);
      if (!tenantSnap.exists) {
        return { kind: 'fail' as const, error: 'tenant_not_found' };
      }
      if (!orderSnap.exists) {
        return { kind: 'fail' as const, error: 'order_not_found' };
      }
      const tenant = tenantSnap.data() as BusinessTenant;
      if (tenant.status === 'suspended') {
        return { kind: 'fail' as const, error: 'tenant_suspended' };
      }

      const row = docToOrder(orderId, orderSnap.data()!);
      const wholesale = row.orderSegment === 'wholesale' || row.b2bVertical === 'grocery_wholesale';
      if (!wholesale) {
        return { kind: 'fail' as const, error: 'order_not_wholesale_segment' };
      }

      const next = body.wholesaleQualification;
      const debitWanted = next === 'confirmed_for_fulfillment' && body.requestUsageDebit !== false;

      const pricingGroup = tenant.billing?.pricingGroup ?? 'group2';
      const credits = creditsPerSuccessfulInbound(pricingGroup);
      const balance = tenant.billing?.walletCreditsBalance ?? 0;

      const billingIdem = billingUsageIdempotencyKey('order', orderId);
      const billQ = billingCol.where('idempotencyKey', '==', billingIdem).limit(1);
      const billSnap = await tx.get(billQ);
      const alreadyBilled = !billSnap.empty;

      if (debitWanted && !alreadyBilled && balance < credits) {
        return { kind: 'fail' as const, error: 'insufficient_credits' };
      }

      const now = FieldValue.serverTimestamp();
      const newStatus: BusinessOrder['status'] =
        next === 'confirmed_for_fulfillment'
          ? 'confirmed'
          : row.status === 'draft'
            ? 'pending_confirm'
            : row.status;

      const updated: BusinessOrder = {
        ...row,
        wholesaleQualification: next,
        status: newStatus,
        updatedAt: now as unknown as BusinessOrder['updatedAt'],
      };
      const staffHandoffSummary = formatHandoffBlock(buildOrderHandoffSummary(updated));

      tx.update(orderRef, {
        wholesaleQualification: next,
        status: newStatus,
        staffHandoffSummary,
        updatedAt: now,
      });

      let billingEventId: string | undefined;
      if (debitWanted && !alreadyBilled) {
        const billingRef = billingCol.doc();
        const billingPayload = buildUsageBillingEventPayload({
          tenantId,
          pricingGroup,
          type: 'usage_successful_order',
          idempotencyKey: billingIdem,
          reference: { ...updated, id: orderId },
        });
        tx.set(billingRef, {
          ...billingPayload,
          id: billingRef.id,
          createdAt: now,
        });
        tx.update(tenantRef, {
          'billing.walletCreditsBalance': FieldValue.increment(-credits),
          updatedAt: now,
        });
        billingEventId = billingRef.id;
      } else if (alreadyBilled) {
        billingEventId = billSnap.docs[0].id;
      }

      return { kind: 'ok' as const, wholesaleQualification: next, billingEventId };
    });

    if (out.kind === 'fail') {
      return { ok: false, error: out.error };
    }
    logger.info('[b2bOrderStaff] qualification_updated', {
      tenantId,
      orderId,
      wholesaleQualification: out.wholesaleQualification,
      billingEventId: out.billingEventId,
    });
    return {
      ok: true,
      orderId,
      wholesaleQualification: out.wholesaleQualification,
      billingEventId: out.billingEventId,
    };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, error: msg };
  }
}
