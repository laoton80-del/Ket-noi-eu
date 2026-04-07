import type { CreateBookingCommand, CreateBookingResult, BookingAvailabilityResult } from './bookingEngineTypes';
import type { AvailabilityCheckInput } from '../../../domain/b2b';

/** Inject Firestore or Admin SDK when `firebase` package is added. */
export type B2BDb = unknown;

export type CreateBookingTransactionImpl = (db: B2BDb, cmd: CreateBookingCommand) => Promise<CreateBookingResult>;

let createBookingTransactionImpl: CreateBookingTransactionImpl | null = null;

/** Cloud Functions (or tests) register the Firestore Admin implementation; Expo bundle stays without firebase-admin. */
export function registerCreateBookingTransaction(impl: CreateBookingTransactionImpl): void {
  createBookingTransactionImpl = impl;
}

export function clearCreateBookingTransactionForTests(): void {
  createBookingTransactionImpl = null;
}

/**
 * Conflict-safe booking creation — production path registers Admin `runTransaction` (see functions).
 */
export async function createBookingTransaction(db: B2BDb, cmd: CreateBookingCommand): Promise<CreateBookingResult> {
  if (createBookingTransactionImpl) return createBookingTransactionImpl(db, cmd);
  return { ok: false, code: 'not_implemented', message: 'Register createBookingTransaction via registerCreateBookingTransaction (e.g. Cloud Functions init)' };
}

/**
 * Pre-flight availability (optional register). Default: optimistic OK with caller-provided resource hints.
 */
let checkBookingAvailabilityImpl: ((db: B2BDb, input: AvailabilityCheckInput) => Promise<BookingAvailabilityResult>) | null = null;

export function registerCheckBookingAvailability(
  impl: (db: B2BDb, input: AvailabilityCheckInput) => Promise<BookingAvailabilityResult>
): void {
  checkBookingAvailabilityImpl = impl;
}

export async function checkBookingAvailability(db: B2BDb, input: AvailabilityCheckInput): Promise<BookingAvailabilityResult> {
  if (checkBookingAvailabilityImpl) return checkBookingAvailabilityImpl(db, input);
  return { ok: true, suggestedResourceIds: input.resourceIds };
}
