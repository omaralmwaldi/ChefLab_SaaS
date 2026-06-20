import { useState, useEffect } from "react";
import client from "../../../api/client";

function UserModal({ mode, initialData, onClose, onSuccess }) {
  const [name, setName] = useState(initialData?.name || "");
  const [email, setEmail] = useState(initialData?.email || "");
  const [phone, setPhone] = useState(initialData?.phone || "");
  const [password, setPassword] = useState("");
  const [roleId, setRoleId] = useState(initialData?.roleId || "");
  const [roles, setRoles] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState(null);

  useEffect(() => {
    let cancelled = false;
    client.get("/roles")
      .then((res) => { if (!cancelled) setRoles(res.data); })
      .catch(() => { if (!cancelled) setRoles([]); });
    return () => { cancelled = true; };
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setErrors(null);

    if (mode === "create" && !password.trim()) {
      setErrors([{ message: "Password is required" }]);
      return;
    }

    const payload = {
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim() || null,
      roleId: roleId || null,
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
        setErrors([{ message: err.response.data?.message || "Email already exists" }]);
      } else {
        setErrors([{ message: err.response?.data?.message || "Something went wrong" }]);
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-lg" onClick={(e) => e.stopPropagation()}>
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-bold text-stone-800">
            {mode === "create" ? "Add User" : "Edit User"}
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
            <label className="mb-1 block text-sm font-medium text-stone-700" htmlFor="user-name">Name</label>
            <input
              id="user-name"
              className="w-full rounded-lg border border-stone-200 px-3 py-2.5 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Full name"
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-stone-700" htmlFor="user-email">Email</label>
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
            <label className="mb-1 block text-sm font-medium text-stone-700" htmlFor="user-phone">Phone <span className="text-stone-400">(optional)</span></label>
            <input
              id="user-phone"
              className="w-full rounded-lg border border-stone-200 px-3 py-2.5 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="05xxxxxxxx"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-stone-700" htmlFor="user-role">Role</label>
            <select
              id="user-role"
              className="w-full rounded-lg border border-stone-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10"
              value={roleId}
              onChange={(e) => setRoleId(e.target.value)}
            >
              <option value="">No role</option>
              {roles.map((r) => (
                <option key={r.id} value={r.id}>{r.nameEn}</option>
              ))}
            </select>
          </div>
          {mode === "create" && (
            <div>
              <label className="mb-1 block text-sm font-medium text-stone-700" htmlFor="user-password">
                Password
              </label>
              <input
                id="user-password"
                type="password"
                className="w-full rounded-lg border border-stone-200 px-3 py-2.5 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min 10 chars: upper, lower, number, special"
                required
              />
              <ul className="space-y-1 rounded-lg border border-stone-200 bg-stone-50 px-3 py-2 text-xs">
                
                
              </ul>
            </div>
            
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
              {submitting ? "Saving..." : mode === "create" ? "Create" : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default UserModal;
