import {
  LocalServiceRequestStatus,
  LocalWalletMode,
  LocalWalletPhase,
} from '@prisma/client';

import { evaluateLocalUserRequestCancelEligibility } from '../../services/local/localUserRequestCancelEligibility';
import type { LocalUserRequestListItem } from '../../services/localUserRequestApi';

export type LocalUserStatusFilterChip =
  | 'all'
  | 'pending'
  | 'confirmed'
  | 'active'
  | 'completed'
  | 'closed';

export type LocalUserRequestActions = Readonly<{
  canCancel: boolean;
}>;

export type LocalUserRequestDisplayLabels = Readonly<{
  statusLabel: string;
  walletBadge: string;
  showReviewPendingNote: boolean;
  showConfirmedNote: boolean;
  showCancelHint: boolean;
  actions: LocalUserRequestActions;
}>;

/** i18n lookup for Local user request status / wallet badge copy. */
export type LocalUserCopyTranslate = (key: string, options?: Record<string, unknown>) => string;

const USER_STATUS_PREFIX = 'local.userRequestStatus.statusCopy.';
const USER_WALLET_PREFIX = 'local.userRequestStatus.walletBadge.';

/** Forbidden payment/settlement/VIG copy — UI display tests only. */
export const LOCAL_USER_STATUS_FORBIDDEN_COPY = [
  'escrow',
  'deposit',
  'refund',
  'provider paid',
  'payout',
  'settlement',
  'paid booking',
  'guaranteed',
  'dispatched',
  'vig',
] as const;

/** English fallback labels for tests without i18n bootstrap. */
export function localUserRequestStatusLabel(status: string): string {
  switch (status) {
    case LocalServiceRequestStatus.REQUESTED:
      return 'Request submitted';
    case LocalServiceRequestStatus.MERCHANT_REVIEW:
      return 'Waiting for merchant review';
    case LocalServiceRequestStatus.CONFIRMED:
      return 'Merchant confirmed your request';
    case LocalServiceRequestStatus.IN_PROGRESS:
      return 'In progress';
    case LocalServiceRequestStatus.COMPLETED:
      return 'Completed';
    case LocalServiceRequestStatus.REJECTED:
      return 'Merchant declined this request';
    case LocalServiceRequestStatus.USER_CANCELLED:
      return 'Cancelled';
    case LocalServiceRequestStatus.OPS_CANCELLED:
      return 'Cancelled by support';
    case LocalServiceRequestStatus.EXPIRED:
      return 'This request expired';
    default:
      return 'Request updated';
  }
}

export function localUserRequestStatusI18nKey(status: string): string {
  switch (status) {
    case LocalServiceRequestStatus.REQUESTED:
      return `${USER_STATUS_PREFIX}requested`;
    case LocalServiceRequestStatus.MERCHANT_REVIEW:
      return `${USER_STATUS_PREFIX}merchantReview`;
    case LocalServiceRequestStatus.CONFIRMED:
      return `${USER_STATUS_PREFIX}confirmed`;
    case LocalServiceRequestStatus.IN_PROGRESS:
      return `${USER_STATUS_PREFIX}inProgress`;
    case LocalServiceRequestStatus.COMPLETED:
      return `${USER_STATUS_PREFIX}completed`;
    case LocalServiceRequestStatus.REJECTED:
      return `${USER_STATUS_PREFIX}rejected`;
    case LocalServiceRequestStatus.USER_CANCELLED:
      return `${USER_STATUS_PREFIX}userCancelled`;
    case LocalServiceRequestStatus.OPS_CANCELLED:
      return `${USER_STATUS_PREFIX}opsCancelled`;
    case LocalServiceRequestStatus.EXPIRED:
      return `${USER_STATUS_PREFIX}expired`;
    default:
      return `${USER_STATUS_PREFIX}unknown`;
  }
}

