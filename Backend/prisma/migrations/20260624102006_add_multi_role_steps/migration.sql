/*
  Warnings:

  - You are about to drop the column `role_id` on the `recipe_steps` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[id,organization_id]` on the table `ingredients` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[id,organization_id]` on the table `recipe_categories` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[id,organization_id]` on the table `recipes` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[id,organization_id]` on the table `roles` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[id,organization_id]` on the table `users` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "recipe_steps" DROP CONSTRAINT "recipe_steps_role_id_fkey";

-- CreateTable
CREATE TABLE "recipe_step_roles" (
    "id" UUID NOT NULL,
    "recipe_step_id" UUID NOT NULL,
    "role_id" UUID NOT NULL,

    CONSTRAINT "recipe_step_roles_pkey" PRIMARY KEY ("id")
);

-- Migrate existing role assignments into the junction table
INSERT INTO "recipe_step_roles" ("id", "recipe_step_id", "role_id")
SELECT gen_random_uuid(), "id", "role_id" FROM "recipe_steps";

-- AlterTable
ALTER TABLE "recipe_steps" DROP COLUMN "role_id";

-- CreateIndex
CREATE UNIQUE INDEX "recipe_step_roles_recipe_step_id_role_id_key" ON "recipe_step_roles"("recipe_step_id", "role_id");

-- CreateIndex
CREATE UNIQUE INDEX "ingredients_id_organization_id_key" ON "ingredients"("id", "organization_id");

-- CreateIndex
CREATE UNIQUE INDEX "recipe_categories_id_organization_id_key" ON "recipe_categories"("id", "organization_id");

-- CreateIndex
CREATE UNIQUE INDEX "recipes_id_organization_id_key" ON "recipes"("id", "organization_id");

-- CreateIndex
CREATE UNIQUE INDEX "roles_id_organization_id_key" ON "roles"("id", "organization_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_id_organization_id_key" ON "users"("id", "organization_id");

-- AddForeignKey
ALTER TABLE "recipe_step_roles" ADD CONSTRAINT "recipe_step_roles_recipe_step_id_fkey" FOREIGN KEY ("recipe_step_id") REFERENCES "recipe_steps"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recipe_step_roles" ADD CONSTRAINT "recipe_step_roles_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
