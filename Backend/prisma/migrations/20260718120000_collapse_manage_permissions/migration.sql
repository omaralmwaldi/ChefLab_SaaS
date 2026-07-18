-- Data migration: collapse the per-action create/edit/delete keys into a single
-- `.manage` key for the ingredients, categories, users and roles modules. The
-- `.view` keys and every recipe/cost/dashboard key are preserved verbatim, so no
-- role gains or loses effective access. Result is de-duplicated and ordered.
-- Guarded by jsonb_typeof so it is safe to re-run and only touches array-form
-- permission columns (the shape produced by the RBAC foundation migration).
UPDATE "roles" r
SET "permissions" = COALESCE(
  (
    SELECT jsonb_agg(DISTINCT mapped ORDER BY mapped)
    FROM (
      SELECT
        CASE
          WHEN elem IN ('ingredients.create', 'ingredients.edit', 'ingredients.delete') THEN 'ingredients.manage'
          WHEN elem IN ('categories.create', 'categories.edit', 'categories.delete') THEN 'categories.manage'
          WHEN elem IN ('users.create', 'users.edit', 'users.delete') THEN 'users.manage'
          WHEN elem IN ('roles.create', 'roles.edit', 'roles.delete') THEN 'roles.manage'
          ELSE elem
        END AS mapped
      FROM jsonb_array_elements_text(r."permissions") AS elem
    ) t
  ),
  '[]'::jsonb
)
WHERE jsonb_typeof(r."permissions") = 'array';
