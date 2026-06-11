import React from "react";
import { Outlet } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Navbar } from "./Navbar";
import { Footer } from "./Footer";

export function PublicLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-slate-950 text-slate-100 font-sans selection:bg-rose-500/30 selection:text-rose-200 overflow-x-hidden relative">
      <Helmet
        titleTemplate="%s | Bloodonate"
        defaultTitle="Bloodonate - Multi-Tenant Blood Bank System"
      >
        <html lang="en" />
        <meta
          name="description"
          content="Bloodonate is a secure, multi-tenant emergency blood donation directory connecting hospitals with verified donors instantly."
        />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="Bloodonate" />
        <meta name="twitter:card" content="summary" />
      </Helmet>

      <a
        href="#main-content"
        className="absolute top-4 left-4 z-9999 translate-y-[-150%] rounded-md bg-rose-600 px-4 py-2 font-bold text-white transition focus:translate-y-0 focus:outline-none focus:ring-2 focus:ring-white"
      >
        Skip to main content
      </a>

      <div
        className="fixed inset-0 overflow-hidden pointer-events-none z-0"
        aria-hidden="true"
      >
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-rose-500/5 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-blue-500/5 blur-[120px]" />
      </div>

      <div className="relative z-50">
        <Navbar />
      </div>

      <main
        id="main-content"
        className="flex-1 flex flex-col relative z-10 scroll-mt-20"
      >
        <Outlet />
      </main>

      <div className="relative z-20">
        <Footer />
      </div>
    </div>
  );
}
