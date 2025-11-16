-- CreateTable
CREATE TABLE "character_consistent_image_requests" (
    "id" SERIAL NOT NULL,
    "project_id" INTEGER NOT NULL,
    "user_id" TEXT NOT NULL,
    "name" VARCHAR(50),
    "prompt" TEXT NOT NULL,
    "reference_image_url" TEXT NOT NULL,
    "leonardo_image_id" TEXT NOT NULL,
    "strength_type" VARCHAR(10) NOT NULL,
    "model_id" TEXT,
    "width" INTEGER NOT NULL,
    "height" INTEGER NOT NULL,
    "photo_real" BOOLEAN NOT NULL DEFAULT true,
    "alchemy" BOOLEAN NOT NULL DEFAULT true,
    "number_of_images" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "character_consistent_image_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "character_consistent_generated_images" (
    "id" SERIAL NOT NULL,
    "character_consistent_image_request_id" INTEGER NOT NULL,
    "image_url" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "character_consistent_generated_images_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "character_consistent_image_requests" ADD CONSTRAINT "character_consistent_image_requests_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "character_consistent_image_requests" ADD CONSTRAINT "character_consistent_image_requests_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "character_consistent_generated_images" ADD CONSTRAINT "character_consistent_generated_images_character_consistent_fkey" FOREIGN KEY ("character_consistent_image_request_id") REFERENCES "character_consistent_image_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;
