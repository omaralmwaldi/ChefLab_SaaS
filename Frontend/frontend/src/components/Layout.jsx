import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import SideBar from "./SideBar";
import LanguageSwitcher from "./LanguageSwitcher";

const pageTitleKeys = {
  "/": "dashboard",
  "/recipes": "recipes",
  "/categories": "categories",
  "/ingredients": "ingredients",
  "/users": "users",
  "/roles": "roles",
};

function Layout({ children }) {
  const { pathname } = useLocation();
  const { t } = useTranslation("nav");
  const titleKey = pageTitleKeys[pathname];
  const title = titleKey ? t(titleKey) : "ChefLab";
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Close the mobile drawer on route change so it never lingers over content.
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  return (
    <div className="flex h-screen overflow-hidden bg-stone-100">
      <SideBar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <header className="flex shrink-0 items-center justify-between gap-3 border-b border-stone-200 bg-white px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              aria-label={t("openMenu", "Open menu")}
              className="cursor-pointer rounded-lg p-1.5 text-stone-600 hover:bg-stone-100 lg:hidden"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <h1 className="truncate text-lg font-bold text-stone-800 sm:text-xl">{title}</h1>
          </div>
          <LanguageSwitcher />
        </header>
        <main className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}

export default Layout;
