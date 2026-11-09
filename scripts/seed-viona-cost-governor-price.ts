import { randomUUID } from 'node:crypto';

import { PrismaClient } from '@prisma/client';

export const PROVISIONAL_PRICE = Object.freeze({
  provider: 'openai',
  model: 'gpt-4o-mini',
  calculationVersion: 'openai-list-2026-11-provisional',
  inputMicrousdPerMillionTokens: 150000n,
  outputMicrousdPerMillionTokens: 600000n,
  audioInputMicrousdPerSecond: 0n,
  audioOutputMicrousdPerSecond: 0n,
  imageMicrousdPerUnit: 0n,
});

type ActivePriceRow = Readonly<{
  id: string;
  inputMicrousdPerMillionTokens: bigint | number | string;
  outputMicrousdPerMillionTokens: bigint | number | string;
}>;

export type ProvisionalPriceSeedResult = Readonly<{
  outcome: 'unchanged' | 'inserted';
  priceVersionId: string;
}>;

function priceMatches(row: ActivePriceRow): boolean {
  return (
    BigInt(row.inputMicrousdPerMillionTokens) === PROVISIONAL_PRICE.inputMicrousdPerMillionTokens &&
    BigInt(row.outputMicrousdPerMillionTokens) === PROVISIONAL_PRICE.outputMicrousdPerMillionTokens
  );
}

/** Add the provisional pilot price as a new immutable version when needed. */
export async function seedProvisionalOpenAiMiniPrice(
  prisma: PrismaClient
): Promise<ProvisionalPriceSeedResult> {
  return prisma.$transaction(async (transaction) => {
    // Serialize seeders while allowing the runtime's read-only price lookups.
    await transaction.$executeRawUnsafe('LOCK TABLE "AiModelPrice" IN SHARE ROW EXCLUSIVE MODE');

    const activeRows = await transaction.$queryRawUnsafe<ActivePriceRow[]>(
      `SELECT "id", "inputMicrousdPerMillionTokens", "outputMicrousdPerMillionTokens"
         FROM "AiModelPrice"
        WHERE "provider" = $1
          AND "model" = $2
          AND "effectiveFrom" <= (now() AT TIME ZONE 'UTC')
          AND ("effectiveTo" IS NULL OR (now() AT TIME ZONE 'UTC') < "effectiveTo")
        ORDER BY "effectiveFrom" DESC
        FOR UPDATE`,
      PROVISIONAL_PRICE.provider,
      PROVISIONAL_PRICE.model
    );

    if (activeRows.length === 1 && priceMatches(activeRows[0])) {
      return { outcome: 'unchanged', priceVersionId: activeRows[0].id };
    }

    if (activeRows.length > 0) {
      const closed = await transaction.$executeRawUnsafe(
        `UPDATE "AiModelPrice"
            SET "effectiveTo" = (now() AT TIME ZONE 'UTC'),
                "updatedAt" = (now() AT TIME ZONE 'UTC')
          WHERE "id" = ANY($1::text[])`,
        activeRows.map((row) => row.id)
      );
      if (closed !== activeRows.length) {
        throw new Error('Could not close every active AiModelPrice version before inserting the provisional price');
      }
    }

    const priceVersionId = randomUUID();
    const inserted = await transaction.$executeRawUnsafe(
      `INSERT INTO "AiModelPrice" (
         "id", "provider", "model", "calculationVersion", "effectiveFrom", "effectiveTo",
         "inputMicrousdPerMillionTokens", "outputMicrousdPerMillionTokens",
         "audioInputMicrousdPerSecond", "audioOutputMicrousdPerSecond", "imageMicrousdPerUnit",
         "createdAt", "updatedAt"
       ) VALUES (
         $1, $2, $3, $4, (now() AT TIME ZONE 'UTC'), NULL,
         $5::bigint, $6::bigint, $7::bigint, $8::bigint, $9::bigint,
         (now() AT TIME ZONE 'UTC'), (now() AT TIME ZONE 'UTC')
       )`,
      priceVersionId,
      PROVISIONAL_PRICE.provider,
      PROVISIONAL_PRICE.model,
      PROVISIONAL_PRICE.calculationVersion,
      PROVISIONAL_PRICE.inputMicrousdPerMillionTokens.toString(),
      PROVISIONAL_PRICE.outputMicrousdPerMillionTokens.toString(),
      PROVISIONAL_PRICE.audioInputMicrousdPerSecond.toString(),
      PROVISIONAL_PRICE.audioOutputMicrousdPerSecond.toString(),
      PROVISIONAL_PRICE.imageMicrousdPerUnit.toString()
    );
    if (inserted !== 1) throw new Error('Could not insert the provisional AiModelPrice version');

    const verifiedRows = await transaction.$queryRawUnsafe<ActivePriceRow[]>(
      `SELECT "id", "inputMicrousdPerMillionTokens", "outputMicrousdPerMillionTokens"
         FROM "AiModelPrice"
        WHERE "provider" = $1
          AND "model" = $2
          AND "effectiveFrom" <= (now() AT TIME ZONE 'UTC')
          AND ("effectiveTo" IS NULL OR (now() AT TIME ZONE 'UTC') < "effectiveTo")`,
      PROVISIONAL_PRICE.provider,
      PROVISIONAL_PRICE.model
    );
    if (verifiedRows.length !== 1 || verifiedRows[0].id !== priceVersionId || !priceMatches(verifiedRows[0])) {
      throw new Error('Provisional AiModelPrice seed did not leave exactly one active price version');
    }

    return { outcome: 'inserted', priceVersionId };
  });
}

async function runCli(): Promise<void> {
  const databaseUrl = process.argv[2];
  if (!databaseUrl) {
    throw new Error('Usage: tsx scripts/seed-viona-cost-governor-price.ts <postgresql-connection-url>');
  }
  const protocol = new URL(databaseUrl).protocol;
  if (protocol !== 'postgres:' && protocol !== 'postgresql:') {
    throw new Error('The price seed requires a PostgreSQL connection URL');
  }

  const prisma = new PrismaClient({ datasources: { db: { url: databaseUrl } } });
  try {
    const result = await seedProvisionalOpenAiMiniPrice(prisma);
    console.log(`${result.outcome}: ${PROVISIONAL_PRICE.provider}/${PROVISIONAL_PRICE.model} (${result.priceVersionId})`);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  void runCli().catch((error: unknown) => {
    const message = error instanceof Error ? error.message : 'Unknown price seed error';
    console.error(message);
    process.exitCode = 1;
  });
}
