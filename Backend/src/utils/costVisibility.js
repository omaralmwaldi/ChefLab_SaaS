// Cost-visibility serializer for the single system-wide `costs.view`
// permission. Callers resolve the decision with hasPermission(req,
// COSTS_VIEW) — which already returns true for the org owner — and pass the
// boolean here. When false, every cost figure is OMITTED (not zeroed) from
// the response; no 403 is raised. The paired write-guard lives in the recipe
// and ingredient services, protecting the stored usageUnitCost inputs from
// which recipe cost is derived.

// Strip totalCost + costPerStorageUnit from a recipe and usageUnitCost from
// each of its ingredient lines. The embedded recipe-ingredient cost is
// governed by the same permission.
function stripRecipeCost(recipe) {
  if (!recipe) return recipe;
  const { totalCost, costPerStorageUnit, ...rest } = recipe;
  if (Array.isArray(rest.ingredients)) {
    rest.ingredients = rest.ingredients.map(
      ({ usageUnitCost, ...line }) => line,
    );
  }
  return rest;
}

// Strip cost fields from an ingredient response.
function stripIngredientCost(ingredient) {
  if (!ingredient) return ingredient;
  const { costPerStorageUnit, usageUnitCost, ...rest } = ingredient;
  return rest;
}

// Pass-through when the caller may view costs; otherwise strip. Accepts a
// single object or an array.
function serializeRecipeCost(input, canViewCost) {
  if (canViewCost || !input) return input;
  return Array.isArray(input) ? input.map(stripRecipeCost) : stripRecipeCost(input);
}

function serializeIngredientCost(input, canViewCost) {
  if (canViewCost || !input) return input;
  return Array.isArray(input)
    ? input.map(stripIngredientCost)
    : stripIngredientCost(input);
}

module.exports = {
  stripRecipeCost,
  stripIngredientCost,
  serializeRecipeCost,
  serializeIngredientCost,
};
