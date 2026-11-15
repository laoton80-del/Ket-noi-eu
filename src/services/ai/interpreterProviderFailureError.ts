/** Opaque server-signed failure evidence. Only walletOps verifies it before a refund. */
export class InterpreterProviderFailureError extends Error {
  readonly interpreterFailureProof: string;

  constructor(interpreterFailureProof: string) {
    super('interpreter_provider_failed');
    this.name = 'InterpreterProviderFailureError';
    this.interpreterFailureProof = interpreterFailureProof;
  }
}
