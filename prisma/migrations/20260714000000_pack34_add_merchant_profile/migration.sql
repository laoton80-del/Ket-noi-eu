-- Pack34 — B2B Merchant Gateway & AI White-Labeling: additive MerchantProfile model.
-- See docs/product/VIONA_PACK34_B2B_MERCHANT_GATEWAY_PLAN.md §3. Additive only — no existing
-- table, column, index, or constraint is altered or dropped by this migration.

-- CreateTable
CREATE TABLE "MerchantProfile" (
    "id" TEXT NOT NULL,
    "ownerUserId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "countryCode" TEXT,
    "defaultLocale" TEXT,
    "aiPersona" JSONB,
    "toolScope" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MerchantProfile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MerchantProfile_ownerUserId_key" ON "MerchantProfile"("ownerUserId");

-- CreateIndex
CREATE UNIQUE INDEX "MerchantProfile_tenantId_key" ON "MerchantProfile"("tenantId");

-- CreateIndex
CREATE INDEX "MerchantProfile_tenantId_idx" ON "MerchantProfile"("tenantId");
