/**
 * Schema default sanity checks for LocalServiceRequest (no database).
 *
 * Run: npx tsx scripts/test-local-request-schema-defaults.ts
 */
import assert from 'node:assert/strict';

import {
  LocalServiceRequestStatus,
  LocalWalletMode,
  LocalWalletPhase,
} from '@prisma/client';

function run(): void {
  assert.equal(LocalServiceRequestStatus.REQUESTED, 'REQUESTED');
  assert.equal(LocalWalletMode.REQUEST_ONLY_NO_CHARGE, 'REQUEST_ONLY_NO_CHARGE');
  assert.equal(LocalWalletPhase.NONE, 'NONE');
  assert.ok(!('FIREBASE_VIP_ISOLATED' in LocalWalletMode), 'VIP mode must not exist on LocalWalletMode');
  console.log('[test-local-request-schema-defaults] OK');
}

run();
