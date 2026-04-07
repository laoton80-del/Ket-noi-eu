#!/usr/bin/env node
/**
 * Phase 3.2 — Dev/emulator B2B verification harness (NOT production automation).
 *
 * Read + optional fixture inject for hospitality inquiry + wholesale intake shapes.
 * Optional HTTP call to `b2bOrderStaffOps` to prove qualification → billing timing
 * (requires deployed URL + B2B_WEBHOOK_SECRET + tenant wallet credits if debiting).
 *
 * Usage (from `functions/` so firebase-admin resolves):
 *   B2B_VERIFY_TENANT_ID=yourTenant B2B_VERIFY_LOCATION_ID=loc1 node scripts/b2b-phase32-verify.cjs
 *   B2B_VERIFY_TENANT_ID=... node scripts/b2b-phase32-verify.cjs --inject-fixture
 *   B2B_VERIFY_TENANT_ID=... B2B_ORDER_STAFF_URL=https://... B2B_WEBHOOK_SECRET=... \
 *     node scripts/b2b-phase32-verify.cjs --inject-fixture --staff-confirm-debit
 *
 * Emulator: export FIRESTORE_EMULATOR_HOST=127.0.0.1:8080
 */
'use strict';

const crypto = require('crypto');
const admin = require('firebase-admin');

const tenantId = process.env.B2B_VERIFY_TENANT_ID?.trim();
const locationId = process.env.B2B_VERIFY_LOCATION_ID?.trim() || 'verify-location';

const args = new Set(process.argv.slice(2));
const inject = args.has('--inject-fixture');
const staffConfirm = args.has('--staff-confirm-debit');

if (!tenantId) {
  console.error('Set B2B_VERIFY_TENANT_ID');
  process.exit(1);
}

if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();
const FieldValue = admin.firestore.FieldValue;
const Timestamp = admin.firestore.Timestamp;

function signBody(secret, bodyObj) {
  const body = JSON.stringify(bodyObj);
  const ts = Date.now().toString();
  const sig = crypto.createHmac('sha256', secret).update(`${ts}.${body}`).digest('hex');
  return { body, headers: { 'Content-Type': 'application/json', 'x-ketnoi-ts': ts, 'x-ketnoi-signature': sig } };
}

async function printBookings() {
  const snap = await db
    .collection('b2b_tenants')
    .doc(tenantId)
    .collection('business_bookings')
    .orderBy('createdAt', 'desc')
    .limit(8)
    .get();
  console.log('\n--- business_bookings (latest) ---');
  if (snap.empty) console.log('(empty)');
  for (const doc of snap.docs) {
    const d = doc.data();
    console.log(doc.id, {
      status: d.status,
      isInquiryOnly: d.isInquiryOnly,
      b2bVertical: d.b2bVertical,
      staffHandoff_len: String(d.staffHandoffSummary || '').length,
    });
  }
}

async function printOrders() {
  const snap = await db
    .collection('b2b_tenants')
    .doc(tenantId)
    .collection('business_orders')
    .orderBy('createdAt', 'desc')
    .limit(8)
    .get();
  console.log('\n--- business_orders (latest) ---');
  if (snap.empty) console.log('(empty)');
  for (const doc of snap.docs) {
    const d = doc.data();
    console.log(doc.id, {
      status: d.status,
      wholesaleQualification: d.wholesaleQualification,
      orderSegment: d.orderSegment,
      staffHandoff_len: String(d.staffHandoffSummary || '').length,
    });
  }
}

async function printBilling() {
  const snap = await db
    .collection('b2b_tenants')
    .doc(tenantId)
    .collection('business_billing_events')
    .orderBy('createdAt', 'desc')
    .limit(15)
    .get();
  console.log('\n--- business_billing_events (latest) ---');
  if (snap.empty) console.log('(empty)');
  for (const doc of snap.docs) {
    const d = doc.data();
    console.log(doc.id, {
      type: d.type,
      referenceType: d.referenceType,
      referenceId: d.referenceId,
      idempotencyKey: d.idempotencyKey,
      creditsDelta: d.creditsDelta,
    });
  }
}

