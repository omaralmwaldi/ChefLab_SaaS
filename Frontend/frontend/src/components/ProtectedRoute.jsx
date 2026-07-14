import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/useAuth";
import { usePermissions } from "../contexts/usePermissions";

// Route guard. Requires an authenticated user; when `permission` is set it also
// requires that permission (owner passes any) and otherwise redirects to
// /no-access. While /auth/me is in flight it shows a spinner so we never bounce
// a user before their permissions have loaded.
function ProtectedRoute({ children, permission }) {
  const { user, loading } = useAuth();
  const { can } = usePermissions();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-stone-100">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-stone-300 border-t-orange-500" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  if (permission && !can(permission)) return <Navigate to="/no-access" replace />;
  return children;
}

export default ProtectedRoute;
