import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Droplet, Menu, X, Sun, Moon } from "lucide-react";
import { Button } from "../ui/Button";
// Ensure this path matches where you created the ThemeContext
import { useTheme } from "../../context/ThemeContext";

export function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();

  const navLinks = [
    { name: "Home", path: "/" },
    { name: "About", path: "/about" },
    { name: "Contact", path: "/contact" },
    { name: "Guidelines", path: "/guidelines" },
    { name: "Search Donors", path: "/search" },
  ];

  return (
    <nav
      aria-label="Main Navigation"
      className="sticky top-0 z-50 w-full border-b transition-all duration-300 bg-white/80 border-slate-200 shadow-sm backdrop-blur-xl dark:bg-slate-900/70 dark:border-slate-800/80"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-[10vh]">
        <div className="flex h-16 sm:h-20 items-center justify-between">
          {/* Brand Identity */}
          <Link
            to="/"
            className="flex items-center gap-2.5 group transition-opacity hover:opacity-90 active:scale-95"
            onClick={() => setIsMobileMenuOpen(false)}
            aria-label="Bloodonate Homepage"
          >
            <div className="p-1.5 rounded-lg bg-rose-50 border border-rose-100 shadow-inner group-hover:bg-rose-100 transition-colors dark:bg-rose-500/10 dark:border-rose-500/20 dark:group-hover:bg-rose-500/20">
              <Droplet
                className="h-5 w-5 text-rose-600 fill-rose-600/20 dark:text-rose-500 dark:fill-rose-500/20"
                aria-hidden="true"
              />
            </div>
            <span className="text-xl font-black tracking-tight text-slate-900 dark:text-white transition-colors">
              Bloodonate
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
                    aria-current={isActive ? "page" : undefined}
                    className={`text-sm font-semibold transition-all hover:-translate-y-0.5 ${
                      isActive
                        ? "text-rose-600 drop-shadow-[0_0_8px_rgba(225,29,72,0.2)] dark:text-rose-400 dark:drop-shadow-[0_0_8px_rgba(225,29,72,0.5)]"
                        : "text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
                    }`}
                  >
                    {link.name}
                  </Link>
                );
              })}
            </div>

            {/* Authentication Gateways & Theme Toggle */}
            <div className="flex items-center gap-4 pl-8 border-l border-slate-200 dark:border-slate-700/50 h-8 transition-colors">
              <button
                onClick={toggleTheme}
                className="p-2 rounded-full text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white transition-colors"
                aria-label="Toggle Theme"
              >
                {theme === "dark" ? (
                  <Sun className="h-5 w-5" />
                ) : (
                  <Moon className="h-5 w-5" />
                )}
              </button>

              <Link to="/login">
                <Button
                  variant="ghost"
                  className="text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white font-semibold"
                >
                  Facility Login
                </Button>
              </Link>
              <Link to="/register-org">
                <Button variant="primary" className="shadow-md font-bold">
                  Register Facility
                </Button>
              </Link>
            </div>
          </div>

          {/* Mobile Menu Toggle & Theme Button */}
          <div className="lg:hidden flex items-center gap-2">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white transition-colors"
              aria-label="Toggle Theme"
            >
              {theme === "dark" ? (
                <Sun className="h-5 w-5" />
              ) : (
                <Moon className="h-5 w-5" />
              )}
            </button>
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-slate-600 hover:text-slate-900 p-2 rounded-xl hover:bg-slate-100 transition-colors border border-transparent hover:border-slate-200 active:scale-95 flex items-center justify-center min-h-11 min-w-11 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-800 dark:hover:border-slate-700"
              aria-expanded={isMobileMenuOpen}
              aria-controls="mobile-menu"
              aria-label={
                isMobileMenuOpen
                  ? "Close Navigation Menu"
                  : "Open Navigation Menu"
              }
            >
              {isMobileMenuOpen ? (
                <X className="h-6 w-6" aria-hidden="true" />
              ) : (
                <Menu className="h-6 w-6" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Dropdown */}
      {isMobileMenuOpen && (
        <div
          id="mobile-menu"
          className="lg:hidden absolute top-full left-0 w-full border-b shadow-2xl animate-in slide-in-from-top-2 duration-200 bg-white/95 border-slate-200 dark:bg-slate-900/95 dark:border-slate-800 backdrop-blur-3xl"
        >
          <div className="px-4 py-6 space-y-2 max-w-7xl mx-auto">
            {navLinks.map((link) => {
              const isActive = location.pathname === link.path;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setIsMobileMenuOpen(false)}
                  aria-current={isActive ? "page" : undefined}
                  className={`block px-4 py-3 rounded-xl text-base font-bold transition-colors ${
                    isActive
                      ? "bg-rose-50 text-rose-600 border border-rose-100 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
                  }`}
                >
                  {link.name}
                </Link>
              );
            })}

            <div className="pt-6 mt-2 border-t flex flex-col gap-3 px-2 border-slate-200 dark:border-slate-800/80">
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
                  className="w-full font-bold h-12 shadow-md"
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
