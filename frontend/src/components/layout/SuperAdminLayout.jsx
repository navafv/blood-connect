import React, { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Link, useLocation, Outlet, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import {
  ShieldCheck,
  LayoutDashboard,
  Building2,
  TerminalSquare,
  LogOut,
  Menu,
  X,
  Megaphone,
  Mail,
  Database,
  LifeBuoy,
  MapPin,
  ChevronRight,
  Activity,
  Sun,
  Moon,
} from "lucide-react";
import toast from "react-hot-toast";
import { Button } from "../ui/Button";
import api from "../../lib/axios";

export function SuperAdminLayout() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // --- Theme State & Effect ---
  const [theme, setTheme] = useState(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("theme");
      if (stored) return stored;
      // Default to user's system preference if no local storage is set
      return window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";
    }
    return "dark"; // SSR Fallback
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

  const navLinks = [
    { name: "Global Dashboard", path: "/superadmin", icon: LayoutDashboard },
    {
      name: "Tenant Organizations",
      path: "/superadmin/organizations",
      icon: Building2,
    },
    {
      name: "Location Master Data",
      path: "/superadmin/locations",
      icon: MapPin,
    },
    { name: "Advertisement Manager", path: "/superadmin/ads", icon: Megaphone },
    { name: "Support Inbox", path: "/superadmin/messages", icon: Mail },
    {
      name: "Tenant Support Tickets",
      path: "/superadmin/support",
      icon: LifeBuoy,
    },
    { name: "Archived Data", path: "/superadmin/archives", icon: Database },
    {
      name: "System Audit Logs",
      path: "/superadmin/logs",
      icon: TerminalSquare,
    },
  ];

  // Prevent scrolling on body when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
  }, [isMobileMenuOpen]);

  const handleLogout = async () => {
    const loadingId = toast.loading("Terminating administrative session...");
    try {
      await api.post("/auth/logout/");
      toast.success("SuperAdmin logged out securely.", { id: loadingId });
    } catch (err) {
      toast.error("Session purged locally.", { id: loadingId });
    } finally {
      queryClient.clear();
      localStorage.removeItem("isAuthenticated");
      localStorage.removeItem("userRole");
      navigate("/login", { replace: true });
    }
  };

  const isActive = (path) => {
    if (path === "/superadmin" && location.pathname !== "/superadmin")
      return false;
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row font-sans selection:bg-indigo-500/30 selection:text-indigo-900 relative transition-colors duration-300 bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 dark:selection:text-indigo-200">
      {/* Global Helmet for SuperAdmin Area */}
      <Helmet>
        <title>SuperAdmin Console | Bloodonate</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      {/* Mobile Menu Backdrop */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 md:hidden transition-colors duration-300 bg-slate-900/40 backdrop-blur-sm dark:bg-slate-950/60"
          onClick={() => setIsMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* --- Sidebar Navigation --- */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 flex flex-col shadow-2xl md:shadow-none border-r transition-all duration-300 md:relative md:translate-x-0 bg-white border-slate-200 dark:bg-slate-900/60 dark:border-slate-800/80 ${
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Branding */}
        <div className="h-20 px-6 border-b flex items-center justify-between transition-colors duration-300 border-slate-200 dark:border-slate-800/60 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl border shadow-sm transition-colors duration-300 bg-indigo-50 border-indigo-200 dark:bg-indigo-500/10 dark:border-indigo-500/20 dark:shadow-inner">
              <ShieldCheck
                className="h-6 w-6 transition-colors duration-300 text-indigo-600 dark:text-indigo-500"
                aria-hidden="true"
              />
            </div>
            <div>
              <h2 className="text-sm font-black tracking-widest uppercase transition-colors duration-300 text-slate-900 dark:text-white">
                Platform
              </h2>
              <p className="text-[10px] font-bold uppercase tracking-widest transition-colors duration-300 text-indigo-600 dark:text-indigo-400">
                Admin Console
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsMobileMenuOpen(false)}
            className="md:hidden p-2 rounded-lg transition-colors duration-300 text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        {/* Links */}
        <nav
          aria-label="SuperAdmin Navigation"
          className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto custom-scrollbar"
        >
          {navLinks.map((link) => {
            const Icon = link.icon;
            const active = isActive(link.path);
            return (
              <Link
                key={link.name}
                to={link.path}
                onClick={() => setIsMobileMenuOpen(false)}
                aria-current={active ? "page" : undefined}
                className={`group flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-300 border ${
                  active
                    ? "bg-indigo-50 text-indigo-700 border-indigo-200 font-bold shadow-sm dark:bg-indigo-500/10 dark:text-indigo-300 dark:border-indigo-500/20"
                    : "text-slate-600 border-transparent hover:bg-slate-100 hover:text-slate-900 hover:border-slate-200 dark:text-slate-400 dark:hover:bg-slate-800/50 dark:hover:text-slate-200 dark:hover:border-slate-700/50"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`h-4.5 w-4.5 transition-colors duration-300 ${
                      active
                        ? "text-indigo-600 dark:text-indigo-400"
                        : "text-slate-400 group-hover:text-slate-600 dark:text-slate-500 dark:group-hover:text-slate-400"
                    }`}
                    aria-hidden="true"
                  />
                  <span className="text-sm">{link.name}</span>
                </div>
                {active && (
                  <ChevronRight
                    className="h-4 w-4 transition-colors duration-300 text-indigo-400 dark:text-indigo-500"
                    aria-hidden="true"
                  />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t transition-colors duration-300 border-slate-200 bg-slate-50 dark:border-slate-800/80 dark:bg-slate-900/50 shrink-0">
          <div className="flex items-center gap-3 px-3 py-2 mb-3">
            <div className="h-10 w-10 rounded-full flex items-center justify-center font-black text-xs border shadow-sm transition-colors duration-300 bg-white border-slate-200 text-slate-600 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400 dark:shadow-inner">
              SA
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-tight transition-colors duration-300 text-slate-900 dark:text-white">
                System Administrator
              </p>
              <p className="text-[10px] uppercase tracking-widest font-mono transition-colors duration-300 text-slate-500 dark:text-slate-500">
                admin@bloodonate.org
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 border transition-colors duration-300 bg-white border-slate-200 text-slate-600 hover:text-rose-600 hover:bg-rose-50 hover:border-rose-200 dark:bg-transparent dark:border-transparent dark:text-slate-400 dark:hover:text-rose-400 dark:hover:bg-rose-500/10 dark:hover:border-rose-500/20"
            onClick={handleLogout}
            aria-label="Securely log out of SuperAdmin"
          >
            <LogOut className="h-4 w-4" aria-hidden="true" /> Secure Logout
          </Button>
        </div>
      </aside>

      {/* --- Main Content --- */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
        {/* Header */}
        <header className="h-20 backdrop-blur-md border-b flex items-center justify-between px-4 md:px-8 shrink-0 z-20 transition-colors duration-300 bg-white/80 border-slate-200 dark:bg-slate-950/80 dark:border-slate-800/80">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="md:hidden p-2 -ml-2 rounded-lg transition-colors duration-300 text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800"
              aria-label="Open menu"
            >
              <Menu className="h-6 w-6" aria-hidden="true" />
            </button>
            {/* Contextual Route Breadcrumb/Title visible on Desktop */}
            <h2 className="hidden md:block text-lg font-bold transition-colors duration-300 text-slate-800 dark:text-slate-200">
              Control Center
            </h2>
          </div>

          <div className="flex items-center justify-end gap-5">
            <div className="hidden sm:flex items-center gap-2 text-xs font-bold uppercase tracking-widest px-3 py-1.5 rounded-full border shadow-sm transition-colors duration-300 bg-slate-50 border-slate-200 text-slate-600 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-400 dark:shadow-none">
              <Activity
                className="h-3.5 w-3.5 transition-colors duration-300 text-emerald-600 dark:text-emerald-500"
                aria-hidden="true"
              />{" "}
              System Operational
            </div>

            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className="relative p-2.5 rounded-full border transition-all duration-300 bg-white border-slate-200 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-400 dark:hover:text-indigo-400 dark:hover:bg-indigo-500/10 shadow-sm dark:shadow-none"
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

        {/* Content Viewport */}
        <div className="flex-1 overflow-y-auto custom-scrollbar relative z-10">
          {/* Ambient Content Glow (Adapted for Light/Dark) */}
          <div
            className="absolute top-0 right-0 w-125 h-125 rounded-full blur-[150px] pointer-events-none transition-colors duration-500 bg-indigo-500/5 dark:bg-indigo-600/5"
            aria-hidden="true"
          />
          <Outlet />
        </div>
      </main>
    </div>
  );
}
