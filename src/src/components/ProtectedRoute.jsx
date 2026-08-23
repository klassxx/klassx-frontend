import { Navigate } from "react-router-dom";
import { useAuth } from "../api/AuthContext";

/**
 * @param {string[]} [roles] - if provided, only these user.role values may access the route.
 */
export default function ProtectedRoute({ children, roles }) {
  const { user, loading } = useAuth();

  if (loading) return <div className="container">Chargement…</div>;
  if (!user) return <Navigate to="/connexion" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />;

  return children;
}
