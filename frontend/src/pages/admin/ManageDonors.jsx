import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Users,
  Plus,
  Edit,
  Archive,
  Calendar,
  Loader2,
  AlertCircle,
  Droplet,
  FileUp,
  Download,
  CheckCircle2,
  SearchX,
  MapPin,
  Save,
  MessageCircle,
  Clock,
  Filter,
} from "lucide-react";
import toast from "react-hot-toast";

import { Button } from "../../components/ui/Button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import { Modal } from "../../components/ui/Modal";
import { Input } from "../../components/ui/Input";
import { Select } from "../../components/ui/Select"; // Ensure this is imported!
import { DonorFilters } from "../../components/donors/DonorFilters";
import api from "../../lib/axios";

export default function ManageDonors() {
  const queryClient = useQueryClient();

  // --- Filtering & Bulk Upload State ---
  const [activeFilters, setActiveFilters] = useState({
    bloodGroup: "",
    searchQuery: "",
  });

  // NEW: Status Filter State
  const [statusFilter, setStatusFilter] = useState("AVAILABLE");

  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadResult, setUploadResult] = useState(null);

  // --- Edit Donor State ---
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingDonor, setEditingDonor] = useState(null);

  // --- Donation Logging State ---
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [donorToLog, setDonorToLog] = useState(null);
  const [donationLogData, setDonationLogData] = useState({
    donation_type: "WHOLE_BLOOD",
    donation_date: new Date().toISOString().split("T")[0],
    clinical_notes: "",
  });

  // --- Query Pipeline: Fetch Registry ---
  const {
    data: donors = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["tenantDonors"],
    queryFn: async () => {
      const response = await api.get("/tenant/donors/");
      return response.data.results || response.data;
    },
  });

  // --- Mutation: Log Clinical Donation ---
  const logDonationMutation = useMutation({
    mutationFn: async (payload) => {
      const response = await api.post(
        `/tenant/donors/${donorToLog.id}/log-donation/`,
        payload,
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenantDonors"] });
      queryClient.invalidateQueries({ queryKey: ["tenant-dashboard-stats"] });
      toast.success("Clinical record updated. Cooldown recalculated.");
      setIsLogModalOpen(false);
      setDonorToLog(null);
    },
    onError: (err) => toast.error("Failed to log donation record."),
  });

  // --- Mutation Pipeline: Edit Record ---
  const editMutation = useMutation({
    mutationFn: async (updatedData) => {
      const response = await api.patch(
        `/tenant/donors/${updatedData.id}/`,
        updatedData,
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenantDonors"] });
      queryClient.invalidateQueries({ queryKey: ["tenant-dashboard-stats"] });
      toast.success("Donor record updated successfully.");
      setIsEditModalOpen(false);
      setEditingDonor(null);
    },
    onError: (err) => {
      toast.error(
        err.response?.data?.error ||
          err.response?.data?.detail ||
          "Failed to update record. Check server logs.",
      );
    },
  });

  // --- Mutation Pipeline: Archive Record ---
  const deleteMutation = useMutation({
    mutationFn: async (id) => await api.delete(`/tenant/donors/${id}/`),

    onMutate: async (deletedId) => {
      await queryClient.cancelQueries({ queryKey: ["tenantDonors"] });
      const previousDonors = queryClient.getQueryData(["tenantDonors"]);
      queryClient.setQueryData(["tenantDonors"], (oldDonors) =>
        oldDonors ? oldDonors.filter((donor) => donor.id !== deletedId) : [],
      );
      return { previousDonors };
    },

    onError: (err, deletedId, context) => {
      queryClient.setQueryData(["tenantDonors"], context.previousDonors);
      toast.error("Network sync failed. Archival rolled back.", {
        icon: "📡",
      });
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["tenantDonors"] });
      queryClient.invalidateQueries({ queryKey: ["tenant-dashboard-stats"] });
    },

    onSuccess: () => {
      toast.success("Donor record archived successfully.");
    },
  });

  // --- Mutation Pipeline: Bulk Ingest ---
  const uploadMutation = useMutation({
    mutationFn: async (formData) => {
      const response = await api.post("/tenant/donors/bulk-upload/", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return response.data;
    },
    onSuccess: (data) => {
      setUploadResult({
        success: true,
        message: data.message,
        errors: data.errors,
      });
      queryClient.invalidateQueries({ queryKey: ["tenantDonors"] });
      queryClient.invalidateQueries({ queryKey: ["tenant-dashboard-stats"] });
      setUploadFile(null);
      toast.success("Batch import processed successfully.");
    },
    onError: (err) => {
      setUploadResult({
        success: false,
        message:
          err.response?.data?.error ||
          "A critical error occurred during the ingestion sequence.",
      });
      toast.error("Batch import failed.");
    },
  });

  // --- Action Handlers ---
  const handleEditChange = (e) => {
    const { name, value, type, checked } = e.target;
    setEditingDonor((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleEditSubmit = (e) => {
    e.preventDefault();
    if (!editingDonor) return;

    const payload = {
      id: editingDonor.id,
      full_name: editingDonor.full_name,
      phone_number: editingDonor.phone_number,
      blood_group: editingDonor.blood_group,
      gender: editingDonor.gender,
      date_of_birth: editingDonor.date_of_birth,
      last_donation_date: editingDonor.last_donation_date || null,
      is_permanently_deferred: editingDonor.is_permanently_deferred || false,
    };

    editMutation.mutate(payload);
  };

  const handleDelete = (id, name) => {
    if (
      !window.confirm(
        `Are you sure you want to archive ${name}? This will suspend them from the active public registry.`,
      )
    ) {
      return;
    }
    deleteMutation.mutate(id);
  };

  const handleFileUpload = (e) => {
    e.preventDefault();
    if (!uploadFile) return;

    setUploadResult(null);
    const formData = new FormData();
    formData.append("file", uploadFile);
    uploadMutation.mutate(formData);
  };

  const downloadTemplate = () => {
    const headers =
      "full_name,phone_number,date_of_birth,gender,blood_group,last_donation_date\n";
    const example = "John Doe,+919876543210,1995-08-24,M,O+,2026-01-15\n";
    const blob = new Blob([headers + example], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "bloodconnect_donor_import_template.csv";
    a.click();
    toast("Template downloaded.", { icon: "📥" });
  };

  // --- Client-Side Search & Filter Engine ---
  const filteredDonors = donors.filter((donor) => {
    // 1. Apply Status Filter
    if (statusFilter === "AVAILABLE" && !donor.is_available_now) return false;
    if (
      statusFilter === "RESTING" && 
      (donor.is_available_now || donor.is_permanently_deferred)
    )
      return false;
    if (statusFilter === "DEFERRED" && !donor.is_permanently_deferred)
      return false;

    // 2. Apply Blood Group Filter
    const matchesBloodGroup = activeFilters.bloodGroup
      ? donor.blood_group === activeFilters.bloodGroup
      : true;

    // 3. Apply Text Search
    const searchLower = activeFilters.searchQuery?.toLowerCase() || "";
    const matchesSearch = searchLower
      ? donor.full_name.toLowerCase().includes(searchLower) ||
        donor.phone_number.includes(searchLower)
      : true;

    return matchesBloodGroup && matchesSearch;
  });

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* --- Workspace Header --- */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800/80 pb-6">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3 tracking-tight">
            <div className="p-1.5 rounded-lg bg-rose-500/10 border border-rose-500/20">
              <Users className="h-5 w-5 text-rose-500" />
            </div>
            Donor Registry
          </h1>
          <p className="text-sm text-slate-400 mt-2">
            Administer your organization's verified blood donor pool.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Button
            variant="outline"
            className="gap-2 border-slate-700 bg-slate-900/50 hover:bg-slate-800 text-slate-300 w-full sm:w-auto transition-colors"
            onClick={() => setIsUploadModalOpen(true)}
          >
            <FileUp className="h-4 w-4" /> Bulk Import
          </Button>
          <Link to="/admin/add-donor" className="w-full sm:w-auto">
            <Button
              variant="primary"
              className="gap-2 shadow-lg w-full sm:w-auto"
            >
              <Plus className="h-4 w-4" /> Register Donor
            </Button>
          </Link>
        </div>
      </div>

      {/* --- High-Level Analytics Matrix --- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
        <Card className="bg-slate-900/40 border-slate-800/60 shadow-md">
          <CardContent className="p-5 flex items-center gap-5">
            <div className="h-12 w-12 rounded-xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20 shrink-0">
              <Users className="h-6 w-6 text-blue-500" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-0.5">
                Total Records
              </p>
              <p className="text-2xl font-black text-white">{donors.length}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/40 border-emerald-500/20 shadow-md">
          <CardContent className="p-5 flex items-center gap-5">
            <div className="h-12 w-12 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 shrink-0">
              <Droplet className="h-6 w-6 text-emerald-500" />
            </div>
            <div>
              <p className="text-xs font-bold text-emerald-500 uppercase tracking-wider mb-0.5">
                Available Now
              </p>
              <p className="text-2xl font-black text-white">
                {donors.filter((d) => d.is_available_now).length}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/40 border-amber-500/20 shadow-md">
          <CardContent className="p-5 flex items-center gap-5">
            <div className="h-12 w-12 rounded-xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20 shrink-0">
              <Calendar className="h-6 w-6 text-amber-500" />
            </div>
            <div>
              <p className="text-xs font-bold text-amber-500 uppercase tracking-wider mb-0.5">
                Resting Period
              </p>
              <p className="text-2xl font-black text-white">
                {
                  donors.filter(
                    (d) => !d.is_available_now && !d.is_permanently_deferred,
                  ).length
                }
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* --- Primary Data Table Area --- */}
      <Card className="border-slate-800/80 bg-slate-900/60 backdrop-blur-xl shadow-2xl">
        <CardHeader className="border-b border-slate-800/60 pb-5">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
            <CardTitle className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
              Active Registry
            </CardTitle>

            {/* Status Filter Dropdown */}
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-slate-500" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-slate-300 focus:outline-none focus:border-rose-500 transition-colors"
              >
                <option value="ALL">All Donors</option>
                <option value="AVAILABLE">Available Only</option>
                <option value="RESTING">Resting Period Only</option>
                <option value="DEFERRED">Deferred Only</option>
              </select>
            </div>
          </div>
          <DonorFilters onFilter={setActiveFilters} />
        </CardHeader>

        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-24 text-slate-400 gap-4">
              <Loader2 className="h-8 w-8 animate-spin text-rose-500" />
              <p className="text-sm font-medium tracking-widest uppercase">
                Fetching Records...
              </p>
            </div>
          ) : isError ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <AlertCircle className="h-10 w-10 mb-4 text-rose-500" />
              <p className="text-slate-300 font-medium mb-4">
                {error?.message ||
                  "Failed to establish connection with registry database."}
              </p>
              <Button
                variant="outline"
                className="border-slate-700 bg-slate-900/50"
                onClick={() => refetch()}
              >
                Retry Connection
              </Button>
            </div>
          ) : donors.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center px-4 animate-in fade-in duration-500">
              <div className="h-20 w-20 bg-slate-800/50 border border-slate-700 rounded-2xl flex items-center justify-center mb-6 shadow-inner">
                <Users className="h-10 w-10 text-slate-500" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2 tracking-tight">
                Registry Empty
              </h3>
              <p className="text-slate-400 max-w-sm mb-8 leading-relaxed text-sm">
                Your organizational pool currently has no donors registered.
              </p>
              <Link to="/admin/add-donor">
                <Button variant="primary" className="shadow-lg">
                  Register New Donor
                </Button>
              </Link>
            </div>
          ) : filteredDonors.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center px-4 animate-in fade-in duration-300">
              <SearchX className="h-12 w-12 text-slate-600 mb-4" />
              <h3 className="text-lg font-bold text-white mb-2">
                No Matches Found
              </h3>
              <p className="text-slate-400 text-sm max-w-sm">
                No records match your search query or status filters.
              </p>
            </div>
          ) : (
            <>
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800/80 text-xs uppercase tracking-wider text-slate-500 font-bold bg-slate-950/40">
                      <th className="px-6 py-5">Donor Identity</th>
                      <th className="px-6 py-5">Contact Vector</th>
                      <th className="px-6 py-5">Location Lock</th>
                      <th className="px-6 py-5">Operational Status</th>
                      <th className="px-6 py-5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50">
                    {filteredDonors.map((donor) => (
                      <tr
                        key={donor.id}
                        className="hover:bg-slate-800/30 transition-colors group"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-4">
                            <div className="h-11 w-11 rounded-xl bg-rose-500/10 text-rose-500 border border-rose-500/20 flex items-center justify-center font-black text-sm shadow-inner group-hover:bg-rose-500/20 transition-colors">
                              {donor.blood_group}
                            </div>
                            <div>
                              <p className="font-bold text-white text-sm">
                                {donor.full_name}
                              </p>
                              <p className="text-xs font-medium text-slate-500 mt-0.5">
                                {donor.gender === "M"
                                  ? "Male"
                                  : donor.gender === "F"
                                    ? "Female"
                                    : "Other"}{" "}
                                • {donor.date_of_birth}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm font-semibold text-slate-300 font-mono tracking-tight">
                            {donor.phone_number}
                          </p>
                          <p className="text-xs font-medium text-slate-500 mt-1">
                            Last Donated:{" "}
                            {donor.last_donation_date || "No History"}
                          </p>
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-900 border border-slate-800 text-xs font-medium text-slate-300">
                            <MapPin className="h-3 w-3 text-slate-500" />
                            {donor.district_name || "Unknown"}
                          </span>
                        </td>

                        {/* DYNAMIC BADGE */}
                        <td className="px-6 py-4">
                          {donor.is_available_now ? (
                            <Badge
                              variant="success"
                              className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                            >
                              Available
                            </Badge>
                          ) : donor.is_permanently_deferred ? (
                            <Badge
                              variant="danger"
                              className="bg-rose-500/10 text-rose-400 border-rose-500/20"
                            >
                              Deferred
                            </Badge>
                          ) : (
                            <Badge
                              variant="warning"
                              className="bg-amber-500/10 text-amber-400 border-amber-500/20 gap-1"
                            >
                              <Clock className="h-3 w-3" /> Resting
                            </Badge>
                          )}
                        </td>

                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                            <a
                              href={`https://wa.me/${donor.phone_number?.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(`Hello ${donor.full_name}, this is an urgent message from the blood bank. We currently have a critical need for ${donor.blood_group} blood. Are you available to donate today?`)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              title="Message Donor on WhatsApp"
                              className="h-8 w-8 flex items-center justify-center rounded-md text-emerald-500/70 hover:text-emerald-400 hover:bg-emerald-500/10 transition-colors"
                            >
                              <MessageCircle className="h-4 w-4" />
                            </a>
                            <Button
                              variant="ghost"
                              size="sm"
                              title="Log New Donation"
                              className="h-8 w-8 p-0 text-emerald-500/70 hover:text-emerald-400 hover:bg-emerald-500/10 transition-colors"
                              onClick={() => {
                                setDonorToLog(donor);
                                setDonationLogData({
                                  ...donationLogData,
                                  donation_date: new Date()
                                    .toISOString()
                                    .split("T")[0],
                                });
                                setIsLogModalOpen(true);
                              }}
                            >
                              <Droplet className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-slate-400 hover:text-blue-400 hover:bg-blue-500/10"
                              aria-label={`Edit ${donor.full_name}`}
                              onClick={() => {
                                setEditingDonor(donor);
                                setIsEditModalOpen(true);
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              title="Archive Record"
                              aria-label={`Archive ${donor.full_name}`}
                              className="h-8 w-8 p-0 text-amber-500/70 hover:text-amber-400 hover:bg-amber-500/10 disabled:opacity-50 transition-colors"
                              onClick={() =>
                                handleDelete(donor.id, donor.full_name)
                              }
                              disabled={deleteMutation.isPending}
                            >
                              {deleteMutation.isPending &&
                              deleteMutation.variables === donor.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Archive className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* MOBILE STACKED VIEW */}
              <div className="md:hidden flex flex-col gap-4 p-4">
                {filteredDonors.map((donor) => (
                  <div
                    key={donor.id}
                    className="bg-slate-900/50 border border-slate-800 rounded-2xl p-4 flex flex-col gap-4 shadow-sm"
                  >
                    <div className="flex justify-between items-start gap-3">
                      <div className="flex items-center gap-3">
                        <div className="h-11 w-11 rounded-xl bg-rose-500/10 text-rose-500 border border-rose-500/20 flex items-center justify-center font-black text-sm shadow-inner shrink-0">
                          {donor.blood_group}
                        </div>
                        <div>
                          <p className="font-bold text-white text-[15px] leading-tight">
                            {donor.full_name}
                          </p>
                          <p className="text-xs font-medium text-slate-500 mt-0.5">
                            {donor.gender === "M"
                              ? "Male"
                              : donor.gender === "F"
                                ? "Female"
                                : "Other"}{" "}
                            • {donor.date_of_birth}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div className="bg-slate-950/50 p-2.5 rounded-xl border border-slate-800/80">
                        <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                          Contact
                        </span>
                        <a href={`tel:${donor.phone_number}`} className="font-semibold text-slate-300 font-mono tracking-tight">
                          {donor.phone_number}
                        </a>
                      </div>
                      <div className="bg-slate-950/50 p-2.5 rounded-xl border border-slate-800/80">
                        <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                          Location
                        </span>
                        <span className="font-semibold text-slate-300 flex items-center gap-1.5 truncate">
                          <MapPin className="h-3 w-3 text-slate-500 shrink-0" />
                          <span className="truncate">
                            {donor.district_name || "Unknown"}
                          </span>
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-slate-800/80">
                      <div>
                        {/* DYNAMIC BADGE MOBILE */}
                        {donor.is_available_now ? (
                          <Badge
                            variant="success"
                            className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                          >
                            Available
                          </Badge>
                        ) : donor.is_permanently_deferred ? (
                          <Badge
                            variant="danger"
                            className="bg-rose-500/10 text-rose-400 border-rose-500/20"
                          >
                            Deferred
                          </Badge>
                        ) : (
                          <Badge
                            variant="warning"
                            className="bg-amber-500/10 text-amber-400 border-amber-500/20 gap-1"
                          >
                            <Clock className="h-3 w-3" /> Resting
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-9 w-9 p-0 text-emerald-500/70 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 transition-colors"
                          title="Log New Donation"
                          onClick={() => {
                            setDonorToLog(donor);
                            setDonationLogData({
                              ...donationLogData,
                              donation_date: new Date()
                                .toISOString()
                                .split("T")[0],
                            });
                            setIsLogModalOpen(true);
                          }}
                        >
                          <Droplet className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-9 w-9 p-0 text-slate-400 bg-slate-800/50 hover:bg-slate-800"
                          onClick={() => {
                            setEditingDonor(donor);
                            setIsEditModalOpen(true);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-9 w-9 p-0 text-amber-500/80 bg-amber-500/10 border border-amber-500/20"
                          onClick={() =>
                            handleDelete(donor.id, donor.full_name)
                          }
                          disabled={deleteMutation.isPending}
                        >
                          {deleteMutation.isPending &&
                          deleteMutation.variables === donor.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Archive className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* --- Log Clinical Donation Modal --- */}
      <Modal
        isOpen={isLogModalOpen}
        onClose={() => {
          setIsLogModalOpen(false);
          setDonorToLog(null);
        }}
        title="Log Clinical Donation"
      >
        {donorToLog && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              logDonationMutation.mutate(donationLogData);
            }}
            className="space-y-6"
          >
            <div className="bg-slate-950/50 p-4 rounded-xl border border-slate-800/80 mb-6">
              <div className="text-xs text-slate-500 uppercase tracking-wider font-bold mb-1">
                Target Donor
              </div>
              <div className="text-sm font-semibold text-white flex items-center gap-2">
                {donorToLog.full_name}{" "}
                <Badge variant="primary" className="py-0">
                  {donorToLog.blood_group}
                </Badge>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-400 uppercase">
                  Donation Type
                </label>
                <select
                  className="flex h-11 w-full rounded-xl border border-slate-700/80 bg-slate-950/50 px-4 py-2 text-sm text-slate-100 focus:ring-1 focus:ring-rose-500"
                  value={donationLogData.donation_type}
                  onChange={(e) =>
                    setDonationLogData({
                      ...donationLogData,
                      donation_type: e.target.value,
                    })
                  }
                  required
                >
                  <option value="WHOLE_BLOOD">
                    Whole Blood (90-120 day cooldown)
                  </option>
                  <option value="PLATELETS">
                    Platelets Apheresis (14 day cooldown)
                  </option>
                  <option value="PLASMA">Plasma (28 day cooldown)</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-400 uppercase">
                  Date of Extraction
                </label>
                <Input
                  type="date"
                  className="h-11 bg-slate-950/50"
                  value={donationLogData.donation_date}
                  max={new Date().toISOString().split("T")[0]} // Prevent future dates
                  onChange={(e) =>
                    setDonationLogData({
                      ...donationLogData,
                      donation_date: e.target.value,
                    })
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-400 uppercase">
                  Clinical Notes (Optional)
                </label>
                <textarea
                  className="w-full rounded-xl border border-slate-700/80 bg-slate-950/50 px-4 py-3 text-sm text-slate-100 placeholder-slate-600 focus:border-rose-500 focus:ring-1 focus:ring-rose-500/30 resize-none h-24"
                  placeholder="E.g., Low hemoglobin initial reading, 500ml extracted..."
                  value={donationLogData.clinical_notes}
                  onChange={(e) =>
                    setDonationLogData({
                      ...donationLogData,
                      clinical_notes: e.target.value,
                    })
                  }
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-6 border-t border-slate-800">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setIsLogModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={logDonationMutation.isPending}
              >
                {logDonationMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Commit Record"
                )}
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* --- Edit Donor Modal --- */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingDonor(null);
        }}
        title="Edit Donor Record"
      >
        {editingDonor && (
          <form onSubmit={handleEditSubmit} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="space-y-2 sm:col-span-2">
                <label className="text-xs font-semibold text-slate-400 uppercase">
                  Full Name
                </label>
                <Input
                  name="full_name"
                  value={editingDonor.full_name || ""}
                  onChange={handleEditChange}
                  className="bg-slate-950/50"
                  required
                  autoFocus
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-400 uppercase">
                  Phone Number
                </label>
                <Input
                  name="phone_number"
                  value={editingDonor.phone_number || ""}
                  onChange={handleEditChange}
                  className="bg-slate-950/50"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-400 uppercase">
                  Blood Group
                </label>
                <select
                  name="blood_group"
                  value={editingDonor.blood_group || ""}
                  onChange={handleEditChange}
                  className="flex h-10 w-full rounded-md border border-slate-700 bg-slate-950/50 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-rose-500 transition-colors"
                  required
                >
                  <option value="" disabled>
                    Select Group
                  </option>
                  {["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"].map(
                    (bg) => (
                      <option key={bg} value={bg}>
                        {bg}
                      </option>
                    ),
                  )}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-400 uppercase">
                  Gender
                </label>
                <select
                  name="gender"
                  value={editingDonor.gender || ""}
                  onChange={handleEditChange}
                  className="flex h-10 w-full rounded-md border border-slate-700 bg-slate-950/50 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-rose-500 transition-colors"
                  required
                >
                  <option value="" disabled>
                    Select Gender
                  </option>
                  <option value="M">Male</option>
                  <option value="F">Female</option>
                  <option value="O">Other</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-400 uppercase">
                  Date of Birth
                </label>
                <Input
                  name="date_of_birth"
                  type="date"
                  value={editingDonor.date_of_birth || ""}
                  onChange={handleEditChange}
                  className="bg-slate-950/50"
                  required
                />
              </div>

              <div className="space-y-2 sm:col-span-2">
                <label className="text-xs font-semibold text-slate-400 uppercase">
                  Last Donation Date
                </label>
                <Input
                  name="last_donation_date"
                  type="date"
                  value={editingDonor.last_donation_date || ""}
                  onChange={handleEditChange}
                  className="bg-slate-950/50"
                />
              </div>

              <div className="space-y-2 sm:col-span-2">
                <label className="flex items-center gap-3 p-4 rounded-xl border border-rose-500/20 bg-rose-500/5 cursor-pointer hover:bg-rose-500/10 transition-colors">
                  <input
                    type="checkbox"
                    name="is_permanently_deferred"
                    checked={editingDonor.is_permanently_deferred || false}
                    onChange={handleEditChange}
                    className="h-5 w-5 rounded border-slate-600 bg-slate-950 text-rose-500 focus:ring-rose-500"
                  />
                  <div className="text-sm">
                    <span className="font-semibold text-rose-400 block mb-1">
                      Permanently Deferred
                    </span>
                    <span className="text-slate-400 text-xs">
                      Mark this donor as medically ineligible for future
                      donations. They will no longer appear in public search
                      results.
                    </span>
                  </div>
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-6 border-t border-slate-800">
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setIsEditModalOpen(false);
                  setEditingDonor(null);
                }}
                className="text-slate-400 hover:text-white"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={editMutation.isPending}
                className="gap-2 shadow-lg"
              >
                {editMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                Save Changes
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* --- Batch Import Modal --- */}
      <Modal
        isOpen={isUploadModalOpen}
        onClose={() => {
          setIsUploadModalOpen(false);
          setUploadResult(null);
        }}
        title="Batch Record Ingestion"
      >
        <div className="space-y-6">
          <p className="text-sm text-slate-400 leading-relaxed">
            Upload an authorized CSV payload to map legacy records to your
            current tenant workspace. All imported entities are automatically
            locked to your organizational jurisdiction.
          </p>

          <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-between shadow-inner">
            <div className="flex items-center gap-3">
              <Download className="h-5 w-5 text-emerald-500" />
              <div className="text-sm text-white font-medium">
                Standard Ingestion Matrix
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={downloadTemplate}
              className="border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
            >
              Download Template
            </Button>
          </div>

          {/* Ingestion Telemetry Feedback */}
          {uploadResult && (
            <div
              className={`p-4 rounded-xl text-sm border ${
                uploadResult.success
                  ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                  : "bg-rose-500/10 border-rose-500/20 text-rose-400"
              }`}
            >
              <div className="flex items-center gap-2 font-bold mb-2">
                {uploadResult.success ? (
                  <CheckCircle2 className="h-5 w-5" />
                ) : (
                  <AlertCircle className="h-5 w-5" />
                )}
                {uploadResult.message}
              </div>
              {uploadResult.errors && uploadResult.errors.length > 0 && (
                <ul className="list-disc pl-5 space-y-1 mt-2 text-xs opacity-80 max-h-32 overflow-y-auto">
                  {uploadResult.errors.slice(0, 5).map((err, i) => (
                    <li key={i}>{err}</li>
                  ))}
                  {uploadResult.errors.length > 5 && (
                    <li className="font-semibold pt-1">
                      ...and {uploadResult.errors.length - 5} additional
                      warnings suppressed.
                    </li>
                  )}
                </ul>
              )}
            </div>
          )}

          {/* Upload Input Target */}
          <form onSubmit={handleFileUpload}>
            <div className="space-y-4">
              <label className="block w-full cursor-pointer group">
                <input
                  type="file"
                  accept=".csv"
                  className="hidden"
                  onChange={(e) => setUploadFile(e.target.files[0])}
                />
                <div
                  className={`flex flex-col items-center justify-center w-full h-36 border-2 border-dashed rounded-2xl transition-all duration-300 ${
                    uploadFile
                      ? "border-emerald-500 bg-emerald-500/5"
                      : "border-slate-700 group-hover:border-rose-500/50 bg-slate-900/50 group-hover:bg-slate-900/80"
                  }`}
                >
                  {uploadFile ? (
                    <>
                      <CheckCircle2 className="h-10 w-10 text-emerald-500 mb-3" />
                      <span className="text-emerald-400 font-semibold tracking-wide">
                        {uploadFile.name}
                      </span>
                    </>
                  ) : (
                    <>
                      <FileUp className="h-10 w-10 text-slate-500 mb-3 group-hover:text-rose-500 transition-colors" />
                      <span className="text-slate-400 text-sm font-medium">
                        Click to browse or drop CSV payload
                      </span>
                    </>
                  )}
                </div>
              </label>
            </div>

            <div className="flex justify-end gap-3 mt-8 pt-5 border-t border-slate-800">
              <Button
                type="button"
                variant="ghost"
                className="text-slate-400 hover:text-white"
                onClick={() => {
                  setIsUploadModalOpen(false);
                  setUploadResult(null);
                }}
              >
                Abort
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={!uploadFile || uploadMutation.isPending}
                className="min-w-40 font-semibold shadow-lg"
              >
                {uploadMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />{" "}
                    Processing...
                  </>
                ) : (
                  "Execute Import"
                )}
              </Button>
            </div>
          </form>
        </div>
      </Modal>
    </div>
  );
}
