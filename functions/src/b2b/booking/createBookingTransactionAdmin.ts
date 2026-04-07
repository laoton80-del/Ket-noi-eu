import type { DocumentData, Firestore, QuerySnapshot, Transaction } from 'firebase-admin/firestore';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { logger } from 'firebase-functions/v2';

import {
  bookingsCollectionPath,
  billingEventsCollectionPath,
  resourcesCollectionPath,
  tenantDocPath,
} from '@app/domain/b2b/collections';
import type { B2BBookingStatus, BusinessBooking, BusinessTenant } from '@app/domain/b2b/models';
import { buildUsageBillingEventPayload } from '@app/services/b2b/billing/b2bBillingService';
import { creditsPerSuccessfulInbound } from '@app/services/b2b/billing/b2bUsagePricing';
import {
  anyConflict,
  isBlockingBookingStatus,
  intervalsOverlapHalfOpen,
  pickFirstFreeResource,
  type OverlapBookingLike,
} from '@app/services/b2b/engines/bookingEngineCore';
import type { CreateBookingCommand, CreateBookingResult } from '@app/services/b2b/engines/bookingEngineTypes';
import {
  buildBookingHandoffSummary,
  formatHandoffBlock,
} from '@app/services/b2b/merchant/merchantHandoffSummary';
import { billingUsageIdempotencyKey } from '@app/services/b2b/reliability/idempotency';

type TxOutcome =
  | { outcome: 'success'; booking: BusinessBooking; billingEventId?: string }
  | { outcome: 'fail'; code: string; message?: string };

function docToBooking(id: string, d: DocumentData): BusinessBooking {
  return {
    id,
    tenantId: String(d.tenantId ?? ''),
    locationId: String(d.locationId ?? ''),
    status: d.status as BusinessBooking['status'],
    customerPhoneE164: d.customerPhoneE164 ? String(d.customerPhoneE164) : undefined,
    customerName: d.customerName ? String(d.customerName) : undefined,
    serviceIds: Array.isArray(d.serviceIds) ? (d.serviceIds as string[]) : [],
    resourceIds: Array.isArray(d.resourceIds) ? (d.resourceIds as string[]) : [],
    startsAt: d.startsAt,
    endsAt: d.endsAt,
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
    createdAt: d.createdAt,
    updatedAt: d.updatedAt,
  };
}

function toOverlapLike(
  id: string,
  d: DocumentData,
  startMs: number,
  endMs: number
): OverlapBookingLike | null {
  const status = d.status as B2BBookingStatus;
  const startsAt = d.startsAt as Timestamp | undefined;
  const endsAt = d.endsAt as Timestamp | undefined;
  if (!startsAt?.toMillis || !endsAt?.toMillis) return null;
  const startsAtMs = startsAt.toMillis();
  const endsAtMs = endsAt.toMillis();
  if (!intervalsOverlapHalfOpen(startMs, endMs, startsAtMs, endsAtMs)) return null;
  if (!isBlockingBookingStatus(status)) return null;
  const resourceIds = Array.isArray(d.resourceIds) ? (d.resourceIds as string[]) : [];
  return { id, startsAtMs, endsAtMs, resourceIds, status };
}

/** Load candidates for overlap from a query snapshot (filter interval + blocking in memory). */
function snapToOverlappers(
  snap: QuerySnapshot,
  windowStart: number,
  windowEnd: number
): OverlapBookingLike[] {
  const out: OverlapBookingLike[] = [];
  for (const doc of snap.docs) {
    const row = toOverlapLike(doc.id, doc.data(), windowStart, windowEnd);
    if (row) out.push(row);
  }
  return out;
}

async function loadResourceCaps(
  tx: Transaction,
  db: Firestore,
  tenantId: string,
  ids: string[]
): Promise<Map<string, { locationId: string; active: boolean; capacity: number }>> {
  const map = new Map<string, { locationId: string; active: boolean; capacity: number }>();
  for (const rid of ids) {
    const ref = db.doc(`${resourcesCollectionPath(tenantId)}/${rid}`);
    const s = await tx.get(ref);
    if (!s.exists) continue;
    const d = s.data() as Record<string, unknown>;
    map.set(rid, {
      locationId: String(d.locationId ?? ''),
      active: Boolean(d.active ?? true),
      capacity: typeof d.capacity === 'number' ? d.capacity : 1,
    });
  }
  return map;
}

