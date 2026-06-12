import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Terminal,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  Loader2,
  AlertCircle,
  Info,
  AlertTriangle,
  XCircle,
  ServerCrash,
  RefreshCw,
} from "lucide-react";

import { Card } from "../../components/ui/Card";
import { Input } from "../../components/ui/Input";
import { Select } from "../../components/ui/Select";
import { Button } from "../../components/ui/Button";
import { Badge } from "../../components/ui/Badge";
import api from "../../lib/axios";

export default function SystemLogs() {
  const [pageUrl, setPageUrl] = useState("/superadmin/logs/");
  const [searchTerm, setSearchTerm] = useState("");
  const [levelFilter, setLevelFilter] = useState("ALL");

  // Fetch Logs via React Query
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["systemLogs", pageUrl, searchTerm, levelFilter],
    queryFn: async () => {
      // Append query parameters to support server-side filtering
      const params = new URLSearchParams();
      if (searchTerm) params.append("search", searchTerm);
      if (levelFilter !== "ALL") params.append("level", levelFilter);

      const res = await api.get(
        `${pageUrl}${pageUrl.includes("?") ? "&" : "?"}${params.toString()}`,
      );
      return res.data;
    },
    keepPreviousData: true,
  });

  const logs = data?.results || [];

  // Robust URL parsing to handle full domain URLs returned by Django's pagination
  const getRelativeUrl = (fullUrl) => {
    if (!fullUrl) return null;
    try {
      const urlObj = new URL(fullUrl);
      let path = urlObj.pathname;
      if (path.startsWith("/api")) {
        path = path.replace("/api", "");
      }
      return path + urlObj.search;
    } catch (e) {
      return fullUrl;
    }
  };

  const nextUrl = getRelativeUrl(data?.next);
  const prevUrl = getRelativeUrl(data?.previous);
  const totalCount = data?.count || 0;

  // Reset to Page 1 when searching or filtering
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setPageUrl("/superadmin/logs/");
  };

  const handleFilterChange = (e) => {
    setLevelFilter(e.target.value);
    setPageUrl("/superadmin/logs/");
  };

  const getLevelConfig = (level) => {
    switch (level) {
      case "INFO":
        return {
          icon: Info,
          badge:
            "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20",
        };
      case "WARNING":
        return {
          icon: AlertTriangle,
          badge:
            "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20",
        };
      case "ERROR":
      case "CRITICAL":
        return {
          icon: XCircle,
          badge:
            "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/10 dark:text-rose-500 dark:border-rose-500/20",
        };
      default:
        return {
          icon: Terminal,
          badge:
            "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700",
        };
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 pb-24 transition-colors duration-300 bg-slate-50 dark:bg-slate-950">
      {/* --- Workspace Header --- */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b pb-6 transition-colors duration-300 border-slate-200 dark:border-slate-800/80">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-3 transition-colors duration-300 text-slate-900 dark:text-white">
            <div className="p-1.5 rounded-lg border transition-colors duration-300 bg-rose-50 border-rose-200 dark:bg-rose-500/10 dark:border-rose-500/20">
              <Terminal className="h-5 w-5 transition-colors duration-300 text-rose-600 dark:text-rose-500" />
            </div>
            System Audit Logs
          </h1>
          <p className="text-sm mt-2 transition-colors duration-300 text-slate-600 dark:text-slate-400">
            Immutable trail of administrative actions and platform-level events.
          </p>
        </div>
      </div>

      {/* --- Search & Filter Toolbar --- */}
      <div className="flex flex-col sm:flex-row gap-4 p-5 rounded-2xl border shadow-sm backdrop-blur-md transition-colors duration-300 bg-white/80 border-slate-200 dark:bg-slate-900/40 dark:border-slate-800/60">
        <div className="relative w-full sm:w-96 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 transition-colors duration-300 text-slate-400 group-focus-within:text-rose-600 dark:text-slate-500 dark:group-focus-within:text-rose-500" />
          <Input
            placeholder="Search by source or message..."
            className="pl-11 h-11 transition-all duration-300 bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-rose-500 focus:ring-rose-500/20 dark:bg-slate-950/50 dark:border-slate-700 dark:text-white dark:placeholder:text-slate-500"
            value={searchTerm}
            onChange={handleSearchChange}
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 ml-2 transition-colors duration-300 text-slate-400 dark:text-slate-500" />
          <Select
            value={levelFilter}
            onChange={handleFilterChange}
            className="h-11 w-full sm:w-56 transition-colors duration-300 bg-white border-slate-200 text-slate-700 focus:border-rose-500 dark:bg-slate-950/50 dark:border-slate-700 dark:text-slate-300"
          >
            <option value="ALL">All Severity Levels</option>
            <option value="INFO">Info Only</option>
            <option value="WARNING">Warnings</option>
            <option value="ERROR">Errors / Critical</option>
          </Select>
        </div>
      </div>

      {/* --- Log Terminal Display --- */}
      <Card className="shadow-xl overflow-hidden transition-colors duration-300 bg-white border-slate-200 dark:border-slate-800/80 dark:bg-slate-950 dark:shadow-2xl">
        <div className="border-b px-6 py-3 flex items-center justify-between transition-colors duration-300 bg-slate-100/80 border-slate-200 dark:bg-slate-900/80 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="flex gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full transition-colors duration-300 bg-rose-400 dark:bg-rose-500/50" />
              <div className="w-2.5 h-2.5 rounded-full transition-colors duration-300 bg-amber-400 dark:bg-amber-500/50" />
              <div className="w-2.5 h-2.5 rounded-full transition-colors duration-300 bg-emerald-400 dark:bg-emerald-500/50" />
            </div>
            <span className="text-xs ml-3 font-mono tracking-tight uppercase transition-colors duration-300 text-slate-500 dark:text-slate-400">
              root@bloodonate:~# tail -f audit.log
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="transition-colors duration-300 text-slate-500 hover:text-slate-900 dark:hover:text-white"
            onClick={() => refetch()}
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>

        {/* --- DESKTOP VIEW (Table) --- */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left font-mono text-sm">
            <thead className="text-xs uppercase font-bold border-b transition-colors duration-300 bg-slate-50 text-slate-500 border-slate-200 dark:bg-slate-950/40 dark:border-slate-800/50">
              <tr>
                <th className="px-6 py-5">Timestamp</th>
                <th className="px-6 py-5">Severity</th>
                <th className="px-6 py-5">Source Context</th>
                <th className="px-6 py-5">Event Payload</th>
              </tr>
            </thead>
            <tbody className="divide-y transition-colors duration-300 divide-slate-200 text-slate-700 dark:divide-slate-800/50 dark:text-slate-300">
              {isLoading ? (
                <tr>
                  <td
                    colSpan="4"
                    className="px-6 py-24 text-center transition-colors duration-300 text-slate-500"
                  >
                    <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 transition-colors duration-300 text-rose-600 dark:text-rose-500" />
                    <p className="text-sm tracking-widest uppercase">
                      Connecting to stream...
                    </p>
                  </td>
                </tr>
              ) : isError ? (
                <tr>
                  <td colSpan="4" className="px-6 py-24 text-center">
                    <div className="h-16 w-16 rounded-full flex items-center justify-center mx-auto mb-4 transition-colors duration-300 bg-rose-50 dark:bg-rose-500/10">
                      <ServerCrash className="h-8 w-8 transition-colors duration-300 text-rose-600 dark:text-rose-500" />
                    </div>
                    <p className="font-medium transition-colors duration-300 text-rose-600 dark:text-rose-400">
                      Failed to read log stream.
                    </p>
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td
                    colSpan="4"
                    className="px-6 py-24 text-center transition-colors duration-300 text-slate-500"
                  >
                    No log entries match your criteria.
                  </td>
                </tr>
              ) : (
                logs.map((log) => {
                  const config = getLevelConfig(log.level);
                  const Icon = config.icon;

                  return (
                    <tr
                      key={log.id}
                      className="transition-colors duration-300 hover:bg-slate-50 dark:hover:bg-slate-900/50"
                    >
                      <td className="px-6 py-4 whitespace-nowrap font-medium transition-colors duration-300 text-slate-500 dark:text-slate-400">
                        {log.timestamp}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge
                          className={`transition-colors duration-300 ${config.badge} gap-1.5 font-bold uppercase`}
                        >
                          <Icon className="h-3 w-3" /> {log.level}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 font-medium transition-colors duration-300 text-slate-500 dark:text-slate-400">
                        [{log.source}]
                      </td>
                      <td className="px-6 py-4 transition-colors duration-300 text-slate-800 dark:text-slate-200">
                        {log.message}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* --- MOBILE VIEW (Cards) --- */}
        {/* FIX: Removed table tags (tr/td) inside div to prevent hydration errors */}
        <div className="md:hidden flex flex-col divide-y transition-colors duration-300 divide-slate-200 text-slate-700 dark:divide-slate-800/50 dark:text-slate-300">
          {isLoading ? (
            <div className="px-6 py-24 flex flex-col items-center justify-center transition-colors duration-300 text-slate-500">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 transition-colors duration-300 text-rose-600 dark:text-rose-500" />
              <p className="text-sm tracking-widest uppercase">
                Connecting to stream...
              </p>
            </div>
          ) : isError ? (
            <div className="px-6 py-24 flex flex-col items-center justify-center">
              <div className="h-16 w-16 rounded-full flex items-center justify-center mx-auto mb-4 transition-colors duration-300 bg-rose-50 dark:bg-rose-500/10">
                <ServerCrash className="h-8 w-8 transition-colors duration-300 text-rose-600 dark:text-rose-500" />
              </div>
              <p className="font-medium transition-colors duration-300 text-rose-600 dark:text-rose-400">
                Failed to read log stream.
              </p>
            </div>
          ) : logs.length === 0 ? (
            <div className="px-6 py-24 text-center transition-colors duration-300 text-slate-500">
              No log entries match your criteria.
            </div>
          ) : (
            logs.map((log) => {
              const config = getLevelConfig(log.level);
              const Icon = config.icon;

              return (
                <div
                  key={log.id}
                  className="p-5 flex flex-col gap-3 font-mono text-sm transition-colors duration-300 hover:bg-slate-50 dark:hover:bg-slate-900/50"
                >
                  <div className="flex items-center justify-between">
                    <Badge
                      className={`transition-colors duration-300 ${config.badge} gap-1.5 font-bold uppercase`}
                    >
                      <Icon className="h-3 w-3" /> {log.level}
                    </Badge>
                    <span className="text-xs font-medium transition-colors duration-300 text-slate-500 dark:text-slate-400">
                      {log.timestamp}
                    </span>
                  </div>
                  <div>
                    <span className="text-[11px] font-semibold uppercase tracking-widest block mb-1 transition-colors duration-300 text-slate-400 dark:text-slate-500">
                      Source
                    </span>
                    <span className="font-medium px-2 py-1 rounded-md border break-all transition-colors duration-300 bg-slate-50 border-slate-200 text-slate-600 dark:bg-slate-950/50 dark:border-slate-800/80 dark:text-slate-400">
                      [{log.source}]
                    </span>
                  </div>
                  <div className="mt-1 leading-relaxed p-3 rounded-lg border shadow-inner wrap-break-word transition-colors duration-300 bg-slate-50 border-slate-200 text-slate-800 dark:bg-slate-900/50 dark:border-slate-800/50 dark:text-slate-200">
                    {log.message}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </Card>

      {/* --- Pagination --- */}
      {totalCount > 0 && (
        <div className="flex items-center justify-between border-t pt-6 transition-colors duration-300 border-slate-200 dark:border-slate-800/80">
          <span className="text-xs font-bold uppercase tracking-widest transition-colors duration-300 text-slate-500 dark:text-slate-400">
            Showing logs from {totalCount} total entries
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="gap-2 transition-colors duration-300 bg-white border-slate-200 text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900/50 dark:text-slate-300 dark:hover:bg-slate-800"
              disabled={!prevUrl || isLoading}
              onClick={() => setPageUrl(prevUrl)}
            >
              <ChevronLeft className="h-4 w-4" /> Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-2 transition-colors duration-300 bg-white border-slate-200 text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900/50 dark:text-slate-300 dark:hover:bg-slate-800"
              disabled={!nextUrl || isLoading}
              onClick={() => setPageUrl(nextUrl)}
            >
              Next <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
