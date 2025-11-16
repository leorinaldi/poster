-- CreateTable
CREATE TABLE "leonardo_models" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "model_id" TEXT NOT NULL,
    "preprocessor_id" INTEGER NOT NULL,
    "photo_real_available" BOOLEAN NOT NULL DEFAULT true,
    "photo_real_default" BOOLEAN NOT NULL DEFAULT true,
    "photo_real_version" TEXT NOT NULL DEFAULT 'v2',
    "alchemy_available" BOOLEAN NOT NULL DEFAULT true,
    "alchemy_default" BOOLEAN NOT NULL DEFAULT true,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "leonardo_models_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "leonardo_models_name_key" ON "leonardo_models"("name");

-- CreateIndex
CREATE UNIQUE INDEX "leonardo_models_model_id_key" ON "leonardo_models"("model_id");
