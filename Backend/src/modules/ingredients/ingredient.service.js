const prisma = require("../../config/prisma");
const { buildIngredientsWorkbook, parseIngredientsWorkbook } = require("./ingredient.excel");
const { ingredientRowSchema } = require("./ingredient.validation");


async function getAllIngredients(organizationId, { q, limit } = {}) {
  const organiztion = { organizationId };
  if (q && typeof q === "string" && q.trim()) {
    const term = q.trim();
    organiztion.OR = [
      { nameEn: { contains: term, mode: "insensitive" } },
      { nameAr: { contains: term, mode: "insensitive" } },
      { sku: { contains: term, mode: "insensitive" } },
    ];
  }
  return await prisma.ingredient.findMany({
    where: organiztion,
    ...(limit ? { take: limit } : {}),
    orderBy: [{ nameEn: "asc" }],
  });
}

async function getIngredientById(id, organizationId) {
  return await prisma.ingredient.findFirst({
    where: { id, organizationId },
  });
}

async function createIngredient(data, organizationId) {
  return await prisma.ingredient.create({
    data: {
      ...data,
      organizationId,
    },
  });
}

//update an existing ingredient by ID
async function updateIngredient(id, data, organizationId) {
  try {
    return await prisma.ingredient.update({
      where: { id, organizationId },
      data,
    });
  } catch (error) {
    if (error.code === "P2025") {
      throw new Error("Ingredient not found or access denied");
    }
    throw error;
  }
}

// delete an ingredient by ID with error handling for not found or access denied cases
async function deleteIngredient(id, organizationId) {
  try {
    return await prisma.ingredient.delete({
      where: { id, organizationId },
    });
  } catch (error) {
    if (error.code === "P2025") {
      throw new Error("Ingredient not found or access denied");
    }
    throw error;
  }
}

// ---------- Excel export ----------

// Stream the full ingredient list for the org as an .xlsx buffer. Reuses
// the existing tenant-scoped getAllIngredients; no extra DB hit needed.
async function exportIngredientsAsXlsx(organizationId) {
  const rows = await getAllIngredients(organizationId);
  const wb = await buildIngredientsWorkbook(rows);
  return await wb.xlsx.writeBuffer();
}

// ---------- Excel import ----------

// Parse the uploaded workbook, validate every row, and commit valid rows
// sequentially. Returns { created, updated, errors }. On wholesale errors
// (missing headers, duplicate SKUs within the file) the controller maps to
// 400 — we surface them as thrown Errors here.
async function importIngredientsFromXlsx(organizationId, buffer) {
  const parsed = await parseIngredientsWorkbook(buffer);

  if (parsed.empty) {
    return { created: 0, updated: 0, errors: [] };
  }
  if (!parsed.headerOk) {
    const err = new Error("Missing required columns in file");
    err.status = 400;
    err.missingColumns = parsed.missingColumns;
    throw err;
  }

  // Pre-pass: reject the whole file if any SKU appears twice. Last-wins is
  // dangerous because Excel row order is user-controlled.
  const seenSkus = new Set();
  for (const r of parsed.rows) {
    const sku = String(r.data.sku ?? "").trim();
    if (!sku) continue; // row-level error will catch it
    if (seenSkus.has(sku)) {
      const err = new Error(`Duplicate SKU in file: ${sku}`);
      err.status = 400;
      err.duplicateSku = sku;
      throw err;
    }
    seenSkus.add(sku);
  }

  let created = 0;
  let updated = 0;
  const errors = [];

  // Sequential so the partial-success contract is easy to reason about and
  // so we don't saturate the connection pool with concurrent writes.
  for (const r of parsed.rows) {
    const validation = ingredientRowSchema.safeParse(r.data);
    if (!validation.success) {
      const message = validation.error.issues
        .map((i) => `${i.path.join(".") || "row"}: ${i.message}`)
        .join("; ");
      errors.push({ row: r.rowNumber, message });
      continue;
    }

    const data = validation.data;
    try {
      const existing = await prisma.ingredient.findUnique({
        where: {
          organizationId_sku: {
            organizationId,
            sku: data.sku,
          },
        },
        select: { id: true },
      });
      if (existing) {
        await updateIngredient(existing.id, data, organizationId);
        updated++;
      } else {
        await createIngredient(data, organizationId);
        created++;
      }
    } catch (e) {
      if (e.code === "P2002") {
        errors.push({ row: r.rowNumber, message: `Duplicate SKU: ${data.sku}` });
      } else {
        errors.push({ row: r.rowNumber, message: e.message || "Unknown error" });
      }
    }
  }

  return { created, updated, errors };
}

module.exports = {
  getAllIngredients,
  getIngredientById,
  createIngredient,
  updateIngredient,
  deleteIngredient,
  exportIngredientsAsXlsx,
  importIngredientsFromXlsx,
};
