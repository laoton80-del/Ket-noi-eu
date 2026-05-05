import type { Request, Response } from 'express';

import { relayAiReceptionistPilotLeadEmail } from '../services/ai-receptionist/AiReceptionistLeadEmailService';
import type { PostAiReceptionistLeadEmailBody } from '../validation/aiReceptionistLeadSchema';
import { jsonFail, jsonOk } from '../utils/apiEnvelope';
import { logger } from '../utils/Logger';

function readAuthUserId(req: Request): string | null {
  const id = req.authUserId;
  return typeof id === 'string' && id.length > 0 ? id : null;
}

export async function postPilotLeadEmail(req: Request, res: Response): Promise<void> {
  const authUserId = readAuthUserId(req);
  if (!authUserId) {
    jsonFail(res, 'Authentication is required.', 401);
    return;
  }

  const body = req.body as PostAiReceptionistLeadEmailBody;
  if (body.consentAccepted !== true) {
    jsonFail(res, 'Consent must be accepted before submission.', 400);
    return;
  }

  const relayResult = await relayAiReceptionistPilotLeadEmail({
    authUserId,
    lead: body,
  });

  if (!relayResult.ok && relayResult.reason === 'not_configured') {
    jsonFail(res, 'LEAD_CAPTURE_NOT_CONFIGURED: Pilot request email relay is not configured.', 503);
    return;
  }

  if (!relayResult.ok) {
    logger.error({ authUserId }, '[ai-receptionist] lead email relay failed');
    jsonFail(res, 'Could not send pilot request for manual review right now.', 502);
    return;
  }

  jsonOk(res, {
    status: 'submitted_for_manual_review',
    message: 'Pilot request was sent to the VIONA team for manual review.',
  });
}

