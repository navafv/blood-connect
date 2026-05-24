import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Users,
  Plus,
  Search,
  Filter,
  Edit,
  Archive,
  Calendar,
  Loader2,
  AlertCircle,
  Droplet,
  FileUp,
  Download,
  CheckCircle2,
} from "lucide-react";
import { Button } from "../../components/ui/Button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import { Input } from "../../components/ui/Input";
import { Modal } from "../../components/ui/Modal";
import { DonorFilters } from "../../components/donors/DonorFilters";
import api from "../../lib/axios";

export default function ManageDonors() {
  const [searchTerm, setSearchTerm] = useState("");

  // Bulk Upload State
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadResult, setUploadResult] = useState(null);

  // 1. Initialize Query Client for cache invalidation
  const queryClient = useQueryClient();

  const [activeFilters, setActiveFilters] = useState({
    bloodGroup: "",
    searchQuery: "",
  });

  // 2. Fetch Donors using React Query (Replaces useEffect & useState)
  const {
    data: donors = [],
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["tenantDonors"],
    queryFn: async () => {
      const response = await api.get("/tenant/donors/");
      // Using .results just in case Pagination is enabled on this endpoint
      return response.data.results || response.data;
    },
  });

  // 3. Delete/Archive Mutation (Replaces standard async function)
  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      await api.delete(`/tenant/donors/${id}/`);
    },
    onSuccess: () => {
      // Instantly triggers a background refetch to update the table
      queryClient.invalidateQueries({ queryKey: ["tenantDonors"] });
    },
    onError: () => {
      alert("Failed to archive donor. Please try again.");
    },
  });

  // 4. Bulk Upload Mutation (Replaces manual isUploading state)
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
      // Invalidate cache to show new donors immediately
      queryClient.invalidateQueries({ queryKey: ["tenantDonors"] });
      setUploadFile(null);
    },
    onError: (err) => {
      setUploadResult({
        success: false,
        message:
          err.response?.data?.error || "An error occurred during upload.",
      });
    },
  });

  // --- Handlers ---
  const handleDelete = (id, name) => {
    if (
      !window.confirm(
        `Are you sure you want to archive ${name}? This will remove them from the active registry.`,
      )
    )
      return;
    // Trigger the mutation
    deleteMutation.mutate(id);
  };

  const handleFileUpload = (e) => {
    e.preventDefault();
    if (!uploadFile) return;

    setUploadResult(null);
    const formData = new FormData();
    formData.append("file", uploadFile);

    // Trigger the mutation
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
  };

  // Local Search Filtering (runs instantly on cached query data)
  const filteredDonors = donors.filter((donor) => {
    const matchesBloodGroup = activeFilters.bloodGroup
      ? donor.blood_group === activeFilters.bloodGroup
      : true;

    const searchLower = activeFilters.searchQuery.toLowerCase();
    const matchesSearch = activeFilters.searchQuery
      ? donor.full_name.toLowerCase().includes(searchLower) ||
        donor.phone_number.includes(searchLower)
      : true;

    return matchesBloodGroup && matchesSearch;
  });

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800 pb-6">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Users className="h-6 w-6 text-rose-500" />
            Donor Registry
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Manage your organization's verified blood donors
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            className="gap-2 border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-300"
            onClick={() => setIsUploadModalOpen(true)}
          >
            <FileUp className="h-4 w-4" /> Bulk Import
          </Button>
          <Link to="/admin/add-donor">
            <Button variant="primary" className="gap-2">
              <Plus className="h-4 w-4" /> Add New Donor
            </Button>
          </Link>
        </div>
      </div>

      {/* Analytics / Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card className="bg-slate-900/50 border-slate-800">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
              <Users className="h-6 w-6 text-blue-500" />
            </div>
            <div>
              <p className="text-sm text-slate-400">Total Donors</p>
              <p className="text-2xl font-bold text-white">{donors.length}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/50 border-slate-800">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
              <Droplet className="h-6 w-6 text-emerald-500" />
            </div>
            <div>
              <p className="text-sm text-slate-400">Available Now</p>
              <p className="text-2xl font-bold text-white">
                {donors.filter((d) => d.is_available_now).length}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/50 border-slate-800">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-amber-500/10 flex items-center justify-center border border-amber-500/20">
              <Calendar className="h-6 w-6 text-amber-500" />
            </div>
            <div>
              <p className="text-sm text-slate-400">Resting / Waiting</p>
              <p className="text-2xl font-bold text-white">
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

      {/* Main Content Area */}
      <Card className="border-slate-800 bg-slate-900/80 backdrop-blur-xl">
        <CardHeader className="border-b border-slate-800 pb-4">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <CardTitle className="text-lg font-medium text-white">
              Registered Donors
            </CardTitle>
          </div>

          <DonorFilters onFilter={setActiveFilters} />
        </CardHeader>

        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
              <Loader2 className="h-8 w-8 animate-spin mb-4 text-rose-500" />
              <p>Loading your registry...</p>
            </div>
          ) : isError ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
              <AlertCircle className="h-8 w-8 mb-4 text-rose-500" />
              <p>{error?.message || "Failed to load registry."}</p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => queryClient.invalidateQueries(["tenantDonors"])}
              >
                Try Again
              </Button>
            </div>
          ) : filteredDonors.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400 text-center px-4">
              <div className="h-16 w-16 bg-slate-800/50 rounded-full flex items-center justify-center mb-4">
                <Users className="h-8 w-8 text-slate-500" />
              </div>
              <h3 className="text-lg font-medium text-white mb-2">
                No Donors Found
              </h3>
              <p className="max-w-sm mb-6">
                {searchTerm
                  ? `We couldn't find any donors matching "${searchTerm}".`
                  : "Your registry is currently empty. Start building your local network by adding a donor."}
              </p>
              {!searchTerm && (
                <Link to="/admin/add-donor">
                  <Button variant="primary">Add Your First Donor</Button>
                </Link>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-xs uppercase tracking-wider text-slate-400 bg-slate-950/30">
                    <th className="px-6 py-4 font-semibold">Donor Profile</th>
                    <th className="px-6 py-4 font-semibold">Contact</th>
                    <th className="px-6 py-4 font-semibold">Location</th>
                    <th className="px-6 py-4 font-semibold">Status</th>
                    <th className="px-6 py-4 font-semibold text-right">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {filteredDonors.map((donor) => (
                    <tr
                      key={donor.id}
                      className="hover:bg-slate-800/20 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-rose-500/10 text-rose-500 border border-rose-500/20 flex items-center justify-center font-bold text-sm">
                            {donor.blood_group}
                          </div>
                          <div>
                            <p className="font-medium text-white">
                              {donor.full_name}
                            </p>
                            <p className="text-xs text-slate-500">
                              {donor.gender === "M"
                                ? "Male"
                                : donor.gender === "F"
                                  ? "Female"
                                  : "Other"}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-slate-300 font-mono">
                          {donor.phone_number}
                        </p>
                        <p className="text-xs text-slate-500 mt-1">
                          Last Donated: {donor.last_donation_date || "Never"}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-slate-300">
                          {donor.district_name || "Unknown"}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        {donor.is_permanently_deferred ? (
                          <Badge
                            variant="danger"
                            className="bg-rose-500/10 text-rose-400 border-rose-500/20"
                          >
                            Deferred
                          </Badge>
                        ) : donor.is_available_now ? (
                          <Badge
                            variant="success"
                            className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                          >
                            Available
                          </Badge>
                        ) : (
                          <Badge
                            variant="warning"
                            className="bg-amber-500/10 text-amber-400 border-amber-500/20"
                          >
                            Resting
                          </Badge>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-slate-400 hover:text-white"
                            aria-label={`Edit ${donor.full_name}`}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            title="Archive Record"
                            aria-label={`Archive ${donor.full_name}`}
                            className="h-8 w-8 p-0 text-amber-400 hover:text-amber-300 hover:bg-amber-500/10 disabled:opacity-50"
                            onClick={() =>
                              handleDelete(donor.id, donor.full_name)
                            }
                            disabled={deleteMutation.isPending}
                          >
                            {/* Show loading spinner only on the specific item being deleted */}
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
          )}
        </CardContent>
      </Card>

      {/* --- Bulk Upload Modal --- */}
      <Modal
        isOpen={isUploadModalOpen}
        onClose={() => {
          setIsUploadModalOpen(false);
          setUploadResult(null);
        }}
        title="Bulk Import Donors (CSV)"
      >
        <div className="space-y-6">
          <p className="text-sm text-slate-400">
            Upload an Excel/CSV file to instantly import your existing donor
            database. All imported donors will automatically be assigned to your
            organization's geographic region.
          </p>

          <div className="p-4 bg-slate-900 border border-slate-700 rounded-lg flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Download className="h-5 w-5 text-emerald-500" />
              <div className="text-sm text-white font-medium">
                Need the correct format?
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={downloadTemplate}
              className="border-slate-700 text-slate-300 hover:bg-slate-800"
            >
              Download Template
            </Button>
          </div>

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
                    <li>
                      ...and {uploadResult.errors.length - 5} more warnings.
                    </li>
                  )}
                </ul>
              )}
            </div>
          )}

          <form onSubmit={handleFileUpload}>
            <div className="space-y-4">
              <label className="block w-full cursor-pointer">
                <input
                  type="file"
                  accept=".csv"
                  className="hidden"
                  onChange={(e) => setUploadFile(e.target.files[0])}
                />
                <div
                  className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-xl transition-colors ${
                    uploadFile
                      ? "border-emerald-500 bg-emerald-500/5"
                      : "border-slate-700 hover:border-slate-600 bg-slate-900/50"
                  }`}
                >
                  {uploadFile ? (
                    <>
                      <CheckCircle2 className="h-8 w-8 text-emerald-500 mb-2" />
                      <span className="text-emerald-400 font-medium">
                        {uploadFile.name}
                      </span>
                    </>
                  ) : (
                    <>
                      <FileUp className="h-8 w-8 text-slate-500 mb-2" />
                      <span className="text-slate-400 text-sm">
                        Click to browse or drag and drop a .csv file
                      </span>
                    </>
                  )}
                </div>
              </label>
            </div>

            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-800">
              <Button
                type="button"
                variant="ghost"
                className="text-slate-400 hover:text-white"
                onClick={() => setIsUploadModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={!uploadFile || uploadMutation.isPending}
                className="min-w-32"
              >
                {uploadMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />{" "}
                    Uploading...
                  </>
                ) : (
                  "Import Data"
                )}
              </Button>
            </div>
          </form>
        </div>
      </Modal>
    </div>
  );
}
