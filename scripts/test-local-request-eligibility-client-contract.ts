/**
 * Cancel / confirm / reject eligibility — client-contract typed, behavior unchanged.
 *
 * Run: npx tsx scripts/test-local-request-eligibility-client-contract.ts
 */
import assert from 'node:assert/strict';

import {
  LOCAL_SERVICE_REQUEST_STATUS,
  LOCAL_WALLET_MODE,
  LOCAL_WALLET_PHASE,
} from '../src/domain/local/localServiceRequestClientContract';
import { evaluateLocalMerchantRequestConfirmEligibility } from '../src/services/local/localMerchantRequestConfirmEligibility';
import { evaluateLocalMerchantRequestRejectEligibility } from '../src/services/local/localMerchantRequestRejectEligibility';
import { evaluateLocalUserRequestCancelEligibility } from '../src/services/local/localUserRequestCancelEligibility';

const base = {
  walletMode: LOCAL_WALLET_MODE.REQUEST_ONLY_NO_CHARGE,
  walletPhase: LOCAL_WALLET_PHASE.NONE,
} as const;

function run(): void {
  assert.equal(
    evaluateLocalUserRequestCancelEligibility({
      ...base,
      status: LOCAL_SERVICE_REQUEST_STATUS.REQUESTED,
    }).kind,
    'cancel'
  );
  assert.equal(
    evaluateLocalUserRequestCancelEligibility({
      ...base,
      status: LOCAL_SERVICE_REQUEST_STATUS.MERCHANT_REVIEW,
    }).kind,
    'cancel'
  );
  assert.equal(
    evaluateLocalUserRequestCancelEligibility({
      ...base,
      status: LOCAL_SERVICE_REQUEST_STATUS.USER_CANCELLED,
    }).kind,
    'idempotent'
  );
  assert.equal(
    evaluateLocalUserRequestCancelEligibility({
      ...base,
      status: LOCAL_SERVICE_REQUEST_STATUS.CONFIRMED,
    }).kind,
    'reject'
  );
  assert.equal(
    evaluateLocalUserRequestCancelEligibility({
      status: LOCAL_SERVICE_REQUEST_STATUS.REQUESTED,
      walletMode: LOCAL_WALLET_MODE.HOLD_ON_SUBMIT,
      walletPhase: LOCAL_WALLET_PHASE.NONE,
    }).kind,
    'reject'
  );
  assert.equal(
    evaluateLocalUserRequestCancelEligibility({
      status: LOCAL_SERVICE_REQUEST_STATUS.REQUESTED,
      walletMode: LOCAL_WALLET_MODE.REQUEST_ONLY_NO_CHARGE,
      walletPhase: LOCAL_WALLET_PHASE.HELD,
    }).kind,
    'reject'
  );

  assert.equal(
    evaluateLocalMerchantRequestConfirmEligibility({
      ...base,
      status: LOCAL_SERVICE_REQUEST_STATUS.REQUESTED,
    }).kind,
    'confirm'
  );
  assert.equal(
    evaluateLocalMerchantRequestConfirmEligibility({
      ...base,
      status: LOCAL_SERVICE_REQUEST_STATUS.CONFIRMED,
    }).kind,
    'idempotent'
  );
  assert.equal(
    evaluateLocalMerchantRequestConfirmEligibility({
      ...base,
      status: LOCAL_SERVICE_REQUEST_STATUS.REJECTED,
    }).kind,
    'reject'
  );

  assert.equal(
    evaluateLocalMerchantRequestRejectEligibility({
      ...base,
      status: LOCAL_SERVICE_REQUEST_STATUS.MERCHANT_REVIEW,
    }).kind,
    'reject'
  );
  assert.equal(
    evaluateLocalMerchantRequestRejectEligibility({
      ...base,
      status: LOCAL_SERVICE_REQUEST_STATUS.REJECTED,
    }).kind,
    'idempotent'
  );
  assert.equal(
    evaluateLocalMerchantRequestRejectEligibility({
      ...base,
      status: LOCAL_SERVICE_REQUEST_STATUS.CONFIRMED,
    }).kind,
    'reject_ineligible'
  );

  console.log('[test-local-request-eligibility-client-contract] OK');
}

run();
