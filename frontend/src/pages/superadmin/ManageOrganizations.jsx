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
      queryClient.invalidateQueries(["superadmin-organizations"]);
      queryClient.invalidateQueries(["superadmin-payments"]);
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
      queryClient.invalidateQueries(["superadmin-organizations"]);
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
      queryClient.invalidateQueries(["superadmin-organizations"]);
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
    <div className="p-6 max-w-7xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-24">
      {/* --- Workspace Header --- */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800/80 pb-6">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-3">
            <div className="p-1.5 rounded-lg bg-rose-500/10 border border-rose-500/20">
              <Building2 className="h-5 w-5 text-rose-500" />
            </div>
            Registered Organizations
          </h1>
          <p className="text-sm text-slate-400 mt-2">
            Manage tenant access, verify UPI payments, and enforce global
            subscription states.
          </p>
        </div>
      </div>

      {/* --- Search Toolbar --- */}
      <div className="flex items-center bg-slate-900/40 backdrop-blur-md p-5 rounded-2xl border border-slate-800/60 shadow-sm">
        <div className="relative w-full max-w-lg group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 group-focus-within:text-rose-500 transition-colors" />
          <Input
            placeholder="Search directory by facility name or email..."
            className="pl-11 bg-slate-950/50 border-slate-700 h-11 focus:border-rose-500 focus:ring-rose-500/20 transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* --- Primary Data Table Area --- */}
      <Card className="overflow-hidden border-slate-800/80 bg-slate-900/60 backdrop-blur-xl shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-950/40 text-xs uppercase text-slate-500 font-bold border-b border-slate-800/80">
              <tr>
                <th className="px-6 py-5">Organization Details</th>
                <th className="px-6 py-5">Platform Access</th>
                <th className="px-6 py-5">Subscription Status</th>
                <th className="px-6 py-5 text-right">Billing Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {isOrgsLoading || isPaymentsLoading ? (
                <tr>
                  <td colSpan="4" className="px-6 py-24 text-center">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto text-rose-500 mb-4" />
                    <p className="text-sm font-medium tracking-widest uppercase text-slate-400">
                      Loading Tenants...
                    </p>
                  </td>
                </tr>
              ) : isOrgsError || isPaymentsError ? (
                <tr>
                  <td
                    colSpan="4"
                    className="px-6 py-24 text-center animate-in fade-in duration-500"
                  >
                    <div className="h-20 w-20 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-inner">
                      <ServerCrash className="h-10 w-10 text-rose-500" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2 tracking-tight">
                      Telemetry Failure
                    </h3>
                    <p className="text-slate-400 max-w-sm mx-auto leading-relaxed text-sm mb-6">
                      Unable to synchronize organization data with the secure
                      ledger.
                    </p>
                    <Button
                      variant="outline"
                      className="border-slate-700 bg-slate-900/50"
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
                    colSpan="4"
                    className="px-6 py-24 text-center animate-in fade-in duration-500"
                  >
                    <div className="h-20 w-20 bg-slate-800/50 border border-slate-700 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-inner">
                      <Building2 className="h-10 w-10 text-slate-500" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2 tracking-tight">
                      No Organizations
                    </h3>
                    <p className="text-slate-400 max-w-sm mx-auto leading-relaxed text-sm">
                      There are currently no active or pending organizations on
                      the platform.
                    </p>
                  </td>
                </tr>
              ) : filteredOrgs.length === 0 ? (
                <tr>
                  <td
                    colSpan="4"
                    className="px-6 py-24 text-center animate-in fade-in duration-300"
                  >
                    <SearchX className="h-12 w-12 text-slate-600 mb-4 mx-auto" />
                    <h3 className="text-lg font-bold text-white mb-2">
                      No Matches Found
                    </h3>
                    <p className="text-slate-400 text-sm max-w-sm mx-auto">
                      No tenant organizations match the query:{" "}
                      <strong className="text-slate-300">"{searchTerm}"</strong>
                    </p>
                  </td>
                </tr>
              ) : (
                filteredOrgs.map((org) => {
                  const pendingPayment = getPendingPayment(org.id);

                  return (
                    <tr
                      key={org.id}
                      className="hover:bg-slate-800/30 transition-colors group"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4">
                          <div className="h-11 w-11 rounded-xl bg-slate-800/80 border border-slate-700 flex items-center justify-center font-bold text-slate-400 uppercase shadow-inner">
                            {org.name.substring(0, 2)}
                          </div>
                          <div>
                            <p className="font-bold text-white text-sm">
                              {org.name}
                            </p>
                            <p className="text-xs font-medium text-slate-500 mt-1 font-mono tracking-tight">
                              {org.contact_email}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          className={`h-8 px-3 text-xs font-bold uppercase tracking-wider border ${
                            org.status === "ACTIVE"
                              ? "text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/10"
                              : "text-rose-400 border-rose-500/20 hover:bg-rose-500/10"
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
                            className="bg-amber-500/10 text-amber-400 border-amber-500/20 gap-1.5 px-2.5 py-1"
                          >
                            <Clock className="h-3.5 w-3.5" /> Verification
                            Pending
                          </Badge>
                        ) : org.has_active_subscription ? (
                          <div className="flex flex-col">
                            <Badge
                              variant="success"
                              className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 w-fit gap-1.5 mb-1.5 px-2.5 py-1"
                            >
                              <ShieldCheck className="h-3.5 w-3.5" /> Active
                            </Badge>
                            <span className="text-xs font-medium text-slate-500 flex items-center gap-1">
                              Exp: {formatDate(org.subscription_expires_at)}
                            </span>
                          </div>
                        ) : (
                          <Badge
                            variant="danger"
                            className="bg-rose-500/10 text-rose-400 border-rose-500/20 gap-1.5 px-2.5 py-1"
                          >
                            <Ban className="h-3.5 w-3.5" /> Expired
                          </Badge>
                        )}
                      </td>

                      <td className="px-6 py-4 text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          className={`font-semibold border-slate-700 bg-slate-900/50 hover:bg-slate-800 transition-all ${
                            pendingPayment
                              ? "border-amber-500/50 text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.15)] hover:border-amber-500 hover:text-amber-300"
                              : "text-slate-300 hover:text-white"
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
            <div className="bg-slate-950/80 p-5 rounded-2xl border border-slate-800 shadow-inner">
              <h3 className="text-white font-bold text-base mb-2">
                {selectedOrg.name}
              </h3>
              <div className="text-sm font-medium flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <span className="flex items-center gap-2">
                  <span className="text-slate-500">System Status:</span>
                  {selectedOrg.has_active_subscription ? (
                    <span className="text-emerald-400 flex items-center gap-1">
                      <ShieldCheck className="h-4 w-4" /> Authorized
                    </span>
                  ) : (
                    <span className="text-rose-400 flex items-center gap-1">
                      <Ban className="h-4 w-4" /> Restricted
                    </span>
                  )}
                </span>
                <span className="flex items-center gap-2 text-slate-400">
                  <Clock className="h-4 w-4 text-slate-500" /> Exp:{" "}
                  {formatDate(selectedOrg.subscription_expires_at)}
                </span>
              </div>
            </div>

            {/* Path A: Pending Payment Verification */}
            {getPendingPayment(selectedOrg.id) ? (
              <div className="border border-amber-500/30 bg-amber-500/5 p-5 rounded-2xl space-y-5 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-amber-500" />

                <div className="flex items-center gap-2 text-amber-500 font-bold uppercase tracking-wider text-xs pb-3 border-b border-amber-500/20">
                  <Clock className="h-4 w-4" /> Pending UPI Verification
                </div>

                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Submitted Cryptographic Reference (UTR)
                  </p>
                  <p className="text-3xl font-black font-mono text-white tracking-widest my-2">
                    {getPendingPayment(selectedOrg.id).upi_reference}
                  </p>
                  <p className="text-sm font-medium text-emerald-400">
                    Expected Value: ₹999.00
                  </p>
                </div>

                <div className="flex gap-3 pt-2">
                  <Button
                    variant="ghost"
                    className="flex-1 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 font-bold"
                    onClick={() =>
                      verifyPaymentMutation.mutate({
                        paymentId: getPendingPayment(selectedOrg.id).id,
                        action: "REJECT",
                      })
                    }
                    disabled={verifyPaymentMutation.isPending}
                  >
                    <XCircle className="h-4 w-4 mr-2" /> Reject (Invalid UTR)
                  </Button>
                  <Button
                    variant="primary"
                    className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-lg"
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
                        Year)
                      </>
                    )}
                  </Button>
                </div>
              </div>
            ) : (
              /* Path B: Manual Subscription Override */
              <div className="space-y-5 border border-slate-800 bg-slate-900/50 p-5 rounded-2xl relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-rose-500" />

                <div className="flex items-center gap-2 text-rose-400 font-bold uppercase tracking-wider text-xs pb-3 border-b border-slate-800">
                  <ShieldCheck className="h-4 w-4" /> Manual Access Override
                </div>

                <div className="space-y-3">
                  <label className="text-sm font-bold text-slate-300">
                    Extend Subscription Duration:
                  </label>
                  <Select
                    value={extendYears}
                    onChange={(e) => setExtendYears(e.target.value)}
                    className="bg-slate-950/80 border-slate-700 h-12"
                  >
                    <option value="1">1 Year (Standard Extension)</option>
                    <option value="2">2 Years</option>
                    <option value="3">3 Years</option>
                    <option value="5">5 Years (Sponsor / Lifetime)</option>
                  </Select>
                  <p className="text-xs font-medium text-slate-500 leading-relaxed pt-1">
                    Executing this override will bypass the financial gateway
                    and forcefully extend the tenant's operational license.
                  </p>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-800/80">
                  <Button
                    variant="ghost"
                    onClick={() => setIsManageModalOpen(false)}
                    className="text-slate-400 hover:text-white"
                  >
                    Abort
                  </Button>
                  <Button
                    variant="primary"
                    onClick={() => extendSubscriptionMutation.mutate()}
                    disabled={extendSubscriptionMutation.isPending}
                    className="shadow-lg min-w-40 font-bold"
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
