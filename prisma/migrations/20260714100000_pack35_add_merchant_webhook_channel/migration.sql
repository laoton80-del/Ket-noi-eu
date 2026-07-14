-- Pack35 — B2B Omni-Channel Webhook & Agent Routing: additive VionaMerchantWebhookChannel model.
-- See docs/product/VIONA_PACK35_B2B_WEBHOOK_ROUTING_PLAN.md §4.3. Additive only — no existing
-- table, column, index, or constraint is altered or dropped by this migration. No Prisma
-- relation/foreign key to MerchantProfile is added (id-only reference, mirroring the existing
-- VionaRequestEscrowHold.holdTransactionId "id only" pattern) — zero modification to
-- MerchantProfile's own table.

-- CreateTable
CREATE TABLE "VionaMerchantWebhookChannel" (
    "id" TEXT NOT NULL,
    "merchantProfileId" TEXT NOT NULL,
    "channelType" TEXT NOT NULL,
    "channelExternalId" TEXT NOT NULL,
    "signingSecretHash" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "standingApprovalForReadOnlyToolsOnly" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VionaMerchantWebhookChannel_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "VionaMerchantWebhookChannel_channelType_channelExternalId_key" ON "VionaMerchantWebhookChannel"("channelType", "channelExternalId");

-- CreateIndex
CREATE INDEX "VionaMerchantWebhookChannel_merchantProfileId_idx" ON "VionaMerchantWebhookChannel"("merchantProfileId");
