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
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-4">
        <Loader2
          className="h-10 w-10 animate-spin text-rose-500"
          aria-hidden="true"
        />
        <span className="text-sm font-medium tracking-widest text-slate-500 animate-pulse">
          RESOLVING PROFILE...
        </span>
      </div>
    );
  }

  // --- State: 404 / Inactive ---
  if (orgError || !org) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center px-4 text-center">
        <Helmet>
          <title>Organization Not Found | Bloodonate</title>
          <meta name="robots" content="noindex, nofollow" />
        </Helmet>
        <Building2
          className="h-20 w-20 text-slate-800 mb-6"
          aria-hidden="true"
        />
        <h1 className="text-2xl font-bold text-white mb-2">
          Organization Unavailable
        </h1>
        <p className="text-slate-400 max-w-md mb-8">
          The facility you are looking for does not exist, or their directory
          has been temporarily suspended.
        </p>
        <Link to="/search">
          <Button variant="outline" className="rounded-full gap-2">
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

      <div className="min-h-screen bg-slate-950 pb-24">
        {/* --- Dynamic Hero Banner --- */}
        <div className="relative h-75 md:h-100 w-full bg-slate-900 border-b border-slate-800 overflow-hidden animate-in fade-in duration-700">
          {optimizedBanner ? (
            <img
              src={optimizedBanner}
              alt={`${org.name} hospital facility banner`}
              fetchpriority="high" // Crucial for LCP Lighthouse Score
              className="w-full h-full object-cover opacity-50 scale-105"
            />
          ) : (
            <div className="absolute inset-0 bg-linear-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
              <Building2
                className="h-32 w-32 text-slate-950 opacity-50"
                aria-hidden="true"
              />
            </div>
          )}

          {/* Vignette Overlay */}
          <div className="absolute inset-0 bg-linear-to-t from-slate-950 via-slate-950/40 to-transparent" />
        </div>

        {/* --- Profile Header --- */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-20">
          <div className="flex flex-col md:flex-row md:items-end gap-5 md:gap-8 -mt-22 md:-mt-44 mb-8">
            {/* Institutional Logo Profile Picture */}
            <div className="relative shrink-0 animate-in zoom-in-90 duration-500 delay-100">
              {optimizedLogo ? (
                <img
                  src={optimizedLogo}
                  alt={`${org.name} official logo`}
                  className="w-20 h-20 md:w-40 md:h-40 rounded-2xl border-4 border-slate-950 bg-slate-900 object-cover shadow-2xl"
                />
              ) : (
                <div className="w-32 h-32 md:w-40 md:h-40 rounded-2xl border-4 border-slate-950 bg-slate-800 flex items-center justify-center shadow-2xl">
                  <Building2
                    className="w-12 h-12 md:w-16 md:h-16 text-slate-500"
                    aria-hidden="true"
                  />
                </div>
              )}
            </div>

            {/* Title & Badges */}
            <div className="animate-in slide-in-from-left-8 duration-700 delay-100 pb-2 md:pb-4 flex-1">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-3">
                Verified {org.org_type.replace("_", " ")}
              </div>
              <h1 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight mb-3">
                {org.name}
              </h1>
              <div className="flex flex-wrap items-center gap-4 text-slate-300 font-medium">
                <span className="flex items-center gap-1.5 bg-slate-900/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-700/50 shadow-sm">
                  <MapPin
                    className="h-4 w-4 text-rose-500"
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
            <section className="bg-slate-900/40 border border-slate-800/80 rounded-3xl p-8 backdrop-blur-xl shadow-2xl">
              <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                <Phone className="h-5 w-5 text-blue-500" aria-hidden="true" />{" "}
                Contact Details
              </h2>
              <address className="space-y-6 text-sm text-slate-300 not-italic">
                <div className="group">
                  <p className="text-xs text-slate-500 font-semibold uppercase mb-1">
                    Direct Line
                  </p>
                  <a
                    href={`tel:${org.contact_phone}`}
                    className="text-base text-slate-200 hover:text-blue-400 transition-colors font-medium"
                    aria-label={`Call ${org.contact_phone}`}
                  >
                    {org.contact_phone}
                  </a>
                </div>
                <div className="group">
                  <p className="text-xs text-slate-500 font-semibold uppercase mb-1">
                    Email
                  </p>
                  <a
                    href={`mailto:${org.contact_email}`}
                    className="text-base text-slate-200 hover:text-blue-400 transition-colors font-medium"
                    aria-label={`Email ${org.contact_email}`}
                  >
                    {org.contact_email}
                  </a>
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-semibold uppercase mb-1">
                    Physical Address
                  </p>
                  <p className="text-base text-slate-200 leading-relaxed">
                    {org.address_line}
                    <br />
                    {org.district_name}, {org.state_name}
                    <br />
                    {org.country_name}
                  </p>
                </div>
              </address>
            </section>

            <section className="bg-slate-900/40 border border-slate-800/80 rounded-3xl p-8 backdrop-blur-xl shadow-2xl">
              <h2 className="text-lg font-bold text-white mb-4">About Us</h2>
              <p className="text-base text-slate-400 leading-relaxed whitespace-pre-wrap">
                {org.description ||
                  "Committed to saving lives through secure, community-driven blood donation management."}
              </p>
            </section>
          </div>

          {/* Right Column: Embedded Donor Directory */}
          <section className="lg:col-span-2 animate-in fade-in slide-in-from-right-8 duration-700 delay-300">
            <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-800/50">
              <div>
                <h2 className="text-2xl font-extrabold text-white flex items-center gap-3">
                  <HeartPulse
                    className="h-7 w-7 text-rose-500"
                    aria-hidden="true"
                  />{" "}
                  Institutional Directory
                </h2>
                <p className="text-slate-400 mt-2 text-sm">
                  Actively managed and medically vetted donors registered at
                  this facility.
                </p>
              </div>
            </div>

            {donorsLoading ? (
              <div className="flex flex-col items-center justify-center h-64 gap-4 bg-slate-900/20 rounded-3xl border border-slate-800/30">
                <Loader2
                  className="h-8 w-8 animate-spin text-rose-500"
                  aria-hidden="true"
                />
                <p className="text-slate-500 font-medium">
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
              <div className="bg-slate-900/40 border border-slate-800/80 rounded-3xl p-16 text-center backdrop-blur-sm shadow-inner">
                <div className="mx-auto h-20 w-20 bg-slate-800/50 rounded-2xl flex items-center justify-center mb-6">
                  <Droplet
                    className="h-10 w-10 text-slate-600"
                    aria-hidden="true"
                  />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">
                  No Active Donors
                </h3>
                <p className="text-slate-400 max-w-sm mx-auto">
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
