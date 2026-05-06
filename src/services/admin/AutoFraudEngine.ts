/**
 * Mock AI fraud & payout verification — simulates IP/referral/KYC signals before treasury release.
 * Amount fields use USD-major settlement labels (global CFO baseline).
 */

export type FraudFactorKind = 'ip_duplication' | 'referral_spike_velocity' | 'kyc_mismatch';

export interface FraudFactor {
  readonly kind: FraudFactorKind;
  readonly scoreContribution: number;
  readonly detail: string;
}

export type PayoutEvaluationDecision = 'auto_approved' | 'frozen_pending_admin';

export type PayoutEvaluationResult =
  | {
      readonly decision: 'auto_approved';
      readonly riskScore: number;
      readonly factors: readonly FraudFactor[];
      readonly mockBankTransferId: string;
    }
  | {
      readonly decision: 'frozen_pending_admin';
      readonly riskScore: number;
      readonly factors: readonly FraudFactor[];
      readonly adminQueueHint: string;
    };

export interface FraudLockedAccount {
  readonly userId: string;
  readonly amountMajorUsd: number;
  readonly riskScore: number;
  readonly flaggedAtMs: number;
  readonly factorSummary: string;
}

const AUTO_APPROVE_MAX_SCORE = 44;

/** Seeded locked accounts for admin “review” demo (matches CEO dashboard copy). */
let fraudLockedAccounts: FraudLockedAccount[] = [
  {
    userId: '+420900111222',
    amountMajorUsd: 620,
    riskScore: 88,
    flaggedAtMs: Date.now() - 86_400_000,
    factorSummary: 'referral_spike_velocity, kyc_mismatch',
  },
  {
    userId: '+84901239988',
    amountMajorUsd: 500,
    riskScore: 76,
    flaggedAtMs: Date.now() - 3_600_000,
    factorSummary: 'ip_duplication',
  },
];

function hashUserId(userId: string): number {
  let h = 0;
  for (let i = 0; i < userId.length; i += 1) {
    h = (Math.imul(31, h) + userId.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

function buildMockFactors(userId: string, amountMajorUsd: number): { factors: FraudFactor[]; rawScore: number } {
  const h = hashUserId(userId);
  const factors: FraudFactor[] = [];
  let score = h % 24;

  if (h % 9 === 0) {
    const c = 38;
    score += c;
    factors.push({
      kind: 'ip_duplication',
      scoreContribution: c,
      detail: 'IP / thiết bị trùng với payout đã từ chối trong 30 ngày (mock).',
    });
  }

  if (amountMajorUsd >= 420 || h % 17 < 3) {
    const c = 34;
    score += c;
    factors.push({
      kind: 'referral_spike_velocity',
      scoreContribution: c,
      detail: 'Spike giới thiệu bất thường — tốc độ vượt ngưỡng tin cậy (mock).',
    });
  }

  if (h % 11 === 2 || amountMajorUsd >= 480) {
    const c = 30;
    score += c;
    factors.push({
      kind: 'kyc_mismatch',
      scoreContribution: c,
      detail: 'Tên chủ IBAN không khớp eKYC / địa chỉ quốc gia (mock).',
    });
  }

  if (factors.length === 0) {
    factors.push({
      kind: 'ip_duplication',
      scoreContribution: 8,
      detail: 'Quét IP — không trùng danh sách xám (mock).',
    });
    score += 8;
  }

  return { factors, rawScore: Math.min(100, score) };
}

/**
 * Simulates automated payout verification. LOW aggregate risk → auto-approve + mock bank ref;
 * HIGH → freeze and queue for human review (liquidity protection).
 */
export function evaluatePayoutRequest(userId: string, amountMajorUsd: number): PayoutEvaluationResult {
  const trimmed = userId.trim();
  const safeAmount = Number.isFinite(amountMajorUsd) && amountMajorUsd > 0 ? amountMajorUsd : 0;
  const { factors, rawScore } = buildMockFactors(trimmed || 'unknown', safeAmount);

  if (rawScore <= AUTO_APPROVE_MAX_SCORE) {
    return {
      decision: 'auto_approved',
      riskScore: rawScore,
      factors,
      mockBankTransferId: `SEPA-AUTO-${Date.now().toString(36)}-${Math.floor(Math.random() * 1e6).toString(36)}`,
    };
  }

  const snapshot: FraudLockedAccount = {
    userId: trimmed || 'unknown',
    amountMajorUsd: Math.round(safeAmount * 100) / 100,
    riskScore: rawScore,
    flaggedAtMs: Date.now(),
    factorSummary: factors.map((f) => f.kind).join(', '),
  };
  fraudLockedAccounts = [snapshot, ...fraudLockedAccounts].slice(0, 24);

  return {
    decision: 'frozen_pending_admin',
    riskScore: rawScore,
    factors,
    adminQueueHint: 'Rủi ro vượt ngưỡng auto — tài khoản bị giữ chờ AML thủ công.',
  };
}

export function getFraudLockedAccounts(): readonly FraudLockedAccount[] {
  return fraudLockedAccounts;
}

export function getAiFintechScannerTelemetry(): {
  readonly auditorLabel: 'ĐANG HOẠT ĐỘNG (Auto-Pilot)';
  readonly autoApprovedTodayMajorUsd: number;
  readonly fraudLockedAccountCount: number;
} {
  return {
    auditorLabel: 'ĐANG HOẠT ĐỘNG (Auto-Pilot)',
    autoApprovedTodayMajorUsd: 12_000,
    fraudLockedAccountCount: fraudLockedAccounts.length,
  };
}

/** Mock SEPA trigger after AI clears LOW risk. */
export function triggerMockBankPayoutApi(transferId: string): { readonly ok: true; readonly reference: string } {
  return { ok: true, reference: transferId };
}
