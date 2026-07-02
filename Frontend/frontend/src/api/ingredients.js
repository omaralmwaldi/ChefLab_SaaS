import client from "./client";

// List ingredients for the current org. Pass `q` for a free-text search
// matched (case-insensitively) against nameEn, nameAr, and sku; pass
// `limit` to cap the response. `signal` lets callers cancel an in-flight
// request — pass an AbortController.signal to debounced search inputs.
// When `paginated` is true, also pass `page` (1-based) and `pageSize`.
export async function listIngredients({ q, limit, page, pageSize, paginated, signal } = {}) {
  const params = {};
  if (q) params.q = q;
  if (limit) params.limit = limit;
  if (paginated) {
    params.paginated = 1;
    params.page = page || 1;
    params.pageSize = pageSize || 50;
  }
  const res = await client.get("/ingredients", { params, signal });
  return res.data;
}

// Get all ingredients for the org as an .xlsx blob. Caller is responsible
// for triggering the browser download (URL.createObjectURL + anchor click).
export async function exportIngredients() {
  const res = await client.get("/ingredients/export", {
    responseType: "blob",
  });
  return res.data;
}

// Upload an .xlsx and import rows. Returns { created, updated, errors[] }.
// The field name 'file' must match multer's upload.single('file') on the
// backend route.
export async function importIngredients(file) {
  const form = new FormData();
  form.append("file", file);
  const res = await client.post("/ingredients/import", form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
}
