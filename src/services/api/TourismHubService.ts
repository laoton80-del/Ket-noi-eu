import { BizType, Prisma, TourismBookingStatus } from '@prisma/client';

import { GLOBAL_MAX_LIST_ITEMS } from '../../constants/globalPerformance';
import { getPrisma } from '../../lib/prisma';
import { fetchEurVndSpot } from '../payment/VigVndFxService';
import {
  computeTourismDualSplitAmounts,
  processTourismBookingSettlement,
  resolveTouristTrustFeeRate,
  TourismBookingSettlementError,
  type TourismBookingSettlementErrorCode,
} from '../WalletService';

export type DiscoverBusinessDto = Readonly<{
  id: string;
  name: string;
  category: string;
  locationLat: number;
  locationLng: number;
  description: string;
  isTopAd: boolean;
  tourismServices: ReadonlyArray<
    Readonly<{
      id: string;
      title: string;
      priceVIG: number;
      description: string;
    }>
  >;
}>;

export type TourismDiscoverDto = Readonly<{
  stays: ReadonlyArray<DiscoverBusinessDto>;
  tours: ReadonlyArray<DiscoverBusinessDto>;
  gastronomy: ReadonlyArray<DiscoverBusinessDto>;
  localFixers: ReadonlyArray<DiscoverBusinessDto>;
}>;

export type CreateTourismBookingInput = Readonly<{
  userId: string;
  businessId: string;
  serviceId: string;
  startDate: Date;
  endDate: Date;
  guestCount: number;
}>;

export type CreateTourismBookingFailure =
  | 'invalid_input'
  | 'business_not_found'
  | 'service_not_found'
  | 'service_business_mismatch'
  | 'wallet_not_found'
  | 'insufficient_funds'
  | 'self_booking_forbidden'
  | 'treasury_not_configured'
  | 'treasury_wallet_missing'
  | 'concurrency_conflict';

export type CreateTourismBookingResult =
  | Readonly<{
      ok: true;
      booking: Readonly<{
        id: string;
        userId: string;
        businessId: string;
        serviceId: string;
        startDate: string;
        endDate: string;
        guestCount: number;
        status: TourismBookingStatus;
        providerFeeVIG: number;
        touristFeeVIG: number;
        totalPaidVIG: number;
        netProviderEarningsVIG: number;
      }>;
    }>
  | Readonly<{ ok: false; reason: CreateTourismBookingFailure }>;

function mapSettlementFailure(code: TourismBookingSettlementErrorCode): CreateTourismBookingFailure {
  switch (code) {
    case 'invalid_input':
      return 'invalid_input';
    case 'business_not_found':
      return 'business_not_found';
    case 'service_not_found':
      return 'service_not_found';
    case 'service_business_mismatch':
      return 'service_business_mismatch';
    case 'wallet_not_found':
      return 'wallet_not_found';
    case 'insufficient_funds':
      return 'insufficient_funds';
    case 'self_booking_forbidden':
      return 'self_booking_forbidden';
    case 'treasury_not_configured':
      return 'treasury_not_configured';
    case 'treasury_wallet_missing':
      return 'treasury_wallet_missing';
    case 'concurrency_conflict':
      return 'concurrency_conflict';
  }
}

/** Slim select — avoids pulling unused Business columns; nested services capped. */
const businessDiscoverSelect = {
  id: true,
  name: true,
  category: true,
  locationLat: true,
  locationLng: true,
  description: true,
  isTopAd: true,
  tourismServices: {
    take: 6,
    orderBy: { priceVIG: 'asc' as const },
    select: {
      id: true,
      title: true,
      priceVIG: true,
      description: true,
    },
  },
} satisfies Prisma.BusinessSelect;

/** Premium trial / paid credits keep merchants above demoted (lockout) rows in hub lists. */
const businessOrderBy = [
  { isPremiumRank: 'desc' as const },
  { isTopAd: 'desc' as const },
  { name: 'asc' as const },
] satisfies Prisma.BusinessOrderByWithRelationInput[];

