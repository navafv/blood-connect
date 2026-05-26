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
  Terminal,
  UserX,
} from "lucide-react";
import toast from "react-hot-toast";

import { Card } from "../../../components/ui/Card";
import { Input } from "../../../components/ui/Input";
import { Button } from "../../../components/ui/Button";
import { Select } from "../../../components/ui/Select";
import { Badge } from "../../../components/ui/Badge";
import { Modal } from "../../../components/ui/Modal";
import api from "../../../lib/axios";

/**
 * Tenant Role-Based Access Control (RBAC) Workspace
 * Permits Organization Admins to invite, monitor, and revoke access for
 * operational staff within their specific tenant boundary.
 */
export default function StaffManagement() {
  const queryClient = useQueryClient();

  // --- UI Transition State ---
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  // --- Payload State ---
  const [newStaff, setNewStaff] = useState({
    name: "",
    email: "",
    role: "ORG_STAFF",
  });

  // --- Query Pipeline: Fetch Staff ---
  const {
    data: staffList = [],
    isLoading,
    isError,
    error: fetchError,
    refetch,
  } = useQuery({
    queryKey: ["tenantStaff"],
    queryFn: async () => {
      const response = await api.get("/tenant/staff/");
      return response.data;
    },
  });

  // --- Mutation Pipeline: Invite Staff ---
  const inviteMutation = useMutation({
    mutationFn: async (staffData) => {
      const response = await api.post("/tenant/staff/", staffData);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenantStaff"] });
      setIsModalOpen(false);
      setNewStaff({ name: "", email: "", role: "ORG_STAFF" });
      toast.success("Staff invitation dispatched successfully.");
    },
    onError: (err) => {
      console.error("Provisioning Failure:", err);
      toast.error(
        err.response?.data?.error ||
          err.response?.data?.detail ||
          "Failed to provision staff member.",
      );
    },
  });

  // --- Mutation Pipeline: Revoke Access ---
  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      await api.delete(`/tenant/staff/${id}/`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenantStaff"] });
      toast.success("Staff access revoked permanently.");
    },
    onError: (err) => {
      toast.error(
        err.response?.data?.error ||
          "Failed to remove staff member. Check permissions.",
      );
    },
  });

  // --- Action Handlers & Filters ---
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
  };

  const handleInviteSubmit = (e) => {
    e.preventDefault();
    inviteMutation.mutate(newStaff);
  };

  const handleDelete = (id, name) => {
    if (
      !window.confirm(
        `Are you sure you want to permanently revoke access for ${name}?`,
      )
    ) {
      return;
    }
    deleteMutation.mutate(id);
  };

  // --- Formatters ---
  const getRoleBadge = (role) => {
    return role === "ORG_ADMIN" ? (
      <Badge
        variant="primary"
        className="bg-rose-500/10 text-rose-400 border-rose-500/20"
      >
        Admin
      </Badge>
    ) : (
      <Badge
        variant="default"
        className="bg-slate-800 text-slate-300 border-slate-700"
      >
        Staff
      </Badge>
    );
  };

  const getStatusBadge = (lastLogin, isActive) => {
    if (!isActive)
      return (
        <Badge
          variant="danger"
          className="bg-rose-500/10 text-rose-400 border-rose-500/20"
        >
          Access Revoked
        </Badge>
      );
    if (!lastLogin)
      return (
        <Badge
          variant="warning"
          className="bg-amber-500/10 text-amber-400 border-amber-500/20"
        >
          Pending Invite
        </Badge>
      );
    return (
      <Badge
        variant="success"
        className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
      >
        Active
      </Badge>
    );
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
    <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-24 p-6">
      {/* --- Workspace Header --- */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800/80 pb-6">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3 tracking-tight">
            <div className="p-1.5 rounded-lg bg-rose-500/10 border border-rose-500/20">
              <Users className="h-5 w-5 text-rose-500" />
            </div>
            Staff Management
          </h1>
          <p className="text-sm text-slate-400 mt-2">
            Control organizational access limits and monitor staff telemetry.
          </p>
        </div>
        <Button
          variant="primary"
          className="gap-2 shadow-lg w-full sm:w-auto"
          onClick={() => setIsModalOpen(true)}
        >
          <UserPlus className="h-4 w-4" />
          Provision Access
        </Button>
      </div>

      {/* --- Search Toolbar --- */}
      <div className="flex items-center bg-slate-900/40 backdrop-blur-md p-5 rounded-2xl border border-slate-800/60 shadow-sm">
        <div className="relative w-full max-w-lg group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 group-focus-within:text-rose-500 transition-colors" />
          <Input
            placeholder="Search directory by name or email identity..."
            className="pl-11 bg-slate-950/50 border-slate-700 h-11 focus:border-rose-500 focus:ring-rose-500/20 transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            aria-label="Search Staff"
          />
        </div>
      </div>

      {/* --- Primary Data Table Area --- */}
      <Card className="overflow-hidden border-slate-800/80 bg-slate-900/60 backdrop-blur-xl shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-950/40 text-xs uppercase text-slate-500 font-bold border-b border-slate-800/80">
              <tr>
                <th scope="col" className="px-6 py-5">
                  Personnel Identity
                </th>
                <th scope="col" className="px-6 py-5">
                  Clearance Level
                </th>
                <th scope="col" className="px-6 py-5">
                  Account Status
                </th>
                <th scope="col" className="px-6 py-5">
                  Telemetry (Last Active)
                </th>
                <th scope="col" className="px-6 py-5 text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {isLoading ? (
                <tr>
                  <td colSpan="5" className="px-6 py-24 text-center">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto text-rose-500 mb-4" />
                    <p className="text-sm font-medium tracking-widest uppercase text-slate-400">
                      Loading Directory...
                    </p>
                  </td>
                </tr>
              ) : isError ? (
                <tr>
                  <td colSpan="5" className="px-6 py-24 text-center">
                    <AlertCircle className="h-10 w-10 mx-auto text-rose-500 mb-4" />
                    <p className="text-slate-300 font-medium mb-4">
                      {fetchError?.message ||
                        "Failed to establish connection with security database."}
                    </p>
                    <Button
                      variant="outline"
                      className="border-slate-700 bg-slate-900/50"
                      onClick={() => refetch()}
                    >
                      Retry Connection
                    </Button>
                  </td>
                </tr>
              ) : filteredStaff.length > 0 ? (
                filteredStaff.map((staff) => {
                  const displayName = staff.first_name || staff.username;

                  return (
                    <tr
                      key={staff.id}
                      className="hover:bg-slate-800/30 transition-colors group"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4">
                          <div className="h-11 w-11 rounded-xl bg-slate-800/80 border border-slate-700 flex items-center justify-center font-bold text-slate-300 shadow-inner group-hover:bg-slate-800 transition-colors">
                            {displayName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-bold text-white text-sm">
                              {displayName}
                            </div>
                            <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500 mt-1 font-mono tracking-tight">
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
                        <div className="flex items-center gap-2 text-xs font-medium">
                          <Clock className="h-3.5 w-3.5 text-slate-500" />
                          {formatLastActive(staff.last_login)}
                        </div>
                      </td>

                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="sm"
                            title="Revoke Access"
                            aria-label={`Revoke access for ${displayName}`}
                            className="h-8 w-8 p-0 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 disabled:opacity-50 transition-colors"
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
                    className="px-6 py-24 text-center animate-in fade-in duration-500"
                  >
                    <div className="h-20 w-20 bg-slate-800/50 border border-slate-700 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-inner">
                      <UserX className="h-10 w-10 text-slate-500" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2 tracking-tight">
                      No Personnel Found
                    </h3>
                    <p className="text-slate-400 max-w-sm mx-auto leading-relaxed text-sm">
                      {searchTerm
                        ? `No records match the query "${searchTerm}".`
                        : "Your organizational directory is currently empty."}
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* --- Provision Access Modal --- */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => !inviteMutation.isPending && setIsModalOpen(false)}
        title="Provision Team Member"
      >
        <form onSubmit={handleInviteSubmit} className="space-y-6">
          {/* Developer Environment Alert */}
          <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 shadow-inner text-left">
            <div className="flex items-center gap-2 mb-2">
              <Terminal className="h-4 w-4 text-emerald-500" />
              <p className="text-xs font-bold uppercase tracking-wider text-emerald-500">
                Developer Notice
              </p>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed">
              If email routing is suppressed, check your{" "}
              <strong className="text-slate-300">Django terminal stdout</strong>{" "}
              to retrieve the temporary password generated for this staff
              member.
            </p>
          </div>

          <div className="space-y-5">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Full Name *
              </label>
              <Input
                name="name"
                placeholder="E.g. Jane Smith"
                value={newStaff.name}
                onChange={handleInviteChange}
                className="bg-slate-950/50 h-11 border-slate-700 focus:border-rose-500"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Official Email Address *
              </label>
              <Input
                type="email"
                name="email"
                placeholder="jane.smith@hospital.com"
                value={newStaff.email}
                onChange={handleInviteChange}
                className="bg-slate-950/50 h-11 border-slate-700 focus:border-rose-500"
                required
              />
              <p className="text-xs text-slate-500 font-medium pt-1">
                A temporary cryptographic key will be transmitted to this inbox.
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Security Clearance Level *
              </label>
              <Select
                name="role"
                value={newStaff.role}
                onChange={handleInviteChange}
                className="bg-slate-950/50 h-11 border-slate-700 focus:border-rose-500"
              >
                <option value="ORG_STAFF">
                  Staff (Registry CRUD operations only)
                </option>
                <option value="ORG_ADMIN">
                  Admin (Full tenant configuration access)
                </option>
              </Select>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t border-slate-800">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsModalOpen(false)}
              disabled={inviteMutation.isPending}
              className="text-slate-400 hover:text-white"
            >
              Abort
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={inviteMutation.isPending}
              className="min-w-40 shadow-lg"
            >
              {inviteMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />{" "}
                  Provisioning...
                </>
              ) : (
                "Dispatch Invite"
              )}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
