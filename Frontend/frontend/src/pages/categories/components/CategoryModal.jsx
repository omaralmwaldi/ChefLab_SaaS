import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import client from "../../../api/client";

function CategoryModal({ mode, initialData, onClose, onSuccess }) {
  const { t } = useTranslation();
  const [sku, setSku] = useState(initialData?.sku || "");
  const [nameEn, setNameEn] = useState(initialData?.nameEn || "");
  const [nameAr, setNameAr] = useState(initialData?.nameAr || "");
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState(null);
  const [skuMode, setSkuMode] = useState(mode === "create" ? "auto" : "manual");
  const [skuLoading, setSkuLoading] = useState(mode === "create");

  useEffect(() => {
    if (mode !== "create") return;
    let cancelled = false;
    client
      .get("/categories/next-sku")
      .then((res) => { if (!cancelled) setSku(res.data.sku); })
      .catch(() => { if (!cancelled) setSkuMode("manual"); })
      .finally(() => { if (!cancelled) setSkuLoading(false); });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleSkuModeChange(newMode) {
    setSkuMode(newMode);
    if (newMode === "auto") {
      setSkuLoading(true);
      client
        .get("/categories/next-sku")
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

    const payload = { sku, nameEn, nameAr };
    if (!sku.trim() || !nameEn.trim() || !nameAr.trim()) {
      setErrors([{ message: t("categories.errorRequiredFields") }]);
      return;
    }

    setSubmitting(true);
    try {
      if (mode === "create") {
        await client.post("/categories", payload);
      } else {
        await client.put(`/categories/${initialData.id}`, payload);
      }
      onSuccess();
    } catch (err) {
      if (err.response?.status === 400 && err.response.data?.errors) {
        setErrors(err.response.data.errors);
      } else {
        setErrors([
          { message: err.response?.data?.message || t("common.errorGeneric") },
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
          <h2 className="text-lg font-bold text-stone-800">
            {mode === "create" ? t("categories.addCategory") : t("categories.editCategory")}
          </h2>
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
          <div>
            <label
              className="mb-1 block text-sm font-medium text-stone-700"
              htmlFor="nameEn"
            >
              {t("categories.nameEn")}
            </label>
            <input
              id="nameEn"
              className="w-full rounded-lg border border-stone-200 px-3 py-2.5 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10"
              value={nameEn}
              onChange={(e) => setNameEn(e.target.value)}
              required
            />
          </div>
          <div>
            <label
              className="mb-1 block text-sm font-medium text-stone-700"
              htmlFor="nameAr"
            >
              {t("categories.nameAr")}
            </label>
            <input
              id="nameAr"
              className="w-full rounded-lg border border-stone-200 px-3 py-2.5 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10"
              value={nameAr}
              onChange={(e) => setNameAr(e.target.value)}
              dir="rtl"
              required
            />
          </div>
          <div>
            <div className="mb-1 flex items-center justify-between">
              <label className="text-sm font-medium text-stone-700" htmlFor="sku">
                {t("common.sku")}
              </label>
              {mode === "create" && (
                <div className="flex overflow-hidden rounded-md border border-stone-200 text-xs">
                  <button
                    type="button"
                    onClick={() => handleSkuModeChange("auto")}
                    className={`px-2 py-1 ${skuMode === "auto" ? "bg-orange-500 text-white" : "text-stone-500 hover:bg-stone-50"}`}
                  >
                    {t("common.skuAuto")}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSkuModeChange("manual")}
                    className={`px-2 py-1 ${skuMode === "manual" ? "bg-orange-500 text-white" : "text-stone-500 hover:bg-stone-50"}`}
                  >
                    {t("common.skuManual")}
                  </button>
                </div>
              )}
            </div>
            <input
              id="sku"
              className="w-full rounded-lg border border-stone-200 px-3 py-2.5 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10"
              value={sku}
              placeholder={skuLoading ? t("common.loading") : ""}
              onChange={(e) => setSku(e.target.value)}
              disabled={skuLoading}
              required
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="cursor-pointer rounded-lg border border-stone-200 px-4 py-2 text-sm font-medium text-stone-600 hover:bg-stone-50"
            >
              {t("common.cancel")}
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="cursor-pointer rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? t("common.saving") : mode === "create" ? t("common.create") : t("common.save")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CategoryModal;