export function localUserWalletBadgeI18nKey(
  walletMode: string,
  walletPhase: string
): { key: string; options?: Record<string, unknown> } {
  if (
    walletMode === LocalWalletMode.REQUEST_ONLY_NO_CHARGE &&
    walletPhase === LocalWalletPhase.NONE
  ) {
    return { key: `${USER_WALLET_PREFIX}requestOnlyNoCharge` };
  }
  if (walletPhase === LocalWalletPhase.NONE) {
    return { key: `${USER_WALLET_PREFIX}phaseNone` };
  }
  return { key: `${USER_WALLET_PREFIX}phaseOther`, options: { phase: walletPhase } };
}

export function localUserWalletBadgeLabel(walletMode: string, walletPhase: string): string {
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

export function deriveLocalUserRequestActions(
  row: Pick<LocalUserRequestListItem, 'status' | 'walletMode' | 'walletPhase'>
): LocalUserRequestActions {
  const eligibility = evaluateLocalUserRequestCancelEligibility({
    status: row.status as LocalServiceRequestStatus,
    walletMode: row.walletMode as LocalWalletMode,
    walletPhase: row.walletPhase as LocalWalletPhase,
  });
  return { canCancel: eligibility.kind === 'cancel' };
}

export function shouldShowLocalUserReviewPendingNote(status: string): boolean {
  return (
    status === LocalServiceRequestStatus.REQUESTED ||
    status === LocalServiceRequestStatus.MERCHANT_REVIEW
  );
}

export function shouldShowLocalUserConfirmedNote(status: string): boolean {
  return status === LocalServiceRequestStatus.CONFIRMED;
}

export function shouldShowLocalUserCancelHint(actions: LocalUserRequestActions): boolean {
  return actions.canCancel;
}

export function buildLocalUserRequestDisplayLabels(
  request: Pick<LocalUserRequestListItem, 'status' | 'walletMode' | 'walletPhase'>,
  t: LocalUserCopyTranslate
): LocalUserRequestDisplayLabels {
  const actions = deriveLocalUserRequestActions(request);
  const wallet = localUserWalletBadgeI18nKey(request.walletMode, request.walletPhase);
  return {
    statusLabel: t(localUserRequestStatusI18nKey(request.status)),
    walletBadge: t(wallet.key, wallet.options),
    showReviewPendingNote: shouldShowLocalUserReviewPendingNote(request.status),
    showConfirmedNote: shouldShowLocalUserConfirmedNote(request.status),
    showCancelHint: shouldShowLocalUserCancelHint(actions),
    actions,
  };
}

export function attachLocalUserRequestActions(
  request: Omit<LocalUserRequestListItem, 'actions'> & { actions?: LocalUserRequestActions }
): LocalUserRequestListItem & { actions: LocalUserRequestActions } {
  const actions = request.actions ?? deriveLocalUserRequestActions(request);
  return { ...request, actions };
}

export function filterLocalUserRequests(
  requests: readonly (LocalUserRequestListItem & { actions: LocalUserRequestActions })[],
  chip: LocalUserStatusFilterChip
): readonly (LocalUserRequestListItem & { actions: LocalUserRequestActions })[] {
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

export function collectLocalUserStatusVisibleCopy(
  labels: LocalUserRequestDisplayLabels,
  t?: LocalUserCopyTranslate
): string {
  const reviewNote = t
    ? t('local.userRequestStatus.reviewPendingNote')
    : 'Waiting for merchant review';
  const confirmedNote = t
    ? t('local.userRequestStatus.confirmedNote')
    : 'Confirmed does not mean paid';
  const cancelHint = t
    ? t('local.userRequestStatus.cancelHint')
    : 'You can cancel while the request is still open';
  const parts = [
    labels.statusLabel,
    labels.walletBadge,
    labels.showReviewPendingNote ? reviewNote : '',
    labels.showConfirmedNote ? confirmedNote : '',
    labels.showCancelHint ? cancelHint : '',
  ];
  return parts.filter((p) => p.length > 0).join(' ');
}
