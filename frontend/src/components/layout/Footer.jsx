import React from "react";
import { Droplet, Heart } from "lucide-react";
import { Link } from "react-router-dom";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative border-t border-slate-800/80 bg-slate-950 overflow-hidden">
      {/* Subtle ambient background glow */}
      <div
        className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full max-w-3xl h-24 bg-rose-500/5 blur-[80px] pointer-events-none"
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
            <div className="p-1.5 rounded-lg bg-rose-500/10 border border-rose-500/20 shadow-inner group-hover:bg-rose-500/20 transition-colors">
              <Droplet
                className="h-5 w-5 text-rose-500 fill-rose-500/20"
                aria-hidden="true"
              />
            </div>
            <span className="text-xl font-black tracking-tight text-white">
              Bloodonate
            </span>
          </Link>

          {/* Navigation Matrix */}
          <nav
            aria-label="Footer Navigation"
            className="flex flex-wrap justify-center gap-x-8 gap-y-4 text-sm font-medium text-slate-400"
          >
            <Link to="/about" className="hover:text-rose-400 transition-colors">
              About Us
            </Link>
            <Link
              to="/guidelines"
              className="hover:text-rose-400 transition-colors"
            >
              Donor Guidelines
            </Link>
            <Link
              to="/privacy"
              className="hover:text-rose-400 transition-colors"
            >
              Privacy Policy
            </Link>
            <Link to="/terms" className="hover:text-rose-400 transition-colors">
              Terms of Service
            </Link>
            <Link
              to="/contact"
              className="hover:text-rose-400 transition-colors"
            >
              Contact Support
            </Link>
          </nav>
        </div>

        {/* Bottom Metadata Bar */}
        <div className="mt-8 pt-8 border-t border-slate-800/60 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-slate-400 font-medium text-center md:text-left tracking-wide">
            &copy; {currentYear} Bloodonate SaaS Platform. All rights reserved.
          </p>
          <p className="text-xs text-slate-400 font-medium flex items-center gap-1.5 tracking-wide">
            Designed & Developed by <a href="https://navaf.vercel.app" target="_blank" rel="noopener noreferrer nofollow">Navaf V</a>
          </p>
        </div>
      </div>
    </footer>
  );
}
