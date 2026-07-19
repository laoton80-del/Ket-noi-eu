import {
  LOCAL_SERVICE_REQUEST_STATUS,
  LOCAL_WALLET_MODE,
  LOCAL_WALLET_PHASE,
  type LocalServiceRequestStatusClient,
  type LocalWalletModeClient,
  type LocalWalletPhaseClient,
} from '../../domain/local/localServiceRequestClientContract';
import {
  deriveLocalMerchantInboxActions,
  type LocalMerchantInboxActions,
} from '../../services/local/localMerchantInboxView';
import type { LocalMerchantInboxRequest } from '../../services/localMerchantInboxApi';
import type { LocalConstellationAccent } from '../../components/local/localConstellationTokens';

/** Status icon names for merchant inbox rows (display only). */
export type LocalMerchantInboxStatusIconName =
  | 'paper-plane-outline'
  | 'hourglass-outline'
  | 'checkmark-circle-outline'
  | 'sync-outline'
  | 'checkmark-done-outline'
  | 'close-circle-outline'
  | 'ban-outline'
  | 'time-outline'
  | 'help-circle-outline';

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
    case LOCAL_SERVICE_REQUEST_STATUS.REQUESTED:
      return 'Request submitted';
    case LOCAL_SERVICE_REQUEST_STATUS.MERCHANT_REVIEW:
      return 'Waiting for merchant review';
    case LOCAL_SERVICE_REQUEST_STATUS.CONFIRMED:
      return 'Confirmed';
    case LOCAL_SERVICE_REQUEST_STATUS.IN_PROGRESS:
      return 'In progress';
    case LOCAL_SERVICE_REQUEST_STATUS.COMPLETED:
      return 'Completed';
    case LOCAL_SERVICE_REQUEST_STATUS.REJECTED:
      return 'Merchant declined this request';
    case LOCAL_SERVICE_REQUEST_STATUS.USER_CANCELLED:
      return 'Cancelled by requester';
    case LOCAL_SERVICE_REQUEST_STATUS.OPS_CANCELLED:
      return 'Cancelled by operations';
    case LOCAL_SERVICE_REQUEST_STATUS.EXPIRED:
      return 'This request expired';
    default:
      return 'Unknown status';
  }
}

/** Semantic accent for merchant inbox rows — display mapping only. */
export function localMerchantInboxStatusAccent(status: string): LocalConstellationAccent {
  switch (status) {
    case LOCAL_SERVICE_REQUEST_STATUS.REJECTED:
    case LOCAL_SERVICE_REQUEST_STATUS.USER_CANCELLED:
    case LOCAL_SERVICE_REQUEST_STATUS.OPS_CANCELLED:
    case LOCAL_SERVICE_REQUEST_STATUS.EXPIRED:
      return 'violet';
    case LOCAL_SERVICE_REQUEST_STATUS.CONFIRMED:
    case LOCAL_SERVICE_REQUEST_STATUS.COMPLETED:
    case LOCAL_SERVICE_REQUEST_STATUS.IN_PROGRESS:
      return 'emerald';
    case LOCAL_SERVICE_REQUEST_STATUS.REQUESTED:
    case LOCAL_SERVICE_REQUEST_STATUS.MERCHANT_REVIEW:
    default:
      return 'cyan';
  }
}

export function localMerchantInboxStatusIcon(status: string): LocalMerchantInboxStatusIconName {
  switch (status) {
    case LOCAL_SERVICE_REQUEST_STATUS.REQUESTED:
      return 'paper-plane-outline';
    case LOCAL_SERVICE_REQUEST_STATUS.MERCHANT_REVIEW:
      return 'hourglass-outline';
    case LOCAL_SERVICE_REQUEST_STATUS.CONFIRMED:
      return 'checkmark-circle-outline';
    case LOCAL_SERVICE_REQUEST_STATUS.IN_PROGRESS:
      return 'sync-outline';
    case LOCAL_SERVICE_REQUEST_STATUS.COMPLETED:
      return 'checkmark-done-outline';
    case LOCAL_SERVICE_REQUEST_STATUS.REJECTED:
      return 'close-circle-outline';
    case LOCAL_SERVICE_REQUEST_STATUS.USER_CANCELLED:
    case LOCAL_SERVICE_REQUEST_STATUS.OPS_CANCELLED:
      return 'ban-outline';
    case LOCAL_SERVICE_REQUEST_STATUS.EXPIRED:
      return 'time-outline';
    default:
      return 'help-circle-outline';
  }
}

export function localMerchantInboxStatusHintKey(status: string): string | null {
  switch (status) {
    case LOCAL_SERVICE_REQUEST_STATUS.REQUESTED:
      return 'local.merchantInbox.statusHint.newRequest';
    case LOCAL_SERVICE_REQUEST_STATUS.MERCHANT_REVIEW:
      return 'local.merchantInbox.statusHint.needsReview';
    case LOCAL_SERVICE_REQUEST_STATUS.CONFIRMED:
      return 'local.merchantInbox.statusHint.confirmedNotPaid';
    case LOCAL_SERVICE_REQUEST_STATUS.REJECTED:
      return 'local.merchantInbox.statusHint.declined';
    case LOCAL_SERVICE_REQUEST_STATUS.IN_PROGRESS:
      return 'local.merchantInbox.statusHint.inProgress';
    case LOCAL_SERVICE_REQUEST_STATUS.COMPLETED:
      return 'local.merchantInbox.statusHint.completed';
    case LOCAL_SERVICE_REQUEST_STATUS.USER_CANCELLED:
    case LOCAL_SERVICE_REQUEST_STATUS.OPS_CANCELLED:
    case LOCAL_SERVICE_REQUEST_STATUS.EXPIRED:
      return 'local.merchantInbox.statusHint.closed';
    default:
      return null;
  }
}

