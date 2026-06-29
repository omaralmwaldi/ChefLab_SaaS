import client from "./client";

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
