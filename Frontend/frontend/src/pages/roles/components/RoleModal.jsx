import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import client from "../../../api/client";

// Module label keys. Fallback to the raw module name if a module has no entry.
const MODULE_LABEL_MAP = {
  users: "roles.permUsers",
  roles: "roles.permRoles",
  recipes: "roles.permRecipes",
  ingredients: "roles.permIngredients",
  categories: "roles.permCategories",
  costs: "roles.permCosts",
  dashboard: "roles.permDashboard",
};

// Action label keys, keyed by the segment(s) after the module. Falls back to the
// raw action string (e.g. "analytics.view") if unmapped.
const ACTION_LABEL_MAP = {
  view: "roles.actionView",
  create: "roles.actionCreate",
  edit: "roles.actionEdit",
  delete: "roles.actionDelete",
  access: "roles.actionAccess",
  "analytics.view": "roles.actionAnalytics",
};

// The dependency graph lives entirely here — the backend stays purely explicit.
// dependsOn[key] = the keys that must also be granted (and locked) whenever key
// is granted. Derived from the catalog so new modules pick up the create/edit/
// delete → view rule with no extra wiring.
function buildDependsOn(catalog) {
  const dependsOn = {};
  for (const [module, keys] of Object.entries(catalog)) {
    const viewKey = `${module}.view`;
    if (!keys.includes(viewKey)) continue;
    for (const key of keys) {
      const action = key.slice(module.length + 1);
      if (action === "create" || action === "edit" || action === "delete") {
        dependsOn[key] = [viewKey];
      }
    }
  }
  const dash = catalog.dashboard || [];
  if (dash.includes("dashboard.analytics.view") && dash.includes("dashboard.access")) {
    dependsOn["dashboard.analytics.view"] = ["dashboard.access"];
  }
  return dependsOn;
}

// Transitive closure of a key's dependencies.
function resolveDeps(key, dependsOn, acc = new Set()) {
  for (const dep of dependsOn[key] || []) {
    if (!acc.has(dep)) {
      acc.add(dep);
      resolveDeps(dep, dependsOn, acc);
    }
  }
  return acc;
}

// Existing roles persist permissions as an array. Tolerate the legacy object map.
function toKeySet(initial) {
  if (Array.isArray(initial)) return new Set(initial);
  if (initial && typeof initial === "object") {
    return new Set(Object.keys(initial).filter((k) => initial[k]));
  }
  return new Set();
}

