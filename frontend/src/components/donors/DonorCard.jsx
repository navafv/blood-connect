import React from "react";
import {
  Phone,
  MapPin,
  Building2,
  CalendarClock,
  ShieldCheck,
} from "lucide-react";
import { Card } from "../ui/Card";
import { Badge } from "../ui/Badge";

export function DonorCard({ donor }) {
  // Format the last donation date safely
  const formattedLastDonation = donor.last_donation_date
    ? new Date(donor.last_donation_date).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "First Time Donor";

  return (
    <Card className="border-slate-800 bg-slate-900/60 backdrop-blur-md overflow-hidden hover:border-rose-500/50 transition-colors duration-300">
      <div className="p-6">
        {/* Header: Name & Blood Group */}
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-lg font-bold text-white mb-1">
              {donor.full_name}
            </h3>
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <span className="capitalize">
                {donor.gender === "M"
                  ? "Male"
                  : donor.gender === "F"
                    ? "Female"
                    : "Other"}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {donor.district_name}, {donor.state_name}
              </span>
            </div>
          </div>

          <div className="flex flex-col items-end gap-2">
            <div className="h-12 w-12 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center font-bold text-rose-500 text-lg shadow-[0_0_15px_rgba(225,29,72,0.15)]">
              {donor.blood_group}
            </div>
          </div>
        </div>

        {/* Status Badges */}
        <div className="flex flex-wrap gap-2 mb-6">
          {donor.is_available_now ? (
            <Badge
              variant="success"
              className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 gap-1"
            >
              <ShieldCheck className="h-3 w-3" /> Eligible to Donate
            </Badge>
          ) : (
            <Badge
              variant="warning"
              className="bg-amber-500/10 text-amber-400 border-amber-500/20 gap-1"
            >
              <CalendarClock className="h-3 w-3" /> Cooling Period
            </Badge>
          )}

          <Badge
            variant="outline"
            className="border-slate-700 text-slate-300 bg-slate-800/50"
          >
            Last Donated: {formattedLastDonation}
          </Badge>
        </div>

        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
          <div className="flex items-start gap-3">
            <Building2 className="h-5 w-5 text-slate-500 mt-0.5 shrink-0" />
            <div>
              <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-0.5">
                Managed By
              </p>
              <p className="text-sm text-slate-300 font-medium">
                {donor.organization_name}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-3 border-t border-slate-800/50">
            <a
              href={`tel:${donor.organization_contact}`}
              className="flex-1 flex items-center justify-center gap-2 bg-rose-500 hover:bg-rose-600 text-white py-2.5 rounded-lg text-sm font-medium transition-colors"
            >
              <Phone className="h-4 w-4" />
              Contact Facility
            </a>
          </div>
        </div>

        <p className="text-[10px] text-slate-500 text-center mt-3">
          For donor privacy, you will be connected directly to the managing
          healthcare facility to request this blood unit.
        </p>
      </div>
    </Card>
  );
}
