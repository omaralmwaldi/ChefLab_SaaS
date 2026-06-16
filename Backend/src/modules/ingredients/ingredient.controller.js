const ingredientService = require("./ingredient.service");
const { ingredientSchema } = require("./ingredient.validation");

// return all ingredients for the organization:
async function listAll(req, res) {
  try {
    const ingredients = await ingredientService.getAllIngredients(req.user.organizationId);
    res.json(ingredients);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

// return a single ingredient by ID:
async function getById(req, res) {
  try {
    const ingredient = await ingredientService.getIngredientById(req.params.id, req.user.organizationId);
    if (!ingredient) return res.status(404).json({ message: "Ingredient not found" });
    res.json(ingredient);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

// create a new ingredient with data sechema validation using zod:
async function create(req, res) {
  try {
    const validatedData = ingredientSchema.parse(req.body);
    const ingredient = await ingredientService.createIngredient(validatedData, req.user.organizationId);
    res.status(201).json(ingredient);
  } catch (error) {
    if (error.name === "ZodError") {
      return res.status(400).json({ errors: error.errors });
    }
    res.status(500).json({ message: error.message });
  }
}
// update an existing ingredient by ID with data sechema validation using zod:
async function update(req, res) {
  try {
    const validatedData = ingredientSchema.partial().parse(req.body);
    const ingredient = await ingredientService.updateIngredient(req.params.id, validatedData, req.user.organizationId);
    res.json(ingredient);
  } catch (error) {
    if (error.name === "ZodError") {
      return res.status(400).json({ errors: error.errors });
    }
    if (error.message === "Ingredient not found or access denied") {
      return res.status(404).json({ message: error.message });
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

module.exports = {
  list: listAll,
  get: getById,
  create,
  update,
  remove,
};
