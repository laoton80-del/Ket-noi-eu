import type { Response } from 'express';

export type ApiSuccess<T> = Readonly<{ success: true; data: T }>;
export type ApiFailure = Readonly<{ success: false; error: string }>;
export type ApiEnvelope<T = unknown> = ApiSuccess<T> | ApiFailure;

export function jsonOk<T>(res: Response, data: T, statusCode = 200): void {
  const body: ApiSuccess<T> = { success: true, data };
  res.status(statusCode).json(body);
}

export function jsonFail(res: Response, error: string, statusCode = 400): void {
  const body: ApiFailure = { success: false, error };
  res.status(statusCode).json(body);
}
