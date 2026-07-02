-- AlterTable
ALTER TABLE "recipes" ADD COLUMN     "last_edited_at" TIMESTAMP(3),
ADD COLUMN     "last_edited_by" UUID;
