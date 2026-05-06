export function formatCurrency(amount: number, currencyCode: string): string {
  const safeAmount = Number.isFinite(amount) ? amount : 0;
  const normalizedCurrency = (currencyCode || 'VND').toUpperCase();

  try {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: normalizedCurrency,
    }).format(safeAmount);
  } catch {
    return `${safeAmount.toLocaleString('vi-VN')} ${normalizedCurrency}`;
  }
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return dateString;

  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
}
