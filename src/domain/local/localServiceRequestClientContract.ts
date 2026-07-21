/**
 * Client-safe Local service-request wire values.
 *
 * String literals match REST DTO / Prisma enum wire values exactly.
 * No Prisma, DB, network, payment, or settlement authority.
 */

export const LOCAL_SERVICE_REQUEST_STATUS = {
  DRAFT: 'DRAFT',
  REQUESTED: 'REQUESTED',
  MERCHANT_REVIEW: 'MERCHANT_REVIEW',
  CONFIRMED: 'CONFIRMED',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
  REJECTED: 'REJECTED',
  USER_CANCELLED: 'USER_CANCELLED',
  OPS_CANCELLED: 'OPS_CANCELLED',
  EXPIRED: 'EXPIRED',
} as const;

export type LocalServiceRequestStatusClient =
  (typeof LOCAL_SERVICE_REQUEST_STATUS)[keyof typeof LOCAL_SERVICE_REQUEST_STATUS];

export const LOCAL_WALLET_MODE = {
  NO_LEDGER_PREVIEW: 'NO_LEDGER_PREVIEW',
  REQUEST_ONLY_NO_CHARGE: 'REQUEST_ONLY_NO_CHARGE',
  HOLD_ON_SUBMIT: 'HOLD_ON_SUBMIT',
  SETTLE_ON_CONFIRM: 'SETTLE_ON_CONFIRM',
  LEGACY_BOOKING_BRIDGE: 'LEGACY_BOOKING_BRIDGE',
} as const;

export type LocalWalletModeClient =
  (typeof LOCAL_WALLET_MODE)[keyof typeof LOCAL_WALLET_MODE];

export const LOCAL_WALLET_PHASE = {
  NONE: 'NONE',
  HELD: 'HELD',
  SETTLED: 'SETTLED',
  RELEASED: 'RELEASED',
  REFUNDED: 'REFUNDED',
  LEGACY_BRIDGE: 'LEGACY_BRIDGE',
  PREVIEW: 'PREVIEW',
} as const;

export type LocalWalletPhaseClient =
  (typeof LOCAL_WALLET_PHASE)[keyof typeof LOCAL_WALLET_PHASE];

const STATUS_VALUES = new Set<string>(Object.values(LOCAL_SERVICE_REQUEST_STATUS));
const WALLET_MODE_VALUES = new Set<string>(Object.values(LOCAL_WALLET_MODE));
const WALLET_PHASE_VALUES = new Set<string>(Object.values(LOCAL_WALLET_PHASE));

export function isLocalServiceRequestStatusClient(
  value: unknown
): value is LocalServiceRequestStatusClient {
  return typeof value === 'string' && STATUS_VALUES.has(value);
}

export function isLocalWalletModeClient(value: unknown): value is LocalWalletModeClient {
  return typeof value === 'string' && WALLET_MODE_VALUES.has(value);
}

export function isLocalWalletPhaseClient(value: unknown): value is LocalWalletPhaseClient {
  return typeof value === 'string' && WALLET_PHASE_VALUES.has(value);
}

/** Wire values for LocalServiceType — match REST / Prisma enum strings. */
export const LOCAL_SERVICE_TYPE = {
  SERVICE_MENU: 'SERVICE_MENU',
  FIXER_HIRE: 'FIXER_HIRE',
  GENERIC_REQUEST: 'GENERIC_REQUEST',
  LEGAL_INTAKE: 'LEGAL_INTAKE',
  CLASSIFIED_LEAD: 'CLASSIFIED_LEAD',
} as const;

export type LocalServiceTypeClient =
  (typeof LOCAL_SERVICE_TYPE)[keyof typeof LOCAL_SERVICE_TYPE];

/** Wire values for LocalRequestSource — FC-P0 client always sends LOCAL_SCREEN. */
export const LOCAL_REQUEST_SOURCE = {
  LOCAL_SCREEN: 'LOCAL_SCREEN',
  FIXER_CHECKOUT: 'FIXER_CHECKOUT',
  LEONA_ASSIST: 'LEONA_ASSIST',
  LEGAL_SCAN: 'LEGAL_SCAN',
  ADMIN_SEED: 'ADMIN_SEED',
  API_DIRECT: 'API_DIRECT',
} as const;

export type LocalRequestSourceClient =
  (typeof LOCAL_REQUEST_SOURCE)[keyof typeof LOCAL_REQUEST_SOURCE];

/** FC-P0 fixed create source — not user-editable. */
export const LOCAL_CREATE_CLIENT_SOURCE = LOCAL_REQUEST_SOURCE.LOCAL_SCREEN;

const SERVICE_TYPE_VALUES = new Set<string>(Object.values(LOCAL_SERVICE_TYPE));
const REQUEST_SOURCE_VALUES = new Set<string>(Object.values(LOCAL_REQUEST_SOURCE));

export function isLocalServiceTypeClient(value: unknown): value is LocalServiceTypeClient {
  return typeof value === 'string' && SERVICE_TYPE_VALUES.has(value);
}

export function isLocalRequestSourceClient(value: unknown): value is LocalRequestSourceClient {
  return typeof value === 'string' && REQUEST_SOURCE_VALUES.has(value);
}

/**
 * Client-side mirror of server DANGEROUS_LOCAL_REQUEST_CREATE_BODY_KEYS.
 * Must never appear on the create POST body.
 */
export const LOCAL_CREATE_FORBIDDEN_BODY_KEYS = [
  'status',
  'walletMode',
  'walletPhase',
  'quotedAmountCredits',
  'holdAmountCredits',
  'settledAmountCredits',
  'platformFeeCredits',
  'totalVioCredits',
  'heldVioCredits',
  'releasedVioCredits',
  'platformFeeVioCredits',
  'providerEarningsVioCredits',
  'merchantConfirmedAt',
  'confirmedAt',
  'rejectedAt',
  'completedAt',
  'cancelledAt',
  'providerSettledAt',
  'expiredAt',
  'merchantReviewDeadlineAt',
  'requesterUserId',
  'assignedProviderUserId',
  'legacyBookingId',
  'cancelReason',
  'rejectReason',
  'cancelledByRole',
] as const;

export type LocalCreateForbiddenBodyKey = (typeof LOCAL_CREATE_FORBIDDEN_BODY_KEYS)[number];

/** Canonical FC-P0 create request DTO (client → POST /api/local/requests). */
export type LocalUserRequestCreateBody = Readonly<{
  businessId: string;
  serviceType: LocalServiceTypeClient;
  title: string;
  source: typeof LOCAL_CREATE_CLIENT_SOURCE;
  serviceId?: string;
  fixerProfileKey?: string;
  description?: string;
  locationText?: string;
  city?: string;
  countryCode?: string;
  scheduledStartAt?: string;
  scheduledEndAt?: string;
  metadata?: Readonly<Record<string, unknown>>;
}>;

/** Success payload from POST /api/local/requests (201). */
export type LocalUserRequestCreateResult = Readonly<{
  id: string;
  requesterUserId: string;
  businessId: string;
  serviceId: string | null;
  serviceType: string;
  title: string;
  status: string;
  walletMode: string;
  walletPhase: string;
  totalVioCredits: number | null;
  heldVioCredits: number | null;
  releasedVioCredits: number | null;
  platformFeeVioCredits: number | null;
  providerEarningsVioCredits: number | null;
  message: string;
}>;
