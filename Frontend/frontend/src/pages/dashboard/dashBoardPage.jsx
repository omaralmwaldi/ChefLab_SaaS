import { useState, useEffect, useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useTranslation } from "react-i18next";
import client from "../../api/client";
import { usePermissions } from "../../contexts/usePermissions";
import { PERMISSIONS } from "../../constants/permissions";
import { pick } from "../../utils/pick";

function DashboardPage() {
  const { t, i18n } = useTranslation(["dashboard", "nav", "common"]);
  const lang = i18n.language === "ar" ? "ar" : "en";
  const isAr = lang === "ar";
  const { can } = usePermissions();
  const canRecipes = can(PERMISSIONS.RECIPES_VIEW);
  const canUsers = can(PERMISSIONS.USERS_VIEW);
  const canIngredients = can(PERMISSIONS.INGREDIENTS_VIEW);
  const showAnalytics = can(PERMISSIONS.DASHBOARD_ANALYTICS_VIEW);
  const [stats, setStats] = useState({ recipeCount: 0, userCount: 0, ingredientCount: 0 });
  const [recipes, setRecipes] = useState([]);
  const [ingredients, setIngredients] = useState([]);
  const [recipeUnitFilter, setRecipeUnitFilter] = useState("");
  const [ingredientUnitFilter, setIngredientUnitFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch only the collections the user may view — an unpermitted call
        // would 403. `null` placeholders keep positional destructuring intact.
        const [recipesRes, usersRes, ingredientsRes] = await Promise.all([
          canRecipes ? client.get("/recipes") : null,
          canUsers ? client.get("/users") : null,
          canIngredients ? client.get("/ingredients") : null,
        ]);

        const recipeList = recipesRes?.data ?? [];
        const ingredientList = ingredientsRes?.data ?? [];
        setStats({
          recipeCount: recipeList.length,
          userCount: usersRes?.data.length ?? 0,
          ingredientCount: ingredientList.length,
        });
        setRecipes(recipeList);
        setIngredients(ingredientList);
      } catch {
        setError("errorLoading");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [canRecipes, canUsers, canIngredients]);

  // CLOSED-only recipes drive the cost chart; DRAFT never appears.
  const closedRecipes = useMemo(
    () => recipes.filter((r) => r.status === "CLOSED"),
    [recipes],
  );

  // Distinct storage units present in CLOSED recipes, sorted; feeds the dropdown.
  const recipeUnits = useMemo(
    () => [...new Set(closedRecipes.map((r) => r.storageUnit))].sort(),
    [closedRecipes],
  );

  // Apply the unit filter, rank desc by cost per storage unit, keep top 10.
  const topRecipes = useMemo(() => {
    const scoped = recipeUnitFilter
      ? closedRecipes.filter((r) => r.storageUnit === recipeUnitFilter)
      : closedRecipes;
    return [...scoped]
      .sort((a, b) => b.costPerStorageUnit - a.costPerStorageUnit)
      .slice(0, 10)
      .map((r) => ({ ...r, displayName: pick(r, "name", lang) }));
  }, [closedRecipes, recipeUnitFilter, lang]);

  // Drop ingredients with null cost (users lacking cost-view get null).
  const costedIngredients = useMemo(
    () => ingredients.filter((i) => i.costPerStorageUnit != null),
    [ingredients],
  );

  // Distinct storage units present in costed ingredients, sorted; feeds dropdown.
  const ingredientUnits = useMemo(
    () => [...new Set(costedIngredients.map((i) => i.storageUnit))].sort(),
    [costedIngredients],
  );

  // Apply unit filter, rank desc by cost per storage unit, keep top 10.
  const topIngredients = useMemo(() => {
    const scoped = ingredientUnitFilter
      ? costedIngredients.filter((i) => i.storageUnit === ingredientUnitFilter)
      : costedIngredients;
    return [...scoped]
      .sort((a, b) => b.costPerStorageUnit - a.costPerStorageUnit)
      .slice(0, 10)
      .map((i) => ({ ...i, displayName: pick(i, "name", lang) }));
  }, [costedIngredients, ingredientUnitFilter, lang]);

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

  const statCards = [
    canRecipes && { label: t("nav.recipes"), value: stats.recipeCount, icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4", color: "bg-orange-500" },
    canUsers && { label: t("nav.users"), value: stats.userCount, icon: "M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z", color: "bg-blue-500" },
    canIngredients && { label: t("nav.ingredients"), value: stats.ingredientCount, icon: "M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4", color: "bg-green-500" },
  ].filter(Boolean);

  return (
    <div className="space-y-6">
      {statCards.length > 0 && (
      <div className={`grid gap-4 ${statCards.length === 1 ? "grid-cols-1" : statCards.length === 2 ? "grid-cols-2" : "grid-cols-3"}`}>
        {statCards.map((card) => (
          <div key={card.label} className="flex items-center gap-5 rounded-xl bg-white p-6 shadow-sm">
            <div className={`flex h-14 w-14 items-center justify-center rounded-2xl ${card.color} bg-opacity-10`}>
              <svg className={`h-7 w-7 ${card.color.replace("bg-", "text-")}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d={card.icon} />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-stone-500">{card.label}</p>
              <p className="text-3xl font-bold text-stone-800">{card.value}</p>
            </div>
          </div>
        ))}
      </div>
      )}
      {showAnalytics && (
      <div className="rounded-xl bg-white p-6 shadow-sm">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <h2 className="text-lg font-bold text-stone-800">{t("topCostRecipes")}</h2>
          <label className="flex items-center gap-2 text-sm text-stone-600">
            {t("filterByStorageUnit")}
            <select
              value={recipeUnitFilter}
              onChange={(e) => setRecipeUnitFilter(e.target.value)}
              className="rounded-lg border border-stone-200 px-3 py-2.5 focus:border-orange-500 focus:outline-none"
            >
              <option value="">{t("allStorageUnits")}</option>
              {recipeUnits.map((u) => (
                <option key={u} value={u}>{u}</option>
              ))}
            </select>
          </label>
        </div>
        {topRecipes.length === 0 ? (
          <p className="py-10 text-center text-stone-400">{t("noRecipes")}</p>
        ) : (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart
              data={topRecipes}
              margin={{ left: isAr ? 10 : -10, bottom: isAr ? 100 : 80, right: isAr ? 20 : 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
              <XAxis
                dataKey="displayName"
                tick={{ fill: "#78716c", fontSize: isAr ? 11 : 12 }}
                angle={-40}
                textAnchor="end"
                height={isAr ? 120 : 100}
              />
              <YAxis
                tick={{ fill: "#78716c", fontSize: 12 }}
                tickFormatter={(v) => `SAR ${v}`}
              />
              <Tooltip
                formatter={(value) => [`SAR ${Number(value).toFixed(2)}`, t("common.cost")]}
                labelFormatter={(label) => label}
                contentStyle={{ borderRadius: 12, border: "1px solid #e7e5e4", boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }}
              />
              <Bar dataKey="costPerStorageUnit" fill="#f97316" radius={[6, 6, 0, 0]} maxBarSize={60} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
      )}
      {showAnalytics && (
      <div className="rounded-xl bg-white p-6 shadow-sm">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <h2 className="text-lg font-bold text-stone-800">{t("topCostIngredients")}</h2>
          <label className="flex items-center gap-2 text-sm text-stone-600">
            {t("filterByStorageUnit")}
            <select
              value={ingredientUnitFilter}
              onChange={(e) => setIngredientUnitFilter(e.target.value)}
              className="rounded-lg border border-stone-200 px-3 py-2.5 focus:border-orange-500 focus:outline-none"
            >
              <option value="">{t("allStorageUnits")}</option>
              {ingredientUnits.map((u) => (
                <option key={u} value={u}>{u}</option>
              ))}
            </select>
          </label>
        </div>
        {topIngredients.length === 0 ? (
          <p className="py-10 text-center text-stone-400">{t("noIngredients")}</p>
        ) : (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart
              data={topIngredients}
              margin={{ left: isAr ? 10 : -10, bottom: isAr ? 100 : 80, right: isAr ? 20 : 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
              <XAxis
                dataKey="displayName"
                tick={{ fill: "#78716c", fontSize: isAr ? 11 : 12 }}
                angle={-40}
                textAnchor="end"
                height={isAr ? 120 : 100}
              />
              <YAxis
                tick={{ fill: "#78716c", fontSize: 12 }}
                tickFormatter={(v) => `SAR ${v}`}
              />
              <Tooltip
                formatter={(value) => [`SAR ${Number(value).toFixed(2)}`, t("common.cost")]}
                labelFormatter={(label) => label}
                contentStyle={{ borderRadius: 12, border: "1px solid #e7e5e4", boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }}
              />
              <Bar dataKey="costPerStorageUnit" fill="#22c55e" radius={[6, 6, 0, 0]} maxBarSize={60} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
      )}
    </div>
  );
}

export default DashboardPage;
