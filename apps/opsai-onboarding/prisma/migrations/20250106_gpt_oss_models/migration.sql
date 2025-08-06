-- CreateTable for GPT-OSS model metadata
CREATE TABLE IF NOT EXISTS "ai_models" (
    "id" TEXT NOT NULL,
    "model_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "size_gb" INTEGER,
    "status" TEXT DEFAULT 'not_initialized',
    "storage_path" TEXT,
    "last_used" TIMESTAMP(3),
    "performance_metrics" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ai_models_pkey" PRIMARY KEY ("id")
);

-- CreateTable for training datasets
CREATE TABLE IF NOT EXISTS "training_datasets" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "model_id" TEXT,
    "data_count" INTEGER,
    "storage_path" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "training_datasets_pkey" PRIMARY KEY ("id")
);

-- CreateTable for inference logs
CREATE TABLE IF NOT EXISTS "inference_logs" (
    "id" TEXT NOT NULL,
    "model_id" TEXT NOT NULL,
    "task_type" TEXT NOT NULL,
    "prompt_tokens" INTEGER,
    "completion_tokens" INTEGER,
    "inference_time_ms" INTEGER,
    "success" BOOLEAN NOT NULL DEFAULT true,
    "error_message" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "inference_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ai_models_model_id_key" ON "ai_models"("model_id");
CREATE INDEX "inference_logs_model_id_idx" ON "inference_logs"("model_id");
CREATE INDEX "inference_logs_created_at_idx" ON "inference_logs"("created_at");