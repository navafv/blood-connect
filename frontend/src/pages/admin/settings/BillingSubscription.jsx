import React from "react";
import { useQuery } from "@tanstack/react-query";
import {
  CreditCard,
  Zap,
  CheckCircle2,
  Receipt,
  ShieldCheck,
  Loader2,
  AlertCircle,
  Phone,
  MessageCircle,
  RefreshCw,
  XCircle,
  Clock,
} from "lucide-react";

import { Card, CardContent } from "../../../components/ui/Card";
import { Badge } from "../../../components/ui/Badge";
import { Button } from "../../../components/ui/Button";
import api from "../../../lib/axios";

export default function BillingSubscription() {
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

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const adminPhone = "+919876543210";
  const whatsappMessage = orgData
    ? encodeURIComponent(
        `Hello, I need to activate my BlooDonate subscription for my organization: ${orgData.name}.`,
      )
    : "Hello, I need to activate my BlooDonate subscription.";

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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card
          className={`relative overflow-hidden bg-slate-900/60 backdrop-blur-xl shadow-2xl transition-colors duration-500 ${
            hasActiveSub ? "border-emerald-500/30" : "border-rose-500/40"
          }`}
        >
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

              {/* Updated Warning Card Text */}
              {!hasActiveSub && (
                <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-start gap-3 text-amber-400/90 text-sm animate-in fade-in zoom-in-95 duration-300">
                  <AlertTriangle className="h-5 w-5 shrink-0" />
                  <p className="leading-relaxed">
                    <strong className="block mb-1">
                      Subscription Required
                    </strong>
                    Your organization's software license is currently inactive.
                    Please renew your subscription to ensure uninterrupted
                    access to the platform. Failure to renew may result in
                    account suspension.
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

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
                To activate or renew your subscription, please contact our
                System Administrator directly to complete the payment process
                manually.
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <button
                onClick={() =>
                  window.open(
                    `https://wa.me/${adminPhone.replace("+", "")}?text=${whatsappMessage}`,
                    "_blank",
                  )
                }
                className="w-full flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold h-12 rounded-xl transition-all shadow-lg shadow-[#25D366]/20"
              >
                <MessageCircle className="h-5 w-5" /> Message on WhatsApp
              </button>

              <button
                onClick={() => window.open(`tel:${adminPhone}`, "_self")}
                className="w-full flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-white font-bold h-12 rounded-xl transition-all border border-slate-700"
              >
                <Phone className="h-5 w-5" /> Call Administrator
              </button>
            </div>
          </CardContent>
        </Card>
      </div>

      {payments.length > 0 && (
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
                  {payments.map((payment) => (
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
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
