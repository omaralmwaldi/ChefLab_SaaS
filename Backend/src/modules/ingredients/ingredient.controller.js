const ingredientService = require("./ingredient.service");
const { ingredientSchema } = require("./ingredient.validation");
const { hasPermission } = require("../../utils/permission");
const { serializeIngredientCost } = require("../../utils/costVisibility");
const PERMISSIONS = require("../../constants/permissions");

async function listAll(req, res) {
  try {
    const q = typeof req.query.q === "string" ? req.query.q.trim() || undefined : undefined;
    const canViewCost = await hasPermission(req, PERMISSIONS.COSTS_VIEW);

    if (req.query.paginated === "1") {
      const pageRaw = parseInt(req.query.page, 10);
      const page = Number.isFinite(pageRaw) && pageRaw >= 1 ? pageRaw : 1;
      const pageSizeRaw = parseInt(req.query.pageSize, 10);
      const pageSize = Number.isFinite(pageSizeRaw) && pageSizeRaw > 0 ? pageSizeRaw : 50;

      const result = await ingredientService.getAllIngredients(
        req.user.organizationId,
        { q, paginated: true, page, pageSize },
      );
      return res.json({
        ...result,
        data: serializeIngredientCost(result.data, canViewCost),
      });
    }

    const limitRaw = parseInt(req.query.limit, 10);
    const limit =
      Number.isFinite(limitRaw) && limitRaw > 0 && limitRaw <= 50
        ? limitRaw
        : undefined;
    const ingredients = await ingredientService.getAllIngredients(
      req.user.organizationId,
      { q, limit },
    );
    res.json(serializeIngredientCost(ingredients, canViewCost));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

// return a single ingredient by ID:
async function getById(req, res) {
  try {
    const canViewCost = await hasPermission(req, PERMISSIONS.COSTS_VIEW);
    const ingredient = await ingredientService.getIngredientById(req.params.id, req.user.organizationId);
    if (!ingredient) return res.status(404).json({ message: "Ingredient not found" });
    res.json(serializeIngredientCost(ingredient, canViewCost));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

// create a new ingredient with data sechema validation using zod:
async function create(req, res) {
  try {
    const validatedData = ingredientSchema.parse(req.body);
    const canViewCost = await hasPermission(req, PERMISSIONS.COSTS_VIEW);
    const ingredient = await ingredientService.createIngredient(validatedData, req.user.organizationId);
    res.status(201).json(serializeIngredientCost(ingredient, canViewCost));
  } catch (error) {
    if (error.name === "ZodError") {
      return res.status(400).json({ errors: error.errors });
    }
    if (error.message === "SKU already exists") {
      return res.status(409).json({ message: error.message });
    }
    res.status(500).json({ message: error.message });
  }
}
// update an existing ingredient by ID with data sechema validation using zod:
async function update(req, res) {
  try {
    const validatedData = ingredientSchema.partial().parse(req.body);
    const canViewCost = await hasPermission(req, PERMISSIONS.COSTS_VIEW);
    // Cost write-guard: a cost-blind caller can't see costPerStorageUnit, so
    // drop it from the partial update — the stored value is left untouched.
    if (!canViewCost) {
      delete validatedData.costPerStorageUnit;
    }
    const ingredient = await ingredientService.updateIngredient(req.params.id, validatedData, req.user.organizationId);
    res.json(serializeIngredientCost(ingredient, canViewCost));
  } catch (error) {
    if (error.name === "ZodError") {
      return res.status(400).json({ errors: error.errors });
    }
    if (error.message === "Ingredient not found or access denied") {
      return res.status(404).json({ message: error.message });
    }
    if (error.message === "SKU already exists") {
      return res.status(409).json({ message: error.message });
    }
    res.status(500).json({ message: error.message });
  }
}

async function remove(req, res) {
  try {
    await ingredientService.deleteIngredient(req.params.id, req.user.organizationId);
    res.status(204).send();
  } catch (error) {
    if (error.message === "Ingredient not found or access denied") {
      return res.status(404).json({ message: error.message });
    }
    res.status(500).json({ message: error.message });
  }
}

// Stream the org's ingredient list as an .xlsx download. Set
// Content-Disposition with a timestamped filename so concurrent downloads
// don't collide in the user's downloads folder.
async function exportIngredients(req, res) {
  try {
    const buffer = await ingredientService.exportIngredientsAsXlsx(
      req.user.organizationId,
    );
    const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="ingredients-${stamp}.xlsx"`,
    );
    res.send(buffer);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

// Parse the uploaded .xlsx, upsert each row by SKU, and return per-row
// results. Wholesale errors (missing headers, in-file duplicate SKUs) map
// to 400 from inside the catch — the service decorates them with .status.
// Zod row failures are kept inside result.errors so good rows still commit.
async function importIngredients(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }
    const result = await ingredientService.importIngredientsFromXlsx(
      req.user.organizationId,
      req.file.buffer,
    );
    res.json(result);
  } catch (error) {
    if (error.status === 400) {
      return res.status(400).json({
        message: error.message,
        ...(error.missingColumns && { missingColumns: error.missingColumns }),
        ...(error.duplicateSku && { duplicateSku: error.duplicateSku }),
      });
    }
    res.status(500).json({ message: error.message });
  }
}

async function getNextSku(req, res) {
  try {
    const sku = await ingredientService.getNextSku(req.user.organizationId);
    res.json({ sku });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

module.exports = {
  list: listAll,
  get: getById,
  create,
  update,
  remove,
  exportIngredients,
  importIngredients,
  getNextSku,
};
