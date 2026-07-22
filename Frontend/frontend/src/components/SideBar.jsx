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
        <div className="h-10 w-10 overflow-hidden rounded-xl">
          <img src="/logo-icon-padding.svg" alt="ChefLab" className="h-full w-full object-cover" />
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
  );
}

export default SideBar;
