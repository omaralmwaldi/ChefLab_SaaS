import { useState, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import client from "../../api/client";

function DashboardPage() {
  const [stats, setStats] = useState({ recipeCount: 0, userCount: 0, ingredientCount: 0 });
  const [topRecipes, setTopRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchData() {
      try {
        const [recipesRes, usersRes, ingredientsRes] = await Promise.all([
          client.get("/recipes"),
          client.get("/users"),
          client.get("/ingredients"),
        ]);

        const recipes = recipesRes.data;
        setStats({
          recipeCount: recipes.length,
          userCount: usersRes.data.length,
          ingredientCount: ingredientsRes.data.length,
        });

        const sorted = [...recipes].sort((a, b) => b.totalCost - a.totalCost);
        setTopRecipes(sorted.slice(0, 5));
      } catch {
        setError("Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

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

  const statCards = [
    { label: "Recipes", value: stats.recipeCount, icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4", color: "bg-orange-500" },
    { label: "Users", value: stats.userCount, icon: "M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z", color: "bg-blue-500" },
    { label: "Ingredients", value: stats.ingredientCount, icon: "M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4", color: "bg-green-500" },
  ];

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-3 gap-6">
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

      <div className="rounded-xl bg-white p-6 shadow-sm">
        <h2 className="mb-6 text-lg font-bold text-stone-800">Recipe Cost Ranking</h2>
        {topRecipes.length === 0 ? (
          <p className="py-10 text-center text-stone-400">No recipes yet</p>
        ) : (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={topRecipes} margin={{ left: -10, bottom: 80 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
              <XAxis
                dataKey="nameEn"
                tick={{ fill: "#78716c", fontSize: 12 }}
                angle={-35}
                textAnchor="end"
                height={100}
              />
              <YAxis
                tick={{ fill: "#78716c", fontSize: 12 }}
                tickFormatter={(v) => `$${v}`}
              />
              <Tooltip
                formatter={(value) => [`$${Number(value).toFixed(2)}`, "Cost"]}
                labelFormatter={(label) => label}
                contentStyle={{ borderRadius: 12, border: "1px solid #e7e5e4", boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }}
              />
              <Bar dataKey="totalCost" fill="#f97316" radius={[6, 6, 0, 0]} maxBarSize={60} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

export default DashboardPage;
