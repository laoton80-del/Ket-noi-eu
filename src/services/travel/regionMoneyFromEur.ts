import type { Iso4217Code } from '../../config/globalLocalization';

/**
 * Demo FX from EUR display major → user's regional currency (product demo only).
 */
const EUR_TO: Readonly<Record<Iso4217Code, number>> = {
  EUR: 1,
  USD: 1.08,
  GBP: 0.86,
  CHF: 0.94,
  CZK: 24.8,
  PLN: 4.32,
  AUD: 1.65,
  JPY: 165,
  VND: 28_000,
};

export function convertEurMajorToRegionalDisplay(
  amountEur: number,
  targetCurrency: Iso4217Code
): number {
  const rate = EUR_TO[targetCurrency] ?? EUR_TO.USD;
  return amountEur * rate;
}
