/**
 * Future passwordless login (WebAuthn / passkeys / Face ID app-bound credentials).
 * No runtime WebAuthn calls here — only shared types so API and client can evolve together.
 */

export type PasskeyRegistrationChallenge = Readonly<{
  challengeId: string;
  rpId: string;
  timeoutMs: number;
}>;

export type PasskeyAssertionChallenge = Readonly<{
  challengeId: string;
  rpId: string;
  timeoutMs: number;
}>;

/** Stored server-side when passkeys ship (not implemented). */
export type PasskeyCredentialRecordStub = Readonly<{
  credentialIdBase64: string;
  userId: string;
  transports?: readonly string[];
  createdAtIso: string;
}>;
