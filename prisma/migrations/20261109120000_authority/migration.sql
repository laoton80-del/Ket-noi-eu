CREATE TABLE "AuthorityRecord" (
  "authorityId" UUID NOT NULL,
  "subjectId" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "policyVersion" TEXT NOT NULL,
  "prepareSha256" VARCHAR(64) NOT NULL,
  "actionKind" TEXT NOT NULL,
  "exactTarget" TEXT NOT NULL,
  "maxAttempts" INTEGER NOT NULL DEFAULT 1,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "currency" VARCHAR(3) NOT NULL,
  "maxCostMinor" BIGINT NOT NULL,
  "allowedDisclosures" JSONB NOT NULL,
  "constraints" JSONB NOT NULL,
  "state" TEXT NOT NULL DEFAULT 'ACTIVE_UNUSED',
  "issuedBy" TEXT NOT NULL,
  "approvalRef" TEXT NOT NULL,
  "contextBinding" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT (now() AT TIME ZONE 'UTC'),
  "consumedAt" TIMESTAMP(3),
  CONSTRAINT "AuthorityRecord_pkey" PRIMARY KEY ("authorityId"),
  CONSTRAINT "AuthorityRecord_prepareSha256_format" CHECK ("prepareSha256" ~ '^[0-9A-F]{64}$'),
  CONSTRAINT "AuthorityRecord_actionKind_pilot" CHECK ("actionKind" = 'VOICE_CALL_BOOKING'),
  CONSTRAINT "AuthorityRecord_maxAttempts_single" CHECK ("maxAttempts" = 1),
  CONSTRAINT "AuthorityRecord_maxCostMinor_nonnegative" CHECK ("maxCostMinor" >= 0),
  CONSTRAINT "AuthorityRecord_currency_format" CHECK ("currency" ~ '^[A-Z]{3}$'),
  CONSTRAINT "AuthorityRecord_state_valid" CHECK ("state" IN ('ACTIVE_UNUSED', 'CONSUMED')),
  CONSTRAINT "AuthorityRecord_consumedAt_consistent" CHECK (
    ("state" = 'ACTIVE_UNUSED' AND "consumedAt" IS NULL) OR
    ("state" = 'CONSUMED' AND "consumedAt" IS NOT NULL)
  )
);

CREATE INDEX "AuthorityRecord_subjectId_tenantId_idx"
  ON "AuthorityRecord" ("subjectId", "tenantId");
CREATE INDEX "AuthorityRecord_state_expiresAt_idx"
  ON "AuthorityRecord" ("state", "expiresAt");

CREATE TABLE "AuthorityLedgerEntry" (
  "id" UUID NOT NULL,
  "authorityId" UUID NOT NULL,
  "entryType" TEXT NOT NULL,
  "detail" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT (now() AT TIME ZONE 'UTC'),
  CONSTRAINT "AuthorityLedgerEntry_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "AuthorityLedgerEntry_entryType_valid" CHECK (
    "entryType" IN ('ISSUED', 'CONSUMED', 'EXPIRED', 'CONSUME_REJECTED')
  ),
  CONSTRAINT "AuthorityLedgerEntry_authorityId_fkey"
    FOREIGN KEY ("authorityId") REFERENCES "AuthorityRecord"("authorityId")
    ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX "AuthorityLedgerEntry_authorityId_createdAt_idx"
  ON "AuthorityLedgerEntry" ("authorityId", "createdAt");

CREATE FUNCTION "viona_reject_authority_ledger_mutation"() RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'AuthorityLedgerEntry is append-only';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "AuthorityLedgerEntry_append_only"
  BEFORE UPDATE OR DELETE ON "AuthorityLedgerEntry"
  FOR EACH ROW EXECUTE FUNCTION "viona_reject_authority_ledger_mutation"();

CREATE TRIGGER "AuthorityLedgerEntry_no_truncate"
  BEFORE TRUNCATE ON "AuthorityLedgerEntry"
  FOR EACH STATEMENT EXECUTE FUNCTION "viona_reject_authority_ledger_mutation"();
