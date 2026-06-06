const PageLoader = () => (
  <div
    className="flex h-screen w-screen flex-col items-center justify-center bg-slate-950 gap-4"
    aria-live="polite"
  >
    <div className="relative flex items-center justify-center">
      <Droplet className="absolute h-8 w-8 text-rose-500 animate-pulse fill-rose-500/20" />
      <div className="h-16 w-16 animate-spin rounded-full border-4 border-slate-800 border-t-rose-500" />
    </div>
    <span className="text-sm font-medium tracking-widest text-transparent bg-clip-text bg-linear-to-r from-slate-400 to-slate-200 animate-pulse">
      LOADING WORKSPACE
    </span>
  </div>
);
