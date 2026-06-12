import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Database,
  RefreshCcw,
  Trash2,
  Loader2,
  AlertTriangle,
  Search,
  Clock,
  ServerCrash,
  RefreshCw,
  SearchX,
  Archive,
} from "lucide-react";
import toast from "react-hot-toast";

import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import api from "../../lib/axios";

export default function ManageArchivedDonors() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");

  // --- Query Pipeline: Fetch Archives ---
  const {
    data: archives = [],
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["superadmin-archives"],
    queryFn: async () => {
      const res = await api.get("/superadmin/archived-donors/");
      return res.data.results || res.data;
    },
  });

  // --- Mutation Pipeline: Restore Record ---
  const restoreMutation = useMutation({
    mutationFn: async (id) =>
      api.post(`/superadmin/archived-donors/${id}/restore/`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["superadmin-archives"] });
      toast.success("Record restored to the active registry.");
    },
    onError: () => toast.error("Failed to restore record. Check system logs."),
  });

  // --- Mutation Pipeline: Permanent Deletion ---
  const hardDeleteMutation = useMutation({
    mutationFn: async (id) =>
      api.delete(`/superadmin/archived-donors/${id}/hard_delete_record/`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["superadmin-archives"] });
      toast.success("Record permanently purged from the database.");
    },
    onError: () => toast.error("Failed to purge record."),
  });

  // --- Action Handlers ---
  const handleRestore = (id, name) => {
    if (
      window.confirm(
        `Are you sure you want to restore ${name} to the active registry?`,
      )
    ) {
      restoreMutation.mutate(id);
    }
  };

  const handleHardDelete = (id, name) => {
    if (
      window.confirm(
        `WARNING: Are you absolutely sure you want to permanently delete ${name}? This action cannot be undone and purges all medical data.`,
      )
    ) {
      hardDeleteMutation.mutate(id);
    }
  };

  // --- Client-Side Search Engine ---
  const filteredArchives = archives.filter(
    (donor) =>
      donor.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      donor.organization_name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  // --- Formatters ---
  const formatDate = (dateString) => {
    if (!dateString) return "Unknown";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-24 transition-colors duration-300 bg-slate-50 dark:bg-slate-950">
      {/* --- Workspace Header --- */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b pb-6 transition-colors duration-300 border-slate-200 dark:border-slate-800/80">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-3 transition-colors duration-300 text-slate-900 dark:text-white">
            <div className="p-1.5 rounded-lg border transition-colors duration-300 bg-rose-50 border-rose-200 dark:bg-rose-500/10 dark:border-rose-500/20">
              <Database className="h-5 w-5 transition-colors duration-300 text-rose-600 dark:text-rose-500" />
            </div>
            Data Management (Archives)
          </h1>
          <p className="text-sm mt-2 transition-colors duration-300 text-slate-600 dark:text-slate-400">
            Review soft-deleted records. Restore them or enforce permanent data
            erasure protocols.
          </p>
        </div>
      </div>

      {/* --- Search Toolbar --- */}
      <div className="flex items-center backdrop-blur-md p-5 rounded-2xl border shadow-sm transition-colors duration-300 bg-white/80 border-slate-200 dark:bg-slate-900/40 dark:border-slate-800/60">
        <div className="relative w-full max-w-lg group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 transition-colors duration-300 text-slate-400 group-focus-within:text-rose-600 dark:text-slate-500 dark:group-focus-within:text-rose-500" />
          <Input
            placeholder="Search by donor identity or source organization..."
            className="pl-11 h-11 transition-all duration-300 focus:ring-rose-500/20 bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 dark:bg-slate-950/50 dark:border-slate-700 dark:text-white dark:placeholder:text-slate-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* --- Primary Data Table Area --- */}
      <Card className="overflow-hidden backdrop-blur-xl shadow-xl dark:shadow-2xl transition-colors duration-300 bg-white/80 border-slate-200 dark:bg-slate-900/60 dark:border-slate-800/80">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm transition-colors duration-300 text-slate-700 dark:text-slate-300">
            <thead className="text-xs uppercase font-bold border-b transition-colors duration-300 bg-slate-50 text-slate-500 border-slate-200 dark:bg-slate-950/40 dark:border-slate-800/80">
              <tr>
                <th className="px-6 py-5">Donor Record</th>
                <th className="px-6 py-5">Source Organization</th>
                <th className="px-6 py-5">Archived Date</th>
                <th className="px-6 py-5 text-right">Data Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y transition-colors duration-300 divide-slate-200 dark:divide-slate-800/50">
              {isLoading ? (
                <tr>
                  <td colSpan="4" className="px-6 py-24 text-center">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 transition-colors duration-300 text-rose-600 dark:text-rose-500" />
                    <p className="text-sm font-medium tracking-widest uppercase transition-colors duration-300 text-slate-500 dark:text-slate-400">
                      Loading Archives...
                    </p>
                  </td>
                </tr>
              ) : isError ? (
                <tr>
                  <td
                    colSpan="4"
                    className="px-6 py-24 text-center animate-in fade-in duration-500"
                  >
                    <div className="h-20 w-20 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-inner border transition-colors duration-300 bg-rose-50 border-rose-200 dark:bg-rose-500/10 dark:border-rose-500/20">
                      <ServerCrash className="h-10 w-10 transition-colors duration-300 text-rose-600 dark:text-rose-500" />
                    </div>
                    <h3 className="text-xl font-bold mb-2 tracking-tight transition-colors duration-300 text-slate-900 dark:text-white">
                      Telemetry Failure
                    </h3>
                    <p className="max-w-sm mx-auto leading-relaxed text-sm mb-6 transition-colors duration-300 text-slate-600 dark:text-slate-400">
                      Unable to establish connection with the central archive
                      database.
                    </p>
                    <Button
                      variant="outline"
                      className="transition-colors duration-300 bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900 dark:bg-slate-900/50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                      onClick={() => refetch()}
                    >
                      <RefreshCw className="h-4 w-4 mr-2" /> Retry Connection
                    </Button>
                  </td>
                </tr>
              ) : archives.length === 0 ? (
                <tr>
                  <td
                    colSpan="4"
                    className="px-6 py-24 text-center animate-in fade-in duration-500"
                  >
                    <div className="h-20 w-20 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-inner border transition-colors duration-300 bg-slate-50 border-slate-200 dark:bg-slate-800/50 dark:border-slate-700">
                      <Archive className="h-10 w-10 transition-colors duration-300 text-slate-400 dark:text-slate-500" />
                    </div>
                    <h3 className="text-xl font-bold mb-2 tracking-tight transition-colors duration-300 text-slate-900 dark:text-white">
                      Archives Clean
                    </h3>
                    <p className="max-w-sm mx-auto leading-relaxed text-sm transition-colors duration-300 text-slate-600 dark:text-slate-400">
                      There are no soft-deleted records in the system.
                    </p>
                  </td>
                </tr>
              ) : filteredArchives.length === 0 ? (
                <tr>
                  <td
                    colSpan="4"
                    className="px-6 py-24 text-center animate-in fade-in duration-300"
                  >
                    <SearchX className="h-12 w-12 mb-4 mx-auto transition-colors duration-300 text-slate-400 dark:text-slate-600" />
                    <h3 className="text-lg font-bold mb-2 transition-colors duration-300 text-slate-900 dark:text-white">
                      No Matches Found
                    </h3>
                    <p className="text-sm max-w-sm mx-auto transition-colors duration-300 text-slate-600 dark:text-slate-400">
                      No archived records match the query:{" "}
                      <strong className="transition-colors duration-300 text-slate-900 dark:text-slate-300">
                        "{searchTerm}"
                      </strong>
                    </p>
                  </td>
                </tr>
              ) : (
                filteredArchives.map((donor) => (
                  <tr
                    key={donor.id}
                    className="transition-colors group hover:bg-slate-50 dark:hover:bg-slate-800/30"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="h-11 w-11 rounded-xl border flex items-center justify-center font-bold text-sm shadow-inner shrink-0 transition-colors duration-300 bg-slate-100 border-slate-200 text-slate-600 group-hover:bg-slate-200 dark:bg-slate-800/50 dark:border-slate-700 dark:text-slate-500 dark:group-hover:bg-slate-800">
                          {donor.blood_group}
                        </div>
                        <div>
                          <p className="font-semibold line-through transition-colors duration-300 text-slate-500 decoration-slate-400 dark:text-slate-400 dark:decoration-slate-600">
                            {donor.full_name}
                          </p>
                          <p className="text-xs font-medium font-mono mt-0.5 transition-colors duration-300 text-slate-400 dark:text-slate-500">
                            SYS-ID: {donor.id}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <p className="font-medium transition-colors duration-300 text-slate-900 dark:text-slate-300">
                        {donor.organization_name}
                      </p>
                      <p className="text-xs mt-1 transition-colors duration-300 text-slate-500 dark:text-slate-500">
                        {donor.district_name}, {donor.state_name}
                      </p>
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 font-mono text-xs font-semibold w-fit px-2.5 py-1.5 rounded-lg border shadow-inner transition-colors duration-300 bg-rose-50 text-rose-600 border-rose-200 dark:bg-rose-500/5 dark:text-rose-400 dark:border-rose-500/20">
                        <Clock className="h-3.5 w-3.5" />
                        {formatDate(donor.deleted_at)}
                      </div>
                    </td>

                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                        {/* Restore Button */}
                        <Button
                          variant="ghost"
                          size="sm"
                          title="Restore Record"
                          aria-label={`Restore ${donor.full_name}`}
                          className="h-8 px-3 font-semibold border border-transparent transition-colors duration-300 text-emerald-600 hover:bg-emerald-50 hover:border-emerald-200 dark:text-emerald-500/70 dark:hover:text-emerald-400 dark:hover:bg-emerald-500/10 dark:hover:border-emerald-500/20"
                          onClick={() =>
                            handleRestore(donor.id, donor.full_name)
                          }
                          disabled={
                            restoreMutation.isPending ||
                            hardDeleteMutation.isPending
                          }
                        >
                          {restoreMutation.isPending &&
                          restoreMutation.variables === donor.id ? (
                            <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                          ) : (
                            <RefreshCcw className="h-4 w-4 mr-1.5" />
                          )}
                          Restore
                        </Button>

                        {/* Hard Delete Button */}
                        <Button
                          variant="ghost"
                          size="sm"
                          title="Permanent Purge"
                          aria-label={`Permanently delete ${donor.full_name}`}
                          className="h-8 px-3 font-semibold border border-transparent transition-colors duration-300 text-rose-600 hover:bg-rose-50 hover:border-rose-200 dark:text-rose-500/70 dark:hover:text-rose-400 dark:hover:bg-rose-500/10 dark:hover:border-rose-500/20"
                          onClick={() =>
                            handleHardDelete(donor.id, donor.full_name)
                          }
                          disabled={
                            hardDeleteMutation.isPending ||
                            restoreMutation.isPending
                          }
                        >
                          {hardDeleteMutation.isPending &&
                          hardDeleteMutation.variables === donor.id ? (
                            <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                          ) : (
                            <AlertTriangle className="h-4 w-4 mr-1.5" />
                          )}
                          Purge
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
