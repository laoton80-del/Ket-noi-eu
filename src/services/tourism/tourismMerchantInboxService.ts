import type { TourismBookingStatus, TourismSettlementMode } from '@prisma/client';

import { getPrisma } from '../../lib/prisma';

import {
  deriveTourismMerchantDisplayState,
  deriveTourismMerchantInboxActions,
  deriveTourismWalletPhase,
  type TourismMerchantDisplayState,
  type TourismMerchantInboxActions,
  type TourismWalletPhase,
} from './tourismMerchantInboxView';

export type TourismMerchantInboxBookingDto = Readonly<{
  id: string;
  businessId: string;
  businessName: string;
  status: TourismBookingStatus;
  settlementMode: TourismSettlementMode;
  totalPaidVIG: number;
  netProviderEarningsVIG: number;
  providerFeeVIG: number;
  touristFeeVIG: number;
  providerSettledAt: string | null;
  confirmedAt: string | null;
  cancelledAt: string | null;
  cancelReason: string | null;
  createdAt: string | null;
  startDate: string;
  endDate: string;
  guestCount: number;
  tourist: Readonly<{
    userId: string;
    displayName: string | null;
  }>;
  service: Readonly<{
    id: string;
    title: string;
  }>;
  walletPhase: TourismWalletPhase;
  merchantDisplayState: TourismMerchantDisplayState;
  actions: TourismMerchantInboxActions;
}>;

export type ListMerchantTourismBookingsInput = Readonly<{
  merchantUserId: string;
  limit?: number;
  status?: TourismBookingStatus;
}>;

export type ListMerchantTourismBookingsResult = Readonly<{
  bookings: readonly TourismMerchantInboxBookingDto[];
}>;

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 100;

function toIso(d: Date | null | undefined): string | null {
  if (d == null) return null;
  return d.toISOString();
}

/**
 * List tourism bookings for businesses owned by `merchantUserId`.
 * Does not expose wallet balances or ledger rows.
 */
export async function listMerchantTourismBookings(
  input: ListMerchantTourismBookingsInput
): Promise<ListMerchantTourismBookingsResult> {
  const merchantUserId = input.merchantUserId.trim();
  if (merchantUserId.length === 0) {
    return { bookings: [] };
  }

  const limit = Math.min(
    MAX_LIMIT,
    Math.max(1, input.limit ?? DEFAULT_LIMIT)
  );

  const businesses = await getPrisma().business.findMany({
    where: { ownerId: merchantUserId },
    select: { id: true, name: true },
  });

  if (businesses.length === 0) {
    return { bookings: [] };
  }

  const businessNameById = new Map(businesses.map((b) => [b.id, b.name]));
  const businessIds = businesses.map((b) => b.id);

  const rows = await getPrisma().tourismBooking.findMany({
    where: {
      businessId: { in: businessIds },
      ...(input.status != null ? { status: input.status } : {}),
    },
    orderBy: [{ createdAt: 'desc' }, { startDate: 'desc' }],
    take: limit,
    include: {
      user: {
        select: {
          id: true,
          profile: { select: { fullName: true } },
        },
      },
      service: {
        select: { id: true, title: true },
      },
    },
  });

  const bookings = rows.map((row): TourismMerchantInboxBookingDto => {
    const inboxRow = {
      status: row.status,
      settlementMode: row.settlementMode,
      providerSettledAt: row.providerSettledAt,
      confirmedAt: row.confirmedAt,
      cancelledAt: row.cancelledAt,
      totalPaidVIG: row.totalPaidVIG,
    };

    return {
      id: row.id,
      businessId: row.businessId,
      businessName: businessNameById.get(row.businessId) ?? '',
      status: row.status,
      settlementMode: row.settlementMode,
      totalPaidVIG: row.totalPaidVIG,
      netProviderEarningsVIG: row.netProviderEarningsVIG,
      providerFeeVIG: row.providerFeeVIG,
      touristFeeVIG: row.touristFeeVIG,
      providerSettledAt: toIso(row.providerSettledAt),
      confirmedAt: toIso(row.confirmedAt),
      cancelledAt: toIso(row.cancelledAt),
      cancelReason: row.cancelReason,
      createdAt: toIso(row.createdAt ?? row.fxLockedAt),
      startDate: row.startDate.toISOString(),
      endDate: row.endDate.toISOString(),
      guestCount: row.guestCount,
      tourist: {
        userId: row.user.id,
        displayName: row.user.profile?.fullName ?? null,
      },
      service: {
        id: row.service.id,
        title: row.service.title,
      },
      walletPhase: deriveTourismWalletPhase(inboxRow),
      merchantDisplayState: deriveTourismMerchantDisplayState(inboxRow),
      actions: deriveTourismMerchantInboxActions(inboxRow),
    };
  });

  return { bookings };
}
