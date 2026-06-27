import { useState, useEffect } from "react";
import client from "../../../api/client";

function numeric(value) {
  if (value === "" || value === null || value === undefined) return undefined;
  const n = parseFloat(value);
  return isNaN(n) ? undefined : n;
}

function RecipeModal({ onClose, onSuccess }) {
  const [sku, setSku] = useState("");
  const [nameEn, setNameEn] = useState("");
  const [nameAr, setNameAr] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [yieldQuantity, setYieldQuantity] = useState("");
  const [yieldUnit, setYieldUnit] = useState("");
  const [shelfLifeValue, setShelfLifeValue] = useState("");
  const [shelfLifeUnit, setShelfLifeUnit] = useState("DAY");
  const [shelfLifePlace, setShelfLifePlace] = useState("ROOM_TEMPERATURE");
  const [categories, setCategories] = useState([]);
  const [loadingData, setLoadingData] = useState(true); //?
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState(null);

  useEffect(() => {
    let cancelled = false;
    client
      .get("/categories")
      .then((res) => {
        if (!cancelled) setCategories(res.data);
      })
      .catch(() => {
        if (!cancelled) setErrors([{ message: "Failed to load categories" }]);
      })
      .finally(() => {
        if (!cancelled) setLoadingData(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setErrors(null);

    if (
      !sku.trim() ||
      !nameEn.trim() ||
      !nameAr.trim() ||
      !categoryId ||
      !yieldQuantity ||
      !yieldUnit.trim()
    ) {
      setErrors([{ message: "All required fields must be filled" }]);
      return;
    }

    const shelfLifeNum = Number(shelfLifeValue);
    if (!shelfLifeValue || !Number.isInteger(shelfLifeNum) || shelfLifeNum < 1) {
      setErrors([{ message: "Shelf life must be a positive whole number" }]);
      return;
    }

    const payload = {
      sku: sku.trim(),
      nameAr: nameAr.trim(),
      nameEn: nameEn.trim(),
      categoryId,
      yieldQuantity: numeric(yieldQuantity),
      yieldUnit: yieldUnit.trim(),
      shelfLifeValue: shelfLifeNum,
      shelfLifeUnit,
      shelfLifePlace,
      status: "DRAFT",
    };

    setSubmitting(true);
    try {
      await client.post("/recipes", payload);
      onSuccess();
    } catch (err) {
      if (err.response?.status === 400 && err.response.data?.errors) {
        setErrors(err.response.data.errors);
      } else {
        setErrors([
          { message: err.response?.data?.message || "Something went wrong" },
        ]);
      }
    } finally {
      setSubmitting(false);
    }
  }

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
          <h2 className="text-lg font-bold text-stone-800">Add Recipe</h2>
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

        {errors && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
            {errors.map((err, i) => (
              <p key={i}>{err.message}</p>
            ))}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {loadingData ? (
            <div className="flex items-center justify-center py-10">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-stone-300 border-t-orange-500" />
            </div>
          ) : (
            <>
              <div>
                <label
                  className="mb-1 block text-sm font-medium text-stone-700"
                  htmlFor="r-sku"
                >
                  SKU
                </label>
                <input
                  id="r-sku"
                  className="w-full rounded-lg border border-stone-200 px-3 py-2.5 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10"
                  value={sku}
                  onChange={(e) => setSku(e.target.value)}
                  placeholder="e.g. RCP-001"
                  required
                />
              </div>
              <div>
                <label
                  className="mb-1 block text-sm font-medium text-stone-700"
                  htmlFor="r-cat"
                >
                  Category
                </label>
                <select
                  id="r-cat"
                  className="w-full rounded-lg border border-stone-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10"
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  required
                >
                  <option value="">Select category</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nameEn}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label
                    className="mb-1 block text-sm font-medium text-stone-700"
                    htmlFor="r-nameEn"
                  >
                    Name (English)
                  </label>
                  <input
                    id="r-nameEn"
                    className="w-full rounded-lg border border-stone-200 px-3 py-2.5 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10"
                    value={nameEn}
                    onChange={(e) => setNameEn(e.target.value)}
                    placeholder="e.g. Margherita Pizza"
                    required
                  />
                </div>
                <div>
                  <label
                    className="mb-1 block text-sm font-medium text-stone-700"
                    htmlFor="r-nameAr"
                  >
                    الاسم (عربي)
                  </label>
                  <input
                    id="r-nameAr"
                    className="w-full rounded-lg border border-stone-200 px-3 py-2.5 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10"
                    value={nameAr}
                    onChange={(e) => setNameAr(e.target.value)}
                    placeholder="مثال: بيتزا"
                    dir="rtl"
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label
                    className="mb-1 block text-sm font-medium text-stone-700"
                    htmlFor="r-yieldQ"
                  >
                    Yield Quantity
                  </label>
                  <input
                    id="r-yieldQ"
                    type="number"
                    step="0.001"
                    min="0.001"
                    className="w-full rounded-lg border border-stone-200 px-3 py-2.5 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10"
                    value={yieldQuantity}
                    onChange={(e) => setYieldQuantity(e.target.value)}
                    placeholder="1"
                    required
                  />
                </div>
                <div>
                  <label
                    className="mb-1 block text-sm font-medium text-stone-700"
                    htmlFor="r-yieldU"
                  >
                    Yield Unit
                  </label>
                  <input
                    id="r-yieldU"
                    className="w-full rounded-lg border border-stone-200 px-3 py-2.5 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10"
                    value={yieldUnit}
                    onChange={(e) => setYieldUnit(e.target.value)}
                    placeholder="e.g. pizza"
                    required
                  />
                </div>
              </div>
              <div className="border-t border-stone-200 pt-4">
                <h3 className="mb-3 text-sm font-semibold text-stone-700">Shelf Life</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-stone-700" htmlFor="r-slv">
                      Value
                    </label>
                    <input
                      id="r-slv"
                      type="number"
                      step="1"
                      min="1"
                      className="w-full rounded-lg border border-stone-200 px-3 py-2.5 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10"
                      value={shelfLifeValue}
                      onChange={(e) => setShelfLifeValue(e.target.value)}
                      placeholder="e.g. 3"
                      required
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-stone-700" htmlFor="r-slu">
                      Unit
                    </label>
                    <select
                      id="r-slu"
                      className="w-full rounded-lg border border-stone-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10"
                      value={shelfLifeUnit}
                      onChange={(e) => setShelfLifeUnit(e.target.value)}
                      required
                    >
                      <option value="HOUR">Hour</option>
                      <option value="DAY">Day</option>
                      <option value="WEEK">Week</option>
                      <option value="MONTH">Month</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-stone-700" htmlFor="r-slp">
                      Place
                    </label>
                    <select
                      id="r-slp"
                      className="w-full rounded-lg border border-stone-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10"
                      value={shelfLifePlace}
                      onChange={(e) => setShelfLifePlace(e.target.value)}
                      required
                    >
                      <option value="ROOM_TEMPERATURE">Room Temperature</option>
                      <option value="CHILLER">Chiller</option>
                      <option value="FREEZER">Freezer</option>
                    </select>
                  </div>
                </div>
              </div>
            </>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="cursor-pointer rounded-lg border border-stone-200 px-4 py-2 text-sm font-medium text-stone-600 hover:bg-stone-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || loadingData}
              className="cursor-pointer rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? "Creating..." : "Create Draft"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default RecipeModal;
