import { useCallback, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../contexts/useAuth";
import { PASSWORD_RULES } from "../pages/users/components/passwordRules";
import LanguageSwitcher from "./LanguageSwitcher";
import AuthBackground from "./AuthBackground";
import WelcomeOverlay from "./WelcomeOverlay";

const inputClass =
  "w-full rounded-xl border border-stone-200 bg-white px-3.5 py-3 text-[15px] text-stone-800 outline-none transition-[border-color,box-shadow] duration-200 placeholder:text-stone-400 focus:border-orange-500 focus:ring-3 focus:ring-orange-600/10";

function RegisterBox() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { login } = useAuth();

  const [step, setStep] = useState(1);
  const [organizationName, setOrganizationName] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [welcome, setWelcome] = useState(null);

  const step1Valid = organizationName.trim() && name.trim();
  const rulesPass = PASSWORD_RULES.every((r) => r.test(password));
  const match = password.length > 0 && password === confirmPassword;
  const step2Valid = email.trim() && rulesPass && match;

  const finish = useCallback(() => navigate("/", { replace: true }), [navigate]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!step2Valid) return;
    setError("");
    setSubmitting(true);

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organizationName,
          name,
          email,
          password,
          confirmPassword,
          preferredLanguage: i18n.language === "ar" ? "ar" : "en",
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || t("signupFailed"));
      }

      const data = await res.json();
      login(data);
      setWelcome({ name: data.user?.name || name, org: organizationName });
    } catch (err) {
      setError(err.message);
      setSubmitting(false);
    }
  }

  if (welcome) {
    return (
      <WelcomeOverlay
        title={t("welcomeTitle", { name: welcome.name })}
        subtitle={t("welcomeReady", { org: welcome.org })}
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

      <div className="relative z-10 w-full max-w-md rounded-2xl border border-white/60 bg-white/90 px-10 pb-10 pt-11 shadow-[0_8px_40px_rgba(44,62,80,0.12),0_1px_4px_rgba(44,62,80,0.04)] backdrop-blur-sm">
        <div className="mb-2 text-center">
          <img src="/logo-icon.svg" alt="ChefLab" className="mx-auto h-20 w-20" />
          <h1 className="m-0 text-[28px] font-bold tracking-[-0.5px] text-stone-800">{t("createAccount")}</h1>
          <p className="m-0 mt-1 text-[15px] text-stone-400">
            {step === 1 ? t("registerSubtitle") : t("step2Subtitle")}
          </p>
        </div>

        {/* step indicator: numbered circles */}
        <div className="mb-6 flex items-center justify-center gap-3">
          {[1, 2].map((s, i) => (
            <div key={s} className="flex items-center gap-3">
              <div
                className={`flex h-9 w-9 items-center justify-center rounded-full border-2 text-sm font-bold transition-colors duration-300 ${
                  step > s
                    ? "border-orange-500 bg-orange-500 text-white"
                    : step === s
                      ? "border-orange-500 bg-orange-50 text-orange-600"
                      : "border-stone-200 bg-white text-stone-400"
                }`}
              >
                {step > s ? (
                  <svg className="h-4 w-4 fill-none stroke-white" strokeWidth={3} viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                ) : (
                  s
                )}
              </div>
              {i === 0 && (
                <div
                  className={`h-0.5 w-10 rounded-full transition-colors duration-300 ${
                    step > 1 ? "bg-orange-500" : "bg-stone-200"
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {error && (
          <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-center text-sm text-red-600">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {step === 1 ? (
            <div key="step1" className="welcome-line">
              <div className="mb-5">
                <label className="mb-1.5 block text-sm font-semibold text-stone-800" htmlFor="organizationName">{t("organizationName")}</label>
                <input
                  className={inputClass}
                  id="organizationName"
                  type="text"
                  placeholder={t("orgNamePlaceholder")}
                  value={organizationName}
                  onChange={(e) => setOrganizationName(e.target.value)}
                  autoFocus
                />
              </div>

              <div className="mb-6">
                <label className="mb-1.5 block text-sm font-semibold text-stone-800" htmlFor="name">{t("fullName")}</label>
                <input
                  className={inputClass}
                  id="name"
                  type="text"
                  placeholder={t("fullNamePlaceholder")}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <button
                type="button"
                onClick={() => step1Valid && setStep(2)}
                disabled={!step1Valid}
                className="w-full cursor-pointer rounded-xl border-none bg-orange-500 px-4 py-3.5 text-base font-semibold text-white transition-[background,transform] duration-200 active:scale-[0.98] disabled:scale-100 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {t("continue")}
              </button>
            </div>
          ) : (
            <div key="step2" className="welcome-line">
              <div className="mb-5">
                <label className="mb-1.5 block text-sm font-semibold text-stone-800" htmlFor="email">{t("email")}</label>
                <input
                  className={inputClass}
                  id="email"
                  type="email"
                  placeholder={t("emailPlaceholder")}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoFocus
                />
              </div>

              <div className="mb-4">
                <label className="mb-1.5 block text-sm font-semibold text-stone-800" htmlFor="password">{t("password")}</label>
                <input
                  className={inputClass}
                  id="password"
                  type="password"
                  placeholder={t("passwordPlaceholder")}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              <div className="mb-4">
                <label className="mb-1.5 block text-sm font-semibold text-stone-800" htmlFor="confirmPassword">{t("confirmPassword")}</label>
                <input
                  className={inputClass}
                  id="confirmPassword"
                  type="password"
                  placeholder={t("confirmPasswordPlaceholder")}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>

              <ul className="mb-6 grid grid-cols-2 gap-x-3 gap-y-1 rounded-xl border border-stone-200 bg-stone-50 px-3.5 py-2.5 text-xs">
                {PASSWORD_RULES.map((r) => {
                  const ok = r.test(password);
                  return (
                    <li key={r.key} className={ok ? "text-green-600" : "text-stone-500"}>
                      <span className="me-1.5">{ok ? "✓" : "•"}</span>
                      {t(r.key)}
                    </li>
                  );
                })}
                <li className={match ? "text-green-600" : "text-stone-500"}>
                  <span className="me-1.5">{match ? "✓" : "•"}</span>
                  {t("passwordsMatch")}
                </li>
              </ul>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="cursor-pointer rounded-xl border border-stone-200 bg-white px-5 py-3.5 text-base font-semibold text-stone-600 transition-colors hover:bg-stone-50"
                >
                  {t("back")}
                </button>
                <button
                  type="submit"
                  disabled={!step2Valid || submitting}
                  className="flex-1 cursor-pointer rounded-xl border-none bg-orange-500 px-4 py-3.5 text-base font-semibold text-white transition-[background,transform] duration-200 active:scale-[0.98] disabled:scale-100 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {submitting ? t("creatingAccount") : t("signUp")}
                </button>
              </div>
            </div>
          )}
        </form>

        <p className="mt-6 text-center text-sm text-stone-400">
          {t("haveAccount")}{" "}
          <Link to="/login" className="font-semibold text-orange-500 hover:text-orange-600">
            {t("signInLink")}
          </Link>
        </p>
      </div>
    </div>
  );
}

export default RegisterBox;
