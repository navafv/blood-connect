import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Droplet, Menu, X } from "lucide-react";
import { Button } from "../ui/Button";

export function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

  const navLinks = [
    { name: "Home", path: "/" },
    { name: "About", path: "/about" },
    { name: "Contact", path: "/contact" },
    { name: "Guidelines", path: "/guidelines" },
    { name: "Search Donors", path: "/search" },
  ];

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-slate-800/80 bg-slate-900/70 backdrop-blur-xl shadow-sm transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 sm:h-20 items-center justify-between">
          {/* Brand Identity */}
          <Link
            to="/"
            className="flex items-center gap-2.5 group transition-opacity hover:opacity-90 active:scale-95"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <div className="p-1.5 rounded-lg bg-rose-500/10 border border-rose-500/20 shadow-inner group-hover:bg-rose-500/20 transition-colors">
              <Droplet className="h-5 w-5 text-rose-500 fill-rose-500/20" />
            </div>
            <span className="text-xl font-black tracking-tight text-white">
              BlooDonate
            </span>
          </Link>

          {/* Desktop Navigation Matrix */}
          <div className="hidden lg:flex lg:items-center lg:gap-8">
            <div className="flex items-center gap-6">
              {navLinks.map((link) => {
                const isActive = location.pathname === link.path;
                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={`text-sm font-semibold transition-all hover:-translate-y-0.5 ${
                      isActive
                        ? "text-rose-400 drop-shadow-[0_0_8px_rgba(225,29,72,0.5)]"
                        : "text-slate-300 hover:text-white"
                    }`}
                  >
                    {link.name}
                  </Link>
                );
              })}
            </div>

            {/* Authentication Gateways */}
            <div className="flex items-center gap-4 pl-8 border-l border-slate-700/50 h-8">
              <Link to="/login">
                <Button
                  variant="ghost"
                  className="text-slate-300 hover:text-white font-semibold"
                >
                  Facility Login
                </Button>
              </Link>
              <Link to="/register-org">
                <Button variant="primary" className="shadow-lg font-bold">
                  Register Facility
                </Button>
              </Link>
            </div>
          </div>

          {/* Mobile Menu Toggle */}
          <div className="lg:hidden flex items-center">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-slate-300 hover:text-white p-3 rounded-xl hover:bg-slate-800 transition-colors border border-transparent hover:border-slate-700 active:scale-95 flex items-center justify-center min-h-11 min-w-11"
              aria-expanded={isMobileMenuOpen}
              aria-label="Toggle Navigation Menu"
            >
              {isMobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Dropdown */}
      {isMobileMenuOpen && (
        <div className="lg:hidden absolute top-full left-0 w-full border-b border-slate-800 bg-slate-900/95 backdrop-blur-3xl shadow-2xl animate-in slide-in-from-top-2 duration-200">
          <div className="px-4 py-6 space-y-2 max-w-7xl mx-auto">
            {navLinks.map((link) => {
              const isActive = location.pathname === link.path;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`block px-4 py-3 rounded-xl text-base font-bold transition-colors ${
                    isActive
                      ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                      : "text-slate-300 hover:bg-slate-800 hover:text-white"
                  }`}
                >
                  {link.name}
                </Link>
              );
            })}

            <div className="pt-6 mt-2 border-t border-slate-800/80 flex flex-col gap-3 px-2">
              <Link to="/login" onClick={() => setIsMobileMenuOpen(false)}>
                <Button variant="secondary" className="w-full font-bold h-12">
                  Facility Login
                </Button>
              </Link>
              <Link
                to="/register-org"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <Button
                  variant="primary"
                  className="w-full font-bold h-12 shadow-lg"
                >
                  Register Healthcare Facility
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
