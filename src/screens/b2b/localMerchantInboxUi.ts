import {
  LocalServiceRequestStatus,
  LocalWalletMode,
  LocalWalletPhase,
} from '@prisma/client';

import {
  deriveLocalMerchantInboxActions,
  type LocalMerchantInboxActions,
} from '../../services/local/localMerchantInboxView';
import type { LocalMerchantInboxRequest } from '../../services/localMerchantInboxApi';

export type LocalInboxFilterChip =
  | 'all'
  | 'pending'
  | 'confirmed'
  | 'active'
  | 'completed'
  | 'closed';

export type LocalInboxDisplayLabels = Readonly<{
  statusLabel: string;
  walletBadge: string;
  showReviewPendingNote: boolean;
  showConfirmedNote: boolean;
  actions: LocalMerchantInboxActions;
}>;

/** Forbidden payment/settlement copy — used by UI display tests only. */
export const LOCAL_INBOX_FORBIDDEN_COPY = [
  'escrow',
  'deposit',
  'refund',
  'provider paid',
  'payout',
  'settlement',
  'paid booking',
  'guaranteed',
  'dispatched',
] as const;

export function localRequestStatusLabel(status: string): string {
  switch (status) {
    case LocalServiceRequestStatus.REQUESTED:
      return 'Request submitted';
    case LocalServiceRequestStatus.MERCHANT_REVIEW:
      return 'Waiting for merchant review';
    case LocalServiceRequestStatus.CONFIRMED:
      return 'Confirmed';
    case LocalServiceRequestStatus.IN_PROGRESS:
      return 'In progress';
    case LocalServiceRequestStatus.COMPLETED:
      return 'Completed';
    case LocalServiceRequestStatus.REJECTED:
      return 'Rejected';
    case LocalServiceRequestStatus.USER_CANCELLED:
      return 'Cancelled by requester';
    case LocalServiceRequestStatus.OPS_CANCELLED:
      return 'Cancelled by operations';
    case LocalServiceRequestStatus.EXPIRED:
      return 'Expired';
    default:
      return 'Unknown status';
  }
}

export function localWalletBadgeLabel(
  walletMode: string,
  walletPhase: string
): string {
  if (
    walletMode === LocalWalletMode.REQUEST_ONLY_NO_CHARGE &&
    walletPhase === LocalWalletPhase.NONE
  ) {
    return 'No payment captured · Request-only / no-charge · walletPhase NONE';
  }
  if (walletPhase === LocalWalletPhase.NONE) {
    return 'No payment captured · walletPhase NONE';
  }
  return `walletPhase ${walletPhase}`;
}

export function shouldShowLocalReviewPendingNote(status: string): boolean {
  return (
    status === LocalServiceRequestStatus.REQUESTED ||
    status === LocalServiceRequestStatus.MERCHANT_REVIEW
  );
}

export function shouldShowLocalConfirmedNote(status: string): boolean {
  return status === LocalServiceRequestStatus.CONFIRMED;
}

export function buildLocalInboxDisplayLabels(
  request: Pick<
    LocalMerchantInboxRequest,
    'status' | 'walletMode' | 'walletPhase' | 'actions'
  >
): LocalInboxDisplayLabels {
  return {
    statusLabel: localRequestStatusLabel(request.status),
    walletBadge: localWalletBadgeLabel(request.walletMode, request.walletPhase),
    showReviewPendingNote: shouldShowLocalReviewPendingNote(request.status),
    showConfirmedNote: shouldShowLocalConfirmedNote(request.status),
    actions: request.actions,
  };
}

export function attachLocalInboxActions(
  request: Omit<LocalMerchantInboxRequest, 'actions'>
): LocalMerchantInboxRequest {
  const actions = deriveLocalMerchantInboxActions({
    status: request.status as LocalServiceRequestStatus,
    walletMode: request.walletMode as LocalWalletMode,
    walletPhase: request.walletPhase as LocalWalletPhase,
  });
  return { ...request, actions };
}

export function filterLocalInboxRequests(
  requests: readonly LocalMerchantInboxRequest[],
  chip: LocalInboxFilterChip
): readonly LocalMerchantInboxRequest[] {
  if (chip === 'all') return requests;
  if (chip === 'pending') {
    return requests.filter(
      (r) =>
        r.status === LocalServiceRequestStatus.REQUESTED ||
        r.status === LocalServiceRequestStatus.MERCHANT_REVIEW
    );
  }
  if (chip === 'confirmed') {
    return requests.filter((r) => r.status === LocalServiceRequestStatus.CONFIRMED);
  }
  if (chip === 'active') {
    return requests.filter((r) => r.status === LocalServiceRequestStatus.IN_PROGRESS);
  }
  if (chip === 'completed') {
    return requests.filter((r) => r.status === LocalServiceRequestStatus.COMPLETED);
  }
  return requests.filter(
    (r) =>
      r.status === LocalServiceRequestStatus.REJECTED ||
      r.status === LocalServiceRequestStatus.USER_CANCELLED ||
      r.status === LocalServiceRequestStatus.OPS_CANCELLED ||
      r.status === LocalServiceRequestStatus.EXPIRED
  );
}

export function collectLocalInboxVisibleCopy(
  labels: LocalInboxDisplayLabels,
  extraNotes: readonly string[]
): string {
  const parts = [
    labels.statusLabel,
    labels.walletBadge,
    labels.showReviewPendingNote ? 'Waiting for merchant review' : '',
    labels.showConfirmedNote ? 'Confirmed does not mean paid' : '',
    ...extraNotes,
  ];
  return parts.filter((p) => p.length > 0).join(' ');
}
