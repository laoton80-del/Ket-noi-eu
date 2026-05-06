/**
 * S3-compatible object storage — set `S3_ENDPOINT` to a Cloudflare R2 HTTPS endpoint to use zero-egress R2
 * with the same AWS SDK v3 client (path-style addressing on by default for custom endpoints).
 *
 * Server-side only — do not import from Expo client bundles.
 */

import { PutObjectCommand, S3Client, type S3ClientConfig } from '@aws-sdk/client-s3';

import { MAX_MEDIA_UPLOAD_BYTES } from '../constants/mediaUploadLimits';

function uploadBodyByteLength(body: Buffer | Uint8Array | string): number {
  if (typeof body === 'string') return Buffer.byteLength(body, 'utf8');
  return body.byteLength;
}

/**
 * Builds client config: when `S3_ENDPOINT` is set (R2 / MinIO / etc.), `forcePathStyle` defaults to true.
 * Set `S3_FORCE_PATH_STYLE=false` to opt out if your provider requires virtual-hosted style.
 */
export function buildS3CompatibleConfig(): S3ClientConfig {
  const endpoint = process.env.S3_ENDPOINT?.trim() ?? '';
  const region = process.env.AWS_REGION?.trim() || 'auto';
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID?.trim();
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY?.trim();

  const cfg: S3ClientConfig = { region };

  if (endpoint.length > 0) {
    cfg.endpoint = endpoint;
    const forcePath = process.env.S3_FORCE_PATH_STYLE?.trim().toLowerCase();
    cfg.forcePathStyle = forcePath !== 'false' && forcePath !== '0';
  }

  if (accessKeyId && secretAccessKey) {
    cfg.credentials = { accessKeyId, secretAccessKey };
  }

  return cfg;
}

let clientSingleton: S3Client | null = null;

/** Shared S3/R2 client (lazy). */
export function getStorageS3Client(): S3Client {
  if (!clientSingleton) {
    clientSingleton = new S3Client(buildS3CompatibleConfig());
  }
  return clientSingleton;
}

/** @internal tests */
export function resetStorageS3ClientSingleton(): void {
  clientSingleton = null;
}

export type PutObjectInput = Readonly<{
  bucket: string;
  key: string;
  body: Buffer | Uint8Array | string;
  contentType: string;
  cacheControl?: string;
}>;

/** Upload a single object (private ACL by default — tune via env/policy on the bucket). */
export async function putStorageObject(input: PutObjectInput): Promise<void> {
  const len = uploadBodyByteLength(input.body);
  if (len > MAX_MEDIA_UPLOAD_BYTES) {
    const err = new Error('media_upload_too_large');
    (err as NodeJS.ErrnoException).code = 'MEDIA_TOO_LARGE';
    throw err;
  }

  const client = getStorageS3Client();
  await client.send(
    new PutObjectCommand({
      Bucket: input.bucket,
      Key: input.key,
      Body: input.body,
      ContentType: input.contentType,
      CacheControl: input.cacheControl ?? 'public, max-age=31536000, immutable',
    })
  );
}
