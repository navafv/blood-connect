import React from "react";
import { useQuery } from "@tanstack/react-query";
import api from "../../lib/axios";

export function AdBanner({ className = "" }) {
  const { data: ads = [], isLoading } = useQuery({
    queryKey: ["activeAds"],
    queryFn: async () => {
      const response = await api.get("/advertisements/");
      return response.data.results || response.data;
    },
  });

  if (isLoading || ads.length === 0) return null;

  const baseURL =
    import.meta.env.VITE_API_URL?.replace("/api", "") ||
    "http://localhost:8000";

  return (
    <div
      className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 ${className}`}
    >
      {ads.map((ad) => (
        <a
          key={ad.id}
          href={`${baseURL}/api/public/ads/${ad.id}/click/`}
          target="_blank"
          rel="noopener noreferrer"
          className="block w-full rounded-2xl overflow-hidden shadow-xl border border-slate-800 hover:border-rose-500/50 hover:shadow-rose-500/10 transition-all group"
        >
          <div className="relative">
            <img
              src={
                ad.image.startsWith("http") ? ad.image : `${baseURL}${ad.image}`
              }
              alt={ad.title}
              className="w-full h-40 object-cover opacity-90 group-hover:opacity-100 transition-opacity"
            />
            <div className="absolute top-2 right-2 bg-black/70 backdrop-blur-md px-2 py-0.5 rounded text-[10px] font-medium text-slate-300 uppercase tracking-widest border border-white/10">
              Sponsored
            </div>
            <div className="absolute bottom-0 inset-x-0 bg-linear-to-t from-slate-950 to-transparent p-4 pt-12">
              <p className="text-white font-medium truncate">{ad.title}</p>
            </div>
          </div>
        </a>
      ))}
    </div>
  );
}
