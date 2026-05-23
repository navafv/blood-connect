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
} from "lucide-react";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import api from "../../lib/axios";

export default function ManageArchivedDonors() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");

  // Fetch Archived Donors
  const { data: archives = [], isLoading } = useQuery({
    queryKey: ["superadmin-archives"],
    queryFn: async () => {
      const res = await api.get("/superadmin/archived-donors/");
      return res.data.results || res.data;
    },
  });

  // Restore Mutation
  const restoreMutation = useMutation({
    mutationFn: async (id) =>
      api.post(`/superadmin/archived-donors/${id}/restore/`),
    onSuccess: () => queryClient.invalidateQueries(["superadmin-archives"]),
  });

  // Permanent Delete Mutation
  const hardDeleteMutation = useMutation({
    mutationFn: async (id) =>
      api.delete(`/superadmin/archived-donors/${id}/hard_delete_record/`),
    onSuccess: () => queryClient.invalidateQueries(["superadmin-archives"]),
  });

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

  const filteredArchives = archives.filter(
    (donor) =>
      donor.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      donor.organization_name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const formatDate = (dateString) => {
    if (!dateString) return "Unknown";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800 pb-6">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <Database className="h-6 w-6 text-rose-500" /> Data Management
            (Archives)
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Review soft-deleted records. Restore them or enforce GDPR permanent
            erasure.
          </p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center bg-slate-900/50 p-4 rounded-xl border border-slate-800">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <Input
            placeholder="Search by donor or hospital name..."
            className="pl-10 bg-slate-950 border-slate-700"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Archive Table */}
      <Card className="border-slate-800 bg-slate-900/60 backdrop-blur-md">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-900/80 text-xs uppercase text-slate-400 border-b border-slate-800">
              <tr>
                <th className="px-6 py-4 font-medium">Donor Record</th>
                <th className="px-6 py-4 font-medium">Source Organization</th>
                <th className="px-6 py-4 font-medium">Archived Date</th>
                <th className="px-6 py-4 font-medium text-right">
                  Data Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {isLoading ? (
                <tr>
                  <td
                    colSpan="4"
                    className="px-6 py-12 text-center text-slate-500"
                  >
                    <Loader2 className="h-8 w-8 animate-spin mx-auto text-rose-500 mb-2" />{" "}
                    Loading archives...
                  </td>
                </tr>
              ) : filteredArchives.length === 0 ? (
                <tr>
                  <td
                    colSpan="4"
                    className="px-6 py-12 text-center text-slate-500"
                  >
                    No archived records found.
                  </td>
                </tr>
              ) : (
                filteredArchives.map((donor) => (
                  <tr
                    key={donor.id}
                    className="hover:bg-slate-800/30 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-slate-400">
                          {donor.blood_group}
                        </div>
                        <div>
                          <p className="font-medium text-slate-300 line-through decoration-slate-500/50">
                            {donor.full_name}
                          </p>
                          <p className="text-xs text-slate-500">
                            ID: {donor.id}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-slate-300">
                        {donor.organization_name}
                      </p>
                      <p className="text-xs text-slate-500">
                        {donor.district_name}, {donor.state_name}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-rose-400 font-mono text-xs bg-rose-500/10 w-fit px-2 py-1 rounded border border-rose-500/20">
                        <Clock className="h-3 w-3" />{" "}
                        {formatDate(donor.deleted_at)}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {/* Restore */}
                        <Button
                          variant="ghost"
                          size="sm"
                          title="Restore Record"
                          aria-label={`Restore ${donor.full_name}`}
                          className="h-8 px-2 text-emerald-400 hover:bg-emerald-500/10 border border-transparent hover:border-emerald-500/20"
                          onClick={() =>
                            handleRestore(donor.id, donor.full_name)
                          }
                          disabled={restoreMutation.isPending}
                        >
                          <RefreshCcw className="h-4 w-4 mr-1.5" /> Restore
                        </Button>

                        {/* Hard Delete */}
                        <Button
                          variant="ghost"
                          size="sm"
                          title="Permanent Purge"
                          aria-label={`Permanently delete ${donor.full_name}`}
                          className="h-8 px-2 text-rose-500 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20"
                          onClick={() =>
                            handleHardDelete(donor.id, donor.full_name)
                          }
                          disabled={hardDeleteMutation.isPending}
                        >
                          <AlertTriangle className="h-4 w-4 mr-1.5" /> Purge
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
