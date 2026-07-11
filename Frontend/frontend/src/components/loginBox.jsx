import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/useAuth";
import LanguageSwitcher from "./LanguageSwitcher";

function LoginBox() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Login failed");
      }

      const data = await res.json();
      login(data);
      navigate("/", { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-stone-100 p-5">
      <div className="absolute top-4 end-4">
        <LanguageSwitcher />
      </div>
      <div className="w-full max-w-sm rounded-2xl bg-white px-10 pb-10 pt-12 shadow-[0_4px_24px_rgba(44,62,80,0.08),_0_1px_4px_rgba(44,62,80,0.04)] transition-shadow duration-300 hover:shadow-[0_8px_32px_rgba(44,62,80,0.12),_0_2px_8px_rgba(44,62,80,0.06)]">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-[14px] bg-orange-500">
            <svg className="h-7 w-7 fill-white" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
            </svg>
          </div>
          <h1 className="m-0 text-[28px] font-bold tracking-[-0.5px] text-stone-800">ChefLab</h1>
          <p className="m-0 mt-1 text-[15px] text-stone-400">Sign in to your account</p>
        </div>

        {error && (
          <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-center text-sm text-red-600">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-5">
            <label className="mb-1.5 block text-sm font-semibold text-stone-800" htmlFor="email">Email</label>
            <input
              className="w-full rounded-xl border border-stone-200 bg-white px-3.5 py-3 text-[15px] text-stone-800 outline-none transition-[border-color,box-shadow] duration-200 placeholder:text-stone-400 focus:border-orange-500 focus:ring-3 focus:ring-orange-600/10"
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div className="mb-5">
            <label className="mb-1.5 block text-sm font-semibold text-stone-800" htmlFor="password">Password</label>
            <input
              className="w-full rounded-xl border border-stone-200 bg-white px-3.5 py-3 text-[15px] text-stone-800 outline-none transition-[border-color,box-shadow] duration-200 placeholder:text-stone-400 focus:border-orange-600 focus:ring-3 focus:ring-orange-600/10"
              id="password"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            className="mt-2 w-full cursor-pointer rounded-xl border-none bg-orange-500 px-4 py-3.5 text-base font-semibold text-white transition-[background,transform] duration-200 active:scale-[0.98] disabled:scale-100 disabled:cursor-not-allowed disabled:opacity-60 hover:bg-orange-500"
            type="submit"
            disabled={submitting}
          >
            {submitting ? "Signing in\u2026" : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default LoginBox;
