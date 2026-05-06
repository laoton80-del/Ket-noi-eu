/**
 * Augment Express `Request` without importing `express-serve-static-core`
 * (avoids eslint `import/no-unresolved` when types are nested under `@types/express`).
 */
export {};

declare global {
  namespace Express {
    interface Request {
      /** Set by `authMiddleware` after a valid JWT. */
      authUserId?: string;
    }
  }
}
