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

/** i18n lookup for Local merchant inbox status / wallet badge copy. */
export type LocalMerchantCopyTranslate = (key: string, options?: Record<string, unknown>) => string;

const MERCHANT_STATUS_PREFIX = 'local.merchantInbox.statusCopy.';
const MERCHANT_WALLET_PREFIX = 'local.merchantInbox.walletBadge.';

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

/** English fallback labels for tests without i18n bootstrap. */
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
      return 'Merchant declined this request';
    case LocalServiceRequestStatus.USER_CANCELLED:
      return 'Cancelled by requester';
    case LocalServiceRequestStatus.OPS_CANCELLED:
      return 'Cancelled by operations';
    case LocalServiceRequestStatus.EXPIRED:
      return 'This request expired';
    default:
      return 'Unknown status';
  }
}

export function localMerchantRequestStatusI18nKey(status: string): string {
  switch (status) {
    case LocalServiceRequestStatus.REQUESTED:
      return `${MERCHANT_STATUS_PREFIX}requested`;
    case LocalServiceRequestStatus.MERCHANT_REVIEW:
      return `${MERCHANT_STATUS_PREFIX}merchantReview`;
    case LocalServiceRequestStatus.CONFIRMED:
      return `${MERCHANT_STATUS_PREFIX}confirmed`;
    case LocalServiceRequestStatus.IN_PROGRESS:
      return `${MERCHANT_STATUS_PREFIX}inProgress`;
    case LocalServiceRequestStatus.COMPLETED:
      return `${MERCHANT_STATUS_PREFIX}completed`;
    case LocalServiceRequestStatus.REJECTED:
      return `${MERCHANT_STATUS_PREFIX}rejected`;
    case LocalServiceRequestStatus.USER_CANCELLED:
      return `${MERCHANT_STATUS_PREFIX}userCancelled`;
    case LocalServiceRequestStatus.OPS_CANCELLED:
      return `${MERCHANT_STATUS_PREFIX}opsCancelled`;
    case LocalServiceRequestStatus.EXPIRED:
      return `${MERCHANT_STATUS_PREFIX}expired`;
    default:
      return `${MERCHANT_STATUS_PREFIX}unknown`;
  }
}

export function localMerchantWalletBadgeI18nKey(
  walletMode: string,
  walletPhase: string
): { key: string; options?: Record<string, unknown> } {
  if (
    walletMode === LocalWalletMode.REQUEST_ONLY_NO_CHARGE &&
    walletPhase === LocalWalletPhase.NONE
  ) {
    return { key: `${MERCHANT_WALLET_PREFIX}requestOnlyNoCharge` };
  }
  if (walletPhase === LocalWalletPhase.NONE) {
    return { key: `${MERCHANT_WALLET_PREFIX}phaseNone` };
  }
  return { key: `${MERCHANT_WALLET_PREFIX}phaseOther`, options: { phase: walletPhase } };
}

export function localWalletBadgeLabel(
  walletMode: string,
  walletPhase: string
): string {
  if (
    walletMode === LocalWalletMode.REQUEST_ONLY_NO_CHARGE &&
    walletPhase === LocalWalletPhase.NONE
  ) {
    return 'No payment has been captured · Request-only / no-charge · walletPhase NONE';
  }
  if (walletPhase === LocalWalletPhase.NONE) {
    return 'No payment has been captured · walletPhase NONE';
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
  >,
  t: LocalMerchantCopyTranslate
): LocalInboxDisplayLabels {
  const wallet = localMerchantWalletBadgeI18nKey(request.walletMode, request.walletPhase);
  return {
    statusLabel: t(localMerchantRequestStatusI18nKey(request.status)),
    walletBadge: t(wallet.key, wallet.options),
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
  extraNotes: readonly string[],
  t?: LocalMerchantCopyTranslate
): string {
  const reviewNote = t
    ? t('local.merchantInbox.reviewPendingNote')
    : 'Waiting for merchant review';
  const confirmedNote = t
    ? t('local.merchantInbox.confirmedNote')
    : 'Confirmed does not mean paid';
  const parts = [
    labels.statusLabel,
    labels.walletBadge,
    labels.showReviewPendingNote ? reviewNote : '',
    labels.showConfirmedNote ? confirmedNote : '',
    ...extraNotes,
  ];
  return parts.filter((p) => p.length > 0).join(' ');
}
