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
