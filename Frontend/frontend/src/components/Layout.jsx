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

  return (
    <div className="flex min-h-screen bg-stone-100">
      <SideBar />
      <div className="flex flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-stone-200 bg-white px-8 py-4">
          <h1 className="text-xl font-bold text-stone-800">{title}</h1>
          <LanguageSwitcher />
        </header>
        <main className="flex-1 overflow-auto p-8">{children}</main>
      </div>
    </div>
  );
}

export default Layout;
