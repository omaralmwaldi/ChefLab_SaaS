import { useState } from "react";
import client from "../../../api/client";

const permissionGroups = [
  {
    label: "USERS",
    keys: ["users.view", "users.create", "users.edit", "users.delete"],
  },
  {
    label: "ROLES",
    keys: ["roles.view", "roles.create", "roles.edit", "roles.delete"],
  },
  {
    label: "RECIPES",
    keys: ["recipes.view", "recipes.create", "recipes.edit", "recipes.delete"],
  },
  {
    label: "INGREDIENTS",
    keys: ["ingredients.view", "ingredients.create", "ingredients.edit", "ingredients.delete"],
  },
  {
    label: "CATEGORIES",
    keys: ["categories.view", "categories.create", "categories.edit", "categories.delete"],
  },
];


function buildPermissions(initial) {
  const perms = {};
  for (const group of permissionGroups) {
    for (const key of group.keys) {
      perms[key] = initial?.[key] ?? false;
    }
  }
  return perms;
}

function RoleModal({ mode, initialData, onClose, onSuccess }) {
  const [nameEn, setNameEn] = useState(initialData?.nameEn || "");
  const [nameAr, setNameAr] = useState(initialData?.nameAr || "");
  const [permissions, setPermissions] = useState(() => buildPermissions(initialData?.permissions));
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState(null);

  function toggle(key) {
    setPermissions((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  function toggleGroup(groupKeys, value) {
    setPermissions((prev) => {
      const next = { ...prev };
      for (const key of groupKeys) next[key] = value;
      return next;
    });
  }

  function allChecked(keys) {
    return keys.every((k) => permissions[k]);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setErrors(null);

    if (!nameEn.trim() || !nameAr.trim()) {
      setErrors([{ message: "Both name fields are required" }]);
      return;
    }

    const payload = {
      nameEn: nameEn.trim(),
      nameAr: nameAr.trim(),
      permissions,
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
        setErrors([{ message: err.response?.data?.message || "Something went wrong" }]);
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-lg" onClick={(e) => e.stopPropagation()}>
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-bold text-stone-800">
            {mode === "create" ? "Add Role" : "Edit Role"}
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
            <label className="mb-1 block text-sm font-medium text-stone-700" htmlFor="nameEn">Name (English)</label>
            <input
              id="nameEn"
              className="w-full rounded-lg border border-stone-200 px-3 py-2.5 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10"
              value={nameEn}
              onChange={(e) => setNameEn(e.target.value)}
              placeholder="e.g. Chef"
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-stone-700" htmlFor="nameAr">الاسم (عربي)</label>
            <input
              id="nameAr"
              className="w-full rounded-lg border border-stone-200 px-3 py-2.5 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10"
              value={nameAr}
              onChange={(e) => setNameAr(e.target.value)}
              placeholder="مثال: شيف"
              dir="rtl"
              required
            />
          </div>

          <div>
            <p className="mb-3 text-sm font-medium text-stone-700">Permissions</p>
            <div className="space-y-2 rounded-lg border border-stone-200 p-4">
              {permissionGroups.map((group) => {
                const checked = allChecked(group.keys);
                return (
                  <div key={group.label}>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold tracking-wider text-stone-500">{group.label}</span>
                      <label className="flex cursor-pointer items-center gap-1.5 text-xs text-stone-500">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleGroup(group.keys, !checked)}
                          className="h-3.5 w-3.5 accent-orange-500"
                        />
                        All
                      </label>
                    </div>
                    <div className="mt-1 flex flex-wrap gap-2">
                      {group.keys.map((key) => (
                        <label
                          key={key}
                          className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-stone-200 px-3 py-1.5 text-xs text-stone-600 has-checked:border-orange-300 has-checked:bg-orange-50 has-checked:text-orange-700"
                        >
                          <input
                            type="checkbox"
                            checked={permissions[key]}
                            onChange={() => toggle(key)}
                            className="h-3.5 w-3.5 accent-orange-500"
                          />
                          {key.split(".")[1]}
                        </label>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

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
              disabled={submitting}
              className="cursor-pointer rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? "Saving..." : mode === "create" ? "Create" : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default RoleModal;
