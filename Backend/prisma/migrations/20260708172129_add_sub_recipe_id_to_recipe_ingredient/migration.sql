/*
  Warnings:

  - A unique constraint covering the columns `[recipe_id,sub_recipe_id]` on the table `recipe_ingredients` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `conversion_factor` to the `recipes` table without a default value. This is not possible if the table is not empty.
  - Added the required column `storage_unit` to the `recipes` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "recipe_ingredients" DROP CONSTRAINT "recipe_ingredients_ingredient_id_fkey";

-- AlterTable
ALTER TABLE "recipe_ingredients" ADD COLUMN     "sub_recipe_id" UUID,
ALTER COLUMN "ingredient_id" DROP NOT NULL;

-- AlterTable
ALTER TABLE "recipes" ADD COLUMN     "conversion_factor" DECIMAL(12,4) NOT NULL,
ADD COLUMN     "storage_unit" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "recipe_ingredients_recipe_id_sub_recipe_id_key" ON "recipe_ingredients"("recipe_id", "sub_recipe_id");

-- AddForeignKey
ALTER TABLE "recipe_ingredients" ADD CONSTRAINT "recipe_ingredients_ingredient_id_fkey" FOREIGN KEY ("ingredient_id") REFERENCES "ingredients"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recipe_ingredients" ADD CONSTRAINT "recipe_ingredients_sub_recipe_id_fkey" FOREIGN KEY ("sub_recipe_id") REFERENCES "recipes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Enforce "exactly one of ingredient_id / sub_recipe_id is set" at the DB level.
ALTER TABLE "recipe_ingredients"
  ADD CONSTRAINT "recipe_ingredient_xor_check"
  CHECK (
    (ingredient_id IS NOT NULL AND sub_recipe_id IS NULL)
    OR
    (ingredient_id IS NULL AND sub_recipe_id IS NOT NULL)
  );
