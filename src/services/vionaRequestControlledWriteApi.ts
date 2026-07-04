/**
 * Pack18 controlled write client — POST endpoints only, policy-gated.
 * Delegates to existing Pack20 note + Pack25 status action helpers after policy checks.
 */
import {
  canPerformVionaRequestStatusAction,
  canSubmitVionaRequestNote,
  VIONA_PACK18_CONTROLLED_WRITE_ENDPOINTS,
  type VionaPack18WriteCapabilityContext,
} from '../lib/viona/requests/vionaRequestControlledWritePolicy';
import type { ApiRequestResult } from './apiClient';
import {
  appendVionaRequestNote,
  transitionVionaRequestStatus,
  VIONA_REQUEST_STATUS_ACTION_TARGET_TRIAGE,
  type AppendVionaRequestNoteInput,
  type TransitionVionaRequestStatusInput,
  type VionaRequestNoteActionResponse,
  type VionaRequestStatusActionResponse,
} from './vionaRequestApi';

export {
  VIONA_PACK18_CONTROLLED_WRITE_ENDPOINTS,
  VIONA_REQUEST_STATUS_ACTION_TARGET_TRIAGE,
};

export type ControlledWritePolicyDenied = Readonly<{
  ok: false;
  status: 403;
  error: string;
  policyDenied: true;
}>;

function policyDenied(message: string): ControlledWritePolicyDenied {
  return { ok: false, status: 403, error: message, policyDenied: true };
}

/** `POST /api/viona/requests/:id/actions/note` — Pack18 gated note submit. */
export async function appendVionaRequestNoteControlled(
  requestId: string,
  body: AppendVionaRequestNoteInput,
  ctx: VionaPack18WriteCapabilityContext
): Promise<ApiRequestResult<VionaRequestNoteActionResponse> | ControlledWritePolicyDenied> {
  if (!canSubmitVionaRequestNote(ctx)) {
    return policyDenied('Note submit is not permitted for this request or session.');
  }
  return appendVionaRequestNote(requestId, body);
}

/** `POST /api/viona/requests/:id/actions/status` — Pack18 gated status action (triage only). */
export async function transitionVionaRequestStatusControlled(
  requestId: string,
  body: TransitionVionaRequestStatusInput,
  ctx: VionaPack18WriteCapabilityContext
): Promise<ApiRequestResult<VionaRequestStatusActionResponse> | ControlledWritePolicyDenied> {
  if (!canPerformVionaRequestStatusAction(ctx)) {
    return policyDenied('Status action is not permitted for this request state or session.');
  }
  if (body.targetStatus !== VIONA_REQUEST_STATUS_ACTION_TARGET_TRIAGE) {
    return policyDenied('Only triage target status is allowed in Pack18 controlled write.');
  }
  return transitionVionaRequestStatus(requestId, body);
}