function mapBusiness(row: {
  id: string;
  name: string;
  category: string;
  locationLat: number;
  locationLng: number;
  description: string;
  isTopAd: boolean;
  tourismServices: Array<{
    id: string;
    title: string;
    priceVIG: number;
    description: string;
  }>;
}): DiscoverBusinessDto {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    locationLat: row.locationLat,
    locationLng: row.locationLng,
    description: row.description,
    isTopAd: row.isTopAd,
    tourismServices: row.tourismServices.map((s) => ({
      id: s.id,
      title: s.title,
      priceVIG: s.priceVIG,
      description: s.description,
    })),
  };
}

export async function getTourismDiscover(): Promise<TourismDiscoverDto> {
  const prisma = getPrisma();
  const take = GLOBAL_MAX_LIST_ITEMS;

  const [stays, tours, gastronomy, localFixers] = await Promise.all([
    prisma.business.findMany({
      where: { category: { in: [BizType.HOTEL, BizType.HOMESTAY] } },
      take,
      orderBy: businessOrderBy,
      select: businessDiscoverSelect,
    }),
    prisma.business.findMany({
      where: { category: BizType.TOUR_OPERATOR },
      take,
      orderBy: businessOrderBy,
      select: businessDiscoverSelect,
    }),
    prisma.business.findMany({
      where: { category: BizType.RESTAURANT },
      take,
      orderBy: businessOrderBy,
      select: businessDiscoverSelect,
    }),
    prisma.business.findMany({
      where: { category: BizType.LOCAL_EXPERIENCE },
      take,
      orderBy: businessOrderBy,
      select: businessDiscoverSelect,
    }),
  ]);

  return {
    stays: stays.map(mapBusiness),
    tours: tours.map(mapBusiness),
    gastronomy: gastronomy.map(mapBusiness),
    localFixers: localFixers.map(mapBusiness),
  };
}

/** Server-computed dual split (read-only). Client must not re-derive fees — use this DTO for display only. */
export type TourismQuoteDto = Readonly<{
  basePriceVIG: number;
  /** ViGlobal Trust & AI Shield fee on tourist (5–7% band, see `trustFeeRateApplied`). */
  touristFeeVIG: number;
  /** Total debit from tourist wallet = base + tourist fee. */
  totalVIG: number;
  providerFeeVIG: number;
  netProviderEarningsVIG: number;
  trustFeeRateApplied: number;
  providerCommissionRate: number;
  nights: number;
  unitPriceVIG: number;
  guestCount: number;
  /** Live EUR→VND (VIG ≡ EUR) — indicative; booking locks its own spot at pay time. */
  fx: Readonly<{
    eurVndRate: number;
    asOfIso: string;
    source: string;
    indicativeOffRampVnd: number;
  }>;
}>;

export type TourismQuoteFailure =
  | 'invalid_input'
  | 'business_not_found'
  | 'service_not_found'
  | 'service_business_mismatch';

export type TourismQuoteInput = Readonly<{
  businessId: string;
  serviceId: string;
  startDate: Date;
  endDate: Date;
  guestCount: number;
}>;

function tourismStayNightsQuote(start: Date, end: Date): number {
  const MS_PER_DAY = 86_400_000;
  const ms = end.getTime() - start.getTime();
  if (!Number.isFinite(ms) || ms <= 0) return 0;
  return Math.max(1, Math.ceil(ms / MS_PER_DAY));
}

/**
 * Authoritative pricing quote — same math as `processTourismBookingSettlement`, no wallet mutation.
 */
