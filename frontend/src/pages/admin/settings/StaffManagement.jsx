import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Users,
  Search,
  UserPlus,
  Shield,
  Mail,
  Clock,
  Loader2,
  Trash2,
  AlertCircle,
} from "lucide-react";
import { Card } from "../../../components/ui/Card";
import { Input } from "../../../components/ui/Input";
import { Button } from "../../../components/ui/Button";
import { Select } from "../../../components/ui/Select";
import { Badge } from "../../../components/ui/Badge";
import { Modal } from "../../../components/ui/Modal";
import api from "../../../lib/axios";

export default function StaffManagement() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formError, setFormError] = useState("");

  // New Staff Form State
  const [newStaff, setNewStaff] = useState({
    name: "",
    email: "",
    role: "ORG_STAFF",
  });

  // 1. Initialize Query Client for cache invalidation
  const queryClient = useQueryClient();

  // 2. Fetch Staff using React Query
  const {
    data: staffList = [],
    isLoading,
    isError,
    error: fetchError,
  } = useQuery({
    queryKey: ["tenantStaff"],
    queryFn: async () => {
      const response = await api.get("/tenant/staff/");
      return response.data;
    },
  });

  // 3. Invite Staff Mutation
  const inviteMutation = useMutation({
    mutationFn: async (staffData) => {
      const response = await api.post("/tenant/staff/", staffData);
      return response.data;
    },
    onSuccess: () => {
      // Instantly triggers a background refetch to update the table
      queryClient.invalidateQueries({ queryKey: ["tenantStaff"] });
      setIsModalOpen(false);
      setNewStaff({ name: "", email: "", role: "ORG_STAFF" });
      setFormError("");
    },
    onError: (err) => {
      console.error("Invite failed:", err);
      setFormError(
        err.response?.data?.error || "Failed to invite staff member.",
      );
    },
  });

  // 4. Delete Staff Mutation
  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      await api.delete(`/tenant/staff/${id}/`);
    },
    onSuccess: () => {
      // Update UI by triggering a refetch
      queryClient.invalidateQueries({ queryKey: ["tenantStaff"] });
    },
    onError: (err) => {
      alert(err.response?.data?.error || "Failed to remove staff member.");
    },
  });

  // Filter staff based on search input
  const filteredStaff = staffList.filter((staff) => {
    const name = staff.first_name || staff.username;
    return (
      name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      staff.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const handleInviteChange = (e) => {
    const { name, value } = e.target;
    setNewStaff((prev) => ({ ...prev, [name]: value }));
    if (formError) setFormError("");
  };

  const handleInviteSubmit = (e) => {
    e.preventDefault();
    setFormError("");
    inviteMutation.mutate(newStaff);
  };

  const handleDelete = (id, name) => {
    if (!window.confirm(`Are you sure you want to revoke access for ${name}?`))
      return;
    deleteMutation.mutate(id);
  };

  const getRoleBadge = (role) => {
    return role === "ORG_ADMIN" ? (
      <Badge
        variant="primary"
        className="bg-rose-500/20 text-rose-400 border-rose-500/30"
      >
        Admin
      </Badge>
    ) : (
      <Badge variant="default" className="bg-slate-800 text-slate-300">
        Staff
      </Badge>
    );
  };

  const getStatusBadge = (lastLogin, isActive) => {
    if (!isActive) return <Badge variant="danger">Access Revoked</Badge>;
    if (!lastLogin) return <Badge variant="warning">Pending Invite</Badge>;
    return <Badge variant="success">Active</Badge>;
  };

  const formatLastActive = (lastLogin) => {
    if (!lastLogin) return "Never logged in";
    return new Date(lastLogin).toLocaleString([], {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <Users className="h-6 w-6 text-rose-500" />
            Staff Management
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Manage who has access to your organization's dashboard and donor
            data.
          </p>
        </div>
        <Button
          variant="primary"
          className="gap-2"
          onClick={() => setIsModalOpen(true)}
        >
          <UserPlus className="h-4 w-4" />
          Invite Staff Member
        </Button>
      </div>

      {/* Toolbar */}
      <div className="flex items-center bg-slate-900/50 p-4 rounded-xl border border-slate-800">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <Input
            placeholder="Search by name or email address..."
            className="pl-10 bg-slate-950 border-slate-700"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            aria-label="Search Staff"
          />
        </div>
      </div>

      {/* Staff Table */}
      <Card className="overflow-hidden border-slate-800 bg-slate-900/60 backdrop-blur-md">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-900/80 text-xs uppercase text-slate-400 border-b border-slate-800">
              <tr>
                <th scope="col" className="px-6 py-4 font-medium">
                  User Details
                </th>
                <th scope="col" className="px-6 py-4 font-medium">
                  Role Level
                </th>
                <th scope="col" className="px-6 py-4 font-medium">
                  Status
                </th>
                <th scope="col" className="px-6 py-4 font-medium">
                  Last Active
                </th>
                <th scope="col" className="px-6 py-4 font-medium text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {isLoading ? (
                <tr>
                  <td
                    colSpan="5"
                    className="px-6 py-12 text-center text-slate-500"
                  >
                    <Loader2 className="h-8 w-8 animate-spin mx-auto text-rose-500 mb-2" />
                    Loading staff directory...
                  </td>
                </tr>
              ) : isError ? (
                <tr>
                  <td
                    colSpan="5"
                    className="px-6 py-12 text-center text-slate-500"
                  >
                    <AlertCircle className="h-8 w-8 mx-auto text-rose-500 mb-2" />
                    <p>
                      {fetchError?.message ||
                        "Could not load the staff directory."}
                    </p>
                    <Button
                      variant="outline"
                      className="mt-4"
                      onClick={() =>
                        queryClient.invalidateQueries(["tenantStaff"])
                      }
                    >
                      Try Again
                    </Button>
                  </td>
                </tr>
              ) : filteredStaff.length > 0 ? (
                filteredStaff.map((staff) => {
                  const displayName = staff.first_name || staff.username;

                  return (
                    <tr
                      key={staff.id}
                      className="hover:bg-slate-800/30 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-slate-300">
                            {displayName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-medium text-white">
                              {displayName}
                            </div>
                            <div className="flex items-center gap-1 text-xs text-slate-500 mt-0.5">
                              <Mail className="h-3 w-3" />
                              {staff.email}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          {staff.role === "ORG_ADMIN" && (
                            <Shield className="h-4 w-4 text-rose-500" />
                          )}
                          {getRoleBadge(staff.role)}
                        </div>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(staff.last_login, staff.is_active)}
                      </td>

                      <td className="px-6 py-4 text-slate-400 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 text-xs">
                          <Clock className="h-3 w-3 text-slate-500" />
                          {formatLastActive(staff.last_login)}
                        </div>
                      </td>

                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Revoke Access"
                            aria-label={`Revoke access for ${displayName}`}
                            className="h-8 w-8 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 disabled:opacity-50"
                            onClick={() => handleDelete(staff.id, displayName)}
                            disabled={deleteMutation.isPending}
                          >
                            {deleteMutation.isPending &&
                            deleteMutation.variables === staff.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td
                    colSpan="5"
                    className="px-6 py-12 text-center text-slate-500"
                  >
                    No staff members found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* --- Invite Staff Modal --- */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => !inviteMutation.isPending && setIsModalOpen(false)}
        title="Invite Team Member"
      >
        <form onSubmit={handleInviteSubmit} className="space-y-6">
          {formError && (
            <div className="flex items-center gap-2 p-3 text-sm text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-lg">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <p>{formError}</p>
            </div>
          )}

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">
                Full Name
              </label>
              <Input
                name="name"
                placeholder="e.g., John Doe"
                value={newStaff.name}
                onChange={handleInviteChange}
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">
                Email Address
              </label>
              <Input
                type="email"
                name="email"
                placeholder="john@hospital.com"
                value={newStaff.email}
                onChange={handleInviteChange}
                required
              />
              <p className="text-xs text-slate-500">
                A temporary password will be generated for them.
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">
                Access Level
              </label>
              <Select
                name="role"
                value={newStaff.role}
                onChange={handleInviteChange}
              >
                <option value="ORG_STAFF">Staff (Can manage donors)</option>
                <option value="ORG_ADMIN">
                  Admin (Can manage settings & staff)
                </option>
              </Select>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsModalOpen(false)}
              disabled={inviteMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={inviteMutation.isPending}
              className="min-w-30"
            >
              {inviteMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending...
                </>
              ) : (
                "Send Invite"
              )}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
