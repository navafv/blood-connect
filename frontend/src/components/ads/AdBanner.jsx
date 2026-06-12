import React, { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import api from "../../lib/axios";

export function AdBanner({ className = "" }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const timerRef = useRef(null);

  // --- Data Fetching ---
  const { data: ads = [], isLoading } = useQuery({
    queryKey: ["activeAds"],
    queryFn: async () => {
      const response = await api.get("/public/advertisements/");
      return response.data.results || response.data;
    },
  });

  // --- Carousel Engine (Auto-advance) ---
  useEffect(() => {
    // Only run the timer if there are multiple ads and the user isn't hovering
    if (ads.length <= 1 || isPaused) return;

    timerRef.current = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % ads.length);
    }, 6000);

    return () => clearInterval(timerRef.current);
  }, [ads.length, isPaused]);

  // --- Fallback States ---
  if (isLoading || ads.length === 0) return null;

  const apiBase = import.meta.env.PROD
    ? import.meta.env.VITE_API_BASE_URL || "https://api.bloodonate.org/api"
    : "http://localhost:8000/api";
  const baseURL = apiBase.replace(/\/api\/?$/, "");

  return (
    <div
      className={`relative w-full h-48 sm:h-64 md:h-80 rounded-2xl overflow-hidden shadow-xl border transition-colors duration-300 bg-slate-50 border-slate-200 dark:border-slate-800 dark:bg-slate-950 group ${className}`}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Ad Layers */}
      {ads.map((ad, index) => {
        const isActive = index === currentIndex;

        return (
          <a
            key={ad.id}
            href={`${baseURL}/api/public/ads/${ad.id}/click/`}
            target="_blank"
            rel="noopener noreferrer"
            className={`absolute inset-0 w-full h-full transition-opacity duration-1000 ease-in-out ${
              isActive
                ? "opacity-100 z-10"
                : "opacity-0 z-0 pointer-events-none"
            }`}
          >
            {/* Background Image */}
            <img
              src={
                ad.image.startsWith("http") ? ad.image : `${baseURL}${ad.image}`
              }
              alt={ad.title}
              className={`w-full h-full object-cover transition-transform duration-6000 ease-linear ${
                isActive ? "scale-105" : "scale-100"
              }`}
              loading="lazy"
            />

            {/* Dark Gradient Overlay for Text/Dots Readability (remains dark to contrast images) */}
            <div className="absolute inset-0 bg-linear-to-t from-slate-950/90 via-slate-900/20 to-transparent transition-opacity duration-300" />

            {/* Sponsored Badge */}
            <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded text-[10px] font-bold text-white/90 uppercase tracking-widest border border-white/10 shadow-lg">
              Sponsored
            </div>

            {/* Title / Call to Action */}
            {/* <div className="absolute bottom-8 left-6 right-6">
              <h3 className="text-xl sm:text-2xl font-bold text-white drop-shadow-lg truncate">
                {ad.title}
              </h3>

              <p className="text-sm text-slate-300 font-medium mt-1 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0">
                Click to learn more &rarr;
              </p>
            </div> */}
          </a>
        );
      })}

      {/* Navigation Indicators (Dots) */}
      {ads.length > 1 && (
        <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-2 z-20">
          {ads.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              aria-label={`Go to slide ${idx + 1}`}
              className={`h-1.5 rounded-full transition-all duration-500 ease-in-out ${
                idx === currentIndex
                  ? "w-8 bg-rose-600 dark:bg-rose-500"
                  : "w-2 bg-white/60 hover:bg-white/90 dark:bg-white/40 dark:hover:bg-white/70"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
