import { useState } from "react";
import client from "../../../api/client";

function IngredientModal({ mode, initialData, onClose, onSuccess }) {
  const [sku, setSku] = useState(initialData?.sku || "");
  const [nameEn, setNameEn] = useState(initialData?.nameEn || "");
  const [nameAr, setNameAr] = useState(initialData?.nameAr || "");
  const [storageUnit, setStorageUnit] = useState(initialData?.storageUnit || "");
  const [usageUnit, setUsageUnit] = useState(initialData?.usageUnit || "");
  const [conversionFactor, setConversionFactor] = useState(initialData?.conversionFactor ?? "");
  const [costPerStorageUnit, setCostPerStorageUnit] = useState(initialData?.costPerStorageUnit ?? "");
  const [calories, setCalories] = useState(initialData?.calories ?? "");
  const [protein, setProtein] = useState(initialData?.protein ?? "");
  const [fat, setFat] = useState(initialData?.fat ?? "");
  const [carbs, setCarbs] = useState(initialData?.carbs ?? "");
  const [showNutrition, setShowNutrition] = useState(
    mode === "edit" && !!(initialData?.calories || initialData?.protein || initialData?.fat || initialData?.carbs)
  );
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState(null);

  function numeric(value) {
    const n = parseFloat(value);
    return isNaN(n) ? undefined : n;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setErrors(null);

    const payload = {
      sku: sku.trim(),
      nameEn: nameEn.trim(),
      nameAr: nameAr.trim(),
      storageUnit: storageUnit.trim(),
      usageUnit: usageUnit.trim(),
      conversionFactor: numeric(conversionFactor),
      costPerStorageUnit: numeric(costPerStorageUnit),
    };

    if (!payload.sku || !payload.nameEn || !payload.nameAr || !payload.storageUnit || !payload.usageUnit) {
      setErrors([{ message: "All required fields must be filled" }]);
      return;
    }

    if (payload.conversionFactor === undefined || payload.conversionFactor <= 0) {
      setErrors([{ message: "Conversion factor must be a positive number" }]);
      return;
    }

    if (payload.costPerStorageUnit === undefined || payload.costPerStorageUnit < 0) {
      setErrors([{ message: "Cost per storage unit must be 0 or more" }]);
      return;
    }

    if (showNutrition) {
      const caloriesValue = numeric(calories);
      const proteinValue = numeric(protein);
      const fatVlaue = numeric(fat);
      const carbsValue = numeric(carbs);
      if (caloriesValue !== undefined) payload.calories = caloriesValue;
      if (proteinValue !== undefined) payload.protein = proteinValue;
      if (fatVlaue !== undefined) payload.fat = fatVlaue;
      if (carbsValue !== undefined) payload.carbs = carbsValue;
    }

    setSubmitting(true);
    try {
      if (mode === "create") {
        await client.post("/ingredients", payload);
      } else {
        await client.put(`/ingredients/${initialData.id}`, payload);
      }
      onSuccess();
    } catch (err) {
      if (err.response?.status === 400 && err.response.data?.errors) {
        setErrors(err.response.data.errors);
      } else {
        setErrors([{ message: err.response?.data?.message || "Something went wrong" }]);
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div className="w-full max-w-2xl rounded-xl bg-white p-6 shadow-lg" onClick={(e) => e.stopPropagation()}>
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-bold text-stone-800">
            {mode === "create" ? "Add Ingredient" : "Edit Ingredient"}
          </h2>
          <button onClick={onClose} className="cursor-pointer rounded-lg p-1 text-stone-400 hover:bg-stone-100 hover:text-stone-600">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {errors && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
            {errors.map((err, i) => (
              <p key={i}>{err.message}</p>
            ))}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-stone-700" htmlFor="sku">SKU</label>
              <input
                id="sku"
                className="w-full rounded-lg border border-stone-200 px-3 py-2.5 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                placeholder="e.g. FL-001"
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-stone-700" htmlFor="cost">Cost / Storage Unit (SAR)</label>
              <input
                id="cost"
                type="number"
                step="0.01"
                min="0"
                className="w-full rounded-lg border border-stone-200 px-3 py-2.5 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10"
                value={costPerStorageUnit}
                onChange={(e) => setCostPerStorageUnit(e.target.value)}
                placeholder="0.00"
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-stone-700" htmlFor="nameEn">Name (English)</label>
              <input
                id="nameEn"
                className="w-full rounded-lg border border-stone-200 px-3 py-2.5 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10"
                value={nameEn}
                onChange={(e) => setNameEn(e.target.value)}
                placeholder="e.g. Flour"
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-stone-700" htmlFor="storageUnit">Storage Unit</label>
              <input
                id="storageUnit"
                className="w-full rounded-lg border border-stone-200 px-3 py-2.5 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10"
                value={storageUnit}
                onChange={(e) => setStorageUnit(e.target.value)}
                placeholder="e.g. kg"
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-stone-700" htmlFor="nameAr">الاسم (عربي)</label>
              <input
                id="nameAr"
                className="w-full rounded-lg border border-stone-200 px-3 py-2.5 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10"
                value={nameAr}
                onChange={(e) => setNameAr(e.target.value)}
                placeholder="مثال: طحين"
                dir="rtl"
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-stone-700" htmlFor="usageUnit">Usage Unit</label>
              <input
                id="usageUnit"
                className="w-full rounded-lg border border-stone-200 px-3 py-2.5 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10"
                value={usageUnit}
                onChange={(e) => setUsageUnit(e.target.value)}
                placeholder="e.g. g"
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-stone-700" htmlFor="convFactor">Conversion Factor</label>
              <input
                id="convFactor"
                type="number"
                step="0.01"
                min="0.01"
                className="w-full rounded-lg border border-stone-200 px-3 py-2.5 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10"
                value={conversionFactor}
                onChange={(e) => setConversionFactor(e.target.value)}
                placeholder="e.g. 1000"
                required
              />
              <p className="mt-1 text-xs text-stone-400">How many usage units equal one storage unit</p>
            </div>
          </div>

          <div className="rounded-lg border border-stone-200">
            <button
              type="button"
              onClick={() => setShowNutrition(!showNutrition)}
              className="flex w-full cursor-pointer items-center justify-between px-4 py-3 text-sm font-medium text-stone-600 hover:bg-stone-50"
            >
              <span>Nutritional Info (optional)</span>
              <svg
                className={`h-4 w-4 transition-transform ${showNutrition ? "rotate-180" : ""}`}
                fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {showNutrition && (
              <div className="grid grid-cols-2 gap-4 border-t border-stone-200 p-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-stone-700" htmlFor="calories">Calories</label>
                  <input
                    id="calories"
                    type="number"
                    step="0.01"
                    min="0"
                    className="w-full rounded-lg border border-stone-200 px-3 py-2.5 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10"
                    value={calories}
                    onChange={(e) => setCalories(e.target.value)}
                    placeholder="kcal"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-stone-700" htmlFor="protein">Protein (g)</label>
                  <input
                    id="protein"
                    type="number"
                    step="0.01"
                    min="0"
                    className="w-full rounded-lg border border-stone-200 px-3 py-2.5 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10"
                    value={protein}
                    onChange={(e) => setProtein(e.target.value)}
                    placeholder="g"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-stone-700" htmlFor="fat">Fat (g)</label>
                  <input
                    id="fat"
                    type="number"
                    step="0.01"
                    min="0"
                    className="w-full rounded-lg border border-stone-200 px-3 py-2.5 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10"
                    value={fat}
                    onChange={(e) => setFat(e.target.value)}
                    placeholder="g"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-stone-700" htmlFor="carbs">Carbs (g)</label>
                  <input
                    id="carbs"
                    type="number"
                    step="0.01"
                    min="0"
                    className="w-full rounded-lg border border-stone-200 px-3 py-2.5 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10"
                    value={carbs}
                    onChange={(e) => setCarbs(e.target.value)}
                    placeholder="g"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="cursor-pointer rounded-lg border border-stone-200 px-4 py-2 text-sm font-medium text-stone-600 hover:bg-stone-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="cursor-pointer rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? "Saving..." : mode === "create" ? "Create" : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default IngredientModal;
