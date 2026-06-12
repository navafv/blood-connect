import React from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Helmet } from "react-helmet-async";
import {
  MapPin,
  Phone,
  Mail,
  Building2,
  Loader2,
  Droplet,
  ArrowLeft,
  HeartPulse,
} from "lucide-react";
import api from "../../lib/axios";
import { DonorCard } from "../../components/donors/DonorCard";
import { Button } from "../../components/ui/Button";

// --- Cloudinary URL Optimizer ---
// Dynamically injects format=auto and quality=auto to reduce 5MB images to ~50kb WebP
const optimizeCloudinaryUrl = (url, width = 800) => {
  if (!url || !url.includes("res.cloudinary.com")) return url;
  return url.replace("/upload/", `/upload/f_auto,q_auto,w_${width}/`);
};

export default function OrganizationProfile() {
  const { slug } = useParams();

  // --- 1. Institutional Identity Query ---
  const {
    data: org,
    isLoading: orgLoading,
    isError: orgError,
  } = useQuery({
    queryKey: ["public-org", slug],
    queryFn: async () => {
      const res = await api.get(`/public/organizations/${slug}/`);
      return res.data;
    },
    retry: 1,
  });

  // --- 2. Scoped Donor Directory Query ---
  const { data: donorData, isLoading: donorsLoading } = useQuery({
    queryKey: ["org-donors", org?.id],
    queryFn: async () => {
      const res = await api.get(
        `/public/donors/search/?organization=${org.id}`,
      );
      return res.data.results || res.data;
    },
    enabled: !!org?.id, // Only execute once the Organization ID is resolved
  });

  // --- State: Loading ---
  if (orgLoading) {
    return (
      <div className="min-h-screen transition-colors duration-300 bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center gap-4">
        <Loader2
          className="h-10 w-10 animate-spin transition-colors duration-300 text-rose-600 dark:text-rose-500"
          aria-hidden="true"
        />
        <span className="text-sm font-medium tracking-widest animate-pulse transition-colors duration-300 text-slate-500 dark:text-slate-500">
          RESOLVING PROFILE...
        </span>
      </div>
    );
  }

  // --- State: 404 / Inactive ---
  if (orgError || !org) {
    return (
      <div className="min-h-screen transition-colors duration-300 bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center px-4 text-center">
        <Helmet>
          <title>Organization Not Found | Bloodonate</title>
          <meta name="robots" content="noindex, nofollow" />
        </Helmet>
        <Building2
          className="h-20 w-20 mb-6 transition-colors duration-300 text-slate-300 dark:text-slate-800"
          aria-hidden="true"
        />
        <h1 className="text-2xl font-bold mb-2 transition-colors duration-300 text-slate-900 dark:text-white">
          Organization Unavailable
        </h1>
        <p className="max-w-md mb-8 transition-colors duration-300 text-slate-600 dark:text-slate-400">
          The facility you are looking for does not exist, or their directory
          has been temporarily suspended.
        </p>
        <Link to="/search">
          <Button
            variant="outline"
            className="rounded-full gap-2 transition-colors duration-300 text-slate-700 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Return to
            Global Search
          </Button>
        </Link>
      </div>
    );
  }

  // --- SEO & Image Optimization Strategy ---
  const pageTitle = `${org.name} - Blood Donors in ${org.district_name} | Bloodonate`;
  const pageDescription = `Contact ${org.name} located in ${org.district_name}, ${org.state_name} for emergency blood requests and verified donor queries.`;

  // Optimize images for Lighthouse performance
  const optimizedBanner = optimizeCloudinaryUrl(org.banner_image, 1920);
  const optimizedLogo = optimizeCloudinaryUrl(org.logo, 400);

  // --- JSON-LD Structured Data for Google Rich Snippets ---
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "MedicalOrganization",
    name: org.name,
    description: org.description || pageDescription,
    image: optimizedBanner || optimizedLogo,
    logo: optimizedLogo,
    address: {
      "@type": "PostalAddress",
      streetAddress: org.address_line,
      addressLocality: org.district_name,
      addressRegion: org.state_name,
      addressCountry: "IN",
    },
    contactPoint: {
      "@type": "ContactPoint",
      telephone: org.contact_phone,
      email: org.contact_email,
      contactType: "Emergency Blood Requests",
      availableLanguage: ["English", "Hindi", "Malayalam"],
    },
  };

  return (
    <>
      {/* --- Dynamic SEO, Social Media Graph, and Structured Data --- */}
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />

        {/* Canonical URL to prevent duplicate content penalties */}
        <link rel="canonical" href={window.location.href} />

        {/* Open Graph / Facebook / LinkedIn */}
        <meta property="og:type" content="profile" />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDescription} />
        <meta property="og:url" content={window.location.href} />
        {optimizedBanner && (
          <meta property="og:image" content={optimizedBanner} />
        )}

        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={pageTitle} />
        <meta name="twitter:description" content={pageDescription} />
        {optimizedBanner && (
          <meta name="twitter:image" content={optimizedBanner} />
        )}

        {/* Injecting Schema.org JSON-LD */}
        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>
      </Helmet>

      <div className="min-h-screen transition-colors duration-300 bg-slate-50 dark:bg-slate-950 pb-24">
        {/* --- Dynamic Hero Banner --- */}
        <div className="relative h-[300px] md:h-[400px] w-full border-b overflow-hidden animate-in fade-in duration-700 transition-colors duration-300 bg-slate-200 border-slate-300 dark:bg-slate-900 dark:border-slate-800">
          {optimizedBanner ? (
            <img
              src={optimizedBanner}
              alt={`${org.name} hospital facility banner`}
              fetchpriority="high" // Crucial for LCP Lighthouse Score
              className="w-full h-full object-cover opacity-60 dark:opacity-50 scale-105 transition-opacity duration-300"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center transition-colors duration-300 bg-linear-to-br from-slate-200 via-slate-300 to-slate-200 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
              <Building2
                className="h-32 w-32 opacity-20 transition-colors duration-300 text-slate-600 dark:text-slate-950 dark:opacity-50"
                aria-hidden="true"
              />
            </div>
          )}

          {/* Vignette Overlay - Perfectly blends into the body background color */}
          <div className="absolute inset-0 bg-linear-to-t transition-colors duration-300 from-slate-50 via-slate-50/40 to-transparent dark:from-slate-950 dark:via-slate-950/40" />
        </div>

        {/* --- Profile Header --- */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-20">
          <div className="flex flex-col md:flex-row md:items-end gap-5 md:gap-8 -mt-[88px] md:-mt-[176px] mb-8">
            {/* Institutional Logo Profile Picture */}
            <div className="relative shrink-0 animate-in zoom-in-90 duration-500 delay-100">
              {optimizedLogo ? (
                <img
                  src={optimizedLogo}
                  alt={`${org.name} official logo`}
                  className="w-20 h-20 md:w-40 md:h-40 rounded-2xl border-4 object-cover shadow-xl transition-colors duration-300 bg-white border-white dark:border-slate-950 dark:bg-slate-900 dark:shadow-2xl"
                />
              ) : (
                <div className="w-20 h-20 md:w-40 md:h-40 rounded-2xl border-4 flex items-center justify-center shadow-xl transition-colors duration-300 bg-slate-100 border-white dark:border-slate-950 dark:bg-slate-800 dark:shadow-2xl">
                  <Building2
                    className="w-10 h-10 md:w-16 md:h-16 transition-colors duration-300 text-slate-400 dark:text-slate-500"
                    aria-hidden="true"
                  />
                </div>
              )}
            </div>

            {/* Title & Badges */}
            <div className="animate-in slide-in-from-left-8 duration-700 delay-100 pb-2 md:pb-4 flex-1">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border text-xs font-bold uppercase tracking-wider mb-3 transition-colors duration-300 bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-500/10 dark:border-emerald-500/20 dark:text-emerald-400">
                Verified {org.org_type.replace("_", " ")}
              </div>
              <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-3 transition-colors duration-300 text-slate-900 dark:text-white">
                {org.name}
              </h1>
              <div className="flex flex-wrap items-center gap-4 font-medium transition-colors duration-300 text-slate-600 dark:text-slate-300">
                <span className="flex items-center gap-1.5 backdrop-blur-md px-3 py-1.5 rounded-lg border shadow-sm transition-colors duration-300 bg-white/80 border-slate-200 text-slate-700 dark:bg-slate-900/80 dark:border-slate-700/50 dark:text-slate-300">
                  <MapPin
                    className="h-4 w-4 transition-colors duration-300 text-rose-600 dark:text-rose-500"
                    aria-hidden="true"
                  />
                  {org.district_name}, {org.state_name}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* --- Main Content Grid --- */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Left Column: Institutional Details */}
          <div className="lg:col-span-1 space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200">
            <section className="border rounded-3xl p-8 backdrop-blur-xl shadow-lg transition-colors duration-300 bg-white/60 border-slate-200 dark:bg-slate-900/40 dark:border-slate-800/80 dark:shadow-2xl">
              <h2 className="text-lg font-bold mb-6 flex items-center gap-2 transition-colors duration-300 text-slate-900 dark:text-white">
                <Phone
                  className="h-5 w-5 transition-colors duration-300 text-blue-600 dark:text-blue-500"
                  aria-hidden="true"
                />{" "}
                Contact Details
              </h2>
              <address className="space-y-6 text-sm not-italic transition-colors duration-300 text-slate-600 dark:text-slate-300">
                <div className="group">
                  <p className="text-xs font-semibold uppercase mb-1 transition-colors duration-300 text-slate-500">
                    Direct Line
                  </p>
                  <a
                    href={`tel:${org.contact_phone}`}
                    className="text-base transition-colors font-medium text-slate-800 hover:text-blue-600 dark:text-slate-200 dark:hover:text-blue-400"
                    aria-label={`Call ${org.contact_phone}`}
                  >
                    {org.contact_phone}
                  </a>
                </div>
                <div className="group">
                  <p className="text-xs font-semibold uppercase mb-1 transition-colors duration-300 text-slate-500">
                    Email
                  </p>
                  <a
                    href={`mailto:${org.contact_email}`}
                    className="text-base transition-colors font-medium text-slate-800 hover:text-blue-600 dark:text-slate-200 dark:hover:text-blue-400"
                    aria-label={`Email ${org.contact_email}`}
                  >
                    {org.contact_email}
                  </a>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase mb-1 transition-colors duration-300 text-slate-500">
                    Physical Address
                  </p>
                  <p className="text-base leading-relaxed transition-colors duration-300 text-slate-800 dark:text-slate-200">
                    {org.address_line}
                    <br />
                    {org.district_name}, {org.state_name}
                    <br />
                    {org.country_name}
                  </p>
                </div>
              </address>
            </section>

            <section className="border rounded-3xl p-8 backdrop-blur-xl shadow-lg transition-colors duration-300 bg-white/60 border-slate-200 dark:bg-slate-900/40 dark:border-slate-800/80 dark:shadow-2xl">
              <h2 className="text-lg font-bold mb-4 transition-colors duration-300 text-slate-900 dark:text-white">
                About Us
              </h2>
              <p className="text-base leading-relaxed whitespace-pre-wrap transition-colors duration-300 text-slate-600 dark:text-slate-400">
                {org.description ||
                  "Committed to saving lives through secure, community-driven blood donation management."}
              </p>
            </section>
          </div>

          {/* Right Column: Embedded Donor Directory */}
          <section className="lg:col-span-2 animate-in fade-in slide-in-from-right-8 duration-700 delay-300">
            <div className="flex items-center justify-between mb-8 pb-4 border-b transition-colors duration-300 border-slate-200 dark:border-slate-800/50">
              <div>
                <h2 className="text-2xl font-extrabold flex items-center gap-3 transition-colors duration-300 text-slate-900 dark:text-white">
                  <HeartPulse
                    className="h-7 w-7 transition-colors duration-300 text-rose-600 dark:text-rose-500"
                    aria-hidden="true"
                  />{" "}
                  Institutional Directory
                </h2>
                <p className="mt-2 text-sm transition-colors duration-300 text-slate-600 dark:text-slate-400">
                  Actively managed and medically vetted donors registered at
                  this facility.
                </p>
              </div>
            </div>

            {donorsLoading ? (
              <div className="flex flex-col items-center justify-center h-64 gap-4 rounded-3xl border transition-colors duration-300 bg-slate-100/50 border-slate-200 dark:bg-slate-900/20 dark:border-slate-800/30">
                <Loader2
                  className="h-8 w-8 animate-spin transition-colors duration-300 text-rose-600 dark:text-rose-500"
                  aria-hidden="true"
                />
                <p className="font-medium transition-colors duration-300 text-slate-500">
                  Loading local registry...
                </p>
              </div>
            ) : donorData && donorData.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {donorData.map((donor) => (
                  <DonorCard key={donor.id} donor={donor} />
                ))}
              </div>
            ) : (
              <div className="border rounded-3xl p-16 text-center backdrop-blur-sm shadow-inner transition-colors duration-300 bg-white border-slate-200 dark:bg-slate-900/40 dark:border-slate-800/80">
                <div className="mx-auto h-20 w-20 rounded-2xl flex items-center justify-center mb-6 transition-colors duration-300 bg-slate-50 border border-slate-100 dark:bg-slate-800/50 dark:border-transparent">
                  <Droplet
                    className="h-10 w-10 transition-colors duration-300 text-slate-400 dark:text-slate-600"
                    aria-hidden="true"
                  />
                </div>
                <h3 className="text-xl font-bold mb-2 transition-colors duration-300 text-slate-900 dark:text-white">
                  No Active Donors
                </h3>
                <p className="max-w-sm mx-auto transition-colors duration-300 text-slate-600 dark:text-slate-400">
                  This facility currently does not have any eligible donors
                  published in the public directory.
                </p>
              </div>
            )}
          </section>
        </div>
      </div>
    </>
  );
}
  