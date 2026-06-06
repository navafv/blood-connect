import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  CreditCard,
  Zap,
  CheckCircle2,
  Receipt,
  ShieldCheck,
  Loader2,
  AlertCircle,
  Clock,
  XCircle,
  QrCode,
  ArrowRight,
  Wallet,
  RefreshCw,
} from "lucide-react";
import toast from "react-hot-toast";

import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "../../../components/ui/Card";
import { Button } from "../../../components/ui/Button";
import { Badge } from "../../../components/ui/Badge";
import { Input } from "../../../components/ui/Input";
import { Modal } from "../../../components/ui/Modal";
import api from "../../../lib/axios";

export default function BillingSubscription() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [utrNumber, setUtrNumber] = useState("");

  // --- Query Pipeline: Organization Telemetry ---
  const {
    data: orgData,
    isLoading: isOrgLoading,
    isError: isOrgError,
    refetch: refetchOrg,
  } = useQuery({
    queryKey: ["tenant-org-billing"],
    queryFn: async () => {
      const response = await api.get("/tenant/organization/");
      return response.data;
    },
  });

  // --- Query Pipeline: Transaction Ledger ---
  const {
    data: payments = [],
    isLoading: isPaymentsLoading,
    isError: isPaymentsError,
    refetch: refetchPayments,
  } = useQuery({
    queryKey: ["tenant-payments"],
    queryFn: async () => {
      const response = await api.get("/tenant/billing/payments/");
      return response.data.results || response.data;
    },
  });

  // --- Mutation Pipeline: UTR Submission ---
  const submitPaymentMutation = useMutation({
    mutationFn: async (utr) => {
      const response = await api.post("/tenant/billing/payments/", {
        upi_reference: utr,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["tenant-payments"]);
      setIsModalOpen(false);
      setUtrNumber("");
      toast.success("Payment reference submitted for verification.", {
        icon: "💳",
      });
    },
    onError: (err) => {
      toast.error(
        err.response?.data?.error ||
          err.response?.data?.detail ||
          "Failed to submit payment reference.",
      );
    },
  });

  // --- Action Handlers & Formatters ---
  const handleUtrSubmit = (e) => {
    e.preventDefault();
    if (!utrNumber.trim()) {
      toast.error("Please provide a valid UTR/Reference number.");
      return;
    }
    submitPaymentMutation.mutate(utrNumber.trim());
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // --- UI Transition States ---
  if (isOrgLoading || isPaymentsLoading) {
    return (
      <div className="flex flex-col h-[60vh] items-center justify-center text-slate-400 gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-rose-500" />
        <span className="text-sm font-semibold tracking-widest uppercase">
          Loading Financial Data...
        </span>
      </div>
    );
  }

  if (isOrgError || isPaymentsError) {
    return (
      <div className="flex flex-col h-[60vh] items-center justify-center text-center animate-in fade-in duration-500">
        <div className="h-20 w-20 rounded-2xl bg-rose-500/10 flex items-center justify-center border border-rose-500/20 mb-6">
          <AlertCircle className="h-10 w-10 text-rose-500" />
        </div>
        <h3 className="text-2xl font-bold text-white mb-2">
          Telemetry Failure
        </h3>
        <p className="text-slate-400 max-w-md mb-6 leading-relaxed">
          Unable to synchronize billing data with the secure ledger.
        </p>
        <Button
          variant="outline"
          className="gap-2 rounded-xl border-slate-700 bg-slate-900/50"
          onClick={() => {
            refetchOrg();
            refetchPayments();
          }}
        >
          <RefreshCw className="h-4 w-4" /> Re-establish Connection
        </Button>
      </div>
    );
  }

  const hasActiveSub = orgData?.has_active_subscription;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-24">
      {/* --- Workspace Header --- */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800/80 pb-6">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3 tracking-tight">
            <div className="p-1.5 rounded-lg bg-rose-500/10 border border-rose-500/20">
              <CreditCard className="h-5 w-5 text-rose-500" />
            </div>
            Billing & Subscription
          </h1>
          <p className="text-sm text-slate-400 mt-2">
            Manage your organization's license validity and transaction ledger.
          </p>
        </div>
      </div>

      {/* --- Section 1: Financial Overview Matrix --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* License Status Card */}
        <Card
          className={`relative overflow-hidden bg-slate-900/60 backdrop-blur-xl shadow-2xl transition-colors duration-500 ${
            hasActiveSub ? "border-emerald-500/30" : "border-rose-500/40"
          }`}
        >
          {/* Ambient Glow */}
          <div
            className={`absolute -right-20 -top-20 h-40 w-40 rounded-full blur-[60px] pointer-events-none transition-colors duration-500 ${
              hasActiveSub ? "bg-emerald-500/20" : "bg-rose-500/20"
            }`}
            aria-hidden="true"
          />

          <CardContent className="p-8 relative z-10">
            <div className="flex justify-between items-start mb-8">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                  License Status
                </p>
                <h3 className="text-3xl font-extrabold text-white flex items-center gap-3 tracking-tight">
                  Standard Plan
                  {hasActiveSub ? (
                    <Badge
                      variant="success"
                      className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-xs px-2.5 py-1"
                    >
                      Active
                    </Badge>
                  ) : (
                    <Badge
                      variant="danger"
                      className="bg-rose-500/10 text-rose-400 border-rose-500/20 text-xs px-2.5 py-1"
                    >
                      Expired
                    </Badge>
                  )}
                </h3>
              </div>
              <div
                className={`h-12 w-12 rounded-2xl flex items-center justify-center border shadow-inner ${
                  hasActiveSub
                    ? "bg-emerald-500/10 border-emerald-500/20"
                    : "bg-rose-500/10 border-rose-500/20"
                }`}
              >
                <Zap
                  className={`h-6 w-6 ${hasActiveSub ? "text-emerald-500" : "text-rose-500"}`}
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <ShieldCheck
                  className={`h-5 w-5 ${hasActiveSub ? "text-emerald-500" : "text-slate-600"}`}
                />
                <p className="text-sm font-medium text-slate-300">
                  {hasActiveSub
                    ? `Authorized access valid until ${formatDate(orgData.subscription_expires_at)}`
                    : "No active operational license."}
                </p>
              </div>

              {!hasActiveSub && (
                <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-start gap-3 text-amber-400/90 text-sm animate-in fade-in zoom-in-95 duration-300">
                  <AlertCircle className="h-5 w-5 shrink-0" />
                  <p className="leading-relaxed">
                    System access is currently restricted. Remit payment via the
                    portal to restore full functionality to your facility's
                    registry.
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Payment Action Terminal */}
        <Card className="border-slate-800/80 bg-slate-900/60 backdrop-blur-xl shadow-2xl">
          <CardContent className="p-8 flex flex-col h-full justify-between">
            <div>
              <div className="flex justify-between items-start mb-6">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                    License Renewal
                  </p>
                  <h3 className="text-4xl font-black text-white flex items-baseline gap-2 tracking-tight">
                    ₹999
                    <span className="text-sm font-medium text-slate-500 tracking-normal mb-1">
                      / 12 Months
                    </span>
                  </h3>
                </div>
                <div className="h-12 w-12 bg-slate-800/80 rounded-2xl flex items-center justify-center border border-slate-700 shadow-inner">
                  <CreditCard className="h-6 w-6 text-slate-400" />
                </div>
              </div>
              <p className="text-sm text-slate-400 leading-relaxed mb-8">
                Initiate a secure transfer via any UPI client (GPay, PhonePe,
                Paytm). Once completed, bind your transaction reference number
                (UTR) to your tenant account for immediate auditing.
              </p>
            </div>

            <Button
              variant="primary"
              className="w-full gap-2 py-6 text-base font-bold shadow-lg hover:shadow-rose-500/20 transition-all rounded-xl"
              onClick={() => setIsModalOpen(true)}
            >
              Remit Payment & Bind UTR <ArrowRight className="h-5 w-5" />
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* --- Section 2: Transaction Ledger --- */}
      <div className="space-y-4 pt-4">
        <h3 className="text-xl font-bold text-white flex items-center gap-2">
          Transaction Ledger
        </h3>

        <Card className="border-slate-800/80 bg-slate-900/60 backdrop-blur-xl shadow-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-950/40 text-xs uppercase text-slate-500 font-bold border-b border-slate-800/80">
                <tr>
                  <th className="px-6 py-5">System ID</th>
                  <th className="px-6 py-5">Timestamp</th>
                  <th className="px-6 py-5">Value</th>
                  <th className="px-6 py-5">Cryptographic Reference (UTR)</th>
                  <th className="px-6 py-5">Audit Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {payments.length === 0 ? (
                  <tr>
                    <td
                      colSpan="5"
                      className="px-6 py-24 text-center animate-in fade-in duration-500"
                    >
                      <div className="h-20 w-20 bg-slate-800/50 border border-slate-700 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-inner">
                        <Wallet className="h-10 w-10 text-slate-500" />
                      </div>
                      <h3 className="text-xl font-bold text-white mb-2 tracking-tight">
                        Empty Ledger
                      </h3>
                      <p className="text-slate-400 max-w-sm mx-auto leading-relaxed text-sm">
                        No financial records exist for this organization.
                      </p>
                    </td>
                  </tr>
                ) : (
                  payments.map((payment) => (
                    <tr
                      key={payment.id}
                      className="hover:bg-slate-800/30 transition-colors group"
                    >
                      <td className="px-6 py-4 font-bold text-white flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-slate-800/50 border border-slate-700">
                          <Receipt className="h-4 w-4 text-slate-400" />
                        </div>
                        TXN-{payment.id.toString().padStart(4, "0")}
                      </td>
                      <td className="px-6 py-4 font-medium text-slate-400">
                        {formatDate(payment.created_at)}
                      </td>
                      <td className="px-6 py-4 font-bold text-slate-200">
                        ₹{payment.amount}
                      </td>
                      <td className="px-6 py-4 font-mono font-semibold text-slate-400 tracking-tight">
                        {payment.upi_reference}
                      </td>
                      <td className="px-6 py-4">
                        {payment.status === "APPROVED" ? (
                          <Badge
                            variant="success"
                            className="gap-1.5 bg-emerald-500/10 text-emerald-400 border-emerald-500/20 px-2.5 py-1"
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" /> Cleared
                          </Badge>
                        ) : payment.status === "REJECTED" ? (
                          <Badge
                            variant="danger"
                            className="gap-1.5 bg-rose-500/10 text-rose-400 border-rose-500/20 px-2.5 py-1"
                          >
                            <XCircle className="h-3.5 w-3.5" /> Rejected
                          </Badge>
                        ) : (
                          <Badge
                            variant="warning"
                            className="gap-1.5 bg-amber-500/10 text-amber-400 border-amber-500/20 px-2.5 py-1"
                          >
                            <Clock className="h-3.5 w-3.5" /> Auditing
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

      {/* --- Secure Payment Gateway Modal --- */}
      <Modal
        isOpen={isModalOpen}
        onClose={() =>
          !submitPaymentMutation.isPending && setIsModalOpen(false)
        }
        title="Secure Payment Gateway"
      >
        <div className="space-y-8">
          {/* Virtual Terminal QR Target */}
          <div className="bg-slate-50 p-6 rounded-2xl flex flex-col items-center justify-center max-w-sm mx-auto border-4 border-slate-200 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 w-full h-1 bg-linear-to-r from-blue-500 via-rose-500 to-emerald-500" />
            <div className="h-48 w-48 bg-white flex flex-col items-center justify-center text-slate-300 border-2 border-dashed border-slate-300 mb-4 rounded-xl shadow-sm">
              <QrCode className="h-16 w-16 mb-3 text-slate-300" />
              <span className="text-xs font-bold uppercase tracking-widest text-slate-400">
                Scanner Target
              </span>
            </div>
            <p className="text-slate-800 font-black text-xl mb-1 tracking-tight">
              Remit ₹999.00
            </p>
            <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">
              BloodConnect Merchant
            </p>
          </div>

          <form
            onSubmit={handleUtrSubmit}
            className="space-y-6 pt-6 border-t border-slate-800/80"
          >
            <div className="space-y-3">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                12-Digit UPI Reference Number (UTR) *
              </label>
              <div className="relative group">
                <Receipt className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500 group-focus-within:text-rose-500 transition-colors" />
                <Input
                  placeholder="E.g., 312345678901"
                  className="pl-12 bg-slate-950/50 border-slate-700 h-12 font-mono font-bold text-lg tracking-widest focus:border-rose-500 transition-all placeholder:tracking-normal placeholder:font-sans placeholder:text-base placeholder:font-normal"
                  value={utrNumber}
                  onChange={(e) =>
                    setUtrNumber(e.target.value.replace(/\D/g, "").slice(0, 12))
                  }
                  required
                />
              </div>
              <p className="text-xs text-slate-500 leading-relaxed font-medium">
                Locate the 12-digit transaction ID generated by your UPI client
                (GPay, PhonePe, Paytm) after a successful transfer.
              </p>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="ghost"
                className="text-slate-400 hover:text-white"
                onClick={() => setIsModalOpen(false)}
                disabled={submitPaymentMutation.isPending}
              >
                Abort
              </Button>
              <Button
                type="submit"
                variant="primary"
                className="min-w-40 shadow-lg font-bold"
                disabled={
                  submitPaymentMutation.isPending || utrNumber.length < 12
                }
              >
                {submitPaymentMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Binding...
                  </>
                ) : (
                  "Bind Reference"
                )}
              </Button>
            </div>
          </form>
        </div>
      </Modal>
    </div>
  );
}
