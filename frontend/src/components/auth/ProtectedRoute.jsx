import React from "react";
import { Navigate, useLocation, Outlet } from "react-router-dom";

/**
 * Enterprise Routing Security Wrapper (RBAC)
 * Guards application routes based on local authentication state and role-based access control.
 * * Note: True cryptographic security is enforced by the Django backend via HttpOnly cookies
 * and the Axios interceptor. This component handles instantaneous UX routing and layout protection.
 */
export const ProtectedRoute = ({
  requireSuperAdmin = false,
  requireOrgAdmin = false, // Added to protect Tenant Settings/Billing from standard Staff
}) => {
  const location = useLocation();

  // Retrieve instantaneous UI flags
  const isAuthenticated = localStorage.getItem("isAuthenticated") === "true";
  const userRole = localStorage.getItem("userRole"); // e.g., "SUPER_ADMIN", "ORG_ADMIN", "ORG_STAFF"

  // 1. Unauthenticated Bypass -> Redirect to Auth Gateway
  if (!isAuthenticated) {
    // We pass the attempted location in state so the login page can
    // seamlessly redirect them back to their requested page post-auth.
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 2. SuperAdmin Guard -> Kick standard tenants out of the platform console
  if (requireSuperAdmin && userRole !== "SUPER_ADMIN") {
    return <Navigate to="/admin" replace />;
  }

  // 3. Tenant Admin Guard -> Kick standard staff out of Billing & Settings
  if (requireOrgAdmin && userRole === "ORG_STAFF") {
    return <Navigate to="/admin/donors" replace />;
  }

  // 4. Cross-Pollination Guard -> Ensure SuperAdmins stay in their console
  // (Prevents them from accidentally navigating to missing Tenant URLs)
  if (!requireSuperAdmin && userRole === "SUPER_ADMIN") {
    return <Navigate to="/superadmin" replace />;
  }

  // 5. Clearance Verified -> Render the protected layout/component
  return <Outlet />;
};
