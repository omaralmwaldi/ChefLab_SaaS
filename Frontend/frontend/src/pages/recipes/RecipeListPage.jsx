import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { listRecipes } from "../../api/recipes";
import RecipeModal from "./components/RecipeModal";
import RecipeFilterModal from "./components/RecipeFilterModal";
import {
  countActiveFilters,
  loadFilters,
  saveFilters,
  EMPTY_FILTERS,
} from "./components/recipeFilters";
import DeleteConfirm from "../../components/DeleteConfirm";
import Can from "../../components/Can";
import { usePermissions } from "../../contexts/usePermissions";
import { PERMISSIONS } from "../../constants/permissions";
import { pick } from "../../utils/pick";

function formatCost(cost) {
  const n = Number(cost);
  return `SAR ${n.toFixed(2)}`;
}

function formatYield(yieldQuantity, yieldUnit) {
  return `${Number(yieldQuantity).toString()} ${yieldUnit}`;
}

function StatusBadge({ status }) {
  const { t } = useTranslation("recipes");
  const isDraft = status === "DRAFT";
  const label = isDraft ? t("draft") : t("closed");
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
        isDraft
          ? "bg-orange-100 text-orange-700"
          : "bg-green-100 text-green-700"
      }`}
    >
      {label}
    </span>
  );
}

function RecipeListPage() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation("recipes");
  const lang = i18n.language === "ar" ? "ar" : "en";
  const { can } = usePermissions();
  const showCost = can(PERMISSIONS.COSTS_VIEW);
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [creating, setCreating] = useState(false);
  const [filtering, setFiltering] = useState(false);
  const [filters, setFilters] = useState(loadFilters);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const activeFilters = countActiveFilters(filters);

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();
    listRecipes({ ...filters, signal: controller.signal })
      .then((data) => {
        if (!cancelled) setRecipes(data);
      })
      .catch((err) => {
        if (!cancelled && err.name !== "CanceledError")
          setError("errorLoadList");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [filters]);

  function reload() {
    listRecipes(filters)
      .then(setRecipes)
      .catch(() => setError("errorLoadList"));
  }

  function applyFilters(next) {
    saveFilters(next);
    setError("");
    setLoading(true);
    setFilters(next);
    setFiltering(false);
  }

  function resetFilters() {
    const cleared = { ...EMPTY_FILTERS };
    saveFilters(cleared);
    setError("");
    setFilters(cleared);
  }

  function handleCreated() {
    setCreating(false);
    reload();
  }
  function handleDeleted() {
    setDeleteTarget(null);
    reload();
  }

  function openView(id) {
    navigate(`/recipes/${id}`);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-stone-300 border-t-orange-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl bg-red-50 p-4 text-red-600">{t(error)}</div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-stone-500">
          {t("recipeCount", { count: recipes.length })}
        </p>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setFiltering(true)}
            className="relative flex cursor-pointer items-center gap-2 rounded-lg border border-stone-200 px-4 py-2 text-sm font-medium text-stone-600 hover:bg-stone-50"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L14 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 018 21v-7.586L3.293 6.707A1 1 0 013 6V4z"
              />
            </svg>
            {t("filter")}
            {activeFilters > 0 && (
              <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-orange-500 px-1.5 text-xs font-semibold text-white">
                {activeFilters}
              </span>
            )}
          </button>
          <Can permission={PERMISSIONS.RECIPES_CREATE}>
          <button
            onClick={() => setCreating(true)}
            className="flex cursor-pointer items-center gap-2 rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-600"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 4v16m8-8H4"
              />
            </svg>
            {t("addRecipe")}
          </button>
        </Can>
        </div>
      </div>

      {recipes.length === 0 ? (
        <div className="rounded-xl bg-white p-12 text-center shadow-sm">
          <p className="text-stone-400">
            {activeFilters > 0 ? t("noFilterMatches") : t("noRecipesYet")}
          </p>
        </div>
      ) : (
        <div className="max-h-[calc(100vh-16rem)] overflow-auto rounded-xl bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="sticky top-0 z-10">
              <tr className="border-b border-stone-100 bg-stone-50">
                <th className="whitespace-nowrap px-4 py-3 font-medium text-stone-500">
                  {t("sku")}
                </th>
                <th className="whitespace-nowrap px-4 py-3 font-medium text-stone-500">
                  {t("common.name")}
                </th>
                <th className="whitespace-nowrap px-4 py-3 font-medium text-stone-500">
                  {t("category")}
                </th>
                <th className="whitespace-nowrap px-4 py-3 font-medium text-stone-500">
                  {t("yield")}
                </th>
                {showCost && (
                  <th className="whitespace-nowrap px-4 py-3 font-medium text-stone-500">
                    {t("common.cost")}
                  </th>
                )}
                <th className="whitespace-nowrap px-4 py-3 font-medium text-stone-500">
                  {t("status")}
                </th>
                <th className="whitespace-nowrap px-4 py-3 font-medium text-stone-500">
                  {t("common.actions")}
                </th>
              </tr>
            </thead>
            <tbody>
              {recipes.map((r) => (
                <tr
                  key={r.id}
                  onClick={() => openView(r.id)}
                  className="cursor-pointer border-b border-stone-100 last:border-0 hover:bg-stone-50"
                >
                  <td className="whitespace-nowrap px-4 py-3.5 font-mono text-xs text-stone-600">
                    {r.sku}
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="font-medium text-stone-800">
                      {pick(r, "name", lang)}
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3.5 text-stone-600">
                    {r.category ? pick(r.category, "name", lang) : "—"}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3.5 text-stone-600">
                    {formatYield(r.yieldQuantity, r.yieldUnit)}
                  </td>
                  {showCost && (
                    <td className="whitespace-nowrap px-4 py-3.5 font-mono text-stone-700">
                      {formatCost(r.totalCost)}
                    </td>
                  )}
                  <td className="whitespace-nowrap px-4 py-3.5">
                    <StatusBadge status={r.status} />
                  </td>
                  <td
                    className="whitespace-nowrap px-4 py-3.5"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="items-center gap-1">
                      <button
                        onClick={() => openView(r.id)}
                        className="cursor-pointer rounded-lg p-1.5 text-stone-400 hover:bg-stone-100 hover:text-orange-600"
                        title={t("common.view")}
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
                            d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                        </svg>
                      </button>
                      <Can permission={PERMISSIONS.RECIPES_DELETE}>
                        <button
                          onClick={() => setDeleteTarget(r)}
                          className="cursor-pointer rounded-lg p-1.5 text-stone-400 hover:bg-stone-100 hover:text-orange-600"
                          title={t("common.delete")}
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
                              d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
                            />
                          </svg>
                        </button>
                      </Can>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {creating && (
        <RecipeModal
          onClose={() => setCreating(false)}
          onSuccess={handleCreated}
        />
      )}
      {filtering && (
        <RecipeFilterModal
          initial={filters}
          onApply={applyFilters}
          onReset={resetFilters}
          onClose={() => setFiltering(false)}
        />
      )}
      {deleteTarget && (
        <DeleteConfirm
          apiUrl={`/recipes/${deleteTarget.id}`}
          name={pick(deleteTarget, "name", lang)}
          title={t("deleteRecipe")}
          onClose={() => setDeleteTarget(null)}
          onSuccess={handleDeleted}
        />
      )}
    </div>
  );
}

export default RecipeListPage;
