import { useState, useEffect } from "react";
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
} from "lucide-react";
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
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isProcessing, setIsProcessing] = useState(null); // Track which ID is processing

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      const response = await api.get("/superadmin/dashboard-stats/");
      setData(response.data);
    } catch (err) {
      console.error("Error fetching global stats:", err);
      setError("Failed to load platform statistics.");
    } finally {
      setIsLoading(false);
    }
  };

  const updateOrgStatus = async (id, newStatus, orgName) => {
    const action = newStatus === "ACTIVE" ? "approve" : "reject";
    if (!window.confirm(`Are you sure you want to ${action} ${orgName}?`))
      return;

    setIsProcessing(id);
    try {
      await api.patch(`/superadmin/organizations/${id}/status/`, {
        status: newStatus,
      });

      // Remove the processed org from the UI and update counts
      setData((prev) => ({
        ...prev,
        pendingOrgs: prev.pendingOrgs.filter((org) => org.id !== id),
        globalStats: {
          ...prev.globalStats,
          pendingApprovals: prev.globalStats.pendingApprovals - 1,
          activeSubscriptions:
            newStatus === "ACTIVE"
              ? prev.globalStats.activeSubscriptions + 1
              : prev.globalStats.activeSubscriptions,
        },
      }));
    } catch (err) {
      alert(`Failed to ${action} organization. Please try again.`);
    } finally {
      setIsProcessing(null);
    }
  };

  const getLogIcon = (type) => {
    switch (type) {
      case "billing":
        return <TrendingUp className="h-4 w-4 text-emerald-500" />;
      case "system":
        return <Activity className="h-4 w-4 text-blue-500" />;
      case "support":
        return <ShieldAlert className="h-4 w-4 text-amber-500" />;
      case "analytics":
        return <Globe2 className="h-4 w-4 text-purple-500" />;
      default:
        return <Clock className="h-4 w-4 text-slate-500" />;
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center text-slate-400">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col h-[60vh] items-center justify-center text-rose-400">
        <AlertCircle className="h-12 w-12 mb-4 opacity-50" />
        <p>{error}</p>
        <Button variant="outline" className="mt-4" onClick={fetchDashboardData}>
          Retry
        </Button>
      </div>
    );
  }

  const { globalStats, pendingOrgs, systemLogs } = data;

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <Globe2 className="h-6 w-6 text-emerald-500" />
            Super Admin Platform Overview
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Monitor global metrics, manage tenant organizations, and track
            platform health.
          </p>
        </div>
      </div>

      {/* --- Section 1: Key Platform Metrics --- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-slate-900/40 border-slate-800">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-400 mb-1">
                Total Organizations
              </p>
              <p className="text-3xl font-bold text-white">
                {globalStats.totalOrganizations}
              </p>
            </div>
            <div className="h-12 w-12 rounded-full bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
              <Building2 className="h-6 w-6 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/40 border-rose-500/20 shadow-[0_0_15px_rgba(225,29,72,0.05)]">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-rose-400 mb-1">
                Global Donors
              </p>
              <p className="text-3xl font-bold text-white">
                {globalStats.globalDonors.toLocaleString()}
              </p>
            </div>
            <div className="h-12 w-12 rounded-full bg-rose-500/10 flex items-center justify-center border border-rose-500/20">
              <Users className="h-6 w-6 text-rose-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/40 border-emerald-500/20">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-emerald-400 mb-1">
                Active Tenants
              </p>
              <p className="text-3xl font-bold text-white">
                {globalStats.activeSubscriptions}
              </p>
            </div>
            <div className="h-12 w-12 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
              <TrendingUp className="h-6 w-6 text-emerald-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/40 border-amber-500/20">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-amber-400 mb-1">
                Pending Approvals
              </p>
              <p className="text-3xl font-bold text-white">
                {globalStats.pendingApprovals}
              </p>
            </div>
            <div className="h-12 w-12 rounded-full bg-amber-500/10 flex items-center justify-center border border-amber-500/20">
              <ShieldAlert className="h-6 w-6 text-amber-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* --- Section 2: Action Center & Logs --- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Organization Approvals */}
        <Card className="border-slate-800 bg-slate-900/60 backdrop-blur-md">
          <CardHeader className="border-b border-slate-800 pb-4">
            <CardTitle>Action Required: Organization Onboarding</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            {pendingOrgs.length > 0 ? (
              <div className="space-y-4">
                {pendingOrgs.map((org) => (
                  <div
                    key={org.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-slate-800 bg-slate-950"
                  >
                    <div>
                      <h4 className="font-semibold text-white flex items-center gap-2">
                        {org.name}
                        <Badge variant="default" className="text-[10px] py-0">
                          {org.type}
                        </Badge>
                      </h4>
                      <p className="text-sm text-slate-400 mt-1">
                        {org.location} • Applied {org.date}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={isProcessing === org.id}
                        className="text-rose-400 border-rose-500/20 hover:bg-rose-500/10"
                        onClick={() =>
                          updateOrgStatus(org.id, "SUSPENDED", org.name)
                        }
                      >
                        <XCircle className="h-4 w-4 mr-1" /> Reject
                      </Button>
                      <Button
                        variant="primary"
                        size="sm"
                        disabled={isProcessing === org.id}
                        className="bg-emerald-600 hover:bg-emerald-700"
                        onClick={() =>
                          updateOrgStatus(org.id, "ACTIVE", org.name)
                        }
                      >
                        {isProcessing === org.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <CheckCircle2 className="h-4 w-4 mr-1" />
                        )}
                        Approve
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-slate-500">
                <CheckCircle2 className="h-12 w-12 mx-auto text-slate-700 mb-3" />
                <p>All caught up! No pending organization approvals.</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Global System Logs */}
        <Card className="border-slate-800 bg-slate-900/60 backdrop-blur-md">
          <CardHeader className="border-b border-slate-800 pb-4">
            <CardTitle>System Logs & Activity</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-6">
              {systemLogs.map((log, index) => (
                <div key={log.id} className="relative flex gap-4">
                  {/* Timeline connector */}
                  {index !== systemLogs.length - 1 && (
                    <div className="absolute left-4 top-8 bottom-[-24px] w-[1px] bg-slate-800" />
                  )}

                  {/* Icon */}
                  <div className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-slate-800 bg-slate-900">
                    {getLogIcon(log.type)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 pt-1">
                    <p className="text-sm font-medium text-slate-200">
                      {log.message}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">{log.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
