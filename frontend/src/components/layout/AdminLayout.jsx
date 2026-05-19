import React, { useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { Menu, Droplet, LogOut } from "lucide-react";
import { Sidebar } from "./Sidebar";

export function AdminLayout() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.clear(); // Clear the JWT tokens securely
    navigate("/login");
  };

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100 font-sans overflow-hidden">
      {/* The Sidebar now accepts state props so it knows when to show/hide on mobile,
        and so it can close itself automatically when a user clicks a link.
      */}
      <Sidebar isOpen={isMobileMenuOpen} setIsOpen={setIsMobileMenuOpen} />

      {/* Dark blurred overlay for mobile when the sidebar is open */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      <main className="flex-1 flex flex-col h-screen overflow-hidden relative z-0">
        {/* Mobile Header (Hidden on Desktop) */}
        <header className="md:hidden flex items-center justify-between p-4 border-b border-slate-800 bg-slate-900/80 backdrop-blur-md sticky top-0 z-30">
          <div className="flex items-center gap-2 text-rose-500">
            <Droplet className="h-6 w-6 fill-current" />
            <span className="text-xl font-bold tracking-tight text-white">
              BloodConnect
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleLogout}
              className="text-slate-400 hover:text-rose-400 transition-colors p-2 rounded-full hover:bg-slate-800"
              aria-label="Logout"
            >
              <LogOut className="h-5 w-5" />
            </button>
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="text-slate-300 hover:text-white p-2 rounded-lg hover:bg-slate-800"
              aria-label="Open Menu"
            >
              <Menu className="h-6 w-6" />
            </button>
          </div>
        </header>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto bg-slate-950">
          <div className="p-4 md:p-8 max-w-7xl mx-auto w-full">
            {/* The nested routes (Dashboard, ManageDonors, etc.) will render right here */}
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
}
