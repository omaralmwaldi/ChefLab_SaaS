import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/useAuth";

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-stone-100">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-stone-300 border-t-orange-500" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  return children;
}

export default ProtectedRoute;
