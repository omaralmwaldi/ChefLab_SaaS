import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import client from "../../../api/client";

function numeric(value) {
  if (value === "" || value === null || value === undefined) return undefined;
  const n = parseFloat(value);
  return isNaN(n) ? undefined : n;
}

function RecipeModal({ onClose, onSuccess }) {
  const { t } = useTranslation("recipes");
  const [sku, setSku] = useState("");
  const [nameEn, setNameEn] = useState("");
  const [nameAr, setNameAr] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [yieldQuantity, setYieldQuantity] = useState("");
  const [yieldUnit, setYieldUnit] = useState("");
  const [shelfLifeValue, setShelfLifeValue] = useState("");
  const [shelfLifeUnit, setShelfLifeUnit] = useState("DAY");
  const [shelfLifePlace, setShelfLifePlace] = useState("ROOM_TEMPERATURE");
  const [storageUnit, setStorageUnit] = useState("");
  const [conversionFactor, setConversionFactor] = useState("");
  const [categories, setCategories] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState(null);
  const [skuMode, setSkuMode] = useState("auto");
  const [skuLoading, setSkuLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    client
      .get("/categories")
      .then((res) => {
        if (!cancelled) setCategories(res.data);
      })
      .catch(() => {
        if (!cancelled) setErrors([{ message: t("errorLoadCategories") }]);
      })
      .finally(() => {
        if (!cancelled) setLoadingData(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    client
      .get("/recipes/next-sku")
      .then((res) => { if (!cancelled) setSku(res.data.sku); })
      .catch(() => { if (!cancelled) setSkuMode("manual"); })
      .finally(() => { if (!cancelled) setSkuLoading(false); });
    return () => { cancelled = true; };
  }, []);

  function handleSkuModeChange(newMode) {
    setSkuMode(newMode);
    if (newMode === "auto") {
      setSkuLoading(true);
      client
        .get("/recipes/next-sku")
        .then((res) => setSku(res.data.sku))
        .catch(() => setSkuMode("manual"))
        .finally(() => setSkuLoading(false));
    } else {
      setSku("");
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setErrors(null);

    if (
      !sku.trim() ||
      !nameEn.trim() ||
      !nameAr.trim() ||
      !categoryId ||
      !yieldQuantity ||
      !yieldUnit.trim() ||
      !storageUnit.trim()
    ) {
      setErrors([{ message: t("errorRequiredFields") }]);
      return;
    }

    const shelfLifeNum = Number(shelfLifeValue);
    if (
      !shelfLifeValue ||
      !Number.isInteger(shelfLifeNum) ||
      shelfLifeNum < 1
    ) {
      setErrors([{ message: t("errorShelfLife") }]);
      return;
    }

    const convFactor = numeric(conversionFactor);
    if (!convFactor || convFactor <= 0) {
      setErrors([{ message: t("errorConversionFactor") }]);
      return;
    }

    const payload = {
      sku: sku.trim(),
      nameAr: nameAr.trim(),
      nameEn: nameEn.trim(),
      categoryId,
      yieldQuantity: numeric(yieldQuantity),
      yieldUnit: yieldUnit.trim(),
      storageUnit: storageUnit.trim(),
      conversionFactor: convFactor,
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
          { message: err.response?.data?.message || t("errorGeneric") },
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
          <h2 className="text-lg font-bold text-stone-800">{t("addRecipe")}</h2>
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
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label
                  className="mb-1 block text-sm font-medium text-stone-700"
                  htmlFor="r-nameEn"
                >
                  {t("nameEn")}
                </label>
                <input
                  id="r-nameEn"
                  className="w-full rounded-lg border border-stone-200 px-3 py-2.5 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10"
                  value={nameEn}
                  onChange={(e) => setNameEn(e.target.value)}
                  required
                />
              </div>
              <div>
                <label
                  className="mb-1 block text-sm font-medium text-stone-700"
                  htmlFor="r-nameAr"
                >
                  {t("nameAr")}
                </label>
                <input
                  id="r-nameAr"
                  className="w-full rounded-lg border border-stone-200 px-3 py-2.5 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10"
                  value={nameAr}
                  onChange={(e) => setNameAr(e.target.value)}
                  dir="rtl"
                  required
                />
              </div>
            </div>

              <div>
                <div className="mb-1 flex items-center justify-between">
                  <label className="text-sm font-medium text-stone-700" htmlFor="r-sku">
                    {t("sku")}
                  </label>
                  <div className="flex overflow-hidden rounded-md border border-stone-200 text-xs">
                    <button
                      type="button"
                      onClick={() => handleSkuModeChange("auto")}
                      className={`px-2 py-1 ${skuMode === "auto" ? "bg-orange-500 text-white" : "text-stone-500 hover:bg-stone-50"}`}
                    >
                      {t("skuAuto")}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSkuModeChange("manual")}
                      className={`px-2 py-1 ${skuMode === "manual" ? "bg-orange-500 text-white" : "text-stone-500 hover:bg-stone-50"}`}
                    >
                      {t("skuManual")}
                    </button>
                  </div>
                </div>
                <input
                  id="r-sku"
                  className="w-full rounded-lg border border-stone-200 px-3 py-2.5 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10"
                  value={sku}
                  placeholder={skuLoading ? t("common:loading") : ""}
                  onChange={(e) => setSku(e.target.value)}
                  disabled={skuLoading}
                  required
                />
              </div>
              <div>
                <label
                  className="mb-1 block text-sm font-medium text-stone-700"
                  htmlFor="r-cat"
                >
                  {t("category")}
                </label>
                <select
                  id="r-cat"
                  className="w-full rounded-lg border border-stone-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10"
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  required
                >
                  <option value="">{t("selectCategory")}</option>
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
                    htmlFor="r-yieldQ"
                  >
                    {t("yieldQuantity")}
                  </label>
                  <input
                    id="r-yieldQ"
                    type="number"
                    step="0.001"
                    min="0.001"
                    className="w-full rounded-lg border border-stone-200 px-3 py-2.5 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10"
                    value={yieldQuantity}
                    onChange={(e) => setYieldQuantity(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label
                    className="mb-1 block text-sm font-medium text-stone-700"
                    htmlFor="r-yieldU"
                  >
                    {t("yieldUnit")}
                  </label>
                  <input
                    id="r-yieldU"
                    className="w-full rounded-lg border border-stone-200 px-3 py-2.5 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10"
                    value={yieldUnit}
                    onChange={(e) => setYieldUnit(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label
                    className="mb-1 block text-sm font-medium text-stone-700"
                    htmlFor="r-su"
                  >
                    {t("storageUnit")}
                  </label>
                  <input
                    id="r-su"
                    className="w-full rounded-lg border border-stone-200 px-3 py-2.5 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10"
                    value={storageUnit}
                    onChange={(e) => setStorageUnit(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label
                    className="mb-1 block text-sm font-medium text-stone-700"
                    htmlFor="r-cf"
                  >
                    {t("conversionFactor")}
                  </label>
                  <input
                    id="r-cf"
                    type="number"
                    step="0.0001"
                    min="0.0001"
                    className="w-full rounded-lg border border-stone-200 px-3 py-2.5 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10"
                    value={conversionFactor}
                    onChange={(e) => setConversionFactor(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="border-t border-stone-200 pt-4">
                <h3 className="mb-3 text-sm font-semibold text-stone-700">
                  {t("expiration")}
                </h3>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label
                      className="mb-1 block text-sm font-medium text-stone-700"
                      htmlFor="r-slv"
                    >
                      {t("shelfLifeValue")}
                    </label>
                    <input
                      id="r-slv"
                      type="number"
                      step="1"
                      min="1"
                      className="w-full rounded-lg border border-stone-200 px-3 py-2.5 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10"
                      value={shelfLifeValue}
                      onChange={(e) => setShelfLifeValue(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label
                      className="mb-1 block text-sm font-medium text-stone-700"
                      htmlFor="r-slu"
                    >
                      {t("shelfLifeUnit")}
                    </label>
                    <select
                      id="r-slu"
                      className="w-full rounded-lg border border-stone-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10"
                      value={shelfLifeUnit}
                      onChange={(e) => setShelfLifeUnit(e.target.value)}
                      required
                    >
                      <option value="HOUR">{t("hour")}</option>
                      <option value="DAY">{t("day")}</option>
                      <option value="WEEK">{t("week")}</option>
                      <option value="MONTH">{t("month")}</option>
                    </select>
                  </div>
                  <div>
                    <label
                      className="mb-1 block text-sm font-medium text-stone-700"
                      htmlFor="r-slp"
                    >
                      {t("shelfLifePlace")}
                    </label>
                    <select
                      id="r-slp"
                      className="w-full rounded-lg border border-stone-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10"
                      value={shelfLifePlace}
                      onChange={(e) => setShelfLifePlace(e.target.value)}
                      required
                    >
                      <option value="ROOM_TEMPERATURE">{t("roomTemperature")}</option>
                      <option value="CHILLER">{t("chiller")}</option>
                      <option value="FREEZER">{t("freezer")}</option>
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
              {t("cancel")}
            </button>
            <button
              type="submit"
              disabled={submitting || loadingData}
              className="cursor-pointer rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? t("creating") : t("createDraft")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default RecipeModal;
