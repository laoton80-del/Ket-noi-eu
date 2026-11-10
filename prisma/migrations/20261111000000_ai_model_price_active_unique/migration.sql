DO $$
BEGIN
  IF EXISTS (
    SELECT 1
      FROM "AiModelPrice"
     WHERE "effectiveTo" IS NULL
     GROUP BY "provider", "model"
    HAVING count(*) > 1
  ) THEN
    RAISE EXCEPTION 'AiModelPrice has multiple active versions per provider/model; refusing unique index';
  END IF;
END $$;

CREATE UNIQUE INDEX "AiModelPrice_active_unique"
    ON "AiModelPrice" ("provider", "model")
 WHERE "effectiveTo" IS NULL;
