import { randomUUID } from 'node:crypto';

import { PrismaClient, type Prisma } from '@prisma/client';

export const LANE_B_PRICE_PROVENANCE = 'list, Operator-accepted 2026-11-10';

export const LANE_B_MODEL_PRICES = Object.freeze([
  {
    provider: 'openai',
    model: 'gpt-4o-mini',
    calculationVersion: LANE_B_PRICE_PROVENANCE,
    inputMicrousdPerMillionTokens: 150000n,
    outputMicrousdPerMillionTokens: 600000n,
    audioInputMicrousdPerSecond: 0n,
    audioOutputMicrousdPerSecond: 0n,
    imageMicrousdPerUnit: 0n,
  },
  {
    provider: 'openai',
    model: 'gpt-4o-mini-tts',
    calculationVersion: LANE_B_PRICE_PROVENANCE,
    inputMicrousdPerMillionTokens: 600000n,
    outputMicrousdPerMillionTokens: 0n,
    audioInputMicrousdPerSecond: 0n,
    audioOutputMicrousdPerSecond: 0n,
    imageMicrousdPerUnit: 0n,
  },
  {
    provider: 'openai',
    model: 'gpt-4o-transcribe',
    calculationVersion: LANE_B_PRICE_PROVENANCE,
    inputMicrousdPerMillionTokens: 0n,
    outputMicrousdPerMillionTokens: 0n,
    audioInputMicrousdPerSecond: 100n,
    audioOutputMicrousdPerSecond: 0n,
    imageMicrousdPerUnit: 0n,
  },
  {
    provider: 'gemini',
    model: 'gemini-1.5-flash',
    calculationVersion: LANE_B_PRICE_PROVENANCE,
    inputMicrousdPerMillionTokens: 75000n,
    outputMicrousdPerMillionTokens: 300000n,
    audioInputMicrousdPerSecond: 0n,
    audioOutputMicrousdPerSecond: 0n,
    imageMicrousdPerUnit: 0n,
  },
] as const);

export const PROVISIONAL_PRICE = LANE_B_MODEL_PRICES[0];

type ActivePriceRow = Readonly<{
  id: string;
  calculationVersion: string;
  inputMicrousdPerMillionTokens: bigint | number | string;
  outputMicrousdPerMillionTokens: bigint | number | string;
  audioInputMicrousdPerSecond: bigint | number | string;
  audioOutputMicrousdPerSecond: bigint | number | string;
  imageMicrousdPerUnit: bigint | number | string;
}>;

export type ProvisionalPriceSeedResult = Readonly<{
  outcome: 'unchanged' | 'inserted';
  priceVersionId: string;
}>;

export type LaneBPriceSeedResult = ProvisionalPriceSeedResult & Readonly<{
  provider: string;
  model: string;
}>;

function priceMatches(row: ActivePriceRow, target: (typeof LANE_B_MODEL_PRICES)[number]): boolean {
  return (
    row.calculationVersion === target.calculationVersion &&
    BigInt(row.inputMicrousdPerMillionTokens) === target.inputMicrousdPerMillionTokens &&
    BigInt(row.outputMicrousdPerMillionTokens) === target.outputMicrousdPerMillionTokens &&
    BigInt(row.audioInputMicrousdPerSecond) === target.audioInputMicrousdPerSecond &&
    BigInt(row.audioOutputMicrousdPerSecond) === target.audioOutputMicrousdPerSecond &&
    BigInt(row.imageMicrousdPerUnit) === target.imageMicrousdPerUnit
  );
}

