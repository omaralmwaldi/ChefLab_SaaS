import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import client from "../../../api/client";
import { pick } from "../../../utils/pick";
import { EMPTY_FILTERS } from "./recipeFilters";

// Filter modal shell. Local draft holds all criteria; Apply lifts the draft to
// the parent, Reset returns the full list, Cancel discards. Category proves the
// pipeline the later dimensions plug into.
function RecipeFilterModal({ initial, onApply, onReset, onClose }) {
  const { t, i18n } = useTranslation("recipes");
  const lang = i18n.language === "ar" ? "ar" : "en";
  const [q, setQ] = useState(initial.q ?? "");
  const [sku, setSku] = useState(initial.sku ?? "");
  const [categoryId, setCategoryId] = useState(initial.categoryId ?? []);
  const [status, setStatus] = useState(initial.status ?? "");
  const [createdBy, setCreatedBy] = useState(initial.createdBy ?? "");
  const [shelfLifePlace, setShelfLifePlace] = useState(
    initial.shelfLifePlace ?? [],
  );
  const [categories, setCategories] = useState([]);
  const [authors, setAuthors] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    Promise.all([client.get("/categories"), client.get("/recipes/authors")])
      .then(([catRes, authorRes]) => {
        if (!cancelled) {
          setCategories(catRes.data);
          setAuthors(authorRes.data);
        }
      })
      .catch(() => {
        if (!cancelled) setError(t("errorLoadCategories"));
      })
      .finally(() => {
        if (!cancelled) setLoadingData(false);
      });
    return () => {
      cancelled = true;
    };
  }, [t]);

  function toggleCategory(id) {
    setCategoryId((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  function toggleShelfLifePlace(place) {
    setShelfLifePlace((prev) =>
      prev.includes(place)
        ? prev.filter((x) => x !== place)
        : [...prev, place],
    );
  }

  function handleApply() {
    onApply({
      q: q.trim(),
      sku: sku.trim(),
      categoryId,
      status,
      createdBy,
      shelfLifePlace,
    });
  }

  function handleReset() {
    setQ(EMPTY_FILTERS.q);
    setSku(EMPTY_FILTERS.sku);
    setCategoryId([...EMPTY_FILTERS.categoryId]);
    setStatus(EMPTY_FILTERS.status);
    setCreatedBy(EMPTY_FILTERS.createdBy);
    setShelfLifePlace([...EMPTY_FILTERS.shelfLifePlace]);
    onReset();
  }

  const SHELF_LIFE_PLACES = [
    { value: "ROOM_TEMPERATURE", key: "roomTemperature" },
    { value: "CHILLER", key: "chiller" },
    { value: "FREEZER", key: "freezer" },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-xl bg-white p-6 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-bold text-stone-800">
            {t("filterTitle")}
          </h2>
          <button
            onClick={onClose}
            className="cursor-pointer rounded-lg p-1 text-stone-400 hover:bg-stone-100 hover:text-stone-600"
          >
            <svg
              className="h-5 w-5"
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
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
            {error}
          </div>
        )}

        <div className="mb-4">
          <label className="mb-1 block text-sm font-medium text-stone-700">
            {t("filterName")}
          </label>
          <input
            type="text"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t("filterNamePlaceholder")}
            className="w-full rounded-lg border border-stone-200 px-3 py-2.5 text-sm text-stone-700 outline-none focus:border-orange-400"
          />
        </div>

        <div className="mb-4">
          <label className="mb-1 block text-sm font-medium text-stone-700">
            {t("filterSku")}
          </label>
          <input
            type="text"
            value={sku}
            onChange={(e) => setSku(e.target.value)}
            placeholder={t("filterSkuPlaceholder")}
            className="w-full rounded-lg border border-stone-200 px-3 py-2.5 text-sm text-stone-700 outline-none focus:border-orange-400"
          />
        </div>

        {loadingData ? (
          <div className="flex items-center justify-center py-10">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-stone-300 border-t-orange-500" />
          </div>
        ) : (
          <div>
            <label className="mb-1 block text-sm font-medium text-stone-700">
              {t("category")}
            </label>
            <p className="mb-2 text-xs text-stone-400">
              {t("filterCategoryHint")}
            </p>
            {categories.length === 0 ? (
              <p className="rounded-lg border border-stone-200 px-3 py-2.5 text-sm text-stone-400">
                {t("selectCategory")}
              </p>
            ) : (
              <div className="max-h-56 space-y-1 overflow-auto rounded-lg border border-stone-200 p-2">
                {categories.map((c) => {
                  const checked = categoryId.includes(c.id);
                  return (
                    <label
                      key={c.id}
                      className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm text-stone-700 hover:bg-stone-50"
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleCategory(c.id)}
                        className="h-4 w-4 accent-orange-500"
                      />
                      {pick(c, "name", lang)}
                    </label>
                  );
                })}
              </div>
            )}
          </div>
        )}

        <div className="mt-4">
          <label className="mb-1 block text-sm font-medium text-stone-700">
            {t("filterStatus")}
          </label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full rounded-lg border border-stone-200 px-3 py-2.5 text-sm text-stone-700 outline-none focus:border-orange-400"
          >
            <option value="">{t("filterStatusAny")}</option>
            <option value="DRAFT">{t("draft")}</option>
            <option value="CLOSED">{t("closed")}</option>
          </select>
        </div>

        <div className="mt-4">
          <label className="mb-1 block text-sm font-medium text-stone-700">
            {t("filterCreatedBy")}
          </label>
          <select
            value={createdBy}
            onChange={(e) => setCreatedBy(e.target.value)}
            className="w-full rounded-lg border border-stone-200 px-3 py-2.5 text-sm text-stone-700 outline-none focus:border-orange-400"
          >
            <option value="">{t("filterCreatedByAny")}</option>
            {authors.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
        </div>

        <div className="mt-4">
          <label className="mb-1 block text-sm font-medium text-stone-700">
            {t("filterShelfLifePlace")}
          </label>
          <div className="space-y-1 rounded-lg border border-stone-200 p-2">
            {SHELF_LIFE_PLACES.map((p) => (
              <label
                key={p.value}
                className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm text-stone-700 hover:bg-stone-50"
              >
                <input
                  type="checkbox"
                  checked={shelfLifePlace.includes(p.value)}
                  onChange={() => toggleShelfLifePlace(p.value)}
                  className="h-4 w-4 accent-orange-500"
                />
                {t(p.key)}
              </label>
            ))}
          </div>
        </div>

        <div className="flex justify-between gap-3 pt-5">
          <button
            type="button"
            onClick={() => {
              handleReset();
              onClose();
            }}
            className="cursor-pointer rounded-lg border border-stone-200 px-4 py-2 text-sm font-medium text-stone-600 hover:bg-stone-50"
          >
            {t("reset")}
          </button>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="cursor-pointer rounded-lg border border-stone-200 px-4 py-2 text-sm font-medium text-stone-600 hover:bg-stone-50"
            >
              {t("cancel")}
            </button>
            <button
              type="button"
              onClick={handleApply}
              disabled={loadingData}
              className="cursor-pointer rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {t("apply")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default RecipeFilterModal;
