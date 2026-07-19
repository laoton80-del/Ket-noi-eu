import {
  LOCAL_SERVICE_REQUEST_STATUS,
  LOCAL_WALLET_MODE,
  LOCAL_WALLET_PHASE,
  type LocalServiceRequestStatusClient,
  type LocalWalletModeClient,
  type LocalWalletPhaseClient,
} from '../../domain/local/localServiceRequestClientContract';
import type { LocalConstellationAccent } from '../../components/local/localConstellationTokens';
import { evaluateLocalUserRequestCancelEligibility } from '../../services/local/localUserRequestCancelEligibility';
import type { LocalUserRequestListItem } from '../../services/localUserRequestApi';

/** Status icon names for Premium App Tile–style request rows (display only). */
export type LocalUserRequestStatusIconName =
  | 'paper-plane-outline'
  | 'hourglass-outline'
  | 'checkmark-circle-outline'
  | 'sync-outline'
  | 'checkmark-done-outline'
  | 'close-circle-outline'
  | 'ban-outline'
  | 'time-outline'
  | 'help-circle-outline';

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
    case LOCAL_SERVICE_REQUEST_STATUS.REQUESTED:
      return 'Request submitted';
    case LOCAL_SERVICE_REQUEST_STATUS.MERCHANT_REVIEW:
      return 'Waiting for merchant review';
    case LOCAL_SERVICE_REQUEST_STATUS.CONFIRMED:
      return 'Merchant confirmed your request';
    case LOCAL_SERVICE_REQUEST_STATUS.IN_PROGRESS:
      return 'In progress';
    case LOCAL_SERVICE_REQUEST_STATUS.COMPLETED:
      return 'Completed';
    case LOCAL_SERVICE_REQUEST_STATUS.REJECTED:
      return 'Merchant declined this request';
    case LOCAL_SERVICE_REQUEST_STATUS.USER_CANCELLED:
      return 'Cancelled';
    case LOCAL_SERVICE_REQUEST_STATUS.OPS_CANCELLED:
      return 'Cancelled by support';
    case LOCAL_SERVICE_REQUEST_STATUS.EXPIRED:
      return 'This request expired';
    default:
      return 'Request updated';
  }
}

/** Semantic accent for request status rows — display mapping only. */
export function localUserRequestStatusAccent(status: string): LocalConstellationAccent {
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

export function localUserRequestStatusIcon(status: string): LocalUserRequestStatusIconName {
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

/** Compact status hint i18n key, or null when redundant with chips. */
export function localUserRequestStatusHintKey(status: string): string | null {
  switch (status) {
    case LOCAL_SERVICE_REQUEST_STATUS.REQUESTED:
      return 'local.userRequestStatus.statusHint.sent';
    case LOCAL_SERVICE_REQUEST_STATUS.MERCHANT_REVIEW:
      return 'local.userRequestStatus.statusHint.review';
    case LOCAL_SERVICE_REQUEST_STATUS.CONFIRMED:
      return 'local.userRequestStatus.statusHint.confirmedNotPaid';
    case LOCAL_SERVICE_REQUEST_STATUS.REJECTED:
      return 'local.userRequestStatus.statusHint.declined';
    case LOCAL_SERVICE_REQUEST_STATUS.IN_PROGRESS:
      return 'local.userRequestStatus.statusHint.inProgress';
    case LOCAL_SERVICE_REQUEST_STATUS.COMPLETED:
      return 'local.userRequestStatus.statusHint.completed';
    case LOCAL_SERVICE_REQUEST_STATUS.USER_CANCELLED:
    case LOCAL_SERVICE_REQUEST_STATUS.OPS_CANCELLED:
    case LOCAL_SERVICE_REQUEST_STATUS.EXPIRED:
      return 'local.userRequestStatus.statusHint.closed';
    default:
      return null;
  }
}

export function localUserRequestStatusI18nKey(status: string): string {
  switch (status) {
    case LOCAL_SERVICE_REQUEST_STATUS.REQUESTED:
      return `${USER_STATUS_PREFIX}requested`;
    case LOCAL_SERVICE_REQUEST_STATUS.MERCHANT_REVIEW:
      return `${USER_STATUS_PREFIX}merchantReview`;
    case LOCAL_SERVICE_REQUEST_STATUS.CONFIRMED:
      return `${USER_STATUS_PREFIX}confirmed`;
    case LOCAL_SERVICE_REQUEST_STATUS.IN_PROGRESS:
      return `${USER_STATUS_PREFIX}inProgress`;
    case LOCAL_SERVICE_REQUEST_STATUS.COMPLETED:
      return `${USER_STATUS_PREFIX}completed`;
    case LOCAL_SERVICE_REQUEST_STATUS.REJECTED:
      return `${USER_STATUS_PREFIX}rejected`;
    case LOCAL_SERVICE_REQUEST_STATUS.USER_CANCELLED:
      return `${USER_STATUS_PREFIX}userCancelled`;
    case LOCAL_SERVICE_REQUEST_STATUS.OPS_CANCELLED:
      return `${USER_STATUS_PREFIX}opsCancelled`;
    case LOCAL_SERVICE_REQUEST_STATUS.EXPIRED:
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
    walletMode === LOCAL_WALLET_MODE.REQUEST_ONLY_NO_CHARGE &&
    walletPhase === LOCAL_WALLET_PHASE.NONE
  ) {
    return { key: `${USER_WALLET_PREFIX}requestOnlyNoCharge` };
  }
  if (walletPhase === LOCAL_WALLET_PHASE.NONE) {
    return { key: `${USER_WALLET_PREFIX}phaseNone` };
  }
  return { key: `${USER_WALLET_PREFIX}phaseOther`, options: { phase: walletPhase } };
}

export function localUserWalletBadgeLabel(walletMode: string, walletPhase: string): string {
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

export function deriveLocalUserRequestActions(
  row: Pick<LocalUserRequestListItem, 'status' | 'walletMode' | 'walletPhase'>
): LocalUserRequestActions {
  const eligibility = evaluateLocalUserRequestCancelEligibility({
    status: row.status as LocalServiceRequestStatusClient,
    walletMode: row.walletMode as LocalWalletModeClient,
    walletPhase: row.walletPhase as LocalWalletPhaseClient,
  });
  return { canCancel: eligibility.kind === 'cancel' };
}

export function shouldShowLocalUserReviewPendingNote(status: string): boolean {
  return (
    status === LOCAL_SERVICE_REQUEST_STATUS.REQUESTED ||
    status === LOCAL_SERVICE_REQUEST_STATUS.MERCHANT_REVIEW
  );
}

export function shouldShowLocalUserConfirmedNote(status: string): boolean {
  return status === LOCAL_SERVICE_REQUEST_STATUS.CONFIRMED;
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
