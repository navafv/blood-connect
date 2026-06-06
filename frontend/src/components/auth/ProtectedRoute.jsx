import React from "react";
import { Navigate, useLocation, Outlet } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import api from "../../lib/axios";

export const ProtectedRoute = ({
  requireSuperAdmin = false,
  requireOrgAdmin = false,
}) => {
  const location = useLocation();

  const {
    data: user,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["auth-session-verify"],
    queryFn: async () => {
      const response = await api.get("/auth/me/");
      return response.data;
    },
    retry: false,
    staleTime: 5 * 60 * 1000,
  });

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

  if (isError || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // --- STRICT RBAC ENFORCEMENT ---

  // 1. SuperAdmin Guard
  if (requireSuperAdmin && user.role !== "SUPER_ADMIN") {
    // If an OrgAdmin tries to access SuperAdmin, send them to their dashboard
    if (user.role === "ORG_ADMIN") return <Navigate to="/admin" replace />;
    // Otherwise kick to home
    return <Navigate to="/" replace />;
  }

  // 2. OrgAdmin Guard (Prevents PUBLIC_USER from accessing tenant dashboard)
  if (requireOrgAdmin && user.role !== "ORG_ADMIN") {
    // If SuperAdmin tries to access tenant dashboard, send them to global dashboard
    if (user.role === "SUPER_ADMIN")
      return <Navigate to="/superadmin" replace />;
    // If public user, kick to home
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};
