import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import client from "../../api/client";
import RecipeEditor from "./components/RecipeEditor";
import DeleteConfirm from "../../components/DeleteConfirm";
import { useAuth } from "../../contexts/useAuth";

function StatusBadge({ status }) {
  const isDraft = status === "DRAFT";
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
        isDraft
          ? "bg-orange-100 text-orange-700"
          : "bg-green-100 text-green-700"
      }`}
    >
      {status}
    </span>
  );
}

function formatCost(cost) {
  return `SAR ${Number(cost).toFixed(4)}`;
}

function lineCost(ing) {
  return (Number(ing.quantity) * Number(ing.usageUnitCost)).toFixed(4);
}

function formatShelfLifeUnit(unit, value) {
  const map = {
    HOUR: { s: "Hour", p: "Hours" },
    DAY: { s: "Day", p: "Days" },
    WEEK: { s: "Week", p: "Weeks" },
    MONTH: { s: "Month", p: "Months" },
  };
  const entry = map[unit];
  if (!entry) return unit;
  return value === 1 ? entry.s : entry.p;
}

function formatShelfLifePlace(place) {
  const map = {
    ROOM_TEMPERATURE: "Room Temperature",
    CHILLER: "Chiller",
    FREEZER: "Freezer",
  };
  return map[place] || place;
}

function RecipeViewPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
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
        if (!cancelled) setError("Failed to load recipe");
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
        if (!cancelled) setError("Failed to load editor data");
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
      setError(err.response?.data?.message || "Failed to update status");
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
      .catch(() => setError("Failed to load recipe"));
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
    return <div className="rounded-xl bg-red-50 p-4 text-red-600">{error}</div>;
  }

  if (!recipe) {
    return (
      <div className="rounded-xl bg-white p-12 text-center shadow-sm">
        <p className="text-stone-400">Recipe not found</p>
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
            Back to Recipes
          </button>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-stone-800">
              {recipe.nameEn}
            </h1>
            <StatusBadge status={recipe.status} />
          </div>
          <p className="mt-1 text-stone-500">{recipe.nameAr}</p>
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
                  ? "Updating..."
                  : recipe.status === "DRAFT"
                    ? "Mark as Closed"
                    : "Reopen"}
              </button>
            )}

            {recipe.status !== "CLOSED" && (
              <button
                onClick={() => setEditing(true)}
                className="cursor-pointer rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-600"
              >
                Edit Recipe
              </button>
            )}
            <button
              onClick={() => setDeleteTarget(true)}
              className="cursor-pointer rounded-lg p-2 text-stone-400 hover:bg-red-50 hover:text-red-600"
              title="Delete"
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
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
            
            <div className="rounded-xl bg-white p-4 shadow-sm">
              <p className="text-xs uppercase tracking-wider text-stone-400">
                Category
              </p>
              <p className="mt-1 font-medium text-stone-800">
                {recipe.category?.nameEn || "—"}
              </p>
              {recipe.category?.nameAr && (
                <p className="text-sm text-stone-500" dir="rtl">
                  {recipe.category.nameAr}
                </p>
              )}
            </div>
            <div className="rounded-xl bg-white p-4 shadow-sm">
              <p className="text-xs uppercase tracking-wider text-stone-400">
                Yield
              </p>
              <p className="mt-1 font-medium text-stone-800">
                {Number(recipe.yieldQuantity)} {recipe.yieldUnit}
              </p>
            </div>
            <div className="rounded-xl bg-white p-4 shadow-sm">
              <p className="text-xs uppercase tracking-wider text-stone-400">
                Shelf Life
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
                  {formatShelfLifePlace(recipe.shelfLifePlace)}
                </p>
              </div>
            </div>
            <div className="rounded-xl bg-white p-4 shadow-sm">
              <p className="text-xs uppercase tracking-wider text-stone-400">
                Total Cost
              </p>
              <p className="mt-1 font-mono text-lg font-semibold text-green-600">
                {formatCost(recipe.totalCost)}
              </p>
            </div>
          </div>

          {recipe.notes && (
            <div className="rounded-xl bg-white p-5 shadow-sm">
              <h2 className="mb-2 text-sm font-semibold text-stone-700">
                Notes
              </h2>
              <p className="whitespace-pre-wrap text-sm text-stone-600">
                {recipe.notes}
              </p>
            </div>
          )}

          <div className="rounded-xl bg-white shadow-sm">
            <div className="border-b border-stone-100 px-5 py-3">
              <h2 className="text-sm font-semibold text-stone-700">
                Ingredients ({recipe.ingredients.length})
              </h2>
            </div>
            {recipe.ingredients.length === 0 ? (
              <p className="px-5 py-8 text-center text-sm text-stone-400">
                No ingredients
              </p>
            ) : (
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-stone-100 bg-stone-50">
                    <th className="px-5 py-2.5 font-medium text-stone-500">
                      Ingredient
                    </th>
                    <th className="whitespace-nowrap px-4 py-2.5 font-medium text-stone-500">
                      Quantity
                    </th>
                    <th className="whitespace-nowrap px-4 py-2.5 font-medium text-stone-500">
                      Usage Unit Cost
                    </th>
                    <th className="whitespace-nowrap px-4 py-2.5 text-center font-medium text-stone-500">
                      Cost
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {recipe.ingredients.map((ing) => (
                    <tr
                      key={ing.id}
                      className="border-b border-stone-100 last:border-0"
                    >
                      <td className="px-5 py-3">
                        <div className="font-medium text-stone-800">
                          {ing.ingredient?.nameEn}
                        </div>
                        <div className="text-xs text-stone-500" dir="rtl">
                          {ing.ingredient?.nameAr}
                        </div>
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
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div className="rounded-xl bg-white shadow-sm">
            <div className="border-b border-stone-100 px-5 py-3">
              <h2 className="text-sm font-semibold text-stone-700">
                Steps ({visibleSteps.length})
              </h2>
            </div>
            {visibleSteps.length === 0 ? (
              <p className="px-5 py-8 text-center text-sm text-stone-400">
                No steps
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
                            {step.titleEn}
                          </h3>
                          <span className="text-sm text-stone-500" dir="rtl">
                            {step.titleAr}
                          </span>
                          {step.roles?.map((sr) => (
                            <span
                              key={sr.role.id}
                              className="inline-flex items-center rounded-full bg-stone-100 px-2 py-0.5 text-xs font-medium text-stone-600"
                            >
                              {sr.role.nameEn}
                            </span>
                          ))}
                        </div>
                        <p className="mt-1 text-sm text-stone-600">
                          {step.descriptionEn}
                        </p>
                        <p className="mt-0.5 text-sm text-stone-500" dir="rtl">
                          {step.descriptionAr}
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
          name={recipe.nameEn}
          title="Delete Recipe"
          onClose={() => setDeleteTarget(false)}
          onSuccess={handleDeleted}
        />
      )}
    </div>
  );
}

export default RecipeViewPage;
