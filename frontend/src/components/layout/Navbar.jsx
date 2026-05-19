import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Droplet, Menu, X } from 'lucide-react';
import { Button } from '../ui/Button';

export function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'About', path: '/about' },
    { name: 'Contact', path: '/contact' },
    { name: 'Guidelines', path: '/guidelines' },
    { name: 'Search Donors', path: '/search' },
  ];

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-slate-800 bg-slate-900/80 backdrop-blur-md">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 text-rose-500 transition-colors hover:text-rose-400">
            <Droplet className="h-6 w-6 fill-current" />
            <span className="text-xl font-bold tracking-tight text-white">BloodConnect</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex md:items-center md:gap-6">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`text-sm font-medium transition-colors hover:text-rose-400 ${
                  location.pathname === link.path ? 'text-rose-500' : 'text-slate-300'
                }`}
              >
                {link.name}
              </Link>
            ))}
            <div className="ml-4 flex items-center gap-4 border-l border-slate-700 pl-4">
              <Link to="/login">
                <Button variant="ghost">Org Login</Button>
              </Link>
              <Link to="/register-org">
                <Button variant="primary">Register Organization</Button>
              </Link>
            </div>
          </div>

          {/* Mobile Menu Toggle */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-slate-300 hover:text-white p-2"
            >
              {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-slate-800 bg-slate-900 px-4 py-4 pb-6 space-y-4">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              onClick={() => setIsMobileMenuOpen(false)}
              className="block text-base font-medium text-slate-300 hover:text-rose-400"
            >
              {link.name}
            </Link>
          ))}
          <div className="pt-4 flex flex-col gap-3">
            <Link to="/login" onClick={() => setIsMobileMenuOpen(false)}>
              <Button variant="secondary" className="w-full">Organization Login</Button>
            </Link>
            <Link to="/register-org" onClick={() => setIsMobileMenuOpen(false)}>
              <Button variant="primary" className="w-full">Register Organization</Button>
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}