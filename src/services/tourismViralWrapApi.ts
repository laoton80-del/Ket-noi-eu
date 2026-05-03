import { restApiFetchJson, type ApiRequestResult } from './apiClient';

export type ViralWrapPayloadDto = Readonly<{
  bookingId: string;
  tripVigSpent: number;
  completedTourismBookings: number;
  estimatedMoneySavedUsd: number;
  aiVoiceTranslationSessions: number;
  destinationLabel: string;
  tripStartIso: string;
  tripEndIso: string;
  languageCode: string;
  viralTagline: string;
  downloadUrl: string;
}>;

/** `GET /api/tourism/wrap/:bookingId` — authenticated; booking must belong to caller. */
export async function fetchViralWrap(bookingId: string): Promise<ApiRequestResult<ViralWrapPayloadDto>> {
  return restApiFetchJson<ViralWrapPayloadDto>(`/api/tourism/wrap/${encodeURIComponent(bookingId)}`, {
    method: 'GET',
  });
}
