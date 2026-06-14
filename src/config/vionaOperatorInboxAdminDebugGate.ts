import { isAdminDebugSurfaceEnabled } from './adminDebugGate';

export const VIONA_OPERATOR_INBOX_ADMIN_DEBUG_PREVIEW_FLAG =
  'EXPO_PUBLIC_VIONA_OPERATOR_INBOX_ADMIN_DEBUG_PREVIEW';

function isOperatorInboxAdminDebugPreviewFlagEnabled(): boolean {
  const v = process.env.EXPO_PUBLIC_VIONA_OPERATOR_INBOX_ADMIN_DEBUG_PREVIEW;
  return v === '1' || v === 'true';
}

/**
 * Admin Debug operator inbox preview route is enabled only when the global admin debug
 * surface is enabled and the dedicated operator-inbox preview flag is on.
 * Does not use adminDemoMetricsEnabled or omniDemoEnabled.
 */
export function isVionaOperatorInboxAdminDebugPreviewEnabled(): boolean {
  return isAdminDebugSurfaceEnabled() && isOperatorInboxAdminDebugPreviewFlagEnabled();
}
