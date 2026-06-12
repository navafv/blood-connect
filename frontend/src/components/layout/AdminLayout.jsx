import React, { useState, useEffect } from "react";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { Outlet, useNavigate, useLocation, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import {
  Menu,
  Droplet,
  AlertTriangle,
  CreditCard,
  AlertOctagon,
  LayoutDashboard,
  Users,
  UserPlus,
  LogOut,
  X,
  LifeBuoy,
  Building2,
  ChevronRight,
  Lock,
  Sun,
  Moon,
  Activity,
} from "lucide-react";
import toast from "react-hot-toast";
import api from "../../lib/axios";
import { Button } from "../ui/Button";

// ============================================================================
// SIDEBAR COMPONENT
// ============================================================================
export function Sidebar({ isOpen, setIsOpen }) {
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const menuItems = [
    { name: "Overview", path: "/admin", icon: LayoutDashboard },
    { name: "Manage Donors", path: "/admin/donors", icon: Users },
    { name: "Register Donor", path: "/admin/add-donor", icon: UserPlus },
    { name: "Support", path: "/admin/support", icon: LifeBuoy },
    { name: "Profile Settings", path: "/admin/settings", icon: Building2 },
    { name: "Account Settings", path: "/admin/settings/security", icon: Lock },
    {
      name: "Billing & Subscription",
      path: "/admin/settings/billing",
      icon: CreditCard,
    },
  ];

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

  const handleLinkClick = () => {
    if (setIsOpen) setIsOpen(false);
  };

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-50 w-72 flex flex-col shadow-2xl md:shadow-none border-r transition-all duration-300 ease-in-out md:translate-x-0 md:static md:h-screen bg-white border-slate-200 dark:bg-slate-900/60 dark:border-slate-800/80 ${
        isOpen ? "translate-x-0" : "-translate-x-full"
      }`}
      aria-label="Sidebar Navigation"
    >
      {/* Sidebar Header */}
      <div className="h-20 px-6 flex items-center justify-between border-b shrink-0 transition-colors duration-300 border-slate-200 dark:border-slate-800/60">
        <div className="flex items-center gap-3">
          <div className="p-1.5 rounded-lg border shadow-sm transition-colors duration-300 bg-rose-50 border-rose-200 dark:bg-rose-500/10 dark:border-rose-500/20 dark:shadow-inner">
            <Droplet
              className="h-6 w-6 transition-colors duration-300 text-rose-600 fill-rose-600/20 dark:text-rose-500 dark:fill-rose-500/20"
              aria-hidden="true"
            />
          </div>
          <div>
            <h2 className="text-sm font-black tracking-widest uppercase transition-colors duration-300 text-slate-900 dark:text-white">
              Bloodonate
            </h2>
            <p className="text-[10px] font-bold uppercase tracking-widest transition-colors duration-300 text-rose-600 dark:text-rose-400">
              Facility Admin
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsOpen(false)}
          className="md:hidden p-2 rounded-lg transition-colors duration-300 text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
          aria-label="Close menu"
        >
          <X className="h-5 w-5" aria-hidden="true" />
        </button>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 px-4 py-6 space-y-8 overflow-y-auto custom-scrollbar">
        {/* Primary Operations */}
        <div className="space-y-1.5">
          <p className="text-[10px] font-bold uppercase tracking-widest px-3 mb-2 transition-colors duration-300 text-slate-500 dark:text-slate-500">
            Operations
          </p>
          {menuItems.slice(0, 4).map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;

            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={handleLinkClick}
                aria-current={isActive ? "page" : undefined}
                className={`group flex items-center justify-between gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-300 border ${
                  isActive
                    ? "bg-rose-50 text-rose-700 border-rose-200 shadow-sm dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20 dark:shadow-inner"
                    : "border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100 hover:border-slate-200 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800/50 dark:hover:border-slate-700/50"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`h-4.5 w-4.5 transition-colors duration-300 ${isActive ? "text-rose-600 dark:text-rose-500" : "text-slate-400 group-hover:text-slate-600 dark:text-slate-500 dark:group-hover:text-slate-400"}`}
                    aria-hidden="true"
                  />
                  <span className="text-sm">{item.name}</span>
                </div>
                {isActive && (
                  <ChevronRight
                    className="h-4 w-4 transition-colors duration-300 text-rose-400 dark:text-rose-500"
                    aria-hidden="true"
                  />
                )}
              </Link>
            );
          })}
        </div>

        {/* Account Management */}
        <div className="space-y-1.5">
          <p className="text-[10px] font-bold uppercase tracking-widest px-3 mb-2 transition-colors duration-300 text-slate-500 dark:text-slate-500">
            Management
          </p>
          {menuItems.slice(4).map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;

            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={handleLinkClick}
                aria-current={isActive ? "page" : undefined}
                className={`group flex items-center justify-between gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-300 border ${
                  isActive
                    ? "bg-slate-100 text-slate-900 border-slate-200 shadow-sm dark:bg-slate-800 dark:text-white dark:border-slate-700 dark:shadow-inner"
                    : "border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100 hover:border-slate-200 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800/50 dark:hover:border-slate-700/50"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`h-4.5 w-4.5 transition-colors duration-300 ${isActive ? "text-slate-600 dark:text-slate-400" : "text-slate-400 group-hover:text-slate-600 dark:text-slate-500 dark:group-hover:text-slate-400"}`}
                    aria-hidden="true"
                  />
                  <span className="text-sm">{item.name}</span>
                </div>
                {isActive && (
                  <ChevronRight
                    className="h-4 w-4 transition-colors duration-300 text-slate-400 dark:text-slate-500"
                    aria-hidden="true"
                  />
                )}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Sidebar Footer */}
      <div className="p-4 border-t transition-colors duration-300 border-slate-200 bg-slate-50 dark:border-slate-800/60 dark:bg-slate-900/50 shrink-0">
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 border transition-colors duration-300 bg-white border-slate-200 text-slate-600 hover:text-rose-600 hover:bg-rose-50 hover:border-rose-200 dark:bg-transparent dark:border-transparent dark:text-slate-400 dark:hover:text-rose-400 dark:hover:bg-rose-500/10 dark:hover:border-rose-500/20"
          onClick={handleLogout}
          aria-label="Logout of session"
        >
          <LogOut className="h-4 w-4" aria-hidden="true" />
          Secure Logout
        </Button>
      </div>
    </aside>
  );
}

// ============================================================================
// MAIN LAYOUT COMPONENT
// ============================================================================
export function AdminLayout() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const queryClient = useQueryClient();
  const location = useLocation();
  const navigate = useNavigate();

  // --- Theme State & Effect ---
  const [theme, setTheme] = useState(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("theme");
      if (stored) return stored;
      return window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";
    }
    return "dark"; // Default
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

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
      <div className="flex h-screen w-screen items-center justify-center transition-colors duration-300 bg-slate-50 dark:bg-slate-950">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 transition-colors duration-300 border-rose-600 dark:border-rose-500"></div>
      </div>
    );
  }

  // --- SUSPENSION LOCKDOWN LOGIC ---
  if (orgData?.status === "SUSPENDED") {
    return (
      <div className="flex h-screen w-screen items-center justify-center px-4 transition-colors duration-300 bg-slate-50 dark:bg-slate-950">
        <Helmet>
          <title>Account Suspended | Bloodonate</title>
        </Helmet>

        {/* Toggle Theme button even in lockdown so they aren't stuck in one mode */}
        <button
          onClick={toggleTheme}
          className="absolute top-6 right-6 p-2.5 rounded-full border transition-all duration-300 bg-white border-slate-200 text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-400 dark:hover:text-rose-400 dark:hover:bg-rose-500/10 shadow-sm dark:shadow-none"
          aria-label="Toggle Theme"
        >
          {theme === "dark" ? (
            <Sun className="h-5 w-5" aria-hidden="true" />
          ) : (
            <Moon className="h-5 w-5" aria-hidden="true" />
          )}
        </button>

        <div className="max-w-md w-full backdrop-blur-xl border p-8 rounded-3xl text-center space-y-6 shadow-2xl transition-colors duration-300 bg-white/90 border-rose-200 dark:bg-slate-900/60 dark:border-rose-500/20">
          <div className="h-20 w-20 rounded-full flex items-center justify-center mx-auto shadow-inner border transition-colors duration-300 bg-rose-50 border-rose-100 dark:bg-rose-500/10 dark:border-rose-500/20">
            <AlertOctagon
              className="h-10 w-10 transition-colors duration-300 text-rose-600 dark:text-rose-500"
              aria-hidden="true"
            />
          </div>
          <div>
            <h2 className="text-2xl font-bold mb-2 transition-colors duration-300 text-slate-900 dark:text-white">
              Account Suspended
            </h2>
            <p className="text-sm leading-relaxed transition-colors duration-300 text-slate-600 dark:text-slate-400">
              Your organization's access to the Bloodonate platform has been
              suspended by the administrator, likely due to an expired
              subscription. Please contact support to resolve this issue.
            </p>
          </div>
          <Button
            onClick={handleLogout}
            variant="outline"
            className="w-full transition-colors duration-300 bg-white border-slate-200 text-slate-700 hover:bg-slate-50 dark:bg-transparent dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800/50"
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
    <div className="flex h-screen w-screen font-sans overflow-hidden transition-colors duration-300 bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <Helmet>
        <title>
          {orgData?.name
            ? `${orgData.name} Admin | Bloodonate`
            : "Facility Admin | Bloodonate"}
        </title>
      </Helmet>

      {/* Sidebar */}
      <Sidebar isOpen={isMobileMenuOpen} setIsOpen={setIsMobileMenuOpen} />

      {/* Mobile Menu Backdrop */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 md:hidden backdrop-blur-sm transition-colors duration-300 bg-slate-900/40 dark:bg-slate-950/80"
          onClick={() => setIsMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      <main className="flex-1 flex flex-col h-full relative z-0 min-w-0">
        {/* --- UNIFIED RESPONSIVE HEADER --- */}
        <header className="h-20 backdrop-blur-md border-b flex items-center justify-between px-4 md:px-8 shrink-0 z-30 transition-colors duration-300 bg-white/80 border-slate-200 dark:bg-slate-950/80 dark:border-slate-800/80">
          <div className="flex items-center gap-4 overflow-hidden">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="md:hidden p-2 -ml-2 rounded-lg transition-colors duration-300 text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800"
              aria-label="Open menu"
            >
              <Menu className="h-6 w-6" aria-hidden="true" />
            </button>

            {/* Org Identity / Breadcrumb */}
            <div className="flex items-center gap-3 overflow-hidden">
              {orgData?.logo ? (
                <img
                  src={orgData.logo}
                  alt={`${orgData.name} Logo`}
                  className="h-9 w-9 rounded-lg object-cover border shrink-0 transition-colors duration-300 bg-white border-slate-200 dark:bg-slate-950 dark:border-slate-700"
                />
              ) : (
                <div className="h-9 w-9 rounded-lg flex items-center justify-center border shrink-0 transition-colors duration-300 bg-rose-50 border-rose-100 dark:bg-rose-500/10 dark:border-rose-500/20">
                  <Building2
                    className="h-5 w-5 transition-colors duration-300 text-rose-600 dark:text-rose-500"
                    aria-hidden="true"
                  />
                </div>
              )}
              <div className="hidden sm:block">
                <span className="text-lg font-bold tracking-tight truncate block transition-colors duration-300 text-slate-900 dark:text-white">
                  {orgData?.name || "Facility Hub"}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-5 shrink-0">
            <div className="hidden md:flex items-center gap-2 text-xs font-bold uppercase tracking-widest px-3 py-1.5 rounded-full border shadow-sm transition-colors duration-300 bg-slate-50 border-slate-200 text-slate-600 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-400 dark:shadow-none">
              <Activity
                className="h-3.5 w-3.5 transition-colors duration-300 text-emerald-600 dark:text-emerald-500"
                aria-hidden="true"
              />{" "}
              System Operational
            </div>

            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className="relative p-2.5 rounded-full border transition-all duration-300 bg-white border-slate-200 text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-400 dark:hover:text-rose-400 dark:hover:bg-rose-500/10 shadow-sm dark:shadow-none"
              aria-label="Toggle Theme"
            >
              {theme === "dark" ? (
                <Sun className="h-5 w-5" aria-hidden="true" />
              ) : (
                <Moon className="h-5 w-5" aria-hidden="true" />
              )}
            </button>
          </div>
        </header>

        {/* --- EMAIL VERIFICATION BANNER --- */}
        {user && !user.is_email_verified && (
          <div className="border-b px-4 py-3 flex items-center justify-between z-20 shrink-0 transition-colors duration-300 bg-amber-50 border-amber-200 dark:bg-amber-500/10 dark:border-amber-500/20">
            <div className="flex items-center gap-3">
              <AlertTriangle
                className="h-5 w-5 shrink-0 transition-colors duration-300 text-amber-600 dark:text-amber-500"
                aria-hidden="true"
              />
              <p className="text-sm font-medium transition-colors duration-300 text-amber-800 dark:text-amber-500">
                Your email address is not verified. Please verify it to secure
                your account.
              </p>
            </div>
            <button
              onClick={handleVerifyEmail}
              className="text-sm font-bold underline underline-offset-4 shrink-0 ml-4 transition-colors duration-300 text-amber-600 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-300"
            >
              Verify Now
            </button>
          </div>
        )}

        {/* --- EXPIRED SUBSCRIPTION BANNER --- */}
        {!isPaid && (
          <div className="border-b px-4 py-3 flex items-center justify-between z-20 shrink-0 transition-colors duration-300 bg-rose-50 border-rose-200 dark:bg-rose-500/10 dark:border-rose-500/20">
            <div className="flex items-center gap-3">
              <CreditCard
                className="h-5 w-5 shrink-0 transition-colors duration-300 text-rose-600 dark:text-rose-500"
                aria-hidden="true"
              />
              <p className="text-sm font-medium transition-colors duration-300 text-rose-800 dark:text-rose-500">
                Your subscription is inactive or has expired. Please renew your
                license to avoid account suspension.
              </p>
            </div>
            <button
              onClick={() => navigate("/admin/settings/billing")}
              className="text-sm font-bold underline underline-offset-4 shrink-0 ml-4 whitespace-nowrap transition-colors duration-300 text-rose-600 hover:text-rose-700 dark:text-rose-400 dark:hover:text-rose-300"
            >
              Renew Now
            </button>
          </div>
        )}

        {/* Content Viewport */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar relative transition-colors duration-300 bg-slate-50 dark:bg-slate-950">
          <div
            className="absolute top-0 right-0 w-[500px] h-[500px] blur-[150px] rounded-full pointer-events-none transition-colors duration-500 bg-rose-500/5 dark:bg-rose-500/5"
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
