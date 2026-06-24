import { useState, useEffect } from "react";

const blankIngredient = () => ({
  ingredientId: "",
  usageQty: "",
});

const blankStep = () => ({
  roleIds: [],
  titleEn: "",
  titleAr: "",
  descriptionEn: "",
  descriptionAr: "",
});

function numeric(value) {
  if (value === "" || value === null || value === undefined) return undefined;
  const n = parseFloat(value);
  return isNaN(n) ? undefined : n;
}

function lineToPayload(ingredientLine, ingredient) {
  if (!ingredient || !ingredientLine.ingredientId) return null;
  const usageQty = numeric(ingredientLine.usageQty);
  if (usageQty === undefined) return null;

  const costPerStorageUnit = Number(ingredient.costPerStorageUnit);
  const conv = Number(ingredient.conversionFactor);

  return {
    ingredientId: ingredientLine.ingredientId,
    quantity: usageQty,
    usageUnit: ingredient.usageUnit,
    usageUnitCost: costPerStorageUnit / conv,
  };
}

function RecipeEditor({
  recipe,
  categories,
  ingredients,
  roles,
  onCancel,
  onSave,
}) {
  const [sku, setSku] = useState(recipe.sku);
  const [nameEn, setNameEn] = useState(recipe.nameEn);
  const [nameAr, setNameAr] = useState(recipe.nameAr);
  const [categoryId, setCategoryId] = useState(recipe.categoryId);
  const [yieldQuantity, setYieldQuantity] = useState(
    recipe.yieldQuantity?.toString() || "",
  );
  const [yieldUnit, setYieldUnit] = useState(recipe.yieldUnit);
  const [notes, setNotes] = useState(recipe.notes || "");
  const [ingredientLines, setIngredientLines] = useState([]);
  const [steps, setSteps] = useState([]);
  const [initialized, setInitialized] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState(null);

  // Initialize lines/steps from recipe once ingredients are loaded
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (initialized || ingredients.length === 0) return;
    setIngredientLines(
      recipe.ingredients.map((line) => ({
        ingredientId: line.ingredientId,
        usageQty: Number(line.quantity).toString(),
      })),
    );

    setSteps(
      recipe.steps.map((step) => ({
        roleIds: step.roles?.map((sr) => sr.role.id) || [],
        titleEn: step.titleEn,
        titleAr: step.titleAr,
        descriptionEn: step.descriptionEn,
        descriptionAr: step.descriptionAr,
      })),
    );
    setInitialized(true);
  }, [ingredients, recipe, initialized]);
  /* eslint-enable react-hooks/set-state-in-effect */

  function addLine() {
    setIngredientLines((prev) => [...prev, blankIngredient()]);
  }
  function removeLine(idx) {
    setIngredientLines((prev) => prev.filter((_, i) => i !== idx));
  }

  function moveIngredient(idx, dir) {
    setIngredientLines((prev) => {
      const next = [...prev];
      const target = idx + dir;
      if (target < 0 || target >= next.length) return prev;
      [next[idx], next[target]] = [next[target], next[idx]];
      return next;
    });
  }
  function updateIngredientLines(idx, patch) {
    setIngredientLines((prev) =>
      prev.map((l, i) => (i === idx ? { ...l, ...patch } : l)),
    );
  }

  function addStep() {
    setSteps((prev) => [...prev, blankStep()]);
  }
  function removeStep(idx) {
    setSteps((prev) => prev.filter((_, i) => i !== idx));
  }
  function moveStep(idx, dir) {
    setSteps((prev) => {
      const next = [...prev];
      const target = idx + dir;
      if (target < 0 || target >= next.length) return prev;
      [next[idx], next[target]] = [next[target], next[idx]];
      return next;
    });
  }
  function updateStep(idx, patch) {
    setSteps((prev) =>
      prev.map((s, i) => (i === idx ? { ...s, ...patch } : s)),
    );
  }

  function pickIngredient(lineIdx, ingredientId) {
    updateIngredientLines(lineIdx, { ingredientId });
  }

  function lineIngredient(idx) {
    const line = ingredientLines[idx];
    return ingredients.find((i) => i.id === line.ingredientId);
  }

  function linePreview(idx) {
    const line = ingredientLines[idx];
    const ing = lineIngredient(idx);
    if (!ing) return null;
    const payload = lineToPayload(line, ing);
    if (!payload) return null;
    return {
      qty: payload.quantity,
      usageUnit: payload.usageUnit,
      usageUnitCost: payload.usageUnitCost,
      lineCost: payload.quantity * payload.usageUnitCost,
    };
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setErrors(null);

    if (
      !sku.trim() ||
      !nameEn.trim() ||
      !nameAr.trim() ||
      !categoryId ||
      !yieldQuantity ||
      !yieldUnit.trim()
    ) {
      setErrors([{ message: "All required fields must be filled" }]);
      return;
    }

    if (ingredientLines.length === 0) {
      setErrors([{ message: "At least one ingredient is required" }]);
      return;
    }
    if (steps.length === 0) {
      setErrors([{ message: "At least one step is required" }]);
      return;
    }

    const ingredientPayload = [];
    for (let i = 0; i < ingredientLines.length; i++) {
      const ing = lineIngredient(i);
      const payload = lineToPayload(ingredientLines[i], ing);
      if (!payload) {
        setErrors([{ message: `Ingredient line ${i + 1} is incomplete` }]);
        return;
      }
      ingredientPayload.push(payload);
    }

    const stepPayload = steps.map((s, i) => ({
      stepOrder: i,
      roleIds: s.roleIds,
      titleEn: s.titleEn.trim(),
      titleAr: s.titleAr.trim(),
      descriptionEn: s.descriptionEn.trim(),
      descriptionAr: s.descriptionAr.trim(),
    }));
    for (let i = 0; i < stepPayload.length; i++) {
      const s = stepPayload[i];
      if (
        !s.roleIds ||
        s.roleIds.length === 0 ||
        !s.titleEn ||
        !s.titleAr ||
        !s.descriptionEn ||
        !s.descriptionAr
      ) {
        setErrors([{ message: `Step ${i + 1} is incomplete` }]);
        return;
      }
    }

    const payload = {
      sku: sku.trim(),
      nameEn: nameEn.trim(),
      nameAr: nameAr.trim(),
      categoryId,
      yieldQuantity: numeric(yieldQuantity),
      yieldUnit: yieldUnit.trim(),
      status: "DRAFT",
      ingredients: ingredientPayload,
      steps: stepPayload,
    };
    if (notes.trim()) payload.notes = notes.trim();

    setSubmitting(true);
    try {
      await onSave(payload);
    } catch (err) {
      if (err.response?.status === 400 && err.response.data?.errors) {
        setErrors(err.response.data.errors);
      } else {
        setErrors([
          {
            message:
              err.response?.data?.message ||
              err.message ||
              "Something went wrong",
          },
        ]);
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {errors && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
          {errors.map((err, i) => (
            <p key={i}>{err.message}</p>
          ))}
        </div>
      )}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label
            className="mb-1 block text-sm font-medium text-stone-700"
            htmlFor="e-nameEn"
          >
            Name (English)
          </label>
          <input
            id="e-nameEn"
            className="w-full rounded-lg border border-stone-200 px-3 py-2.5 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10"
            value={nameEn}
            onChange={(e) => setNameEn(e.target.value)}
            required
          />
        </div>
        <div>
          <label
            className="mb-1 block text-sm font-medium text-stone-700"
            htmlFor="e-nameAr"
          >
            الاسم (عربي)
          </label>
          <input
            id="e-nameAr"
            dir="rtl"
            className="w-full rounded-lg border border-stone-200 px-3 py-2.5 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10"
            value={nameAr}
            onChange={(e) => setNameAr(e.target.value)}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label
            className="mb-1 block text-sm font-medium text-stone-700"
            htmlFor="e-sku"
          >
            SKU
          </label>
          <input
            id="e-sku"
            className="w-full rounded-lg border border-stone-200 px-3 py-2.5 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10"
            value={sku}
            onChange={(e) => setSku(e.target.value)}
            required
          />
        </div>
        <div>
          <label
            className="mb-1 block text-sm font-medium text-stone-700"
            htmlFor="e-cat"
          >
            Category
          </label>
          <select
            id="e-cat"
            className="w-full rounded-lg border border-stone-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10"
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            required
          >
            <option value="">Select category</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nameEn}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            className="mb-1 block text-sm font-medium text-stone-700"
            htmlFor="e-yieldQ"
          >
            Yield Quantity
          </label>
          <input
            id="e-yieldQ"
            type="number"
            step="0.001"
            min="0.001"
            className="w-full rounded-lg border border-stone-200 px-3 py-2.5 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10"
            value={yieldQuantity}
            onChange={(e) => setYieldQuantity(e.target.value)}
            required
          />
        </div>
        <div>
          <label
            className="mb-1 block text-sm font-medium text-stone-700"
            htmlFor="e-yieldU"
          >
            Yield Unit
          </label>
          <input
            id="e-yieldU"
            className="w-full rounded-lg border border-stone-200 px-3 py-2.5 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10"
            value={yieldUnit}
            onChange={(e) => setYieldUnit(e.target.value)}
            required
          />
        </div>
      </div>
      <div>
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-stone-700">Ingredients</h3>
        </div>
        {ingredientLines.length === 0 && (
          <p className="rounded-lg border border-dashed border-stone-200 px-4 py-6 text-center text-sm text-stone-400">
            No ingredients yet
          </p>
        )}
        <div className="space-y-2">
          {ingredientLines.map((line, idx) => {
            const ing = lineIngredient(idx);
            const preview = linePreview(idx);
            return (
              <div key={idx} className="rounded-lg border border-stone-200 p-3">
                <div className="grid grid-cols-12 gap-2">
                  <div className="col-span-12 sm:col-span-5">
                    <label className="mb-1 block text-xs font-medium text-stone-500">
                      Ingredient
                    </label>
                    <select
                      className="w-full rounded-lg border border-stone-200 bg-white px-2.5 py-2 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10"
                      value={line.ingredientId}
                      onChange={(e) => pickIngredient(idx, e.target.value)}
                      required
                    >
                      <option value="">Select ingredient</option>
                      {ingredients.map((i) => (
                        <option key={i.id} value={i.id}>
                          {i.nameEn}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="col-span-5 sm:col-span-3">
                    <label className="mb-1 block text-xs font-medium text-stone-500">
                      Qty {ing && `(${ing.usageUnit})`}
                    </label>
                    <input
                      type="number"
                      step="0.001"
                      min="0.001"
                      className="w-full rounded-lg border border-stone-200 px-2.5 py-2 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10"
                      value={line.usageQty}
                      onChange={(e) =>
                        updateIngredientLines(idx, { usageQty: e.target.value })
                      }
                      placeholder="0.000"
                      required
                    />
                  </div>
                  <div className="col-span-5 sm:col-span-3">
                    <label className="mb-1 block text-xs font-medium text-stone-500">
                      Total Cost/{ing?.usageUnit || "unit"} (SAR)
                    </label>
                    <input
                      type="number"
                      step="0.0001"
                      className="w-full rounded-lg border border-stone-200 bg-stone-50 px-2.5 py-2 text-sm text-green-600 outline-none"
                      value={preview ? preview.lineCost.toFixed(4) : 0.0}
                      disabled
                    />
                  </div>
                  <div className="col-span-2 flex items-end justify-end sm:col-span-1">
                    <button
                      type="button"
                      onClick={() => removeLine(idx)}
                      className="cursor-pointer rounded-lg p-2 text-stone-400 hover:bg-red-50 hover:text-red-600"
                      title="Remove"
                    >
                      <svg
                        className="h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={1.5}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <button
          type="button"
          onClick={addLine}
          className="cursor-pointer rounded-lg bg-orange-400 px-3 py-1 text-sm font-medium text-white hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
        >
          + Add Ingredient
        </button>
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-stone-700">Steps</h3>
        </div>
        {steps.length === 0 && (
          <p className="rounded-lg border border-dashed border-stone-200 px-4 py-6 text-center text-sm text-stone-400">
            No steps yet
          </p>
        )}
        <div className="space-y-2">
          {steps.map((step, idx) => (
            <div key={idx} className="rounded-lg border border-stone-200 p-3">
              <div className="mb-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-orange-100 text-xs font-semibold text-orange-700">
                    {idx + 1}
                  </span>
                  <span className="text-sm font-medium text-stone-600">
                    Step
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => moveStep(idx, -1)}
                    disabled={idx === 0}
                    className="cursor-pointer rounded p-1 text-stone-400 hover:bg-stone-100 hover:text-stone-600 disabled:cursor-not-allowed disabled:opacity-30"
                    title="Move up"
                  >
                    <svg
                      className="h-3.5 w-3.5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M4.5 15.75l7.5-7.5 7.5 7.5"
                      />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={() => moveStep(idx, 1)}
                    disabled={idx === steps.length - 1}
                    className="cursor-pointer rounded p-1 text-stone-400 hover:bg-stone-100 hover:text-stone-600 disabled:cursor-not-allowed disabled:opacity-30"
                    title="Move down"
                  >
                    <svg
                      className="h-3.5 w-3.5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M19.5 8.25l-7.5 7.5-7.5-7.5"
                      />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={() => removeStep(idx)}
                    className="cursor-pointer rounded p-1 text-stone-400 hover:bg-red-50 hover:text-red-600"
                    title="Remove"
                  >
                    <svg
                      className="h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={1.5}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="col-span-2">
                  <label className="mb-1 block text-xs font-medium text-stone-500">
                    Assigned Roles
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {roles.map((r) => (
                      <label
                        key={r.id}
                        className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-stone-200 px-3 py-1.5 text-sm hover:bg-stone-50 has-[:checked]:border-orange-500 has-[:checked]:bg-orange-50"
                      >
                        <input
                          type="checkbox"
                          checked={step.roleIds.includes(r.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              updateStep(idx, { roleIds: [...step.roleIds, r.id] });
                            } else {
                              updateStep(idx, { roleIds: step.roleIds.filter((id) => id !== r.id) });
                            }
                          }}
                          className="rounded border-stone-300 text-orange-500 focus:ring-orange-500"
                        />
                        {r.nameEn}
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <input
                    className="w-full rounded-lg border border-stone-200 px-2.5 py-2 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10"
                    value={step.titleEn}
                    onChange={(e) =>
                      updateStep(idx, { titleEn: e.target.value })
                    }
                    placeholder="Step title (EN)"
                    required
                  />
                </div>
                <div>
                  <input
                    dir="rtl"
                    className="w-full rounded-lg border border-stone-200 px-2.5 py-2 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10"
                    value={step.titleAr}
                    onChange={(e) =>
                      updateStep(idx, { titleAr: e.target.value })
                    }
                    placeholder="عنوان الخطوة"
                    required
                  />
                </div>
                <div>
                  <input
                    className="w-full rounded-lg border border-stone-200 px-2.5 py-2 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10"
                    value={step.descriptionEn}
                    onChange={(e) =>
                      updateStep(idx, { descriptionEn: e.target.value })
                    }
                    placeholder="Description (EN)"
                    required
                  />
                </div>
                <div className="col-span-2">
                  <input
                    dir="rtl"
                    className="w-full rounded-lg border border-stone-200 px-2.5 py-2 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10"
                    value={step.descriptionAr}
                    onChange={(e) =>
                      updateStep(idx, { descriptionAr: e.target.value })
                    }
                    placeholder="وصف الخطوة"
                    required
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={addStep}
          className="cursor-pointer rounded-lg bg-orange-400 px-8 py-1 text-sm font-medium text-white hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
        >
          + Add Step
        </button>
      </div>
      <div>
        <label
          className="mb-1 block text-sm font-medium text-stone-700"
          htmlFor="e-notes"
        >
          Notes (optional)
        </label>
        <textarea
          id="e-notes"
          rows={2}
          className="w-full rounded-lg border border-stone-200 px-3 py-2.5 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Any special notes..."
        />
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="cursor-pointer rounded-lg border border-stone-200 px-4 py-2 text-sm font-medium text-stone-600 hover:bg-stone-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="cursor-pointer rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? "Saving..." : "Save"}
        </button>
      </div>
    </form>
  );
}

export default RecipeEditor;
