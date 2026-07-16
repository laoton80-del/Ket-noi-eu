/**
 * Pack40DR2 — dormant system-recovery principal (not an execution-principal enum value).
 *
 * Constructed only by trusted internal factory. Not accepted from public request bodies.
 * Cannot create attempts or start provider sends. Not wired to HTTP in DR2.
 */

export const VIONA_SYSTEM_RECOVERY_PRINCIPAL_TYPE = 'systemRecovery' as const;
export const VIONA_SYSTEM_RECOVERY_TRIGGER_TYPE = 'operatorInternalRecovery' as const;
export const VIONA_RECOVERY_AUDIT_ACTOR_ROLE = 'execution_recovery_service' as const;

export const PACK40DR3A_PROVIDER_REFERENCE_RUNTIME_POPULATION_WIRED =
  'PACK40DR3A_PROVIDER_REFERENCE_RUNTIME_POPULATION_WIRED' as const;

/** Historical DR2 marker — superseded by Pack40DR3A live gateway persistence. */
export const PACK40DR2_PROVIDER_REFERENCE_RUNTIME_POPULATION_NOT_WIRED =
  'PACK40DR2_PROVIDER_REFERENCE_RUNTIME_POPULATION_NOT_WIRED' as const;

/** Pack40DR3B — operator internal recovery endpoint wired (no scheduler/worker). */
export const PACK40DR3B_OPERATOR_INTERNAL_RECOVERY_ENDPOINT_WIRED =
  'PACK40DR3B_OPERATOR_INTERNAL_RECOVERY_ENDPOINT_WIRED' as const;

/** Pack40DR2 recovery services are now wired through the DR3B endpoint only. */
export const PACK40DR2_RECOVERY_RUNTIME_WIRED = 'PACK40DR2_RECOVERY_RUNTIME_WIRED' as const;

/** Historical DR2 marker — superseded by Pack40DR3B endpoint wiring. */
export const PACK40DR2_RECOVERY_RUNTIME_NOT_WIRED =
  'PACK40DR2_RECOVERY_RUNTIME_NOT_WIRED' as const;

export type VionaRequestSystemRecoveryPrincipal = Readonly<{
  principalType: typeof VIONA_SYSTEM_RECOVERY_PRINCIPAL_TYPE;
  triggerType: typeof VIONA_SYSTEM_RECOVERY_TRIGGER_TYPE;
  triggeringUserId: string;
  correlationId: string;
}>;

export type CreateSystemRecoveryPrincipalInput = Readonly<{
  triggeringUserId: string;
  correlationId: string;
}>;

export type SystemRecoveryPrincipalErrorCode =
  | 'invalid_recovery_principal'
  | 'public_principal_rejected'
  | 'merchant_principal_rejected'
  | 'tenant_profile_input_rejected';

export class VionaRequestSystemRecoveryPrincipalError extends Error {
  readonly code: SystemRecoveryPrincipalErrorCode;

  constructor(code: SystemRecoveryPrincipalErrorCode) {
    super(code);
    this.name = 'VionaRequestSystemRecoveryPrincipalError';
    this.code = code;
  }
}

/**
 * Trusted internal constructor only. Rejects empty operator identity / correlation.
 * Does not accept tenantId or merchantProfileId as authority inputs.
 */
export function createVionaRequestSystemRecoveryPrincipal(
  input: CreateSystemRecoveryPrincipalInput,
): VionaRequestSystemRecoveryPrincipal {
  const triggeringUserId = input.triggeringUserId.trim();
  const correlationId = input.correlationId.trim();
  if (triggeringUserId.length === 0 || correlationId.length === 0) {
    throw new VionaRequestSystemRecoveryPrincipalError('invalid_recovery_principal');
  }
  return {
    principalType: VIONA_SYSTEM_RECOVERY_PRINCIPAL_TYPE,
    triggerType: VIONA_SYSTEM_RECOVERY_TRIGGER_TYPE,
    triggeringUserId,
    correlationId,
  };
}

/** Fail closed when a caller tries to pass public/merchant principal shapes as recovery. */
export function assertNotMasqueradingAsRecoveryPrincipal(candidate: unknown): void {
  if (candidate == null || typeof candidate !== 'object') return;
  const record = candidate as Record<string, unknown>;
  if (record.principalType === 'merchantService' || record.triggerType === 'internalAuthenticatedController') {
    throw new VionaRequestSystemRecoveryPrincipalError('merchant_principal_rejected');
  }
  if (
    record.principalType === 'publicCustomer' ||
    record.principalType === 'authenticatedUser' ||
    record.scope === 'public'
  ) {
    throw new VionaRequestSystemRecoveryPrincipalError('public_principal_rejected');
  }
  if (record.tenantId != null || record.merchantProfileId != null) {
    throw new VionaRequestSystemRecoveryPrincipalError('tenant_profile_input_rejected');
  }
}

export function isVionaRequestSystemRecoveryPrincipal(
  value: unknown,
): value is VionaRequestSystemRecoveryPrincipal {
  if (value == null || typeof value !== 'object') return false;
  const record = value as Record<string, unknown>;
  return (
    record.principalType === VIONA_SYSTEM_RECOVERY_PRINCIPAL_TYPE &&
    record.triggerType === VIONA_SYSTEM_RECOVERY_TRIGGER_TYPE &&
    typeof record.triggeringUserId === 'string' &&
    record.triggeringUserId.trim().length > 0 &&
    typeof record.correlationId === 'string' &&
    record.correlationId.trim().length > 0
  );
}
