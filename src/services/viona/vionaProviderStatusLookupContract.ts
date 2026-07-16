/**
 * Pack40DR2 — bounded read-only exact provider-status lookup contract.
 *
 * Fake adapters only in DR2 tests. No live Twilio. No send. No listing.
 */

export const VIONA_PACK40DR2_PROVIDER_NAME_TWILIO_TEST_SMS = 'twilio_test_sms' as const;

export type VionaProviderExactStatusLookupResult =
  | Readonly<{ classification: 'knownSuccess'; resultDigest: string }>
  | Readonly<{
      classification: 'knownFailure';
      failureClass: string;
      failureDigest: string;
    }>
  | Readonly<{ classification: 'stillUncertain'; uncertaintyDigest: string }>
  | Readonly<{ classification: 'lookupTransportUncertain'; uncertaintyDigest: string }>;

export type VionaProviderStatusLookupAdapter = Readonly<{
  providerName: typeof VIONA_PACK40DR2_PROVIDER_NAME_TWILIO_TEST_SMS;
  lookupExactOperation(input: {
    providerExternalReference: string;
    correlationId: string;
  }): Promise<VionaProviderExactStatusLookupResult>;
}>;
