import { useState, useEffect } from "react";
import client from "../../api/client";
import IngredientModal from "./components/IngredientModal";
import DeleteConfirm from "./components/DeleteConfirm";

function IngredientListPage() {
  const [ingredients, setIngredients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modal, setModal] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  useEffect(() => {
    let cancelled = false;
    client.get("/ingredients")
      .then((res) => { if (!cancelled) setIngredients(res.data); })
      .catch(() => { if (!cancelled) setError("Failed to load ingredients"); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  function reload() {
    client.get("/ingredients")
      .then((res) => setIngredients(res.data))
      .catch(() => setError("Failed to load ingredients"));
  }

  function handleCreated() { setModal(null); reload(); }
  function handleUpdated() { setModal(null); reload(); }
  function handleDeleted() { setDeleteTarget(null); reload(); }

  function formatCost(cost, unit) {
    const num = Number(cost);
    return `SAR${num.toFixed(2)}/${unit}`;
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

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <p className="text-sm text-stone-500">{ingredients.length} ingredient{ingredients.length !== 1 ? "s" : ""}</p>
        <button
          onClick={() => setModal("create")}
          className="flex cursor-pointer items-center gap-2 rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-600"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Add Ingredient
        </button>
      </div>

      {ingredients.length === 0 ? (
        <div className="rounded-xl bg-white p-12 text-center shadow-sm">
          <p className="text-stone-400">No ingredients yet</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-stone-100 bg-stone-50">
                <th className="whitespace-nowrap px-4 py-3 font-medium text-stone-500">SKU</th>
                <th className="whitespace-nowrap px-4 py-3 font-medium text-stone-500">Name (English)</th>
                <th className="whitespace-nowrap px-4 py-3 font-medium text-stone-500">الاسم (عربي)</th>
                <th className="whitespace-nowrap px-4 py-3 font-medium text-stone-500">Units</th>
                <th className="whitespace-nowrap px-4 py-3 font-medium text-stone-500">Cost / Unit</th>
                <th className="whitespace-nowrap px-4 py-3 font-medium text-stone-500">Actions</th>
              </tr>
            </thead>
            <tbody>
              {ingredients.map((ing) => (
                <tr key={ing.id} className="border-b border-stone-100 last:border-0 hover:bg-stone-50">
                  <td className="whitespace-nowrap px-4 py-3.5 font-mono text-xs text-stone-600">{ing.sku}</td>
                  <td className="whitespace-nowrap px-4 py-3.5 font-medium text-stone-800">{ing.nameEn}</td>
                  <td className="whitespace-nowrap px-4 py-3.5 text-stone-700" dir="rtl">{ing.nameAr}</td>
                  <td className="whitespace-nowrap px-4 py-3.5 text-stone-600">{ing.storageUnit} &rarr; {ing.usageUnit}</td>
                  <td className="whitespace-nowrap px-4 py-3.5 font-mono text-stone-700">
                    {formatCost(ing.costPerStorageUnit, ing.storageUnit)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3.5">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setModal(ing)}
                        className="cursor-pointer rounded-lg p-1.5 text-stone-400 hover:bg-stone-100 hover:text-orange-600"
                        title="Edit"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                        </svg>
                      </button>
                      <button
                        onClick={() => setDeleteTarget(ing)}
                        className="cursor-pointer rounded-lg p-1.5 text-stone-400 hover:bg-stone-100 hover:text-red-600"
                        title="Delete"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
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

      {modal === "create" && (
        <IngredientModal mode="create" onClose={() => setModal(null)} onSuccess={handleCreated} />
      )}
      {modal && modal !== "create" && (
        <IngredientModal mode="edit" initialData={modal} onClose={() => setModal(null)} onSuccess={handleUpdated} />
      )}
      {deleteTarget && (
        <DeleteConfirm ingredient={deleteTarget} onClose={() => setDeleteTarget(null)} onSuccess={handleDeleted} />
      )}
    </div>
  );
}

export default IngredientListPage;
