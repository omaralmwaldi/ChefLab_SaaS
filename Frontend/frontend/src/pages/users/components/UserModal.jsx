import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import client from "../../../api/client";
import { PASSWORD_RULES } from "./passwordRules";

function UserModal({ mode, initialData, onClose, onSuccess }) {
  const { t } = useTranslation();
  const [name, setName] = useState(initialData?.name || "");
  const [email, setEmail] = useState(initialData?.email || "");
  const [phone, setPhone] = useState(initialData?.phone || "");
  const [password, setPassword] = useState("");
  const [roleId, setRoleId] = useState(initialData?.roleId || "");
  const [preferredLanguage, setPreferredLanguage] = useState(
    initialData?.preferredLanguage || "en",
  );
  const [roles, setRoles] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState(null);
  const [showRules, setShowRules] = useState(false);

  useEffect(() => {
    let cancelled = false;
    client
      .get("/roles")
      .then((res) => {
        if (!cancelled) setRoles(res.data);
      })
      .catch(() => {
        if (!cancelled) setRoles([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setErrors(null);

    if (mode === "create" && !password.trim()) {
      setErrors([{ message: t("users.errorPasswordRequired") }]);
      return;
    }
    if (mode === "create") {
      const failed = PASSWORD_RULES.find((r) => !r.test(password));
      if (failed) {
        setErrors([{ message: t("users.errorPasswordRule", { label: failed.label }) }]);
        return;
      }
    }

    const payload = {
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim() || null,
      roleId: roleId || null,
      preferredLanguage,
    };
    if (mode === "create") payload.password = password;

    setSubmitting(true);
    try {
      if (mode === "create") {
        await client.post("/users", payload);
      } else {
        await client.put(`/users/${initialData.id}`, payload);
      }
      onSuccess();
    } catch (err) {
      if (err.response?.status === 400 && err.response.data?.errors) {
        setErrors(err.response.data.errors);
      } else if (err.response?.status === 409) {
        setErrors([
          { message: err.response.data?.message || t("users.errorEmailExists") },
        ]);
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="max-h-[calc(100dvh-2rem)] w-full max-w-md overflow-y-auto rounded-xl bg-white p-6 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-bold text-stone-800">
            {mode === "create" ? t("users.addUser") : t("users.editUser")}
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
              htmlFor="user-name"
            >
              {t("users.name")}
            </label>
            <input
              id="user-name"
              className="w-full rounded-lg border border-stone-200 px-3 py-2.5 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("users.namePlaceholder")}
              required
            />
          </div>
          <div>
            <label
              className="mb-1 block text-sm font-medium text-stone-700"
              htmlFor="user-email"
            >
              {t("users.email")}
            </label>
            <input
              id="user-email"
              type="email"
              className="w-full rounded-lg border border-stone-200 px-3 py-2.5 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@example.com"
              required
            />
          </div>
          <div>
            <label
              className="mb-1 block text-sm font-medium text-stone-700"
              htmlFor="user-phone"
            >
              {t("users.phone")} <span className="text-stone-400">{t("common.optional")}</span>
            </label>
            <input
              id="user-phone"
              className="w-full rounded-lg border border-stone-200 px-3 py-2.5 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder={t("users.phonePlaceholder")}
            />
          </div>
          <div>
            <label
              className="mb-1 block text-sm font-medium text-stone-700"
              htmlFor="user-role"
            >
              {t("users.role")}
            </label>
            <select
              id="user-role"
              className="w-full rounded-lg border border-stone-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10"
              value={roleId}
              onChange={(e) => setRoleId(e.target.value)}
            >
              <option value="">{t("users.noRole")}</option>
              {roles.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.nameEn}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label
              className="mb-1 block text-sm font-medium text-stone-700"
              htmlFor="user-lang"
            >
              {t("users.preferredLanguage")}
            </label>
            <select
              id="user-lang"
              className="w-full rounded-lg border border-stone-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10"
              value={preferredLanguage}
              onChange={(e) => setPreferredLanguage(e.target.value)}
            >
              <option value="en">{t("users.langEn")}</option>
              <option value="ar">{t("users.langAr")}</option>
            </select>
          </div>
          {mode === "create" && (
            <div>
              <label
                className="mb-1 block text-sm font-medium text-stone-700"
                htmlFor="user-password"
              >
                {t("users.password")}
              </label>
              <input
                id="user-password"
                type="password"
                className="w-full rounded-lg border border-stone-200 px-3 py-2.5 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setShowRules(true);
                }}
                required
              />
              {showRules && (
                <ul className="space-y-1 rounded-lg border border-stone-200 bg-stone-50 px-3 py-2 text-xs">
                  {PASSWORD_RULES.map((r, i) => {
                    const ok = r.test(password);
                    return (
                      <li
                        key={i}
                        className={ok ? "text-green-600" : "text-stone-500"}
                      >
                        <span className="mr-1.5">{ok ? "✓" : "•"}</span>
                        {r.label}
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          )}

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

export default UserModal;
