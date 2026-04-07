#!/usr/bin/env node
/**
 * G1 — Set Firebase Auth custom claim `b2bTenantId` for a user (merchant/staff queue binding).
 *
 * Requires Application Default Credentials or GOOGLE_APPLICATION_CREDENTIALS (same as other Admin scripts).
 *
 * Usage (from repo root):
 *   npm run b2b:g1-set-claims -- <firebaseUid> <tenantId>
 *
 * Example:
 *   npm run b2b:g1-set-claims -- AbCdEf123 tenant_demo_1
 */
'use strict';

const admin = require('firebase-admin');

const uid = process.argv[2]?.trim();
const tenantId = process.argv[3]?.trim();

if (!uid || !tenantId) {
  console.error('Usage: npm run b2b:g1-set-claims -- <firebaseUid> <b2bTenantId>');
  process.exit(1);
}

if (!admin.apps.length) {
  admin.initializeApp();
}

admin
  .auth()
  .setCustomUserClaims(uid, { b2bTenantId: tenantId })
  .then(() => {
    console.log('[b2b-set-staff-claims] OK: uid=%s b2bTenantId=%s', uid, tenantId);
    console.log('User must refresh ID token (re-sign-in or forceRefresh) before HTTPS queue works.');
    process.exit(0);
  })
  .catch((e) => {
    console.error('[b2b-set-staff-claims] FAIL:', e.message || e);
    process.exit(1);
  });
