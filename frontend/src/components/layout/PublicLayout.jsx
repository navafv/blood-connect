import React from "react";
import { Outlet } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Navbar } from "./Navbar";
import { Footer } from "./Footer";

export function PublicLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900 font-sans selection:bg-rose-500/30 selection:text-rose-900 dark:bg-slate-950 dark:text-slate-100 dark:selection:text-rose-200 overflow-x-hidden relative transition-colors duration-300">
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
        className="absolute top-4 left-4 z-[9999] translate-y-[-150%] rounded-md bg-rose-600 px-4 py-2 font-bold text-white transition focus:translate-y-0 focus:outline-none focus:ring-2 focus:ring-rose-500/50"
      >
        Skip to main content
      </a>

      <div
        className="fixed inset-0 overflow-hidden pointer-events-none z-0"
        aria-hidden="true"
      >
        {/* Adjusted ambient glows to look good in both light and dark modes */}
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-rose-500/10 blur-[120px] dark:bg-rose-500/5 transition-colors duration-300" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-blue-500/10 blur-[120px] dark:bg-blue-500/5 transition-colors duration-300" />
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