/** Dev-only Firestore rows; shape mirrors production fields but NOT written by Cloud Functions. */
async function injectFixture() {
  const bookingRef = db
    .collection('b2b_tenants')
    .doc(tenantId)
    .collection('business_bookings')
    .doc(`phase32_booking_${Date.now()}`);
  const orderRef = db
    .collection('b2b_tenants')
    .doc(tenantId)
    .collection('business_orders')
    .doc(`phase32_order_${Date.now()}`);
  const now = FieldValue.serverTimestamp();
  const t0 = Timestamp.fromMillis(Date.now());
  const t1 = Timestamp.fromMillis(Date.now() + 3600000);

  await bookingRef.set({
    tenantId,
    locationId,
    status: 'pending_confirm',
    isInquiryOnly: true,
    b2bVertical: 'hospitality_stay',
    customerName: 'Phase32 Fixture Guest',
    customerPhoneE164: '+420000999888',
    serviceIds: [],
    resourceIds: [],
    startsAt: t0,
    endsAt: t1,
    idempotencyKey: `fixture:${bookingRef.id}`,
    stayCheckInDate: '2026-05-01',
    stayCheckOutDate: '2026-05-03',
    adults: 2,
    notes:
      '[DEV FIXTURE] Phase 3.2 — not created by voice/Functions in this run; mirrors inquiry-only stay shape. No billing.',
    staffHandoffSummary:
      'Stay / booking — inquiry\n\nVertical: Hospitality · stay request\nStatus: pending_confirm\nType: inquiry / awaiting staff confirmation (not a final sale).\nCustomer: Phase32 Fixture Guest · +420000999888\nEscalation: staff_callback\nBilling: No usage debit until policy marks billable confirm.',
    createdAt: now,
    updatedAt: now,
  });

  await orderRef.set({
    tenantId,
    locationId,
    status: 'pending_confirm',
    lines: [{ name: 'Fixture wholesale line', quantity: 12, needsClarification: true }],
    fulfillment: 'pickup',
    windowStart: t0,
    windowEnd: t1,
    idempotencyKey: `fixture:${orderRef.id}`,
    b2bVertical: 'grocery_wholesale',
    orderSegment: 'wholesale',
    wholesaleQualification: 'needs_clarification',
    staffHandoffSummary:
      'Wholesale order — intake\n\nVertical: Grocery · wholesale (đổ hàng) · segment: wholesale\nEscalation: clarification_required\nBilling: Do not debit usage until wholesale is qualified and confirmed for fulfillment.',
    createdAt: now,
    updatedAt: now,
  });

  console.log('\n[inject-fixture] Wrote dev rows (honest: Admin SDK, not voice pipeline):');
  console.log('  booking', bookingRef.id);
  console.log('  order  ', orderRef.id);
  return orderRef.id;
}

async function callStaffConfirm(orderId) {
  const url = process.env.B2B_ORDER_STAFF_URL?.trim();
  const secret = process.env.B2B_WEBHOOK_SECRET?.trim();
  if (!url || !secret) {
    console.log('\n[staff-confirm-debit] Skipped: set B2B_ORDER_STAFF_URL and B2B_WEBHOOK_SECRET');
    return;
  }
  const payload = {
    action: 'set_wholesale_qualification',
    tenantId,
    orderId,
    wholesaleQualification: 'confirmed_for_fulfillment',
    requestUsageDebit: true,
  };
  const { body, headers } = signBody(secret, payload);
  const res = await fetch(url, { method: 'POST', headers, body });
  const txt = await res.text();
  console.log('\n[staff-confirm-debit] HTTP', res.status, txt);
}

async function fetchStaffQueueSnapshotProof() {
  const url = process.env.B2B_STAFF_QUEUE_URL?.trim();
  const bearer = process.env.B2B_STAFF_QUEUE_BEARER?.trim();
  if (!url || !bearer) {
    console.log(
      '\n[G1 staff queue HTTP] Skipped: set B2B_STAFF_QUEUE_URL + B2B_STAFF_QUEUE_BEARER (ID token with b2bTenantId claim).'
    );
    return;
  }
  const lim = process.env.B2B_STAFF_QUEUE_LIMIT?.trim() || '12';
  const u = `${url.replace(/\/$/, '')}?limit=${encodeURIComponent(lim)}`;
  const res = await fetch(u, { headers: { Authorization: `Bearer ${bearer}`, Accept: 'application/json' } });
  const txt = await res.text();
  const preview = txt.length > 1200 ? `${txt.slice(0, 1200)}…` : txt;
  console.log('\n[G1 staff queue HTTP]', res.status, preview);
}

async function main() {
  console.log('Phase 3.2 B2B verify — dev/emulator harness\nTenant:', tenantId, 'Location:', locationId);

  let lastOrderId;
  if (inject) {
    lastOrderId = await injectFixture();
  }

  if (staffConfirm && lastOrderId) {
    await callStaffConfirm(lastOrderId);
  }

  await printBookings();
  await printOrders();
  await printBilling();
  await fetchStaffQueueSnapshotProof();

  console.log('\n--- Truth checklist (manual) ---');
  console.log('- Hospitality voice path: inquiry-first + non-billable remains in processVoiceOrchestrationRequest (not exercised here).');
  console.log('- Fixture booking: isInquiryOnly + pending_confirm — expect no new billing event from fixture alone.');
  console.log('- staff-confirm-debit: posts b2bOrderStaffOps; billing only if rules + wallet allow (see HTTP response).');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
