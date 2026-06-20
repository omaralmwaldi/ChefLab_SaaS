import { useState } from "react";
import client from "../../../api/client";
import { PASSWORD_RULES } from "./passwordRules";

function NewPasswordDialog({ user, onClose, onSuccess }) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState(null);
  const [showRules, setShowRules] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setErrors(null);

    if (password !== confirm) {
      setErrors([{ message: "Passwords do not match" }]);
      return;
    }

    const failed = PASSWORD_RULES.find((r) => !r.test(password));
    if (failed) {
      setErrors([{ message: `Password rule not met: ${failed.label}` }]);
      return;
    }

    setSubmitting(true);
    try {
      await client.put(`/users/${user.id}`, { password });
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
      <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-lg" onClick={(e) => e.stopPropagation()}>
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-bold text-stone-800">
            Set New Password
          </h2>
          <button onClick={onClose} className="cursor-pointer rounded-lg p-1 text-stone-400 hover:bg-stone-100 hover:text-stone-600">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <p className="mb-4 text-sm text-stone-500">
          Set a new password for <span className="font-medium text-stone-700">{user.name}</span>.
        </p>

        {errors && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
            {errors.map((err, i) => (
              <p key={i}>{err.message}</p>
            ))}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-stone-700" htmlFor="npw">New Password</label>
            <input
              id="npw"
              type="password"
              className="w-full rounded-lg border border-stone-200 px-3 py-2.5 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setShowRules(true); }}
              placeholder="••••••••"
              autoFocus
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-stone-700" htmlFor="npw2">Confirm New Password</label>
            <input
              id="npw2"
              type="password"
              className="w-full rounded-lg border border-stone-200 px-3 py-2.5 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="••••••••"
            />
          </div>

          {showRules && (
            <ul className="space-y-1 rounded-lg border border-stone-200 bg-stone-50 px-3 py-2 text-xs">
              {PASSWORD_RULES.map((r, i) => {
                const ok = r.test(password);
                return (
                  <li key={i} className={ok ? "text-green-600" : "text-stone-500"}>
                    <span className="mr-1.5">{ok ? "✓" : "•"}</span>
                    {r.label}
                  </li>
                );
              })}
              <li className={password && password === confirm ? "text-green-600" : "text-stone-500"}>
                <span className="mr-1.5">{password && password === confirm ? "✓" : "•"}</span>
                Passwords match
              </li>
            </ul>
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
              disabled={submitting}
              className="cursor-pointer rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? "Saving..." : "Update"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default NewPasswordDialog;
