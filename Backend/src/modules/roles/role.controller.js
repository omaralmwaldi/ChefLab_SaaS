const roleService = require("./role.service");
const { roleSchema } = require("./role.validation");

async function getAllRoles(req, res) {
  try {
    const roles = await roleService.getAllRoles(req.user.organizationId);
    res.json(roles);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

async function getRoleById(req, res) {
  try {
    const role = await roleService.getRoleById(req.params.id, req.user.organizationId);
    res.json(role);
  } catch (error) {
    if (error.message === "Role not found") {
      return res.status(404).json({ message: error.message });
    }
    res.status(500).json({ message: error.message });
  }
}

async function createRole(req, res) {
  try {
    const validatedData = roleSchema.parse(req.body);
    const role = await roleService.createRole({
      organizationId: req.user.organizationId,
      ...validatedData,
    });
    res.status(201).json(role);
  } catch (error) {
    if (error.name === "ZodError") {
      return res.status(400).json({ errors: error.errors });
    }
    if (error.code === "P2002") {
      return res.status(409).json({ message: "A role with this English name already exists" });
    }
    res.status(500).json({ message: error.message });
  }
}

async function updateRole(req, res) {
  try {
    const validatedData = roleSchema.partial().parse(req.body);
    const role = await roleService.updateRole(req.params.id, req.user.organizationId, validatedData);
    res.json(role);
  } catch (error) {
    if (error.name === "ZodError") {
      return res.status(400).json({ errors: error.errors });
    }
    if (error.message === "Role not found") {
      return res.status(404).json({ message: error.message });
    }
    if (error.code === "P2002") {
      return res.status(409).json({ message: "A role with this English name already exists" });
    }
    res.status(500).json({ message: error.message });
  }
}

async function deleteRole(req, res) {
  try {
    await roleService.deleteRole(req.params.id, req.user.organizationId);
    res.json({ success: true, message: "Role deleted successfully" });
  } catch (error) {
    if (error.message === "Role not found") {
      return res.status(404).json({ message: error.message });
    }
    if (error.message === "Cannot delete role with assigned users") {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: error.message });
  }
}

module.exports = {
  getAllRoles,
  getRoleById,
  createRole,
  updateRole,
  deleteRole,
};
