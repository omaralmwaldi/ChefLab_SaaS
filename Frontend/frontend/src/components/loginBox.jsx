import { useCallback, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../contexts/useAuth";
import LanguageSwitcher from "./LanguageSwitcher";
import AuthBackground from "./AuthBackground";
import WelcomeOverlay from "./WelcomeOverlay";

function LoginBox() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [welcome, setWelcome] = useState(null);

  const finish = useCallback(() => navigate("/", { replace: true }), [navigate]);

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
        throw new Error(data.message || t("loginFailed"));
      }

      const data = await res.json();
      login(data);
      setWelcome({ name: data.user?.name });
    } catch (err) {
      setError(err.message);
      setSubmitting(false);
    }
  }

  if (welcome) {
    return (
      <WelcomeOverlay
        title={t("welcomeBack", { name: welcome.name })}
        hint={t("enteringApp")}
        onDone={finish}
      />
    );
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-stone-100 p-5">
      <AuthBackground />
      <div className="absolute top-4 inset-e-4 z-10">
        <LanguageSwitcher />
      </div>
    <div className="relative z-10 w-full max-w-sm rounded-2xl border border-white/60 bg-white/90 px-10 pb-10 pt-12 shadow-[0_8px_40px_rgba(44,62,80,0.12),0_1px_4px_rgba(44,62,80,0.04)] backdrop-blur-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-[14px] bg-orange-500">
            <svg className="h-7 w-7 fill-white" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
            </svg>
          </div>
          <h1 className="m-0 text-[28px] font-bold tracking-[-0.5px] text-stone-800">ChefLab</h1>
          <p className="m-0 mt-1 text-[15px] text-stone-400">{t("signInSubtitle")}</p>
        </div>

        {error && (
          <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-center text-sm text-red-600">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-5">
            <label className="mb-1.5 block text-sm font-semibold text-stone-800" htmlFor="email">{t("email")}</label>
            <input
              className="w-full rounded-xl border border-stone-200 bg-white px-3.5 py-3 text-[15px] text-stone-800 outline-none transition-[border-color,box-shadow] duration-200 placeholder:text-stone-400 focus:border-orange-500 focus:ring-3 focus:ring-orange-600/10"
              id="email"
              type="email"
              placeholder={t("emailPlaceholder")}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div className="mb-5">
            <label className="mb-1.5 block text-sm font-semibold text-stone-800" htmlFor="password">{t("password")}</label>
            <input
              className="w-full rounded-xl border border-stone-200 bg-white px-3.5 py-3 text-[15px] text-stone-800 outline-none transition-[border-color,box-shadow] duration-200 placeholder:text-stone-400 focus:border-orange-600 focus:ring-3 focus:ring-orange-600/10"
              id="password"
              type="password"
              placeholder={t("passwordPlaceholder")}
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
            {submitting ? t("signingIn") : t("signIn")}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-stone-400">
          {t("noAccount")}{" "}
          <Link to="/register" className="font-semibold text-orange-500 hover:text-orange-600">
            {t("signUpLink")}
          </Link>
        </p>
      </div>
    </div>
  );
}

export default LoginBox;
