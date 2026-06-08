
const roleService = require("./role.service");

async function getAllRoles(req, res, next) {
    try {
        const roles = await roleService.getAllRoles(req.user.organizationId);
        return res.json(roles);
    } catch (error) {
        next(error);
    }
}

async function getRoleById(req, res, next) {
    try {
        const role = await roleService.getRoleById(req.params.id, req.user.organizationId);
        return res.status(200).json(role);
    } catch (error) {
        next(error);
    }
}

async function createRole(req, res, next) {
    try {
        const role = await roleService.createRole({
            organizationId: req.user.organizationId,
            ...req.body,
        });
        return res.status(201).json(role);
    } catch (error) {
        next(error);
    }
}

async function updateRole(req, res, next) {
    try {
        const role = await roleService.updateRole(req.params.id, req.user.organizationId, req.body);
        return res.status(200).json(role);
    } catch (error) {
        next(error);
    }
}
async function deleteRole(req, res, next) {
    try {
        await roleService.deleteRole(req.params.id, req.user.organizationId);
        res.status(200).json({
            success: true,
            message: "Role deleted successfully",
        });
    } catch (error) {
        next(error);
    }
}

module.exports = {
    getAllRoles,
    getRoleById,
    createRole,
    updateRole,
    deleteRole,
};
