import { useLocation } from "react-router-dom";
import SideBar from "./SideBar";

const pageTitles = {
  "/": "Dashboard",
  "/recipes": "Recipes",
  "/ingredients": "Ingredients",
  "/categories": "Categories",
  "/users": "Users",
  "/roles": "Roles",
};

function Layout({ children }) {
  const { pathname } = useLocation();
  const title = pageTitles[pathname] || "ChefLab";

  return (
    <div className="flex min-h-screen bg-stone-100">
      <SideBar />
      <div className="flex flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-stone-200 bg-white px-8 py-4">
          <h1 className="text-xl font-bold text-stone-800">{title}</h1>
        </header>
        <main className="flex-1 overflow-auto p-8">{children}</main>
      </div>
    </div>
  );
}

export default Layout;
