import React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Building2,
  Users,
  TrendingUp,
  Activity,
  Globe2,
  CheckCircle2,
  XCircle,
  Clock,
  ShieldAlert,
  Loader2,
  AlertCircle,
  RefreshCw,
  ServerCrash,
  MailWarning,
  MailCheck,
} from "lucide-react";
import toast from "react-hot-toast";

import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Badge } from "../../components/ui/Badge";
import api from "../../lib/axios";

export default function GlobalDashboard() {
  const queryClient = useQueryClient();

  // --- Query Pipeline: Fetch Global Telemetry ---
  const { data, isLoading, isError, refetch, isRefetching } = useQuery({
    queryKey: ["superadmin-dashboard"],
    queryFn: async () => {
      const response = await api.get("/superadmin/dashboard-stats/");
      return response.data;
    },
    refetchInterval: 30000, // Auto-refresh global stats every 30 seconds
  });

  // --- Query Pipeline: Organizations for Email Checks (Safe Fallback) ---
  // To ensure the email verified badge always works even if the dashboard API doesn't return it
  const { data: fullOrgsList = [] } = useQuery({
    queryKey: ["superadmin-organizations"],
    queryFn: async () => {
      const res = await api.get("/superadmin/organizations/");
      return res.data.results || res.data;
    },
    staleTime: 60000,
  });

  // --- Mutation Pipeline: Organization Moderation ---
  const updateOrgMutation = useMutation({
    mutationFn: async ({ id, status }) => {
      const response = await api.patch(
        `/superadmin/organizations/${id}/status/`,
        { status },
      );
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["superadmin-dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["superadmin-organizations"] });
      const actionStr = variables.status === "ACTIVE" ? "approved" : "rejected";
      toast.success(`Organization securely ${actionStr}.`);
    },
    onError: (err) => {
      console.error("Moderation Failure:", err);
      toast.error(
        err.response?.data?.error ||
          "Failed to process organization. Verify permissions.",
      );
    },
  });

  // --- Action Handlers ---
  const handleOrgStatusUpdate = (id, newStatus, orgName) => {
    const action = newStatus === "ACTIVE" ? "approve" : "reject";
    if (
      !window.confirm(
        `Are you sure you want to ${action} the tenant workspace for ${orgName}?`,
      )
    ) {
      return;
    }
    updateOrgMutation.mutate({ id, status: newStatus });
  };

  // --- Formatters ---
  const getLogIcon = (type) => {
    switch (type) {
      case "billing":
        return (
          <TrendingUp className="h-4 w-4 transition-colors duration-300 text-emerald-600 dark:text-emerald-500" />
        );
      case "system":
        return (
          <Activity className="h-4 w-4 transition-colors duration-300 text-blue-600 dark:text-blue-500" />
        );
      case "support":
        return (
          <ShieldAlert className="h-4 w-4 transition-colors duration-300 text-amber-600 dark:text-amber-500" />
        );
      case "analytics":
        return (
          <Globe2 className="h-4 w-4 transition-colors duration-300 text-purple-600 dark:text-purple-500" />
        );
      default:
        return (
          <Clock className="h-4 w-4 transition-colors duration-300 text-slate-500 dark:text-slate-400" />
        );
    }
  };

  // Safe getter for email status using the full organization list fallback
  const getEmailStatus = (orgId) => {
    const org = fullOrgsList.find((o) => o.id === orgId);
    return org ? org.is_email_verified : undefined;
  };

  // --- UI Transition States ---
  if (isLoading) {
    return (
      <div className="flex flex-col h-[60vh] items-center justify-center gap-4 transition-colors duration-300 text-slate-500 dark:text-slate-400">
        <Loader2 className="h-10 w-10 animate-spin transition-colors duration-300 text-emerald-600 dark:text-emerald-500" />
        <span className="text-sm font-semibold tracking-widest uppercase">
          Aggregating Global Metrics...
        </span>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col h-[60vh] items-center justify-center text-center animate-in fade-in duration-500 transition-colors duration-300">
        <div className="h-20 w-20 rounded-2xl flex items-center justify-center border mb-6 shadow-inner transition-colors duration-300 bg-rose-50 border-rose-200 dark:bg-rose-500/10 dark:border-rose-500/20">
          <ServerCrash className="h-10 w-10 transition-colors duration-300 text-rose-600 dark:text-rose-500" />
        </div>
        <h3 className="text-2xl font-bold mb-2 transition-colors duration-300 text-slate-900 dark:text-white">
          Central Telemetry Failure
        </h3>
        <p className="max-w-md mb-6 leading-relaxed transition-colors duration-300 text-slate-600 dark:text-slate-400">
          Unable to establish connection with the central platform database.
        </p>
        <Button
          variant="outline"
          className="gap-2 rounded-xl transition-colors duration-300 bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-900/50 dark:text-slate-300 dark:hover:bg-slate-800"
          onClick={() => refetch()}
        >
          <RefreshCw className="h-4 w-4" /> Re-establish Connection
        </Button>
      </div>
    );
  }

  const { globalStats, pendingOrgs, systemLogs } = data;

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-24 p-6 transition-colors duration-300 bg-slate-50 dark:bg-slate-950">
      {/* --- Workspace Header --- */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b pb-6 transition-colors duration-300 border-slate-200 dark:border-slate-800/80">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-3 mb-2 transition-colors duration-300 text-slate-900 dark:text-white">
            <div className="p-2 rounded-xl border shadow-inner transition-colors duration-300 bg-emerald-50 border-emerald-200 dark:bg-emerald-500/10 dark:border-emerald-500/20">
              <Globe2 className="h-6 w-6 transition-colors duration-300 text-emerald-600 dark:text-emerald-500" />
            </div>
            Global Command Center
          </h1>
          <div className="flex items-center gap-3">
            <span className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <p className="text-sm font-medium transition-colors duration-300 text-slate-600 dark:text-slate-400">
              Platform nodes operational{" "}
              <span className="font-normal ml-1 transition-colors duration-300 text-slate-500 dark:text-slate-500">
                (Live Sync)
              </span>
            </p>
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            refetch();
            toast.success("Telemetry synchronized.", { icon: "🔄" });
          }}
          disabled={isRefetching}
          className="transition-colors duration-300 bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-900/50 dark:hover:bg-slate-800 dark:text-slate-300"
        >
          <RefreshCw
            className={`h-4 w-4 mr-2 ${isRefetching ? "animate-spin" : ""}`}
          />{" "}
          Force Sync
        </Button>
      </div>

      {/* --- Section 1: Key Platform Metrics --- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Metric 1 */}
        <Card className="group backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 overflow-hidden relative shadow-lg bg-white/60 border-slate-200 hover:bg-slate-50 dark:bg-slate-900/40 dark:border-slate-800/60 dark:hover:bg-slate-900/60">
          <div
            className="absolute top-0 right-0 p-12 rounded-full blur-2xl transition-colors duration-300 bg-blue-500/10 group-hover:bg-blue-500/20 dark:bg-blue-500/5 dark:group-hover:bg-blue-500/10"
            aria-hidden="true"
          />
          <CardContent className="p-6 flex items-center justify-between relative z-10">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider mb-2 transition-colors duration-300 text-slate-500 dark:text-slate-400">
                Total Tenants
              </p>
              <p className="text-4xl font-black tracking-tight transition-colors duration-300 text-slate-900 dark:text-white">
                {globalStats.totalOrganizations}
              </p>
            </div>
            <div className="h-14 w-14 rounded-2xl flex items-center justify-center border group-hover:scale-110 transition-transform duration-300 shadow-inner bg-blue-50 border-blue-200 dark:bg-blue-500/10 dark:border-blue-500/20">
              <Building2 className="h-7 w-7 transition-colors duration-300 text-blue-600 dark:text-blue-500" />
            </div>
          </CardContent>
        </Card>

        {/* Metric 2 */}
        <Card className="group backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 overflow-hidden relative shadow-lg bg-white/60 border-slate-200 hover:bg-slate-50 dark:bg-slate-900/40 dark:border-slate-800/60 dark:hover:bg-slate-900/60">
          <div
            className="absolute top-0 right-0 p-12 rounded-full blur-2xl transition-colors duration-300 bg-rose-500/10 group-hover:bg-rose-500/20 dark:bg-rose-500/5 dark:group-hover:bg-rose-500/10"
            aria-hidden="true"
          />
          <CardContent className="p-6 flex items-center justify-between relative z-10">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider mb-2 transition-colors duration-300 text-slate-500 dark:text-slate-400">
                Global Donors
              </p>
              <p className="text-4xl font-black tracking-tight transition-colors duration-300 text-slate-900 dark:text-white">
                {globalStats.globalDonors.toLocaleString()}
              </p>
            </div>
            <div className="h-14 w-14 rounded-2xl flex items-center justify-center border group-hover:scale-110 transition-transform duration-300 shadow-inner bg-rose-50 border-rose-200 dark:bg-rose-500/10 dark:border-rose-500/20">
              <Users className="h-7 w-7 transition-colors duration-300 text-rose-600 dark:text-rose-500" />
            </div>
          </CardContent>
        </Card>

        {/* Metric 3 */}
        <Card className="group backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 overflow-hidden relative shadow-lg bg-white/60 border-slate-200 hover:bg-slate-50 dark:bg-slate-900/40 dark:border-slate-800/60 dark:hover:bg-slate-900/60">
          <div
            className="absolute top-0 right-0 p-12 rounded-full blur-2xl transition-colors duration-300 bg-emerald-500/10 group-hover:bg-emerald-500/20 dark:bg-emerald-500/5 dark:group-hover:bg-emerald-500/10"
            aria-hidden="true"
          />
          <CardContent className="p-6 flex items-center justify-between relative z-10">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider mb-2 transition-colors duration-300 text-slate-500 dark:text-slate-400">
                Active Licenses
              </p>
              <p className="text-4xl font-black tracking-tight transition-colors duration-300 text-slate-900 dark:text-white">
                {globalStats.activeSubscriptions}
              </p>
            </div>
            <div className="h-14 w-14 rounded-2xl flex items-center justify-center border group-hover:scale-110 transition-transform duration-300 shadow-inner bg-emerald-50 border-emerald-200 dark:bg-emerald-500/10 dark:border-emerald-500/20">
              <TrendingUp className="h-7 w-7 transition-colors duration-300 text-emerald-600 dark:text-emerald-500" />
            </div>
          </CardContent>
        </Card>

        {/* Metric 4 */}
        <Card className="group backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 overflow-hidden relative shadow-lg bg-white/60 border-slate-200 hover:bg-slate-50 dark:bg-slate-900/40 dark:border-slate-800/60 dark:hover:bg-slate-900/60">
          <div
            className="absolute top-0 right-0 p-12 rounded-full blur-2xl transition-colors duration-300 bg-amber-500/10 group-hover:bg-amber-500/20 dark:bg-amber-500/5 dark:group-hover:bg-amber-500/10"
            aria-hidden="true"
          />
          <CardContent className="p-6 flex items-center justify-between relative z-10">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider mb-2 transition-colors duration-300 text-slate-500 dark:text-slate-400">
                Pending Review
              </p>
              <p className="text-4xl font-black tracking-tight transition-colors duration-300 text-slate-900 dark:text-white">
                {globalStats.pendingApprovals}
              </p>
            </div>
            <div className="h-14 w-14 rounded-2xl flex items-center justify-center border group-hover:scale-110 transition-transform duration-300 shadow-inner bg-amber-50 border-amber-200 dark:bg-amber-500/10 dark:border-amber-500/20">
              <ShieldAlert className="h-7 w-7 transition-colors duration-300 text-amber-600 dark:text-amber-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* --- Section 2: Action Center & Logs --- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Organization Approvals */}
        <Card className="backdrop-blur-xl shadow-xl flex flex-col transition-colors duration-300 bg-white/80 border-slate-200 dark:bg-slate-900/40 dark:border-slate-800/80">
          <CardHeader className="border-b pb-5 transition-colors duration-300 border-slate-200 dark:border-slate-800/60">
            <CardTitle className="text-lg font-bold tracking-tight flex items-center gap-2 transition-colors duration-300 text-slate-900 dark:text-white">
              <ShieldAlert className="h-5 w-5 transition-colors duration-300 text-amber-600 dark:text-amber-500" />{" "}
              Tenant Moderation Queue
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 flex-1 flex flex-col">
            {pendingOrgs.length > 0 ? (
              <div className="space-y-4">
                {pendingOrgs.map((org) => {
                  const isVerified = getEmailStatus(org.id);

                  return (
                    <div
                      key={org.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl border shadow-sm transition-colors duration-300 bg-white border-slate-200 hover:border-slate-300 dark:bg-slate-950/50 dark:border-slate-800 dark:hover:border-slate-700"
                    >
                      <div>
                        <div className="flex flex-wrap items-center gap-2 mb-1.5">
                          <h4 className="font-bold text-base transition-colors duration-300 text-slate-900 dark:text-white">
                            {org.name}
                          </h4>
                          <Badge
                            variant="default"
                            className="text-[10px] py-0.5 px-2 uppercase tracking-widest font-semibold transition-colors duration-300 bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700"
                          >
                            {org.type}
                          </Badge>
                          {/* Appended Email Verification Check directly inside the moderation queue */}
                          {isVerified !== undefined &&
                            (isVerified ? (
                              <Badge className="text-[10px] py-0.5 px-2 gap-1 uppercase tracking-widest transition-colors duration-300 bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20">
                                <MailCheck className="h-3 w-3" /> Verified
                              </Badge>
                            ) : (
                              <Badge className="text-[10px] py-0.5 px-2 gap-1 uppercase tracking-widest transition-colors duration-300 bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20">
                                <MailWarning className="h-3 w-3" /> Unverified
                              </Badge>
                            ))}
                        </div>
                        <p className="text-xs font-medium flex items-center gap-2 transition-colors duration-300 text-slate-500 dark:text-slate-400">
                          <span>
                            <Globe2 className="h-3 w-3 inline mr-1" />
                            {org.location}
                          </span>
                          <span>•</span>
                          <span>Applied: {org.date}</span>
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={
                            updateOrgMutation.isPending &&
                            updateOrgMutation.variables?.id === org.id
                          }
                          className="font-semibold transition-colors duration-300 bg-white border-rose-200 text-rose-600 hover:bg-rose-50 hover:text-rose-700 dark:bg-slate-900/50 dark:border-rose-500/20 dark:text-rose-400 dark:hover:bg-rose-500/10"
                          onClick={() =>
                            handleOrgStatusUpdate(org.id, "SUSPENDED", org.name)
                          }
                        >
                          {updateOrgMutation.isPending &&
                          updateOrgMutation.variables?.id === org.id &&
                          updateOrgMutation.variables?.status ===
                            "SUSPENDED" ? (
                            <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                          ) : (
                            <XCircle className="h-4 w-4 mr-1" />
                          )}
                          Reject
                        </Button>
                        <Button
                          variant="primary"
                          size="sm"
                          disabled={
                            updateOrgMutation.isPending &&
                            updateOrgMutation.variables?.id === org.id
                          }
                          className="font-semibold shadow-md hover:shadow-lg transition-all dark:shadow-lg"
                          onClick={() =>
                            handleOrgStatusUpdate(org.id, "ACTIVE", org.name)
                          }
                        >
                          {updateOrgMutation.isPending &&
                          updateOrgMutation.variables?.id === org.id &&
                          updateOrgMutation.variables?.status === "ACTIVE" ? (
                            <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                          ) : (
                            <CheckCircle2 className="h-4 w-4 mr-1" />
                          )}
                          Approve
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center flex-1 py-12 text-center animate-in fade-in duration-500">
                <div className="h-16 w-16 rounded-full flex items-center justify-center mb-4 shadow-inner border transition-colors duration-300 bg-slate-50 border-slate-200 dark:bg-slate-800/50 dark:border-slate-700">
                  <CheckCircle2 className="h-8 w-8 transition-colors duration-300 text-slate-400 dark:text-slate-500" />
                </div>
                <h3 className="text-lg font-bold mb-1 transition-colors duration-300 text-slate-900 dark:text-white">
                  Queue Empty
                </h3>
                <p className="text-sm transition-colors duration-300 text-slate-600 dark:text-slate-400">
                  All tenant applications have been processed.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Global System Logs */}
        <Card className="backdrop-blur-xl shadow-xl flex flex-col transition-colors duration-300 bg-white/80 border-slate-200 dark:bg-slate-900/40 dark:border-slate-800/80">
          <CardHeader className="border-b pb-5 transition-colors duration-300 border-slate-200 dark:border-slate-800/60">
            <CardTitle className="text-lg font-bold tracking-tight flex items-center gap-2 transition-colors duration-300 text-slate-900 dark:text-white">
              <Activity className="h-5 w-5 transition-colors duration-300 text-blue-600 dark:text-blue-500" />{" "}
              Platform Event Stream
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 flex-1">
            <div className="space-y-7">
              {systemLogs.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full">
                  <p className="text-sm transition-colors duration-300 text-slate-500 dark:text-slate-400">
                    No events recorded.
                  </p>
                </div>
              ) : (
                systemLogs.map((log, index) => (
                  <div key={log.id} className="relative flex gap-5 group">
                    {/* Timeline connector */}
                    {index !== systemLogs.length - 1 && (
                      <div
                        className="absolute left-5 top-10 -bottom-8 w-px transition-colors duration-300 bg-slate-200 group-hover:bg-slate-300 dark:bg-slate-800 dark:group-hover:bg-slate-700"
                        aria-hidden="true"
                      />
                    )}

                    {/* Icon wrapper */}
                    <div className="relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border shadow-inner transition-colors duration-300 bg-slate-50 border-slate-200 group-hover:bg-slate-100 dark:bg-slate-800/80 dark:border-slate-700/50 dark:group-hover:bg-slate-800">
                      {getLogIcon(log.type)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 pt-1.5 pb-2">
                      <p className="text-sm font-semibold leading-tight transition-colors duration-300 text-slate-800 dark:text-slate-200">
                        {log.message}
                      </p>
                      <p className="text-xs font-medium mt-1.5 font-mono transition-colors duration-300 text-slate-500 dark:text-slate-500">
                        {log.time}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
