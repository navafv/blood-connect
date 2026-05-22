import { Droplet } from "lucide-react";
import { Link } from "react-router-dom";

export function Footer() {
  return (
    <footer className="border-t border-slate-800 bg-slate-950 py-8">
      <div className="container mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-rose-500">
          <Droplet className="h-5 w-5 fill-current" />
          <span className="text-lg font-bold text-white">BloodConnect</span>
        </div>

        <p className="text-sm text-slate-400 text-center md:text-left">
          &copy; {new Date().getFullYear()} BloodConnect SaaS. All rights
          reserved.
        </p>

        <div className="flex gap-4 text-sm text-slate-400">
          <Link to="/privacy" className="hover:text-rose-400 transition-colors">
            Privacy
          </Link>
          <Link to="/terms" className="hover:text-rose-400 transition-colors">
            Terms
          </Link>
          <Link to="/contact" className="hover:text-rose-400 transition-colors">
            Contact
          </Link>
        </div>
      </div>
    </footer>
  );
}
