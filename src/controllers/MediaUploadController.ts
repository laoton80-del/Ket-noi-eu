import { randomBytes } from 'node:crypto';

import type { Request, Response } from 'express';

import { MAX_MEDIA_UPLOAD_BYTES } from '../constants/mediaUploadLimits';
import { putStorageObject } from '../services/StorageService';
import { jsonFail, jsonOk } from '../utils/apiEnvelope';

function extFromMime(mime: string): string {
  const m = mime.toLowerCase();
  if (m === 'image/jpeg' || m === 'image/jpg') return 'jpg';
  if (m === 'image/png') return 'png';
  if (m === 'image/webp') return 'webp';
  if (m === 'image/gif') return 'gif';
  return 'bin';
}

function publicObjectUrl(key: string): string | null {
  const raw = process.env.S3_PUBLIC_BASE_URL?.trim();
  if (!raw) return null;
  const base = raw.replace(/\/+$/, '');
  const path = key.replace(/^\/+/, '');
  return `${base}/${path}`;
}

/**
 * POST /api/media/image — multipart field `image`, max 2MB, image/* only.
 */
export async function postMerchantImage(req: Request, res: Response): Promise<void> {
  const userId = req.authUserId;
  if (!userId) {
    jsonFail(res, 'Unauthorized', 401);
    return;
  }

  const bucket = process.env.S3_BUCKET?.trim() ?? process.env.R2_BUCKET?.trim();
  if (!bucket) {
    jsonFail(res, 'Object storage is not configured', 503);
    return;
  }

  const file = req.file;
  if (!file?.buffer) {
    jsonFail(res, 'Missing image file (field name: image)', 400);
    return;
  }

  if (file.size > MAX_MEDIA_UPLOAD_BYTES) {
    jsonFail(res, 'Media exceeds maximum size (2MB)', 413);
    return;
  }

  const ext = extFromMime(file.mimetype);
  const key = `media/${userId}/${Date.now()}-${randomBytes(8).toString('hex')}.${ext}`;

  try {
    await putStorageObject({
      bucket,
      key,
      body: file.buffer,
      contentType: file.mimetype,
    });
  } catch (e: unknown) {
    const code = typeof e === 'object' && e !== null && 'code' in e ? (e as { code?: string }).code : undefined;
    if (code === 'MEDIA_TOO_LARGE' || (e instanceof Error && e.message === 'media_upload_too_large')) {
      jsonFail(res, 'Media exceeds maximum size (2MB)', 413);
      return;
    }
    console.error('[media] upload', e);
    jsonFail(res, 'Could not store image', 500);
    return;
  }

  const publicUrl = publicObjectUrl(key);
  jsonOk(res, {
    key,
    bucket,
    sizeBytes: file.size,
    contentType: file.mimetype,
    ...(publicUrl ? { url: publicUrl } : {}),
  });
}
