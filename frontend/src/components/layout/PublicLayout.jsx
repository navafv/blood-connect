import { Outlet } from "react-router-dom";
import { Navbar } from "./Navbar";
import { Footer } from "./Footer";

export function PublicLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-slate-900 text-slate-100 font-sans">
      <Navbar />
      {/* <Outlet /> renders the specific page content based on the current route */}
      <main className="grow">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
