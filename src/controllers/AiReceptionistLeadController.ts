import type { Request, Response } from 'express';

import { relayAiReceptionistPilotLeadEmail } from '../services/ai-receptionist/AiReceptionistLeadEmailService';
import type { PostAiReceptionistLeadEmailBody } from '../validation/aiReceptionistLeadSchema';
import { logger } from '../utils/Logger';

function readAuthUserId(req: Request): string | null {
  const id = req.authUserId;
  return typeof id === 'string' && id.length > 0 ? id : null;
}

export async function postPilotLeadEmail(req: Request, res: Response): Promise<void> {
  const authUserId = readAuthUserId(req);
  if (!authUserId) {
    res.status(401).json({
      success: false,
      code: 'UNAUTHORIZED',
      message: 'Authentication is required.',
    });
    return;
  }

  const body = req.body as PostAiReceptionistLeadEmailBody;
  if (body.consentAccepted !== true) {
    res.status(400).json({
      success: false,
      code: 'CONSENT_REQUIRED',
      message: 'Consent must be accepted before submission.',
    });
    return;
  }

  const relayResult = await relayAiReceptionistPilotLeadEmail({
    authUserId,
    lead: body,
  });

  if (!relayResult.ok && relayResult.reason === 'not_configured') {
    res.status(503).json({
      success: false,
      code: 'LEAD_CAPTURE_NOT_CONFIGURED',
      message: 'Pilot request email relay is not configured.',
    });
    return;
  }

  if (!relayResult.ok) {
    logger.error({ authUserId }, '[ai-receptionist] lead email relay failed');
    res.status(502).json({
      success: false,
      code: 'LEAD_CAPTURE_DELIVERY_FAILED',
      message: 'Could not send pilot request for manual review right now.',
    });
    return;
  }

  res.status(200).json({
    success: true,
    status: 'submitted_for_manual_review',
    message: 'Pilot request was sent to the VIONA team for manual review.',
  });
}

