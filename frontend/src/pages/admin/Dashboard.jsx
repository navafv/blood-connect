import React from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  Users,
  Droplet,
  Activity,
  Plus,
  Clock,
  UserPlus,
  Loader2,
  RefreshCw,
  ServerCrash,
  LayoutDashboard,
  AlarmClock,
  TrendingUp,
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

// Distribution Tooltip
const DistributionTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white/95 border-slate-200 dark:bg-slate-900/95 dark:border-slate-700 backdrop-blur-xl border p-4 rounded-xl shadow-2xl transition-colors duration-300">
        <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider mb-2 transition-colors duration-300">
          Blood Group{" "}
          <span className="text-slate-900 dark:text-white ml-1 text-sm font-black transition-colors duration-300">
            {payload[0].payload.group}
          </span>
        </p>
        <p className="text-rose-600 dark:text-rose-400 font-black flex items-center gap-2 text-lg tracking-tight transition-colors duration-300">
          <Droplet className="h-5 w-5 fill-rose-600/20 dark:fill-rose-500/20" />{" "}
          {payload[0].value} Available
        </p>
      </div>
    );
  }
  return null;
};

// --- [NEW] Trend Chart Tooltip ---
const TrendTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white/95 border-slate-200 dark:bg-slate-900/95 dark:border-slate-700 backdrop-blur-xl border p-4 rounded-xl shadow-2xl transition-colors duration-300">
        <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider mb-2 transition-colors duration-300">
          {payload[0].payload.month}
        </p>
        <p className="text-blue-600 dark:text-blue-400 font-black flex items-center gap-2 text-lg tracking-tight transition-colors duration-300">
          <TrendingUp className="h-5 w-5" /> {payload[0].value} Donations Logged
        </p>
      </div>
    );
  }
  return null;
};

