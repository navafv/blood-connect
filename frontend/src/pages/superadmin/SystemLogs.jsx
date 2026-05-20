import { useState, useEffect } from "react";
import {
  Activity,
  Search,
  Filter,
  Download,
  AlertCircle,
  Info,
  ShieldAlert,
  CheckCircle2,
  TerminalSquare,
  RefreshCw,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Card } from "../../components/ui/Card";
import { Input } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";
import { Select } from "../../components/ui/Select";
import { Badge } from "../../components/ui/Badge";
import api from "../../lib/axios";

export default function SystemLogs() {
  const [logs, setLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [levelFilter, setLevelFilter] = useState("ALL");
  const [sourceFilter, setSourceFilter] = useState("ALL");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState("");

  // Pagination State
  const [nextPageUrl, setNextPageUrl] = useState(null);
  const [prevPageUrl, setPrevPageUrl] = useState(null);
  const [totalCount, setTotalCount] = useState(0);

  // 1. Fetch Logs from Django (accepts optional URL for pagination)
  const fetchLogs = async (url = "/superadmin/logs/") => {
    setIsLoading(true);
    try {
      // If DRF returns a full absolute URL, we strip the base URL so Axios handles it correctly
      const endpoint = url.replace(api.defaults.baseURL, "") || url;

      const response = await api.get(endpoint);

      setLogs(response.data.results);
      setNextPageUrl(response.data.next);
      setPrevPageUrl(response.data.previous);
      setTotalCount(response.data.count);
      setError("");
    } catch (err) {
      console.error("Failed to fetch logs:", err);
      setError("Could not load system logs.");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchLogs(); // Resets to page 1
  };

  // 2. Filter Logic (Applies to the currently fetched page)
  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      log.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.context &&
        log.context.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesLevel = levelFilter === "ALL" || log.level === levelFilter;
    const matchesSource = sourceFilter === "ALL" || log.source === sourceFilter;
    return matchesSearch && matchesLevel && matchesSource;
  });

  // 3. Real CSV Export Feature
  const exportToCSV = () => {
    if (filteredLogs.length === 0) return alert("No logs to export.");

    const headers = "ID,Timestamp,Level,Source,Message,Context\n";
    const csvRows = filteredLogs.map((log) => {
      const safeMessage = log.message.replace(/"/g, '""');
      const safeContext = (log.context || "").replace(/"/g, '""');
      return `"${log.id}","${log.timestamp}","${log.level}","${log.source}","${safeMessage}","${safeContext}"`;
    });

    const blob = new Blob([headers + csvRows.join("\n")], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.setAttribute("href", url);
    a.setAttribute(
      "download",
      `bloodconnect_system_logs_${new Date().toISOString().split("T")[0]}.csv`,
    );
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const getLevelBadge = (level) => {
    switch (level) {
      case "INFO":
        return (
          <Badge
            variant="default"
            className="bg-blue-500/10 text-blue-400 border-blue-500/20"
          >
            <Info className="h-3 w-3 mr-1" /> Info
          </Badge>
        );
      case "WARNING":
        return (
          <Badge
            variant="warning"
            className="bg-amber-500/10 text-amber-400 border-amber-500/20"
          >
            <AlertCircle className="h-3 w-3 mr-1" /> Warn
          </Badge>
        );
      case "ERROR":
        return (
          <Badge
            variant="danger"
            className="bg-rose-500/10 text-rose-400 border-rose-500/20"
          >
            <ShieldAlert className="h-3 w-3 mr-1" /> Error
          </Badge>
        );
      case "CRITICAL":
        return (
          <Badge
            variant="primary"
            className="bg-rose-600 text-white border-rose-700 animate-pulse"
          >
            <ShieldAlert className="h-3 w-3 mr-1" /> Critical
          </Badge>
        );
      default:
        return <Badge variant="default">{level}</Badge>;
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <TerminalSquare className="h-6 w-6 text-purple-500" />
            System Event Logs
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Global audit trail for security, billing, and system diagnostics.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            className="gap-2"
            onClick={handleRefresh}
            disabled={isRefreshing || isLoading}
          >
            <RefreshCw
              className={`h-4 w-4 ${isRefreshing ? "animate-spin text-emerald-500" : ""}`}
            />
            Refresh
          </Button>
          <Button variant="primary" className="gap-2" onClick={exportToCSV}>
            <Download className="h-4 w-4" /> Export CSV
          </Button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-center gap-3 text-rose-400">
          <AlertCircle className="h-5 w-5" />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      {/* Toolbar: Search and Filters */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 bg-slate-900/50 p-4 rounded-xl border border-slate-800">
        {/* Search */}
        <div className="md:col-span-6 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <Input
            placeholder="Search by message or context (IP, Tenant)..."
            className="pl-10 bg-slate-950 border-slate-700 w-full"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Level Filter */}
        <div className="md:col-span-3 relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 z-10" />
          <Select
            value={levelFilter}
            onChange={(e) => setLevelFilter(e.target.value)}
            className="pl-10 bg-slate-950 border-slate-700 w-full"
          >
            <option value="ALL">All Severities</option>
            <option value="INFO">Info</option>
            <option value="WARNING">Warning</option>
            <option value="ERROR">Error</option>
            <option value="CRITICAL">Critical</option>
          </Select>
        </div>

        {/* Source Filter */}
        <div className="md:col-span-3 relative">
          <Activity className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 z-10" />
          <Select
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value)}
            className="pl-10 bg-slate-950 border-slate-700 w-full"
          >
            <option value="ALL">All Sources</option>
            <option value="SYSTEM">System</option>
            <option value="AUTH">Authentication</option>
            <option value="API_GATEWAY">API Gateway</option>
            <option value="DATABASE">Database</option>
            <option value="BILLING">Billing</option>
            <option value="TENANT_MGMT">Tenant Mgmt</option>
          </Select>
        </div>
      </div>

      {/* Data Table */}
      <Card className="overflow-hidden border-slate-800 bg-slate-900/60 backdrop-blur-md">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-900/80 text-xs uppercase text-slate-400 border-b border-slate-800">
              <tr>
                <th scope="col" className="px-6 py-4 font-medium">
                  Timestamp
                </th>
                <th scope="col" className="px-6 py-4 font-medium">
                  Level
                </th>
                <th scope="col" className="px-6 py-4 font-medium">
                  Source
                </th>
                <th scope="col" className="px-6 py-4 font-medium">
                  Event Message
                </th>
                <th scope="col" className="px-6 py-4 font-medium">
                  Context
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50 font-mono text-[13px]">
              {isLoading ? (
                <tr>
                  <td
                    colSpan="5"
                    className="px-6 py-12 text-center text-slate-500 font-sans"
                  >
                    <Loader2 className="h-8 w-8 animate-spin mx-auto text-purple-500 mb-2" />
                    Fetching latest logs...
                  </td>
                </tr>
              ) : filteredLogs.length > 0 ? (
                filteredLogs.map((log) => (
                  <tr
                    key={log.id}
                    className="hover:bg-slate-800/30 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-slate-400">
                      {log.timestamp}
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      {getLevelBadge(log.level)}
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-slate-400">
                      [{log.source}]
                    </td>

                    <td
                      className="px-6 py-4 text-slate-200 max-w-md truncate"
                      title={log.message}
                    >
                      {log.message}
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-slate-500">
                      {log.context || "-"}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan="5"
                    className="px-6 py-12 text-center text-slate-500 font-sans"
                  >
                    <CheckCircle2 className="h-10 w-10 mx-auto text-slate-700 mb-3" />
                    No logs found matching your criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Functional Pagination Footer */}
        <div className="border-t border-slate-800 bg-slate-900/50 px-6 py-4 flex items-center justify-between text-sm text-slate-400">
          <span>
            Showing {filteredLogs.length} of {totalCount} total events
          </span>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="gap-1"
              disabled={!prevPageUrl || isLoading}
              onClick={() => fetchLogs(prevPageUrl)}
            >
              <ChevronLeft className="h-4 w-4" /> Previous
            </Button>

            <Button
              variant="outline"
              size="sm"
              className="gap-1"
              disabled={!nextPageUrl || isLoading}
              onClick={() => fetchLogs(nextPageUrl)}
            >
              Next <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
