/**
 * Mock payout queue for B2C referral cash-out compliance review (admin approve / reject).
 * In production this would be server-backed with KYC, velocity limits, and treasury holds.
 */

export type PayoutFraudRisk = 'LOW' | 'MEDIUM' | 'HIGH';

export type CashOutQueueStatus = 'pending' | 'approved' | 'rejected_fraud';

export interface CashOutPayoutQueueRecord {
  readonly id: string;
  readonly userDisplayName: string;
  readonly amountMajorUsd: number;
  readonly ibanDisplay: string;
  readonly fraudRisk: PayoutFraudRisk;
  readonly status: CashOutQueueStatus;
  readonly createdAtMs: number;
}

const SEED_PENDING: CashOutPayoutQueueRecord = {
  id: 'payout-seed-tran-b',
  userDisplayName: 'Trần Văn B',
  amountMajorUsd: 50,
  ibanDisplay: 'DE88 **** **** 4400',
  fraudRisk: 'LOW',
  status: 'pending',
  createdAtMs: Date.now() - 3_600_000,
};

let queue: CashOutPayoutQueueRecord[] = [SEED_PENDING];

function maskIban(iban: string): string {
  const cleaned = iban.replace(/\s+/g, '').toUpperCase();
  if (cleaned.length < 8) return '****';
  return `${cleaned.slice(0, 4)} **** **** ${cleaned.slice(-4)}`;
}

export function getPendingCashOutRequests(): readonly CashOutPayoutQueueRecord[] {
  return queue.filter((r) => r.status === 'pending');
}

export function submitCashOutRequest(input: {
  userDisplayName: string;
  amountXu: number;
  creditToMajorUsd: number;
  iban: string;
  bankAccountLabel: string;
}): CashOutPayoutQueueRecord {
  const amountMajorUsd = Math.round(input.amountXu * input.creditToMajorUsd * 100) / 100;
  const record: CashOutPayoutQueueRecord = {
    id: `payout-req-${Date.now().toString(36)}-${Math.floor(Math.random() * 1e6).toString(36)}`,
    userDisplayName: input.userDisplayName.trim() || 'Khách hàng',
    amountMajorUsd,
    ibanDisplay: maskIban(input.iban.trim()),
    fraudRisk: 'LOW',
    status: 'pending',
    createdAtMs: Date.now(),
  };
  queue = [record, ...queue];
  return record;
}

export function approveCashOutRequest(id: string): boolean {
  const idx = queue.findIndex((r) => r.id === id);
  if (idx === -1) return false;
  const row = queue[idx];
  if (row.status !== 'pending') return false;
  const next: CashOutPayoutQueueRecord = { ...row, status: 'approved' };
  queue = [...queue.slice(0, idx), next, ...queue.slice(idx + 1)];
  return true;
}

export function rejectCashOutRequestFraud(id: string): boolean {
  const idx = queue.findIndex((r) => r.id === id);
  if (idx === -1) return false;
  const row = queue[idx];
  if (row.status !== 'pending') return false;
  const next: CashOutPayoutQueueRecord = { ...row, status: 'rejected_fraud' };
  queue = [...queue.slice(0, idx), next, ...queue.slice(idx + 1)];
  return true;
}

/** Test / QA reset — restores seed row only. */
export function resetCashOutPayoutQueueMock(): void {
  queue = [SEED_PENDING];
}
