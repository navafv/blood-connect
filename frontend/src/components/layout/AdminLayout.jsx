import React, { useState } from "react";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { Outlet, useNavigate, useLocation, Link } from "react-router-dom";
import {
  Menu,
  Droplet,
  LogOut,
  LayoutDashboard,
  Users,
  UserPlus,
  LifeBuoy,
  Building2,
  CreditCard,
  X,
  ChevronRight,
  ShieldCheck,
} from "lucide-react";
import toast from "react-hot-toast";
import api from "../../lib/axios";

// --- SIDEBAR COMPONENT ---
function Sidebar({ isOpen, setIsOpen, orgData }) {
  const location = useLocation();
  const navigate = useNavigate();

  const menuItems = [
    { name: "Overview", path: "/admin", icon: LayoutDashboard },
    { name: "Manage Donors", path: "/admin/donors", icon: Users },
    { name: "Register Donor", path: "/admin/add-donor", icon: UserPlus },
    { name: "Support", path: "/admin/support", icon: LifeBuoy },
    { name: "Profile Settings", path: "/admin/settings", icon: Building2 },
    {
      name: "Account Security",
      path: "/admin/settings/security",
      icon: ShieldCheck,
    },
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
      localStorage.removeItem("isAuthenticated");
      localStorage.removeItem("userRole");
      window.location.href = "/login"; // Hard wipe
    }
  };

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-50 w-72 bg-slate-950/90 backdrop-blur-xl border-r border-slate-800/80 flex flex-col transition-transform duration-300 ease-in-out md:translate-x-0 md:static md:h-screen ${
        isOpen ? "translate-x-0" : "-translate-x-full"
      }`}
    >
      {/* Dynamic Sidebar Header */}
      <div className="p-6 flex items-center justify-between border-b border-slate-800/60">
        <div className="flex items-center gap-3 text-rose-500 overflow-hidden">
          {orgData?.logo ? (
            <img
              src={orgData.logo}
              alt="Logo"
              className="h-8 w-8 rounded-lg object-cover border border-slate-700 shrink-0"
            />
          ) : (
            <div className="p-1.5 rounded-lg bg-rose-500/10 border border-rose-500/20 shrink-0">
              <Droplet className="h-5 w-5 fill-rose-500/20" />
            </div>
          )}
          <span className="text-lg font-black text-white tracking-tight truncate">
            {orgData?.name || "BloodConnect"}
          </span>
        </div>

        <button
          onClick={() => setIsOpen(false)}
          className="md:hidden text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 px-4 py-6 space-y-8 overflow-y-auto custom-scrollbar">
        <div className="space-y-1">
          <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest px-3 mb-2">
            Operations
          </p>
          {menuItems.slice(0, 4).map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsOpen && setIsOpen(false)}
                className={`flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg font-medium transition-all ${isActive ? "bg-rose-500/10 text-rose-400 border border-rose-500/20 shadow-inner" : "text-slate-400 hover:text-slate-100 hover:bg-slate-800/50"}`}
              >
                <div className="flex items-center gap-3">
                  <item.icon className="h-4 w-4" />
                  {item.name}
                </div>
                {isActive && <ChevronRight className="h-4 w-4" />}
              </Link>
            );
          })}
        </div>
        <div className="space-y-1">
          <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest px-3 mb-2">
            Management
          </p>
          {menuItems.slice(4).map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsOpen && setIsOpen(false)}
                className={`flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg font-medium transition-all ${isActive ? "bg-slate-800 text-white border border-slate-700 shadow-inner" : "text-slate-400 hover:text-slate-100 hover:bg-slate-800/50"}`}
              >
                <div className="flex items-center gap-3">
                  <item.icon className="h-4 w-4" />
                  {item.name}
                </div>
                {isActive && <ChevronRight className="h-4 w-4" />}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Sidebar Footer */}
      <div className="p-4 border-t border-slate-800/60 bg-slate-900/20">
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 px-3 py-2.5 rounded-lg font-medium text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
        >
          <LogOut className="h-4 w-4" /> Logout Session
        </button>
      </div>
    </aside>
  );
}

// --- MAIN LAYOUT COMPONENT ---
export function AdminLayout() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const queryClient = useQueryClient();

  // Fetch Organization Data globally for the Sidebar and Header
  const { data: orgData } = useQuery({
    queryKey: ["tenant-org-profile"],
    queryFn: async () => {
      const response = await api.get("/tenant/organization/");
      return response.data;
    },
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes to prevent redundant fetches
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

  return (
    <div className="flex h-screen w-screen bg-slate-950 text-slate-100 font-sans overflow-hidden">
      <Sidebar
        isOpen={isMobileMenuOpen}
        setIsOpen={setIsMobileMenuOpen}
        orgData={orgData}
      />

      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-slate-950/80 z-40 md:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      <main className="flex-1 flex flex-col h-full relative z-0 min-w-0">
        {/* Dynamic Mobile Header */}
        <header className="md:hidden flex items-center justify-between p-4 border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-xl sticky top-0 z-30 shadow-sm">
          <div className="flex items-center gap-2.5 overflow-hidden">
            {orgData?.logo ? (
              <img
                src={orgData.logo}
                alt="Logo"
                className="h-8 w-8 rounded-lg object-cover border border-slate-700 shrink-0"
              />
            ) : (
              <div className="h-8 w-8 rounded-lg bg-rose-500/10 flex items-center justify-center border border-rose-500/20 shrink-0">
                <Droplet className="h-5 w-5 text-rose-500 fill-rose-500/20" />
              </div>
            )}
            <span className="text-xl font-black tracking-tight text-white truncate">
              {orgData?.name || "BloodConnect"}
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="text-slate-300 hover:text-white p-2 rounded-lg hover:bg-slate-800 border border-transparent"
            >
              <Menu className="h-6 w-6" />
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar bg-slate-950 relative">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-125 bg-rose-500/5 blur-[120px] rounded-full pointer-events-none" />
          <div className="relative z-10 w-full min-h-full">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
}
