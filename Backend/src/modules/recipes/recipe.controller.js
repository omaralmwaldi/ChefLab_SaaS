const recipeService = require("./recipe.service");
const { recipeSchema } = require("./recipe.validation");
const { hasPermission } = require("../../utils/permission");
const { serializeRecipeCost } = require("../../utils/costVisibility");
const PERMISSIONS = require("../../constants/permissions");

// Step visibility context for the read path. recipes.edit already returns true
// for the owner (no role), so canViewAllSteps covers both "owner" and "edit
// holder"; everyone else is filtered down to their own role's steps.
async function resolveStepContext(req) {
  const canViewAllSteps = await hasPermission(req, PERMISSIONS.RECIPES_EDIT);
  return { canViewAllSteps, roleId: req.user.roleId ?? null };
}

// list recipes for the organization, with optional filters. Multi-value
// params (categoryId, shelfLifePlace) arrive as a single comma-separated
// string and are split here; the service normalizes them defensively.
async function list(req, res) {
  try {
    const { categoryId, shelfLifePlace, status, q, sku, createdBy, limit } =
      req.query;
    const canViewCost = await hasPermission(req, PERMISSIONS.COSTS_VIEW);
    const stepContext = await resolveStepContext(req);
    const recipes = await recipeService.getAllRecipes(
      req.user.organizationId,
      {
        categoryId,
        shelfLifePlace,
        status,
        q,
        sku,
        createdBy,
        limit: limit ? parseInt(limit, 10) : undefined,
      },
      stepContext,
    );
    res.json(serializeRecipeCost(recipes, canViewCost));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

async function getById(req, res) {
  try {
    const canViewCost = await hasPermission(req, PERMISSIONS.COSTS_VIEW);
    const stepContext = await resolveStepContext(req);
    const recipe = await recipeService.getRecipeById(
      req.params.id,
      req.user.organizationId,
      stepContext,
    );
    if (!recipe) return res.status(404).json({ message: "Recipe not found" });
    res.json(serializeRecipeCost(recipe, canViewCost));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

// create a recipe together with its ingredient lines and steps.
// createdBy is taken from the JWT — there's no client-supplied owner.
async function create(req, res) {
  try {
    const validatedData = recipeSchema.parse(req.body);
    const canViewCost = await hasPermission(req, PERMISSIONS.COSTS_VIEW);
    const recipe = await recipeService.createRecipe(
      validatedData,
      req.user.organizationId,
      req.user.userId,
    );
    res.status(201).json(serializeRecipeCost(recipe, canViewCost));
  } catch (error) {
    if (error.name === "ZodError") {
      return res.status(400).json({ errors: error.errors });
    }
    // Tenant-ownership violations surface as plain Errors from the service
    // ("Category not found or access denied" / "...ingredients..." / "...roles...").
    // They are 400s from the client's perspective, not 500s.
    if (error.message === "SKU already exists") {
      return res.status(409).json({ message: error.message });
    }
    if (
      error.message === "Category not found or access denied" ||
      error.message === "One or more ingredients not found or access denied" ||
      error.message === "One or more sub-recipes not found or access denied" ||
      error.message === "One or more roles not found or access denied" ||
      error.message === "Duplicate stepOrder values are not allowed" ||
      error.message === "Duplicate sub-recipe link" ||
      error.message === "Duplicate ingredient in recipe"
    ) {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: error.message });
  }
}

async function update(req, res) {
  try {
    const validatedData = recipeSchema.partial().parse(req.body);
    const canViewCost = await hasPermission(req, PERMISSIONS.COSTS_VIEW);
    const recipe = await recipeService.updateRecipe(
      req.params.id,
      validatedData,
      req.user.organizationId,
      req.user.userId,
    );
    res.json(serializeRecipeCost(recipe, canViewCost));
  } catch (error) {
    if (error.name === "ZodError") {
      return res.status(400).json({ errors: error.errors });
    }
    if (error.message === "Recipe not found or access denied") {
      return res.status(404).json({ message: error.message });
    }
    if (error.message === "SKU already exists") {
      return res.status(409).json({ message: error.message });
    }
    if (
      error.message === "Category not found or access denied" ||
      error.message === "One or more ingredients not found or access denied" ||
      error.message === "One or more sub-recipes not found or access denied" ||
      error.message === "One or more roles not found or access denied" ||
      error.message === "Duplicate stepOrder values are not allowed" ||
      error.message === "Duplicate sub-recipe link" ||
      error.message === "Duplicate ingredient in recipe" ||
      error.message === "Sub-recipe link would create a cycle" ||
      error.message === "Sub-recipe chain exceeds maximum depth" ||
      error.message.startsWith("Cannot change yieldUnit:")
    ) {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: error.message });
  }
}

async function remove(req, res) {
  try {
    await recipeService.deleteRecipe(req.params.id, req.user.organizationId);
    res.status(204).send();
  } catch (error) {
    if (error.message === "Recipe not found or access denied") {
      return res.status(404).json({ message: error.message });
    }
    if (
      error.message.startsWith("Cannot delete recipe: it is used as a sub-recipe")
    ) {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: error.message });
  }
}

async function getNextSku(req, res) {
  try {
    const sku = await recipeService.getNextSku(req.user.organizationId);
    res.json({ sku });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

module.exports = {
  list,
  get: getById,
  create,
  update,
  remove,
  getNextSku,
};
