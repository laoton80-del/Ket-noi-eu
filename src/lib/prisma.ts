import { PrismaClient } from '@prisma/client';

/**
 * Single PrismaClient per Node process to avoid connection pool exhaustion under
 * dev hot-reload and typical Cloud Function reuse semantics.
 *
 * - Do **not** import this module from React Native / Expo UI bundles (Prisma is Node-only).
 * - In serverless, prefer a pooled `DATABASE_URL` (e.g. PgBouncer transaction mode) and keep
 *   `connection_limit` conservative; call `await getPrisma().$disconnect()` when the runtime is
 *   about to freeze if your platform does not reuse the process.
 *
 * @see https://www.prisma.io/docs/guides/performance-and-optimization/connection-management
 */
const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

function createClient(): PrismaClient {
  const url = process.env.DATABASE_URL?.trim();
  if (!url) {
    throw new Error(
      'DATABASE_URL is not set. Configure it before calling getPrisma() in a Node context.'
    );
  }

  const log: Array<'query' | 'info' | 'warn' | 'error'> =
    process.env.NODE_ENV === 'development' && process.env.PRISMA_LOG_QUERIES === '1'
      ? ['query', 'warn', 'error']
      : ['warn', 'error'];

  return new PrismaClient({
    log,
    datasources: {
      db: { url },
    },
  });
}

export function getPrisma(): PrismaClient {
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = createClient();
  }
  return globalForPrisma.prisma;
}

/** Call before process exit in short-lived serverless handlers if the runtime does not reuse the client. */
export async function disconnectPrisma(): Promise<void> {
  if (!globalForPrisma.prisma) return;
  await globalForPrisma.prisma.$disconnect();
  globalForPrisma.prisma = undefined;
}
