-- CreateEnum
CREATE TYPE "VionaRequestSourceLinkStatus" AS ENUM ('PENDING', 'ACTIVE', 'BROKEN', 'SUPERSEDED');

-- CreateTable
CREATE TABLE "VionaRequest" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "requesterUserId" TEXT,
    "ownerUserId" TEXT,
    "sourceUniverse" TEXT NOT NULL,
    "sourceFeature" TEXT,
    "requestType" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL DEFAULT '',
    "locale" TEXT,
    "countryCode" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "closedAt" TIMESTAMP(3),
    "metadataJson" JSONB,

    CONSTRAINT "VionaRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VionaRequestParticipant" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "userRef" TEXT,
    "participantRoleLabel" TEXT,
    "displayName" TEXT,
    "contactEmail" TEXT,
    "contactPhone" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VionaRequestParticipant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VionaRequestSourceLink" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "sourceSystem" TEXT NOT NULL,
    "sourceEntityType" TEXT NOT NULL,
    "sourceEntityId" TEXT NOT NULL,
    "linkStatus" "VionaRequestSourceLinkStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VionaRequestSourceLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VionaRequestStatusEvent" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "fromStatus" TEXT,
    "toStatus" TEXT NOT NULL,
    "changedByUserId" TEXT,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VionaRequestStatusEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VionaRequestAuditEvent" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "actorUserId" TEXT,
    "actorRoleLabel" TEXT,
    "message" TEXT,
    "payloadJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VionaRequestAuditEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VionaRequestAttachmentReference" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "storageKey" TEXT,
    "externalRef" TEXT,
    "filename" TEXT,
    "mimeType" TEXT,
    "sizeBytes" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VionaRequestAttachmentReference_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "VionaRequest_tenantId_idx" ON "VionaRequest"("tenantId");

-- CreateIndex
CREATE INDEX "VionaRequest_status_idx" ON "VionaRequest"("status");

-- CreateIndex
CREATE INDEX "VionaRequest_sourceUniverse_idx" ON "VionaRequest"("sourceUniverse");

-- CreateIndex
CREATE INDEX "VionaRequest_createdAt_idx" ON "VionaRequest"("createdAt");

-- CreateIndex
CREATE INDEX "VionaRequestParticipant_requestId_idx" ON "VionaRequestParticipant"("requestId");

-- CreateIndex
CREATE INDEX "VionaRequestSourceLink_requestId_idx" ON "VionaRequestSourceLink"("requestId");

-- CreateIndex
CREATE INDEX "VionaRequestSourceLink_sourceSystem_sourceEntityType_source_idx" ON "VionaRequestSourceLink"("sourceSystem", "sourceEntityType", "sourceEntityId");

-- CreateIndex
CREATE INDEX "VionaRequestStatusEvent_requestId_idx" ON "VionaRequestStatusEvent"("requestId");

-- CreateIndex
CREATE INDEX "VionaRequestStatusEvent_createdAt_idx" ON "VionaRequestStatusEvent"("createdAt");

-- CreateIndex
CREATE INDEX "VionaRequestAuditEvent_requestId_idx" ON "VionaRequestAuditEvent"("requestId");

-- CreateIndex
CREATE INDEX "VionaRequestAuditEvent_createdAt_idx" ON "VionaRequestAuditEvent"("createdAt");

-- CreateIndex
CREATE INDEX "VionaRequestAttachmentReference_requestId_idx" ON "VionaRequestAttachmentReference"("requestId");

-- AddForeignKey
ALTER TABLE "VionaRequestParticipant" ADD CONSTRAINT "VionaRequestParticipant_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "VionaRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VionaRequestSourceLink" ADD CONSTRAINT "VionaRequestSourceLink_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "VionaRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VionaRequestStatusEvent" ADD CONSTRAINT "VionaRequestStatusEvent_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "VionaRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VionaRequestAuditEvent" ADD CONSTRAINT "VionaRequestAuditEvent_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "VionaRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VionaRequestAttachmentReference" ADD CONSTRAINT "VionaRequestAttachmentReference_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "VionaRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;
