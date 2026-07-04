/**
 * Pack18 controlled write policy — local implementation only.
 * Rollback: set `VIONA_PACK18_CONTROLLED_WRITE_ENABLED` to `false` and the inbox
 * reverts to `VionaRequestLiveDetailReadOnly` (Pack17 recoverable path).
 */

/** Compile-time rollback switch — no `.env` mutation required. */
export const VIONA_PACK18_CONTROLLED_WRITE_ENABLED = true;

/** Exact Pack18 write endpoint inventory (client-side). */
export const VIONA_PACK18_CONTROLLED_WRITE_ENDPOINTS = {
  noteSubmit: {
    method: 'POST' as const,
    path: '/api/viona/requests/:id/actions/note',
  },
  statusAction: {
    method: 'POST' as const,
    path: '/api/viona/requests/:id/actions/status',
  },
} as const;

/** Allowed HTTP methods for Pack18 request inbox writes. */
export const VIONA_PACK18_ALLOWED_HTTP_METHODS = ['POST'] as const;

/** Pack25 narrow status transition allowlist — owner scope enforced server-side. */
export const VIONA_PACK18_STATUS_ACTION_ALLOWLIST = {
  targetStatus: 'triage' as const,
  fromStatus: 'submitted' as const,
} as const;

export type VionaPack18WriteCapabilityContext = Readonly<{
  unauthorized?: boolean;
  requestStatus?: string | null;
}>;

export function isVionaPack18ControlledWriteEnabled(): boolean {
  return VIONA_PACK18_CONTROLLED_WRITE_ENABLED;
}

export function canSubmitVionaRequestNote(ctx: VionaPack18WriteCapabilityContext): boolean {
  if (!isVionaPack18ControlledWriteEnabled()) return false;
  if (ctx.unauthorized) return false;
  return true;
}

export function canPerformVionaRequestStatusAction(ctx: VionaPack18WriteCapabilityContext): boolean {
  if (!isVionaPack18ControlledWriteEnabled()) return false;
  if (ctx.unauthorized) return false;
  if (ctx.requestStatus == null) return false;
  return ctx.requestStatus === VIONA_PACK18_STATUS_ACTION_ALLOWLIST.fromStatus;
}

export function pack18ControlledWriteBlockedReason(
  kind: 'note' | 'status',
  ctx: VionaPack18WriteCapabilityContext
): string | null {
  if (!isVionaPack18ControlledWriteEnabled()) {
    return 'Controlled write is disabled. Inbox detail is read-only (Pack17 rollback path).';
  }
  if (ctx.unauthorized) {
    return 'Sign in required to perform this action.';
  }
  if (kind === 'status' && ctx.requestStatus !== VIONA_PACK18_STATUS_ACTION_ALLOWLIST.fromStatus) {
    return `Status action unavailable unless request is ${VIONA_PACK18_STATUS_ACTION_ALLOWLIST.fromStatus}.`;
  }
  return null;
}

/**
 * Tenant/user scope: existing REST JWT session via `restApiFetchJson`.
 * Server enforces request visibility (404/403); client never logs tokens or headers.
 */
