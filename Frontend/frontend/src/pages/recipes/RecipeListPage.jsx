import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import client from "../../api/client";
import RecipeModal from "./components/RecipeModal";
import DeleteConfirm from "../../components/DeleteConfirm";
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
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
      isDraft ? "bg-orange-100 text-orange-700" : "bg-green-100 text-green-700"
    }`}>
      {label}
    </span>
  );
}

function RecipeListPage() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation("recipes");
  const lang = i18n.language === "ar" ? "ar" : "en";
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [creating, setCreating] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  useEffect(() => {
    let cancelled = false;
    client.get("/recipes")
      .then((res) => { if (!cancelled) setRecipes(res.data); })
      .catch(() => { if (!cancelled) setError("errorLoadList"); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  function reload() {
    client.get("/recipes")
      .then((res) => setRecipes(res.data))
      .catch(() => setError("errorLoadList"));
  }

  function handleCreated() { setCreating(false); reload(); }
  function handleDeleted() { setDeleteTarget(null); reload(); }

  function openView(id) { navigate(`/recipes/${id}`); }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-stone-300 border-t-orange-500" />
      </div>
    );
  }

  if (error) {
    return <div className="rounded-xl bg-red-50 p-4 text-red-600">{t(error)}</div>;
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <p className="text-sm text-stone-500">{t("recipeCount", { count: recipes.length })}</p>
        <button
          onClick={() => setCreating(true)}
          className="flex cursor-pointer items-center gap-2 rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-600"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          {t("addRecipe")}
        </button>
      </div>

      {recipes.length === 0 ? (
        <div className="rounded-xl bg-white p-12 text-center shadow-sm">
          <p className="text-stone-400">{t("noRecipesYet")}</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-stone-100 bg-stone-50">
                <th className="whitespace-nowrap px-4 py-3 font-medium text-stone-500">{t("sku")}</th>
                <th className="whitespace-nowrap px-4 py-3 font-medium text-stone-500">{t("common:name")}</th>
                <th className="whitespace-nowrap px-4 py-3 font-medium text-stone-500">{t("category")}</th>
                <th className="whitespace-nowrap px-4 py-3 font-medium text-stone-500">{t("yield")}</th>
                <th className="whitespace-nowrap px-4 py-3 font-medium text-stone-500">{t("common:cost")}</th>
                <th className="whitespace-nowrap px-4 py-3 font-medium text-stone-500">{t("status")}</th>
                <th className="whitespace-nowrap px-4 py-3 font-medium text-stone-500">{t("common:actions")}</th>
              </tr>
            </thead>
            <tbody>
              {recipes.map((r) => (
                <tr
                  key={r.id}
                  onClick={() => openView(r.id)}
                  className="cursor-pointer border-b border-stone-100 last:border-0 hover:bg-stone-50"
                >
                  <td className="whitespace-nowrap px-4 py-3.5 font-mono text-xs text-stone-600">{r.sku}</td>
                  <td className="px-4 py-3.5">
                    <div className="font-medium text-stone-800">{pick(r, "name", lang)}</div>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3.5 text-stone-600">
                    {r.category ? pick(r.category, "name", lang) : "—"}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3.5 text-stone-600">
                    {formatYield(r.yieldQuantity, r.yieldUnit)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3.5 font-mono text-stone-700">
                    {formatCost(r.totalCost)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3.5">
                    <StatusBadge status={r.status} />
                  </td>
                  <td className="whitespace-nowrap px-4 py-3.5" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openView(r.id)}
                        className="cursor-pointer rounded-lg p-1.5 text-stone-400 hover:bg-stone-100 hover:text-orange-600"
                        title={t("common:view")}
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => setDeleteTarget(r)}
                        className="cursor-pointer rounded-lg p-1.5 text-stone-400 hover:bg-stone-100 hover:text-red-600"
                        title={t("common:delete")}
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {creating && (
        <RecipeModal onClose={() => setCreating(false)} onSuccess={handleCreated} />
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
