import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Building2,
  Search,
  CheckCircle2,
  XCircle,
  Loader2,
  AlertCircle,
  CreditCard,
  Clock,
  ShieldCheck,
  Ban,
  SearchX,
  ServerCrash,
  RefreshCw,
  MailWarning,
  MailCheck,
} from "lucide-react";
import toast from "react-hot-toast";

import { Card } from "../../components/ui/Card";
import { Input } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";
import { Badge } from "../../components/ui/Badge";
import { Select } from "../../components/ui/Select";
import { Modal } from "../../components/ui/Modal";
import api from "../../lib/axios";

export default function ManageOrganizations() {
  const queryClient = useQueryClient();

  // --- UI Transition State ---
  const [searchTerm, setSearchTerm] = useState("");
  const [isManageModalOpen, setIsManageModalOpen] = useState(false);
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

  // --- Mutation Pipeline: Verify Payment ---
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

  // --- Mutation Pipeline: Manual Extension Override ---
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

  // --- Mutation Pipeline: Access Toggle ---
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
    <div className="p-6 max-w-7xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-24 transition-colors duration-300 bg-slate-50 dark:bg-slate-950">
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
                <th className="px-6 py-5">Subscription Status</th>
                <th className="px-6 py-5 text-right">Billing Actions</th>
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
                              {/* Email Verification Status Badge */}
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
                            <Clock className="h-3.5 w-3.5" /> Verification
                            Pending
                          </Badge>
                        ) : org.has_active_subscription ? (
                          <div className="flex flex-col">
                            <Badge
                              variant="success"
                              className="w-fit gap-1.5 mb-1.5 px-2.5 py-1 transition-colors duration-300 bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20"
                            >
                              <ShieldCheck className="h-3.5 w-3.5" /> Active
                            </Badge>
                            <span className="text-xs font-medium flex items-center gap-1 transition-colors duration-300 text-slate-500 dark:text-slate-500">
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
                        <Button
                          variant="outline"
                          size="sm"
                          className={`font-semibold transition-all duration-300 ${
                            pendingPayment
                              ? "bg-amber-50 text-amber-700 border-amber-300 hover:bg-amber-100 dark:bg-transparent dark:border-amber-500/50 dark:text-amber-400 dark:shadow-[0_0_15px_rgba(245,158,11,0.15)] dark:hover:border-amber-500 dark:hover:text-amber-300"
                              : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50 dark:bg-slate-900/50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
                          }`}
                          onClick={() => openManageModal(org)}
                        >
                          <CreditCard className="h-4 w-4 mr-2" />
                          {pendingPayment ? "Review Payment" : "Manage Billing"}
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* --- Manage Subscription Modal --- */}
      <Modal
        isOpen={isManageModalOpen}
        onClose={() => setIsManageModalOpen(false)}
        title="Billing & Access Control"
      >
        {selectedOrg && (
          <div className="space-y-6">
            {/* Organization Info Snapshot */}
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

            {/* Path A: Pending Payment Verification */}
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
                    <XCircle className="h-4 w-4 mr-2" /> Reject (Invalid)
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
                        <CheckCircle2 className="h-5 w-5 mr-2" /> Approve (+1
                        Yr)
                      </>
                    )}
                  </Button>
                </div>
              </div>
            ) : (
              /* Path B: Manual Subscription Override */
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
    </div>
  );
}
