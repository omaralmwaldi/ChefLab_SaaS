import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthProvider";
import ProtectedRoute from "./components/ProtectedRoute";
import LandingRedirect from "./components/LandingRedirect";
import { PERMISSIONS } from "./constants/permissions";
import Layout from "./components/Layout";
import LoginPage from "./pages/login/LoginPage";
import DashboardPage from "./pages/dashboard/dashBoardPage";
import RecipeListPage from "./pages/recipes/RecipeListPage";
import RecipeViewPage from "./pages/recipes/RecipeViewPage";
import IngredientListPage from "./pages/ingredients/IngredientListPage";
import CategoryListPage from "./pages/categories/CategoryListPage";
import UserListPage from "./pages/users/UserListPage";
import RoleListPage from "./pages/roles/RoleListPage";
import NoAccessPage from "./pages/no-access/NoAccessPage";

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/no-access" element={<NoAccessPage />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <LandingRedirect />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute permission={PERMISSIONS.DASHBOARD_ACCESS}>
                <Layout>
                  <DashboardPage />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/recipes"
            element={
              <ProtectedRoute permission={PERMISSIONS.RECIPES_VIEW}>
                <Layout>
                  <RecipeListPage />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/recipes/:id"
            element={
              <ProtectedRoute permission={PERMISSIONS.RECIPES_VIEW}>
                <Layout>
                  <RecipeViewPage />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/categories"
            element={
              <ProtectedRoute permission={PERMISSIONS.CATEGORIES_VIEW}>
                <Layout>
                  <CategoryListPage />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/ingredients"
            element={
              <ProtectedRoute permission={PERMISSIONS.INGREDIENTS_VIEW}>
                <Layout>
                  <IngredientListPage />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/users"
            element={
              <ProtectedRoute permission={PERMISSIONS.USERS_VIEW}>
                <Layout>
                  <UserListPage />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/roles"
            element={
              <ProtectedRoute permission={PERMISSIONS.ROLES_VIEW}>
                <Layout>
                  <RoleListPage />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