async function seedOnePriceVersion(
  transaction: Prisma.TransactionClient,
  target: (typeof LANE_B_MODEL_PRICES)[number]
): Promise<ProvisionalPriceSeedResult> {
  const activeRows = await transaction.$queryRawUnsafe<ActivePriceRow[]>(
    `SELECT "id", "calculationVersion", "inputMicrousdPerMillionTokens", "outputMicrousdPerMillionTokens",
            "audioInputMicrousdPerSecond", "audioOutputMicrousdPerSecond", "imageMicrousdPerUnit"
       FROM "AiModelPrice"
      WHERE "provider" = $1
        AND "model" = $2
        AND "effectiveFrom" <= (now() AT TIME ZONE 'UTC')
        AND ("effectiveTo" IS NULL OR (now() AT TIME ZONE 'UTC') < "effectiveTo")
      ORDER BY "effectiveFrom" DESC
      FOR UPDATE`,
    target.provider,
    target.model
  );

  if (activeRows.length === 1 && priceMatches(activeRows[0], target)) {
    return { outcome: 'unchanged', priceVersionId: activeRows[0].id };
  }

  if (activeRows.length > 0) {
    const closed = await transaction.$executeRawUnsafe(
      `UPDATE "AiModelPrice"
          SET "effectiveTo" = date_trunc('milliseconds', (now() AT TIME ZONE 'UTC')),
              "updatedAt" = (now() AT TIME ZONE 'UTC')
        WHERE "id" = ANY($1::text[])`,
      activeRows.map((row) => row.id)
    );
    if (closed !== activeRows.length) {
      throw new Error(`Could not close every active AiModelPrice version for ${target.provider}/${target.model}`);
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
       $1, $2, $3, $4, date_trunc('milliseconds', (now() AT TIME ZONE 'UTC')), NULL,
       $5::bigint, $6::bigint, $7::bigint, $8::bigint, $9::bigint,
       (now() AT TIME ZONE 'UTC'), (now() AT TIME ZONE 'UTC')
     )`,
    priceVersionId,
    target.provider,
    target.model,
    target.calculationVersion,
    target.inputMicrousdPerMillionTokens.toString(),
    target.outputMicrousdPerMillionTokens.toString(),
    target.audioInputMicrousdPerSecond.toString(),
    target.audioOutputMicrousdPerSecond.toString(),
    target.imageMicrousdPerUnit.toString()
  );
  if (inserted !== 1) throw new Error(`Could not insert AiModelPrice version for ${target.provider}/${target.model}`);

  const verifiedRows = await transaction.$queryRawUnsafe<ActivePriceRow[]>(
    `SELECT "id", "calculationVersion", "inputMicrousdPerMillionTokens", "outputMicrousdPerMillionTokens",
            "audioInputMicrousdPerSecond", "audioOutputMicrousdPerSecond", "imageMicrousdPerUnit"
       FROM "AiModelPrice"
      WHERE "provider" = $1
        AND "model" = $2
        AND "effectiveFrom" <= (now() AT TIME ZONE 'UTC')
        AND ("effectiveTo" IS NULL OR (now() AT TIME ZONE 'UTC') < "effectiveTo")`,
    target.provider,
    target.model
  );
  if (verifiedRows.length !== 1 || verifiedRows[0].id !== priceVersionId || !priceMatches(verifiedRows[0], target)) {
    throw new Error(`AiModelPrice seed did not leave exactly one active version for ${target.provider}/${target.model}`);
  }

  return { outcome: 'inserted', priceVersionId };
}

/** Add all four operator-approved immutable Lane B price versions when needed. */
export async function seedLaneBModelPrices(prisma: PrismaClient): Promise<readonly LaneBPriceSeedResult[]> {
  return prisma.$transaction(async (transaction) => {
    await transaction.$executeRawUnsafe('LOCK TABLE "AiModelPrice" IN SHARE ROW EXCLUSIVE MODE');
    const results: LaneBPriceSeedResult[] = [];
    for (const target of LANE_B_MODEL_PRICES) {
      const result = await seedOnePriceVersion(transaction, target);
      results.push({ ...result, provider: target.provider, model: target.model });
    }
    return results;
  });
}

/** Backward-compatible single-model seed used by the existing focused seed test. */
export async function seedProvisionalOpenAiMiniPrice(
  prisma: PrismaClient
): Promise<ProvisionalPriceSeedResult> {
  return prisma.$transaction(async (transaction) => {
    await transaction.$executeRawUnsafe('LOCK TABLE "AiModelPrice" IN SHARE ROW EXCLUSIVE MODE');
    return seedOnePriceVersion(transaction, PROVISIONAL_PRICE);
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
    const results = await seedLaneBModelPrices(prisma);
    for (const result of results) {
      console.log(`${result.outcome}: ${result.provider}/${result.model} (${result.priceVersionId})`);
    }
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
