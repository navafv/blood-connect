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
} from "lucide-react";
import { Card } from "../../components/ui/Card";
import { Input } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";
import { Badge } from "../../components/ui/Badge";
import { Select } from "../../components/ui/Select";
import { Modal } from "../../components/ui/Modal";
import api from "../../lib/axios";

export default function ManageOrganizations() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [isManageModalOpen, setIsManageModalOpen] = useState(false);
  const [selectedOrg, setSelectedOrg] = useState(null);
  const [extendYears, setExtendYears] = useState("1");

  // 1. Fetch Organizations
  const { data: organizations = [], isLoading: isOrgsLoading } = useQuery({
    queryKey: ["superadmin-organizations"],
    queryFn: async () => {
      const res = await api.get("/superadmin/organizations/");
      return res.data.results || res.data;
    },
  });

  // 2. Fetch Payments (to check for Pending UTRs)
  const { data: payments = [], isLoading: isPaymentsLoading } = useQuery({
    queryKey: ["superadmin-payments"],
    queryFn: async () => {
      const res = await api.get("/superadmin/payments/");
      return res.data.results || res.data;
    },
  });

  // 3. Mutations
  const verifyPaymentMutation = useMutation({
    mutationFn: async ({ paymentId, action }) =>
      api.post(`/superadmin/payments/${paymentId}/verify/`, { action }),
    onSuccess: () => {
      queryClient.invalidateQueries(["superadmin-organizations"]);
      queryClient.invalidateQueries(["superadmin-payments"]);
      setIsManageModalOpen(false);
    },
  });

  const extendSubscriptionMutation = useMutation({
    mutationFn: async () =>
      api.post(
        `/superadmin/organizations/${selectedOrg.id}/extend-subscription/`,
        { years: extendYears },
      ),
    onSuccess: () => {
      queryClient.invalidateQueries(["superadmin-organizations"]);
      setIsManageModalOpen(false);
    },
  });

  const toggleOrgStatusMutation = useMutation({
    mutationFn: async ({ orgId, currentStatus }) => {
      const newStatus = currentStatus === "ACTIVE" ? "SUSPENDED" : "ACTIVE";
      return api.patch(`/superadmin/organizations/${orgId}/status/`, {
        status: newStatus,
      });
    },
    onSuccess: () =>
      queryClient.invalidateQueries(["superadmin-organizations"]),
  });

  // Helper Functions
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

  const filteredOrgs = organizations.filter(
    (org) =>
      org.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      org.contact_email.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800 pb-6">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <Building2 className="h-6 w-6 text-rose-500" />
            Registered Hospitals & Organizations
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Manage tenant access, verify UPI payments, and extend subscriptions.
          </p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center bg-slate-900/50 p-4 rounded-xl border border-slate-800">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <Input
            placeholder="Search by hospital name or email..."
            className="pl-10 bg-slate-950 border-slate-700"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Organization Table */}
      <Card className="border-slate-800 bg-slate-900/60 backdrop-blur-md">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-900/80 text-xs uppercase text-slate-400 border-b border-slate-800">
              <tr>
                <th className="px-6 py-4 font-medium">Organization Details</th>
                <th className="px-6 py-4 font-medium">Platform Access</th>
                <th className="px-6 py-4 font-medium">Subscription Status</th>
                <th className="px-6 py-4 font-medium text-right">
                  Billing Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {isOrgsLoading || isPaymentsLoading ? (
                <tr>
                  <td
                    colSpan="4"
                    className="px-6 py-12 text-center text-slate-500"
                  >
                    <Loader2 className="h-8 w-8 animate-spin mx-auto text-rose-500 mb-2" />
                    Loading tenants...
                  </td>
                </tr>
              ) : filteredOrgs.length === 0 ? (
                <tr>
                  <td
                    colSpan="4"
                    className="px-6 py-12 text-center text-slate-500"
                  >
                    No organizations found.
                  </td>
                </tr>
              ) : (
                filteredOrgs.map((org) => {
                  const pendingPayment = getPendingPayment(org.id);

                  return (
                    <tr
                      key={org.id}
                      className="hover:bg-slate-800/30 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-slate-400 uppercase">
                            {org.name.substring(0, 2)}
                          </div>
                          <div>
                            <p className="font-medium text-white">{org.name}</p>
                            <p className="text-xs text-slate-500">
                              {org.contact_email}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          className={`h-7 px-2 text-xs border ${org.status === "ACTIVE" ? "text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/10" : "text-rose-400 border-rose-500/20 hover:bg-rose-500/10"}`}
                          onClick={() => {
                            if (
                              window.confirm(
                                `Are you sure you want to ${org.status === "ACTIVE" ? "suspend" : "activate"} access for ${org.name}?`,
                              )
                            ) {
                              toggleOrgStatusMutation.mutate({
                                orgId: org.id,
                                currentStatus: org.status,
                              });
                            }
                          }}
                          disabled={toggleOrgStatusMutation.isPending}
                        >
                          {org.status === "ACTIVE" ? "Active" : "Suspended"}
                        </Button>
                      </td>

                      <td className="px-6 py-4">
                        {pendingPayment ? (
                          <Badge
                            variant="warning"
                            className="bg-amber-500/10 text-amber-400 border-amber-500/20 gap-1"
                          >
                            <Clock className="h-3 w-3" /> Verification Pending
                          </Badge>
                        ) : org.has_active_subscription ? (
                          <div className="flex flex-col">
                            <Badge
                              variant="success"
                              className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 w-fit gap-1 mb-1"
                            >
                              <ShieldCheck className="h-3 w-3" /> Active
                            </Badge>
                            <span className="text-xs text-slate-500">
                              Exp: {formatDate(org.subscription_expires_at)}
                            </span>
                          </div>
                        ) : (
                          <Badge
                            variant="danger"
                            className="bg-rose-500/10 text-rose-400 border-rose-500/20 gap-1"
                          >
                            <Ban className="h-3 w-3" /> Expired
                          </Badge>
                        )}
                      </td>

                      <td className="px-6 py-4 text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          className={`border-slate-700 bg-slate-900/50 hover:bg-slate-800 ${pendingPayment ? "border-amber-500/50 text-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.2)]" : "text-slate-300"}`}
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
        title="Manage Subscription"
      >
        {selectedOrg && (
          <div className="space-y-6">
            {/* Organization Info Snapshot */}
            <div className="bg-slate-950/50 p-4 rounded-xl border border-slate-800">
              <h3 className="text-white font-medium mb-1">
                {selectedOrg.name}
              </h3>
              <p className="text-sm text-slate-400 flex justify-between">
                <span>
                  Status:{" "}
                  {selectedOrg.has_active_subscription ? (
                    <span className="text-emerald-400">Active</span>
                  ) : (
                    <span className="text-rose-400">Expired</span>
                  )}
                </span>
                <span>
                  Current Expiry:{" "}
                  {formatDate(selectedOrg.subscription_expires_at)}
                </span>
              </p>
            </div>

            {/* If there is a pending payment UTR, show Verification UI */}
            {getPendingPayment(selectedOrg.id) ? (
              <div className="border-2 border-amber-500/30 bg-amber-500/5 p-4 rounded-xl space-y-4">
                <div className="flex items-center gap-2 text-amber-500 font-medium pb-2 border-b border-amber-500/20">
                  <Clock className="h-5 w-5" /> Pending UPI Verification
                </div>

                <div>
                  <p className="text-sm text-slate-400">
                    Submitted UTR / Reference Number:
                  </p>
                  <p className="text-2xl font-mono text-white tracking-wider my-1">
                    {getPendingPayment(selectedOrg.id).upi_reference}
                  </p>
                  <p className="text-xs text-slate-500">Amount: ₹999.00</p>
                </div>

                <div className="flex gap-3 pt-2">
                  <Button
                    variant="ghost"
                    className="flex-1 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20"
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
                    className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white"
                    onClick={() =>
                      verifyPaymentMutation.mutate({
                        paymentId: getPendingPayment(selectedOrg.id).id,
                        action: "APPROVE",
                      })
                    }
                    disabled={verifyPaymentMutation.isPending}
                  >
                    {verifyPaymentMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <CheckCircle2 className="h-4 w-4 mr-2" /> Approve (+1
                        Year)
                      </>
                    )}
                  </Button>
                </div>
              </div>
            ) : (
              /* Otherwise, show Manual Override UI */
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-slate-300 font-medium pb-2 border-b border-slate-800">
                  <ShieldCheck className="h-5 w-5 text-rose-500" /> Manual
                  Subscription Override
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-400">
                    Extend Time By:
                  </label>
                  <Select
                    value={extendYears}
                    onChange={(e) => setExtendYears(e.target.value)}
                    className="bg-slate-950 border-slate-700"
                  >
                    <option value="1">1 Year (Standard)</option>
                    <option value="2">2 Years</option>
                    <option value="3">3 Years</option>
                    <option value="5">5 Years (Lifetime/Sponsor)</option>
                  </Select>
                  <p className="text-xs text-slate-500">
                    This will bypass the payment requirement and forcefully
                    extend their access.
                  </p>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                  <Button
                    variant="ghost"
                    onClick={() => setIsManageModalOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    onClick={() => extendSubscriptionMutation.mutate()}
                    disabled={extendSubscriptionMutation.isPending}
                  >
                    {extendSubscriptionMutation.isPending
                      ? "Applying..."
                      : "Apply Extension"}
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