export async function quoteTourismBooking(
  input: TourismQuoteInput
): Promise<Readonly<{ ok: true; quote: TourismQuoteDto } | { ok: false; reason: TourismQuoteFailure }>> {
  const businessId = input.businessId.trim();
  const serviceId = input.serviceId.trim();
  if (businessId.length === 0 || serviceId.length === 0) {
    return { ok: false, reason: 'invalid_input' };
  }
  if (!(input.startDate instanceof Date) || Number.isNaN(input.startDate.getTime())) {
    return { ok: false, reason: 'invalid_input' };
  }
  if (!(input.endDate instanceof Date) || Number.isNaN(input.endDate.getTime())) {
    return { ok: false, reason: 'invalid_input' };
  }
  if (input.endDate.getTime() <= input.startDate.getTime()) {
    return { ok: false, reason: 'invalid_input' };
  }
  if (!Number.isInteger(input.guestCount) || input.guestCount < 1 || input.guestCount > 50) {
    return { ok: false, reason: 'invalid_input' };
  }

  const prisma = getPrisma();
  const business = await prisma.business.findUnique({ where: { id: businessId } });
  if (!business) {
    return { ok: false, reason: 'business_not_found' };
  }

  const service = await prisma.tourismService.findFirst({
    where: { id: serviceId, businessId },
  });
  if (!service) {
    const orphan = await prisma.tourismService.findUnique({ where: { id: serviceId } });
    if (!orphan) {
      return { ok: false, reason: 'service_not_found' };
    }
    return { ok: false, reason: 'service_business_mismatch' };
  }

  const unitPrice = Number.isFinite(service.priceVIG) ? service.priceVIG : 0;
  const nights = tourismStayNightsQuote(input.startDate, input.endDate);
  const amounts = computeTourismDualSplitAmounts(unitPrice, input.guestCount, nights);
  const spot = await fetchEurVndSpot();
  const indicativeOffRampVnd = Math.round(amounts.totalPaidVIG * spot.eurVnd);

  return {
    ok: true,
    quote: {
      basePriceVIG: amounts.basePriceVIG,
      touristFeeVIG: amounts.touristFeeVIG,
      totalVIG: amounts.totalPaidVIG,
      providerFeeVIG: amounts.providerFeeVIG,
      netProviderEarningsVIG: amounts.netProviderEarningsVIG,
      trustFeeRateApplied: resolveTouristTrustFeeRate(),
      providerCommissionRate: 0.05,
      nights,
      unitPriceVIG: unitPrice,
      guestCount: input.guestCount,
      fx: {
        eurVndRate: spot.eurVnd,
        asOfIso: spot.asOfIso,
        source: spot.source,
        indicativeOffRampVnd,
      },
    },
  };
}

export async function createTourismBooking(
  input: CreateTourismBookingInput
): Promise<CreateTourismBookingResult> {
  const userId = input.userId.trim();
  const businessId = input.businessId.trim();
  const serviceId = input.serviceId.trim();
  if (userId.length === 0 || businessId.length === 0 || serviceId.length === 0) {
    return { ok: false, reason: 'invalid_input' };
  }
  if (!(input.startDate instanceof Date) || Number.isNaN(input.startDate.getTime())) {
    return { ok: false, reason: 'invalid_input' };
  }
  if (!(input.endDate instanceof Date) || Number.isNaN(input.endDate.getTime())) {
    return { ok: false, reason: 'invalid_input' };
  }
  if (input.endDate.getTime() <= input.startDate.getTime()) {
    return { ok: false, reason: 'invalid_input' };
  }
  if (!Number.isInteger(input.guestCount) || input.guestCount < 1 || input.guestCount > 50) {
    return { ok: false, reason: 'invalid_input' };
  }

  try {
    const spot = await fetchEurVndSpot();
    const lockedAt = new Date();
    const row = await processTourismBookingSettlement({
      touristUserId: userId,
      businessId,
      serviceId,
      startDate: input.startDate,
      endDate: input.endDate,
      guestCount: input.guestCount,
      fxLock: { eurVndRate: spot.eurVnd, lockedAt },
    });

    return {
      ok: true,
      booking: {
        id: row.id,
        userId: row.userId,
        businessId: row.businessId,
        serviceId: row.serviceId,
        startDate: row.startDate.toISOString(),
        endDate: row.endDate.toISOString(),
        guestCount: row.guestCount,
        status: row.status,
        providerFeeVIG: row.providerFeeVIG,
        touristFeeVIG: row.touristFeeVIG,
        totalPaidVIG: row.totalPaidVIG,
        netProviderEarningsVIG: row.netProviderEarningsVIG,
      },
    };
  } catch (e) {
    if (e instanceof TourismBookingSettlementError) {
      return { ok: false, reason: mapSettlementFailure(e.code) };
    }
    throw e;
  }
}
