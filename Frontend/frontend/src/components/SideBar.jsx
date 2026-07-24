import { NavLink } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../contexts/useAuth";
import { usePermissions } from "../contexts/usePermissions";
import { NAV_ITEMS } from "../constants/navigation";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Separator } from "./ui/separator";
import { LogOut } from "lucide-react";

function SideBar({ open = false, onClose = () => {} }) {
  const { user, logout } = useAuth();
  const { can } = usePermissions();
  const { t, i18n } = useTranslation("nav");

  const navLinks = NAV_ITEMS.filter((item) => can(item.permission));

  const roleName =
    i18n.language === "ar"
      ? user?.role?.nameAr || user?.role?.nameEn || ""
      : user?.role?.nameEn || "";

  return (
    <>
      {/* Mobile backdrop — tap to dismiss the drawer. Never shown on desktop. */}
      <div
        className={`fixed inset-0 z-40 bg-black/40 lg:hidden ${open ? "block" : "hidden"}`}
        onClick={onClose}
        aria-hidden="true"
      />
      <aside
        className={`fixed inset-y-0 inset-s-0 z-50 flex w-64 flex-col bg-stone-900 text-stone-300 transition-transform duration-200 lg:static lg:z-auto ${
          open
            ? "max-lg:translate-x-0"
            : "max-lg:-translate-x-full max-lg:rtl:translate-x-full"
        }`}
      >
      <div className="flex items-center gap-3 px-6 py-5">
        <div className="h-10 w-10 overflow-hidden rounded-xl">
          <img src="/logo-icon-padding.svg" alt="ChefLab" className="h-full w-full object-cover" />
        </div>
        <span className="text-lg font-bold text-white">ChefLab</span>
        <button
          type="button"
          onClick={onClose}
          aria-label={t("closeMenu", "Close menu")}
          className="ms-auto cursor-pointer rounded-lg p-1 text-stone-400 hover:bg-stone-800 hover:text-white lg:hidden"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <nav className="mt-6 flex-1 space-y-1 px-3">
        {navLinks.map((link) => (
          <NavLink
            key={link.path}
            to={link.path}
            end={link.path === "/dashboard"}
            onClick={onClose}
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

      <div className="border-t border-stone-700/60 p-4">
        <div className="rounded-xl border border-stone-700/50 bg-stone-800/40 p-3">
          <div className="flex items-center gap-3">
            <Avatar
              className="h-10 w-10 shrink-0 ring-2 ring-orange-500/25"
              aria-label={user?.name || "User"}
            >
              <AvatarFallback className="bg-linear-to-br from-orange-500 to-orange-600 text-sm font-semibold text-white">
                {user?.name?.charAt(0)?.toUpperCase() || "U"}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-stone-100">{user?.name || "User"}</p>
              {roleName && (
                <Badge className="mt-1 border-transparent bg-orange-500/10 px-2 py-0 text-[11px] font-medium text-orange-300 hover:bg-orange-500/10">
                  {roleName}
                </Badge>
              )}
            </div>
          </div>

          <Separator className="my-3 bg-stone-700/60" />

          <Button
            variant="ghost"
            onClick={logout}
            className="min-h-10 w-full justify-start gap-2 px-2 text-sm text-stone-400 transition-colors hover:bg-stone-800 hover:text-red-400 focus-visible:ring-orange-500/40"
          >
            <LogOut className="h-4 w-4" />
            {t("signOut")}
          </Button>
        </div>
      </div>
    </aside>
    </>
  );
}

export default SideBar;
