-- AlterTable
-- Provider token pricing is stored as integer micro-USD per one million tokens.
ALTER TABLE "AiModelPrice"
    RENAME COLUMN "inputMicrousdPerToken" TO "inputMicrousdPerMillionTokens";

ALTER TABLE "AiModelPrice"
    RENAME COLUMN "outputMicrousdPerToken" TO "outputMicrousdPerMillionTokens";

ALTER TABLE "AiModelPrice"
    RENAME CONSTRAINT "AiModelPrice_inputMicrousdPerToken_nonnegative"
        TO "AiModelPrice_inputMicrousdPerMillionTokens_nonnegative";

ALTER TABLE "AiModelPrice"
    RENAME CONSTRAINT "AiModelPrice_outputMicrousdPerToken_nonnegative"
        TO "AiModelPrice_outputMicrousdPerMillionTokens_nonnegative";
