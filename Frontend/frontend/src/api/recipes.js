import client from "./client";

// Multi-value dimensions travel as a single comma-separated string; the
// backend controller splits them back into an array (see recipe.controller.js).
function toParam(value) {
  return Array.isArray(value) ? value.join(",") : value;
}

export async function listRecipes({
  q,
  sku,
  categoryId,
  status,
  createdBy,
  shelfLifePlace,
  limit,
  signal,
} = {}) {
  const params = {};
  if (q) params.q = q;
  if (sku) params.sku = sku;
  if (categoryId?.length) params.categoryId = toParam(categoryId);
  if (status) params.status = status;
  if (createdBy) params.createdBy = createdBy;
  if (shelfLifePlace?.length) params.shelfLifePlace = toParam(shelfLifePlace);
  if (limit) params.limit = limit;
  const res = await client.get("/recipes", { params, signal });
  return res.data;
}
