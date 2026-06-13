import React, { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import api from "../../lib/axios";

// NEW PROP: format can be "banner" (default) or "portrait"
export function AdBanner({ className = "", format = "banner" }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const timerRef = useRef(null);

  // Ref to track which ad IDs have already counted a view in this session to prevent spam
  const viewedAds = useRef(new Set());

  // --- Data Fetching ---
  const { data: ads = [], isLoading } = useQuery({
    queryKey: ["activeAds"],
    queryFn: async () => {
      const response = await api.get("/public/advertisements/");
      return response.data.results || response.data;
    },
  });

  // --- Impression Tracking Engine ---
  useEffect(() => {
    if (ads.length > 0 && ads[currentIndex]) {
      const currentAdId = ads[currentIndex].id;

      // Only track the view once per ad per component mount
      if (!viewedAds.current.has(currentAdId)) {
        api.post(`/public/ads/${currentAdId}/view/`).catch(() => {});
        viewedAds.current.add(currentAdId);
      }
    }
  }, [currentIndex, ads]);

  // --- Carousel Engine (Auto-advance) ---
  useEffect(() => {
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

  // Determine sizing based on format prop
  const sizeClasses =
    format === "portrait"
      ? "h-96 sm:h-[450px] md:h-[500px]" // Tall for sidebars or hero sections
      : "h-38 sm:h-64 md:h-80"; // Wide for horizontal inserts

  return (
    <div
      className={`relative w-full ${sizeClasses} rounded-2xl overflow-hidden shadow-xl border transition-colors duration-300 bg-slate-50 border-slate-200 dark:border-slate-800 dark:bg-slate-950 group ${className}`}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Ad Layers */}
      {ads.map((ad, index) => {
        const isActive = index === currentIndex;

        // Image Selection Logic: If format is portrait, use portrait_image if available. Otherwise fallback to banner.
        let displayImage = ad.banner_image;
        if (format === "portrait" && ad.portrait_image) {
          displayImage = ad.portrait_image;
        }

        const imageSrc = displayImage?.startsWith("http")
          ? displayImage
          : `${baseURL}${displayImage}`;

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
              src={imageSrc}
              alt={ad.title}
              className={`w-full h-full object-cover transition-transform duration-6000 ease-linear ${
                isActive ? "scale-105" : "scale-100"
              }`}
              loading="lazy"
            />

            {/* Dark Gradient Overlay for Text/Dots Readability */}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent transition-opacity duration-300" />

            {/* Sponsored Badge */}
            <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded text-[10px] font-bold text-white/90 uppercase tracking-widest border border-white/10 shadow-lg">
              Sponsored
            </div>
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
