import { LlmRouterTaskType, TourismBookingStatus } from '@prisma/client';
import OpenAI from 'openai';

import { CREDIT_EXCHANGE_RATE_USD } from '../../config/pricingConfig';
import { getPrisma } from '../../lib/prisma';
import {
  assertCostGovernorReservation,
  CostGovernorDeniedError,
  estimateInputTokensUpperBound,
  getCostGovernor,
} from '../ai/CostGovernorService';
import { assertLlmProviderAdmission, LlmProviderAdmissionDeniedError } from '../ai/llmProviderAdmissionGate';

export class ViralWrapError extends Error {
  constructor(
    message: string,
    readonly statusCode: number
  ) {
    super(message);
    this.name = 'ViralWrapError';
  }
}

/** Public payload for the ViGlobal “Trip Wrapped” share card + client UI. */
export type ViralWrapPayload = Readonly<{
  bookingId: string;
  /** Total VIG spent on this tourism booking (wallet gross for the trip). */
  tripVigSpent: number;
  /** Lifetime count of completed inbound tourism bookings for this user (social proof). */
  completedTourismBookings: number;
  /** Heuristic “money saved vs OTA / chaos” in USD-major (marketing estimate). */
  estimatedMoneySavedUsd: number;
  /** AI sessions during trip window (voice / translate / interpreter style actions). */
  aiVoiceTranslationSessions: number;
  /** Best-effort destination label from merchant business. */
  destinationLabel: string;
  tripStartIso: string;
  tripEndIso: string;
  languageCode: string;
  /** Punchy one-liner for the share card — localized via OpenAI. */
  viralTagline: string;
  /** Universal download / referral landing (QR + caption). */
  downloadUrl: string;
}>;

function resolveDownloadUrl(): string {
  const u = process.env.APP_PUBLIC_DOWNLOAD_URL?.trim() ?? process.env.EXPO_PUBLIC_APP_DOWNLOAD_URL?.trim();
  if (u && u.length > 0) return u.replace(/\/+$/, '');
  return 'https://ketnoiglobal.com/download';
}

function languageNameForPrompt(code: string): string {
  const c = code.trim().toLowerCase();
  const map: Record<string, string> = {
    vi: 'Vietnamese',
    en: 'English',
    de: 'German',
    ko: 'Korean',
    fr: 'French',
    cs: 'Czech',
    pl: 'Polish',
  };
  return map[c] ?? 'English';
}

function isClearProviderFourXx(error: unknown): boolean {
  if (typeof error !== 'object' || error === null || !('status' in error)) return false;
  const status = (error as Readonly<{ status?: unknown }>).status;
  return typeof status === 'number' && Number.isInteger(status) && status >= 400 && status < 500 && status !== 408 && status !== 409;
}

