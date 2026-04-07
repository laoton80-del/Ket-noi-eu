import type { Firestore } from 'firebase-admin/firestore';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { logger } from 'firebase-functions/v2';

import { billingEventsCollectionPath, ordersCollectionPath, tenantDocPath } from '@app/domain/b2b/collections';
import type { BusinessOrder, BusinessTenant } from '@app/domain/b2b/models';
import { buildUsageBillingEventPayload } from '@app/services/b2b/billing/b2bBillingService';
import { creditsPerSuccessfulInbound } from '@app/services/b2b/billing/b2bUsagePricing';
import type { CreateOrderCommand, CreateOrderResult } from '@app/services/b2b/engines/orderEngineTypes';
import {
  buildOrderHandoffSummary,
  formatHandoffBlock,
} from '@app/services/b2b/merchant/merchantHandoffSummary';
import { billingUsageIdempotencyKey } from '@app/services/b2b/reliability/idempotency';

import { docToOrder } from './orderDocMappers';

type TxOutcome =
  | { outcome: 'success'; order: BusinessOrder; billingEventId?: string }
  | { outcome: 'fail'; code: string; message?: string };

export async function createOrderTransactionAdmin(db: Firestore, cmd: CreateOrderCommand): Promise<CreateOrderResult> {
  if (!cmd.lines?.length) {
    return { ok: false, code: 'invalid_lines', message: 'At least one order line required' };
  }
  if (cmd.windowEndMs <= cmd.windowStartMs) {
    return { ok: false, code: 'invalid_window', message: 'windowEndMs must be after windowStartMs' };
  }

  const tenantRef = db.doc(tenantDocPath(cmd.tenantId));
  const ordersPath = ordersCollectionPath(cmd.tenantId);
  const ordersCol = db.collection(ordersPath);
  const billingCol = db.collection(billingEventsCollectionPath(cmd.tenantId));

  try {
    const outcome = await db.runTransaction(async (tx): Promise<TxOutcome> => {
      const tenantSnap = await tx.get(tenantRef);
      if (!tenantSnap.exists) {
        return { outcome: 'fail', code: 'tenant_not_found', message: 'Tenant doc missing' };
      }
      const tenant = tenantSnap.data() as BusinessTenant;
      if (tenant.status === 'suspended') {
        return { outcome: 'fail', code: 'tenant_suspended', message: 'AI reception disabled for tenant' };
      }

      const idemQ = ordersCol.where('idempotencyKey', '==', cmd.idempotencyKey).limit(1);
      const idemSnap = await tx.get(idemQ);
      if (!idemSnap.empty) {
        const doc = idemSnap.docs[0];
        const existing = docToOrder(doc.id, doc.data());
        const billingIdem = billingUsageIdempotencyKey('order', existing.id);
        const billQ = billingCol.where('idempotencyKey', '==', billingIdem).limit(1);
        const billSnap = await tx.get(billQ);
        const billingEventId = billSnap.empty ? undefined : billSnap.docs[0].id;
        return { outcome: 'success', order: existing, billingEventId };
      }

      const pricingGroup = tenant.billing?.pricingGroup ?? 'group2';
      const credits = creditsPerSuccessfulInbound(pricingGroup);
      const balance = tenant.billing?.walletCreditsBalance ?? 0;

      const orderSegment: BusinessOrder['orderSegment'] =
        cmd.orderSegment ?? (cmd.businessType === 'grocery_wholesale' ? 'wholesale' : 'retail');
      const wholesale = orderSegment === 'wholesale' || cmd.businessType === 'grocery_wholesale';
      const wholesaleQualification: BusinessOrder['wholesaleQualification'] = wholesale
        ? (cmd.wholesaleQualification ?? 'needs_clarification')
        : cmd.wholesaleQualification;

      const billWanted = cmd.billable === true;
      const debitAllowed =
        billWanted &&
        (!wholesale || wholesaleQualification === 'confirmed_for_fulfillment');

      if (debitAllowed && balance < credits) {
        return {
          outcome: 'fail',
          code: 'insufficient_credits',
          message: `Need ${credits} credits, balance ${balance}`,
        };
      }

      const orderRef = ordersCol.doc();
      const billingRef = billingCol.doc();
      const now = FieldValue.serverTimestamp();
      const orderId = orderRef.id;
      const windowStartTs = Timestamp.fromMillis(cmd.windowStartMs);
      const windowEndTs = Timestamp.fromMillis(cmd.windowEndMs);

      const orderStatus: BusinessOrder['status'] = debitAllowed ? 'confirmed' : 'pending_confirm';

      const b2bVertical = cmd.b2bVertical ?? cmd.businessType;

      const orderStub: BusinessOrder = {
        id: orderId,
        tenantId: cmd.tenantId,
        locationId: cmd.locationId,
        status: orderStatus,
        lines: cmd.lines,
        customerPhoneE164: cmd.customerPhoneE164,
        customerName: cmd.customerName,
        fulfillment: cmd.fulfillment,
        windowStart: windowStartTs as unknown as BusinessOrder['windowStart'],
        windowEnd: windowEndTs as unknown as BusinessOrder['windowEnd'],
        idempotencyKey: cmd.idempotencyKey,
        sourceCallSessionId: cmd.sourceCallSessionId,
        deliveryAddress: cmd.deliveryAddress,
        b2bVertical,
        orderSegment,
        wholesaleQualification,
        lineClarifications: cmd.lineClarifications,
        palletOrVolumeHint: cmd.palletOrVolumeHint,
        createdAt: now as unknown as BusinessOrder['createdAt'],
        updatedAt: now as unknown as BusinessOrder['updatedAt'],
      };

      const staffHandoffSummary =
        cmd.staffHandoffSummary ?? formatHandoffBlock(buildOrderHandoffSummary(orderStub));
      Object.assign(orderStub, { staffHandoffSummary });

      const orderRow = {
        tenantId: cmd.tenantId,
        locationId: cmd.locationId,
        status: orderStatus,
        lines: cmd.lines,
        customerPhoneE164: cmd.customerPhoneE164 ?? null,
        customerName: cmd.customerName ?? null,
        fulfillment: cmd.fulfillment,
        windowStart: windowStartTs,
        windowEnd: windowEndTs,
        idempotencyKey: cmd.idempotencyKey,
        sourceCallSessionId: cmd.sourceCallSessionId ?? null,
        deliveryAddress: cmd.deliveryAddress ?? null,
        b2bVertical,
        orderSegment,
        wholesaleQualification: wholesaleQualification ?? null,
        lineClarifications: cmd.lineClarifications ?? null,
        palletOrVolumeHint: cmd.palletOrVolumeHint ?? null,
        staffHandoffSummary,
        createdAt: now,
        updatedAt: now,
      };

      tx.set(orderRef, orderRow);

      if (debitAllowed) {
        const billingPayload = buildUsageBillingEventPayload({
          tenantId: cmd.tenantId,
          pricingGroup,
          type: 'usage_successful_order',
          idempotencyKey: billingUsageIdempotencyKey('order', orderId),
          reference: orderStub,
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
      }

      return { outcome: 'success', order: orderStub, billingEventId: debitAllowed ? billingRef.id : undefined };
    });

    if (outcome.outcome === 'fail') {
      return { ok: false, code: outcome.code, message: outcome.message };
    }
    const fresh = await db.collection(ordersPath).doc(outcome.order.id).get();
    if (fresh.exists) {
      logger.info('[b2bOrder] transaction_ok', {
        tenantId: cmd.tenantId,
        locationId: cmd.locationId,
        orderId: fresh.id,
        billingEventId: outcome.billingEventId,
        idempotencyKey: cmd.idempotencyKey,
      });
      return {
        ok: true,
        order: docToOrder(fresh.id, fresh.data()!),
        billingEventId: outcome.billingEventId,
      };
    }
    return { ok: true, order: outcome.order, billingEventId: outcome.billingEventId };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, code: 'transaction_aborted', message: msg };
  }
}
