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
} from "lucide-react";
import { Card } from "../ui/Card";
import { Badge } from "../ui/Badge";
import { toast } from "react-hot-toast";

/**
 * Public Donor Card
 * Displays anonymized donor information to the public. Contact routing is strictly
 * handled via the proxy healthcare organization to maintain HIPAA/privacy compliance.
 */
export function DonorCard({ donor }) {
  // Format the last donation date safely
  const formattedLastDonation = donor.last_donation_date
    ? new Date(donor.last_donation_date).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "First Time Donor";

  // --- Eligibility & Cooling Period Logic ---
  let daysLeft = 0;

  if (
    donor.last_donation_date &&
    !donor.is_available_now &&
    !donor.is_permanently_deferred
  ) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const lastDonation = new Date(donor.last_donation_date);
    lastDonation.setHours(0, 0, 0, 0);

    // Clinical Rule: Biological Males = 90 Days | Biological Females = 120 Days
    const waitDays = donor.gender === "M" ? 90 : 120;

    const nextEligible = new Date(lastDonation);
    nextEligible.setDate(nextEligible.getDate() + waitDays);

    const diffTime = nextEligible - today;
    daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  const handleCopyPhone = () => {
    navigator.clipboard.writeText(donor.organization_contact);
    toast.success("Phone number copied to clipboard!", { icon: "📋" });
  };

  return (
    <Card className="group relative border-slate-800/80 bg-slate-900/40 backdrop-blur-xl overflow-hidden hover:border-rose-500/50 hover:shadow-[0_8px_30px_rgb(225,29,72,0.1)] transition-all duration-500 hover:-translate-y-1 flex flex-col">
      {/* Ambient Hover Glow */}
      <div
        className="absolute -right-20 -top-20 h-40 w-40 rounded-full bg-rose-500/5 blur-[50px] group-hover:bg-rose-500/10 transition-colors duration-500 pointer-events-none"
        aria-hidden="true"
      />

      <div className="p-6 flex-1 flex flex-col relative z-10">
        {/* Header: Identity & Blood Group */}
        <div className="flex justify-between items-start mb-5 gap-4">
          <div>
            <h3 className="text-xl font-bold text-white tracking-tight mb-1">
              {donor.anonymous_label}
            </h3>
            <div className="flex flex-wrap items-center gap-2.5 text-xs font-medium text-slate-400">
              <span className="capitalize tracking-wider text-slate-500">
                {donor.gender === "M"
                  ? "Male"
                  : donor.gender === "F"
                    ? "Female"
                    : "Other"}
              </span>
              <span className="opacity-50">•</span>
              <span className="flex items-center gap-1 text-slate-300">
                <MapPin className="h-3.5 w-3.5 text-rose-500/70" />
                {donor.district_name}, {donor.state_name}
              </span>
            </div>
          </div>

          <div className="flex flex-col items-end shrink-0">
            <div className="h-14 w-14 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex flex-col items-center justify-center shadow-inner group-hover:scale-105 transition-transform duration-300">
              <span className="font-black text-rose-500 text-xl tracking-tighter leading-none">
                {donor.blood_group}
              </span>
              <Droplet className="h-3 w-3 text-rose-500/50 mt-0.5" />
            </div>
          </div>
        </div>

        {/* Status Badges */}
        <div className="flex flex-wrap gap-2 mb-6">
          {donor.is_permanently_deferred ? (
            <Badge
              variant="danger"
              className="bg-rose-500/10 text-rose-400 border-rose-500/20 gap-1.5 px-2.5 py-1"
            >
              <Ban className="h-3.5 w-3.5" /> Permanently Deferred
            </Badge>
          ) : donor.is_available_now ? (
            <Badge
              variant="success"
              className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 gap-1.5 px-2.5 py-1"
            >
              <ShieldCheck className="h-3.5 w-3.5" /> Eligible Now
            </Badge>
          ) : (
            <Badge
              variant="warning"
              className="bg-amber-500/10 text-amber-400 border-amber-500/20 gap-1.5 px-2.5 py-1"
            >
              <CalendarClock className="h-3.5 w-3.5" />
              {daysLeft > 0
                ? `Resting (${daysLeft} Days Left)`
                : "Review Required"}
            </Badge>
          )}

          <Badge
            variant="outline"
            className="border-slate-700/80 text-slate-400 bg-slate-950/50 px-2.5 py-1 font-mono tracking-tight"
          >
            Last: {formattedLastDonation}
          </Badge>
        </div>

        <div className="mt-auto">
          {/* Privacy Section: Organization Proxy Details */}
          <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800/80 shadow-inner group-hover:border-slate-700 transition-colors">
            <div className="flex items-start gap-3 mb-4">
              <div className="p-1.5 rounded-lg bg-slate-800/50 border border-slate-700/50 shrink-0">
                <Building2 className="h-4 w-4 text-slate-400" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-0.5">
                  Managed & Verified By
                </p>
                <p className="text-sm font-semibold text-slate-200 leading-tight">
                  {donor.organization_name}
                </p>
              </div>
            </div>

            <div className="flex gap-3 mt-4 pt-3 border-t border-slate-800/50">
              <a
                href={`tel:${donor.organization_contact}`}
                className="w-full flex md:hidden items-center justify-center gap-2 bg-rose-600 hover:bg-rose-500 text-white py-2.5 rounded-lg text-sm font-bold transition-all shadow-md"
              >
                <Phone className="h-4 w-4" />
                Call Facility
              </a>
              <button
                onClick={handleCopyPhone}
                className="w-full hidden md:flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-white py-2.5 rounded-lg text-sm font-bold transition-all shadow-md border border-slate-700 hover:border-slate-600"
              >
                <Copy className="h-4 w-4 text-slate-400" />
                Copy Contact Number
              </button>
            </div>
          </div>

          <p className="text-[10px] font-medium text-slate-500 text-center mt-3 leading-relaxed px-2">
            For privacy compliance, you will be connected directly to the
            managing healthcare facility to request this specific unit.
          </p>
        </div>
      </div>
    </Card>
  );
}
