const userService = require("./user.service");
const { createUserSchema } = require("./user.validation");

// list all users for the organization
async function list(req, res) {
  try {
    const users = await userService.getAllUsers(req.user.organizationId);
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

// get a single user by ID for the organization
async function getById(req, res) {
  try {
    const user = await userService.getUserById(req.params.id, req.user.organizationId);
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

// create a new user with data schema validation using zod
async function create(req, res) {
  try {
    const validatedData = createUserSchema.parse(req.body);
    const user = await userService.createUser(validatedData, req.user.organizationId);
    res.status(201).json(user);
  } catch (error) {
    if (error.name === "ZodError") {
      return res.status(400).json({ errors: error.errors });
    }
    if (error.message === "Email already exists") {
      return res.status(409).json({ message: error.message });
    }
    res.status(500).json({ message: error.message });
  }
}

// update an existing user by ID with data schema validation using zod
async function update(req, res) {
  try {
    const validatedData = createUserSchema.partial().parse(req.body);
    const user = await userService.updateUser(req.params.id, validatedData, req.user.organizationId);
    res.json(user);
  } catch (error) {
    if (error.name === "ZodError") {
      return res.status(400).json({ errors: error.errors });
    }
    if (error.message === "User not found or access denied") {
      return res.status(404).json({ message: error.message });
    }
    res.status(500).json({ message: error.message });
  }
}

// delete a user by ID
async function remove(req, res) {
  try {
    await userService.deleteUser(req.params.id, req.user.organizationId);
    res.status(204).send();
  } catch (error) {
    if (error.message === "User not found or access denied") {
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
