import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { useQuery } from "@tanstack/react-query";
import {
  Search,
  Shield,
  Clock,
  HeartHandshake,
  ArrowRight,
  Activity,
  Building2,
} from "lucide-react";

import api from "../../lib/axios";
import { Button } from "../../components/ui/Button";
import { Card, CardContent } from "../../components/ui/Card";
import { AdBanner } from "../../components/ads/AdBanner";
import { Badge } from "../../components/ui/Badge";

export default function Home() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [activeAdIndex, setActiveAdIndex] = useState(0);
  const viewedAds = useRef(new Set());

  // --- 1. Fetch Dynamic Hero Content ---
  const { data: heroData, isLoading } = useQuery({
    queryKey: ["heroContent"],
    queryFn: async () => {
      const res = await api.get("/public/hero-content/");
      return res.data;
    },
  });

  const images = heroData?.hero_images || [];
  const ads = heroData?.hero_ads || [];
  const totalSlides = images.length + (ads.length > 0 ? 1 : 0);

  const apiBase = import.meta.env.PROD
    ? import.meta.env.VITE_API_BASE_URL || "https://api.bloodonate.org/api"
    : "http://localhost:8000/api";
  const baseURL = apiBase.replace(/\/api\/?$/, "");

  // --- 2. Auto-Sliding & Random Ad Engine ---
  useEffect(() => {
    if (totalSlides <= 1) return;

    const timer = setInterval(() => {
      setCurrentSlide((prev) => {
        const next = (prev + 1) % totalSlides;

        // When we cycle back to the first slide, pick a NEW random ad for the end of this cycle
        if (next === 0 && ads.length > 0) {
          setActiveAdIndex(Math.floor(Math.random() * ads.length));
        }
        return next;
      });
    }, 6000); // 6 seconds per slide

    return () => clearInterval(timer);
  }, [totalSlides, ads.length]);

  // --- 3. Impression Tracking for the Ad Slide ---
  useEffect(() => {
    if (currentSlide === images.length && ads.length > 0) {
      const currentAdId = ads[activeAdIndex].id;
      if (!viewedAds.current.has(currentAdId)) {
        api.post(`/public/ads/${currentAdId}/view/`).catch(() => {});
        viewedAds.current.add(currentAdId);
      }
    }
  }, [currentSlide, images.length, ads, activeAdIndex]);

  const features = [
    {
      icon: Clock,
      title: "Real-Time Availability",
      description:
        "Our system automatically calculates donor eligibility, ensuring you only see people who can safely donate today.",
    },
    {
      icon: Shield,
      title: "100% Proxy Routing",
      description:
        "Donor phone numbers are never exposed. All communication is securely routed through the verified medical organization.",
    },
    {
      icon: Activity,
      title: "Hyper-Local Search",
      description:
        "Filter by country, state, and district to find eligible donors in your immediate vicinity in seconds.",
    },
    {
      icon: Building2,
      title: "Trusted Organizations",
      description:
        "Data is maintained directly by verified hospitals, blood banks, and NGOs on our secure multi-tenant platform.",
    },
  ];

  return (
    <>
      <Helmet>
        <title>Bloodonate | Find Blood Donors Instantly & Save Lives</title>
        <meta
          name="description"
          content="A centralized, real-time registry to find eligible blood donors in your area instantly. Maintained by trusted hospitals and NGOs. No account required to search."
        />
        <meta
          name="keywords"
          content="blood donation, find blood donor, blood registry, local blood donors, emergency blood search, donate blood, verified blood donors"
        />

        <meta property="og:type" content="website" />
        <meta
          property="og:title"
          content="Bloodonate | Find Blood Donors Instantly"
        />
        <meta
          property="og:description"
          content="Find eligible blood donors in your area instantly. Maintained by trusted hospitals and NGOs."
        />
        <meta property="og:url" content="https://www.bloodonate.org/" />
        <meta
          property="og:image"
          content="https://www.bloodonate.org/og-image.jpg"
        />

        <meta name="twitter:card" content="summary_large_image" />
        <meta
          name="twitter:title"
          content="Bloodonate | Find Blood Donors Instantly"
        />
        <meta
          name="twitter:description"
          content="Find eligible blood donors in your area instantly. Maintained by trusted hospitals and NGOs."
        />
        <meta
          name="twitter:image"
          content="https://www.bloodonate.org/twitter-image.jpg"
        />
        <link rel="canonical" href="https://www.bloodonate.org/" />
      </Helmet>

      <div className="flex flex-col min-h-screen bg-slate-50 transition-colors duration-300 dark:bg-slate-950 overflow-hidden">
        {/* ========================================================= */}
        {/* SECTION 1: Full-Screen Edge-to-Edge Hero Carousel         */}
        {/* ========================================================= */}
        <section className="relative w-full h-[60vh] lg:h-[90vh] bg-slate-900 overflow-hidden group">
          {isLoading ? (
            <div className="absolute inset-0 animate-pulse bg-slate-800" />
          ) : totalSlides === 0 ? (
            <img
              src="/Donor_holding_a_blood_drop.jpg"
              alt="Fallback"
              className="w-full h-full object-cover opacity-80"
            />
          ) : (
            <>
              {/* 1. Render Admin Uploaded Images */}
              {images.map((img, idx) => (
                <div
                  key={img.id}
                  className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
                    currentSlide === idx
                      ? "opacity-100 z-10"
                      : "opacity-0 z-0 pointer-events-none"
                  }`}
                >
                  <img
                    src={`${img.image}`}
                    alt={img.alt_text || "Hero visual"}
                    fetchPriority={idx === 0 ? "high" : "auto"} // LCP Optimization
                    className={`w-full h-full object-cover transition-transform duration-[6000ms] ease-linear ${
                      currentSlide === idx ? "scale-105" : "scale-100"
                    }`}
                  />
                  {/* Subtle overlay for depth */}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent pointer-events-none" />
                </div>
              ))}

              {/* 2. Render the Random Ad as the Last Slide */}
              {ads.length > 0 && (
                <div
                  className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
                    currentSlide === images.length
                      ? "opacity-100 z-10"
                      : "opacity-0 z-0 pointer-events-none"
                  }`}
                >
                  <a
                    href={`${baseURL}/api/public/ads/${ads[activeAdIndex].id}/click/`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full h-full"
                  >
                    <img
                      src={`${ads[activeAdIndex].hero_image || ads[activeAdIndex].banner_image}`}
                      alt={ads[activeAdIndex].title}
                      className={`w-full h-full object-cover transition-transform duration-[6000ms] ease-linear ${
                        currentSlide === images.length
                          ? "scale-105"
                          : "scale-100"
                      }`}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-900/20 to-transparent transition-opacity duration-300" />
                    <div className="absolute top-6 right-6 md:top-8 md:right-8 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded text-xs font-bold text-white/90 uppercase tracking-widest border border-white/10 shadow-lg z-20">
                      Sponsored
                    </div>
                  </a>
                </div>
              )}

              {/* 3. Carousel Navigation Dots */}
              {totalSlides > 1 && (
                <div className="absolute bottom-8 left-0 right-0 flex justify-center gap-3 z-20">
                  {Array.from({ length: totalSlides }).map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentSlide(idx)}
                      aria-label={`Go to slide ${idx + 1}`}
                      className={`h-2 rounded-full transition-all duration-500 ease-in-out shadow-sm ${
                        currentSlide === idx
                          ? "w-10 bg-rose-600 border border-rose-500"
                          : "w-3 bg-white/60 hover:bg-white/90 border border-white/40"
                      }`}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </section>

        {/* ========================================================= */}
        {/* SECTION 2: Text Hero & Call to Action (Below Slider)      */}
        {/* ========================================================= */}
        <section className="relative px-4 py-20 md:py-28 lg:py-32 overflow-hidden border-b border-slate-200 dark:border-slate-800/50 bg-white dark:bg-slate-950">
          <div className="container mx-auto max-w-4xl relative z-10 text-center animate-in fade-in slide-in-from-bottom-8 duration-700">
            <div className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-full border text-sm font-medium mb-8 shadow-sm transition-colors duration-300 bg-slate-50 border-rose-200 text-rose-700 dark:bg-rose-500/10 dark:border-rose-500/20 dark:text-rose-400 dark:shadow-[0_0_15px_rgba(225,29,72,0.1)]">
              <HeartHandshake className="h-4 w-4" />
              <span>Connecting Donors with Those in Need</span>
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight mb-8 leading-tight transition-colors duration-300 text-slate-900 dark:text-white">
              Find a Blood Donor. <br className="hidden sm:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r transition-colors duration-300 from-rose-500 to-rose-700 dark:from-rose-400 dark:to-rose-600">
                Save a Life Today.
              </span>
            </h1>

            <p className="text-lg md:text-xl max-w-2xl mx-auto mb-12 leading-relaxed transition-colors duration-300 text-slate-600 dark:text-slate-400">
              A centralized, real-time registry maintained by trusted hospitals,
              blood banks, clinics, and NGOs. Find eligible blood donors in your
              area instantly.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/search" className="w-full sm:w-auto">
                <Button
                  variant="primary"
                  size="lg"
                  className="w-full text-base gap-2 px-8 py-6 rounded-full shadow-md hover:shadow-lg transition-all duration-300 dark:shadow-rose-glow dark:hover:shadow-rose-glow-lg"
                >
                  <Search className="h-5 w-5" aria-hidden="true" />
                  Find Donors Now
                </Button>
              </Link>
              <Link to="/register-org" className="w-full sm:w-auto">
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full text-base gap-2 px-8 py-6 rounded-full backdrop-blur-md transition-all duration-300 bg-white/50 border-slate-200 text-slate-700 hover:bg-slate-100 hover:text-slate-900 dark:bg-slate-900/50 dark:border-slate-700 dark:hover:bg-slate-800 dark:text-slate-300 dark:hover:text-white"
                >
                  Register Your Organization
                  <ArrowRight className="h-5 w-5" aria-hidden="true" />
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* --- Process Diagram Section (With Illustration) --- */}
        <section className="py-24 border-b relative transition-colors duration-300 bg-slate-100/50 border-slate-200 dark:bg-slate-900/40 dark:border-slate-800/50">
          <div className="container mx-auto max-w-7xl px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4 transition-colors duration-300 text-slate-900 dark:text-white">
                How It Works
              </h2>
              <p className="max-w-2xl mx-auto text-lg transition-colors duration-300 text-slate-600 dark:text-slate-400">
                Three simple steps to connect with a lifesaver in your time of
                need.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
              <div className="space-y-6 relative z-10">
                {[
                  {
                    num: 1,
                    title: "Search Locality",
                    desc: "Enter your district and required blood group into our public directory.",
                  },
                  {
                    num: 2,
                    title: "Find Eligible Matches",
                    desc: "Review a filtered list of donors who are verified and medically eligible to donate today.",
                  },
                  {
                    num: 3,
                    title: "Contact Organization",
                    desc: "Connect instantly with the verified hospital, blood bank, or NGO managing the donor to arrange the donation.",
                  },
                ].map((step) => (
                  <div
                    key={step.num}
                    className="group relative flex items-start gap-6 p-6 sm:p-8 rounded-3xl border shadow-sm hover:-translate-y-1 transition-all duration-500 bg-white border-slate-200 hover:border-rose-300 hover:shadow-xl dark:bg-slate-950 dark:border-slate-800/80 dark:hover:border-rose-500/30 dark:hover:shadow-[0_0_30px_rgba(225,29,72,0.05)]"
                  >
                    <div className="w-16 h-16 shrink-0 rounded-2xl flex items-center justify-center border text-2xl font-black shadow-inner transition-all duration-500 bg-slate-50 border-slate-200 text-rose-600 group-hover:border-rose-300 group-hover:bg-rose-50 dark:bg-slate-900 dark:border-slate-800 dark:text-rose-500 dark:group-hover:border-rose-500/40 dark:group-hover:shadow-[inset_0_0_20px_rgba(225,29,72,0.2)]">
                      {step.num}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold mb-2 tracking-wide transition-colors duration-300 text-slate-900 dark:text-white">
                        {step.title}
                      </h3>
                      <p className="leading-relaxed transition-colors duration-300 text-slate-600 dark:text-slate-400">
                        {step.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="relative flex justify-center items-center">
                <div
                  className="absolute inset-0 bg-blue-500/10 blur-[80px] rounded-full dark:bg-blue-500/20"
                  aria-hidden="true"
                />
                <img
                  src="/Blood_Donation_Infographic.png"
                  alt="Blood Donation Infographic"
                  className="relative z-10 w-full max-w-lg h-auto object-contain drop-shadow-2xl rounded-3xl transition-transform duration-700 hover:scale-105"
                />
              </div>
            </div>
          </div>
        </section>

        {/* --- Value Proposition Grid --- */}
        <section className="py-24 bg-gradient-to-b transition-colors duration-300 from-slate-50 to-slate-100/50 dark:from-slate-950 dark:to-slate-900/20">
          <div className="container mx-auto max-w-7xl px-4">
            <div className="mb-16 text-center md:text-left md:flex md:items-end md:justify-between">
              <div className="max-w-2xl">
                <h2 className="text-3xl md:text-4xl font-bold mb-4 transition-colors duration-300 text-slate-900 dark:text-white">
                  Why Use Bloodonate?
                </h2>
                <p className="text-lg transition-colors duration-300 text-slate-600 dark:text-slate-400">
                  Our platform is designed to be the fastest, most reliable
                  bridge between willing donors and patients in critical need.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
              <div className="lg:col-span-5 relative rounded-3xl overflow-hidden shadow-xl border border-slate-200 dark:border-slate-800 min-h-[300px] sm:min-h-[400px] group">
                <img
                  src="/Importance_of_Blood_Donation.jpg"
                  alt="Importance of blood donation"
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/40 to-transparent flex items-end p-8">
                  <div>
                    <Badge className="bg-rose-500 text-white border-0 mb-3 uppercase tracking-widest text-[10px]">
                      Impact
                    </Badge>
                    <h3 className="text-2xl sm:text-3xl font-bold text-white leading-tight">
                      Every Drop Counts
                    </h3>
                    <p className="text-slate-300 mt-2 text-sm font-medium">
                      Join thousands of verified donors saving lives across the
                      country.
                    </p>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-6">
                {features.map((feature, index) => {
                  const Icon = feature.icon;
                  return (
                    <Card
                      key={index}
                      className="group hover:-translate-y-1 transition-all duration-300 backdrop-blur-sm bg-white/60 border-slate-200 hover:border-slate-300 dark:bg-slate-900/40 dark:border-slate-800/60 dark:hover:border-slate-700 shadow-sm hover:shadow-lg"
                    >
                      <CardContent className="p-8">
                        <div className="h-14 w-14 rounded-xl flex items-center justify-center mb-6 transition-all duration-300 border bg-slate-50 border-slate-200 group-hover:bg-rose-50 group-hover:border-rose-200 dark:bg-slate-950 dark:border-slate-800 dark:group-hover:bg-rose-500/10 dark:group-hover:border-rose-500/20">
                          <Icon
                            className="h-7 w-7 transition-colors duration-300 text-slate-500 group-hover:text-rose-600 dark:text-slate-400 dark:group-hover:text-rose-400"
                            aria-hidden="true"
                          />
                        </div>
                        <h3 className="text-lg font-bold mb-3 transition-colors duration-300 text-slate-900 dark:text-white">
                          {feature.title}
                        </h3>
                        <p className="text-sm leading-relaxed transition-colors duration-300 text-slate-600 dark:text-slate-400">
                          {feature.description}
                        </p>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* --- Pre-Footer Landscape Ad Boundary --- */}
        <section className="py-16 transition-colors duration-300 bg-transparent">
          <div className="container mx-auto max-w-5xl px-4">
            <AdBanner format="banner" />
          </div>
        </section>

        {/* --- Conversion Footer --- */}
        <section className="py-32 relative overflow-hidden border-t transition-colors duration-300 border-slate-200 dark:border-slate-800/50">
          <div className="absolute inset-0 bg-gradient-to-b transition-colors duration-300 from-transparent to-rose-50 dark:to-rose-950/20" />
          <div className="container mx-auto max-w-4xl px-4 relative z-10 text-center">
            <h2 className="text-4xl md:text-5xl font-extrabold mb-6 tracking-tight transition-colors duration-300 text-slate-900 dark:text-white">
              Ready to find a donor?
            </h2>
            <p className="mb-10 max-w-2xl mx-auto text-lg transition-colors duration-300 text-slate-600 dark:text-slate-400">
              Our directory is entirely free to use for the public. Search the
              database right now without creating an account.
            </p>
            <Link to="/search">
              <Button
                variant="primary"
                size="lg"
                className="px-10 py-7 rounded-full text-lg font-semibold gap-3 hover:-translate-y-1 transition-all duration-300 shadow-md hover:shadow-lg dark:shadow-rose-glow dark:hover:shadow-rose-glow-lg"
              >
                <Search className="h-6 w-6" aria-hidden="true" />
                Search the Directory
              </Button>
            </Link>
          </div>
        </section>
      </div>
    </>
  );
}