export function localMerchantRequestStatusI18nKey(status: string): string {
  switch (status) {
    case LOCAL_SERVICE_REQUEST_STATUS.REQUESTED:
      return `${MERCHANT_STATUS_PREFIX}requested`;
    case LOCAL_SERVICE_REQUEST_STATUS.MERCHANT_REVIEW:
      return `${MERCHANT_STATUS_PREFIX}merchantReview`;
    case LOCAL_SERVICE_REQUEST_STATUS.CONFIRMED:
      return `${MERCHANT_STATUS_PREFIX}confirmed`;
    case LOCAL_SERVICE_REQUEST_STATUS.IN_PROGRESS:
      return `${MERCHANT_STATUS_PREFIX}inProgress`;
    case LOCAL_SERVICE_REQUEST_STATUS.COMPLETED:
      return `${MERCHANT_STATUS_PREFIX}completed`;
    case LOCAL_SERVICE_REQUEST_STATUS.REJECTED:
      return `${MERCHANT_STATUS_PREFIX}rejected`;
    case LOCAL_SERVICE_REQUEST_STATUS.USER_CANCELLED:
      return `${MERCHANT_STATUS_PREFIX}userCancelled`;
    case LOCAL_SERVICE_REQUEST_STATUS.OPS_CANCELLED:
      return `${MERCHANT_STATUS_PREFIX}opsCancelled`;
    case LOCAL_SERVICE_REQUEST_STATUS.EXPIRED:
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
    walletMode === LOCAL_WALLET_MODE.REQUEST_ONLY_NO_CHARGE &&
    walletPhase === LOCAL_WALLET_PHASE.NONE
  ) {
    return { key: `${MERCHANT_WALLET_PREFIX}requestOnlyNoCharge` };
  }
  if (walletPhase === LOCAL_WALLET_PHASE.NONE) {
    return { key: `${MERCHANT_WALLET_PREFIX}phaseNone` };
  }
  return { key: `${MERCHANT_WALLET_PREFIX}phaseOther`, options: { phase: walletPhase } };
}

export function localWalletBadgeLabel(
  walletMode: string,
  walletPhase: string
): string {
  if (
    walletMode === LOCAL_WALLET_MODE.REQUEST_ONLY_NO_CHARGE &&
    walletPhase === LOCAL_WALLET_PHASE.NONE
  ) {
    return 'No payment has been captured · Request-only / no-charge · walletPhase NONE';
  }
  if (walletPhase === LOCAL_WALLET_PHASE.NONE) {
    return 'No payment has been captured · walletPhase NONE';
  }
  return `walletPhase ${walletPhase}`;
}

export function shouldShowLocalReviewPendingNote(status: string): boolean {
  return (
    status === LOCAL_SERVICE_REQUEST_STATUS.REQUESTED ||
    status === LOCAL_SERVICE_REQUEST_STATUS.MERCHANT_REVIEW
  );
}

export function shouldShowLocalConfirmedNote(status: string): boolean {
  return status === LOCAL_SERVICE_REQUEST_STATUS.CONFIRMED;
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
    status: request.status as LocalServiceRequestStatusClient,
    walletMode: request.walletMode as LocalWalletModeClient,
    walletPhase: request.walletPhase as LocalWalletPhaseClient,
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
        r.status === LOCAL_SERVICE_REQUEST_STATUS.REQUESTED ||
        r.status === LOCAL_SERVICE_REQUEST_STATUS.MERCHANT_REVIEW
    );
  }
  if (chip === 'confirmed') {
    return requests.filter((r) => r.status === LOCAL_SERVICE_REQUEST_STATUS.CONFIRMED);
  }
  if (chip === 'active') {
    return requests.filter((r) => r.status === LOCAL_SERVICE_REQUEST_STATUS.IN_PROGRESS);
  }
  if (chip === 'completed') {
    return requests.filter((r) => r.status === LOCAL_SERVICE_REQUEST_STATUS.COMPLETED);
  }
  return requests.filter(
    (r) =>
      r.status === LOCAL_SERVICE_REQUEST_STATUS.REJECTED ||
      r.status === LOCAL_SERVICE_REQUEST_STATUS.USER_CANCELLED ||
      r.status === LOCAL_SERVICE_REQUEST_STATUS.OPS_CANCELLED ||
      r.status === LOCAL_SERVICE_REQUEST_STATUS.EXPIRED
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
    : 'Confirmed ≠ paid — request-only, no charge';
  const parts = [
    labels.statusLabel,
    labels.walletBadge,
    labels.showReviewPendingNote ? reviewNote : '',
    labels.showConfirmedNote ? confirmedNote : '',
    ...extraNotes,
  ];
  return parts.filter((p) => p.length > 0).join(' ');
}
