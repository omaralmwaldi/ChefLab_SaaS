import client from "./client";

export async function listRecipes({ q, limit, signal } = {}) {
  const params = {};
  if (q) params.q = q;
  if (limit) params.limit = limit;
  const res = await client.get("/recipes", { params, signal });
  return res.data;
}
