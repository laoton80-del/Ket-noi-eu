/**
 * Client-safe Local contract wire values must match Prisma enum strings (REST wire).
 *
 * Run: npx tsx scripts/test-local-service-request-client-contract.ts
 */
import assert from 'node:assert/strict';

import {
  LocalRequestSource,
  LocalServiceRequestStatus,
  LocalServiceType,
  LocalWalletMode,
  LocalWalletPhase,
} from '@prisma/client';

import {
  isLocalServiceRequestStatusClient,
  isLocalServiceTypeClient,
  isLocalRequestSourceClient,
  isLocalWalletModeClient,
  isLocalWalletPhaseClient,
  LOCAL_CREATE_CLIENT_SOURCE,
  LOCAL_REQUEST_SOURCE,
  LOCAL_SERVICE_REQUEST_STATUS,
  LOCAL_SERVICE_TYPE,
  LOCAL_WALLET_MODE,
  LOCAL_WALLET_PHASE,
} from '../src/domain/local/localServiceRequestClientContract';

function assertSameStringSet(label: string, client: readonly string[], prisma: readonly string[]): void {
  const a = [...client].sort();
  const b = [...prisma].sort();
  assert.deepEqual(a, b, `${label}: client contract must match Prisma/REST wire values`);
}

function run(): void {
  assertSameStringSet(
    'LocalServiceRequestStatus',
    Object.values(LOCAL_SERVICE_REQUEST_STATUS),
    Object.values(LocalServiceRequestStatus)
  );
  assertSameStringSet(
    'LocalWalletMode',
    Object.values(LOCAL_WALLET_MODE),
    Object.values(LocalWalletMode)
  );
  assertSameStringSet(
    'LocalWalletPhase',
    Object.values(LOCAL_WALLET_PHASE),
    Object.values(LocalWalletPhase)
  );
  assertSameStringSet(
    'LocalServiceType',
    Object.values(LOCAL_SERVICE_TYPE),
    Object.values(LocalServiceType)
  );
  assertSameStringSet(
    'LocalRequestSource',
    Object.values(LOCAL_REQUEST_SOURCE),
    Object.values(LocalRequestSource)
  );

  assert.equal(LOCAL_SERVICE_REQUEST_STATUS.REQUESTED, 'REQUESTED');
  assert.equal(LOCAL_WALLET_MODE.REQUEST_ONLY_NO_CHARGE, 'REQUEST_ONLY_NO_CHARGE');
  assert.equal(LOCAL_WALLET_PHASE.NONE, 'NONE');
  assert.equal(LOCAL_CREATE_CLIENT_SOURCE, 'LOCAL_SCREEN');
  assert.equal(LOCAL_SERVICE_TYPE.GENERIC_REQUEST, 'GENERIC_REQUEST');

  assert.equal(isLocalServiceRequestStatusClient('REQUESTED'), true);
  assert.equal(isLocalServiceRequestStatusClient('NOT_A_STATUS'), false);
  assert.equal(isLocalWalletModeClient('REQUEST_ONLY_NO_CHARGE'), true);
  assert.equal(isLocalWalletPhaseClient('NONE'), true);
  assert.equal(isLocalServiceTypeClient('GENERIC_REQUEST'), true);
  assert.equal(isLocalRequestSourceClient('LOCAL_SCREEN'), true);

  console.log('[test-local-service-request-client-contract] OK');
}

run();
