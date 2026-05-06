-- Broker Empire: hierarchy, QR settlement metadata, activation + escrow ledger.
CREATE TYPE "BrokerEscrowStatus" AS ENUM ('PENDING_CLEARANCE', 'RELEASED', 'CANCELLED_CHARGEBACK', 'CANCELLED_FRAUD_WASH', 'CANCELLED_OTHER');
CREATE TYPE "BrokerEscrowKind" AS ENUM ('PAYG_AI_NET_SHARE', 'B2B_POWER_SUBSCRIPTION', 'ACTIVATION_BOUNTY', 'LEADERSHIP_BONUS');

ALTER TABLE "User" ADD COLUMN "masterBrokerId" TEXT;
ALTER TABLE "User" ADD CONSTRAINT "User_masterBrokerId_fkey" FOREIGN KEY ("masterBrokerId") REFERENCES "User"("id") ON DELETE SET ON UPDATE CASCADE;

CREATE TABLE "MerchantBrokerActivation" (
    "businessId" TEXT NOT NULL,
    "activationBountyEscrowId" TEXT,
    "bountyAwarded" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "MerchantBrokerActivation_pkey" PRIMARY KEY ("businessId")
);

CREATE UNIQUE INDEX "MerchantBrokerActivation_activationBountyEscrowId_key" ON "MerchantBrokerActivation"("activationBountyEscrowId");

ALTER TABLE "MerchantBrokerActivation" ADD CONSTRAINT "MerchantBrokerActivation_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "BrokerCommissionEscrow" (
    "id" TEXT NOT NULL,
    "beneficiaryUserId" TEXT NOT NULL,
    "amountVIG" DOUBLE PRECISION NOT NULL,
    "kind" "BrokerEscrowKind" NOT NULL,
    "status" "BrokerEscrowStatus" NOT NULL DEFAULT 'PENDING_CLEARANCE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "clearAt" TIMESTAMP(3) NOT NULL,
    "releasedAt" TIMESTAMP(3),
    "idempotencyKey" TEXT NOT NULL,
    "stripePaymentIntentId" TEXT,
    "paymentMethodFingerprint" TEXT,
    "underlyingKngNetVig" DOUBLE PRECISION,
    "merchantBusinessId" TEXT,
    "sourceBookingId" TEXT,
    "pendingTransactionId" TEXT,
    CONSTRAINT "BrokerCommissionEscrow_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "BrokerCommissionEscrow_idempotencyKey_key" ON "BrokerCommissionEscrow"("idempotencyKey");
CREATE UNIQUE INDEX "BrokerCommissionEscrow_pendingTransactionId_key" ON "BrokerCommissionEscrow"("pendingTransactionId");
CREATE INDEX "BrokerCommissionEscrow_status_clearAt_idx" ON "BrokerCommissionEscrow"("status", "clearAt");
CREATE INDEX "BrokerCommissionEscrow_beneficiaryUserId_status_idx" ON "BrokerCommissionEscrow"("beneficiaryUserId", "status");

ALTER TABLE "BrokerCommissionEscrow" ADD CONSTRAINT "BrokerCommissionEscrow_beneficiaryUserId_fkey" FOREIGN KEY ("beneficiaryUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Booking" ADD COLUMN "refundedAt" TIMESTAMP(3);
ALTER TABLE "Booking" ADD COLUMN "stripePaymentIntentId" TEXT;
ALTER TABLE "Booking" ADD COLUMN "paymentMethodFingerprint" TEXT;
ALTER TABLE "Booking" ADD COLUMN "completedAt" TIMESTAMP(3);
