import React, { useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { Menu, Droplet, LogOut } from "lucide-react";
import toast from "react-hot-toast";

import { Sidebar } from "./Sidebar";
import api from "../../lib/axios";

export function AdminLayout() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    const logoutToast = toast.loading("Terminating secure session...");
    try {
      // 1. Instruct the Django backend to destroy the HttpOnly JWT cookies
      await api.post("/auth/logout/");
      toast.success("Logged out successfully.", { id: logoutToast });
    } catch (error) {
      console.error("Cryptographic logout failed on backend:", error);
      // Fallback: Even if the network drops, we still boot them to the login screen
      toast.error("Local session cleared.", { id: logoutToast });
    } finally {
      // 2. Purge non-sensitive UI flags from browser storage
      localStorage.removeItem("isAuthenticated");
      localStorage.removeItem("userRole");
      navigate("/login", { replace: true });
    }
  };

  return (
    <div className="flex h-screen w-screen bg-slate-950 text-slate-100 font-sans overflow-hidden selection:bg-rose-500/30 selection:text-rose-200">
      {/* --- Navigation Sidebar --- */}
      <Sidebar isOpen={isMobileMenuOpen} setIsOpen={setIsMobileMenuOpen} />

      {/* --- Mobile Sidebar Overlay --- */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-slate-950/80 z-40 md:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setIsMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* --- Main Content Application Window --- */}
      <main className="flex-1 flex flex-col h-full relative z-0 min-w-0">
        {/* Mobile Header (Hidden on Desktop viewports) */}
        <header className="md:hidden flex items-center justify-between p-4 border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-xl sticky top-0 z-30 shadow-sm">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-rose-500/10 flex items-center justify-center border border-rose-500/20 shadow-inner">
              <Droplet className="h-5 w-5 text-rose-500 fill-rose-500/20" />
            </div>
            <span className="text-xl font-black tracking-tight text-white">
              BloodConnect
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleLogout}
              className="text-slate-400 hover:text-rose-400 transition-colors p-2 rounded-lg hover:bg-rose-500/10 active:scale-95"
              aria-label="Secure Logout"
            >
              <LogOut className="h-5 w-5" />
            </button>
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="text-slate-300 hover:text-white p-2 rounded-lg hover:bg-slate-800 border border-transparent hover:border-slate-700 active:scale-95 transition-all"
              aria-label="Open Navigation Menu"
            >
              <Menu className="h-6 w-6" />
            </button>
          </div>
        </header>

        {/* Scrollable Viewport for nested pages */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar bg-slate-950 relative">
          {/* Subtle global ambient glow for the background */}
          <div
            className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-125 bg-rose-500/5 blur-[120px] rounded-full pointer-events-none"
            aria-hidden="true"
          />

          {/* Child Route Injection Point */}
          <div className="relative z-10 w-full min-h-full">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
}
