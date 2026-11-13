-- P0-A1 V7: immutable reserve-time price and provider timeout snapshots.
-- Existing operations are intentionally not backfilled. Refuse partial application
-- rather than inventing a default price or timeout for historical operations.
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM "AiCostOperation" LIMIT 1) THEN
        RAISE EXCEPTION 'AiCostOperation must be empty before applying snapshot columns; no backfill is defined';
    END IF;
END
$$;

ALTER TABLE "AiCostOperation"
    ADD COLUMN "inputMicrousdPerMillionTokens" BIGINT NOT NULL,
    ADD COLUMN "outputMicrousdPerMillionTokens" BIGINT NOT NULL,
    ADD COLUMN "providerTimeoutMs" BIGINT NOT NULL,
    ADD CONSTRAINT "AiCostOperation_inputMicrousdPerMillionTokens_positive"
        CHECK ("inputMicrousdPerMillionTokens" > 0),
    ADD CONSTRAINT "AiCostOperation_outputMicrousdPerMillionTokens_positive"
        CHECK ("outputMicrousdPerMillionTokens" > 0),
    ADD CONSTRAINT "AiCostOperation_providerTimeoutMs_valid"
        CHECK ("providerTimeoutMs" > 0 AND "providerTimeoutMs" <= 2147483647);
