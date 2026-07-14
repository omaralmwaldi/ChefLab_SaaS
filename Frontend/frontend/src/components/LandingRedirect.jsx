import { Navigate } from "react-router-dom";
import { usePermissions } from "../contexts/usePermissions";
import { firstAccessiblePath } from "../constants/navigation";

// Index route ("/") resolver. Sends the user to the first navigation route they
// can access (in navigation order); if they can access none, to /no-access.
// Wrapped in ProtectedRoute so auth + loading are already settled here.
function LandingRedirect() {
  const { can } = usePermissions();
  const target = firstAccessiblePath(can) ?? "/no-access";
  return <Navigate to={target} replace />;
}

export default LandingRedirect;
