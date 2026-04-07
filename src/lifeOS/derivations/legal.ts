export function computeDaysToExpiry(isoDate: string): number | null {
  const parsed = new Date(isoDate);
  if (Number.isNaN(parsed.getTime())) return null;
  const diff = parsed.getTime() - Date.now();
  return Math.ceil(diff / (24 * 60 * 60 * 1000));
}

export function getLegalUrgencyLine(days: number | null): string | null {
  if (days === null) return null;
  if (days <= 0) return 'Nguy cơ pháp lý: đã quá hạn hoặc đến hạn ngay hôm nay.';
  if (days <= 7) return 'Mức rủi ro cao: còn dưới một tuần — gọi gia hạn trong 24–48h.';
  if (days <= 30) return 'Mức rủi ro trung bình: trong 30 ngày nên có lịch gia hạn.';
  return 'Theo dõi: trong 90 ngày tới hãy lên kế hoạch gia hạn.';
}
