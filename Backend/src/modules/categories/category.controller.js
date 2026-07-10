const categoryService = require("./category.service");
const { categorySchema } = require("./category.validation");

// list all categories for the organization:
async function list(req, res) {
  try {
    const categories = await categoryService.getAllCategories(req.user.organizationId);
    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

// get a single category by ID for the organization:
async function getById(req, res) {
  try {
    const category = await categoryService.getCategoryById(req.params.id, req.user.organizationId);
    if (!category) return res.status(404).json({ message: "Category not found" });
    res.json(category);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

// create a new category for the organization with data schema validation using zod:
async function create(req, res) {
  try {
    const validatedData = categorySchema.parse(req.body);
    const category = await categoryService.createCategory(validatedData, req.user.organizationId);
    res.status(201).json(category);
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

// update an existing category by ID with data schema validation using zod with error handling for not found or access denied cases:
async function update(req, res) {
  try {
    const validatedData = categorySchema.partial().parse(req.body);
    const category = await categoryService.updateCategory(req.params.id, validatedData, req.user.organizationId);
    res.json(category);
  } catch (error) {
    if (error.name === "ZodError") {
      return res.status(400).json({ errors: error.errors });
    }
    if (error.message === "Category not found or access denied") {
      return res.status(404).json({ message: error.message });
    }
    if (error.message === "SKU already exists") {
      return res.status(409).json({ message: error.message });
    }
    res.status(500).json({ message: error.message });
  }
}

// delete a category by ID with error handling for not found or access denied cases:
async function remove(req, res) {
  try {
    await categoryService.deleteCategory(req.params.id, req.user.organizationId);
    res.status(204).send();
  } catch (error) {
    if(error.message === "Category not found or access denied") {
      return res.status(404).json({ message: error.message });
    }
    res.status(500).json({ message: error.message }); 
  }
}


module.exports = {
  list,
  get: getById,
  create,
  update,
  remove,
};
