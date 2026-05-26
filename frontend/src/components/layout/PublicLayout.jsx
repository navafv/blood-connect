import React from "react";
import { Outlet } from "react-router-dom";
import { Navbar } from "./Navbar";
import { Footer } from "./Footer";

/**
 * Public Domain Layout Shell
 * Wraps all unauthenticated, public-facing routes (Home, Search, About, etc.)
 * Provides the global navigation bar, footer, and premium ambient background styling.
 */
export function PublicLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-slate-950 text-slate-100 font-sans selection:bg-rose-500/30 selection:text-rose-200 overflow-x-hidden relative">
      {/* --- Ambient Background Effects --- */}
      <div
        className="fixed inset-0 overflow-hidden pointer-events-none z-0"
        aria-hidden="true"
      >
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-rose-500/5 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-blue-500/5 blur-[120px]" />
      </div>

      {/* --- Global Navigation --- */}
      <div className="relative z-50">
        <Navbar />
      </div>

      {/* --- Main Content Viewport --- */}
      {/* <Outlet /> dynamically renders the specific page content based on the current route */}
      <main className="flex-1 flex flex-col relative z-10">
        <Outlet />
      </main>

      {/* --- Global Footer --- */}
      <div className="relative z-20">
        <Footer />
      </div>
    </div>
  );
}
