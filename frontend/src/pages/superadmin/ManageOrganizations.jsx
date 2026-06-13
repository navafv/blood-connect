import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Building2,
  Search,
  CheckCircle2,
  XCircle,
  Loader2,
  CreditCard,
  Clock,
  ShieldCheck,
  Ban,
  SearchX,
  ServerCrash,
  RefreshCw,
  MailWarning,
  MailCheck,
  Eye,
  Users,
  MapPin,
  Mail,
  Phone,
  FileText,
  Activity,
} from "lucide-react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";

import { Card } from "../../components/ui/Card";
import { Input } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";
import { Badge } from "../../components/ui/Badge";
import { Select } from "../../components/ui/Select";
import { Modal } from "../../components/ui/Modal";
import api from "../../lib/axios";

export default function ManageOrganizations() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // --- UI Transition State ---
  const [searchTerm, setSearchTerm] = useState("");
  const [isManageModalOpen, setIsManageModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("overview"); // 'overview' | 'donors'
  const [selectedOrg, setSelectedOrg] = useState(null);
  const [extendYears, setExtendYears] = useState("1");

  // --- Query Pipeline: Fetch Organizations ---
  const {
    data: organizations = [],
    isLoading: isOrgsLoading,
    isError: isOrgsError,
    refetch: refetchOrgs,
  } = useQuery({
    queryKey: ["superadmin-organizations"],
    queryFn: async () => {
      const res = await api.get("/superadmin/organizations/");
      return res.data.results || res.data;
    },
  });

  // --- Query Pipeline: Fetch Global Payments ---
  const {
    data: payments = [],
    isLoading: isPaymentsLoading,
    isError: isPaymentsError,
    refetch: refetchPayments,
  } = useQuery({
    queryKey: ["superadmin-payments"],
    queryFn: async () => {
      const res = await api.get("/superadmin/payments/");
      return res.data.results || res.data;
    },
  });

  // --- Query Pipeline: Fetch Specific Org Donors ---
  const { data: orgDonors = [], isLoading: isDonorsLoading } = useQuery({
    queryKey: ["superadmin-org-donors", selectedOrg?.id],
    queryFn: async () => {
      const res = await api.get(
        `/superadmin/organizations/${selectedOrg.id}/donors/`,
      );
      return res.data.results || res.data;
    },
    enabled: !!selectedOrg && isDetailModalOpen && activeTab === "donors",
  });

  // --- Mutation Pipelines ---
  const verifyPaymentMutation = useMutation({
    mutationFn: async ({ paymentId, action }) =>
      api.post(`/superadmin/payments/${paymentId}/verify/`, { action }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["superadmin-organizations"] });
      queryClient.invalidateQueries({ queryKey: ["superadmin-payments"] });
      setIsManageModalOpen(false);

      if (variables.action === "APPROVE") {
        toast.success("Payment verified. Subscription extended.");
      } else {
        toast.error("Payment rejected. Tenant notified.");
      }
    },
    onError: (err) => {
      toast.error(
        err.response?.data?.error || "Failed to process payment verification.",
      );
    },
  });

  const extendSubscriptionMutation = useMutation({
    mutationFn: async () =>
      api.post(
        `/superadmin/organizations/${selectedOrg.id}/extend-subscription/`,
        { years: extendYears },
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["superadmin-organizations"] });
      setIsManageModalOpen(false);
      toast.success("Subscription forcefully extended.");
    },
    onError: (err) => {
      toast.error(
        err.response?.data?.error || "Failed to extend subscription.",
      );
    },
  });

  const toggleOrgStatusMutation = useMutation({
    mutationFn: async ({ orgId, currentStatus }) => {
      const newStatus = currentStatus === "ACTIVE" ? "SUSPENDED" : "ACTIVE";
      return api.patch(`/superadmin/organizations/${orgId}/status/`, {
        status: newStatus,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["superadmin-organizations"] });
      toast.success("Organization access updated.");
    },
    onError: (err) => {
      toast.error(
        err.response?.data?.error || "Failed to update organization status.",
      );
    },
  });

  // --- Action Handlers & Formatters ---
  const openManageModal = (org) => {
    setSelectedOrg(org);
    setExtendYears("1");
    setIsManageModalOpen(true);
  };

  const openDetailModal = (org) => {
    setSelectedOrg(org);
    setActiveTab("overview");
    setIsDetailModalOpen(true);
  };

  const getPendingPayment = (orgId) => {
    return payments.find(
      (p) => p.organization === orgId && p.status === "PENDING",
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Never";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // --- Client-Side Search Engine ---
  const filteredOrgs = organizations.filter(
    (org) =>
      org.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      org.contact_email.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 pb-24 transition-colors duration-300 bg-slate-50 dark:bg-slate-950">
      {/* --- Workspace Header --- */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b pb-6 transition-colors duration-300 border-slate-200 dark:border-slate-800/80">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-3 transition-colors duration-300 text-slate-900 dark:text-white">
            <div className="p-1.5 rounded-lg border transition-colors duration-300 bg-rose-50 border-rose-200 dark:bg-rose-500/10 dark:border-rose-500/20">
              <Building2 className="h-5 w-5 transition-colors duration-300 text-rose-600 dark:text-rose-500" />
            </div>
            Registered Organizations
          </h1>
          <p className="text-sm mt-2 transition-colors duration-300 text-slate-600 dark:text-slate-400">
            Manage tenant access, verify UPI payments, and enforce global
            subscription states.
          </p>
        </div>
      </div>

      {/* --- Search Toolbar --- */}
      <div className="flex items-center backdrop-blur-md p-5 rounded-2xl border shadow-sm transition-colors duration-300 bg-white/80 border-slate-200 dark:bg-slate-900/40 dark:border-slate-800/60">
        <div className="relative w-full max-w-lg group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 transition-colors duration-300 text-slate-400 group-focus-within:text-rose-600 dark:text-slate-500 dark:group-focus-within:text-rose-500" />
          <Input
            placeholder="Search directory by facility name or email..."
            className="pl-11 h-11 transition-all duration-300 focus:ring-rose-500/20 bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 dark:bg-slate-950/50 dark:border-slate-700 dark:text-white dark:placeholder:text-slate-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* --- Primary Data Table Area --- */}
      <Card className="overflow-hidden backdrop-blur-xl shadow-xl dark:shadow-2xl transition-colors duration-300 bg-white/80 border-slate-200 dark:bg-slate-900/60 dark:border-slate-800/80">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm transition-colors duration-300 text-slate-700 dark:text-slate-300">
            <thead className="text-xs uppercase font-bold border-b transition-colors duration-300 bg-slate-50 text-slate-500 border-slate-200 dark:bg-slate-950/40 dark:border-slate-800/80">
              <tr>
                <th className="px-6 py-5">Organization Details</th>
                <th className="px-6 py-5">Location</th>
                <th className="px-6 py-5">Platform Access</th>
                <th className="px-6 py-5">Subscription</th>
                <th className="px-6 py-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y transition-colors duration-300 divide-slate-200 dark:divide-slate-800/50">
              {isOrgsLoading || isPaymentsLoading ? (
                <tr>
                  <td colSpan="5" className="px-6 py-24 text-center">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 transition-colors duration-300 text-rose-600 dark:text-rose-500" />
                    <p className="text-sm font-medium tracking-widest uppercase transition-colors duration-300 text-slate-500 dark:text-slate-400">
                      Loading Tenants...
                    </p>
                  </td>
                </tr>
              ) : isOrgsError || isPaymentsError ? (
                <tr>
                  <td
                    colSpan="5"
                    className="px-6 py-24 text-center animate-in fade-in duration-500"
                  >
                    <div className="h-20 w-20 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-inner border transition-colors duration-300 bg-rose-50 border-rose-200 dark:bg-rose-500/10 dark:border-rose-500/20">
                      <ServerCrash className="h-10 w-10 transition-colors duration-300 text-rose-600 dark:text-rose-500" />
                    </div>
                    <h3 className="text-xl font-bold mb-2 tracking-tight transition-colors duration-300 text-slate-900 dark:text-white">
                      Telemetry Failure
                    </h3>
                    <p className="max-w-sm mx-auto leading-relaxed text-sm mb-6 transition-colors duration-300 text-slate-600 dark:text-slate-400">
                      Unable to synchronize organization data with the secure
                      ledger.
                    </p>
                    <Button
                      variant="outline"
                      className="transition-colors duration-300 bg-white border-slate-200 text-slate-700 hover:bg-slate-50 dark:bg-slate-900/50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                      onClick={() => {
                        refetchOrgs();
                        refetchPayments();
                      }}
                    >
                      <RefreshCw className="h-4 w-4 mr-2" /> Retry Connection
                    </Button>
                  </td>
                </tr>
              ) : organizations.length === 0 ? (
                <tr>
                  <td
                    colSpan="5"
                    className="px-6 py-24 text-center animate-in fade-in duration-500"
                  >
                    <div className="h-20 w-20 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-inner border transition-colors duration-300 bg-slate-50 border-slate-200 dark:bg-slate-800/50 dark:border-slate-700">
                      <Building2 className="h-10 w-10 transition-colors duration-300 text-slate-400 dark:text-slate-500" />
                    </div>
                    <h3 className="text-xl font-bold mb-2 tracking-tight transition-colors duration-300 text-slate-900 dark:text-white">
                      No Organizations
                    </h3>
                    <p className="max-w-sm mx-auto leading-relaxed text-sm transition-colors duration-300 text-slate-600 dark:text-slate-400">
                      There are currently no active or pending organizations on
                      the platform.
                    </p>
                  </td>
                </tr>
              ) : filteredOrgs.length === 0 ? (
                <tr>
                  <td
                    colSpan="5"
                    className="px-6 py-24 text-center animate-in fade-in duration-300"
                  >
                    <SearchX className="h-12 w-12 mb-4 mx-auto transition-colors duration-300 text-slate-400 dark:text-slate-600" />
                    <h3 className="text-lg font-bold mb-2 transition-colors duration-300 text-slate-900 dark:text-white">
                      No Matches Found
                    </h3>
                    <p className="text-sm max-w-sm mx-auto transition-colors duration-300 text-slate-600 dark:text-slate-400">
                      No tenant organizations match the query:{" "}
                      <strong className="transition-colors duration-300 text-slate-900 dark:text-slate-300">
                        "{searchTerm}"
                      </strong>
                    </p>
                  </td>
                </tr>
              ) : (
                filteredOrgs.map((org) => {
                  const pendingPayment = getPendingPayment(org.id);

                  return (
                    <tr
                      key={org.id}
                      className="transition-colors group hover:bg-slate-50 dark:hover:bg-slate-800/30"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4">
                          <div className="h-11 w-11 rounded-xl border flex items-center justify-center font-bold uppercase shadow-inner overflow-hidden shrink-0 transition-colors duration-300 bg-slate-100 border-slate-200 text-slate-500 dark:bg-slate-800/80 dark:border-slate-700 dark:text-slate-400">
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
                          <div>
                            <p className="font-bold text-sm transition-colors duration-300 text-slate-900 dark:text-white">
                              {org.name}
                            </p>
                            <div className="flex items-center gap-2 mt-1.5">
                              <p className="text-xs font-medium font-mono tracking-tight transition-colors duration-300 text-slate-600 dark:text-slate-500">
                                {org.contact_email}
                              </p>
                              {org.is_email_verified ? (
                                <Badge
                                  variant="success"
                                  className="text-[9px] py-0 px-1.5 uppercase tracking-widest flex items-center gap-1 transition-colors duration-300 bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-500 dark:border-emerald-500/20"
                                >
                                  <MailCheck className="h-3 w-3" /> Verified
                                </Badge>
                              ) : (
                                <Badge
                                  variant="warning"
                                  className="text-[9px] py-0 px-1.5 uppercase tracking-widest flex items-center gap-1 transition-colors duration-300 bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-500 dark:border-amber-500/20"
                                >
                                  <MailWarning className="h-3 w-3" /> Unverified
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4">
                          <div>
                            <p className="font-bold text-sm transition-colors duration-300 text-slate-900 dark:text-white">
                              {org.district_name}
                            </p>
                            <p className="text-xs font-medium mt-1 font-mono tracking-tight transition-colors duration-300 text-slate-600 dark:text-slate-500">
                              {org.state_name}, {org.country_name}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          className={`h-8 px-3 text-xs font-bold uppercase tracking-wider border transition-colors duration-300 ${
                            org.status === "ACTIVE"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 dark:bg-transparent dark:text-emerald-400 dark:border-emerald-500/20 dark:hover:bg-emerald-500/10"
                              : "bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100 dark:bg-transparent dark:text-rose-400 dark:border-rose-500/20 dark:hover:bg-rose-500/10"
                          }`}
                          onClick={() => {
                            if (
                              window.confirm(
                                `Are you sure you want to ${org.status === "ACTIVE" ? "suspend" : "activate"} platform access for ${org.name}?`,
                              )
                            ) {
                              toggleOrgStatusMutation.mutate({
                                orgId: org.id,
                                currentStatus: org.status,
                              });
                            }
                          }}
                          disabled={
                            toggleOrgStatusMutation.isPending &&
                            toggleOrgStatusMutation.variables?.orgId === org.id
                          }
                        >
                          {toggleOrgStatusMutation.isPending &&
                          toggleOrgStatusMutation.variables?.orgId ===
                            org.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : org.status === "ACTIVE" ? (
                            "Active"
                          ) : (
                            "Suspended"
                          )}
                        </Button>
                      </td>

                      <td className="px-6 py-4">
                        {pendingPayment ? (
                          <Badge
                            variant="warning"
                            className="gap-1.5 px-2.5 py-1 transition-colors duration-300 bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20"
                          >
                            <Clock className="h-3.5 w-3.5" /> Pending
                          </Badge>
                        ) : org.has_active_subscription ? (
                          <div className="flex flex-col">
                            <Badge
                              variant="success"
                              className="w-fit gap-1.5 mb-1.5 px-2.5 py-1 transition-colors duration-300 bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20"
                            >
                              <ShieldCheck className="h-3.5 w-3.5" /> Active
                            </Badge>
                            <span className="text-[10px] font-medium transition-colors duration-300 text-slate-500 dark:text-slate-500">
                              Exp: {formatDate(org.subscription_expires_at)}
                            </span>
                          </div>
                        ) : (
                          <Badge
                            variant="danger"
                            className="gap-1.5 px-2.5 py-1 transition-colors duration-300 bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20"
                          >
                            <Ban className="h-3.5 w-3.5" /> Expired
                          </Badge>
                        )}
                      </td>

                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            onClick={() =>
                              navigate(`/superadmin/organizations/${org.id}`)
                            }
                            variant="ghost"
                            size="sm"
                            className="transition-colors duration-300 bg-white border-slate-200 text-slate-700 hover:bg-slate-50 dark:bg-slate-900/50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
                            title="View Full Profile"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className={`transition-all duration-300 ${
                              pendingPayment
                                ? "bg-amber-50 text-amber-700 border-amber-300 hover:bg-amber-100 dark:bg-transparent dark:border-amber-500/50 dark:text-amber-400 dark:shadow-[0_0_15px_rgba(245,158,11,0.15)] dark:hover:border-amber-500 dark:hover:text-amber-300"
                                : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50 dark:bg-slate-900/50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
                            }`}
                            onClick={() => openManageModal(org)}
                            title="Manage Billing"
                          >
                            <CreditCard className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* =====================================================================
          1. MANAGE BILLING MODAL
      ====================================================================== */}
      <Modal
        isOpen={isManageModalOpen}
        onClose={() => setIsManageModalOpen(false)}
        title="Billing & Access Control"
      >
        {selectedOrg && (
          <div className="space-y-6">
            <div className="p-5 rounded-2xl border shadow-inner transition-colors duration-300 bg-slate-50 border-slate-200 dark:bg-slate-950/80 dark:border-slate-800">
              <h3 className="font-bold text-base mb-2 transition-colors duration-300 text-slate-900 dark:text-white">
                {selectedOrg.name}
              </h3>
              <div className="text-sm font-medium flex flex-col sm:flex-row sm:items-center justify-between gap-2 transition-colors duration-300 text-slate-600 dark:text-slate-400">
                <span className="flex items-center gap-2">
                  <span className="transition-colors duration-300 text-slate-500">
                    System Status:
                  </span>
                  {selectedOrg.has_active_subscription ? (
                    <span className="flex items-center gap-1 transition-colors duration-300 text-emerald-600 dark:text-emerald-400">
                      <ShieldCheck className="h-4 w-4" /> Authorized
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 transition-colors duration-300 text-rose-600 dark:text-rose-400">
                      <Ban className="h-4 w-4" /> Restricted
                    </span>
                  )}
                </span>
                <span className="flex items-center gap-2 transition-colors duration-300 text-slate-500 dark:text-slate-400">
                  <Clock className="h-4 w-4 transition-colors duration-300 text-slate-400 dark:text-slate-500" />{" "}
                  Exp: {formatDate(selectedOrg.subscription_expires_at)}
                </span>
              </div>
            </div>

            {getPendingPayment(selectedOrg.id) ? (
              <div className="border p-5 rounded-2xl space-y-5 shadow-sm relative overflow-hidden transition-colors duration-300 bg-amber-50 border-amber-200 dark:bg-amber-500/5 dark:border-amber-500/30">
                <div className="absolute top-0 left-0 w-1 h-full transition-colors duration-300 bg-amber-500" />
                <div className="flex items-center gap-2 font-bold uppercase tracking-wider text-xs pb-3 border-b transition-colors duration-300 text-amber-700 border-amber-200 dark:text-amber-500 dark:border-amber-500/20">
                  <Clock className="h-4 w-4" /> Pending Verification
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider mb-1 transition-colors duration-300 text-amber-800 dark:text-slate-400">
                    Submitted Transaction Reference (UTR)
                  </p>
                  <p className="text-3xl font-black font-mono tracking-widest my-2 transition-colors duration-300 text-amber-900 dark:text-white">
                    {getPendingPayment(selectedOrg.id).upi_reference}
                  </p>
                  <p className="text-sm font-medium transition-colors duration-300 text-emerald-700 dark:text-emerald-400">
                    Expected Value: ₹999.00
                  </p>
                </div>
                <div className="flex gap-3 pt-2">
                  <Button
                    variant="ghost"
                    className="flex-1 font-bold transition-colors duration-300 bg-rose-100 text-rose-700 border border-rose-200 hover:bg-rose-200 dark:bg-rose-500/10 dark:hover:bg-rose-500/20 dark:text-rose-400 dark:border-rose-500/20"
                    onClick={() =>
                      verifyPaymentMutation.mutate({
                        paymentId: getPendingPayment(selectedOrg.id).id,
                        action: "REJECT",
                      })
                    }
                    disabled={verifyPaymentMutation.isPending}
                  >
                    <XCircle className="h-4 w-4 mr-2" /> Reject
                  </Button>
                  <Button
                    variant="primary"
                    className="flex-1 font-bold shadow-lg transition-colors duration-300 bg-emerald-600 hover:bg-emerald-500 text-white dark:bg-emerald-600 dark:hover:bg-emerald-500"
                    onClick={() =>
                      verifyPaymentMutation.mutate({
                        paymentId: getPendingPayment(selectedOrg.id).id,
                        action: "APPROVE",
                      })
                    }
                    disabled={verifyPaymentMutation.isPending}
                  >
                    {verifyPaymentMutation.isPending &&
                    verifyPaymentMutation.variables?.action === "APPROVE" ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <>
                        <CheckCircle2 className="h-5 w-5 mr-2" /> Approve
                      </>
                    )}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-5 border p-5 rounded-2xl relative overflow-hidden transition-colors duration-300 bg-slate-50 border-slate-200 dark:border-slate-800 dark:bg-slate-900/50">
                <div className="absolute top-0 left-0 w-1 h-full transition-colors duration-300 bg-rose-500" />
                <div className="flex items-center gap-2 font-bold uppercase tracking-wider text-xs pb-3 border-b transition-colors duration-300 text-rose-600 border-slate-200 dark:text-rose-400 dark:border-slate-800">
                  <ShieldCheck className="h-4 w-4" /> Manual Access Override
                </div>
                <div className="space-y-3">
                  <label className="text-sm font-bold transition-colors duration-300 text-slate-700 dark:text-slate-300">
                    Extend Subscription Duration:
                  </label>
                  <Select
                    value={extendYears}
                    onChange={(e) => setExtendYears(e.target.value)}
                    className="h-12 transition-colors duration-300 bg-white border-slate-200 dark:bg-slate-950/80 dark:border-slate-700"
                  >
                    <option value="1">1 Year (Standard Extension)</option>
                    <option value="2">2 Years</option>
                    <option value="3">3 Years</option>
                    <option value="5">5 Years (Sponsor / Lifetime)</option>
                  </Select>
                  <p className="text-xs font-medium leading-relaxed pt-1 transition-colors duration-300 text-slate-500 dark:text-slate-500">
                    Executing this override will bypass the financial gateway
                    and forcefully extend the tenant's operational license.
                  </p>
                </div>
                <div className="flex justify-end gap-3 pt-4 border-t transition-colors duration-300 border-slate-200 dark:border-slate-800/80">
                  <Button
                    variant="ghost"
                    onClick={() => setIsManageModalOpen(false)}
                    className="transition-colors duration-300 text-slate-600 hover:bg-slate-200 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800"
                  >
                    Abort
                  </Button>
                  <Button
                    variant="primary"
                    onClick={() => extendSubscriptionMutation.mutate()}
                    disabled={extendSubscriptionMutation.isPending}
                    className="shadow-md hover:shadow-lg min-w-40 font-bold transition-all dark:shadow-lg"
                  >
                    {extendSubscriptionMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />{" "}
                        Executing...
                      </>
                    ) : (
                      "Apply Extension"
                    )}
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* =====================================================================
          2. GOD MODE: ORGANIZATION DETAIL MODAL
      ====================================================================== */}
      <Modal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        title="Organization Intelligence"
        size="4xl" // If your modal supports size props, else it defaults
      >
        {selectedOrg && (
          <div className="flex flex-col h-[75vh] sm:h-[80vh] w-full">
            {/* Header Identity */}
            <div className="flex items-start gap-5 shrink-0 border-b pb-6 mb-6 transition-colors duration-300 border-slate-200 dark:border-slate-800/80">
              <div className="h-16 w-16 rounded-xl border flex items-center justify-center font-bold uppercase shadow-inner overflow-hidden shrink-0 transition-colors duration-300 bg-slate-100 border-slate-200 text-slate-500 dark:bg-slate-800/80 dark:border-slate-700 dark:text-slate-400">
                {selectedOrg.logo ? (
                  <img
                    src={selectedOrg.logo}
                    alt={selectedOrg.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  selectedOrg.name.substring(0, 2)
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-4">
                  <h2 className="text-2xl font-bold truncate transition-colors duration-300 text-slate-900 dark:text-white">
                    {selectedOrg.name}
                  </h2>
                  <Badge variant="outline" className="shrink-0">
                    {selectedOrg.org_type.replace("_", " ")}
                  </Badge>
                </div>
                <div className="flex flex-wrap gap-4 mt-2">
                  <span className="flex items-center gap-1.5 text-sm font-medium transition-colors duration-300 text-slate-500 dark:text-slate-400">
                    <MapPin className="h-4 w-4 text-slate-400" />
                    {selectedOrg.district_name}, {selectedOrg.state_name}
                  </span>
                  <span className="flex items-center gap-1.5 text-sm font-medium transition-colors duration-300 text-slate-500 dark:text-slate-400">
                    <Activity className="h-4 w-4 text-slate-400" />
                    Registered: {formatDate(selectedOrg.created_at)}
                  </span>
                </div>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex border-b mb-6 shrink-0 transition-colors duration-300 border-slate-200 dark:border-slate-800/80">
              <button
                onClick={() => setActiveTab("overview")}
                className={`pb-3 px-4 text-sm font-bold transition-all border-b-2 ${
                  activeTab === "overview"
                    ? "border-rose-600 text-rose-600 dark:border-rose-500 dark:text-rose-400"
                    : "border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
                }`}
              >
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4" /> Overview
                </div>
              </button>
              <button
                onClick={() => setActiveTab("donors")}
                className={`pb-3 px-4 text-sm font-bold transition-all border-b-2 ${
                  activeTab === "donors"
                    ? "border-rose-600 text-rose-600 dark:border-rose-500 dark:text-rose-400"
                    : "border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
                }`}
              >
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4" /> Registered Donors
                </div>
              </button>
            </div>

            {/* Scrollable Content Area */}
            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
              {/* TAB: OVERVIEW */}
              {activeTab === "overview" && (
                <div className="space-y-6 animate-in fade-in duration-300">
                  {/* Contact Block */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl border transition-colors duration-300 bg-white border-slate-200 dark:bg-slate-900/50 dark:border-slate-800">
                      <p className="text-xs font-bold uppercase tracking-wider mb-3 transition-colors duration-300 text-slate-500 dark:text-slate-500">
                        Primary Contact
                      </p>
                      <div className="space-y-3">
                        <div className="flex items-center gap-3 transition-colors duration-300 text-slate-700 dark:text-slate-300">
                          <Mail className="h-4 w-4 text-slate-400" />
                          <span className="text-sm font-medium">
                            {selectedOrg.contact_email}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 transition-colors duration-300 text-slate-700 dark:text-slate-300">
                          <Phone className="h-4 w-4 text-slate-400" />
                          <span className="text-sm font-medium font-mono">
                            {selectedOrg.contact_phone}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 rounded-xl border transition-colors duration-300 bg-white border-slate-200 dark:bg-slate-900/50 dark:border-slate-800">
                      <p className="text-xs font-bold uppercase tracking-wider mb-3 transition-colors duration-300 text-slate-500 dark:text-slate-500">
                        Configuration
                      </p>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium transition-colors duration-300 text-slate-600 dark:text-slate-400">
                            Public Searchable
                          </span>
                          {selectedOrg.is_searchable ? (
                            <Badge variant="success">Enabled</Badge>
                          ) : (
                            <Badge variant="outline">Hidden</Badge>
                          )}
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium transition-colors duration-300 text-slate-600 dark:text-slate-400">
                            Public Handle (Slug)
                          </span>
                          <span className="text-xs font-mono font-medium px-2 py-1 rounded bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                            /{selectedOrg.slug}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Address Block */}
                  <div className="p-4 rounded-xl border transition-colors duration-300 bg-white border-slate-200 dark:bg-slate-900/50 dark:border-slate-800">
                    <p className="text-xs font-bold uppercase tracking-wider mb-3 transition-colors duration-300 text-slate-500 dark:text-slate-500">
                      Physical Address
                    </p>
                    <p className="text-sm leading-relaxed transition-colors duration-300 text-slate-700 dark:text-slate-300">
                      {selectedOrg.address_line}
                    </p>
                  </div>

                  {/* Bio Block */}
                  {selectedOrg.description && (
                    <div className="p-4 rounded-xl border transition-colors duration-300 bg-slate-50 border-slate-200 dark:bg-slate-900/20 dark:border-slate-800">
                      <p className="text-xs font-bold uppercase tracking-wider mb-3 transition-colors duration-300 text-slate-500 dark:text-slate-500">
                        About Organization
                      </p>
                      <p className="text-sm leading-relaxed transition-colors duration-300 text-slate-600 dark:text-slate-400">
                        {selectedOrg.description}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* TAB: DONORS */}
              {activeTab === "donors" && (
                <div className="animate-in fade-in duration-300">
                  {isDonorsLoading ? (
                    <div className="flex flex-col items-center justify-center py-20">
                      <Loader2 className="h-8 w-8 animate-spin mb-4 transition-colors duration-300 text-rose-600 dark:text-rose-500" />
                      <p className="text-sm font-medium tracking-widest uppercase transition-colors duration-300 text-slate-500 dark:text-slate-400">
                        Extracting Registry...
                      </p>
                    </div>
                  ) : orgDonors.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center border-2 border-dashed rounded-2xl transition-colors duration-300 border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900/20">
                      <Users className="h-10 w-10 mb-4 transition-colors duration-300 text-slate-400 dark:text-slate-600" />
                      <h3 className="text-lg font-bold mb-1 transition-colors duration-300 text-slate-900 dark:text-white">
                        Registry Empty
                      </h3>
                      <p className="text-sm transition-colors duration-300 text-slate-500 dark:text-slate-400">
                        This organization has not registered any donors yet.
                      </p>
                    </div>
                  ) : (
                    <div className="border rounded-xl overflow-hidden transition-colors duration-300 border-slate-200 dark:border-slate-800">
                      <table className="w-full text-left text-sm">
                        <thead className="text-xs uppercase font-bold border-b transition-colors duration-300 bg-slate-50 text-slate-500 border-slate-200 dark:bg-slate-900/80 dark:border-slate-800">
                          <tr>
                            <th className="px-4 py-3">Blood Group</th>
                            <th className="px-4 py-3">Donor Ref</th>
                            <th className="px-4 py-3">Location</th>
                            <th className="px-4 py-3 text-right">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y transition-colors duration-300 divide-slate-200 dark:divide-slate-800">
                          {orgDonors.map((donor) => (
                            <tr
                              key={donor.id}
                              className="transition-colors duration-300 hover:bg-slate-50 dark:hover:bg-slate-900/40"
                            >
                              <td className="px-4 py-3">
                                <span className="font-black text-rose-600 dark:text-rose-500 tracking-tight">
                                  {donor.blood_group}
                                </span>
                              </td>
                              <td className="px-4 py-3 font-medium transition-colors duration-300 text-slate-700 dark:text-slate-300">
                                {donor.anonymous_label}
                              </td>
                              <td className="px-4 py-3 text-xs transition-colors duration-300 text-slate-500 dark:text-slate-400">
                                {donor.district_name}, {donor.state_name}
                              </td>
                              <td className="px-4 py-3 text-right">
                                {donor.is_available_now ? (
                                  <Badge
                                    variant="success"
                                    className="text-[10px] px-1.5 py-0.5"
                                  >
                                    Available
                                  </Badge>
                                ) : (
                                  <Badge
                                    variant="warning"
                                    className="text-[10px] px-1.5 py-0.5"
                                  >
                                    Resting
                                  </Badge>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Sticky Bottom Actions */}
            <div className="pt-4 border-t mt-4 flex justify-end shrink-0 transition-colors duration-300 border-slate-200 dark:border-slate-800/80">
              <Button
                variant="outline"
                onClick={() => setIsDetailModalOpen(false)}
                className="transition-colors duration-300 bg-white border-slate-200 text-slate-700 hover:bg-slate-50 dark:bg-slate-900/50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Close View
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
