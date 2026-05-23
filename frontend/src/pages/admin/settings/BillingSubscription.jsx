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
} from "lucide-react";
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
  const [submitError, setSubmitError] = useState("");

  // 1. Fetch Organization Details (for Expiry Date)
  const { data: orgData, isLoading: isOrgLoading } = useQuery({
    queryKey: ["tenant-org-billing"],
    queryFn: async () => {
      const response = await api.get("/tenant/organization/");
      return response.data;
    },
  });

  // 2. Fetch Payment History
  const { data: payments = [], isLoading: isPaymentsLoading } = useQuery({
    queryKey: ["tenant-payments"],
    queryFn: async () => {
      const response = await api.get("/tenant/billing/payments/");
      return response.data.results || response.data;
    },
  });

  // 3. Submit UTR Mutation
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
      setSubmitError("");
    },
    onError: (err) => {
      setSubmitError(
        err.response?.data?.error || "Failed to submit payment reference.",
      );
    },
  });

  const handleUtrSubmit = (e) => {
    e.preventDefault();
    if (!utrNumber.trim()) {
      setSubmitError("Please enter a valid UTR/Reference number.");
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

  if (isOrgLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center text-slate-400">
        <Loader2 className="h-8 w-8 animate-spin text-rose-500" />
      </div>
    );
  }

  const hasActiveSub = orgData?.has_active_subscription;

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
          <CreditCard className="h-6 w-6 text-rose-500" />
          Billing & Subscription
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Manage your organization's subscription plan and payment
          verifications.
        </p>
      </div>

      {/* --- Section 1: Current Overview --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Current Plan Card */}
        <Card
          className={`relative overflow-hidden bg-slate-900/60 backdrop-blur-md ${hasActiveSub ? "border-emerald-500/30" : "border-rose-500/30"}`}
        >
          <div
            className={`absolute -right-20 -top-20 h-40 w-40 rounded-full blur-[50px] pointer-events-none ${hasActiveSub ? "bg-emerald-500/10" : "bg-rose-500/20"}`}
          />

          <CardContent className="p-6">
            <div className="flex justify-between items-start mb-6">
              <div>
                <p className="text-sm font-medium text-slate-400 mb-1">
                  Subscription Status
                </p>
                <h3 className="text-2xl font-bold text-white flex items-center gap-2">
                  Standard Plan
                  {hasActiveSub ? (
                    <Badge
                      variant="success"
                      className="ml-2 bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                    >
                      Active
                    </Badge>
                  ) : (
                    <Badge
                      variant="danger"
                      className="ml-2 bg-rose-500/10 text-rose-400 border-rose-500/20"
                    >
                      Expired
                    </Badge>
                  )}
                </h3>
              </div>
              <div
                className={`h-10 w-10 rounded-full flex items-center justify-center border ${hasActiveSub ? "bg-emerald-500/10 border-emerald-500/20" : "bg-rose-500/10 border-rose-500/20"}`}
              >
                <Zap
                  className={`h-5 w-5 ${hasActiveSub ? "text-emerald-500" : "text-rose-500"}`}
                />
              </div>
            </div>

            <div className="space-y-1 mb-6">
              <p className="text-sm text-slate-400 flex items-center gap-1.5">
                <ShieldCheck
                  className={`h-4 w-4 ${hasActiveSub ? "text-emerald-500" : "text-slate-500"}`}
                />
                {hasActiveSub
                  ? `Valid until ${formatDate(orgData.subscription_expires_at)}`
                  : "No active billing cycle."}
              </p>
            </div>

            {!hasActiveSub && (
              <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg flex items-start gap-2 text-amber-400 text-sm">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <p>
                  Your subscription is inactive. You must submit a payment to
                  continue using the BloodConnect platform.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Payment Method & Action Card */}
        <Card className="border-slate-800 bg-slate-900/60 backdrop-blur-md">
          <CardContent className="p-6 flex flex-col h-full justify-between">
            <div>
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="text-sm font-medium text-slate-400 mb-1">
                    Extend Subscription
                  </p>
                  <h3 className="text-3xl font-bold text-white flex items-center gap-2">
                    ₹999{" "}
                    <span className="text-sm font-normal text-slate-400">
                      / 1 Year
                    </span>
                  </h3>
                </div>
                <div className="h-10 w-10 bg-slate-800 rounded-md flex items-center justify-center border border-slate-700">
                  <CreditCard className="h-5 w-5 text-slate-500" />
                </div>
              </div>
              <p className="text-sm text-slate-400 mb-6">
                Scan the QR code to pay via UPI, then submit your Reference
                Number (UTR) below for manual verification by our team.
              </p>
            </div>

            <Button
              variant="primary"
              className="w-full gap-2"
              onClick={() => setIsModalOpen(true)}
            >
              Pay & Submit UTR <ArrowRight className="h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* --- Section 2: Billing History --- */}
      <div>
        <h3 className="text-lg font-bold text-white mb-4 border-b border-slate-800 pb-2 flex items-center justify-between">
          Payment History
        </h3>
        <Card className="border-slate-800 bg-slate-900/60 backdrop-blur-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-900/80 text-xs uppercase text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="px-6 py-4 font-medium">Transaction ID</th>
                  <th className="px-6 py-4 font-medium">Date Submitted</th>
                  <th className="px-6 py-4 font-medium">Amount</th>
                  <th className="px-6 py-4 font-medium">UTR Reference</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {isPaymentsLoading ? (
                  <tr>
                    <td
                      colSpan="5"
                      className="px-6 py-12 text-center text-slate-500"
                    >
                      <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-rose-500" />
                      Loading transactions...
                    </td>
                  </tr>
                ) : payments.length === 0 ? (
                  <tr>
                    <td
                      colSpan="5"
                      className="px-6 py-12 text-center text-slate-500"
                    >
                      No payment history found.
                    </td>
                  </tr>
                ) : (
                  payments.map((payment) => (
                    <tr
                      key={payment.id}
                      className="hover:bg-slate-800/30 transition-colors"
                    >
                      <td className="px-6 py-4 font-medium text-white flex items-center gap-2">
                        <Receipt className="h-4 w-4 text-slate-500" />
                        TXN-{payment.id.toString().padStart(4, "0")}
                      </td>
                      <td className="px-6 py-4 text-slate-400">
                        {formatDate(payment.created_at)}
                      </td>
                      <td className="px-6 py-4">₹{payment.amount}</td>
                      <td className="px-6 py-4 font-mono text-slate-400">
                        {payment.upi_reference}
                      </td>
                      <td className="px-6 py-4">
                        {payment.status === "APPROVED" ? (
                          <Badge variant="success" className="gap-1">
                            <CheckCircle2 className="h-3 w-3" /> Approved
                          </Badge>
                        ) : payment.status === "REJECTED" ? (
                          <Badge variant="danger" className="gap-1">
                            <XCircle className="h-3 w-3" /> Rejected
                          </Badge>
                        ) : (
                          <Badge variant="warning" className="gap-1">
                            <Clock className="h-3 w-3" /> Pending
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

      {/* --- Submit UTR Modal --- */}
      <Modal
        isOpen={isModalOpen}
        onClose={() =>
          !submitPaymentMutation.isPending && setIsModalOpen(false)
        }
        title="Submit Payment"
      >
        <div className="space-y-6">
          {/* Static QR Code Display */}
          <div className="bg-white p-4 rounded-xl flex flex-col items-center justify-center max-w-62.5 mx-auto border-4 border-slate-200">
            {/* Replace this with your actual business QR Code image */}
            <div className="h-48 w-48 bg-slate-100 flex flex-col items-center justify-center text-slate-400 border-2 border-dashed border-slate-300 mb-2">
              <QrCode className="h-12 w-12 mb-2 text-slate-300" />
              <span className="text-xs font-bold uppercase tracking-widest text-slate-400">
                Place QR Here
              </span>
            </div>
            <p className="text-slate-800 font-bold">Scan to Pay ₹999</p>
            <p className="text-slate-500 text-xs">BloodConnect Official</p>
          </div>

          <form
            onSubmit={handleUtrSubmit}
            className="space-y-4 pt-4 border-t border-slate-800"
          >
            {submitError && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg flex items-center gap-2 text-rose-400 text-sm">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <p>{submitError}</p>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">
                12-Digit UPI Reference Number (UTR)
              </label>
              <Input
                placeholder="e.g., 312345678901"
                className="bg-slate-950 font-mono"
                value={utrNumber}
                onChange={(e) => setUtrNumber(e.target.value)}
                required
              />
              <p className="text-xs text-slate-500">
                After paying, enter the transaction reference number provided by
                your UPI app (GPay, PhonePe, Paytm).
              </p>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setIsModalOpen(false)}
                disabled={submitPaymentMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={submitPaymentMutation.isPending}
              >
                {submitPaymentMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />{" "}
                    Submitting...
                  </>
                ) : (
                  "Submit for Verification"
                )}
              </Button>
            </div>
          </form>
        </div>
      </Modal>
    </div>
  );
}
