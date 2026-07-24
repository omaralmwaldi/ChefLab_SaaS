import { useState, useEffect, useRef, useMemo } from "react";
import { useTranslation, Trans } from "react-i18next";
import { Link } from "react-router-dom";
import StepMediaUploader from "../../../components/StepMediaUploader";
import { listIngredients } from "../../../api/ingredients";
import { listRecipes } from "../../../api/recipes";
import { usePermissions } from "../../../contexts/usePermissions";
import { PERMISSIONS } from "../../../constants/permissions";

const PICKER_LIMIT = 50;
const PICKER_DEBOUNCE_MS = 250;

const blankLine = () => ({
  type: null,
  ingredientId: null,
  subRecipeId: null,
  usageQty: "",
  savedUsageUnit: null,
  savedUsageUnitCost: null,
  displayName: "",
});

const blankStep = () => ({
  roleIds: [],
  titleEn: "",
  titleAr: "",
  descriptionEn: "",
  descriptionAr: "",
  imageUrl: "",
  videoUrl: "",
});

function numeric(value) {
  if (value === "" || value === null || value === undefined) return undefined;
  const n = parseFloat(value);
  return isNaN(n) ? undefined : n;
}

// Unified combobox that searches both Ingredient and Recipe in a single input.
// When no search term, shows initialIngredients as candidates (ingredient-type only).
// When user types, runs parallel searches against /ingredients and /recipes.
// Results show a type badge (Ingredient / Recipe) and SKU.
// onPick receives { type: 'ingredient'|'subRecipe', id, row }.
function UnifiedPicker({
  selectedId,
  selectedType,
  selectedLabel,
  onPick,
  initialIngredients,
  disabled,
}) {
  const { t } = useTranslation("recipes");
  const [open, setOpen] = useState(false);
  const [term, setTerm] = useState("");
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [highlight, setHighlight] = useState(0);

  const abortRef = useRef(null);
  const debounceRef = useRef(null);
  const wrapRef = useRef(null);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    setHighlight(0);
  }, [results, open]);
  /* eslint-enable react-hooks/set-state-in-effect */

  async function runSearch(q) {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setLoading(true);
    try {
      const [ings, recipes] = await Promise.all([
        listIngredients({ q, limit: PICKER_LIMIT, signal: controller.signal }),
        listRecipes({ q, limit: PICKER_LIMIT, signal: controller.signal }),
      ]);
      if (abortRef.current === controller) {
        setResults([
          ...ings.map((r) => ({ ...r, _pickerType: "ingredient" })),
          ...recipes.map((r) => ({ ...r, _pickerType: "subRecipe" })),
        ]);
        setLoading(false);
      }
    } catch (err) {
      if (err.name !== "CanceledError" && err.code !== "ERR_CANCELED") {
        if (abortRef.current === controller) setLoading(false);
      }
    }
  }

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!open || !term.trim()) {
      setResults(null);
      setLoading(false);
      if (abortRef.current) {
        abortRef.current.abort();
        abortRef.current = null;
      }
      return;
    }
    debounceRef.current = setTimeout(() => {
      runSearch(term.trim());
    }, PICKER_DEBOUNCE_MS);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [term, open]);
  /* eslint-enable react-hooks/set-state-in-effect */

  useEffect(
    () => () => {
      abortRef.current?.abort();
    },
    [],
  );

  useEffect(() => {
    if (!open) return;
    function handle(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [open]);

  const dropdown = useMemo(() => {
    if (results !== null) return results;
    return (initialIngredients || []).map((r) => ({
      ...r,
      _pickerType: "ingredient",
    }));
  }, [results, initialIngredients]);

  function pickRow(row) {
    onPick({ type: row._pickerType, id: row.id, row });
    setOpen(false);
    setTerm("");
    setResults(null);
  }

  function clearSelection() {
    onPick({ type: null, id: "", row: null });
    setTerm("");
    setResults(null);
  }

  const displayValue = open ? term : selectedLabel || "";

  return (
    <div ref={wrapRef} className="relative">
      <input
        type="text"
        role="combobox"
        aria-expanded={open}
        aria-autocomplete="list"
        value={displayValue}
        onFocus={() => setOpen(true)}
        onChange={(e) => {
          setTerm(e.target.value);
          if (!open) setOpen(true);
        }}
        disabled={disabled}
        required={!selectedId}
        placeholder={t("searchPlaceholder")}
        className="w-full rounded-lg border border-stone-200 bg-white px-2.5 py-2 pr-8 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10"
      />
      {selectedId && !open && (
        <button
          type="button"
          tabIndex={-1}
          onClick={(e) => {
            e.stopPropagation();
            clearSelection();
          }}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-stone-400 hover:bg-stone-100 hover:text-stone-600"
          title={t("remove")}
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
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      )}
      {open && (
        <ul
          role="listbox"
          className="absolute left-0 right-0 z-20 mt-1 max-h-60 overflow-auto rounded-lg border border-stone-200 bg-white py-1 text-sm shadow-lg"
        >
          {loading && dropdown.length === 0 && (
            <li className="px-3 py-2 text-stone-400">{t("searching")}</li>
          )}
          {!loading && dropdown.length === 0 && (
            <li className="px-3 py-2 text-stone-400">{t("noMatches")}</li>
          )}
          {dropdown.map((row, i) => (
            <li
              key={`${row._pickerType}-${row.id}`}
              role="option"
              aria-selected={
                row.id === selectedId && row._pickerType === selectedType
              }
              onMouseDown={(e) => {
                e.preventDefault();
                pickRow(row);
              }}
              onMouseEnter={() => setHighlight(i)}
              className={`flex cursor-pointer items-center justify-between gap-2 px-3 py-1.5 ${
                i === highlight ? "bg-orange-50" : ""
              } ${
                row.id === selectedId && row._pickerType === selectedType
                  ? "font-medium text-orange-700"
                  : "text-stone-700"
              }`}
            >
              <div className="flex min-w-0 items-center gap-2">
                <span
                  className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium ${
                    row._pickerType === "ingredient"
                      ? "bg-blue-50 text-blue-700"
                      : "bg-purple-50 text-purple-700"
                  }`}
                >
                  {row._pickerType === "ingredient" ? t("ingredient") : t("recipeLabel")}
                </span>
                <span className="truncate">{row.nameEn}</span>
              </div>
              <span className="shrink-0 rounded bg-stone-100 px-2 py-0.5 text-[10px] font-mono text-stone-600">
                {row.sku}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function buildLinePayload(line, ing) {
  const qty = numeric(line.usageQty);
  if (qty === undefined || qty <= 0) return null;

  if (line.type === "ingredient") {
    if (!ing || !line.ingredientId) return null;
    // usageUnit/usageUnitCost are derived server-side from the Ingredient row.
    // Sending them is pointless (server ignores) and impossible for a no-cost
    // user, whose costPerStorageUnit is stripped → NaN → null → 400.
    return {
      ingredientId: line.ingredientId,
      quantity: qty,
    };
  }

  if (line.type === "subRecipe") {
    if (!line.subRecipeId) return null;
    return {
      subRecipeId: line.subRecipeId,
      quantity: qty,
    };
  }

  return null;
}

function getLinePreview(line, ing) {
  const qty = numeric(line.usageQty);
  if (!qty) return null;

  if (line.type === "ingredient") {
    if (!ing) return null;
    const usageUnitCost =
      Number(ing.costPerStorageUnit) / Number(ing.conversionFactor);
    return {
      usageUnit: ing.usageUnit,
      usageUnitCost,
      lineCost: qty * usageUnitCost,
    };
  }

  if (line.type === "subRecipe") {
    if (line.savedUsageUnitCost === null) return null;
    return {
      usageUnit: line.savedUsageUnit,
      usageUnitCost: line.savedUsageUnitCost,
      lineCost: qty * line.savedUsageUnitCost,
    };
  }

  return null;
}

function RecipeEditor({
  recipe,
  categories,
  ingredients,
  roles,
  onCancel,
  onSave,
}) {
  const { t } = useTranslation("recipes");
  const { can } = usePermissions();
  const showCost = can(PERMISSIONS.COSTS_VIEW);
  const isUsedAsSubRecipe = recipe.isUsedAsSubRecipe ?? false;

  const [sku, setSku] = useState(recipe.sku);
  const [nameEn, setNameEn] = useState(recipe.nameEn);
  const [nameAr, setNameAr] = useState(recipe.nameAr);
  const [categoryId, setCategoryId] = useState(recipe.categoryId);
  const [yieldQuantity, setYieldQuantity] = useState(
    recipe.yieldQuantity?.toString() || "",
  );
  const [yieldUnit, setYieldUnit] = useState(recipe.yieldUnit);
  const [notes, setNotes] = useState(recipe.notes || "");
  const [shelfLifeValue, setShelfLifeValue] = useState(
    recipe.shelfLifeValue?.toString() || "",
  );
  const [shelfLifeUnit, setShelfLifeUnit] = useState(
    recipe.shelfLifeUnit || "DAY",
  );
  const [shelfLifePlace, setShelfLifePlace] = useState(
    recipe.shelfLifePlace || "ROOM_TEMPERATURE",
  );
  const [storageUnit, setStorageUnit] = useState(recipe.storageUnit || "");
  const [conversionFactor, setConversionFactor] = useState(
    recipe.conversionFactor?.toString() || "",
  );
  const [lines, setLines] = useState([]);
  const [steps, setSteps] = useState([]);
  const [collapsedSteps, setCollapsedSteps] = useState(() => new Set());
  const [initialized, setInitialized] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState(null);
  const [lineIngredientCache, setLineIngredientCache] = useState(
    () => new Map(),
  );
  const originalRef = useRef(null);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (initialized || ingredients.length === 0) return;
    const initLines = recipe.ingredients.map((ing) => {
      if (ing.subRecipeId) {
        return {
          type: "subRecipe",
          ingredientId: null,
          subRecipeId: ing.subRecipeId,
          usageQty: Number(ing.quantity).toString(),
          savedUsageUnit: ing.usageUnit,
          savedUsageUnitCost: Number(ing.usageUnitCost),
          displayName: ing.subRecipe?.nameEn || "",
        };
      }
      return {
        type: "ingredient",
        ingredientId: ing.ingredientId,
        subRecipeId: null,
        usageQty: Number(ing.quantity).toString(),
        savedUsageUnit: null,
        savedUsageUnitCost: null,
        displayName: "",
      };
    });
    const initSteps = recipe.steps.map((step) => ({
      roleIds: step.roles?.map((sr) => sr.role.id) || [],
      titleEn: step.titleEn,
      titleAr: step.titleAr,
      descriptionEn: step.descriptionEn,
      descriptionAr: step.descriptionAr,
      imageUrl: step.imageUrl || "",
      videoUrl: step.videoUrl || "",
    }));
    setLines(initLines);
    setSteps(initSteps);
    originalRef.current = {
      sku: recipe.sku,
      nameEn: recipe.nameEn,
      nameAr: recipe.nameAr,
      categoryId: recipe.categoryId,
      yieldQuantity: recipe.yieldQuantity?.toString() || "",
      yieldUnit: recipe.yieldUnit,
      notes: recipe.notes || "",
      shelfLifeValue: recipe.shelfLifeValue?.toString() || "",
      shelfLifeUnit: recipe.shelfLifeUnit || "DAY",
      shelfLifePlace: recipe.shelfLifePlace || "ROOM_TEMPERATURE",
      storageUnit: recipe.storageUnit || "",
      conversionFactor: recipe.conversionFactor?.toString() || "",
      lines: initLines,
      steps: initSteps,
    };
    setInitialized(true);
  }, [ingredients, recipe, initialized]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const isDirty = useMemo(() => {
    if (!initialized || !originalRef.current) return false;
    const current = {
      sku, nameEn, nameAr, categoryId,
      yieldQuantity, yieldUnit, notes,
      shelfLifeValue, shelfLifeUnit, shelfLifePlace,
      storageUnit, conversionFactor,
      lines, steps,
    };
    return JSON.stringify(current) !== JSON.stringify(originalRef.current);
  }, [
    initialized,
    sku, nameEn, nameAr, categoryId,
    yieldQuantity, yieldUnit, notes,
    shelfLifeValue, shelfLifeUnit, shelfLifePlace,
    storageUnit, conversionFactor,
    lines, steps,
  ]);

  function addLine() {
    setLines((prev) => [...prev, blankLine()]);
  }
  function removeLine(idx) {
    setLines((prev) => prev.filter((_, i) => i !== idx));
  }
  function updateLine(idx, patch) {
    setLines((prev) => prev.map((l, i) => (i === idx ? { ...l, ...patch } : l)));
  }

  function handleLinePick(idx, { type, id, row }) {
    if (!type || !id) {
      updateLine(idx, {
        type: null,
        ingredientId: null,
        subRecipeId: null,
        savedUsageUnit: null,
        savedUsageUnitCost: null,
        displayName: "",
      });
      return;
    }
    if (type === "ingredient") {
      updateLine(idx, {
        type: "ingredient",
        ingredientId: id,
        subRecipeId: null,
        savedUsageUnit: null,
        savedUsageUnitCost: null,
        displayName: row.nameEn,
      });
      setLineIngredientCache((prev) => {
        const next = new Map(prev);
        next.set(id, row);
        return next;
      });
    } else {
      updateLine(idx, {
        type: "subRecipe",
        ingredientId: null,
        subRecipeId: id,
        savedUsageUnit: null,
        savedUsageUnitCost: null,
        displayName: row.nameEn,
      });
    }
  }

  function resolveIngredient(idx) {
    const line = lines[idx];
    if (line.type !== "ingredient" || !line.ingredientId) return null;
    return (
      ingredients.find((i) => i.id === line.ingredientId) ||
      lineIngredientCache.get(line.ingredientId)
    );
  }

  function lineLabel(idx) {
    const line = lines[idx];
    if (line.type === "ingredient") {
      const ing = resolveIngredient(idx);
      return ing ? ing.nameEn : line.displayName;
    }
    return line.displayName;
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

  function toggleStepCollapsed(idx) {
    setCollapsedSteps((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  }

  function stepComplete(s) {
    return s.roleIds.length > 0 && s.titleEn.trim() && s.titleAr.trim();
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
      !yieldUnit.trim() ||
      !storageUnit.trim()
    ) {
      setErrors([{ message: t("errorRequiredFields") }]);
      return;
    }

    const convFactor = numeric(conversionFactor);
    if (!convFactor || convFactor <= 0) {
      setErrors([{ message: t("errorConversionFactor") }]);
      return;
    }

    if (lines.length === 0) {
      setErrors([{ message: t("errorNoIngredients") }]);
      return;
    }
    if (steps.length === 0) {
      setErrors([{ message: t("errorNoSteps") }]);
      return;
    }

    const ingredientPayload = [];
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const ing = resolveIngredient(i);
      const payload = buildLinePayload(line, ing);
      if (!payload) {
        setErrors([{ message: t("errorLineIncomplete", { number: i + 1 }) }]);
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
      imageUrl: s.imageUrl || undefined,
      videoUrl: s.videoUrl || undefined,
    }));
    for (let i = 0; i < stepPayload.length; i++) {
      const s = stepPayload[i];
      if (!s.roleIds || s.roleIds.length === 0 || !s.titleEn || !s.titleAr) {
        setErrors([{ message: t("errorStepIncomplete", { number: i + 1 }) }]);
        return;
      }
    }

    const shelfLifeNum = Number(shelfLifeValue);
    if (
      !shelfLifeValue ||
      !Number.isInteger(shelfLifeNum) ||
      shelfLifeNum < 1
    ) {
      setErrors([{ message: t("errorShelfLife") }]);
      return;
    }

    const payload = {
      sku: sku.trim(),
      nameEn: nameEn.trim(),
      nameAr: nameAr.trim(),
      categoryId,
      yieldQuantity: numeric(yieldQuantity),
      yieldUnit: yieldUnit.trim(),
      storageUnit: storageUnit.trim(),
      conversionFactor: numeric(conversionFactor),
      shelfLifeValue: shelfLifeNum,
      shelfLifeUnit,
      shelfLifePlace,
      status: recipe?.status || "DRAFT",
      ingredients: ingredientPayload,
      steps: stepPayload,
    };
    payload.notes = notes.trim() || null;

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
              t("errorGeneric"),
          },
        ]);
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {isUsedAsSubRecipe && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <Trans t={t} i18nKey="subRecipeWarning" components={{ bold: <strong /> }} />
        </div>
      )}

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
            {t("nameEn")}
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
            {t("nameAr")}
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
            {t("sku")}
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
            {t("category")}
          </label>
          <select
            id="e-cat"
            className="w-full rounded-lg border border-stone-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10"
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            required
          >
            <option value="">{t("selectCategory")}</option>
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
            {t("yieldQuantity")}
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
            {t("yieldUnit")}
          </label>
          <input
            id="e-yieldU"
            className={`w-full rounded-lg border px-3 py-2.5 text-sm outline-none ${
              isUsedAsSubRecipe
                ? "border-stone-200 bg-stone-100 text-stone-400 cursor-not-allowed"
                : "border-stone-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10"
            }`}
            value={yieldUnit}
            onChange={(e) => !isUsedAsSubRecipe && setYieldUnit(e.target.value)}
            disabled={isUsedAsSubRecipe}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label
            className="mb-1 block text-sm font-medium text-stone-700"
            htmlFor="e-su"
          >
            {t("storageUnit")}
          </label>
          <input
            id="e-su"
            className="w-full rounded-lg border border-stone-200 px-3 py-2.5 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10"
            value={storageUnit}
            onChange={(e) => setStorageUnit(e.target.value)}
            placeholder={t("storageUnitPlaceholder")}
            required
          />
        </div>
        <div>
          <label
            className="mb-1 block text-sm font-medium text-stone-700"
            htmlFor="e-cf"
          >
            {t("conversionFactor")}
          </label>
          <input
            id="e-cf"
            type="number"
            step="0.0001"
            min="0.0001"
            className="w-full rounded-lg border border-stone-200 px-3 py-2.5 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10"
            value={conversionFactor}
            onChange={(e) => setConversionFactor(e.target.value)}
            placeholder={t("conversionFactorPlaceholder")}
            required
          />
        </div>
      </div>

      <div className="border-t border-stone-200 pt-4">
        <h3 className="mb-3 text-sm font-semibold text-stone-700">
          {t("shelfLife")}
        </h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label
              className="mb-1 block text-sm font-medium text-stone-700"
              htmlFor="e-slv"
            >
              {t("shelfLifeValue")}
            </label>
            <input
              id="e-slv"
              type="number"
              step="1"
              min="1"
              className="w-full rounded-lg border border-stone-200 px-3 py-2.5 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10"
              value={shelfLifeValue}
              onChange={(e) => setShelfLifeValue(e.target.value)}
              placeholder={t("shelfLifeValuePlaceholder")}
              required
            />
          </div>
          <div>
            <label
              className="mb-1 block text-sm font-medium text-stone-700"
              htmlFor="e-slu"
            >
              {t("shelfLifeUnit")}
            </label>
            <select
              id="e-slu"
              className="w-full rounded-lg border border-stone-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10"
              value={shelfLifeUnit}
              onChange={(e) => setShelfLifeUnit(e.target.value)}
              required
            >
              <option value="HOUR">{t("hour")}</option>
              <option value="DAY">{t("day")}</option>
              <option value="WEEK">{t("week")}</option>
              <option value="MONTH">{t("month")}</option>
            </select>
          </div>
          <div>
            <label
              className="mb-1 block text-sm font-medium text-stone-700"
              htmlFor="e-slp"
            >
              {t("shelfLifePlace")}
            </label>
            <select
              id="e-slp"
              className="w-full rounded-lg border border-stone-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10"
              value={shelfLifePlace}
              onChange={(e) => setShelfLifePlace(e.target.value)}
              required
            >
              <option value="ROOM_TEMPERATURE">{t("roomTemperature")}</option>
              <option value="CHILLER">{t("chiller")}</option>
              <option value="FREEZER">{t("freezer")}</option>
            </select>
          </div>
        </div>
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-stone-700">
            {t("ingredientsSection")}
          </h3>
        </div>
        {lines.length === 0 && (
          <p className="rounded-lg border border-dashed border-stone-200 px-4 py-6 text-center text-sm text-stone-400">
            {t("noLines")}
          </p>
        )}
        <div className="space-y-2">
          {lines.map((line, idx) => {
            const ing = resolveIngredient(idx);
            const preview = getLinePreview(line, ing);
            const isSubRecipe = line.type === "subRecipe";

            return (
              <div key={idx} className="rounded-lg border border-stone-200 p-3">
                <div className="grid grid-cols-12 gap-2">
                  <div className="col-span-12 sm:col-span-5">
                    <label className="mb-1 block text-xs font-medium text-stone-500">
                      {isSubRecipe ? (
                        <span className="flex items-center gap-1.5">
                          {t("subRecipe")}
                          {line.subRecipeId && (
                            <Link
                              to={`/recipes/${line.subRecipeId}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-0.5 rounded bg-purple-50 px-1.5 py-0.5 text-[10px] font-medium text-purple-700 hover:bg-purple-100"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {t("open")}
                              <svg
                                className="h-2.5 w-2.5"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth={2}
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25"
                                />
                              </svg>
                            </Link>
                          )}
                        </span>
                      ) : (
                        t("ingredient")
                      )}
                    </label>
                    <UnifiedPicker
                      selectedId={
                        isSubRecipe ? line.subRecipeId : line.ingredientId
                      }
                      selectedType={line.type}
                      selectedLabel={lineLabel(idx)}
                      onPick={(pick) => handleLinePick(idx, pick)}
                      initialIngredients={ingredients}
                    />
                  </div>

                  <div className={`col-span-5 ${showCost ? "sm:col-span-3" : "sm:col-span-6"}`}>
                    <label className="mb-1 block text-xs font-medium text-stone-500">
                      {t("qty")}{preview?.usageUnit ? ` (${preview.usageUnit})` : ""}
                    </label>
                    <input
                      type="number"
                      step="0.001"
                      min="0.001"
                      className="w-full rounded-lg border border-stone-200 px-2.5 py-2 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10"
                      value={line.usageQty}
                      onChange={(e) =>
                        updateLine(idx, { usageQty: e.target.value })
                      }
                      placeholder="0.000"
                      required
                    />
                  </div>

                  {showCost && (
                    <div className="col-span-5 sm:col-span-3">
                      <label className="mb-1 block text-xs font-medium text-stone-500">
                        {t("lineCost")}
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        className="w-full rounded-lg border border-stone-200 bg-stone-50 px-2.5 py-2 text-sm text-green-600 outline-none"
                        value={
                          preview ? preview.lineCost.toFixed(2) : "0.00"
                        }
                        disabled
                        readOnly
                      />
                    </div>
                  )}

                  <div className="col-span-2 flex items-end justify-end sm:col-span-1">
                    <button
                      type="button"
                      onClick={() => removeLine(idx)}
                      className="cursor-pointer rounded-lg p-2 text-stone-400 hover:bg-red-50 hover:text-red-600"
                      title={t("remove")}
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

                {isSubRecipe && (
                  <div className="mt-2 flex gap-3 text-xs text-stone-500">
                    <span>
                      {t("unitLabel")}:{" "}
                      <span className="font-medium text-stone-700">
                        {line.savedUsageUnit || "—"}
                      </span>
                    </span>
                    {showCost && (
                      <span>
                        {t("unitCostLabel")}:{" "}
                        <span className="font-medium text-stone-700">
                          {line.savedUsageUnitCost !== null
                            ? `SAR ${Number(line.savedUsageUnitCost).toFixed(4)}`
                            : t("unitCostPending")}
                        </span>
                      </span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <button
          type="button"
          onClick={addLine}
          className="mt-2 cursor-pointer rounded-lg bg-orange-400 px-3 py-1 text-sm font-medium text-white hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {t("addLine")}
        </button>
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-stone-700">{t("stepsSection")}</h3>
        </div>
        {steps.length === 0 && (
          <p className="rounded-lg border border-dashed border-stone-200 px-4 py-6 text-center text-sm text-stone-400">
            {t("noSteps")}
          </p>
        )}
        <div className="space-y-2">
          {steps.map((step, idx) => {
            const collapsed = collapsedSteps.has(idx);
            const complete = stepComplete(step);
            const titlePreview =
              step.titleEn.trim() ||
              step.titleAr.trim() ||
              t("stepUntitled", { number: idx + 1 });
            const roleCount = step.roleIds.length;
            const mediaCount =
              (step.imageUrl ? 1 : 0) + (step.videoUrl ? 1 : 0);

            return (
              <div
                key={idx}
                className={`overflow-hidden rounded-lg border bg-white transition-colors ${
                  collapsed
                    ? "border-stone-200"
                    : "border-orange-200 ring-1 ring-orange-100"
                }`}
              >
                <button
                  type="button"
                  onClick={() => toggleStepCollapsed(idx)}
                  className="flex w-full cursor-pointer items-center gap-3 px-3 py-2.5 text-left hover:bg-stone-50"
                  aria-expanded={!collapsed}
                >
                  <span
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                      complete
                        ? "bg-green-100 text-green-700"
                        : "bg-orange-100 text-orange-700"
                    }`}
                    title={complete ? t("complete") : t("incomplete")}
                  >
                    {complete ? "✓" : idx + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-sm font-medium text-stone-800">
                        {titlePreview}
                      </span>
                      {roleCount > 0 && (
                        <span className="rounded-full bg-stone-100 px-2 py-0.5 text-[10px] font-medium text-stone-600">
                          {t("rolesBadge", { count: roleCount })}
                        </span>
                      )}
                      {mediaCount > 0 && (
                        <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-medium text-blue-700">
                          {t("mediaBadge", { count: mediaCount })}
                        </span>
                      )}
                      {!complete && (
                        <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-700">
                          {t("incomplete")}
                        </span>
                      )}
                    </div>
                    {collapsed && step.descriptionEn.trim() && (
                      <p className="mt-0.5 truncate text-xs text-stone-500">
                        {step.descriptionEn}
                      </p>
                    )}
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        moveStep(idx, -1);
                      }}
                      disabled={idx === 0}
                      className="cursor-pointer rounded p-1 text-stone-400 hover:bg-stone-100 hover:text-stone-600 disabled:cursor-not-allowed disabled:opacity-30"
                      title={t("moveUp")}
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
                      onClick={(e) => {
                        e.stopPropagation();
                        moveStep(idx, 1);
                      }}
                      disabled={idx === steps.length - 1}
                      className="cursor-pointer rounded p-1 text-stone-400 hover:bg-stone-100 hover:text-stone-600 disabled:cursor-not-allowed disabled:opacity-30"
                      title={t("moveDown")}
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
                      onClick={(e) => {
                        e.stopPropagation();
                        removeStep(idx);
                      }}
                      className="cursor-pointer rounded p-1 text-stone-400 hover:bg-red-50 hover:text-red-600"
                      title={t("remove")}
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
                    <svg
                      className={`h-4 w-4 text-stone-400 transition-transform ${
                        collapsed ? "" : "rotate-180"
                      }`}
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
                  </div>
                </button>
                {!collapsed && (
                  <div className="border-t border-stone-100 p-3">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="col-span-2">
                        <label className="mb-1 block text-xs font-medium text-stone-500">
                          {t("assignedRoles")}
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {roles.map((r) => (
                            <label
                              key={r.id}
                              className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-stone-200 px-3 py-1.5 text-sm hover:bg-stone-50 has-checked:border-orange-500 has-checked:bg-orange-50"
                            >
                              <input
                                type="checkbox"
                                checked={step.roleIds.includes(r.id)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    updateStep(idx, {
                                      roleIds: [...step.roleIds, r.id],
                                    });
                                  } else {
                                    updateStep(idx, {
                                      roleIds: step.roleIds.filter(
                                        (id) => id !== r.id,
                                      ),
                                    });
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
                        <label className="mb-0.5 block text-xs font-medium text-stone-500">
                          {t("stepTitleEn")}
                        </label>
                        <input
                          className="w-full rounded-lg border border-stone-200 px-2.5 py-2 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10"
                          value={step.titleEn}
                          onChange={(e) =>
                            updateStep(idx, { titleEn: e.target.value })
                          }
                          placeholder={t("stepTitleEnPlaceholder")}
                          required
                        />
                      </div>
                      <div>
                        <label className="mb-0.5 block text-xs font-medium text-stone-500">
                          {t("stepTitleAr")}
                        </label>
                        <input
                          dir="rtl"
                          className="w-full rounded-lg border border-stone-200 px-2.5 py-2 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10"
                          value={step.titleAr}
                          onChange={(e) =>
                            updateStep(idx, { titleAr: e.target.value })
                          }
                          placeholder={t("stepTitleArPlaceholder")}
                          required
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="mb-0.5 block text-xs font-medium text-stone-500">
                          {t("stepDescEn")}
                        </label>
                        <textarea
                          rows={2}
                          className="w-full resize-y rounded-lg border border-stone-200 px-2.5 py-2 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10"
                          value={step.descriptionEn}
                          onChange={(e) =>
                            updateStep(idx, { descriptionEn: e.target.value })
                          }
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="mb-0.5 block text-xs font-medium text-stone-500">
                          {t("stepDescAr")}
                        </label>
                        <textarea
                          dir="rtl"
                          rows={2}
                          className="w-full resize-y rounded-lg border border-stone-200 px-2.5 py-2 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10"
                          value={step.descriptionAr}
                          onChange={(e) =>
                            updateStep(idx, { descriptionAr: e.target.value })
                          }
                        />
                      </div>
                      <div className="col-span-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                        <div>
                          <label className="mb-1 block text-xs font-medium text-stone-500">
                            {t("stepImage")}
                          </label>
                          <StepMediaUploader
                            kind="image"
                            value={step.imageUrl}
                            onChange={(url) =>
                              updateStep(idx, { imageUrl: url })
                            }
                            disabled={submitting}
                          />
                        </div>
                        <div>
                          <label className="mb-1 block text-xs font-medium text-stone-500">
                            {t("stepVideo")}
                          </label>
                          <StepMediaUploader
                            kind="video"
                            value={step.videoUrl}
                            onChange={(url) =>
                              updateStep(idx, { videoUrl: url })
                            }
                            disabled={submitting}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <button
          type="button"
          onClick={addStep}
          className="cursor-pointer rounded-lg bg-orange-400 px-8 py-1 text-sm font-medium text-white hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {t("addStep")}
        </button>
      </div>

      <div>
        <label
          className="mb-1 block text-sm font-medium text-stone-700"
          htmlFor="e-notes"
        >
          {t("notes")}
        </label>
        <textarea
          id="e-notes"
          rows={2}
          className="w-full rounded-lg border border-stone-200 px-3 py-2.5 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder={t("notesPlaceholder")}
        />
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="cursor-pointer rounded-lg border border-stone-200 px-4 py-2 text-sm font-medium text-stone-600 hover:bg-stone-50"
        >
          {t("cancel")}
        </button>
        <button
          type="submit"
          disabled={submitting || !isDirty}
          className="cursor-pointer rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? t("saving") : t("save")}
        </button>
      </div>
    </form>
  );
}

export default RecipeEditor;
