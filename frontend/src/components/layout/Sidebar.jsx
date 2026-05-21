import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  UserPlus,
  Settings,
  LogOut,
  Droplet,
  X,
} from "lucide-react";

export function Sidebar({ isOpen, setIsOpen }) {
  const location = useLocation();
  const navigate = useNavigate();

  const menuItems = [
    { name: "Dashboard", path: "/admin", icon: LayoutDashboard },
    { name: "Manage Donors", path: "/admin/donors", icon: Users },
    { name: "Add Donor", path: "/admin/add-donor", icon: UserPlus },
    { name: "Settings", path: "/admin/settings", icon: Settings },
    { name: "Staff Management", path: "/admin/settings/staff", icon: Settings },
    {
      name: "Billing & Subscription",
      path: "/admin/settings/billing",
      icon: Settings,
    },
  ];

  const handleLogout = async () => {
    try {
      // 1. Tell the backend to destroy the HttpOnly cookies
      await api.post("/auth/logout/");
    } catch (error) {
      console.error("Logout failed on backend", error);
    } finally {
      // 2. Clear our non-sensitive UI state and redirect
      localStorage.removeItem("isAuthenticated");
      localStorage.removeItem("userRole");
      navigate("/login");
    }
  };

  const handleLinkClick = () => {
    // Automatically close the sidebar on mobile when a link is clicked
    if (setIsOpen) setIsOpen(false);
  };

  return (
    <aside
      className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-slate-950 border-r border-slate-800 flex flex-col 
        transition-transform duration-300 ease-in-out
        md:translate-x-0 md:static md:h-screen
        ${isOpen ? "translate-x-0" : "-translate-x-full"}
      `}
    >
      <div className="p-6 flex items-center justify-between border-b border-slate-800">
        <div className="flex items-center gap-2 text-rose-500">
          <Droplet className="h-6 w-6 fill-current" />
          <span className="text-xl font-bold text-white tracking-tight">
            BloodConnect
          </span>
        </div>

        {/* Mobile Close Button */}
        <button
          onClick={() => setIsOpen(false)}
          className="md:hidden text-slate-400 hover:text-white p-1 rounded-md hover:bg-slate-800 transition-colors"
          aria-label="Close menu"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4 px-3">
          Menu
        </div>
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;

          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={handleLinkClick}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium transition-colors ${
                isActive
                  ? "bg-rose-600/10 text-rose-500"
                  : "text-slate-400 hover:text-slate-100 hover:bg-slate-800/50"
              }`}
            >
              <Icon className="h-5 w-5" />
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-800">
        <div className="mb-4 px-3">
          {/* Note: You can make this dynamic later by decoding the JWT or fetching a /me endpoint */}
          <p className="text-sm font-medium text-white">Organization Admin</p>
          <p className="text-xs text-slate-500">Active Tenant</p>
        </div>
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 px-3 py-2.5 rounded-lg font-medium text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
        >
          <LogOut className="h-5 w-5" />
          Logout
        </button>
      </div>
    </aside>
  );
}
