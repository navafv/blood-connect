import { useState } from 'react';
import { Link, useLocation, Outlet, useNavigate } from 'react-router-dom';
import { 
  ShieldAlert, 
  LayoutDashboard, 
  Building2, 
  TerminalSquare, 
  LogOut, 
  Menu, 
  X,
  Bell
} from 'lucide-react';
import { Button } from '../ui/Button';

export function SuperAdminLayout() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  // Super Admin Navigation Links
  const navLinks = [
    { name: 'Global Dashboard', path: '/superadmin', icon: LayoutDashboard },
    { name: 'Manage Organizations', path: '/superadmin/organizations', icon: Building2 },
    { name: 'System Logs', path: '/superadmin/logs', icon: TerminalSquare },
  ];

  const handleLogout = () => {
    // Mock logout logic
    navigate('/login');
  };

  const isActive = (path) => {
    if (path === '/superadmin' && location.pathname !== '/superadmin') {
      return false;
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col md:flex-row">
      
      {/* --- Mobile Header --- */}
      <div className="md:hidden flex items-center justify-between bg-slate-900 border-b border-slate-800 p-4 sticky top-0 z-50">
        <Link to="/superadmin" className="flex items-center gap-2">
          <ShieldAlert className="h-6 w-6 text-purple-500" />
          <span className="text-xl font-bold text-white tracking-tight">Platform Admin</span>
        </Link>
        <button 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="text-slate-400 hover:text-white"
        >
          {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* --- Sidebar Navigation --- */}
      <aside className={`
        fixed inset-y-0 left-0 z-40 w-64 bg-slate-900 border-r border-slate-800 transform transition-transform duration-300 ease-in-out
        md:relative md:translate-x-0 flex flex-col
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        
        {/* Desktop Logo */}
        <div className="hidden md:flex items-center gap-2 p-6 border-b border-slate-800/50">
          <ShieldAlert className="h-8 w-8 text-purple-500" />
          <div>
            <span className="text-xl font-bold text-white tracking-tight block">BloodConnect</span>
            <span className="text-xs font-medium text-purple-400 tracking-wider uppercase">Super Admin</span>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4 px-3">
            Platform Management
          </div>
          {navLinks.map((link) => {
            const Icon = link.icon;
            const active = isActive(link.path);
            
            return (
              <Link
                key={link.name}
                to={link.path}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 ${
                  active 
                    ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20 shadow-[0_0_15px_rgba(168,85,247,0.05)]' 
                    : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200 border border-transparent'
                }`}
              >
                <Icon className={`h-5 w-5 ${active ? 'text-purple-400' : 'text-slate-500'}`} />
                <span className="font-medium text-sm">{link.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* User Profile / Logout Container */}
        <div className="p-4 border-t border-slate-800/50 bg-slate-900/50">
          <div className="flex items-center gap-3 px-3 py-2 mb-4">
            <div className="h-10 w-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-slate-300">
              SA
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-medium text-white truncate">System Admin</p>
              <p className="text-xs text-slate-500 truncate">admin@bloodconnect.com</p>
            </div>
          </div>
          <Button 
            variant="ghost" 
            className="w-full justify-start text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 gap-3"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4" />
            Secure Logout
          </Button>
        </div>
      </aside>

      {/* --- Overlay for mobile --- */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-30 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* --- Main Content Area --- */}
      <main className="flex-1 flex flex-col min-h-screen overflow-hidden">
        
        {/* Top Notification Bar (Desktop) */}
        <header className="hidden md:flex h-16 bg-slate-900/50 border-b border-slate-800 items-center justify-end px-8 sticky top-0 z-10 backdrop-blur-md">
          <div className="flex items-center gap-4">
            <button className="relative p-2 text-slate-400 hover:text-white transition-colors rounded-full hover:bg-slate-800">
              <Bell className="h-5 w-5" />
              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-rose-500 border border-slate-900"></span>
            </button>
            <div className="h-6 w-px bg-slate-800"></div>
            <span className="text-sm font-medium text-slate-300">Platform Status: <span className="text-emerald-400">All Systems Operational</span></span>
          </div>
        </header>

        {/* Dynamic Page Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 relative">
          {/* Ambient Background Glow */}
          <div className="absolute top-0 right-0 w-125 h-125 bg-purple-600/5 rounded-full blur-[120px] pointer-events-none" />
          
          <Outlet />
        </div>
      </main>

    </div>
  );
}