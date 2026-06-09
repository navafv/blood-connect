import React, { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Link, useLocation, Outlet, useNavigate } from "react-router-dom";
import {
  ShieldCheck,
  LayoutDashboard,
  Building2,
  TerminalSquare,
  LogOut,
  Menu,
  X,
  Bell,
  Megaphone,
  Mail,
  Database,
  LifeBuoy,
  MapPin,
  ChevronRight,
  Activity,
} from "lucide-react";
import toast from "react-hot-toast";
import { Button } from "../ui/Button";
import api from "../../lib/axios";

export function SuperAdminLayout() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

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
      // Even if the server fails, we must clear the client state so the user isn't trapped
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
    <div className="min-h-screen bg-slate-950 flex flex-col md:flex-row font-sans selection:bg-indigo-500/30 selection:text-indigo-200 relative">
      {/* Mobile Menu Backdrop */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* --- Sidebar Navigation --- */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-slate-900 border-r border-slate-800 flex flex-col transition-transform duration-300 md:relative md:translate-x-0 ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        {/* Branding */}
        <div className="p-6 border-b border-slate-800/50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 shadow-inner">
              <ShieldCheck className="h-6 w-6 text-indigo-500" />
            </div>
            <div>
              <h2 className="text-sm font-black text-white tracking-widest uppercase">
                Platform
              </h2>
              <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">
                Admin Console
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsMobileMenuOpen(false)}
            className="md:hidden text-slate-400 p-2 hover:bg-slate-800 rounded-lg"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Links */}
        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const active = isActive(link.path);
            return (
              <Link
                key={link.name}
                to={link.path}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center justify-between px-4 py-3 rounded-xl transition-all ${
                  active
                    ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-bold"
                    : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`h-4 w-4 ${active ? "text-indigo-400" : "text-slate-500"}`}
                  />
                  <span className="text-sm">{link.name}</span>
                </div>
                {active && <ChevronRight className="h-4 w-4" />}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/50">
          <div className="flex items-center gap-3 px-3 py-2 mb-3">
            <div className="h-9 w-9 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-black text-slate-400 text-xs shadow-inner">
              SA
            </div>
            <div>
              <p className="text-xs font-bold text-white uppercase tracking-tight">
                System Administrator
              </p>
              <p className="text-[10px] text-slate-500 uppercase tracking-widest font-mono">
                admin@bloodconnect.com
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            className="w-full justify-start text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 gap-3"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4" /> Secure Logout
          </Button>
        </div>
      </aside>

      {/* --- Main Content --- */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-slate-950/80 backdrop-blur-md border-b border-slate-800 flex items-center justify-between px-4 md:px-8 shrink-0 z-10">
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="md:hidden text-slate-300"
            aria-label="Open menu"
          >
            <Menu className="h-6 w-6" />
          </button>

          <div className="flex-1 md:flex items-center justify-end gap-6 hidden sm:flex">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-widest bg-slate-900 px-3 py-1.5 rounded-full border border-slate-800">
              <Activity className="h-3 w-3 text-emerald-500" /> System
              Operational
            </div>
            <button className="relative p-2 text-slate-400 hover:text-white transition-colors">
              <Bell className="h-5 w-5" />
              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-rose-500 ring-2 ring-slate-950" />
            </button>
          </div>
        </header>

        {/* Content Viewport */}
        <div className="flex-1 overflow-y-auto custom-scrollbar relative">
          <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600/5 rounded-full blur-[150px] pointer-events-none" />
          <Outlet />
        </div>
      </main>
    </div>
  );
}
