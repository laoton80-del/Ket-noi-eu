import type { Request, Response } from 'express';

import { wipeUserData } from '../services/api/UserService';
import { jsonFail, jsonOk } from '../utils/apiEnvelope';

/**
 * GDPR erasure for the authenticated user (subject == JWT `sub`).
 */
export async function postGdprErase(req: Request, res: Response): Promise<void> {
  const authId = req.authUserId;
  if (typeof authId !== 'string' || authId.length === 0) {
    jsonFail(res, 'Unauthorized', 401);
    return;
  }

  const out = await wipeUserData(authId);
  if (!out.ok) {
    const status =
      out.code === 'not_found'
        ? 404
        : out.code === 'forbidden_role' || out.code === 'active_merchant'
          ? 403
          : 400;
    jsonFail(res, out.message, status);
    return;
  }

  jsonOk(res, { erased: true });
}
