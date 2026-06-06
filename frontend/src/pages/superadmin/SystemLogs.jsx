import React, { useState, useEffect } from "react";
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
import toast from "react-hot-toast";

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
  const nextUrl = data?.next
    ? data.next.replace(api.defaults.baseURL, "")
    : null;
  const prevUrl = data?.previous
    ? data.previous.replace(api.defaults.baseURL, "")
    : null;
  const totalCount = data?.count || 0;

  const getLevelConfig = (level) => {
    switch (level) {
      case "INFO":
        return {
          icon: Info,
          badge: "bg-blue-500/10 text-blue-400 border-blue-500/20",
        };
      case "WARNING":
        return {
          icon: AlertTriangle,
          badge: "bg-amber-500/10 text-amber-400 border-amber-500/20",
        };
      case "ERROR":
      case "CRITICAL":
        return {
          icon: XCircle,
          badge: "bg-rose-500/10 text-rose-500 border-rose-500/20",
        };
      default:
        return {
          icon: Terminal,
          badge: "bg-slate-800 text-slate-300 border-slate-700",
        };
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-24">
      {/* --- Workspace Header --- */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800/80 pb-6">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-3">
            <div className="p-1.5 rounded-lg bg-rose-500/10 border border-rose-500/20">
              <Terminal className="h-5 w-5 text-rose-500" />
            </div>
            System Audit Logs
          </h1>
          <p className="text-sm text-slate-400 mt-2">
            Immutable trail of administrative actions and platform-level events.
          </p>
        </div>
      </div>

      {/* --- Search & Filter Toolbar --- */}
      <div className="flex flex-col sm:flex-row gap-4 bg-slate-900/40 backdrop-blur-md p-5 rounded-2xl border border-slate-800/60 shadow-sm">
        <div className="relative w-full sm:w-96 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 group-focus-within:text-rose-500 transition-colors" />
          <Input
            placeholder="Search by source or message..."
            className="pl-11 bg-slate-950/50 border-slate-700 h-11 focus:border-rose-500 focus:ring-rose-500/20 transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-slate-500 ml-2" />
          <Select
            value={levelFilter}
            onChange={(e) => setLevelFilter(e.target.value)}
            className="bg-slate-950/50 border-slate-700 h-11 w-full sm:w-56 focus:border-rose-500"
          >
            <option value="ALL">All Severity Levels</option>
            <option value="INFO">Info Only</option>
            <option value="WARNING">Warnings</option>
            <option value="ERROR">Errors / Critical</option>
          </Select>
        </div>
      </div>

      {/* --- Log Terminal Display --- */}
      <Card className="border-slate-800/80 bg-slate-950 shadow-2xl overflow-hidden">
        <div className="bg-slate-900/80 border-b border-slate-800 px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-rose-500/50" />
              <div className="w-2.5 h-2.5 rounded-full bg-amber-500/50" />
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/50" />
            </div>
            <span className="text-xs text-slate-400 ml-3 font-mono tracking-tight uppercase">
              root@bloodconnect:~# tail -f audit.log
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="text-slate-500 hover:text-white"
            onClick={() => refetch()}
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>

        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left font-mono text-sm">
            <thead className="bg-slate-950/40 text-xs uppercase text-slate-500 font-bold border-b border-slate-800/50">
              <tr>
                <th className="px-6 py-5">Timestamp</th>
                <th className="px-6 py-5">Severity</th>
                <th className="px-6 py-5">Source Context</th>
                <th className="px-6 py-5">Event Payload</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50 text-slate-300">
              {isLoading ? (
                <tr>
                  <td
                    colSpan="4"
                    className="px-6 py-24 text-center text-slate-500"
                  >
                    <Loader2 className="h-8 w-8 animate-spin mx-auto text-rose-500 mb-4" />
                    <p className="text-sm tracking-widest uppercase">
                      Connecting to stream...
                    </p>
                  </td>
                </tr>
              ) : isError ? (
                <tr>
                  <td colSpan="4" className="px-6 py-24 text-center">
                    <div className="h-16 w-16 bg-rose-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                      <ServerCrash className="h-8 w-8 text-rose-500" />
                    </div>
                    <p className="text-rose-400 font-medium">
                      Failed to read log stream.
                    </p>
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td
                    colSpan="4"
                    className="px-6 py-24 text-center text-slate-500"
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
                      className="hover:bg-slate-900/50 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-slate-400 font-medium">
                        {log.timestamp}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge
                          className={`${config.badge} gap-1.5 font-bold uppercase`}
                        >
                          <Icon className="h-3 w-3" /> {log.level}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-slate-400 font-medium">
                        [{log.source}]
                      </td>
                      <td className="px-6 py-4 text-slate-200">
                        {log.message}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        <div className="md:hidden flex flex-col">
          <div className="divide-y divide-slate-800/50 text-slate-300">
            {isLoading ? (
              <tr>
                <td
                  colSpan="4"
                  className="px-6 py-24 text-center text-slate-500"
                >
                  <Loader2 className="h-8 w-8 animate-spin mx-auto text-rose-500 mb-4" />
                  <p className="text-sm tracking-widest uppercase">
                    Connecting to stream...
                  </p>
                </td>
              </tr>
            ) : isError ? (
              <tr>
                <td colSpan="4" className="px-6 py-24 text-center">
                  <div className="h-16 w-16 bg-rose-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <ServerCrash className="h-8 w-8 text-rose-500" />
                  </div>
                  <p className="text-rose-400 font-medium">
                    Failed to read log stream.
                  </p>
                </td>
              </tr>
            ) : logs.length === 0 ? (
              <tr>
                <td
                  colSpan="4"
                  className="px-6 py-24 text-center text-slate-500"
                >
                  No log entries match your criteria.
                </td>
              </tr>
            ) : (
              logs.map((log) => {
                const config = getLevelConfig(log.level);
                const Icon = config.icon;

                return (
                  <div
                    key={log.id}
                    className="p-4 hover:bg-slate-900/50 transition-colors flex flex-col gap-2.5 font-mono text-sm"
                  >
                    <div className="flex items-center justify-between">
                      <Badge
                        className={`${config.badge} gap-1.5 font-bold uppercase`}
                      >
                        <Icon className="h-3 w-3" /> {log.level}
                      </Badge>
                      <span className="text-xs text-slate-400 font-medium">
                        {log.timestamp}
                      </span>
                    </div>
                    <div>
                      <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest block mb-1">
                        Source
                      </span>
                      <span className="text-slate-400 font-medium bg-slate-950/50 px-2 py-1 rounded-md border border-slate-800/80 break-all">
                        [{log.source}]
                      </span>
                    </div>
                    <div className="text-slate-200 mt-1 leading-relaxed bg-slate-900/50 p-3 rounded-lg border border-slate-800/50 shadow-inner wrap-break-word">
                      {log.message}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </Card>

      {/* --- Pagination --- */}
      {totalCount > 0 && (
        <div className="flex items-center justify-between border-t border-slate-800/80 pt-6">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
            Showing logs from {totalCount} total entries
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="gap-2 border-slate-700 bg-slate-900/50 hover:bg-slate-800"
              disabled={!prevUrl || isLoading}
              onClick={() => setPageUrl(prevUrl)}
            >
              <ChevronLeft className="h-4 w-4" /> Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-2 border-slate-700 bg-slate-900/50 hover:bg-slate-800"
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
