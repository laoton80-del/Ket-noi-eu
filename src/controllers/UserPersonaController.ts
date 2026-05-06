import type { Request, Response } from 'express';

import { patchUserPersona } from '../services/api/UserPersonaService';
import { jsonFail, jsonOk } from '../utils/apiEnvelope';

function readString(value: unknown): string | null {
  return typeof value === 'string' ? value : null;
}

export async function patchPersona(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.authUserId;
    if (!userId) {
      jsonFail(res, 'Unauthorized', 401);
      return;
    }
    const body: unknown = req.body;
    const persona =
      typeof body === 'object' && body !== null && 'persona' in body
        ? readString((body as { persona?: unknown }).persona)
        : null;
    if (!persona) {
      jsonFail(res, 'persona is required', 400);
      return;
    }
    const result = await patchUserPersona(userId, persona);
    if (!result.ok) {
      if (result.reason === 'invalid_persona') {
        jsonFail(res, 'persona must be EXPAT or TOURIST', 400);
        return;
      }
      jsonFail(res, 'User not found', 404);
      return;
    }
    jsonOk(res, { persona: result.persona });
  } catch {
    jsonFail(res, 'Unexpected error', 500);
  }
}
