import type { B2BCallSessionFailureCode } from '../../../domain/b2b';

export type CallSessionFailure = {
  outcome: 'fail';
  failureCode: B2BCallSessionFailureCode;
  failureReason: string;
};

/** Map booking engine / transaction codes to stable voice-session failure taxonomy. */
export function mapBookingCodeToCallFailure(code: string, message?: string): CallSessionFailure {
  const msg = message ?? code;
  switch (code) {
    case 'overlap':
      return { outcome: 'fail', failureCode: 'no_available_resource', failureReason: msg };
    case 'insufficient_credits':
      return { outcome: 'fail', failureCode: 'insufficient_credits', failureReason: msg };
    case 'invalid_resource':
    case 'invalid_window':
    case 'party_size':
    case 'not_implemented':
      return { outcome: 'fail', failureCode: 'invalid_input', failureReason: msg };
    case 'tenant_not_found':
      return { outcome: 'fail', failureCode: 'tenant_not_found', failureReason: msg };
    case 'tenant_suspended':
      return { outcome: 'fail', failureCode: 'tenant_suspended', failureReason: msg };
    default:
      return { outcome: 'fail', failureCode: 'internal_error', failureReason: msg };
  }
}

/** Map order engine / transaction codes to voice-session failure taxonomy. */
export function mapOrderCodeToCallFailure(code: string, message?: string): CallSessionFailure {
  const msg = message ?? code;
  switch (code) {
    case 'insufficient_credits':
      return { outcome: 'fail', failureCode: 'insufficient_credits', failureReason: msg };
    case 'invalid_lines':
    case 'invalid_window':
    case 'not_implemented':
      return { outcome: 'fail', failureCode: 'invalid_input', failureReason: msg };
    case 'tenant_not_found':
      return { outcome: 'fail', failureCode: 'tenant_not_found', failureReason: msg };
    case 'tenant_suspended':
      return { outcome: 'fail', failureCode: 'tenant_suspended', failureReason: msg };
    default:
      return { outcome: 'fail', failureCode: 'internal_error', failureReason: msg };
  }
}
