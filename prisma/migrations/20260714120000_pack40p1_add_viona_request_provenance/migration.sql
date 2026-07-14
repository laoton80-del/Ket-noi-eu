-- Pack40P1 — additive VionaRequest scope provenance (schema only; not applied by this commit).
-- See docs/product/VIONA_PACK40P_REQUEST_PROVENANCE_MODEL_PLAN.md.
-- Additive only — no existing table, column, index, or constraint is altered or dropped.
-- No data mutation: existing rows receive scopeKind = legacyUnresolved via column DEFAULT only.

-- CreateEnum
CREATE TYPE "VionaRequestScopeKind" AS ENUM ('consumer', 'merchant', 'legacyUnresolved');

-- AlterTable
ALTER TABLE "VionaRequest"
  ADD COLUMN "scopeKind" "VionaRequestScopeKind" NOT NULL DEFAULT 'legacyUnresolved',
  ADD COLUMN "merchantProfileId" TEXT;

-- CreateIndex
CREATE INDEX "VionaRequest_scopeKind_idx" ON "VionaRequest"("scopeKind");

-- CreateIndex
CREATE INDEX "VionaRequest_merchantProfileId_idx" ON "VionaRequest"("merchantProfileId");

-- AddForeignKey
ALTER TABLE "VionaRequest" ADD CONSTRAINT "VionaRequest_merchantProfileId_fkey" FOREIGN KEY ("merchantProfileId") REFERENCES "MerchantProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
