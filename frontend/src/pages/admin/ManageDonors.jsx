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
  FileDown, // <-- Added for export icon
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
import { Select } from "../../components/ui/Select";
import { DonorFilters } from "../../components/donors/DonorFilters";
import api from "../../lib/axios";

export default function ManageDonors() {
  const queryClient = useQueryClient();

  const [activeFilters, setActiveFilters] = useState({
    bloodGroup: "",
    searchQuery: "",
  });

  const [statusFilter, setStatusFilter] = useState("AVAILABLE");
  const [isExporting, setIsExporting] = useState(false); // <-- Export Loading State

  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadResult, setUploadResult] = useState(null);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingDonor, setEditingDonor] = useState(null);

  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [donorToLog, setDonorToLog] = useState(null);
  const [donationLogData, setDonationLogData] = useState({
    donation_type: "WHOLE_BLOOD",
    donation_date: new Date().toISOString().split("T")[0],
    clinical_notes: "",
  });

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

  const handleExportCSV = async () => {
    setIsExporting(true);
    const toastId = toast.loading("Generating secure CSV export...");
    try {
      const response = await api.get("/tenant/donors/export/", {
        responseType: "blob", // Important for downloading files!
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      // Extract filename from header if possible, otherwise fallback
      const contentDisposition = response.headers["content-disposition"];
      let fileName = "donor_registry.csv";
      if (contentDisposition) {
        const fileNameMatch = contentDisposition.match(/filename="(.+)"/);
        if (fileNameMatch.length === 2) fileName = fileNameMatch[1];
      }

      link.setAttribute("download", fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();

      toast.success("CSV export downloaded successfully.", { id: toastId });
    } catch (err) {
      toast.error("Failed to export registry. Please try again.", {
        id: toastId,
      });
    } finally {
      setIsExporting(false);
    }
  };

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
    a.download = "bloodonate_donor_import_template.csv";
    a.click();
    toast("Template downloaded.", { icon: "📥" });
  };

  const filteredDonors = donors.filter((donor) => {
    if (statusFilter === "AVAILABLE" && !donor.is_available_now) return false;
    if (
      statusFilter === "RESTING" &&
      (donor.is_available_now || donor.is_permanently_deferred)
    )
      return false;
    if (statusFilter === "DEFERRED" && !donor.is_permanently_deferred)
      return false;

    const matchesBloodGroup = activeFilters.bloodGroup
      ? donor.blood_group === activeFilters.bloodGroup
      : true;

    const searchLower = activeFilters.searchQuery?.toLowerCase() || "";
    const matchesSearch = searchLower
      ? donor.full_name.toLowerCase().includes(searchLower) ||
        donor.phone_number.includes(searchLower)
      : true;

    return matchesBloodGroup && matchesSearch;
  });

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 dark:border-slate-800/80 pb-6 transition-colors duration-300">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3 tracking-tight transition-colors duration-300 text-slate-900 dark:text-white">
            <div className="p-1.5 rounded-lg border shadow-inner transition-colors duration-300 bg-rose-50 border-rose-200 dark:bg-rose-500/10 dark:border-rose-500/20">
              <Users className="h-5 w-5 transition-colors duration-300 text-rose-600 dark:text-rose-500" />
            </div>
            Donor Registry
          </h1>
          <p className="text-sm mt-2 transition-colors duration-300 text-slate-600 dark:text-slate-400">
            Administer your organization's verified blood donor pool.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto flex-wrap">
          <Button
            variant="outline"
            className="gap-2 w-full sm:w-auto transition-colors duration-300 text-slate-700 border-slate-200 bg-white hover:bg-slate-50 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-900/50 dark:hover:bg-slate-800 dark:text-slate-300"
            onClick={handleExportCSV}
            disabled={isExporting || donors.length === 0}
            title="Download full registry as CSV"
          >
            {isExporting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <FileDown className="h-4 w-4" />
            )}
            Export CSV
          </Button>

          <Button
            variant="outline"
            className="gap-2 w-full sm:w-auto transition-colors duration-300 text-slate-700 border-slate-200 bg-white hover:bg-slate-50 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-900/50 dark:hover:bg-slate-800 dark:text-slate-300"
            onClick={() => setIsUploadModalOpen(true)}
          >
            <FileUp className="h-4 w-4" /> Bulk Import
          </Button>
          <Link to="/admin/add-donor" className="w-full sm:w-auto">
            <Button
              variant="primary"
              className="gap-2 shadow-md w-full sm:w-auto dark:shadow-lg"
            >
              <Plus className="h-4 w-4" /> Register Donor
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
        <Card className="shadow-md transition-colors duration-300 bg-white/60 border-slate-200 dark:bg-slate-900/40 dark:border-slate-800/60">
          <CardContent className="p-5 flex items-center gap-5">
            <div className="h-12 w-12 rounded-xl flex items-center justify-center border shrink-0 transition-colors duration-300 bg-blue-50 border-blue-200 dark:bg-blue-500/10 dark:border-blue-500/20">
              <Users className="h-6 w-6 transition-colors duration-300 text-blue-600 dark:text-blue-500" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider mb-0.5 transition-colors duration-300 text-slate-500">
                Total Records
              </p>
              <p className="text-2xl font-black transition-colors duration-300 text-slate-900 dark:text-white">
                {donors.length}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-md transition-colors duration-300 bg-white/60 border-emerald-200 dark:bg-slate-900/40 dark:border-emerald-500/20">
          <CardContent className="p-5 flex items-center gap-5">
            <div className="h-12 w-12 rounded-xl flex items-center justify-center border shrink-0 transition-colors duration-300 bg-emerald-50 border-emerald-200 dark:bg-emerald-500/10 dark:border-emerald-500/20">
              <Droplet className="h-6 w-6 transition-colors duration-300 text-emerald-600 dark:text-emerald-500" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider mb-0.5 transition-colors duration-300 text-emerald-600 dark:text-emerald-500">
                Available Now
              </p>
              <p className="text-2xl font-black transition-colors duration-300 text-slate-900 dark:text-white">
                {donors.filter((d) => d.is_available_now).length}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-md transition-colors duration-300 bg-white/60 border-amber-200 dark:bg-slate-900/40 dark:border-amber-500/20">
          <CardContent className="p-5 flex items-center gap-5">
            <div className="h-12 w-12 rounded-xl flex items-center justify-center border shrink-0 transition-colors duration-300 bg-amber-50 border-amber-200 dark:bg-amber-500/10 dark:border-amber-500/20">
              <Calendar className="h-6 w-6 transition-colors duration-300 text-amber-600 dark:text-amber-500" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider mb-0.5 transition-colors duration-300 text-amber-600 dark:text-amber-500">
                Resting Period
              </p>
              <p className="text-2xl font-black transition-colors duration-300 text-slate-900 dark:text-white">
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

      <Card className="backdrop-blur-xl shadow-xl transition-colors duration-300 bg-white/80 border-slate-200 dark:border-slate-800/80 dark:bg-slate-900/60 dark:shadow-2xl">
        <CardHeader className="border-b pb-5 transition-colors duration-300 border-slate-200 dark:border-slate-800/60">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
            <CardTitle className="text-lg font-bold tracking-tight flex items-center gap-2 transition-colors duration-300 text-slate-900 dark:text-white">
              Active Registry
            </CardTitle>

            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 transition-colors duration-300 text-slate-500" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-colors bg-white border border-slate-200 text-slate-700 dark:bg-slate-950 dark:border-slate-700 dark:text-slate-300"
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
            <div className="flex flex-col items-center justify-center py-24 gap-4 transition-colors duration-300 text-slate-500 dark:text-slate-400">
              <Loader2 className="h-8 w-8 animate-spin transition-colors duration-300 text-rose-600 dark:text-rose-500" />
              <p className="text-sm font-medium tracking-widest uppercase">
                Fetching Records...
              </p>
            </div>
          ) : isError ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <AlertCircle className="h-10 w-10 mb-4 transition-colors duration-300 text-rose-600 dark:text-rose-500" />
              <p className="font-medium mb-4 transition-colors duration-300 text-slate-600 dark:text-slate-300">
                {error?.message ||
                  "Failed to establish connection with registry database."}
              </p>
              <Button
                variant="outline"
                className="transition-colors duration-300 text-slate-700 border-slate-200 bg-white hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900/50 dark:text-slate-300"
                onClick={() => refetch()}
              >
                Retry Connection
              </Button>
            </div>
          ) : donors.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center px-4 animate-in fade-in duration-500">
              <div className="h-20 w-20 rounded-2xl flex items-center justify-center mb-6 shadow-inner transition-colors duration-300 bg-slate-50 border border-slate-200 dark:bg-slate-800/50 dark:border-slate-700">
                <Users className="h-10 w-10 transition-colors duration-300 text-slate-400 dark:text-slate-500" />
              </div>
              <h3 className="text-xl font-bold mb-2 tracking-tight transition-colors duration-300 text-slate-900 dark:text-white">
                Registry Empty
              </h3>
              <p className="max-w-sm mb-8 leading-relaxed text-sm transition-colors duration-300 text-slate-600 dark:text-slate-400">
                Your organizational pool currently has no donors registered.
              </p>
              <Link to="/admin/add-donor">
                <Button
                  variant="primary"
                  className="shadow-md hover:shadow-lg dark:shadow-lg"
                >
                  Register New Donor
                </Button>
              </Link>
            </div>
          ) : filteredDonors.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center px-4 animate-in fade-in duration-300">
              <SearchX className="h-12 w-12 mb-4 transition-colors duration-300 text-slate-400 dark:text-slate-600" />
              <h3 className="text-lg font-bold mb-2 transition-colors duration-300 text-slate-900 dark:text-white">
                No Matches Found
              </h3>
              <p className="text-sm max-w-sm transition-colors duration-300 text-slate-600 dark:text-slate-400">
                No records match your search query or status filters.
              </p>
            </div>
          ) : (
            <>
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b text-xs uppercase tracking-wider font-bold transition-colors duration-300 border-slate-200 bg-slate-50 text-slate-500 dark:border-slate-800/80 dark:bg-slate-950/40">
                      <th className="px-6 py-5">Donor Identity</th>
                      <th className="px-6 py-5">Contact Vector</th>
                      <th className="px-6 py-5">Location Lock</th>
                      <th className="px-6 py-5">Operational Status</th>
                      <th className="px-6 py-5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y transition-colors duration-300 divide-slate-200 dark:divide-slate-800/50">
                    {filteredDonors.map((donor) => (
                      <tr
                        key={donor.id}
                        className="transition-colors group hover:bg-slate-50 dark:hover:bg-slate-800/30"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-4">
                            <div className="h-11 w-11 rounded-xl border flex items-center justify-center font-black text-sm shadow-inner transition-colors duration-300 bg-rose-50 border-rose-200 text-rose-600 group-hover:bg-rose-100 dark:bg-rose-500/10 dark:text-rose-500 dark:border-rose-500/20 dark:group-hover:bg-rose-500/20">
                              {donor.blood_group}
                            </div>
                            <div>
                              <p className="font-bold text-sm transition-colors duration-300 text-slate-900 dark:text-white">
                                {donor.full_name}
                              </p>
                              <p className="text-xs font-medium mt-0.5 transition-colors duration-300 text-slate-500">
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
                          <p className="text-sm font-semibold font-mono tracking-tight transition-colors duration-300 text-slate-700 dark:text-slate-300">
                            {donor.phone_number}
                          </p>
                          <p className="text-xs font-medium mt-1 transition-colors duration-300 text-slate-500">
                            Last Donated:{" "}
                            {donor.last_donation_date || "No History"}
                          </p>
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-xs font-medium transition-colors duration-300 bg-slate-50 border-slate-200 text-slate-600 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-300">
                            <MapPin className="h-3 w-3 text-slate-500" />
                            {donor.district_name || "Unknown"}
                          </span>
                        </td>

                        <td className="px-6 py-4">
                          {donor.is_available_now ? (
                            <Badge variant="success">Available</Badge>
                          ) : donor.is_permanently_deferred ? (
                            <Badge variant="danger">Deferred</Badge>
                          ) : (
                            <Badge variant="warning" className="gap-1">
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
                              className="h-8 w-8 flex items-center justify-center rounded-md transition-colors text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:text-emerald-500/70 dark:hover:text-emerald-400 dark:hover:bg-emerald-500/10"
                            >
                              <MessageCircle className="h-4 w-4" />
                            </a>
                            <Button
                              variant="ghost"
                              size="sm"
                              title="Log New Donation"
                              className="h-8 w-8 p-0 transition-colors text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:text-emerald-500/70 dark:hover:text-emerald-400 dark:hover:bg-emerald-500/10"
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
                              className="h-8 w-8 p-0 transition-colors text-slate-600 hover:text-blue-600 hover:bg-blue-50 dark:text-slate-400 dark:hover:text-blue-400 dark:hover:bg-blue-500/10"
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
                              className="h-8 w-8 p-0 disabled:opacity-50 transition-colors text-amber-600 hover:text-amber-700 hover:bg-amber-50 dark:text-amber-500/70 dark:hover:text-amber-400 dark:hover:bg-amber-500/10"
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
                    className="border rounded-2xl p-4 flex flex-col gap-4 shadow-sm transition-colors duration-300 bg-slate-50/50 border-slate-200 dark:bg-slate-900/50 dark:border-slate-800"
                  >
                    <div className="flex justify-between items-start gap-3">
                      <div className="flex items-center gap-3">
                        <div className="h-11 w-11 rounded-xl border flex items-center justify-center font-black text-sm shadow-inner shrink-0 transition-colors duration-300 bg-rose-50 border-rose-200 text-rose-600 dark:bg-rose-500/10 dark:text-rose-500 dark:border-rose-500/20">
                          {donor.blood_group}
                        </div>
                        <div>
                          <p className="font-bold text-[15px] leading-tight transition-colors duration-300 text-slate-900 dark:text-white">
                            {donor.full_name}
                          </p>
                          <p className="text-xs font-medium mt-0.5 transition-colors duration-300 text-slate-500">
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
                      <div className="p-2.5 rounded-xl border transition-colors duration-300 bg-white border-slate-200 dark:bg-slate-950/50 dark:border-slate-800/80">
                        <span className="block text-[10px] font-bold uppercase tracking-wider mb-1 transition-colors duration-300 text-slate-500">
                          Contact
                        </span>
                        <a
                          href={`tel:${donor.phone_number}`}
                          className="font-semibold font-mono tracking-tight transition-colors duration-300 text-slate-700 dark:text-slate-300"
                        >
                          {donor.phone_number}
                        </a>
                      </div>
                      <div className="p-2.5 rounded-xl border transition-colors duration-300 bg-white border-slate-200 dark:bg-slate-950/50 dark:border-slate-800/80">
                        <span className="block text-[10px] font-bold uppercase tracking-wider mb-1 transition-colors duration-300 text-slate-500">
                          Location
                        </span>
                        <span className="font-semibold flex items-center gap-1.5 truncate transition-colors duration-300 text-slate-700 dark:text-slate-300">
                          <MapPin className="h-3 w-3 shrink-0 transition-colors duration-300 text-slate-500" />
                          <span className="truncate">
                            {donor.district_name || "Unknown"}
                          </span>
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t transition-colors duration-300 border-slate-200 dark:border-slate-800/80">
                      <div>
                        {donor.is_available_now ? (
                          <Badge variant="success">Available</Badge>
                        ) : donor.is_permanently_deferred ? (
                          <Badge variant="danger">Deferred</Badge>
                        ) : (
                          <Badge variant="warning" className="gap-1">
                            <Clock className="h-3 w-3" /> Resting
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-9 w-9 p-0 border transition-colors duration-300 bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100 hover:text-emerald-700 dark:text-emerald-500/70 dark:bg-emerald-500/10 dark:hover:bg-emerald-500/20 dark:border-emerald-500/20"
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
                          className="h-9 w-9 p-0 transition-colors duration-300 bg-slate-100 text-slate-600 hover:bg-slate-200 dark:text-slate-400 dark:bg-slate-800/50 dark:hover:bg-slate-800"
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
                          className="h-9 w-9 p-0 border transition-colors duration-300 bg-amber-50 text-amber-600 border-amber-200 hover:bg-amber-100 hover:text-amber-700 dark:text-amber-500/80 dark:bg-amber-500/10 dark:border-amber-500/20"
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
            <div className="p-4 rounded-xl border mb-6 transition-colors duration-300 bg-slate-50 border-slate-200 dark:bg-slate-950/50 dark:border-slate-800/80">
              <div className="text-xs uppercase tracking-wider font-bold mb-1 transition-colors duration-300 text-slate-500">
                Target Donor
              </div>
              <div className="text-sm font-semibold flex items-center gap-2 transition-colors duration-300 text-slate-900 dark:text-white">
                {donorToLog.full_name}{" "}
                <Badge variant="primary" className="py-0">
                  {donorToLog.blood_group}
                </Badge>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase transition-colors duration-300 text-slate-600 dark:text-slate-400">
                  Donation Type
                </label>
                <select
                  className="flex h-11 w-full rounded-xl border px-4 py-2 text-sm focus:ring-2 focus:outline-none focus:border-rose-500 transition-colors duration-300 bg-white border-slate-200 text-slate-900 focus:ring-rose-500/20 dark:border-slate-700/80 dark:bg-slate-950/50 dark:text-slate-100 dark:focus:ring-rose-500"
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
                <label className="text-xs font-semibold uppercase transition-colors duration-300 text-slate-600 dark:text-slate-400">
                  Date of Extraction
                </label>
                <Input
                  type="date"
                  className="h-11 transition-colors duration-300 bg-white dark:bg-slate-950/50"
                  value={donationLogData.donation_date}
                  max={new Date().toISOString().split("T")[0]}
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
                <label className="text-xs font-semibold uppercase transition-colors duration-300 text-slate-600 dark:text-slate-400">
                  Clinical Notes (Optional)
                </label>
                <textarea
                  className="w-full rounded-xl border px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:border-rose-500 transition-colors duration-300 resize-none h-24 bg-white border-slate-200 text-slate-900 placeholder-slate-400 focus:ring-rose-500/20 dark:border-slate-700/80 dark:bg-slate-950/50 dark:text-slate-100 dark:placeholder-slate-600 dark:focus:ring-rose-500/30"
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

            <div className="flex justify-end gap-3 pt-6 border-t transition-colors duration-300 border-slate-200 dark:border-slate-800">
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
                  "Save Donor Record"
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
                <label className="text-xs font-semibold uppercase transition-colors duration-300 text-slate-600 dark:text-slate-400">
                  Full Name
                </label>
                <Input
                  name="full_name"
                  value={editingDonor.full_name || ""}
                  onChange={handleEditChange}
                  className="transition-colors duration-300 bg-white dark:bg-slate-950/50"
                  required
                  autoFocus
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase transition-colors duration-300 text-slate-600 dark:text-slate-400">
                  Phone Number
                </label>
                <Input
                  name="phone_number"
                  value={editingDonor.phone_number || ""}
                  onChange={handleEditChange}
                  className="transition-colors duration-300 bg-white dark:bg-slate-950/50"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase transition-colors duration-300 text-slate-600 dark:text-slate-400">
                  Blood Group
                </label>
                <select
                  name="blood_group"
                  value={editingDonor.blood_group || ""}
                  onChange={handleEditChange}
                  className="flex h-10 w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500 transition-colors duration-300 bg-white border-slate-200 text-slate-900 dark:border-slate-700 dark:bg-slate-950/50 dark:text-slate-100"
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
                <label className="text-xs font-semibold uppercase transition-colors duration-300 text-slate-600 dark:text-slate-400">
                  Gender
                </label>
                <select
                  name="gender"
                  value={editingDonor.gender || ""}
                  onChange={handleEditChange}
                  className="flex h-10 w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500 transition-colors duration-300 bg-white border-slate-200 text-slate-900 dark:border-slate-700 dark:bg-slate-950/50 dark:text-slate-100"
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
                <label className="text-xs font-semibold uppercase transition-colors duration-300 text-slate-600 dark:text-slate-400">
                  Date of Birth
                </label>
                <Input
                  name="date_of_birth"
                  type="date"
                  value={editingDonor.date_of_birth || ""}
                  onChange={handleEditChange}
                  className="transition-colors duration-300 bg-white dark:bg-slate-950/50"
                  required
                />
              </div>

              <div className="space-y-2 sm:col-span-2">
                <label className="text-xs font-semibold uppercase transition-colors duration-300 text-slate-600 dark:text-slate-400">
                  Last Donation Date
                </label>
                <Input
                  name="last_donation_date"
                  type="date"
                  value={editingDonor.last_donation_date || ""}
                  onChange={handleEditChange}
                  className="transition-colors duration-300 bg-white dark:bg-slate-950/50"
                />
              </div>

              <div className="space-y-2 sm:col-span-2">
                <label className="flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-colors duration-300 bg-rose-50 border-rose-200 hover:bg-rose-100 dark:border-rose-500/20 dark:bg-rose-500/5 dark:hover:bg-rose-500/10">
                  <input
                    type="checkbox"
                    name="is_permanently_deferred"
                    checked={editingDonor.is_permanently_deferred || false}
                    onChange={handleEditChange}
                    className="h-5 w-5 rounded transition-colors duration-300 border-slate-300 bg-white text-rose-600 focus:ring-rose-500 dark:border-slate-600 dark:bg-slate-950 dark:text-rose-500"
                  />
                  <div className="text-sm">
                    <span className="font-semibold block mb-1 transition-colors duration-300 text-rose-700 dark:text-rose-400">
                      Permanently Deferred
                    </span>
                    <span className="text-xs transition-colors duration-300 text-slate-600 dark:text-slate-400">
                      Mark this donor as medically ineligible for future
                      donations. They will no longer appear in public search
                      results.
                    </span>
                  </div>
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-6 border-t transition-colors duration-300 border-slate-200 dark:border-slate-800">
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setIsEditModalOpen(false);
                  setEditingDonor(null);
                }}
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
          <p className="text-sm leading-relaxed transition-colors duration-300 text-slate-600 dark:text-slate-400">
            Upload an authorized CSV payload to map legacy records to your
            current tenant workspace. All imported entities are automatically
            locked to your organizational jurisdiction.
          </p>

          <div className="p-4 border rounded-xl flex items-center justify-between shadow-sm dark:shadow-inner transition-colors duration-300 bg-slate-50 border-slate-200 dark:bg-slate-900 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <Download className="h-5 w-5 transition-colors duration-300 text-emerald-600 dark:text-emerald-500" />
              <div className="text-sm font-medium transition-colors duration-300 text-slate-900 dark:text-white">
                Standard Ingestion Matrix
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={downloadTemplate}
              className="transition-colors duration-300 border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-900 dark:border-slate-700 dark:text-slate-300 dark:bg-slate-900/50 dark:hover:bg-slate-800 dark:hover:text-white"
            >
              Download Template
            </Button>
          </div>

          {/* Ingestion Telemetry Feedback */}
          {uploadResult && (
            <div
              className={`p-4 rounded-xl text-sm border transition-colors duration-300 ${
                uploadResult.success
                  ? "bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-500/10 dark:border-emerald-500/20 dark:text-emerald-400"
                  : "bg-rose-50 border-rose-200 text-rose-700 dark:bg-rose-500/10 dark:border-rose-500/20 dark:text-rose-400"
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
                      ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-500/5"
                      : "border-slate-300 bg-slate-50 group-hover:border-rose-400 group-hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900/50 dark:group-hover:border-rose-500/50 dark:group-hover:bg-slate-900/80"
                  }`}
                >
                  {uploadFile ? (
                    <>
                      <CheckCircle2 className="h-10 w-10 mb-3 transition-colors duration-300 text-emerald-600 dark:text-emerald-500" />
                      <span className="font-semibold tracking-wide transition-colors duration-300 text-emerald-700 dark:text-emerald-400">
                        {uploadFile.name}
                      </span>
                    </>
                  ) : (
                    <>
                      <FileUp className="h-10 w-10 mb-3 transition-colors duration-300 text-slate-400 group-hover:text-rose-500 dark:text-slate-500" />
                      <span className="text-sm font-medium transition-colors duration-300 text-slate-500 dark:text-slate-400">
                        Click to browse or drop CSV payload
                      </span>
                    </>
                  )}
                </div>
              </label>
            </div>

            <div className="flex justify-end gap-3 mt-8 pt-5 border-t transition-colors duration-300 border-slate-200 dark:border-slate-800">
              <Button
                type="button"
                variant="ghost"
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
