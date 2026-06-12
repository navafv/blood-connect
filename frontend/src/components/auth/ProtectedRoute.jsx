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
    error,
  } = useQuery({
    queryKey: ["auth-session-verify"],
    queryFn: async () => {
      const response = await api.get("/auth/me/");
      return response.data;
    },
    retry: 1,
    staleTime: 5 * 60 * 1000,
  });

  if (isLoading) {
    return (
      <div className="flex h-screen w-screen flex-col items-center justify-center bg-slate-50 transition-colors duration-300 dark:bg-slate-950 gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-rose-600 dark:text-rose-500 transition-colors" />
        <span className="text-sm font-bold tracking-widest text-slate-600 dark:text-slate-500 uppercase transition-colors">
          Verifying Clearance...
        </span>
      </div>
    );
  }

  if (error || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // --- STRICT RBAC ENFORCEMENT ---

  // 1. SuperAdmin Guard
  if (requireSuperAdmin && user.role !== "SUPER_ADMIN") {
    if (user.role === "ORG_ADMIN") return <Navigate to="/admin" replace />;
    return <Navigate to="/" replace />;
  }

  // 2. OrgAdmin Guard
  if (requireOrgAdmin && user.role !== "ORG_ADMIN") {
    if (user.role === "SUPER_ADMIN")
      return <Navigate to="/superadmin" replace />;
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};
