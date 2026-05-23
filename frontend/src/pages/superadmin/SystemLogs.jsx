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
} from "lucide-react";
import { Card } from "../../components/ui/Card";
import { Input } from "../../components/ui/Input";
import { Select } from "../../components/ui/Select";
import { Button } from "../../components/ui/Button";
import { Badge } from "../../components/ui/Badge";
import api from "../../lib/axios";

export default function SystemLogs() {
  // We store the exact URL to fetch, making pagination seamless with Django
  const [pageUrl, setPageUrl] = useState("/superadmin/logs/");
  const [searchTerm, setSearchTerm] = useState("");
  const [levelFilter, setLevelFilter] = useState("ALL");

  // Fetch Logs via React Query
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["systemLogs", pageUrl],
    queryFn: async () => {
      const res = await api.get(pageUrl);
      return res.data;
    },
  });

  // Fallbacks for Django's paginated response
  const logs = data?.results || [];
  const nextUrl = data?.next
    ? data.next.replace(api.defaults.baseURL, "")
    : null;
  const prevUrl = data?.previous
    ? data.previous.replace(api.defaults.baseURL, "")
    : null;
  const totalCount = data?.count || 0;

  // Client-side filtering for the current page
  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      log.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.source.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLevel = levelFilter === "ALL" || log.level === levelFilter;
    return matchesSearch && matchesLevel;
  });

  const getLevelConfig = (level) => {
    switch (level) {
      case "INFO":
        return {
          icon: Info,
          color: "text-blue-400",
          badge: "bg-blue-500/10 border-blue-500/20 text-blue-400",
        };
      case "WARNING":
        return {
          icon: AlertTriangle,
          color: "text-amber-400",
          badge: "bg-amber-500/10 border-amber-500/20 text-amber-400",
        };
      case "ERROR":
      case "CRITICAL":
        return {
          icon: XCircle,
          color: "text-rose-500",
          badge: "bg-rose-500/10 border-rose-500/20 text-rose-500",
        };
      default:
        return {
          icon: Terminal,
          color: "text-slate-400",
          badge: "bg-slate-800 border-slate-700 text-slate-300",
        };
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800 pb-6">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <Terminal className="h-6 w-6 text-rose-500" />
            System & Audit Logs
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Immutable audit trail of all administrative and system-level events.
          </p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-4 bg-slate-900/50 p-4 rounded-xl border border-slate-800">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <Input
            placeholder="Search logs..."
            className="pl-10 bg-slate-950 border-slate-700"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="h-4 w-4 text-slate-500" />
          <Select
            value={levelFilter}
            onChange={(e) => setLevelFilter(e.target.value)}
            className="bg-slate-950 border-slate-700 w-full sm:w-48"
          >
            <option value="ALL">All Severity Levels</option>
            <option value="INFO">Info</option>
            <option value="WARNING">Warning</option>
            <option value="ERROR">Error / Critical</option>
          </Select>
        </div>
      </div>

      {/* Log Terminal */}
      <Card className="border-slate-800 bg-slate-950 shadow-2xl overflow-hidden">
        <div className="bg-slate-900 border-b border-slate-800 px-4 py-2 flex items-center gap-2">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-rose-500/20 border border-rose-500/50"></div>
            <div className="w-3 h-3 rounded-full bg-amber-500/20 border border-amber-500/50"></div>
            <div className="w-3 h-3 rounded-full bg-emerald-500/20 border border-emerald-500/50"></div>
          </div>
          <span className="text-xs text-slate-500 ml-2 font-mono">
            root@bloodconnect:~# tail -f /var/log/system.log
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm font-mono">
            <thead className="bg-slate-900/50 text-xs text-slate-500 border-b border-slate-800">
              <tr>
                <th className="px-6 py-3 font-medium">Timestamp</th>
                <th className="px-6 py-3 font-medium">Level</th>
                <th className="px-6 py-3 font-medium">Source</th>
                <th className="px-6 py-3 font-medium">Message</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50 text-slate-300">
              {isLoading ? (
                <tr>
                  <td
                    colSpan="4"
                    className="px-6 py-12 text-center text-slate-500"
                  >
                    <Loader2 className="h-8 w-8 animate-spin mx-auto text-rose-500 mb-2" />
                    Connecting to log stream...
                  </td>
                </tr>
              ) : isError ? (
                <tr>
                  <td
                    colSpan="4"
                    className="px-6 py-12 text-center text-rose-400"
                  >
                    <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                    Failed to read logs: {error?.message}
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td
                    colSpan="4"
                    className="px-6 py-12 text-center text-slate-500"
                  >
                    No logs found matching your criteria.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => {
                  const config = getLevelConfig(log.level);
                  const Icon = config.icon;

                  return (
                    <tr
                      key={log.id}
                      className="hover:bg-slate-900/80 transition-colors group"
                    >
                      <td className="px-6 py-3 whitespace-nowrap text-slate-500">
                        {log.timestamp}
                      </td>
                      <td className="px-6 py-3 whitespace-nowrap">
                        <Badge className={config.badge}>
                          <Icon className="h-3 w-3 mr-1" /> {log.level}
                        </Badge>
                      </td>
                      <td className="px-6 py-3 whitespace-nowrap">
                        <span className="text-slate-400">[{log.source}]</span>
                      </td>
                      <td className="px-6 py-3 text-slate-300 group-hover:text-white transition-colors">
                        {log.message}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Pagination Controls */}
      {totalCount > 0 && (
        <div className="flex items-center justify-between border-t border-slate-800 pt-6">
          <span className="text-sm text-slate-400 font-mono">
            Showing logs from {totalCount} total entries
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="gap-1 border-slate-700 bg-slate-900/50 hover:bg-slate-800 text-slate-300"
              disabled={!prevUrl || isLoading}
              onClick={() => setPageUrl(prevUrl)}
            >
              <ChevronLeft className="h-4 w-4" /> Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-1 border-slate-700 bg-slate-900/50 hover:bg-slate-800 text-slate-300"
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
