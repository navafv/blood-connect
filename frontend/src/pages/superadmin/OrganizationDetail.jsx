import React from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  ArrowLeft,
  Building2,
  Mail,
  Phone,
  MapPin,
  ShieldCheck,
  Ban,
  Clock,
  Users,
  Activity,
  Loader2,
  ServerCrash,
  MessageCircle,
  UserCheck, // <-- [NEW] Icon for Impersonation
} from "lucide-react";
import { Helmet } from "react-helmet-async";
import toast from "react-hot-toast"; // <-- Ensure toast is imported

import { Card } from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import api from "../../lib/axios";

export default function OrganizationDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const {
    data: org,
    isLoading: isOrgLoading,
    isError: isOrgError,
  } = useQuery({
    queryKey: ["superadmin-org-detail", id],
    queryFn: async () => {
      const res = await api.get(`/superadmin/organizations/${id}/`);
      return res.data;
    },
  });

  const { data: donorsResponse, isLoading: isDonorsLoading } = useQuery({
    queryKey: ["superadmin-org-donors", id],
    queryFn: async () => {
      const res = await api.get(`/superadmin/organizations/${id}/donors/`);
      return res.data;
    },
    enabled: !!org,
  });

  // --- [NEW] Impersonation Mutation ---
  const impersonateMutation = useMutation({
    mutationFn: async () => {
      return api.post(`/superadmin/organizations/${id}/impersonate/`);
    },
    onSuccess: () => {
      toast.success("Impersonation successful. Switching context...");
      // Hard refresh is necessary here to wipe React Query cache and global context state,
      // forcing the frontend to reboot recognizing the new JWT cookie role.
      window.location.href = "/admin/dashboard";
    },
    onError: (err) => {
      toast.error(err.response?.data?.error || "Failed to impersonate tenant.");
    },
  });

  const donors = donorsResponse?.results || donorsResponse || [];

  const formatDate = (dateString) => {
    if (!dateString) return "Never";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (isOrgLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950">
        <Loader2 className="h-10 w-10 animate-spin text-rose-600 dark:text-rose-500 mb-4" />
        <p className="text-sm font-bold uppercase tracking-widest text-slate-500">
          Loading Organization Data...
        </p>
      </div>
    );
  }

  if (isOrgError || !org) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 text-center px-4">
        <div className="h-20 w-20 bg-rose-50 border border-rose-200 rounded-2xl flex items-center justify-center mb-6 dark:bg-rose-500/10 dark:border-rose-500/20">
          <ServerCrash className="h-10 w-10 text-rose-600 dark:text-rose-500" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
          Data Retrieval Failed
        </h2>
        <p className="text-slate-600 dark:text-slate-400 mb-6">
          Could not locate the requested organization. It may have been removed.
        </p>
        <Button onClick={() => navigate(-1)} variant="outline">
          <ArrowLeft className="h-4 w-4 mr-2" /> Go Back
        </Button>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 pb-24 bg-slate-50 dark:bg-slate-950">
      <Helmet>
        <title>{org.name} | SuperAdmin Console</title>
      </Helmet>

      {/* --- Breadcrumb & Actions --- */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-2 border-b border-slate-200 dark:border-slate-800 pb-4">
        <button
          onClick={() => navigate("/superadmin/organizations")}
          className="flex items-center text-sm font-semibold text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Organizations
        </button>

        <Button
          variant="outline"
          onClick={() => {
            if (
              window.confirm(
                `Are you sure you want to securely impersonate ${org.name}? Your current session will be temporarily replaced.`,
              )
            ) {
              impersonateMutation.mutate();
            }
          }}
          disabled={impersonateMutation.isPending}
          className="bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100 dark:bg-purple-500/10 dark:text-purple-400 dark:border-purple-500/30 shadow-sm transition-colors"
        >
          {impersonateMutation.isPending ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <UserCheck className="h-4 w-4 mr-2" />
          )}
          Impersonate Tenant
        </Button>
      </div>

      {/* --- Header Identity Card --- */}
      <Card className="overflow-hidden backdrop-blur-xl shadow-md bg-white/80 border-slate-200 dark:bg-slate-900/60 dark:border-slate-800/80">
        <div className="p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center gap-6">
          <div className="h-24 w-24 rounded-2xl border flex items-center justify-center font-bold text-2xl uppercase shadow-inner overflow-hidden shrink-0 bg-slate-100 border-slate-200 text-slate-500 dark:bg-slate-800/80 dark:border-slate-700 dark:text-slate-400">
            {org.logo ? (
              <img
                src={org.logo}
                alt={org.name}
                className="h-full w-full object-cover"
              />
            ) : (
              org.name.substring(0, 2)
            )}
          </div>
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-3 mb-2">
              <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                {org.name}
              </h1>
              <Badge
                variant="outline"
                className="uppercase tracking-widest text-[10px]"
              >
                {org.org_type.replace("_", " ")}
              </Badge>
              {org.status === "ACTIVE" ? (
                <Badge
                  variant="success"
                  className="uppercase tracking-widest text-[10px] bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400"
                >
                  <ShieldCheck className="h-3 w-3 mr-1" /> Active Tenant
                </Badge>
              ) : (
                <Badge
                  variant="danger"
                  className="uppercase tracking-widest text-[10px]"
                >
                  <Ban className="h-3 w-3 mr-1" /> Suspended
                </Badge>
              )}
            </div>
            <p className="text-sm font-medium flex items-center gap-2 text-slate-500 dark:text-slate-400">
              <Activity className="h-4 w-4" /> Registered on{" "}
              {formatDate(org.created_at)}
            </p>
          </div>
        </div>
      </Card>

      {/* --- Intelligence Grid --- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="backdrop-blur-xl shadow-sm bg-white/80 border-slate-200 dark:bg-slate-900/60 dark:border-slate-800/80">
          <div className="p-6">
            <h3 className="text-xs font-bold uppercase tracking-widest mb-4 text-slate-500 dark:text-slate-400">
              Contact Intelligence
            </h3>
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-slate-700 dark:text-slate-300">
                <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800/80 shrink-0">
                  <Mail className="h-4 w-4 text-slate-500" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    Email Address
                  </p>
                  <p className="text-sm font-medium truncate">
                    {org.contact_email}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 text-slate-700 dark:text-slate-300">
                <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800/80 shrink-0">
                  <Phone className="h-4 w-4 text-slate-500" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    Phone Number
                  </p>
                  <p className="text-sm font-medium font-mono truncate">
                    {org.contact_phone}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </Card>

        <Card className="backdrop-blur-xl shadow-sm bg-white/80 border-slate-200 dark:bg-slate-900/60 dark:border-slate-800/80">
          <div className="p-6">
            <h3 className="text-xs font-bold uppercase tracking-widest mb-4 text-slate-500 dark:text-slate-400">
              Geographic Region
            </h3>
            <div className="flex items-start gap-3 text-slate-700 dark:text-slate-300">
              <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800/80 shrink-0">
                <MapPin className="h-4 w-4 text-slate-500" />
              </div>
              <div>
                <p className="text-sm font-bold leading-tight">
                  {org.district_name}
                </p>
                <p className="text-xs mt-1">
                  {org.state_name}, {org.country_name}
                </p>
                <p className="text-xs mt-2 text-slate-500 dark:text-slate-400 leading-relaxed">
                  {org.address_line}
                </p>
              </div>
            </div>
          </div>
        </Card>

        <Card className="backdrop-blur-xl shadow-sm bg-white/80 border-slate-200 dark:bg-slate-900/60 dark:border-slate-800/80">
          <div className="p-6 h-full flex flex-col justify-between">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-widest mb-4 text-slate-500 dark:text-slate-400">
                Billing & License
              </h3>
              <div className="flex items-start gap-3 text-slate-700 dark:text-slate-300">
                <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800/80 shrink-0">
                  <Clock className="h-4 w-4 text-slate-500" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    Expiration Date
                  </p>
                  <p className="text-sm font-bold leading-tight mt-0.5">
                    {formatDate(org.subscription_expires_at)}
                  </p>
                </div>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                SaaS Status
              </span>
              {org.has_active_subscription ? (
                <Badge variant="success" className="text-[10px] px-2 py-0.5">
                  Valid License
                </Badge>
              ) : (
                <Badge variant="danger" className="text-[10px] px-2 py-0.5">
                  Expired
                </Badge>
              )}
            </div>
          </div>
        </Card>
      </div>

      <div className="pt-6">
        <div className="flex items-center justify-between mb-4 px-2">
          <h2 className="text-lg font-bold flex items-center gap-2 text-slate-900 dark:text-white">
            <Users className="h-5 w-5 text-rose-600 dark:text-rose-500" />{" "}
            Registered Donor Base
          </h2>
          <Badge variant="outline" className="font-mono">
            {donors.length} Total
          </Badge>
        </div>

        <Card className="overflow-hidden backdrop-blur-xl shadow-xl bg-white/80 border-slate-200 dark:bg-slate-900/60 dark:border-slate-800/80">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-700 dark:text-slate-300">
              <thead className="text-xs uppercase font-bold border-b bg-slate-50 text-slate-500 border-slate-200 dark:bg-slate-950/40 dark:border-slate-800/80">
                <tr>
                  <th className="px-6 py-5">Blood Group</th>
                  <th className="px-6 py-5">Name</th>
                  <th className="px-6 py-5">Contact</th>
                  <th className="px-6 py-5">Gender</th>
                  <th className="px-6 py-5">Last Donation</th>
                  <th className="px-6 py-5 text-right">Eligibility</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800/50">
                {isDonorsLoading ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-24 text-center">
                      <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-rose-600 dark:text-rose-500" />
                      <p className="text-sm font-medium tracking-widest uppercase text-slate-500 dark:text-slate-400">
                        Extracting Registry...
                      </p>
                    </td>
                  </tr>
                ) : donors.length === 0 ? (
                  <tr>
                    <td
                      colSpan="6"
                      className="px-6 py-24 text-center animate-in fade-in duration-500"
                    >
                      <div className="h-20 w-20 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-inner border bg-slate-50 border-slate-200 dark:bg-slate-800/50 dark:border-slate-700">
                        <Users className="h-10 w-10 text-slate-400 dark:text-slate-500" />
                      </div>
                      <h3 className="text-xl font-bold mb-2 tracking-tight text-slate-900 dark:text-white">
                        Registry Empty
                      </h3>
                      <p className="max-w-sm mx-auto leading-relaxed text-sm text-slate-600 dark:text-slate-400">
                        This organization has not yet added any donors to their
                        private database.
                      </p>
                    </td>
                  </tr>
                ) : (
                  donors.map((donor) => (
                    <tr
                      key={donor.id}
                      className="transition-colors group hover:bg-slate-50 dark:hover:bg-slate-800/30"
                    >
                      <td className="px-6 py-4">
                        <div className="h-10 w-10 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center font-black text-rose-600 shadow-inner dark:bg-rose-500/10 dark:border-rose-500/20 dark:text-rose-500">
                          {donor.blood_group}
                        </div>
                      </td>
                      <td className="px-6 py-4 font-bold text-slate-900 dark:text-white">
                        {donor.full_name}
                      </td>
                      <td className="px-6 py-4 font-medium text-slate-600 dark:text-slate-400">
                        {donor.phone_number}
                      </td>
                      <td className="px-6 py-4 font-medium text-slate-600 dark:text-slate-400 capitalize">
                        {donor.gender === "M"
                          ? "Male"
                          : donor.gender === "F"
                            ? "Female"
                            : "Other"}
                      </td>
                      <td className="px-6 py-4 font-mono text-xs font-medium text-slate-500 dark:text-slate-400">
                        {formatDate(donor.last_donation_date)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        {donor.is_available_now ? (
                          <Badge
                            variant="success"
                            className="px-3 py-1 font-bold"
                          >
                            Available
                          </Badge>
                        ) : (
                          <Badge
                            variant="warning"
                            className="px-3 py-1 font-bold"
                          >
                            Resting
                          </Badge>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}
