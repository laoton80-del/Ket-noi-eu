export type NearbyService = {
  name: string;
  distance: string;
  rating: number;
};

const MOCK_BY_SERVICE: Record<string, NearbyService[]> = {
  'Làm móng': [
    { name: 'Hanoi Beauty Nails', distance: '500m', rating: 4.8 },
    { name: 'Lotus Nail Studio', distance: '1.1km', rating: 4.6 },
    { name: 'Salon ABC', distance: '1.4km', rating: 4.5 },
  ],
  'Nhà hàng': [
    { name: 'Phở Việt Praha', distance: '600m', rating: 4.9 },
    { name: 'Bếp Quê', distance: '1.2km', rating: 4.7 },
    { name: 'Quán Nhà', distance: '1.8km', rating: 4.6 },
  ],
  'Khám bệnh': [
    { name: 'Clinic Central', distance: '700m', rating: 4.7 },
    { name: 'HealthCare Praha', distance: '1.3km', rating: 4.5 },
    { name: 'Medi Point', distance: '2.0km', rating: 4.4 },
  ],
};

export function findNearbyServices(service: string, _location?: string | null): NearbyService[] {
  const key = service.trim();
  return MOCK_BY_SERVICE[key] ?? [];
}

export function detectSelectedPlace(
  userInput: string,
  suggestions: NearbyService[]
): NearbyService | null {
  const raw = userInput.trim().toLowerCase();
  if (!raw || !suggestions.length) return null;

  const byIndex = raw.match(/^\s*([1-9]\d*)\s*$/);
  if (byIndex?.[1]) {
    const idx = Number(byIndex[1]) - 1;
    return suggestions[idx] ?? null;
  }

  const byName = suggestions.find((item) => raw.includes(item.name.toLowerCase()));
  return byName ?? null;
}
