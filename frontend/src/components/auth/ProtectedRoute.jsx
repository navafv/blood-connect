import React from "react";
import { Navigate, useLocation, Outlet } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Loader2, ShieldAlert } from "lucide-react";
import api from "../../lib/axios";

/**
 * Enterprise Routing Security Wrapper (RBAC)
 * Enforces cryptographic session verification via the backend before granting
 * access to protected layouts.
 */
export const ProtectedRoute = ({
  requireSuperAdmin = false,
  requireOrgAdmin = false,
}) => {
  const location = useLocation();

  // --- Cryptographic Session Verification ---
  const {
    data: user,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["auth-session-verify"],
    queryFn: async () => {
      // Pings the backend to validate the HttpOnly JWT cookie
      const response = await api.get("/auth/me/");
      return response.data;
    },
    retry: false, // If 401 Unauthorized, fail immediately without retrying
    staleTime: 5 * 60 * 1000, // Cache the session for 5 minutes so navigation stays snappy
  });

  // 1. Await Backend Resolution
  if (isLoading) {
    return (
      <div className="flex h-screen w-screen flex-col items-center justify-center bg-slate-950 gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-rose-500" />
        <span className="text-sm font-bold tracking-widest text-slate-500 uppercase">
          Verifying Clearance...
        </span>
      </div>
    );
  }

  // 2. Unauthenticated / Spoofed Bypass -> Redirect to Auth Gateway
  if (isError || !user) {
    // Purge any spoofed or lingering local storage flags
    localStorage.removeItem("isAuthenticated");
    localStorage.removeItem("userRole");

    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Source of truth is now the API, with local storage as a fallback sync
  const userRole = user.role || localStorage.getItem("userRole");

  // 3. SuperAdmin Guard -> Kick standard tenants out of the platform console
  if (requireSuperAdmin && userRole !== "SUPER_ADMIN") {
    return <Navigate to="/admin" replace />;
  }

  // 4. Tenant Admin Guard -> Kick standard staff out of Billing & Settings
  if (requireOrgAdmin && userRole === "ORG_STAFF") {
    return <Navigate to="/admin/donors" replace />;
  }

  // 5. Cross-Pollination Guard -> Ensure SuperAdmins stay in their console
  if (!requireSuperAdmin && userRole === "SUPER_ADMIN") {
    return <Navigate to="/superadmin" replace />;
  }

  // 6. Clearance Verified -> Render the protected layout/component
  return <Outlet />;
};
