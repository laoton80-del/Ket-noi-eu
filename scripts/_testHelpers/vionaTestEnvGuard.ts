/**
 * Pack39 — B2B Routing Performance & Test Isolation Fixes: shared test-infra-only env-var guard.
 *
 * `@prisma/client`'s own bundled runtime auto-loads the project's root `.env` file internally the
 * first time a `PrismaClient` is constructed in a process (confirmed by inspecting
 * `node_modules/@prisma/client/runtime/library.js`'s embedded dotenv-merge logic and
 * `node_modules/.prisma/client/index.js`'s `"schemaEnvPath": "../../../.env"` config — see
 * docs/product/VIONA_PACK39_TECH_DEBT_ERADICATION_PLAN.md §2.2). Because that loader only ever
 * fills in keys it considers "missing", a plain `delete process.env.OPENAI_API_KEY` is not
 * reliable across a test that (directly or transitively) causes the first `getPrisma()` call in
 * the process — the real key can be silently restored mid-test.
 *
 * `withOpenAiApiKeyDeeplyUnsetAsync(undefined, fn)` closes this gap. Node's `process.env` is a
 * special native-backed object that rejects accessor (getter/setter) property descriptors
 * (`Object.defineProperty(process.env, 'OPENAI_API_KEY', { get: ..., set: ... })` throws
 * `ERR_INVALID_OBJECT_DEFINE_PROPERTY` — confirmed empirically this session), so this helper
 * instead swaps out the *entire* `process.env` binding for a `Proxy` wrapping the real object for
 * the duration of `fn()`: every read of `OPENAI_API_KEY` through the proxy (including one made by
 * code this test never directly calls, e.g. deep inside `@prisma/client`'s own reload) returns
 * `undefined`, and any later plain-assignment WRITE to that one key (exactly what a `.env`
 * auto-loader does) is silently swallowed and never becomes visible to a later read — every other
 * env var passes through to the real, underlying object completely untouched, both for reads and
 * writes. The real `process.env` object reference is restored in a `finally` block no matter how
 * `fn()` resolves/rejects — no proxy state leaks into a later, unrelated test.
 *
 * `withOpenAiApiKeyDeeplyUnsetAsync(value, fn)` with a defined string `value` does not need the
 * trap (nothing "fills in" a key that is already present) — it behaves like a plain, restorable
 * `process.env.OPENAI_API_KEY = value` for the duration of `fn()`.
 */
export async function withOpenAiApiKeyDeeplyUnsetAsync<T>(
  value: string | undefined,
  fn: () => Promise<T>,
): Promise<T> {
  if (value !== undefined) {
    const original = process.env.OPENAI_API_KEY;
    process.env.OPENAI_API_KEY = value;
    try {
      return await fn();
    } finally {
      if (original === undefined) {
        delete process.env.OPENAI_API_KEY;
      } else {
        process.env.OPENAI_API_KEY = original;
      }
    }
  }

  const realEnv = process.env;
  const guardedEnv = new Proxy(realEnv, {
    get(target, prop, receiver) {
      if (prop === 'OPENAI_API_KEY') return undefined;
      return Reflect.get(target, prop, receiver);
    },
    set(target, prop, val, receiver) {
      if (prop === 'OPENAI_API_KEY') return true; // swallow — never becomes visible to a later read
      return Reflect.set(target, prop, val, receiver);
    },
    has(target, prop) {
      if (prop === 'OPENAI_API_KEY') return false;
      return Reflect.has(target, prop);
    },
    deleteProperty(target, prop) {
      if (prop === 'OPENAI_API_KEY') return true;
      return Reflect.deleteProperty(target, prop);
    },
  });

  process.env = guardedEnv;
  try {
    return await fn();
  } finally {
    process.env = realEnv;
  }
}
