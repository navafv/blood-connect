import React, { useState } from "react";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import {
  Menu,
  Droplet,
  AlertTriangle,
  CreditCard,
  AlertOctagon,
} from "lucide-react";
import toast from "react-hot-toast";
import api from "../../lib/axios";
import { Sidebar } from "./Sidebar";
import { Button } from "../ui/Button";

export function AdminLayout() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const queryClient = useQueryClient();
  const location = useLocation();
  const navigate = useNavigate();

  // Fetch User Data to check Email Verification
  const { data: user, isLoading: isUserLoading } = useQuery({
    queryKey: ["auth-user"],
    queryFn: async () => {
      const response = await api.get("/auth/me/");
      return response.data;
    },
    staleTime: 1000 * 60 * 5,
  });

  // Fetch Organization Data globally for the Sidebar and Lockouts
  const { data: orgData, isLoading: isOrgLoading } = useQuery({
    queryKey: ["tenant-org-profile"],
    queryFn: async () => {
      const response = await api.get("/tenant/organization/");
      return response.data;
    },
    staleTime: 1000 * 60 * 5,
  });

  const handleLogout = async () => {
    const loading = toast.loading("Closing secure session...");
    try {
      await api.post("/auth/logout/");
      toast.success("Logged out.", { id: loading });
    } catch (error) {
      toast.error("Session purged locally.", { id: loading });
    } finally {
      queryClient.clear();
      localStorage.removeItem("isAuthenticated");
      localStorage.removeItem("userRole");
      navigate("/login", { replace: true });
    }
  };

  const handleVerifyEmail = async () => {
    try {
      await api.post("/auth/resend-otp/", { email: user?.email });
      navigate("/verify-email", { state: { email: user?.email } });
    } catch (err) {
      toast.error("Could not send verification code.");
    }
  };

  if (isUserLoading || isOrgLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-950">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-500"></div>
      </div>
    );
  }

  // --- SUSPENSION LOCKDOWN LOGIC ---
  if (orgData?.status === "SUSPENDED") {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-950 px-4">
        <Helmet>
          <title>Account Suspended | Bloodonate</title>
        </Helmet>
        <div className="max-w-md w-full bg-slate-900/60 backdrop-blur-xl border border-rose-500/20 p-8 rounded-3xl text-center space-y-6 shadow-2xl">
          <div className="h-20 w-20 bg-rose-500/10 border border-rose-500/20 rounded-full flex items-center justify-center mx-auto shadow-inner">
            <AlertOctagon
              className="h-10 w-10 text-rose-500"
              aria-hidden="true"
            />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white mb-2">
              Account Suspended
            </h2>
            <p className="text-slate-400 text-sm leading-relaxed">
              Your organization's access to the Bloodonate platform has been
              suspended by the administrator, likely due to an expired
              subscription. Please contact support to resolve this issue.
            </p>
          </div>
          <Button
            onClick={handleLogout}
            variant="outline"
            className="w-full border-slate-700 bg-slate-950/50 hover:bg-slate-800"
          >
            Sign Out
          </Button>
        </div>
      </div>
    );
  }

  // Calculate Subscription Status
  const isPaid =
    orgData?.is_paid && new Date(orgData?.subscription_expires_at) > new Date();

  return (
    <div className="flex h-screen w-screen bg-slate-950 text-slate-100 font-sans overflow-hidden">
      <Helmet>
        <title>
          {orgData?.name
            ? `${orgData.name} Admin | Bloodonate`
            : "Facility Admin | Bloodonate"}
        </title>
      </Helmet>

      {/* Sidebar without visual lockouts */}
      <Sidebar isOpen={isMobileMenuOpen} setIsOpen={setIsMobileMenuOpen} />

      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-slate-950/80 z-40 md:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setIsMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      <main className="flex-1 flex flex-col h-full relative z-0 min-w-0">
        {/* --- EMAIL VERIFICATION BANNER --- */}
        {user && !user.is_email_verified && (
          <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-3 flex items-center justify-between z-50 shrink-0">
            <div className="flex items-center gap-3">
              <AlertTriangle
                className="h-5 w-5 text-amber-500 shrink-0"
                aria-hidden="true"
              />
              <p className="text-sm font-medium text-amber-500">
                Your email address is not verified. Please verify it to secure
                your account.
              </p>
            </div>
            <button
              onClick={handleVerifyEmail}
              className="text-sm font-bold text-amber-400 hover:text-amber-300 underline underline-offset-4 shrink-0 ml-4"
            >
              Verify Now
            </button>
          </div>
        )}

        {/* --- EXPIRED SUBSCRIPTION BANNER --- */}
        {!isPaid && (
          <div className="bg-rose-500/10 border-b border-rose-500/20 px-4 py-3 flex items-center justify-between z-50 shrink-0">
            <div className="flex items-center gap-3">
              <CreditCard
                className="h-5 w-5 text-rose-500 shrink-0"
                aria-hidden="true"
              />
              <p className="text-sm font-medium text-rose-500">
                Your subscription is inactive or has expired. Please renew your
                license to avoid account suspension.
              </p>
            </div>
            <button
              onClick={() => navigate("/admin/settings/billing")}
              className="text-sm font-bold text-rose-400 hover:text-rose-300 underline underline-offset-4 shrink-0 ml-4 whitespace-nowrap"
            >
              Renew Now
            </button>
          </div>
        )}

        {/* Dynamic Mobile Header */}
        <header className="md:hidden flex items-center justify-between p-4 border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-xl sticky top-0 z-30 shadow-sm">
          <div className="flex items-center gap-2.5 overflow-hidden">
            {orgData?.logo ? (
              <img
                src={orgData.logo}
                alt={`${orgData.name} Logo`}
                className="h-8 w-8 rounded-lg object-cover border border-slate-700 shrink-0"
              />
            ) : (
              <div className="h-8 w-8 rounded-lg bg-rose-500/10 flex items-center justify-center border border-rose-500/20 shrink-0">
                <Droplet
                  className="h-5 w-5 text-rose-500 fill-rose-500/20"
                  aria-hidden="true"
                />
              </div>
            )}
            <span className="text-xl font-black tracking-tight text-white truncate">
              {orgData?.name || "Bloodonate"}
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="text-slate-300 hover:text-white p-2 rounded-lg hover:bg-slate-800 border border-transparent"
              aria-label="Open mobile menu"
              aria-expanded={isMobileMenuOpen}
            >
              <Menu className="h-6 w-6" aria-hidden="true" />
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar bg-slate-950 relative">
          <div
            className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-125 bg-rose-500/5 blur-[120px] rounded-full pointer-events-none"
            aria-hidden="true"
          />
          <div className="relative z-10 w-full min-h-full">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
}
