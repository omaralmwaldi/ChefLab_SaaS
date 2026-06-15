import { Navigate } from "react-router-dom";

function DashboardPage() {
  const token = localStorage.getItem("token");

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return <h1>Dashboard</h1>;
}

export default DashboardPage;
