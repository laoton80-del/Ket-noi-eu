import type { Response } from 'express';

export type ApiSuccess<T> = Readonly<{ success: true; data: T }>;
/** `code` is optional — omit for legacy callers; Local create failures include an allowlisted code. */
export type ApiFailure = Readonly<{ success: false; error: string; code?: string }>;
export type ApiEnvelope<T = unknown> = ApiSuccess<T> | ApiFailure;

export function jsonOk<T>(res: Response, data: T, statusCode = 200): void {
  const body: ApiSuccess<T> = { success: true, data };
  res.status(statusCode).json(body);
}

/**
 * Shared failure helper. When `code` is omitted, the JSON body remains
 * `{ success: false, error }` for backward compatibility with existing endpoints.
 */
export function jsonFail(
  res: Response,
  error: string,
  statusCode = 400,
  code?: string
): void {
  const body: ApiFailure =
    code !== undefined
      ? { success: false, error, code }
      : { success: false, error };
  res.status(statusCode).json(body);
}

/** Local create failures always emit allowlisted `code` + safe human `error`. */
export function jsonLocalCreateFail(
  res: Response,
  statusCode: number,
  code: string,
  error: string
): void {
  jsonFail(res, error, statusCode, code);
}
