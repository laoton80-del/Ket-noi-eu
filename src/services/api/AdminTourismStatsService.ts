import { BizType, TourismBookingStatus } from '@prisma/client';

import { GLOBAL_MAX_LIST_ITEMS } from '../../constants/globalPerformance';
import { getPrisma } from '../../lib/prisma';

function roundMoney(n: number): number {
  return Math.round(n * 10000) / 10000;
}

export type BookingStatusSplitDto = Readonly<
  Record<'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED', number>
>;

export type TopTourismServiceDto = Readonly<{
  serviceId: string;
  title: string;
  businessId: string;
  businessName: string;
  businessCategory: BizType;
  bookingCount: number;
}>;

export type AdminTourismStatsDto = Readonly<{
  /** Sum of tourist-paid totals (`totalPaidVIG`), excluding cancelled bookings. */
  totalTourismRevenueVIG: number;
  /** ViGlobal master revenue: sum of `providerFeeVIG + touristFeeVIG` on non-cancelled bookings. */
  platformRevenueCutVIG: number;
  /** Active inbound catalog partners: owner phone +84 and tourism `BizType`. */
  activeVNBusinesses: number;
  bookingStatusSplit: BookingStatusSplitDto;
  topPerformingServices: readonly TopTourismServiceDto[];
}>;

const VN_TOURISM_CATEGORIES: readonly BizType[] = [
  BizType.HOTEL,
  BizType.HOMESTAY,
  BizType.TOUR_OPERATOR,
  BizType.LOCAL_EXPERIENCE,
  BizType.RESTAURANT,
  BizType.TRANSPORT,
] as const;

export async function computeAdminTourismStats(): Promise<AdminTourismStatsDto> {
  const prisma = getPrisma();

  const activeBookings = { status: { not: TourismBookingStatus.CANCELLED } } as const;

  const [revenueAgg, feeAgg, vnBizCount, statusGroups, topGroups] = await Promise.all([
    prisma.tourismBooking.aggregate({
      where: activeBookings,
      _sum: { totalPaidVIG: true },
    }),
    prisma.tourismBooking.aggregate({
      where: activeBookings,
      _sum: { providerFeeVIG: true, touristFeeVIG: true },
    }),
    prisma.business.count({
      where: {
        category: { in: [...VN_TOURISM_CATEGORIES] },
        owner: { phoneNumber: { startsWith: '+84' } },
      },
    }),
    prisma.tourismBooking.groupBy({
      by: ['status'],
      _count: { id: true },
    }),
    prisma.tourismBooking.groupBy({
      by: ['serviceId'],
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 5,
    }),
  ]);

  const splitMutable: Record<TourismBookingStatus, number> = {
    [TourismBookingStatus.PENDING]: 0,
    [TourismBookingStatus.CONFIRMED]: 0,
    [TourismBookingStatus.COMPLETED]: 0,
    [TourismBookingStatus.CANCELLED]: 0,
  };
  for (const row of statusGroups) {
    splitMutable[row.status] = row._count.id;
  }
  const bookingStatusSplit: BookingStatusSplitDto = {
    PENDING: splitMutable[TourismBookingStatus.PENDING],
    CONFIRMED: splitMutable[TourismBookingStatus.CONFIRMED],
    COMPLETED: splitMutable[TourismBookingStatus.COMPLETED],
    CANCELLED: splitMutable[TourismBookingStatus.CANCELLED],
  };

  const serviceIds = topGroups.map((g) => g.serviceId);
  const services =
    serviceIds.length === 0
      ? []
      : await prisma.tourismService.findMany({
          where: { id: { in: serviceIds } },
          take: GLOBAL_MAX_LIST_ITEMS,
          select: {
            id: true,
            title: true,
            businessId: true,
            business: {
              select: { name: true, category: true },
            },
          },
        });

  const countByServiceId = new Map<string, number>(
    topGroups.map((g) => [g.serviceId, g._count.id])
  );

  const topPerformingServices: TopTourismServiceDto[] = services
    .map((s) => ({
      serviceId: s.id,
      title: s.title,
      businessId: s.businessId,
      businessName: s.business.name,
      businessCategory: s.business.category,
      bookingCount: countByServiceId.get(s.id) ?? 0,
    }))
    .sort((a, b) => b.bookingCount - a.bookingCount);

  const totalTourismRevenueVIG = roundMoney(revenueAgg._sum.totalPaidVIG ?? 0);
  const pf = feeAgg._sum.providerFeeVIG ?? 0;
  const tf = feeAgg._sum.touristFeeVIG ?? 0;
  const platformRevenueCutVIG = roundMoney(pf + tf);

  return {
    totalTourismRevenueVIG,
    platformRevenueCutVIG,
    activeVNBusinesses: vnBizCount,
    bookingStatusSplit,
    topPerformingServices,
  };
}
