import React from "react";
import { Navigate, useLocation, Outlet } from "react-router-dom";

export const ProtectedRoute = ({ requireSuperAdmin = false }) => {
  const location = useLocation();

  // Check our basic UI flags instead of the JWT
  const isAuthenticated = localStorage.getItem("isAuthenticated") === "true";
  const userRole = localStorage.getItem("userRole");

  // 1. Check if they are logged in
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 2. Optional: Check if they have the right role for this route
  if (requireSuperAdmin && userRole !== "SUPER_ADMIN") {
    // Kick normal admins out of the SuperAdmin area
    return <Navigate to="/admin" replace />;
  }

  // 3. Render the protected component
  // (If an API call fails inside here, your Axios interceptor handles the secure logout)
  return <Outlet />;
};
