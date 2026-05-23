import React from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { MapPin, Phone, Mail, Building2, Loader2, Droplet } from "lucide-react";
import api from "../../lib/axios";
import { DonorCard } from "../../components/donors/DonorCard";

export default function OrganizationProfile() {
  const { slug } = useParams();

  // 1. Fetch Hospital Details
  const { data: org, isLoading: orgLoading } = useQuery({
    queryKey: ["public-org", slug],
    queryFn: async () => {
      const res = await api.get(`/public/organizations/${slug}/`);
      return res.data;
    },
  });

  // 2. Fetch Donors ONLY belonging to this Hospital
  const { data: donorData, isLoading: donorsLoading } = useQuery({
    queryKey: ["org-donors", org?.id],
    queryFn: async () => {
      const res = await api.get(`/donors/search/?organization=${org.id}`);
      return res.data.results || res.data;
    },
    enabled: !!org?.id,
  });

  if (orgLoading)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-rose-500" />
      </div>
    );
  if (!org)
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-400">
        Organization not found or inactive.
      </div>
    );

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Hero Banner Section */}
      <div className="relative h-64 md:h-96 w-full bg-slate-900 border-b border-slate-800 overflow-hidden">
        {org.banner_image ? (
          <img
            src={org.banner_image}
            alt={org.name}
            className="w-full h-full object-cover opacity-60"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-linear-to-r from-slate-900 to-slate-800">
            <Building2 className="h-24 w-24 text-slate-800" />
          </div>
        )}
        <div className="absolute bottom-0 left-0 w-full bg-linear-to-t from-slate-950 to-transparent p-8">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-4xl font-bold text-white mb-2">{org.name}</h1>
            <div className="flex items-center gap-4 text-slate-300 text-sm">
              <span className="flex items-center gap-1">
                <MapPin className="h-4 w-4 text-rose-500" /> {org.district_name}
                , {org.state_name}
              </span>
              <span className="bg-rose-500/20 text-rose-400 px-2 py-0.5 rounded-md border border-rose-500/30">
                {org.org_type}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-12 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Details & Photos */}
        <div className="lg:col-span-1 space-y-8">
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm">
            <h3 className="text-lg font-bold text-white mb-4 border-b border-slate-800 pb-2">
              Contact Facility
            </h3>
            <div className="space-y-4 text-sm text-slate-300">
              <p className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-emerald-500" />{" "}
                {org.contact_phone}
              </p>
              <p className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-blue-500" /> {org.contact_email}
              </p>
              <p className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-rose-500 shrink-0" />{" "}
                <span>
                  {org.address_line}
                  <br />
                  {org.district_name}, {org.state_name}, {org.country_name}
                </span>
              </p>
            </div>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm">
            <h3 className="text-lg font-bold text-white mb-4 border-b border-slate-800 pb-2">
              About Us
            </h3>
            <p className="text-sm text-slate-400 leading-relaxed whitespace-pre-wrap">
              {org.description ||
                "Committed to saving lives through secure and managed blood donations."}
            </p>
          </div>

          {/* Photo Gallery Grid */}
          {(org.gallery_photo_1 || org.gallery_photo_2) && (
            <div className="grid grid-cols-2 gap-4">
              {org.gallery_photo_1 && (
                <img
                  src={org.gallery_photo_1}
                  alt="Gallery 1"
                  className="w-full h-32 object-cover rounded-xl border border-slate-800 shadow-lg"
                />
              )}
              {org.gallery_photo_2 && (
                <img
                  src={org.gallery_photo_2}
                  alt="Gallery 2"
                  className="w-full h-32 object-cover rounded-xl border border-slate-800 shadow-lg"
                />
              )}
            </div>
          )}
        </div>

        {/* Right Column: Local Donor Search */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <Droplet className="h-6 w-6 text-rose-500" /> Local Donor
              Directory
            </h2>
          </div>

          {donorsLoading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-rose-500" />
            </div>
          ) : donorData && donorData.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {donorData.map((donor) => (
                <DonorCard key={donor.id} donor={donor} />
              ))}
            </div>
          ) : (
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-12 text-center">
              <Droplet className="h-12 w-12 text-slate-700 mx-auto mb-4" />
              <p className="text-slate-400">
                No active donors currently registered at this facility.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