async function generateHumorousViralLine(input: {
  readonly userId: string;
  readonly languageName: string;
  readonly destinationLabel: string;
  readonly tripVigSpent: number;
  readonly bookingsCount: number;
  readonly moneySavedUsd: number;
  readonly aiSessions: number;
}): Promise<string> {
  const prompt = [
    'Write ONE short, punchy, slightly humorous line for an Instagram Story “travel wrap” card.',
    `Output language: ${input.languageName} only.`,
    `Destination context: ${input.destinationLabel}.`,
    `Stats (use lightly, be playful): trip spend ${input.tripVigSpent.toFixed(0)} VIO Credits,`,
    `lifetime completed tourism bookings ${input.bookingsCount},`,
    `rough “saved” USD ~${input.moneySavedUsd.toFixed(2)},`,
    `AI voice/translate sessions on trip ${input.aiSessions}.`,
    'Max 140 characters. No hashtags in the line. No markdown.',
  ].join(' ');
  const messages = [
    {
      role: 'system' as const,
      content:
        'You are VIONA’s viral social copywriter. Be fun, confident, never mean-spirited, no slurs, no medical claims.',
    },
    { role: 'user' as const, content: prompt },
  ];

  const governor = getCostGovernor();
  let reservation: Awaited<ReturnType<typeof governor.reserve>>;
  let model: string;
  try {
    assertLlmProviderAdmission({
      taskType: LlmRouterTaskType.COMPLEX_MARKETING,
      userId: input.userId,
    });
    model = process.env.OPENAI_MODEL?.trim() || 'gpt-4o-mini';
    reservation = await governor.reserve({
      subjectId: input.userId,
      idempotencyKey: governor.createServerIdempotencyKey(),
      rail: 'EXPRESS',
      provider: 'openai',
      model,
      operationKind: 'VIRAL_WRAP',
      inputTokensUpperBound: estimateInputTokensUpperBound(messages),
      outputTokens: 120n,
    });
    assertCostGovernorReservation(reservation);
  } catch (error) {
    if (error instanceof LlmProviderAdmissionDeniedError) {
      throw new ViralWrapError(error.message, 503);
    }
    throw error;
  }

  let client: OpenAI;
  let timeoutSignal: AbortSignal;
  try {
    const apiKey = process.env.OPENAI_API_KEY?.trim();
    if (!apiKey || apiKey.length === 0) {
      throw new ViralWrapError('OPENAI_API_KEY is not configured', 503);
    }
    if (typeof AbortSignal === 'undefined' || typeof AbortSignal.timeout !== 'function') {
      throw new CostGovernorDeniedError('DENY_LEDGER_UNAVAILABLE');
    }
    timeoutSignal = AbortSignal.timeout(reservation.providerTimeoutMs);
    client = new OpenAI({ apiKey, maxRetries: 0 });
  } catch (error) {
    try {
      await governor.release({ operationId: reservation.operation.id, reason: 'reserved_not_dispatched' });
    } catch (releaseError) {
      if (releaseError instanceof LlmProviderAdmissionDeniedError) {
        throw new ViralWrapError(releaseError.message, 503);
      }
      throw releaseError;
    }
    if (error instanceof LlmProviderAdmissionDeniedError) throw new ViralWrapError(error.message, 503);
    throw error;
  }

  try {
    const dispatched = await governor.markDispatching(reservation.operation.id);
    if (!dispatched) throw new CostGovernorDeniedError('DUPLICATE_IN_PROGRESS');
  } catch (error) {
    try {
      await governor.release({ operationId: reservation.operation.id, reason: 'reserved_not_dispatched' });
    } catch (releaseError) {
      if (releaseError instanceof LlmProviderAdmissionDeniedError) {
        throw new ViralWrapError(releaseError.message, 503);
      }
      throw releaseError;
    }
    if (error instanceof LlmProviderAdmissionDeniedError) throw new ViralWrapError(error.message, 503);
    throw error;
  }

  let completion;
  try {
    completion = await client.chat.completions.create(
      { model, temperature: 0.9, max_tokens: 120, messages },
      { signal: timeoutSignal }
    );
  } catch (error) {
    try {
      if (isClearProviderFourXx(error)) {
        await governor.release({ operationId: reservation.operation.id, reason: 'provider_http_4xx' });
      } else {
        await governor.markOutcomeUnknown(reservation.operation.id);
      }
    } catch (governorError) {
      if (governorError instanceof LlmProviderAdmissionDeniedError) {
        throw new ViralWrapError(governorError.message, 503);
      }
      throw governorError;
    }
    throw error;
  }

  try {
    await governor.settle({
      operationId: reservation.operation.id,
      providerRequestId: completion.id,
      usage: completion.usage
        ? { inputTokens: completion.usage.prompt_tokens, outputTokens: completion.usage.completion_tokens }
        : null,
    });
  } catch (error) {
    try {
      await governor.markOutcomeUnknown(reservation.operation.id);
    } catch {
      // Do not retry a paid provider call when durable settlement is unavailable.
    }
    if (error instanceof LlmProviderAdmissionDeniedError) throw new ViralWrapError(error.message, 503);
    throw error;
  }

  const line = completion.choices[0]?.message?.content?.trim().replace(/^["']|["']$/g, '') ?? '';
  if (line.length === 0) {
    throw new ViralWrapError('AI returned an empty tagline', 502);
  }
  return line.slice(0, 200);
}

/**
 * Aggregates trip + lifetime signals and produces a localized “Wrapped” tagline via OpenAI.
 * `tripId` is the `TourismBooking.id` for the journey being celebrated.
 */
export async function generateUserTripSummary(userId: string, tripId: string): Promise<ViralWrapPayload> {
  const prisma = getPrisma();

  const booking = await prisma.tourismBooking.findUnique({
    where: { id: tripId },
    include: {
      business: { select: { name: true, category: true } },
      service: { select: { title: true } },
    },
  });

  if (!booking) {
    throw new ViralWrapError('Booking not found', 404);
  }
  if (booking.userId !== userId) {
    throw new ViralWrapError('Forbidden', 403);
  }

  if (
    booking.status !== TourismBookingStatus.COMPLETED &&
    booking.status !== TourismBookingStatus.CONFIRMED
  ) {
    throw new ViralWrapError('Trip wrap is available once the booking is confirmed or completed', 409);
  }

  const profile = await prisma.profile.findUnique({
    where: { userId },
    select: { languageCode: true },
  });
  const languageCode = profile?.languageCode?.trim() || 'en';
  const languageName = languageNameForPrompt(languageCode);

  const [completedTourismBookings, aiVoiceTranslationSessions] = await Promise.all([
    prisma.tourismBooking.count({
      where: { userId, status: TourismBookingStatus.COMPLETED },
    }),
    prisma.aILog.count({
      where: {
        userId,
        timestamp: { gte: booking.startDate, lte: booking.endDate },
        OR: [
          { action: { contains: 'translat', mode: 'insensitive' } },
          { action: { contains: 'voice', mode: 'insensitive' } },
          { action: { contains: 'interpreter', mode: 'insensitive' } },
          { action: { contains: 'call', mode: 'insensitive' } },
        ],
      },
    }),
  ]);

  const tripVigSpent = booking.totalPaidVIG;
  const vigToUsd = (v: number) => Math.round(v * CREDIT_EXCHANGE_RATE_USD * 100) / 100;
  const estimatedMoneySavedUsd = Math.max(
    0,
    Math.round(
      (vigToUsd(booking.touristFeeVIG) * 1.5 + vigToUsd(booking.totalPaidVIG) * 0.12) * 100
    ) / 100
  );

  const destinationLabel =
    `${booking.business.name} · ${booking.service.title}`.slice(0, 120) || 'VIONA Vietnam';

  const viralTagline = await generateHumorousViralLine({
    userId,
    languageName,
    destinationLabel,
    tripVigSpent,
    bookingsCount: completedTourismBookings,
    moneySavedUsd: estimatedMoneySavedUsd,
    aiSessions: aiVoiceTranslationSessions,
  });

  return {
    bookingId: booking.id,
    tripVigSpent,
    completedTourismBookings,
    estimatedMoneySavedUsd,
    aiVoiceTranslationSessions,
    destinationLabel,
    tripStartIso: booking.startDate.toISOString(),
    tripEndIso: booking.endDate.toISOString(),
    languageCode,
    viralTagline,
    downloadUrl: resolveDownloadUrl(),
  };
}
