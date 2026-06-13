import React from "react";
import { Droplet } from "lucide-react";
import { Link } from "react-router-dom";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative border-t transition-colors duration-300 border-slate-200 bg-white dark:border-slate-800/80 dark:bg-slate-950 overflow-hidden">
      {/* Subtle ambient background glow */}
      <div
        className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full max-w-3xl h-24 bg-rose-500/10 blur-[80px] pointer-events-none transition-colors duration-300 dark:bg-rose-500/5"
        aria-hidden="true"
      />

      <div className="max-w-7xl mx-auto px-6 py-8 md:py-12 relative z-10">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Brand Identity */}
          <Link
            to="/"
            className="flex items-center gap-3 group transition-opacity hover:opacity-90"
            aria-label="Return to Bloodonate Homepage"
          >
            <div className="p-1.5 rounded-lg border shadow-inner transition-colors bg-rose-50 border-rose-100 group-hover:bg-rose-100 dark:bg-rose-500/10 dark:border-rose-500/20 dark:group-hover:bg-rose-500/20">
              <Droplet
                className="h-5 w-5 transition-colors text-rose-600 fill-rose-600/20 dark:text-rose-500 dark:fill-rose-500/20"
                aria-hidden="true"
              />
            </div>
            <span className="text-xl font-black tracking-tight transition-colors text-slate-900 dark:text-white">
              Bloodonate
            </span>
          </Link>

          {/* Navigation Matrix */}
          <nav
            aria-label="Footer Navigation"
            className="flex flex-wrap justify-center gap-x-8 gap-y-4 text-sm font-medium transition-colors text-slate-600 dark:text-slate-400"
          >
            <Link
              to="/about"
              className="hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
            >
              About Us
            </Link>
            <Link
              to="/guidelines"
              className="hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
            >
              Donor Guidelines
            </Link>
            <Link
              to="/privacy-policy"
              className="hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
            >
              Privacy Policy
            </Link>
            <Link
              to="/terms-of-service"
              className="hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
            >
              Terms of Service
            </Link>
            <Link
              to="/contact"
              className="hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
            >
              Contact Support
            </Link>
          </nav>
        </div>

        {/* Bottom Metadata Bar */}
        <div className="mt-8 pt-8 border-t transition-colors duration-300 border-slate-200 dark:border-slate-800/60 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs font-medium text-center md:text-left tracking-wide transition-colors text-slate-500 dark:text-slate-400">
            &copy; {currentYear} Bloodonate SaaS Platform. All rights reserved.
          </p>
          <p className="text-xs font-medium flex items-center gap-1.5 tracking-wide transition-colors text-slate-500 dark:text-slate-400">
            Designed & Developed by{" "}
            <a
              href="https://navaf.vercel.app"
              target="_blank"
              rel="noopener noreferrer nofollow"
              className="font-bold transition-colors text-slate-700 hover:text-rose-600 dark:text-slate-300 dark:hover:text-rose-400"
            >
              Navaf V
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
