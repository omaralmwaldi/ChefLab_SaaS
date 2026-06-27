/*
  Warnings:

  - Added the required column `shelfLifePlace` to the `recipes` table without a default value. This is not possible if the table is not empty.
  - Added the required column `shelfLifeUnit` to the `recipes` table without a default value. This is not possible if the table is not empty.
  - Added the required column `shelf_life_value` to the `recipes` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "ShelfLifeUnit" AS ENUM ('HOUR', 'DAY', 'WEEK', 'MONTH');

-- CreateEnum
CREATE TYPE "ShelfLifePlace" AS ENUM ('ROOM_TEMPERATURE', 'CHILLER', 'FREEZER');

-- AlterTable
ALTER TABLE "recipes" ADD COLUMN     "shelfLifePlace" "ShelfLifePlace",
ADD COLUMN     "shelfLifeUnit" "ShelfLifeUnit",
ADD COLUMN     "shelf_life_value" INTEGER;

-- Backfill existing rows with safe defaults before enforcing NOT NULL.
UPDATE "recipes"
   SET "shelf_life_value" = 1,
       "shelfLifeUnit"    = 'DAY',
       "shelfLifePlace"   = 'ROOM_TEMPERATURE';

-- Enforce NOT NULL after backfill.
ALTER TABLE "recipes"
  ALTER COLUMN "shelf_life_value" SET NOT NULL,
  ALTER COLUMN "shelfLifeUnit"    SET NOT NULL,
  ALTER COLUMN "shelfLifePlace"   SET NOT NULL;
