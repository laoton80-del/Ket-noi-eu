/** KNG Travel — curated stays from the diaspora network (hospitality vertical only). */

export type KngTravelIndustryType = 'HOSPITALITY';

export type KngTravelHospitalityMerchant = Readonly<{
  readonly id: string;
  readonly name: string;
  readonly cityLabel: string;
  readonly tagline: string;
  readonly rating: number;
  readonly industryType: KngTravelIndustryType;
}>;

export const KN_TRAVEL_HOSPITALITY_MERCHANTS: readonly KngTravelHospitalityMerchant[] = [
  {
    id: 'h_praha_mai_homestay',
    name: 'Mai Homestay · Vinohrady',
    cityLabel: 'Praha',
    tagline: 'Bếp nhỏ, đón sân bay, host tiếng Việt',
    rating: 4.9,
    industryType: 'HOSPITALITY',
  },
  {
    id: 'h_paris_rive_gauche',
    name: 'Rive Gauche Việt House',
    cityLabel: 'Paris',
    tagline: 'Studio view sông Seine — cộng đồng Kiều bào tin cậy',
    rating: 4.95,
    industryType: 'HOSPITALITY',
  },
  {
    id: 'h_berlin_kreuz_stay',
    name: 'Kreuzberg Garden Stay',
    cityLabel: 'Berlin',
    tagline: 'Sân vườn yên tĩnh, gần chợ Đông',
    rating: 4.85,
    industryType: 'HOSPITALITY',
  },
  {
    id: 'h_amsterdam_canal',
    name: 'Canal House 9 · Jordaan',
    cityLabel: 'Amsterdam',
    tagline: 'Nhà tập thể kiểu Hà Lan — Wi‑Fi nhanh cho remote',
    rating: 4.88,
    industryType: 'HOSPITALITY',
  },
  {
    id: 'h_warsaw_old_town',
    name: 'Old Town Loft Warsaw',
    cityLabel: 'Warszawa',
    tagline: 'View phố cổ — hỗ trợ visa & SIM',
    rating: 4.82,
    industryType: 'HOSPITALITY',
  },
];

/** Match flight / search destination to diaspora homestay listings (fuzzy, city-first). */
export function filterHospitalityMerchantsForDestinationQuery(
  query: string
): readonly KngTravelHospitalityMerchant[] {
  const raw = query.trim().toLowerCase();
  if (raw.length < 2) return [];
  const tokens = raw.split(/[\s,/]+/).filter((t) => t.length >= 2);
  const hay = [raw, ...tokens];
  return KN_TRAVEL_HOSPITALITY_MERCHANTS.filter((m) => {
    const city = m.cityLabel.toLowerCase();
    return hay.some((h) => city.includes(h) || h.includes(city));
  });
}
