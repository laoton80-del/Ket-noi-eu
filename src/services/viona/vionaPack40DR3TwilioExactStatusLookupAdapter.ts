/**
 * Pack40DR3B — read-only exact Twilio MessageSid status lookup for recovery reconciliation.
 *
 * Isolated from the Pack40D3 send adapter: no send, no retry, no listing.
 * Live transport is injectable; tests use fakes only.
 */

import { createHash } from 'node:crypto';

import { readVionaTwilioTestCredentialsFromEnv } from '../../lib/viona/realProviderAdapter/vionaTwilioTestRealProviderAdapter';
import {
  VIONA_PACK40DR2_PROVIDER_NAME_TWILIO_TEST_SMS,
  type VionaProviderExactStatusLookupResult,
  type VionaProviderStatusLookupAdapter,
} from './vionaProviderStatusLookupContract';

export type TwilioExactStatusTransportResult = Readonly<{
  httpStatus: number;
  messageStatus?: string | null;
  errorCode?: string | null;
}>;

export type TwilioExactStatusTransport = (
  input: Readonly<{ accountSid: string; authToken: string; messageSid: string }>,
) => Promise<TwilioExactStatusTransportResult>;

function digest(value: string): string {
  return createHash('sha256').update(value).digest('hex').slice(0, 32);
}

const KNOWN_SUCCESS_STATUSES = new Set(['delivered', 'sent', 'queued', 'accepted']);
const KNOWN_FAILURE_STATUSES = new Set(['failed', 'undelivered', 'canceled']);

export async function defaultTwilioExactStatusTransport(
  input: Readonly<{ accountSid: string; authToken: string; messageSid: string }>,
): Promise<TwilioExactStatusTransportResult> {
  const url = `https://api.twilio.com/2010-04-01/Accounts/${encodeURIComponent(input.accountSid)}/Messages/${encodeURIComponent(input.messageSid)}.json`;
  const auth = Buffer.from(`${input.accountSid}:${input.authToken}`, 'utf8').toString('base64');
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5_000);
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: { Authorization: `Basic ${auth}` },
      signal: controller.signal,
    });
    if (!response.ok) {
      return { httpStatus: response.status };
    }
    const body = (await response.json()) as { status?: string; error_code?: string | null };
    return {
      httpStatus: response.status,
      messageStatus: typeof body.status === 'string' ? body.status : null,
      errorCode: body.error_code != null ? String(body.error_code) : null,
    };
  } catch {
    return { httpStatus: 0 };
  } finally {
    clearTimeout(timeout);
  }
}

function classifyTwilioMessageStatus(
  transport: TwilioExactStatusTransportResult,
): VionaProviderExactStatusLookupResult {
  if (transport.httpStatus === 0) {
    return {
      classification: 'lookupTransportUncertain',
      uncertaintyDigest: digest('transport_error'),
    };
  }
  if (transport.httpStatus === 404) {
    return {
      classification: 'knownFailure',
      failureClass: 'provider_not_found',
      failureDigest: digest('message_not_found'),
    };
  }
  if (transport.httpStatus < 200 || transport.httpStatus >= 300) {
    return {
      classification: 'lookupTransportUncertain',
      uncertaintyDigest: digest(`http_${transport.httpStatus}`),
    };
  }
  const status = (transport.messageStatus ?? '').toLowerCase();
  if (KNOWN_SUCCESS_STATUSES.has(status)) {
    return { classification: 'knownSuccess', resultDigest: digest(`status_${status}`) };
  }
  if (KNOWN_FAILURE_STATUSES.has(status)) {
    return {
      classification: 'knownFailure',
      failureClass: 'provider_reported_failure',
      failureDigest: digest(`status_${status}:${transport.errorCode ?? 'none'}`),
    };
  }
  return {
    classification: 'stillUncertain',
    uncertaintyDigest: digest(`status_${status || 'unknown'}`),
  };
}

export type CreatePack40DR3TwilioExactStatusLookupAdapterDeps = Readonly<{
  transport?: TwilioExactStatusTransport;
  readCredentials?: typeof readVionaTwilioTestCredentialsFromEnv;
}>;

/**
 * Bounded read-only lookup adapter. No send surface is exposed on this type.
 */
export function createPack40DR3TwilioExactStatusLookupAdapter(
  deps: CreatePack40DR3TwilioExactStatusLookupAdapterDeps = {},
): VionaProviderStatusLookupAdapter {
  const transport = deps.transport ?? defaultTwilioExactStatusTransport;
  const readCredentials = deps.readCredentials ?? readVionaTwilioTestCredentialsFromEnv;

  return {
    providerName: VIONA_PACK40DR2_PROVIDER_NAME_TWILIO_TEST_SMS,
    async lookupExactOperation(input) {
      const reference = input.providerExternalReference.trim();
      if (!/^SM[0-9a-fA-F]{32}$/.test(reference)) {
        return {
          classification: 'lookupTransportUncertain',
          uncertaintyDigest: digest('invalid_reference_shape'),
        };
      }

      const credentials = readCredentials();
      if (credentials == null) {
        return {
          classification: 'lookupTransportUncertain',
          uncertaintyDigest: digest('missing_test_credentials'),
        };
      }

      const transportResult = await transport({
        accountSid: credentials.accountSid,
        authToken: credentials.authToken,
        messageSid: reference,
      });
      return classifyTwilioMessageStatus(transportResult);
    },
  };
}
