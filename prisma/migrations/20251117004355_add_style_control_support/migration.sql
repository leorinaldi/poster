-- AlterTable
ALTER TABLE "character_consistent_image_requests" ADD COLUMN     "preset_style" VARCHAR(50);

-- AlterTable
ALTER TABLE "leonardo_models" ADD COLUMN     "style_control" VARCHAR(50) NOT NULL DEFAULT 'presetStyle';

-- CreateTable
CREATE TABLE "leonardo_style_controls" (
    "id" SERIAL NOT NULL,
    "style_control_param" VARCHAR(50) NOT NULL,
    "style_option" VARCHAR(50) NOT NULL,
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "leonardo_style_controls_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "leonardo_style_controls_style_control_param_style_option_key" ON "leonardo_style_controls"("style_control_param", "style_option");
