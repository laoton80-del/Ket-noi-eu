/**
 * Web: avoid the ESM barrel `esm/middleware.mjs`, which parses `devtools` code using
 * `import.meta.env` (breaks non-module scripts). `require` resolves to CJS `middleware.js`.
 */
type ZustandMiddleware = typeof import('zustand/middleware');

// eslint-disable-next-line @typescript-eslint/no-require-imports -- intentional CJS entry for web
const m = require('zustand/middleware') as Pick<ZustandMiddleware, 'createJSONStorage' | 'persist'>;

export const persist: ZustandMiddleware['persist'] = m.persist;
export const createJSONStorage: ZustandMiddleware['createJSONStorage'] = m.createJSONStorage;
