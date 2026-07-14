const PERMISSIONS = require("../../constants/permissions");

// Return the full permission catalog grouped by module. Static data derived
// from the constants catalog — the single authoritative list of possible keys.
function getCatalog(req, res) {
  res.json(PERMISSIONS.PERMISSION_CATALOG);
}

module.exports = { getCatalog };
