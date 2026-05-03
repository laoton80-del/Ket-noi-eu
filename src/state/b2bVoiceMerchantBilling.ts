import { create } from 'zustand';

/** Accrued AI wholesale performance commission — pending merchant invoice line (mock ledger). */
export type WholesaleCommissionAccrualRow = {
  readonly id: string;
  readonly orderId: string;
  readonly merchantId: string;
  readonly orderValueMajorUsd: number;
  readonly commissionPercent: number;
  readonly commissionMajorUsd: number;
  readonly createdAtIso: string;
};

type B2bVoiceMerchantBillingState = {
  wholesaleCommissionAccruals: readonly WholesaleCommissionAccrualRow[];
  appendWholesaleAiCommission: (input: {
    orderId: string;
    merchantId: string;
    orderValueMajorUsd: number;
    commissionPercent: number;
    commissionMajorUsd: number;
  }) => WholesaleCommissionAccrualRow;
  pendingWholesaleCommissionTotalMajorUsd: () => number;
};

export const useB2bVoiceMerchantBillingStore = create<B2bVoiceMerchantBillingState>((set, get) => ({
  wholesaleCommissionAccruals: [],
  appendWholesaleAiCommission: (input) => {
    const row: WholesaleCommissionAccrualRow = {
      id: `wcomm_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
      createdAtIso: new Date().toISOString(),
      orderId: input.orderId,
      merchantId: input.merchantId,
      orderValueMajorUsd: input.orderValueMajorUsd,
      commissionPercent: input.commissionPercent,
      commissionMajorUsd: input.commissionMajorUsd,
    };
    set((state) => ({
      wholesaleCommissionAccruals: [row, ...state.wholesaleCommissionAccruals],
    }));
    return row;
  },
  pendingWholesaleCommissionTotalMajorUsd: () =>
    Math.round(get().wholesaleCommissionAccruals.reduce((sum, r) => sum + r.commissionMajorUsd, 0) * 100) / 100,
}));
