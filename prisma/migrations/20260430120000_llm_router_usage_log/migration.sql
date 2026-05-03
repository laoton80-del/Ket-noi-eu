-- CreateEnum
CREATE TYPE "LlmRouterTaskType" AS ENUM ('SIMPLE_TRANSLATION', 'ROUTING_INQUIRY', 'COMPLEX_MARKETING', 'DEEP_CONTEXT');

-- CreateTable
CREATE TABLE "LlmApiUsageLog" (
    "id" TEXT NOT NULL,
    "taskType" "LlmRouterTaskType" NOT NULL,
    "model" TEXT NOT NULL,
    "promptTokens" INTEGER,
    "completionTokens" INTEGER,
    "totalTokens" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT,

    CONSTRAINT "LlmApiUsageLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LlmApiUsageLog_createdAt_idx" ON "LlmApiUsageLog"("createdAt");

-- CreateIndex
CREATE INDEX "LlmApiUsageLog_taskType_createdAt_idx" ON "LlmApiUsageLog"("taskType", "createdAt");

-- CreateIndex
CREATE INDEX "LlmApiUsageLog_model_createdAt_idx" ON "LlmApiUsageLog"("model", "createdAt");

-- AddForeignKey
ALTER TABLE "LlmApiUsageLog" ADD CONSTRAINT "LlmApiUsageLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
