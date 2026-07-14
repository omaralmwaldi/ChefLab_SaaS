import { NavLink } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../contexts/useAuth";
import { usePermissions } from "../contexts/usePermissions";
import { NAV_ITEMS } from "../constants/navigation";

function SideBar() {
  const { user, logout } = useAuth();
  const { can } = usePermissions();
  const { t, i18n } = useTranslation("nav");

  const navLinks = NAV_ITEMS.filter((item) => can(item.permission));

  const roleName =
    i18n.language === "ar"
      ? user?.role?.nameAr || user?.role?.nameEn || ""
      : user?.role?.nameEn || "";

  return (
    <aside className="flex w-64 flex-col bg-stone-900 text-stone-300">
      <div className="flex items-center gap-3 px-6 py-5">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500">
          <svg className="h-6 w-6 fill-white" viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
          </svg>
        </div>
        <span className="text-lg font-bold text-white">ChefLab</span>
      </div>

      <nav className="mt-6 flex-1 space-y-1 px-3">
        {navLinks.map((link) => (
          <NavLink
            key={link.path}
            to={link.path}
            end={link.path === "/dashboard"}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-orange-500/10 text-orange-400"
                  : "text-stone-400 hover:bg-stone-800 hover:text-stone-200"
              }`
            }
          >
            <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d={link.icon} />
            </svg>
            {t(link.key)}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-stone-700 px-4 py-4">
        <div className="mb-2 flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-stone-700 text-sm font-semibold text-stone-300">
            {user?.name?.charAt(0)?.toUpperCase() || "U"}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-white">{user?.name || "User"}</p>
            <p className="truncate text-xs text-stone-500">{roleName}</p>
          </div>
        </div>
        <button
          onClick={logout}
          className="flex w-full cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm text-stone-500 transition-colors hover:bg-stone-800 hover:text-stone-300"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          {t("signOut")}
        </button>
      </div>
    </aside>
  );
}

export default SideBar;
