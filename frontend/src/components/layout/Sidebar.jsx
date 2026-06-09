import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import {
  LayoutDashboard,
  Users,
  UserPlus,
  Settings,
  LogOut,
  Droplet,
  X,
  LifeBuoy,
  CreditCard,
  Building2,
  Lock,
  ChevronRight,
} from "lucide-react";
import toast from "react-hot-toast";
import api from "../../lib/axios";

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
      className={`fixed inset-y-0 left-0 z-50 w-72 bg-slate-950/90 backdrop-blur-xl border-r border-slate-800/80 flex flex-col transition-transform duration-300 ease-in-out md:translate-x-0 md:static md:h-screen ${
        isOpen ? "translate-x-0" : "-translate-x-full"
      }`}
    >
      {/* Sidebar Header */}
      <div className="p-6 flex items-center justify-between border-b border-slate-800/60">
        <div className="flex items-center gap-3 text-rose-500">
          <div className="p-1.5 rounded-lg bg-rose-500/10 border border-rose-500/20">
            <Droplet className="h-5 w-5 fill-rose-500/20" />
          </div>
          <span className="text-lg font-black text-white tracking-tight">
            BloodConnect
          </span>
        </div>

        <button
          onClick={() => setIsOpen(false)}
          className="md:hidden text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
          aria-label="Close menu"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 px-4 py-6 space-y-8 overflow-y-auto custom-scrollbar">
        {/* Primary Operations */}
        <div className="space-y-1">
          <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest px-3 mb-2">
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
                className={`flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg font-medium transition-all ${
                  isActive
                    ? "bg-rose-500/10 text-rose-400 border border-rose-500/20 shadow-inner"
                    : "text-slate-400 hover:text-slate-100 hover:bg-slate-800/50"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className="h-4 w-4" />
                  {item.name}
                </div>
                {isActive && <ChevronRight className="h-4 w-4" />}
              </Link>
            );
          })}
        </div>

        {/* Account Management */}
        <div className="space-y-1">
          <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest px-3 mb-2">
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
                className={`flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg font-medium transition-all ${
                  isActive
                    ? "bg-slate-800 text-white border border-slate-700 shadow-inner"
                    : "text-slate-400 hover:text-slate-100 hover:bg-slate-800/50"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className="h-4 w-4" />
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
        <div className="mb-4 px-3 flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700">
            <Users className="h-4 w-4 text-slate-500" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white">Facility Admin</p>
            <p className="text-[10px] text-emerald-500 font-bold uppercase tracking-widest">
              Active Tenant
            </p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 px-3 py-2.5 rounded-lg font-medium text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
        >
          <LogOut className="h-4 w-4" />
          Logout Session
        </button>
      </div>
    </aside>
  );
}
