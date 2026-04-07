/**
 * Demo merchant pool for radar / marketplace flows. Grocery rows use distinct `grocery_retail` /
 * `grocery_wholesale`; `toB2BAvailabilityInput` maps them to matching `B2BBusinessType` (Phase 3).
 */
import { rankMerchants } from './merchantRanking';
import type { MarketplaceBestServiceResult, MarketplaceMerchant, MarketplaceUserContext } from './types';

const MERCHANTS: MarketplaceMerchant[] = [
  {
    id: 'm-nails-01',
    name: 'Lotus Nail Studio',
    businessType: 'nails',
    distanceKm: 1.1,
    rating: 4.8,
    available: true,
    priceTier: 2,
    supportsAiBooking: true,
    b2bTenantId: 'tenant-lotus',
    b2bLocationId: 'loc-prague-1',
  },
  {
    id: 'm-rest-01',
    name: 'Pho Viet Praha',
    businessType: 'restaurant',
    distanceKm: 0.8,
    rating: 4.9,
    available: true,
    priceTier: 2,
    supportsAiBooking: true,
    b2bTenantId: 'tenant-pho',
    b2bLocationId: 'loc-prague-2',
  },
  {
    id: 'm-clinic-01',
    name: 'Clinic Central',
    businessType: 'clinic',
    distanceKm: 2.2,
    rating: 4.6,
    available: true,
    priceTier: 3,
    supportsAiBooking: true,
    b2bTenantId: 'tenant-clinic',
    b2bLocationId: 'loc-prague-3',
  },
  {
    id: 'm-grocery-retail-01',
    name: 'Tạp hoá · Thực phẩm (demo)',
    businessType: 'grocery_retail',
    distanceKm: 1.7,
    rating: 4.5,
    available: false,
    priceTier: 1,
    supportsAiBooking: false,
  },
  {
    id: 'm-grocery-wholesale-01',
    name: 'Đổ hàng · Đặt hàng sỉ (demo)',
    businessType: 'grocery_wholesale',
    distanceKm: 2.4,
    rating: 4.4,
    available: true,
    priceTier: 1,
    supportsAiBooking: false,
  },
];

function byBusinessType(ctx: MarketplaceUserContext): MarketplaceMerchant[] {
  if (ctx.businessType === 'general') return MERCHANTS;
  return MERCHANTS.filter((m) => m.businessType === ctx.businessType);
}

export function findBestService(userContext: MarketplaceUserContext): MarketplaceBestServiceResult {
  const pool = byBusinessType(userContext);
  const ranked = rankMerchants(pool, userContext);
  return {
    selected: ranked[0] ?? null,
    candidates: ranked.slice(0, 5),
  };
}
