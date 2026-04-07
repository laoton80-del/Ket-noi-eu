/**
 * Seed `platform_payment_receipts/{paymentEventId}` for staging / evidence runs (Wave 1 W1-04).
 *
 * Usage (from repo root or functions/):
 *   node scripts/seed-payment-receipt.cjs <paymentEventId> <firebaseAuthUid> [creditsToGrant]
 *
 * Requires Firebase Admin credentials (Application Default Credentials or GOOGLE_APPLICATION_CREDENTIALS)
 * for the same project as deployed `walletOps`.
 *
 * Do not use in production for fake money; staging / QA only.
 */
'use strict';

const admin = require('firebase-admin');

if (!admin.apps.length) {
  admin.initializeApp();
}

const paymentEventId = process.argv[2];
const walletUid = process.argv[3];
const creditsToGrant = process.argv[4] ? Number(process.argv[4]) : 100;

if (!paymentEventId || !walletUid || !Number.isFinite(creditsToGrant) || creditsToGrant <= 0) {
  console.error(
    'Usage: node scripts/seed-payment-receipt.cjs <paymentEventId> <firebaseAuthUid> [creditsToGrant]'
  );
  process.exit(1);
}

const safeId = String(paymentEventId).trim().replace(/\//g, '_');
const db = admin.firestore();

async function main() {
  await db.doc(`platform_payment_receipts/${safeId}`).set(
    {
      status: 'paid',
      provider: 'stripe',
      walletUid,
      creditsToGrant,
    },
    { merge: true }
  );
  console.log('[seed-payment-receipt] OK', { path: `platform_payment_receipts/${safeId}`, creditsToGrant });
}

main().catch((e) => {
  console.error('[seed-payment-receipt] FAIL', e instanceof Error ? e.message : e);
  process.exit(1);
});
