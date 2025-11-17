-- AlterTable
ALTER TABLE "character_consistent_image_requests" ADD COLUMN     "contrast" DOUBLE PRECISION,
ADD COLUMN     "style_uuid" VARCHAR(255);

-- AlterTable
ALTER TABLE "leonardo_models" ADD COLUMN     "contrast_default" DOUBLE PRECISION,
ADD COLUMN     "contrast_required" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "leonardo_style_controls" ADD COLUMN     "style_uuid" VARCHAR(255);
