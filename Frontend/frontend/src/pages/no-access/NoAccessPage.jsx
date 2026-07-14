import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

// Shown when a ProtectedRoute permission check fails. Standalone (no Layout) so
// it works even for users with no dashboard access.
function NoAccessPage() {
  const { t } = useTranslation(["common"]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-stone-100 px-6 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-red-500 bg-opacity-10">
        <svg className="h-8 w-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      </div>
      <h1 className="mt-6 text-2xl font-bold text-stone-800">{t("common.noAccessTitle")}</h1>
      <p className="mt-2 max-w-md text-stone-500">{t("common.noAccessMessage")}</p>
      <Link
        to="/"
        className="mt-8 rounded-lg bg-orange-500 px-5 py-2.5 font-medium text-white transition hover:bg-orange-600"
      >
        {t("common.noAccessBack")}
      </Link>
    </div>
  );
}

export default NoAccessPage;
