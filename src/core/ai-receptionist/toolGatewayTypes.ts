export type ToolGatewayDomain =
  | 'calendar'
  | 'booking'
  | 'inventory'
  | 'payment'
  | 'billing'
  | 'notifications'
  | 'customer_profile';

export type ToolGatewayRiskTier = 'safe_read' | 'soft_write' | 'hard_write' | 'critical_money';

export type ToolGatewayExecutionMode = 'dry_run' | 'simulate' | 'live';

export type ToolGatewayToolDefinition = Readonly<{
  toolName: string;
  domain: ToolGatewayDomain;
  riskTier: ToolGatewayRiskTier;
  description: string;
  /** Required policy capability key, resolved by the policy engine. */
  capability: string;
  /** Optional timeout budget per call. */
  timeoutMs?: number;
  /** Optional hard limit for retries in orchestrator wrappers. */
  maxRetries?: number;
}>;

export type ToolGatewayTenantContext = Readonly<{
  merchantId: string;
  locationId?: string;
  actorUserId?: string;
  traceId: string;
}>;

export type ToolGatewayExecutionRequest = Readonly<{
  toolName: string;
  mode: ToolGatewayExecutionMode;
  payload: Record<string, unknown>;
  tenant: ToolGatewayTenantContext;
}>;

export type ToolGatewayExecutionOutcome =
  | Readonly<{
      ok: true;
      toolName: string;
      mode: ToolGatewayExecutionMode;
      result: Record<string, unknown>;
      auditTags: readonly string[];
    }>
  | Readonly<{
      ok: false;
      toolName: string;
      mode: ToolGatewayExecutionMode;
      errorCode:
        | 'tool_not_registered'
        | 'policy_denied'
        | 'tenant_not_ready'
        | 'timeout'
        | 'upstream_failure'
        | 'invalid_payload';
      message: string;
      retryable: boolean;
      auditTags: readonly string[];
    }>;
