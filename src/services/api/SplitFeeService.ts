/**
 * B2C Fixer market: **10% of transaction with a floor** (e.g. €2 / $2), split **50/50**
 * between customer surcharge and fixer deduction — all in **integer minor units**.
 */

export type SplitFeeCurrency = 'EUR' | 'USD';

const FLOOR_MINOR: Readonly<Record<SplitFeeCurrency, number>> = {
  EUR: 200,
  USD: 200,
};

const SPLIT_RATE_BPS = 1000 as const; // 10%

export type SplitFeeBreakdown = Readonly<{
  currency: SplitFeeCurrency;
  transactionAmountMinor: number;
  /** max(10% of tx, floor) */
  totalPlatformFeeMinor: number;
  customerSurchargeMinor: number;
  fixerDeductionMinor: number;
}>;

export function computeSplitFeeBreakdown(input: Readonly<{
  transactionAmountMajor: number;
  currency: SplitFeeCurrency;
}>): SplitFeeBreakdown {
  const txMinor = Math.max(0, Math.round(input.transactionAmountMajor * 100));
  const pctMinor = Math.ceil((txMinor * SPLIT_RATE_BPS) / 10_000);
  const floor = FLOOR_MINOR[input.currency] ?? FLOOR_MINOR.EUR;
  const total = Math.max(pctMinor, floor);
  const half = Math.floor(total / 2);
  const other = total - half;
  return {
    currency: input.currency,
    transactionAmountMinor: txMinor,
    totalPlatformFeeMinor: total,
    customerSurchargeMinor: half,
    fixerDeductionMinor: other,
  };
}
