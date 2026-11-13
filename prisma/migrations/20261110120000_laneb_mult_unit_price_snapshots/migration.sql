DO $$
BEGIN
    IF EXISTS (
        SELECT 1
          FROM "AiCostOperation"
         WHERE "reservedMicrousd" <= 0
            OR "inputMicrousdPerMillionTokens" < 0
            OR "outputMicrousdPerMillionTokens" < 0
    ) THEN
        RAISE EXCEPTION 'AiCostOperation contains rows incompatible with LaneB cost-model checks; refusing migration';
    END IF;
END $$;

ALTER TABLE "AiCostOperation"
    ADD COLUMN "audioInputMicrousdPerSecond" BIGINT,
    ADD COLUMN "audioOutputMicrousdPerSecond" BIGINT,
    ADD COLUMN "imageMicrousdPerUnit" BIGINT,
    DROP CONSTRAINT "AiCostOperation_inputMicrousdPerMillionTokens_positive",
    DROP CONSTRAINT "AiCostOperation_outputMicrousdPerMillionTokens_positive",
    ADD CONSTRAINT "AiCostOperation_inputMicrousdPerMillionTokens_nonnegative"
        CHECK ("inputMicrousdPerMillionTokens" >= 0),
    ADD CONSTRAINT "AiCostOperation_outputMicrousdPerMillionTokens_nonnegative"
        CHECK ("outputMicrousdPerMillionTokens" >= 0),
    ADD CONSTRAINT "AiCostOperation_reservedMicrousd_positive"
        CHECK ("reservedMicrousd" > 0);
