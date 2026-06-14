import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Activity,
  ShieldCheck,
  UserPlus,
  Droplet,
  Clock,
  Loader2,
  AlertCircle,
  Search,
} from "lucide-react";
import { Card, CardContent } from "../../components/ui/Card";
import { Input } from "../../components/ui/Input";
import api from "../../lib/axios";

export default function AuditLogs() {
  const [searchTerm, setSearchTerm] = useState("");

  const {
    data: logs,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["tenantAuditLogs"],
    queryFn: async () => {
      // Assuming StandardResultsSetPagination returns data in a `results` array
      const response = await api.get("/tenant/audit-logs/");
      return response.data.results || response.data;
    },
  });

  const getLogStyling = (source, level) => {
    if (level === "WARNING" || level === "ERROR") {
      return {
        icon: ShieldCheck,
        color: "text-amber-600 dark:text-amber-500",
        bg: "bg-amber-50 dark:bg-amber-500/10",
        border: "border-amber-200 dark:border-amber-500/20",
      };
    }
    switch (source) {
      case "DONOR_REGISTRY":
        return {
          icon: UserPlus,
          color: "text-emerald-600 dark:text-emerald-500",
          bg: "bg-emerald-50 dark:bg-emerald-500/10",
          border: "border-emerald-200 dark:border-emerald-500/20",
        };
      case "CLINICAL_LOG":
        return {
          icon: Droplet,
          color: "text-rose-600 dark:text-rose-500",
          bg: "bg-rose-50 dark:bg-rose-500/10",
          border: "border-rose-200 dark:border-rose-500/20",
        };
      default:
        return {
          icon: Activity,
          color: "text-blue-600 dark:text-blue-500",
          bg: "bg-blue-50 dark:bg-blue-500/10",
          border: "border-blue-200 dark:border-blue-500/20",
        };
    }
  };

  const filteredLogs =
    logs?.filter(
      (log) =>
        log.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.actor_name.toLowerCase().includes(searchTerm.toLowerCase()),
    ) || [];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 dark:border-slate-800/80 pb-6 transition-colors duration-300">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3 tracking-tight transition-colors duration-300 text-slate-900 dark:text-white">
            <div className="p-1.5 rounded-lg border shadow-inner transition-colors duration-300 bg-slate-100 border-slate-200 dark:bg-slate-800/50 dark:border-slate-700">
              <Clock className="h-5 w-5 transition-colors duration-300 text-slate-600 dark:text-slate-400" />
            </div>
            Security & Audit Logs
          </h1>
          <p className="text-sm mt-2 transition-colors duration-300 text-slate-600 dark:text-slate-400">
            HIPAA-compliant trail of all staff activities and registry
            modifications.
          </p>
        </div>

        <div className="w-full sm:w-72 relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-rose-500 transition-colors duration-300" />
          <Input
            placeholder="Search logs by staff or action..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 h-10 w-full bg-white dark:bg-slate-900/50 transition-colors duration-300"
          />
        </div>
      </div>

      <Card className="backdrop-blur-xl shadow-xl transition-colors duration-300 bg-white/80 border-slate-200 dark:border-slate-800/80 dark:bg-slate-900/60">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-24 gap-4 text-slate-500 dark:text-slate-400">
              <Loader2 className="h-8 w-8 animate-spin text-rose-600 dark:text-rose-500" />
              <p className="text-sm font-medium tracking-widest uppercase">
                Fetching Telemetry...
              </p>
            </div>
          ) : isError ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <AlertCircle className="h-10 w-10 mb-4 text-rose-600 dark:text-rose-500" />
              <p className="font-medium text-slate-600 dark:text-slate-300">
                Failed to load audit trail.
              </p>
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center px-4">
              <div className="h-16 w-16 rounded-2xl flex items-center justify-center mb-4 border bg-slate-50 border-slate-200 dark:bg-slate-800/50 dark:border-slate-700">
                <Clock className="h-8 w-8 text-slate-400 dark:text-slate-500" />
              </div>
              <h3 className="text-lg font-bold mb-1 text-slate-900 dark:text-white">
                No Logs Found
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                No activity matches your search criteria.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-200 dark:divide-slate-800/50">
              {filteredLogs.map((log) => {
                const style = getLogStyling(log.source, log.level);
                const Icon = style.icon;
                return (
                  <div
                    key={log.id}
                    className="p-5 flex items-start sm:items-center gap-5 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors"
                  >
                    <div
                      className={`h-12 w-12 shrink-0 rounded-xl border flex items-center justify-center shadow-inner transition-colors duration-300 ${style.bg} ${style.border}`}
                    >
                      <Icon className={`h-6 w-6 ${style.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                        {log.message}
                      </p>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1.5 text-xs text-slate-500 dark:text-slate-400">
                        <span className="font-semibold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                          Actor: {log.actor_name}
                        </span>
                        <span>
                          {new Date(log.timestamp).toLocaleString(undefined, {
                            dateStyle: "medium",
                            timeStyle: "short",
                          })}
                        </span>
                        <span className="uppercase tracking-wider font-mono opacity-70">
                          SRC: {log.source}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
