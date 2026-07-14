-- AlterTable
ALTER TABLE "organizations" ADD COLUMN     "owner_user_id" UUID;

-- Data migration: convert Role.permissions from a { key: true } map to a JSON
-- array of the keys whose value was true. Existing two-part keys are preserved
-- verbatim; no new keys are granted. Guarded by jsonb_typeof so it is safe to
-- re-run and never touches rows already stored as arrays.
UPDATE "roles"
SET "permissions" = COALESCE(
  (
    SELECT jsonb_agg(e.key ORDER BY e.key)
    FROM jsonb_each("permissions") AS e(key, value)
    WHERE e.value = 'true'::jsonb
  ),
  '[]'::jsonb
)
WHERE jsonb_typeof("permissions") = 'object';

-- Data migration: assign each organization's owner to the earliest-created user
-- holding an administrator-type role, falling back to the earliest-created user
-- in the organization.
UPDATE "organizations" o
SET "owner_user_id" = sub."id"
FROM (
  SELECT DISTINCT ON (u."organization_id")
    u."organization_id",
    u."id"
  FROM "users" u
  LEFT JOIN "roles" r ON r."id" = u."role_id"
  ORDER BY
    u."organization_id",
    (CASE WHEN r."name_en" ILIKE '%admin%' THEN 0 ELSE 1 END),
    u."created_at" ASC
) sub
WHERE o."id" = sub."organization_id";

-- The chosen owner holds no role and bypasses all RBAC.
UPDATE "users"
SET "role_id" = NULL
WHERE "id" IN (
  SELECT "owner_user_id" FROM "organizations" WHERE "owner_user_id" IS NOT NULL
);
