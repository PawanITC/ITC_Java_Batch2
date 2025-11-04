import React, { useContext } from "react";
import { Navigate } from "react-router-dom";
import { AuthContext } from "./AuthContext";

export default function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useContext(AuthContext);

  if (loading) return <div className="text-center mt-10">Checking authentication...</div>;
  if (!isAuthenticated) return <Navigate to="/" replace />;

  return children;
}
