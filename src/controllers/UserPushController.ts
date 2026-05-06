import type { Request, Response } from 'express';

import { getPrisma } from '../lib/prisma';
import { jsonFail, jsonOk } from '../utils/apiEnvelope';

function readString(value: unknown): string | null {
  return typeof value === 'string' ? value : null;
}

/**
 * Stores Expo / FCM push token on the authenticated user (`User.fcmToken`).
 */
export async function patchPushToken(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.authUserId;
    if (!userId) {
      jsonFail(res, 'Unauthorized', 401);
      return;
    }
    const body: unknown = req.body;
    const token =
      typeof body === 'object' && body !== null && 'fcmToken' in body
        ? readString((body as { fcmToken?: unknown }).fcmToken)
        : null;
    if (!token || token.trim().length < 8) {
      jsonFail(res, 'fcmToken is required', 400);
      return;
    }

    await getPrisma().user.update({
      where: { id: userId },
      data: { fcmToken: token.trim() },
    });

    jsonOk(res, { ok: true });
  } catch {
    jsonFail(res, 'Unexpected error', 500);
  }
}
