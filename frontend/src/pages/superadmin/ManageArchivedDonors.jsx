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
      queryClient.invalidateQueries(["superadmin-archives"]);
      toast.success("Record restored to the active registry.");
    },
    onError: () => toast.error("Failed to restore record. Check system logs."),
  });

  // --- Mutation Pipeline: Permanent Deletion ---
  const hardDeleteMutation = useMutation({
    mutationFn: async (id) =>
      api.delete(`/superadmin/archived-donors/${id}/hard_delete_record/`),
    onSuccess: () => {
      queryClient.invalidateQueries(["superadmin-archives"]);
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
    <div className="p-6 max-w-7xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-24">
      {/* --- Workspace Header --- */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800/80 pb-6">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-3">
            <div className="p-1.5 rounded-lg bg-rose-500/10 border border-rose-500/20">
              <Database className="h-5 w-5 text-rose-500" />
            </div>
            Data Management (Archives)
          </h1>
          <p className="text-sm text-slate-400 mt-2">
            Review soft-deleted records. Restore them or enforce permanent data
            erasure protocols.
          </p>
        </div>
      </div>

      {/* --- Search Toolbar --- */}
      <div className="flex items-center bg-slate-900/40 backdrop-blur-md p-5 rounded-2xl border border-slate-800/60 shadow-sm">
        <div className="relative w-full max-w-lg group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 group-focus-within:text-rose-500 transition-colors" />
          <Input
            placeholder="Search by donor identity or source organization..."
            className="pl-11 bg-slate-950/50 border-slate-700 h-11 focus:border-rose-500 focus:ring-rose-500/20 transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* --- Primary Data Table Area --- */}
      <Card className="overflow-hidden border-slate-800/80 bg-slate-900/60 backdrop-blur-xl shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-950/40 text-xs uppercase text-slate-500 font-bold border-b border-slate-800/80">
              <tr>
                <th className="px-6 py-5">Donor Record</th>
                <th className="px-6 py-5">Source Organization</th>
                <th className="px-6 py-5">Archived Date</th>
                <th className="px-6 py-5 text-right">Data Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {isLoading ? (
                <tr>
                  <td colSpan="4" className="px-6 py-24 text-center">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto text-rose-500 mb-4" />
                    <p className="text-sm font-medium tracking-widest uppercase text-slate-400">
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
                    <div className="h-20 w-20 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-inner">
                      <ServerCrash className="h-10 w-10 text-rose-500" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2 tracking-tight">
                      Telemetry Failure
                    </h3>
                    <p className="text-slate-400 max-w-sm mx-auto leading-relaxed text-sm mb-6">
                      Unable to establish connection with the central archive
                      database.
                    </p>
                    <Button
                      variant="outline"
                      className="border-slate-700 bg-slate-900/50"
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
                    <div className="h-20 w-20 bg-slate-800/50 border border-slate-700 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-inner">
                      <Archive className="h-10 w-10 text-slate-500" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2 tracking-tight">
                      Archives Clean
                    </h3>
                    <p className="text-slate-400 max-w-sm mx-auto leading-relaxed text-sm">
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
                    <SearchX className="h-12 w-12 text-slate-600 mb-4 mx-auto" />
                    <h3 className="text-lg font-bold text-white mb-2">
                      No Matches Found
                    </h3>
                    <p className="text-slate-400 text-sm max-w-sm mx-auto">
                      No archived records match the query:{" "}
                      <strong className="text-slate-300">"{searchTerm}"</strong>
                    </p>
                  </td>
                </tr>
              ) : (
                filteredArchives.map((donor) => (
                  <tr
                    key={donor.id}
                    className="hover:bg-slate-800/30 transition-colors group"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="h-11 w-11 rounded-xl bg-slate-800/50 border border-slate-700 flex items-center justify-center font-bold text-slate-500 text-sm shadow-inner group-hover:bg-slate-800 transition-colors">
                          {donor.blood_group}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-400 line-through decoration-slate-600">
                            {donor.full_name}
                          </p>
                          <p className="text-xs font-medium text-slate-500 mt-0.5 font-mono">
                            SYS-ID: {donor.id}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <p className="text-slate-300 font-medium">
                        {donor.organization_name}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        {donor.district_name}, {donor.state_name}
                      </p>
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-rose-400 font-mono text-xs font-semibold bg-rose-500/5 w-fit px-2.5 py-1.5 rounded-lg border border-rose-500/20 shadow-inner">
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
                          className="h-8 px-3 font-semibold text-emerald-500/70 hover:text-emerald-400 hover:bg-emerald-500/10 border border-transparent hover:border-emerald-500/20 transition-colors"
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
                          className="h-8 px-3 font-semibold text-rose-500/70 hover:text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition-colors"
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
