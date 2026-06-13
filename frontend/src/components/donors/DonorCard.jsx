import React from "react";
import {
  Phone,
  Copy,
  MapPin,
  Building2,
  CalendarClock,
  ShieldCheck,
  Ban,
  Droplet,
  MessageCircle,
} from "lucide-react";
import { Card } from "../ui/Card";
import { Badge } from "../ui/Badge";
import { toast } from "react-hot-toast";

export function DonorCard({ donor, viewMode = "list" }) {
  const handleCopyPhone = () => {
    navigator.clipboard.writeText(donor.organization_contact);
    toast.success("Facility number copied!", { icon: "📋" });
  };

  // WhatsApp formatting
  const cleanPhone = donor.organization_contact?.replace(/[^0-9]/g, "");
  const waMessage = encodeURIComponent(
    `Urgent query regarding the ${donor.blood_group} donor listed on Bloodonate.`,
  );

  // Status rendering based purely on backend flags
  const renderStatusBadge = () => {
    if (donor.is_available_now) {
      return (
        <Badge
          variant="success"
          className="gap-1.5 px-3 py-1.5 font-bold shadow-sm"
        >
          <ShieldCheck className="h-4 w-4" /> Eligible Now
        </Badge>
      );
    }
    return (
      <Badge
        variant="warning"
        className="gap-1.5 px-3 py-1.5 font-bold shadow-sm"
      >
        <CalendarClock className="h-4 w-4" /> Currently Resting
      </Badge>
    );
  };

  // ==========================================================================
  // LIST VIEW LAYOUT
  // ==========================================================================
  if (viewMode === "list") {
    return (
      <Card className="group relative bg-white/80 border-slate-200 backdrop-blur-xl overflow-hidden hover:border-rose-300 hover:shadow-lg transition-all duration-300 flex flex-col dark:bg-slate-900/60 dark:border-slate-800 dark:hover:border-rose-500/50">
        <div className="p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 lg:gap-6 relative z-10">
          {/* Section 1: Blood Group & Identity */}
          <div className="flex items-center gap-4 lg:w-1/4 shrink-0">
            <div className="h-14 w-14 rounded-2xl bg-rose-50 border border-rose-100 flex flex-col items-center justify-center shadow-inner transition-colors dark:bg-rose-500/10 dark:border-rose-500/20">
              <span className="font-black text-rose-600 text-xl tracking-tighter leading-none dark:text-rose-500">
                {donor.blood_group}
              </span>
            </div>
            <div className="flex flex-col">
              <h3 className="text-lg font-bold text-slate-900 tracking-tight leading-tight transition-colors dark:text-white">
                {donor.anonymous_label}
              </h3>
              <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500 mt-1 dark:text-slate-400">
                <span className="capitalize">
                  {donor.gender === "M"
                    ? "Male"
                    : donor.gender === "F"
                      ? "Female"
                      : "Other"}
                </span>
                <span className="opacity-50">•</span>
                <span className="flex items-center gap-1">
                  <MapPin className="h-3 w-3 text-rose-500/70" />
                  {donor.district_name}, {donor.state_name}
                </span>
              </div>
            </div>
          </div>

          {/* Section 2: Status */}
          <div className="flex items-center justify-start lg:justify-center lg:w-1/4">
            {renderStatusBadge()}
          </div>

          {/* Section 3: Organization Data */}
          <div className="flex items-center gap-3 lg:w-1/4 px-4 py-2 lg:py-0 border-l-2 border-slate-100 transition-colors dark:border-slate-800">
            <div className="p-2 rounded-xl bg-white border border-slate-200 shrink-0 transition-colors dark:bg-slate-800 dark:border-slate-700">
              <Building2 className="h-5 w-5 text-slate-400" />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                Verified By
              </span>
              <span className="text-sm font-bold text-slate-900 leading-tight transition-colors dark:text-slate-200">
                {donor.organization_name}
              </span>
            </div>
          </div>

          {/* Section 4: Fast Actions */}
          <div className="flex items-center gap-2 w-full lg:w-auto lg:ml-auto border-t lg:border-t-0 pt-4 lg:pt-0 border-slate-100 dark:border-slate-800">
            <a
              href={`https://wa.me/${cleanPhone}?text=${waMessage}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 lg:flex-none flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-all shadow-md hover:-translate-y-0.5"
            >
              <MessageCircle className="h-4 w-4" />
              WhatsApp
            </a>
            <a
              href={`tel:${donor.organization_contact}`}
              className="flex-1 lg:flex-none flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-all shadow-md hover:-translate-y-0.5"
            >
              <Phone className="h-4 w-4" />
              Call
            </a>
          </div>
        </div>
      </Card>
    );
  }

  // ==========================================================================
  // GRID VIEW LAYOUT
  // ==========================================================================
  return (
    <Card className="group relative bg-white/80 border-slate-200 backdrop-blur-xl overflow-hidden hover:border-rose-300 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 flex flex-col dark:bg-slate-900/60 dark:border-slate-800 dark:hover:border-rose-500/50">
      <div className="p-6 flex-1 flex flex-col relative z-10">
        <div className="flex justify-between items-start mb-5 gap-4">
          <div>
            <h3 className="text-xl font-bold text-slate-900 tracking-tight mb-1 transition-colors dark:text-white">
              {donor.anonymous_label}
            </h3>
            <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
              <span className="capitalize">
                {donor.gender === "M"
                  ? "Male"
                  : donor.gender === "F"
                    ? "Female"
                    : "Other"}
              </span>
              <span className="opacity-50">•</span>
              <span className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5 text-rose-500/70" />
                {donor.district_name}, {donor.state_name}
              </span>
            </div>
          </div>

          <div className="h-14 w-14 rounded-2xl bg-rose-50 border border-rose-100 flex flex-col items-center justify-center shadow-inner group-hover:scale-110 transition-all duration-300 dark:bg-rose-500/10 dark:border-rose-500/20">
            <span className="font-black text-rose-600 text-xl tracking-tighter leading-none dark:text-rose-500">
              {donor.blood_group}
            </span>
          </div>
        </div>

        <div className="mb-6">{renderStatusBadge()}</div>

        <div className="mt-auto">
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 transition-colors dark:bg-slate-950/60 dark:border-slate-800">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-xl bg-white border border-slate-200 dark:bg-slate-800 dark:border-slate-700">
                <Building2 className="h-4 w-4 text-slate-400" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-0.5">
                  Verified By
                </p>
                <p className="text-sm font-bold text-slate-900 leading-tight truncate transition-colors dark:text-slate-200">
                  {donor.organization_name}
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-2 pt-2">
              <a
                href={`https://wa.me/${cleanPhone}?text=${waMessage}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white py-3 rounded-xl text-sm font-bold transition-all shadow-md hover:-translate-y-0.5"
              >
                <MessageCircle className="h-4 w-4" /> WhatsApp Facility
              </a>
              <div className="flex gap-2">
                <a
                  href={`tel:${donor.organization_contact}`}
                  className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-xl text-sm font-bold transition-all shadow-md hover:-translate-y-0.5"
                >
                  <Phone className="h-4 w-4" /> Call
                </a>
                <button
                  onClick={handleCopyPhone}
                  className="flex-1 flex items-center justify-center gap-2 bg-white hover:bg-slate-50 text-slate-700 py-3 rounded-xl text-sm font-bold transition-all shadow-sm border border-slate-200 dark:bg-slate-800 dark:text-white dark:border-slate-700"
                >
                  <Copy className="h-4 w-4 text-slate-400" /> Copy
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
