import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Users,
  Droplet,
  Activity,
  AlertCircle,
  Plus,
  Clock,
  UserPlus,
  Loader2,
} from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import api from "../../lib/axios";

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

export default function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await api.get("/tenant/dashboard-stats/");
        setStats(response.data);
      } catch (err) {
        console.error("Failed to load dashboard stats", err);
        setError("Could not load dashboard statistics.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchStats();
  }, []);

  const getActivityStyling = (action) => {
    switch (action) {
      case "DONATION_LOGGED":
        return { icon: Droplet, color: "text-rose-500", bg: "bg-rose-500/10" };
      case "DONOR_ADDED":
        return {
          icon: UserPlus,
          color: "text-emerald-500",
          bg: "bg-emerald-500/10",
        };
      case "STATUS_UPDATE":
        return {
          icon: Activity,
          color: "text-amber-500",
          bg: "bg-amber-500/10",
        };
      default:
        return { icon: Clock, color: "text-slate-500", bg: "bg-slate-500/10" };
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center text-slate-400">
        <Loader2 className="h-8 w-8 animate-spin text-rose-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col h-[60vh] items-center justify-center text-rose-400">
        <AlertCircle className="h-12 w-12 mb-4 opacity-50" />
        <p>{error}</p>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => window.location.reload()}
        >
          Retry
        </Button>
      </div>
    );
  }

  const { overview, bloodGroupDistribution, recentActivity } = stats;

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900 border border-slate-700 p-3 rounded-lg shadow-xl">
          <p className="text-slate-300 font-medium mb-1">
            Blood Group:{" "}
            <span className="text-white">{payload[0].payload.group}</span>
          </p>
          <p className="text-rose-400 font-bold flex items-center gap-2">
            <Droplet className="h-4 w-4" /> {payload[0].value} Donors
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Organization Dashboard
          </h1>
          <p className="text-sm text-slate-400">
            Welcome back! Here is a summary of your local registry.
          </p>
        </div>
        <Button
          variant="primary"
          className="gap-2"
          onClick={() => navigate("/admin/add-donor")}
        >
          <Plus className="h-4 w-4" /> Add New Donor
        </Button>
      </div>

      {/* Section 1: Key Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-slate-900/40">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-400 mb-1">
                Total Donors
              </p>
              <p className="text-3xl font-bold text-white">
                {overview.totalDonors}
              </p>
            </div>
            <div className="h-12 w-12 rounded-full bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
              <Users className="h-6 w-6 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/40 border-emerald-500/20">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-emerald-400 mb-1">
                Available Now
              </p>
              <p className="text-3xl font-bold text-white">
                {overview.availableDonors}
              </p>
            </div>
            <div className="h-12 w-12 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
              <Activity className="h-6 w-6 text-emerald-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/40 border-rose-500/20">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-rose-400 mb-1">
                Donated (30 Days)
              </p>
              <p className="text-3xl font-bold text-white">
                {overview.donationsThisMonth}
              </p>
            </div>
            <div className="h-12 w-12 rounded-full bg-rose-500/10 flex items-center justify-center border border-rose-500/20">
              <Droplet className="h-6 w-6 text-rose-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/40 border-amber-500/20">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-amber-400 mb-1">
                Pending Requests
              </p>
              <p className="text-3xl font-bold text-white">
                {overview.pendingRequests}
              </p>
            </div>
            <div className="h-12 w-12 rounded-full bg-amber-500/10 flex items-center justify-center border border-amber-500/20">
              <AlertCircle className="h-6 w-6 text-amber-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Section 2: Charts and Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader className="border-b border-slate-800 pb-4">
            <CardTitle>Blood Group Distribution</CardTitle>
          </CardHeader>
          <CardContent className="pt-6 h-100">
            {bloodGroupDistribution.length === 0 ? (
              <div className="flex h-full items-center justify-center">
                <p className="text-slate-500">No donors registered yet.</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={bloodGroupDistribution}
                  margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#1e293b"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="group"
                    stroke="#64748b"
                    tick={{ fill: "#94a3b8", fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    stroke="#64748b"
                    tick={{ fill: "#94a3b8", fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip
                    content={<CustomTooltip />}
                    cursor={{ fill: "#1e293b", opacity: 0.4 }}
                  />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]} maxBarSize={50}>
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
            )}
          </CardContent>
        </Card>

        {/* Recent Activity Feed */}
        <Card>
          <CardHeader className="border-b border-slate-800 pb-4">
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-6">
              {recentActivity.length === 0 ? (
                <p className="text-slate-500 text-center py-8">
                  No recent activity.
                </p>
              ) : (
                recentActivity.map((activity, index) => {
                  const style = getActivityStyling(activity.action);
                  const Icon = style.icon;

                  return (
                    <div key={activity.id} className="relative flex gap-4">
                      {index !== recentActivity.length - 1 && (
                        <div className="absolute left-4 top-8 -bottom-6 w-px bg-slate-800" />
                      )}
                      <div
                        className={`relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-slate-800/50 ${style.bg}`}
                      >
                        <Icon className={`h-4 w-4 ${style.color}`} />
                      </div>
                      <div className="flex-1 pt-1">
                        <p className="text-sm font-medium text-slate-200">
                          {activity.message}
                        </p>
                        <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
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
            <Button
              variant="outline"
              className="w-full mt-6 text-sm"
              onClick={() => navigate("/admin/donors")}
            >
              View All Donors
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
