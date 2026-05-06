-- CreateTable
CREATE TABLE "EmailOtpSendLog" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmailOtpSendLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "EmailOtpSendLog_email_createdAt_idx" ON "EmailOtpSendLog"("email", "createdAt");
