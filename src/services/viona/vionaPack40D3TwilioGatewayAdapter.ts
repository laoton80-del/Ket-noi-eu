/**
 * Pack40D3B — single-shot Twilio test-SMS adapter for the Pack40D3A gateway.
 *
 * Uses the existing Twilio test-credentials gates/transport/credentials surface, but invokes
 * transport exactly once. Never retries after timeout/unavailable (uncertain-outcome safe).
 * Does not create escrow holds. Does not modify the legacy retrying executeVionaTwilioTestPocReal.
 */

import { createHash } from 'node:crypto';

import {
  buildVionaTwilioTestPocRequestPayload,
  classifyTwilioTransportResult,
  defaultVionaTwilioHttpTransport,
  defaultVionaTwilioCircuitBreakerCheck,
  readVionaTwilioTestCredentialsFromEnv,
  validateVionaTwilioTestPocIntent,
  type ExecuteVionaTwilioTestPocDeps,
  type VionaTwilioHttpTransport,
  type VionaTwilioTestCredentials,
} from '../../lib/viona/realProviderAdapter/vionaTwilioTestRealProviderAdapter';
import { isRealProviderExecutionEnabled } from '../../lib/viona/realProviderAdapter/vionaRealProviderExecutionFlag';
import type {
  VionaExecutionProviderAdapter,
  VionaExecutionProviderAdapterInput,
  VionaExecutionProviderAdapterResult,
} from './vionaRequestExecutionProviderContract';

export type Pack40D3TwilioGatewayAdapterMessage = Readonly<{
  fromNumber: string;
  toNumber: string;
  body: string;
}>;

export type CreatePack40D3TwilioGatewayAdapterDeps = Readonly<{
  message: Pack40D3TwilioGatewayAdapterMessage;
  actorUserId: string;
  isEnabled?: () => boolean;
  credentials?: VionaTwilioTestCredentials | null;
  transport?: VionaTwilioHttpTransport;
  circuitBreakerCheck?: ExecuteVionaTwilioTestPocDeps['circuitBreakerCheck'];
  timeoutMs?: number;
}>;

function digest(value: string): string {
  return createHash('sha256').update(value).digest('hex').slice(0, 32);
}

/**
 * Build a VionaExecutionProviderAdapter that performs one Twilio test-SMS transport call.
 */
export function createPack40D3TwilioGatewayAdapter(
  deps: CreatePack40D3TwilioGatewayAdapterDeps,
): VionaExecutionProviderAdapter {
  return {
    async invoke(input: VionaExecutionProviderAdapterInput): Promise<VionaExecutionProviderAdapterResult> {
      const isEnabled = deps.isEnabled ?? isRealProviderExecutionEnabled;
      if (!isEnabled()) {
        return {
          kind: 'failed',
          failureClass: 'blocked_operator',
          failureReasonDigest: digest('flag_disabled'),
        };
      }

      const circuitBreakerCheck = deps.circuitBreakerCheck ?? defaultVionaTwilioCircuitBreakerCheck;
      const breaker = await circuitBreakerCheck();
      if (breaker.state === 'open') {
        return {
          kind: 'failed',
          failureClass: 'blocked_operator',
          failureReasonDigest: digest('circuit_breaker_open'),
        };
      }

      const validation = validateVionaTwilioTestPocIntent({
        fromNumber: deps.message.fromNumber,
        toNumber: deps.message.toNumber,
        body: deps.message.body,
      });
      if (!validation.ok) {
        return {
          kind: 'failed',
          failureClass: 'blocked_policy',
          failureReasonDigest: digest(validation.reason),
        };
      }

      const credentials =
        deps.credentials !== undefined ? deps.credentials : readVionaTwilioTestCredentialsFromEnv();
      if (!credentials) {
        return {
          kind: 'failed',
          failureClass: 'blocked_operator',
          failureReasonDigest: digest('missing_test_credentials'),
        };
      }

      const transport = deps.transport ?? defaultVionaTwilioHttpTransport;
      const timeoutMs = deps.timeoutMs ?? 5_000;
      const payload = buildVionaTwilioTestPocRequestPayload({
        fromNumber: deps.message.fromNumber,
        toNumber: deps.message.toNumber,
        body: deps.message.body,
      });

      try {
        const transportResult = await transport({
          accountSid: credentials.accountSid,
          authToken: credentials.authToken,
          body: payload,
          timeoutMs,
        });
        const classified = classifyTwilioTransportResult(transportResult);
        if (classified.ok) {
          return {
            kind: 'succeeded',
            resultDigest: digest(
              `${input.providerIdempotencyKey}:${classified.providerMessageSid ?? 'ok'}`,
            ),
            externalReferenceDigest: classified.providerMessageSid
              ? digest(classified.providerMessageSid)
              : null,
          };
        }
        if (classified.errorClass === 'provider_unavailable') {
          return {
            kind: 'uncertain',
            uncertaintyClass: 'response_loss',
            failureReasonDigest: digest(classified.errorClass),
          };
        }
        return {
          kind: 'failed',
          failureClass: classified.errorClass,
          failureReasonDigest: digest(
            `${classified.errorClass}:${classified.providerErrorCode ?? 'none'}`,
          ),
        };
      } catch (error) {
        const isAbort = error instanceof Error && error.name === 'AbortError';
        return {
          kind: 'uncertain',
          uncertaintyClass: isAbort ? 'timeout' : 'response_loss',
          failureReasonDigest: digest(isAbort ? 'abort' : 'transport_throw'),
        };
      }
    },
  };
}
