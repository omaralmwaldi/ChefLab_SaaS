import { useState, useEffect, useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import { useTranslation } from "react-i18next";
import client from "../../api/client";
import { usePermissions } from "../../contexts/usePermissions";
import { PERMISSIONS } from "../../constants/permissions";
import { pick } from "../../utils/pick";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";

// Compact (~220px) shadcn-wrapped cost bar chart shared by the recipe and
// ingredient sections. Same recharts internals as before; only the wrapper,
// height, and tooltip changed. `color` keeps the per-chart brand accent.
function CostBarChart({ data, color, isAr, costLabel }) {
  const config = { costPerStorageUnit: { label: costLabel, color } };
  return (
    <ChartContainer config={config} className="aspect-auto h-55 w-full">
      <BarChart
        data={data}
        margin={{ left: isAr ? 10 : -10, bottom: 0, right: isAr ? 20 : 0, top: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
        <XAxis
          dataKey="displayName"
          tick={{ fill: "#78716c", fontSize: isAr ? 10 : 11 }}
          angle={-40}
          textAnchor="end"
          interval={0}
          height={70}
        />
        <YAxis
          tick={{ fill: "#78716c", fontSize: 12 }}
          tickFormatter={(v) => `SAR ${v}`}
        />
        <ChartTooltip
          content={
            <ChartTooltipContent
              labelFormatter={(label) => label}
              formatter={(value) => (
                <div className="flex w-full justify-between gap-3">
                  <span className="text-muted-foreground">{costLabel}</span>
                  <span className="font-mono font-medium">{`SAR ${Number(value).toFixed(2)}`}</span>
                </div>
              )}
            />
          }
        />
        <Bar dataKey="costPerStorageUnit" fill={color} radius={[6, 6, 0, 0]} maxBarSize={60} />
      </BarChart>
    </ChartContainer>
  );
}

function DashboardPage() {
  const { t, i18n } = useTranslation(["dashboard", "nav", "common", "recipes"]);
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
  const [heroUnit, setHeroUnit] = useState("");
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

  // Effective hero unit: the user's pick when still valid, else the first
  // available unit. Derived (not stored) so it self-corrects when the unit set
  // changes on data reload without a setState-in-effect cascade.
  const selectedHeroUnit = recipeUnits.includes(heroUnit)
    ? heroUnit
    : recipeUnits[0] ?? "";

  // Single priciest CLOSED recipe within the selected hero unit. Ranking stays
  // inside one unit so a per-kilo recipe never outranks a per-piece one.
  const heroRecipe = useMemo(() => {
    if (!selectedHeroUnit) return null;
    const scoped = closedRecipes.filter((r) => r.storageUnit === selectedHeroUnit);
    if (!scoped.length) return null;
    const top = [...scoped].sort(
      (a, b) => b.costPerStorageUnit - a.costPerStorageUnit,
    )[0];
    return { ...top, displayName: pick(top, "name", lang) };
  }, [closedRecipes, selectedHeroUnit, lang]);

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

  // Count ALL recipes (DRAFT + CLOSED) per fixed shelf-life place; sums to total.
  const placeCounts = useMemo(() => {
    const buckets = [
      { key: "ROOM_TEMPERATURE", label: "recipes.roomTemperature" },
      { key: "CHILLER", label: "recipes.chiller" },
      { key: "FREEZER", label: "recipes.freezer" },
    ];
    return buckets.map((b) => ({
      ...b,
      count: recipes.filter((r) => r.shelfLifePlace === b.key).length,
    }));
  }, [recipes]);

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
      {showAnalytics && (
        <Card>
          <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
            <CardDescription className="text-sm font-medium text-stone-500">
              {t("priciestRecipe")}
            </CardDescription>
            <Select value={selectedHeroUnit} onValueChange={setHeroUnit} disabled={recipeUnits.length === 0}>
              <SelectTrigger className="w-auto min-w-28" aria-label={t("filterByStorageUnit")}>
                <SelectValue placeholder={t("filterByStorageUnit")} />
              </SelectTrigger>
              <SelectContent>
                {recipeUnits.map((u) => (
                  <SelectItem key={u} value={u}>{u}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardHeader>
          <CardContent>
            {heroRecipe ? (
              <div>
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <span className="text-4xl font-bold text-stone-900 sm:text-5xl">
                    {`SAR ${heroRecipe.costPerStorageUnit.toFixed(2)}`}
                  </span>
                  <span className="text-sm text-stone-500">
                    {t("perStorageUnit", { unit: selectedHeroUnit })}
                  </span>
                </div>
                <CardTitle className="mt-2 text-lg text-stone-700">
                  {heroRecipe.displayName}
                </CardTitle>
              </div>
            ) : (
              <p className="py-6 text-stone-400">{t("noClosedRecipesForUnit")}</p>
            )}
          </CardContent>
        </Card>
      )}
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
          <Select
            value={recipeUnitFilter || "all"}
            onValueChange={(v) => setRecipeUnitFilter(v === "all" ? "" : v)}
          >
            <SelectTrigger className="w-auto min-w-28" aria-label={t("filterByStorageUnit")}>
              <SelectValue placeholder={t("filterByStorageUnit")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("allStorageUnits")}</SelectItem>
              {recipeUnits.map((u) => (
                <SelectItem key={u} value={u}>{u}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {topRecipes.length === 0 ? (
          <p className="py-10 text-center text-stone-400">{t("noRecipes")}</p>
        ) : (
          <CostBarChart data={topRecipes} color="#f97316" isAr={isAr} costLabel={t("common.cost")} />
        )}
      </div>
      )}
      {showAnalytics && (
      <div className="rounded-xl bg-white p-6 shadow-sm">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <h2 className="text-lg font-bold text-stone-800">{t("topCostIngredients")}</h2>
          <Select
            value={ingredientUnitFilter || "all"}
            onValueChange={(v) => setIngredientUnitFilter(v === "all" ? "" : v)}
          >
            <SelectTrigger className="w-auto min-w-28" aria-label={t("filterByStorageUnit")}>
              <SelectValue placeholder={t("filterByStorageUnit")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("allStorageUnits")}</SelectItem>
              {ingredientUnits.map((u) => (
                <SelectItem key={u} value={u}>{u}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {topIngredients.length === 0 ? (
          <p className="py-10 text-center text-stone-400">{t("noIngredients")}</p>
        ) : (
          <CostBarChart data={topIngredients} color="#22c55e" isAr={isAr} costLabel={t("common.cost")} />
        )}
      </div>
      )}
      {showAnalytics && (
      <div className="rounded-xl bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-bold text-stone-800">{t("recipesByPlace")}</h2>
        <ul className="divide-y divide-stone-100">
          {placeCounts.map((p) => (
            <li key={p.key} className="flex items-center justify-between py-3">
              <span className="text-sm font-medium text-stone-600">{t(p.label)}</span>
              <span className="text-2xl font-bold text-stone-800">{p.count}</span>
            </li>
          ))}
        </ul>
      </div>
      )}
    </div>
  );
}

export default DashboardPage;
