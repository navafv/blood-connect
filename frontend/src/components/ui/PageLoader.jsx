import { Droplet } from "lucide-react";

const PageLoader = () => (
  <div
    className="flex h-screen w-screen flex-col items-center justify-center bg-slate-50 gap-4 transition-colors duration-300 dark:bg-slate-950"
    aria-live="polite"
  >
    <div className="relative flex items-center justify-center">
      <Droplet className="absolute h-8 w-8 text-rose-600 animate-pulse fill-rose-600/20 dark:text-rose-500 dark:fill-rose-500/20" />
      <div className="h-16 w-16 animate-spin rounded-full border-4 border-slate-200 border-t-rose-600 dark:border-slate-800 dark:border-t-rose-500" />
    </div>
    <span className="text-sm font-bold tracking-widest text-transparent bg-clip-text bg-linear-to-r from-slate-600 to-slate-800 animate-pulse dark:font-medium dark:from-slate-400 dark:to-slate-200">
      LOADING WORKSPACE
    </span>
  </div>
);

export default PageLoader;
