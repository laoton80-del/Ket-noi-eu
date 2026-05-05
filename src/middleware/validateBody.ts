/**
 * Middleware: parse & validate `req.body` bằng Zod; gán lại `req.body` bằng payload đã parse.
 */

import type { NextFunction, Request, Response } from 'express';
import type { ZodError, ZodTypeAny } from 'zod';

import { jsonFail } from '../utils/apiEnvelope';

function formatZodIssues(err: ZodError): string {
  return err.issues
    .map((i) => `${i.path.length > 0 ? i.path.map(String).join('.') : 'body'}: ${i.message}`)
    .join('; ');
}

/**
 * @param schema — Zod schema mô tả toàn bộ body JSON (object).
 */
export function validateBody<T extends ZodTypeAny>(schema: T) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      jsonFail(res, formatZodIssues(parsed.error), 400);
      return;
    }
    req.body = parsed.data;
    next();
  };
}
