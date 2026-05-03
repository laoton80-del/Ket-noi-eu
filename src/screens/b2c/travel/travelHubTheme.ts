/**
 * Visual theming for KNG Travel Hub — destination-aware gradients (no remote imagery; premium color stories).
 */

export type TravelHubBackdrop = Readonly<{
  readonly colors: readonly [string, string];
  readonly overlay: string;
}>;

function norm(q: string): string {
  return q.trim().toLowerCase();
}

/** Top → bottom gradient stops for `LinearGradient`, tuned per marquee cities. */
export function resolveTravelBackdrop(destinationQuery: string): TravelHubBackdrop {
  const q = norm(destinationQuery);
  if (q.includes('paris')) {
    return {
      colors: ['#0f2847', '#c9a06c'],
      overlay: 'rgba(8, 18, 36, 0.42)',
    };
  }
  if (q.includes('praha') || q.includes('prague') || q.includes('prah')) {
    return {
      colors: ['#1a1420', '#8b7355'],
      overlay: 'rgba(12, 8, 16, 0.45)',
    };
  }
  if (q.includes('berlin')) {
    return {
      colors: ['#121820', '#6b7c93'],
      overlay: 'rgba(10, 14, 22, 0.48)',
    };
  }
  if (q.includes('amsterdam')) {
    return {
      colors: ['#0d2238', '#5c7fa3'],
      overlay: 'rgba(8, 20, 40, 0.44)',
    };
  }
  if (q.includes('warsaw') || q.includes('warszawa')) {
    return {
      colors: ['#1c2430', '#9a8b78'],
      overlay: 'rgba(14, 18, 26, 0.46)',
    };
  }
  if (q.includes('london')) {
    return {
      colors: ['#1a2332', '#8b9cb3'],
      overlay: 'rgba(12, 18, 28, 0.45)',
    };
  }
  if (q.includes('barcelona')) {
    return {
      colors: ['#2a1a28', '#c17855'],
      overlay: 'rgba(20, 12, 18, 0.42)',
    };
  }
  return {
    colors: ['#0a1628', '#2a4a6e'],
    overlay: 'rgba(6, 12, 24, 0.5)',
  };
}

/** Mock WMO-style code → short Vietnamese label for the status rail. */
export function weatherLabelVi(weatherCode: number): string {
  if (weatherCode < 20) return 'Quang đãng';
  if (weatherCode < 50) return 'Nhiều mây';
  if (weatherCode < 70) return 'Mưa nhẹ';
  if (weatherCode < 90) return 'Dông rải rác';
  return 'Theo dõi cảnh báo';
}

export function mockExchangeLineVi(homeCountryCode: string | undefined): string {
  const cc = (homeCountryCode ?? 'EU').toUpperCase();
  if (cc === 'CZ') return '1 EUR ≈ 24,6 CZK · 1 USD ≈ 22,8 CZK (demo)';
  if (cc === 'PL') return '1 EUR ≈ 4,32 PLN · 1 USD ≈ 3,98 PLN (demo)';
  if (cc === 'VN') return '1 EUR ≈ 27.500 ₫ · 1 USD ≈ 25.400 ₫ (demo)';
  return '1 EUR ≈ 1,08 USD (demo tham chiếu)';
}
