-- CreateTable
CREATE TABLE "image_generation_requests" (
    "id" SERIAL NOT NULL,
    "project_id" INTEGER NOT NULL,
    "user_id" TEXT NOT NULL,
    "name" VARCHAR(50),
    "prompt" TEXT NOT NULL,
    "number_of_images" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "image_generation_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "generated_images" (
    "id" SERIAL NOT NULL,
    "image_generation_request_id" INTEGER NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "generated_images_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "image_generation_requests" ADD CONSTRAINT "image_generation_requests_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "image_generation_requests" ADD CONSTRAINT "image_generation_requests_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "generated_images" ADD CONSTRAINT "generated_images_image_generation_request_id_fkey" FOREIGN KEY ("image_generation_request_id") REFERENCES "image_generation_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;
