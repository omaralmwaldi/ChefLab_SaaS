import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import client from "../../api/client";
import RecipeEditor from "./components/RecipeEditor";
import DeleteConfirm from "../../components/DeleteConfirm";
import { useAuth } from "../../contexts/useAuth";
import { pick } from "../../utils/pick";

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

function formatCost(cost) {
  return `SAR ${Number(cost).toFixed(4)}`;
}

function formatCostPerStorageUnit(cost, unit) {
  return `SAR ${Number(cost).toFixed(4)} / ${unit}`;
}

function lineCost(ing) {
  return (Number(ing.quantity) * Number(ing.usageUnitCost)).toFixed(4);
}

function formatDateTime(dateStr) {
  if (!dateStr) return null;
  return new Date(dateStr).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatShelfLifeUnit(unit, value, t) {
  const map = {
    HOUR: { s: "hour", p: "hours" },
    DAY: { s: "day", p: "days" },
    WEEK: { s: "week", p: "weeks" },
    MONTH: { s: "month", p: "months" },
  };
  const entry = map[unit];
  if (!entry) return unit;
  return t(value === 1 ? entry.s : entry.p);
}

function formatShelfLifePlace(place, t) {
  const map = {
    ROOM_TEMPERATURE: "roomTemperature",
    CHILLER: "chiller",
    FREEZER: "freezer",
  };
  return map[place] ? t(map[place]) : place;
}

function RecipeViewPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t, i18n } = useTranslation("recipes");
  const lang = i18n.language === "ar" ? "ar" : "en";
  const [recipe, setRecipe] = useState(null);
  const [categories, setCategories] = useState([]);
  const [ingredients, setIngredients] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(false);
  const [statusBusy, setStatusBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    client
      .get(`/recipes/${id}`)
      .then((res) => {
        if (!cancelled) setRecipe(res.data);
      })
      .catch(() => {
        if (!cancelled) setError("errorLoad");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      client.get("/categories"),
      client.get("/ingredients"),
      client.get("/roles"),
    ])
      .then(([c, i, r]) => {
        if (cancelled) return;
        setCategories(c.data);
        setIngredients(i.data);
        setRoles(r.data);
      })
      .catch(() => {
        if (!cancelled) setError("errorLoadEditor");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function toggleStatus() {
    if (!recipe) return;
    const next = recipe.status === "DRAFT" ? "CLOSED" : "DRAFT";
    setStatusBusy(true);
    try {
      const res = await client.put(`/recipes/${recipe.id}`, { status: next });
      setRecipe(res.data);
    } catch (err) {
      setError(err.response?.data?.message || "errorLoad");
    } finally {
      setStatusBusy(false);
    }
  }

  async function handleSave(payload) {
    const res = await client.put(`/recipes/${recipe.id}`, payload);
    setRecipe(res.data);
    setEditing(false);
  }

  function handleCancelEdit() {
    setEditing(false);
    reload();
  }

  function reload() {
    client
      .get(`/recipes/${id}`)
      .then((res) => setRecipe(res.data))
      .catch(() => setError("errorLoad"));
  }

  function handleDeleted() {
    navigate("/recipes");
  }

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

  if (!recipe) {
    return (
      <div className="rounded-xl bg-white p-12 text-center shadow-sm">
        <p className="text-stone-400">{t("errorLoad")}</p>
      </div>
    );
  }

  const visibleSteps = recipe.steps.filter((step) =>
    step.roles?.some((sr) => sr.role.id === user?.roleId),
  );

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <button
            onClick={() => navigate("/recipes")}
            className="mb-3 flex cursor-pointer items-center gap-1 text-sm text-stone-500 hover:text-stone-700"
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
                d="M15.75 19.5L8.25 12l7.5-7.5"
              />
            </svg>
            {t("backToRecipes")}
          </button>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-stone-800">
              {pick(recipe, "name", lang)}
            </h1>
            <StatusBadge status={recipe.status} />
          </div>
          <p className="mt-1 font-mono text-xs text-stone-400">{recipe.sku}</p>
        </div>
        {!editing && (
          <div className="flex shrink-0 items-center gap-2">
            {recipe.ingredients.length > 0 && (
              <button
                onClick={toggleStatus}
                disabled={statusBusy}
                className="cursor-pointer rounded-lg border border-stone-200 px-3 py-2 text-sm font-medium text-stone-600 hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {statusBusy
                  ? t("updatingStatus")
                  : recipe.status === "DRAFT"
                    ? t("markAsClosed")
                    : t("reopen")}
              </button>
            )}

            {recipe.status !== "CLOSED" && (
              <button
                onClick={() => setEditing(true)}
                className="cursor-pointer rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-600"
              >
                {t("editRecipe")}
              </button>
            )}
            <button
              onClick={() => setDeleteTarget(true)}
              className="cursor-pointer rounded-lg p-2 text-stone-400 hover:bg-red-50 hover:text-red-600"
              title={t("common:delete")}
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
                  d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 0 00-7.5 0"
                />
              </svg>
            </button>
          </div>
        )}
      </div>

      {editing ? (
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <RecipeEditor
            recipe={recipe}
            categories={categories}
            ingredients={ingredients}
            roles={roles}
            onCancel={handleCancelEdit}
            onSave={handleSave}
          />
        </div>
      ) : (
        <>
          <div className="rounded-xl bg-white p-4 shadow-sm">
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-stone-400">
              {t("recipeMetadata")}
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-stone-400">{t("createdBy")}</p>
                <p className="mt-0.5 font-medium text-stone-800">
                  {recipe.createdByUser?.name ?? t("deletedUser")}
                </p>
              </div>
              <div>
                <p className="text-xs text-stone-400">{t("createdAt")}</p>
                <p className="mt-0.5 font-medium text-stone-800">
                  {formatDateTime(recipe.createdAt) || "—"}
                </p>
              </div>
              <div>
                <p className="text-xs text-stone-400">{t("lastEditedBy")}</p>
                <p className="mt-0.5 font-medium text-stone-800">
                  {recipe.lastEditedByUser
                    ? (recipe.lastEditedByUser.name ?? t("deletedUser"))
                    : "—"}
                </p>
              </div>
              <div>
                <p className="text-xs text-stone-400">{t("lastEditedAt")}</p>
                <p className="mt-0.5 font-medium text-stone-800">
                  {recipe.lastEditedAt
                    ? formatDateTime(recipe.lastEditedAt)
                    : t("neverEdited")}
                </p>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-xl bg-white p-4 shadow-sm">
              <p className="text-xs uppercase tracking-wider text-stone-400">
                {t("yield")}
              </p>
              <p className="mt-1 font-medium text-stone-800">
                {Number(recipe.yieldQuantity)} {recipe.yieldUnit}
              </p>
            </div>
            <div className="rounded-xl bg-white p-4 shadow-sm">
              <p className="text-xs uppercase tracking-wider text-stone-400">
                {t("shelfLife")}
              </p>
              <div className="mt-1 flex items-center gap-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="size-4"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5"
                  />
                </svg>

                <p className="font-medium text-stone-800">
                  {recipe.shelfLifeValue}{" "}
                  {formatShelfLifeUnit(
                    recipe.shelfLifeUnit,
                    recipe.shelfLifeValue,
                    t,
                  )}
                </p>
              </div>
              <div className="mt-1 flex items-center gap-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="size-4"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="m20.25 7.5-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z"
                  />
                </svg>

                <p className="font-medium text-stone-800">
                  {formatShelfLifePlace(recipe.shelfLifePlace, t)}
                </p>
              </div>
            </div>
            <div className="rounded-xl bg-white p-4 shadow-sm">
              <p className="text-xs uppercase tracking-wider text-stone-400">
                {t("totalCost")}
              </p>
              <p className="mt-1 font-mono text-lg font-semibold text-green-600">
                {formatCost(recipe.totalCost)}
              </p>
              <p className="mt-3 text-xs uppercase tracking-wider text-stone-400">
                {t("costPerStorageUnit")}
              </p>
              <p className="mt-1 font-mono text-lg font-semibold text-green-600">
                {recipe.costPerStorageUnit !== undefined && recipe.costPerStorageUnit !== null
                  ? formatCostPerStorageUnit(recipe.costPerStorageUnit, recipe.storageUnit)
                  : "—"}
              </p>
            </div>
          </div>

          {recipe.notes && (
            <div className="rounded-xl bg-white p-5 shadow-sm">
              <h2 className="mb-2 text-sm font-semibold text-stone-700">
                {t("notesHeading")}
              </h2>
              <p className="whitespace-pre-wrap text-sm text-stone-600">
                {recipe.notes}
              </p>
            </div>
          )}

          <div className="rounded-xl bg-white shadow-sm">
            <div className="border-b border-stone-100 px-5 py-3">
              <h2 className="text-sm font-semibold text-stone-700">
                {t("ingredientsCount", { count: recipe.ingredients.length })}
              </h2>
            </div>
            {recipe.ingredients.length === 0 ? (
              <p className="px-5 py-8 text-center text-sm text-stone-400">
                {t("noIngredients")}
              </p>
            ) : (
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-stone-100 bg-stone-50">
                    <th className="px-5 py-2.5 font-medium text-stone-500">
                      {t("ingredient")}
                    </th>
                    <th className="whitespace-nowrap px-4 py-2.5 font-medium text-stone-500">
                      {t("quantity")}
                    </th>
                    <th className="whitespace-nowrap px-4 py-2.5 font-medium text-stone-500">
                      {t("ingredients.usageUnitCost")}
                    </th>
                    <th className="whitespace-nowrap px-4 py-2.5 text-center font-medium text-stone-500">
                      {t("common.cost")}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {recipe.ingredients.map((ing) => {
                    const isSubRecipe = !!ing.subRecipeId;
                    return (
                      <tr
                        key={ing.id}
                        className="border-b border-stone-100 last:border-0"
                      >
                        <td className="px-5 py-3">
                          {isSubRecipe ? (
                            <div className="flex items-center gap-2">
                              <span className="rounded bg-purple-50 px-1.5 py-0.5 text-[10px] font-medium text-purple-700">
                                {t("recipeLabel")}
                              </span>
                              <Link
                                to={`/recipes/${ing.subRecipe?.id}`}
                                className="font-medium text-purple-700 hover:underline"
                              >
                                {pick(ing.subRecipe, "name", lang)}
                              </Link>
                            </div>
                          ) : (
                            <div className="font-medium text-stone-800">
                              {pick(ing.ingredient, "name", lang)}
                            </div>
                          )}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 font-mono text-stone-700">
                          {Number(ing.quantity)} {ing.usageUnit}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 font-mono text-stone-600">
                          SAR {Number(ing.usageUnitCost).toFixed(4)}/
                          {ing.usageUnit}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-center font-mono text-stone-800">
                          SAR {lineCost(ing)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          <div className="rounded-xl bg-white shadow-sm">
            <div className="border-b border-stone-100 px-5 py-3">
              <h2 className="text-sm font-semibold text-stone-700">
                {t("stepsCount", { count: visibleSteps.length })}
              </h2>
            </div>
            {visibleSteps.length === 0 ? (
              <p className="px-5 py-8 text-center text-sm text-stone-400">
                {t("noStepsView")}
              </p>
            ) : (
              <ol className="divide-y divide-stone-100">
                {visibleSteps.map((step) => (
                  <li key={step.id} className="px-5 py-4">
                    <div className="flex items-start gap-3">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-orange-100 text-sm font-semibold text-orange-700">
                        {step.stepOrder + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-medium text-stone-800">
                            {pick(step, "title", lang)}
                          </h3>
                          {step.roles?.map((sr) => (
                            <span
                              key={sr.role.id}
                              className="inline-flex items-center rounded-full bg-stone-100 px-2 py-0.5 text-xs font-medium text-stone-600"
                            >
                              {pick(sr.role, "name", lang)}
                            </span>
                          ))}
                        </div>
                        <p className="mt-1 text-sm text-stone-600">
                          {pick(step, "description", lang)}
                        </p>
                        {step.imageUrl && (
                          <img
                            src={step.imageUrl}
                            alt=""
                            className="mt-5 max-h-100 rounded-lg border border-stone-200 object-cover"
                          />
                        )}
                        {step.videoUrl && (
                          <video
                            src={step.videoUrl}
                            controls
                            className="mt-2 max-h-64 w-full rounded-lg border border-stone-200"
                          />
                        )}
                      </div>
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </div>
        </>
      )}

      {deleteTarget && (
        <DeleteConfirm
          apiUrl={`/recipes/${recipe.id}`}
          name={pick(recipe, "name", lang)}
          title={t("deleteRecipe")}
          onClose={() => setDeleteTarget(false)}
          onSuccess={handleDeleted}
        />
      )}
    </div>
  );
}

export default RecipeViewPage;
