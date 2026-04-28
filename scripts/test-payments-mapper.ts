import assert from 'node:assert/strict';
import { toPlatformPayIntentRequest, toTopupVerifyRequest, type WalletPackPlatformPayIntentInput } from '../src/services/PaymentsService';

function run() {
  const intentInput: WalletPackPlatformPayIntentInput = {
    walletPackageId: 'starter',
    amount: 199,
    currency: 'CZK',
    idempotencyKey: 'evt_test_001',
    commercialCountryCode: 'CZ',
    merchantCountryCode: 'CZ',
    displayCurrency: 'CZK',
  };

  const intentReq = toPlatformPayIntentRequest(intentInput);
  assert.equal(intentReq.packageId, intentInput.walletPackageId, 'walletPackageId phải map đúng sang packageId');
  assert.equal(intentReq.idempotencyKey, intentInput.idempotencyKey, 'idempotencyKey phải giữ nguyên');
  assert.ok('packageId' in intentReq, 'request phải có packageId');
  assert.ok('idempotencyKey' in intentReq, 'request phải có idempotencyKey khi input có');
  assert.ok(!('walletPackageId' in (intentReq as Record<string, unknown>)), 'không leak walletPackageId ra wire payload');

  const verifyReq = toTopupVerifyRequest({
    country: 'CZ',
    walletPackageId: 'power',
    idempotencyKey: 'payment_event_abc',
  });
  assert.equal(verifyReq.packageId, 'power', 'verify phải map walletPackageId sang packageId');
  assert.equal(verifyReq.idempotencyKey, 'payment_event_abc', 'verify phải giữ idempotencyKey/paymentEventId');
  assert.equal(verifyReq.provider, 'platform_pay', 'provider mặc định phải là platform_pay');
  assert.ok(!('walletPackageId' in (verifyReq as Record<string, unknown>)), 'không leak walletPackageId ra verify payload');

  console.log('[test-payments-mapper] OK');
}

run();
