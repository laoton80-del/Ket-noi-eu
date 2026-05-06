import type { AiAutoPausePolicy } from './aiAutoPauseTypes';

/** Default Pack W policy — dry-run only; never arms production enforcement. */
export const DEFAULT_AI_AUTO_PAUSE_POLICY: AiAutoPausePolicy = Object.freeze({
  mode: 'dryRun',
  allowProductionEnforcement: false,
  requireHumanApprovalForPause: true,
  requireAuditLog: true,
  requireAdminNotification: true,
  notesKey: 'aiEnforcement.policy.defaultNotes',
});
