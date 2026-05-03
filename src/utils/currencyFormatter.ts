/**
 * Locale-aware currency strings for global pricing UX.
 * Uses `Intl.NumberFormat`; falls back to plain numeric + code when `Intl` rejects a code.
 */

export type CurrencyFormatOptions = {
  readonly locale?: string | readonly string[];
  readonly minimumFractionDigits?: number;
  readonly maximumFractionDigits?: number;
};

function fractionDigitsFor(code: string): { min: number; max: number } {
  const c = code.trim().toUpperCase();
  if (c === 'JPY' || c === 'VND' || c === 'KRW') {
    return { min: 0, max: 0 };
  }
  return { min: 2, max: 2 };
}

export function formatCurrency(
  amount: number,
  currencyCode: string,
  options?: CurrencyFormatOptions
): string {
  if (!Number.isFinite(amount)) {
    return `— ${currencyCode}`;
  }
  const code = currencyCode.trim().toUpperCase();
  if (code.length !== 3) {
    return `${amount.toFixed(2)} ${currencyCode}`;
  }
  const fd = fractionDigitsFor(code);
  const min = options?.minimumFractionDigits ?? fd.min;
  const max = options?.maximumFractionDigits ?? fd.max;
  try {
    return new Intl.NumberFormat(options?.locale, {
      style: 'currency',
      currency: code,
      minimumFractionDigits: min,
      maximumFractionDigits: max,
    }).format(amount);
  } catch {
    return `${amount.toFixed(max)} ${code}`;
  }
}
