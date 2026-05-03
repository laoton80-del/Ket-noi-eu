/**
 * TODO(Voice economics): AI Teacher (Cô Giáo AI) voice / TTS sessions MUST deduct VIG from the
 * parent's main wallet balance per minute at dynamic voice rates. Do not mint treasury VIG or
 * subsidize audio from lesson PiggyBank locks — meter usage at the API edge before production voice.
 *
 * TODO(cron): Daily job — expired `PiggyBank` (`expiresAt < now()`): unlock remaining VIG and credit
 * parent's main wallet (see `EducationService` file header). Prevents orphaned lesson float.
 */

import type { Request, Response } from 'express';

import {
  completeLesson,
  createPiggyBank,
  EducationServiceError,
} from '../services/EducationService';
import { jsonFail, jsonOk } from '../utils/apiEnvelope';

function readAuthUserId(req: Request): string | null {
  const id = req.authUserId;
  return typeof id === 'string' && id.length > 0 ? id : null;
}

function readString(value: unknown): string | null {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;
}

function readScore(value: unknown): number | null {
  if (typeof value !== 'number' || !Number.isFinite(value)) return null;
  return value;
}

function readFiniteNonNegative(value: unknown): number | null {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) return null;
  return value;
}

export async function postCompleteLesson(req: Request, res: Response): Promise<void> {
  try {
    const parentUserId = readAuthUserId(req);
    if (!parentUserId) {
      jsonFail(res, 'Unauthorized', 401);
      return;
    }

    const body: unknown = req.body;
    if (typeof body !== 'object' || body === null) {
      jsonFail(res, 'Invalid JSON body', 400);
      return;
    }

    const childId = readString((body as { childId?: unknown }).childId);
    const lessonId = readString((body as { lessonId?: unknown }).lessonId);
    const score = readScore((body as { score?: unknown }).score);

    if (!childId || !lessonId || score === null) {
      jsonFail(res, 'childId, lessonId, and numeric score are required', 400);
      return;
    }

    const out = await completeLesson({
      parentUserId,
      childId,
      lessonId,
      score,
    });

    jsonOk(res, out);
  } catch (err: unknown) {
    if (err instanceof EducationServiceError) {
      const map: Record<EducationServiceError['code'], { status: number; msg: string }> = {
        invalid_input: { status: 400, msg: err.message },
        child_not_found: { status: 404, msg: err.message },
        piggy_not_found: { status: 404, msg: err.message },
        piggy_expired: { status: 410, msg: err.message },
        piggy_conflict: { status: 409, msg: err.message },
        concurrency_conflict: { status: 409, msg: err.message },
      };
      const m = map[err.code];
      jsonFail(res, m.msg, m.status);
      return;
    }
    jsonFail(res, 'Unexpected error', 500);
  }
}

export async function postCreatePiggyBank(req: Request, res: Response): Promise<void> {
  try {
    const parentUserId = readAuthUserId(req);
    if (!parentUserId) {
      jsonFail(res, 'Unauthorized', 401);
      return;
    }

    const body: unknown = req.body;
    if (typeof body !== 'object' || body === null) {
      jsonFail(res, 'Invalid JSON body', 400);
      return;
    }

    const childId = readString((body as { childId?: unknown }).childId);
    const lockedVigAmount = readFiniteNonNegative((body as { lockedVigAmount?: unknown }).lockedVigAmount);
    const rewardPerLesson = readFiniteNonNegative((body as { rewardPerLesson?: unknown }).rewardPerLesson);

    if (!childId || lockedVigAmount === null || rewardPerLesson === null) {
      jsonFail(res, 'childId, lockedVigAmount, and rewardPerLesson (finite numbers >= 0) are required', 400);
      return;
    }

    const out = await createPiggyBank({
      parentUserId,
      childId,
      lockedVigAmount,
      rewardPerLesson,
    });

    jsonOk(res, out, 201);
  } catch (err: unknown) {
    if (err instanceof EducationServiceError) {
      const map: Record<EducationServiceError['code'], { status: number; msg: string }> = {
        invalid_input: { status: 400, msg: err.message },
        child_not_found: { status: 404, msg: err.message },
        piggy_not_found: { status: 404, msg: err.message },
        piggy_expired: { status: 410, msg: err.message },
        piggy_conflict: { status: 409, msg: err.message },
        concurrency_conflict: { status: 409, msg: err.message },
      };
      const m = map[err.code];
      jsonFail(res, m.msg, m.status);
      return;
    }
    jsonFail(res, 'Unexpected error', 500);
  }
}
