import React from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  Users,
  Droplet,
  Activity,
  AlertCircle,
  Plus,
  Clock,
  UserPlus,
  Loader2,
  RefreshCw,
  ServerCrash,
  LayoutDashboard,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  CartesianGrid,
} from "recharts";
import toast from "react-hot-toast";

import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import api from "../../lib/axios";

export default function Dashboard() {
  const navigate = useNavigate();

  // --- Data Synchronization Pipeline ---
  const {
    data: stats,
    isLoading,
    isError,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ["tenant-dashboard-stats"],
    queryFn: async () => {
      const response = await api.get("/tenant/dashboard-stats/");
      return response.data;
    },
    // Failsafe: Dashboard data is critical, retry once before failing
    retry: 1,
  });

  const getActivityStyling = (action) => {
    switch (action) {
      case "DONATION_LOGGED":
        return {
          icon: Droplet,
          color: "text-rose-500",
          bg: "bg-rose-500/10",
          border: "border-rose-500/20",
        };
      case "DONOR_ADDED":
        return {
          icon: UserPlus,
          color: "text-emerald-500",
          bg: "bg-emerald-500/10",
          border: "border-emerald-500/20",
        };
      case "STATUS_UPDATE":
        return {
          icon: Activity,
          color: "text-amber-500",
          bg: "bg-amber-500/10",
          border: "border-amber-500/20",
        };
      default:
        return {
          icon: Clock,
          color: "text-slate-400",
          bg: "bg-slate-800/80",
          border: "border-slate-700",
        };
    }
  };

  // --- Fault Tolerance: Error State ---
  if (isError) {
    return (
      <div className="flex flex-col h-[60vh] items-center justify-center text-center animate-in fade-in duration-500">
        <div className="h-20 w-20 rounded-2xl bg-rose-500/10 flex items-center justify-center border border-rose-500/20 mb-6 shadow-inner">
          <ServerCrash className="h-10 w-10 text-rose-500" />
        </div>
        <h3 className="text-2xl font-bold text-white mb-2 tracking-tight">
          Telemetry Failure
        </h3>
        <p className="text-slate-400 max-w-md mb-6 leading-relaxed">
          Unable to synchronize facility statistics with the central database.
        </p>
        <Button
          variant="outline"
          className="gap-2 rounded-xl border-slate-700 bg-slate-900/50"
          onClick={() => refetch()}
        >
          <RefreshCw className="h-4 w-4" /> Re-establish Connection
        </Button>
      </div>
    );
  }

  // --- Loading State ---
  if (isLoading) {
    return (
      <div className="flex flex-col h-[60vh] items-center justify-center text-slate-400 gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-rose-500" />
        <span className="text-sm font-bold tracking-widest uppercase text-slate-500">
          Aggregating Metrics...
        </span>
      </div>
    );
  }

  const { overview, bloodGroupDistribution, recentActivity } = stats;

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900/95 backdrop-blur-xl border border-slate-700 p-4 rounded-xl shadow-2xl">
          <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">
            Blood Group{" "}
            <span className="text-white ml-1 text-sm font-black">
              {payload[0].payload.group}
            </span>
          </p>
          <p className="text-rose-400 font-black flex items-center gap-2 text-lg tracking-tight">
            <Droplet className="h-5 w-5 fill-rose-500/20" /> {payload[0].value}{" "}
            Available
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* --- Workspace Header --- */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-800/80 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight mb-2 flex items-center gap-3">
            <div className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/20 shadow-inner">
              <LayoutDashboard className="h-6 w-6 text-rose-500" />
            </div>
            Workspace Overview
          </h1>
          <div className="flex items-center gap-3">
            <span className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <p className="text-sm font-medium text-slate-400">
              Facility metrics synchronized{" "}
              <span className="text-slate-500 font-normal ml-1">
                (Live Sync)
              </span>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              refetch();
              toast.success("Metrics synchronized.", { icon: "🔄" });
            }}
            disabled={isRefetching}
            className="border-slate-700 bg-slate-900/50 hover:bg-slate-800 text-slate-300 h-10 px-3"
            title="Force Sync"
          >
            <RefreshCw
              className={`h-4 w-4 ${isRefetching ? "animate-spin" : ""}`}
            />
          </Button>
          <Button
            variant="primary"
            className="gap-2 shadow-lg hover:shadow-rose-500/20 transition-all font-bold h-10"
            onClick={() => navigate("/admin/add-donor")}
          >
            <Plus className="h-5 w-5" /> Register Donor
          </Button>
        </div>
      </div>

      {/* --- Key Performance Indicators (KPI) Matrix --- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Metric 1 */}
        <Card className="group bg-slate-900/40 border-slate-800/60 hover:bg-slate-900/60 transition-all duration-300 hover:-translate-y-1 overflow-hidden relative shadow-lg">
          <div
            className="absolute top-0 right-0 p-12 bg-blue-500/5 rounded-full blur-2xl group-hover:bg-blue-500/10 transition-colors"
            aria-hidden="true"
          />
          <CardContent className="p-6 flex items-center justify-between relative z-10">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                Total Donors
              </p>
              <p className="text-4xl font-black text-white tracking-tight">
                {overview.totalDonors}
              </p>
            </div>
            <div className="h-14 w-14 rounded-2xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20 group-hover:scale-110 transition-transform duration-300 shadow-inner">
              <Users className="h-7 w-7 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        {/* Metric 2 */}
        <Card className="group bg-slate-900/40 border-slate-800/60 hover:bg-slate-900/60 transition-all duration-300 hover:-translate-y-1 overflow-hidden relative shadow-lg">
          <div
            className="absolute top-0 right-0 p-12 bg-emerald-500/5 rounded-full blur-2xl group-hover:bg-emerald-500/10 transition-colors"
            aria-hidden="true"
          />
          <CardContent className="p-6 flex items-center justify-between relative z-10">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                Available Now
              </p>
              <p className="text-4xl font-black text-white tracking-tight">
                {overview.availableDonors}
              </p>
            </div>
            <div className="h-14 w-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 group-hover:scale-110 transition-transform duration-300 shadow-inner">
              <Activity className="h-7 w-7 text-emerald-500" />
            </div>
          </CardContent>
        </Card>

        {/* Metric 3 */}
        <Card className="group bg-slate-900/40 border-slate-800/60 hover:bg-slate-900/60 transition-all duration-300 hover:-translate-y-1 overflow-hidden relative shadow-lg">
          <div
            className="absolute top-0 right-0 p-12 bg-rose-500/5 rounded-full blur-2xl group-hover:bg-rose-500/10 transition-colors"
            aria-hidden="true"
          />
          <CardContent className="p-6 flex items-center justify-between relative z-10">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                Donated (30d)
              </p>
              <p className="text-4xl font-black text-white tracking-tight">
                {overview.donationsThisMonth}
              </p>
            </div>
            <div className="h-14 w-14 rounded-2xl bg-rose-500/10 flex items-center justify-center border border-rose-500/20 group-hover:scale-110 transition-transform duration-300 shadow-inner">
              <Droplet className="h-7 w-7 text-rose-500 fill-rose-500/20" />
            </div>
          </CardContent>
        </Card>

        {/* Metric 4 */}
        <Card className="group bg-slate-900/40 border-slate-800/60 hover:bg-slate-900/60 transition-all duration-300 hover:-translate-y-1 overflow-hidden relative shadow-lg">
          <div
            className="absolute top-0 right-0 p-12 bg-amber-500/5 rounded-full blur-2xl group-hover:bg-amber-500/10 transition-colors"
            aria-hidden="true"
          />
          <CardContent className="p-6 flex items-center justify-between relative z-10">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                Pending Action
              </p>
              <p className="text-4xl font-black text-white tracking-tight">
                {overview.pendingRequests}
              </p>
            </div>
            <div className="h-14 w-14 rounded-2xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20 group-hover:scale-110 transition-transform duration-300 shadow-inner">
              <AlertCircle className="h-7 w-7 text-amber-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* --- Visualization & Telemetry --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Hematological Distribution Chart */}
        <Card className="lg:col-span-2 bg-slate-900/40 border-slate-800/60 backdrop-blur-xl shadow-xl flex flex-col">
          <CardHeader className="border-b border-slate-800/60 pb-5">
            <CardTitle className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
              <Activity className="h-5 w-5 text-rose-500" /> Active Inventory
              Distribution
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-8 flex-1 min-h-87.5">
            {bloodGroupDistribution.length === 0 ? (
              <div className="flex flex-col h-full items-center justify-center text-center animate-in fade-in">
                <div className="h-16 w-16 bg-slate-800/50 border border-slate-700 rounded-full flex items-center justify-center mb-4 shadow-inner">
                  <Droplet className="h-8 w-8 text-slate-500" />
                </div>
                <h3 className="text-lg font-bold text-white mb-1">
                  Insufficient Data
                </h3>
                <p className="text-sm text-slate-400">
                  Register donors to populate the distribution visualizer.
                </p>
              </div>
            ) : (
              <div className="h-full w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={bloodGroupDistribution}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#1e293b"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="group"
                    stroke="#64748b"
                    tick={{ fill: "#94a3b8", fontSize: 13, fontWeight: 700 }}
                    axisLine={false}
                    tickLine={false}
                    dy={10}
                  />
                  <YAxis
                    stroke="#64748b"
                    tick={{ fill: "#64748b", fontSize: 12, fontWeight: 500 }}
                    axisLine={false}
                    tickLine={false}
                    allowDecimals={false}
                    dx={-10}
                  />
                  <Tooltip
                    content={<CustomTooltip />}
                    cursor={{ fill: "#1e293b", opacity: 0.4 }}
                  />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]} maxBarSize={50}>
                    {bloodGroupDistribution.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.count > 0 ? "#e11d48" : "#334155"}
                        className="hover:opacity-80 transition-opacity cursor-pointer"
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Audit Log / Event Feed */}
        <Card className="bg-slate-900/40 border-slate-800/60 backdrop-blur-xl shadow-xl flex flex-col">
          <CardHeader className="border-b border-slate-800/60 pb-5">
            <CardTitle className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
              <Clock className="h-5 w-5 text-blue-500" /> Facility Audit Log
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 flex-1 flex flex-col">
            <div className="space-y-7 flex-1">
              {recentActivity.length === 0 ? (
                <div className="flex flex-col h-full items-center justify-center text-center">
                  <p className="text-sm font-medium text-slate-500">
                    System idle.
                  </p>
                </div>
              ) : (
                recentActivity.map((activity, index) => {
                  const style = getActivityStyling(activity.action);
                  const Icon = style.icon;

                  return (
                    <div
                      key={activity.id}
                      className="relative flex gap-5 group"
                    >
                      {/* Connection Timeline Node */}
                      {index !== recentActivity.length - 1 && (
                        <div
                          className="absolute left-5 top-10 -bottom-8 w-px bg-slate-800 group-hover:bg-slate-700 transition-colors"
                          aria-hidden="true"
                        />
                      )}

                      <div
                        className={`relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border shadow-inner transition-colors ${style.bg} ${style.border}`}
                      >
                        <Icon className={`h-5 w-5 ${style.color}`} />
                      </div>

                      <div className="flex-1 pt-1.5 pb-2">
                        <p className="text-sm font-bold text-slate-200 leading-tight">
                          {activity.message}
                        </p>
                        <p className="text-xs font-medium text-slate-500 mt-1.5 font-mono">
                          {new Date(activity.timestamp).toLocaleString([], {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="pt-6 mt-4 border-t border-slate-800/60">
              <Button
                variant="outline"
                className="w-full text-sm font-bold border-slate-700 bg-slate-900/50 hover:bg-slate-800 hover:text-white transition-colors rounded-xl h-11 shadow-sm"
                onClick={() => navigate("/admin/donors")}
              >
                View Full Registry
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