export async function createBookingTransactionAdmin(db: Firestore, cmd: CreateBookingCommand): Promise<CreateBookingResult> {
  if (cmd.endsAtMs <= cmd.startsAtMs) {
    return { ok: false, code: 'invalid_window', message: 'endsAtMs must be after startsAtMs' };
  }

  const tenantRef = db.doc(tenantDocPath(cmd.tenantId));
  const bookingsPath = bookingsCollectionPath(cmd.tenantId);
  const bookingsCol = db.collection(bookingsPath);
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

      const idemQ = bookingsCol.where('idempotencyKey', '==', cmd.idempotencyKey).limit(1);
      const idemSnap = await tx.get(idemQ);
      if (!idemSnap.empty) {
        const doc = idemSnap.docs[0];
        const existingBooking = docToBooking(doc.id, doc.data());
        const billingIdem = billingUsageIdempotencyKey('booking', existingBooking.id);
        const billQ = billingCol.where('idempotencyKey', '==', billingIdem).limit(1);
        const billSnap = await tx.get(billQ);
        const billingEventId = billSnap.empty ? undefined : billSnap.docs[0].id;
        return { outcome: 'success', booking: existingBooking, billingEventId };
      }

      const pricingGroup = tenant.billing?.pricingGroup ?? 'group2';
      const credits = creditsPerSuccessfulInbound(pricingGroup);
      const billable = cmd.billable !== false;
      const balance = tenant.billing?.walletCreditsBalance ?? 0;
      if (billable && balance < credits) {
        return {
          outcome: 'fail',
          code: 'insufficient_credits',
          message: `Need ${credits} credits, balance ${balance}`,
        };
      }

      let finalResourceIds: string[] = [...cmd.resourceIds];

      /** Non-billable stay inquiry: no room/resource slot yet (Phase 3.1 — no inventory engine). */
      const stayInquiryProvisional =
        !billable && (cmd.businessType === 'hospitality_stay' || cmd.treatAsStayInquiry === true);

      if (finalResourceIds.length === 0) {
        const candidates = cmd.resourceCandidateIds ?? [];
        if (candidates.length === 0) {
          if (stayInquiryProvisional) {
            finalResourceIds = [];
          } else {
            return {
              outcome: 'fail',
              code: 'invalid_resource',
              message: 'resourceIds or resourceCandidateIds required',
            };
          }
        } else {
          const capMap = await loadResourceCaps(tx, db, cmd.tenantId, candidates);
          const resourceCapacity = (rid: string) => capMap.get(rid)?.capacity;
          const merged: OverlapBookingLike[] = [];
          for (const rid of candidates) {
            const meta = capMap.get(rid);
            if (!meta || !meta.active || meta.locationId !== cmd.locationId) continue;
            const q = bookingsCol
              .where('locationId', '==', cmd.locationId)
              .where('resourceIds', 'array-contains', rid)
              .where('startsAt', '<', Timestamp.fromMillis(cmd.endsAtMs));
            const os = await tx.get(q);
            merged.push(...snapToOverlappers(os, cmd.startsAtMs, cmd.endsAtMs));
          }
          const dedupe = dedupeOverlappers(merged);
          const picked = pickFirstFreeResource(
            candidates,
            dedupe,
            cmd.startsAtMs,
            cmd.endsAtMs,
            cmd.partySize,
            resourceCapacity
          );
          if (!picked) {
            return { outcome: 'fail', code: 'overlap', message: 'No free resource in candidates' };
          }
          finalResourceIds = picked;
        }
      }

      if (finalResourceIds.length > 0) {
        const capMapAssigned = await loadResourceCaps(tx, db, cmd.tenantId, finalResourceIds);
        for (const rid of finalResourceIds) {
          const meta = capMapAssigned.get(rid);
          if (!meta || !meta.active || meta.locationId !== cmd.locationId) {
            return { outcome: 'fail', code: 'invalid_resource', message: `Resource ${rid} not usable at location` };
          }
          if (cmd.businessType === 'restaurant' && cmd.partySize != null && cmd.partySize > meta.capacity) {
            return {
              outcome: 'fail',
              code: 'party_size',
              message: `Party ${cmd.partySize} exceeds resource capacity ${meta.capacity}`,
            };
          }
        }

        const overlappersAcc: OverlapBookingLike[] = [];
        for (const rid of finalResourceIds) {
          const q = bookingsCol
            .where('locationId', '==', cmd.locationId)
            .where('resourceIds', 'array-contains', rid)
            .where('startsAt', '<', Timestamp.fromMillis(cmd.endsAtMs));
          const os = await tx.get(q);
          overlappersAcc.push(...snapToOverlappers(os, cmd.startsAtMs, cmd.endsAtMs));
        }
        const unique = dedupeOverlappers(overlappersAcc);
        const conflict = anyConflict(unique, cmd.startsAtMs, cmd.endsAtMs, new Set(finalResourceIds));
        if (conflict) {
          return { outcome: 'fail', code: 'overlap', message: `Resource held by booking ${conflict.id}` };
        }
      }

      const bookingRef = bookingsCol.doc();
      const billingRef = billingCol.doc();
      const now = FieldValue.serverTimestamp();
      const bookingId = bookingRef.id;

      const startsAtTs = Timestamp.fromMillis(cmd.startsAtMs);
      const endsAtTs = Timestamp.fromMillis(cmd.endsAtMs);
      const bookingStatus = billable ? ('confirmed' as const) : ('pending_confirm' as const);
      const bookingStub: BusinessBooking = {
        id: bookingId,
        tenantId: cmd.tenantId,
        locationId: cmd.locationId,
        status: bookingStatus,
        customerPhoneE164: cmd.customerPhoneE164,
        customerName: cmd.customerName,
        serviceIds: cmd.serviceIds,
        resourceIds: finalResourceIds,
        startsAt: startsAtTs as unknown as BusinessBooking['startsAt'],
        endsAt: endsAtTs as unknown as BusinessBooking['endsAt'],
        idempotencyKey: cmd.idempotencyKey,
        sourceCallSessionId: cmd.sourceCallSessionId,
        notes: cmd.notes,
        partySize: cmd.partySize,
        b2bVertical: cmd.businessType,
        stayCheckInDate: cmd.stayCheckInDate,
        stayCheckOutDate: cmd.stayCheckOutDate,
        adults: cmd.adults,
        children: cmd.children,
        roomUnitLabel: cmd.roomUnitLabel,
        isInquiryOnly: cmd.isInquiryOnly === true || !billable,
        createdAt: now as unknown as BusinessBooking['createdAt'],
        updatedAt: now as unknown as BusinessBooking['updatedAt'],
      };
      const staffHandoffSummary =
        cmd.staffHandoffSummary ?? formatHandoffBlock(buildBookingHandoffSummary(bookingStub));

      const bookingRow = {
        tenantId: cmd.tenantId,
        locationId: cmd.locationId,
        status: bookingStatus,
        customerPhoneE164: cmd.customerPhoneE164 ?? null,
        customerName: cmd.customerName ?? null,
        serviceIds: cmd.serviceIds,
        resourceIds: finalResourceIds,
        startsAt: startsAtTs,
        endsAt: endsAtTs,
        idempotencyKey: cmd.idempotencyKey,
        sourceCallSessionId: cmd.sourceCallSessionId ?? null,
        notes: cmd.notes ?? null,
        partySize: cmd.partySize ?? null,
        b2bVertical: cmd.businessType,
        stayCheckInDate: cmd.stayCheckInDate ?? null,
        stayCheckOutDate: cmd.stayCheckOutDate ?? null,
        adults: cmd.adults ?? null,
        children: cmd.children ?? null,
        roomUnitLabel: cmd.roomUnitLabel ?? null,
        isInquiryOnly: cmd.isInquiryOnly === true || !billable,
        staffHandoffSummary,
        createdAt: now,
        updatedAt: now,
      };
      tx.set(bookingRef, bookingRow);

      Object.assign(bookingStub, { staffHandoffSummary });

      if (billable) {
        const billingPayload = buildUsageBillingEventPayload({
          tenantId: cmd.tenantId,
          pricingGroup,
          type: 'usage_successful_booking',
          idempotencyKey: billingUsageIdempotencyKey('booking', bookingId),
          reference: bookingStub,
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

      return { outcome: 'success', booking: bookingStub, billingEventId: billable ? billingRef.id : undefined };
    });

    if (outcome.outcome === 'fail') {
      return { ok: false, code: outcome.code, message: outcome.message };
    }
    const fresh = await db.collection(bookingsPath).doc(outcome.booking.id).get();
    if (fresh.exists) {
      logger.info('[b2bBooking] transaction_ok', {
        tenantId: cmd.tenantId,
        locationId: cmd.locationId,
        bookingId: fresh.id,
        billingEventId: outcome.billingEventId,
        idempotencyKey: cmd.idempotencyKey,
      });
      return {
        ok: true,
        booking: docToBooking(fresh.id, fresh.data()!),
        billingEventId: outcome.billingEventId,
      };
    }
    logger.info('[b2bBooking] transaction_ok', {
      tenantId: cmd.tenantId,
      locationId: cmd.locationId,
      bookingId: outcome.booking.id,
      billingEventId: outcome.billingEventId,
      idempotencyKey: cmd.idempotencyKey,
    });
    return { ok: true, booking: outcome.booking, billingEventId: outcome.billingEventId };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, code: 'transaction_aborted', message: msg };
  }
}

function dedupeOverlappers(rows: OverlapBookingLike[]): OverlapBookingLike[] {
  const byId = new Map<string, OverlapBookingLike>();
  for (const r of rows) byId.set(r.id, r);
  return [...byId.values()];
}
