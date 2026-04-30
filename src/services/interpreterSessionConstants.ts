/**
 * Live interpreter session economics.
 * Keep this module free of RN/Expo/OpenAI imports so `functions` esbuild does not pull client-only deps.
 */

import { INTERPRETER_PER_MIN_CREDITS } from '../config/pricingConfig';

/** Hard cap on session length (cost control + UX); must match `INTERPRETER_MAX_SESSION_MS` derivation in `liveInterpreterService.ts`. */
export const INTERPRETER_MAX_SESSION_MINUTES = 8;

/** Per-minute debit rate in Xu (display + pricing spine). */
export const INTERPRETER_CREDITS_PER_MINUTE = INTERPRETER_PER_MIN_CREDITS;

/** Credits (Xu) reserved for one interpreter session: per-minute rate × max session minutes. */
export const INTERPRETER_SESSION_CREDITS = INTERPRETER_PER_MIN_CREDITS * INTERPRETER_MAX_SESSION_MINUTES;
