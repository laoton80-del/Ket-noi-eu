import 'express-serve-static-core';

declare module 'express-serve-static-core' {
  interface Request {
    /** Set by `authMiddleware` after a valid JWT. */
    authUserId?: string;
  }
}

export {};
