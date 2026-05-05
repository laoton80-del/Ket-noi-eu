-- CreateTable
CREATE TABLE "AuthRefreshSession" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastUsedAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "replacedBySessionId" TEXT,

    CONSTRAINT "AuthRefreshSession_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AuthRefreshSession_tokenHash_key" ON "AuthRefreshSession"("tokenHash");

-- CreateIndex
CREATE UNIQUE INDEX "AuthRefreshSession_replacedBySessionId_key" ON "AuthRefreshSession"("replacedBySessionId");

-- CreateIndex
CREATE INDEX "AuthRefreshSession_userId_expiresAt_idx" ON "AuthRefreshSession"("userId", "expiresAt");

-- CreateIndex
CREATE INDEX "AuthRefreshSession_userId_revokedAt_idx" ON "AuthRefreshSession"("userId", "revokedAt");

-- AddForeignKey
ALTER TABLE "AuthRefreshSession" ADD CONSTRAINT "AuthRefreshSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuthRefreshSession" ADD CONSTRAINT "AuthRefreshSession_replacedBySessionId_fkey" FOREIGN KEY ("replacedBySessionId") REFERENCES "AuthRefreshSession"("id") ON DELETE SET NULL ON UPDATE CASCADE;
