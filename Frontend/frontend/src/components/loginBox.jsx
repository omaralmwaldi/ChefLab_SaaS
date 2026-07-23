import { useCallback, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../contexts/useAuth";
import client from "../api/client";
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
      const { data } = await client.post("/auth/login", { email, password });
      login(data);
      setWelcome({ name: data.user?.name });
    } catch (err) {
      setError(err.response?.data?.message || err.message || t("loginFailed"));
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
          <img src="/logo-icon-padding.svg" alt="ChefLab" className="mx-auto mb-4 h-20 w-20 object-contain" />
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
