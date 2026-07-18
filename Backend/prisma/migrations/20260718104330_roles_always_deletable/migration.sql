-- DropForeignKey
ALTER TABLE "recipe_step_roles" DROP CONSTRAINT "recipe_step_roles_role_id_fkey";

-- AddForeignKey
ALTER TABLE "recipe_step_roles" ADD CONSTRAINT "recipe_step_roles_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