function RoleModal({ mode, initialData, onClose, onSuccess }) {
  const { t } = useTranslation();
  const [nameEn, setNameEn] = useState(initialData?.nameEn || "");
  const [nameAr, setNameAr] = useState(initialData?.nameAr || "");
  const [granted, setGranted] = useState(() => toKeySet(initialData?.permissions));
  const [catalog, setCatalog] = useState(null);
  const [catalogError, setCatalogError] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState(null);

  useEffect(() => {
    let cancelled = false;
    client.get("/permissions")
      .then((res) => { if (!cancelled) setCatalog(res.data); })
      .catch(() => { if (!cancelled) setCatalogError(true); });
    return () => { cancelled = true; };
  }, []);

  const dependsOn = useMemo(() => (catalog ? buildDependsOn(catalog) : {}), [catalog]);

  // A key is locked (granted + non-removable) while any key that depends on it
  // is granted — e.g. view stays on while create/edit/delete is selected.
  function isLocked(key) {
    for (const [dependent, reqs] of Object.entries(dependsOn)) {
      if (reqs.includes(key) && granted.has(dependent)) return true;
    }
    return false;
  }

  function toggle(key) {
    setGranted((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        if (isLocked(key)) return prev; // locked dep — cannot remove directly
        next.delete(key);
      } else {
        next.add(key);
        for (const dep of resolveDeps(key, dependsOn)) next.add(dep);
      }
      return next;
    });
  }

  function toggleModule(keys, value) {
    setGranted((prev) => {
      const next = new Set(prev);
      for (const key of keys) {
        if (value) {
          next.add(key);
          for (const dep of resolveDeps(key, dependsOn)) next.add(dep);
        } else {
          next.delete(key);
        }
      }
      return next;
    });
  }

  function moduleLabel(module) {
    return MODULE_LABEL_MAP[module] ? t(MODULE_LABEL_MAP[module]) : module.toUpperCase();
  }

  function actionLabel(module, key) {
    const action = key.slice(module.length + 1);
    return ACTION_LABEL_MAP[action] ? t(ACTION_LABEL_MAP[action]) : action;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setErrors(null);

    if (!nameEn.trim() || !nameAr.trim()) {
      setErrors([{ message: t("roles.errorNameRequired") }]);
      return;
    }

    const payload = {
      nameEn: nameEn.trim(),
      nameAr: nameAr.trim(),
      permissions: Array.from(granted),
    };

    setSubmitting(true);
    try {
      if (mode === "create") {
        await client.post("/roles", payload);
      } else {
        await client.put(`/roles/${initialData.id}`, payload);
      }
      onSuccess();
    } catch (err) {
      if (err.response?.status === 400 && err.response.data?.errors) {
        setErrors(err.response.data.errors);
      } else {
        setErrors([{ message: err.response?.data?.message || t("common.errorGeneric") }]);
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white p-6 shadow-lg" onClick={(e) => e.stopPropagation()}>
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-bold text-stone-800">
            {mode === "create" ? t("roles.addRole") : t("roles.editRole")}
          </h2>
          <button onClick={onClose} className="cursor-pointer rounded-lg p-1 text-stone-400 hover:bg-stone-100 hover:text-stone-600">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
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
            <label className="mb-1 block text-sm font-medium text-stone-700" htmlFor="nameEn">
              {t("roles.nameEn")}
            </label>
            <input
              id="nameEn"
              className="w-full rounded-lg border border-stone-200 px-3 py-2.5 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10"
              value={nameEn}
              onChange={(e) => setNameEn(e.target.value)}
              placeholder={t("roles.nameEnPlaceholder")}
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-stone-700" htmlFor="nameAr">
              {t("roles.nameAr")}
            </label>
            <input
              id="nameAr"
              className="w-full rounded-lg border border-stone-200 px-3 py-2.5 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10"
              value={nameAr}
              onChange={(e) => setNameAr(e.target.value)}
              placeholder={t("roles.nameArPlaceholder")}
              dir="rtl"
              required
            />
          </div>

          <div>
            <p className="mb-3 text-sm font-medium text-stone-700">{t("roles.permissions")}</p>
            {catalogError ? (
              <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
                {t("roles.errorCatalog")}
              </div>
            ) : !catalog ? (
              <div className="flex justify-center rounded-lg border border-stone-200 p-6">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-stone-300 border-t-orange-500" />
              </div>
            ) : (
              <div className="space-y-3 rounded-lg border border-stone-200 p-4">
                {Object.entries(catalog).map(([module, keys]) => {
                  const allChecked = keys.every((k) => granted.has(k));
                  return (
                    <div key={module}>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold tracking-wider text-stone-500">{moduleLabel(module)}</span>
                        <label className="flex cursor-pointer items-center gap-1.5 text-xs text-stone-500">
                          <input
                            type="checkbox"
                            checked={allChecked}
                            onChange={() => toggleModule(keys, !allChecked)}
                            className="h-3.5 w-3.5 accent-orange-500"
                          />
                          {t("roles.all")}
                        </label>
                      </div>
                      <div className="mt-1 flex flex-wrap gap-2">
                        {keys.map((key) => {
                          const locked = granted.has(key) && isLocked(key);
                          return (
                            <label
                              key={key}
                              title={locked ? t("roles.autoRequired") : undefined}
                              className={`flex items-center gap-1.5 rounded-lg border border-stone-200 px-3 py-1.5 text-xs text-stone-600 has-checked:border-orange-300 has-checked:bg-orange-50 has-checked:text-orange-700 ${
                                locked ? "cursor-not-allowed opacity-70" : "cursor-pointer"
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={granted.has(key)}
                                disabled={locked}
                                onChange={() => toggle(key)}
                                className="h-3.5 w-3.5 accent-orange-500 disabled:cursor-not-allowed"
                              />
                              {actionLabel(module, key)}
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
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

export default RoleModal;