export default function Dashboard() {
  const navigate = useNavigate();

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
    retry: 1,
  });

  const getActivityStyling = (action) => {
    switch (action) {
      case "DONATION_LOGGED":
        return {
          icon: Droplet,
          color: "text-rose-600 dark:text-rose-500",
          bg: "bg-rose-50 dark:bg-rose-500/10",
          border: "border-rose-200 dark:border-rose-500/20",
        };
      case "DONOR_ADDED":
        return {
          icon: UserPlus,
          color: "text-emerald-600 dark:text-emerald-500",
          bg: "bg-emerald-50 dark:bg-emerald-500/10",
          border: "border-emerald-200 dark:border-emerald-500/20",
        };
      case "STATUS_UPDATE":
        return {
          icon: Activity,
          color: "text-amber-600 dark:text-amber-500",
          bg: "bg-amber-50 dark:bg-amber-500/10",
          border: "border-amber-200 dark:border-amber-500/20",
        };
      default:
        return {
          icon: Clock,
          color: "text-slate-500 dark:text-slate-400",
          bg: "bg-slate-100 dark:bg-slate-800/80",
          border: "border-slate-200 dark:border-slate-700",
        };
    }
  };

  if (isError) {
    return (
      <div className="flex flex-col h-[60vh] items-center justify-center text-center animate-in fade-in duration-500">
        <div className="h-20 w-20 rounded-2xl bg-rose-50 border-rose-200 dark:bg-rose-500/10 dark:border-rose-500/20 flex items-center justify-center border mb-6 shadow-inner transition-colors duration-300">
          <ServerCrash className="h-10 w-10 text-rose-600 dark:text-rose-500 transition-colors duration-300" />
        </div>
        <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2 tracking-tight transition-colors duration-300">
          Telemetry Failure
        </h3>
        <p className="text-slate-600 dark:text-slate-400 max-w-md mb-6 leading-relaxed transition-colors duration-300">
          Unable to synchronize facility statistics with the central database.
        </p>
        <Button
          variant="outline"
          className="gap-2 rounded-xl transition-colors duration-300"
          onClick={() => refetch()}
        >
          <RefreshCw className="h-4 w-4" /> Re-establish Connection
        </Button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex flex-col h-[60vh] items-center justify-center text-slate-500 dark:text-slate-400 gap-4 transition-colors duration-300">
        <Loader2 className="h-10 w-10 animate-spin text-rose-600 dark:text-rose-500 transition-colors duration-300" />
        <span className="text-sm font-bold tracking-widest uppercase text-slate-600 dark:text-slate-500 transition-colors duration-300">
          Aggregating Metrics...
        </span>
      </div>
    );
  }

  const {
    overview,
    bloodGroupDistribution,
    monthlyDonationTrend,
    recentActivity,
  } = stats;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-200 dark:border-slate-800/80 pb-6 transition-colors duration-300">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-2 flex items-center gap-3 transition-colors duration-300">
            <div className="p-2 rounded-xl bg-rose-50 border-rose-200 dark:bg-rose-500/10 dark:border-rose-500/20 border shadow-inner transition-colors duration-300">
              <LayoutDashboard className="h-6 w-6 text-rose-600 dark:text-rose-500 transition-colors duration-300" />
            </div>
            Workspace Overview
          </h1>
          <div className="flex items-center gap-3">
            <span className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400 transition-colors duration-300">
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
            className="h-10 px-3 transition-colors duration-300"
            title="Force Sync"
          >
            <RefreshCw
              className={`h-4 w-4 ${isRefetching ? "animate-spin" : ""}`}
            />
          </Button>
          <Button
            variant="primary"
            className="gap-2 shadow-md hover:shadow-lg transition-all font-bold h-10 dark:shadow-lg dark:hover:shadow-rose-500/20"
            onClick={() => navigate("/admin/add-donor")}
          >
            <Plus className="h-5 w-5" /> Register Donor
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <Card className="group bg-white/60 border-slate-200 hover:bg-slate-50 dark:bg-slate-900/40 dark:border-slate-800/60 dark:hover:bg-slate-900/60 transition-all duration-300 hover:-translate-y-1 overflow-hidden relative shadow-lg backdrop-blur-sm">
          <div
            className="absolute top-0 right-0 p-12 bg-blue-500/10 dark:bg-blue-500/5 rounded-full blur-2xl group-hover:bg-blue-500/20 dark:group-hover:bg-blue-500/10 transition-colors duration-300"
            aria-hidden="true"
          />
          <CardContent className="p-6 flex items-center justify-between relative z-10">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 transition-colors duration-300">
                Total Donors
              </p>
              <p className="text-4xl font-black text-slate-900 dark:text-white tracking-tight transition-colors duration-300">
                {overview.totalDonors}
              </p>
            </div>
            <div className="h-14 w-14 rounded-2xl bg-blue-50 border-blue-200 dark:bg-blue-500/10 dark:border-blue-500/20 flex items-center justify-center border group-hover:scale-110 transition-all duration-300 shadow-inner">
              <Users className="h-7 w-7 text-blue-600 dark:text-blue-500 transition-colors duration-300" />
            </div>
          </CardContent>
        </Card>

        <Card className="group bg-white/60 border-slate-200 hover:bg-slate-50 dark:bg-slate-900/40 dark:border-slate-800/60 dark:hover:bg-slate-900/60 transition-all duration-300 hover:-translate-y-1 overflow-hidden relative shadow-lg backdrop-blur-sm">
          <div
            className="absolute top-0 right-0 p-12 bg-emerald-500/10 dark:bg-emerald-500/5 rounded-full blur-2xl group-hover:bg-emerald-500/20 dark:group-hover:bg-emerald-500/10 transition-colors duration-300"
            aria-hidden="true"
          />
          <CardContent className="p-6 flex items-center justify-between relative z-10">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 transition-colors duration-300">
                Available Now
              </p>
              <p className="text-4xl font-black text-slate-900 dark:text-white tracking-tight transition-colors duration-300">
                {overview.availableDonors}
              </p>
            </div>
            <div className="h-14 w-14 rounded-2xl bg-emerald-50 border-emerald-200 dark:bg-emerald-500/10 dark:border-emerald-500/20 flex items-center justify-center border group-hover:scale-110 transition-all duration-300 shadow-inner">
              <Activity className="h-7 w-7 text-emerald-600 dark:text-emerald-500 transition-colors duration-300" />
            </div>
          </CardContent>
        </Card>

        <Card className="group bg-white/60 border-slate-200 hover:bg-slate-50 dark:bg-slate-900/40 dark:border-slate-800/60 dark:hover:bg-slate-900/60 transition-all duration-300 hover:-translate-y-1 overflow-hidden relative shadow-lg backdrop-blur-sm">
          <div
            className="absolute top-0 right-0 p-12 bg-rose-500/10 dark:bg-rose-500/5 rounded-full blur-2xl group-hover:bg-rose-500/20 dark:group-hover:bg-rose-500/10 transition-colors duration-300"
            aria-hidden="true"
          />
          <CardContent className="p-6 flex items-center justify-between relative z-10">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 transition-colors duration-300">
                Donated (30d)
              </p>
              <p className="text-4xl font-black text-slate-900 dark:text-white tracking-tight transition-colors duration-300">
                {overview.donationsThisMonth}
              </p>
            </div>
            <div className="h-14 w-14 rounded-2xl bg-rose-50 border-rose-200 dark:bg-rose-500/10 dark:border-rose-500/20 flex items-center justify-center border group-hover:scale-110 transition-all duration-300 shadow-inner">
              <Droplet className="h-7 w-7 text-rose-600 fill-rose-600/20 dark:text-rose-500 dark:fill-rose-500/20 transition-colors duration-300" />
            </div>
          </CardContent>
        </Card>

        <Card className="group bg-white/60 border-slate-200 hover:bg-slate-50 dark:bg-slate-900/40 dark:border-slate-800/60 dark:hover:bg-slate-900/60 transition-all duration-300 hover:-translate-y-1 overflow-hidden relative shadow-lg backdrop-blur-sm">
          <div
            className="absolute top-0 right-0 p-12 bg-amber-500/10 dark:bg-amber-500/5 rounded-full blur-2xl group-hover:bg-amber-500/20 dark:group-hover:bg-amber-500/10 transition-colors duration-300"
            aria-hidden="true"
          />
          <CardContent className="p-6 flex items-center justify-between relative z-10">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 transition-colors duration-300">
                Available this week
              </p>
              <p className="text-4xl font-black text-slate-900 dark:text-white tracking-tight transition-colors duration-300">
                {overview.availableThisWeek}
              </p>
            </div>
            <div className="h-14 w-14 rounded-2xl bg-amber-50 border-amber-200 dark:bg-amber-500/10 dark:border-amber-500/20 flex items-center justify-center border group-hover:scale-110 transition-all duration-300 shadow-inner">
              <AlarmClock className="h-7 w-7 text-amber-600 dark:text-amber-500 transition-colors duration-300" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* --- [NEW] Vertical Charts Stack --- */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {/* Trend Chart */}
          <Card className="bg-white/60 border-slate-200 dark:bg-slate-900/40 dark:border-slate-800/60 backdrop-blur-xl shadow-xl flex flex-col transition-colors duration-300">
            <CardHeader className="border-b border-slate-200 dark:border-slate-800/60 pb-5 transition-colors duration-300">
              <CardTitle className="text-lg font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2 transition-colors duration-300">
                <TrendingUp className="h-5 w-5 text-blue-600 dark:text-blue-500 transition-colors duration-300" />{" "}
                6-Month Donation Trend
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-8 min-h-[280px]">
              <ResponsiveContainer width="100%" height={250}>
                <BarChart
                  data={monthlyDonationTrend}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    className="stroke-slate-200 dark:stroke-slate-800/50 transition-colors duration-300"
                  />
                  <XAxis
                    dataKey="month"
                    stroke="#64748b"
                    tick={{ fill: "#64748b", fontSize: 13, fontWeight: 700 }}
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
                    content={<TrendTooltip />}
                    cursor={{
                      className:
                        "fill-slate-100 dark:fill-slate-800/50 transition-colors duration-300",
                    }}
                  />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]} maxBarSize={50}>
                    {monthlyDonationTrend.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        className={`${
                          entry.count > 0
                            ? "fill-blue-600 dark:fill-blue-500"
                            : "fill-slate-200 dark:fill-slate-800"
                        } hover:opacity-80 transition-all cursor-pointer`}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Blood Group Distribution Chart */}
          <Card className="bg-white/60 border-slate-200 dark:bg-slate-900/40 dark:border-slate-800/60 backdrop-blur-xl shadow-xl flex flex-col transition-colors duration-300">
            <CardHeader className="border-b border-slate-200 dark:border-slate-800/60 pb-5 transition-colors duration-300">
              <CardTitle className="text-lg font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2 transition-colors duration-300">
                <Activity className="h-5 w-5 text-rose-600 dark:text-rose-500 transition-colors duration-300" />{" "}
                Active Inventory Distribution
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-8 min-h-[280px]">
              {bloodGroupDistribution.length === 0 ? (
                <div className="flex flex-col h-full items-center justify-center text-center animate-in fade-in py-12">
                  <div className="h-16 w-16 bg-slate-100 border-slate-200 dark:bg-slate-800/50 dark:border-slate-700 border rounded-full flex items-center justify-center mb-4 shadow-inner transition-colors duration-300">
                    <Droplet className="h-8 w-8 text-slate-400 dark:text-slate-500 transition-colors duration-300" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1 transition-colors duration-300">
                    Insufficient Data
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 transition-colors duration-300">
                    Register donors to populate the distribution visualizer.
                  </p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart
                    data={bloodGroupDistribution}
                    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      className="stroke-slate-200 dark:stroke-slate-800/50 transition-colors duration-300"
                    />
                    <XAxis
                      dataKey="group"
                      stroke="#64748b"
                      tick={{ fill: "#64748b", fontSize: 13, fontWeight: 700 }}
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
                      content={<DistributionTooltip />}
                      cursor={{
                        className:
                          "fill-slate-100 dark:fill-slate-800/50 transition-colors duration-300",
                      }}
                    />
                    <Bar dataKey="count" radius={[6, 6, 0, 0]} maxBarSize={50}>
                      {bloodGroupDistribution.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          className={`${
                            entry.count > 0
                              ? "fill-rose-600 dark:fill-rose-500"
                              : "fill-slate-200 dark:fill-slate-800"
                          } hover:opacity-80 transition-all cursor-pointer`}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>

        {/* --- Audit Log Column --- */}
        <Card className="bg-white/60 border-slate-200 dark:bg-slate-900/40 dark:border-slate-800/60 backdrop-blur-xl shadow-xl flex flex-col transition-colors duration-300 h-full">
          <CardHeader className="border-b border-slate-200 dark:border-slate-800/60 pb-5 transition-colors duration-300">
            <CardTitle className="text-lg font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2 transition-colors duration-300">
              <Clock className="h-5 w-5 text-emerald-600 dark:text-emerald-500 transition-colors duration-300" />{" "}
              Facility Audit Log
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 flex-1 flex flex-col">
            <div className="space-y-7 flex-1">
              {recentActivity.length === 0 ? (
                <div className="flex flex-col h-full items-center justify-center text-center py-20">
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
                      {index !== recentActivity.length - 1 && (
                        <div
                          className="absolute left-5 top-10 -bottom-8 w-px bg-slate-200 dark:bg-slate-800 group-hover:bg-slate-300 dark:group-hover:bg-slate-700 transition-colors duration-300"
                          aria-hidden="true"
                        />
                      )}

                      <div
                        className={`relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border shadow-inner transition-colors duration-300 ${style.bg} ${style.border}`}
                      >
                        <Icon
                          className={`h-5 w-5 transition-colors duration-300 ${style.color}`}
                        />
                      </div>

                      <div className="flex-1 pt-1.5 pb-2">
                        <p className="text-sm font-bold text-slate-800 dark:text-slate-200 leading-tight transition-colors duration-300">
                          {activity.message}
                        </p>
                        <p className="text-xs font-medium text-slate-500 mt-1.5 font-mono transition-colors duration-300">
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

            <div className="pt-6 mt-4 border-t border-slate-200 dark:border-slate-800/60 transition-colors duration-300">
              <Button
                variant="outline"
                className="w-full text-sm font-bold rounded-xl h-11 shadow-sm transition-colors duration-300"
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
