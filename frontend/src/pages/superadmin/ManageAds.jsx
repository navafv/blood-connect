import React, { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Megaphone,
  Plus,
  Edit,
  Trash2,
  Loader2,
  ExternalLink,
  MousePointerClick,
  Calendar,
  UploadCloud,
  Play,
  Pause,
  Clock,
  MegaphoneOff,
  ServerCrash,
  RefreshCw,
} from "lucide-react";
import toast from "react-hot-toast";

import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Select } from "../../components/ui/Select";
import { Badge } from "../../components/ui/Badge";
import { Modal } from "../../components/ui/Modal";
import api from "../../lib/axios";

export default function ManageAds() {
  const queryClient = useQueryClient();
  const fileInputRef = useRef(null);

  // --- UI Transition States ---
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isExtendModalOpen, setIsExtendModalOpen] = useState(false);
  const [selectedAd, setSelectedAd] = useState(null);

  // --- Payload States ---
  const [imagePreview, setImagePreview] = useState(null);
  const [formData, setFormData] = useState({
    title: "",
    target_link: "",
    duration_months: "1",
    image: null,
  });
  const [extendMonths, setExtendMonths] = useState("1");

  const apiBase = import.meta.env.PROD
    ? import.meta.env.VITE_API_BASE_URL || "https://api.bloodonate.org/api"
    : "http://localhost:8000/api";
  const baseURL = apiBase.replace(/\/api\/?$/, "");

  // --- Query Pipeline: Fetch Campaigns ---
  const {
    data: ads = [],
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["superadmin-ads"],
    queryFn: async () => {
      const res = await api.get("/superadmin/ads/");
      return res.data.results || res.data;
    },
  });

  // --- Mutation Pipeline: Upsert Campaign ---
  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = new FormData();
      payload.append("title", formData.title);
      payload.append("target_link", formData.target_link);

      if (formData.image) payload.append("image", formData.image);

      if (selectedAd) {
        return api.patch(`/superadmin/ads/${selectedAd.id}/`, payload, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      } else {
        payload.append("duration_months", formData.duration_months);
        return api.post("/superadmin/ads/", payload, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["superadmin-ads"] });
      closeFormModal();
      toast.success(
        selectedAd
          ? "Campaign updated successfully."
          : "Campaign launched successfully.",
      );
    },
    onError: (err) => {
      toast.error(
        err.response?.data?.detail ||
          err.response?.data?.error ||
          "Failed to process campaign data.",
      );
    },
  });

  // --- Mutation Pipeline: Toggle Visibility ---
  const toggleMutation = useMutation({
    mutationFn: async (id) => api.post(`/superadmin/ads/${id}/toggle/`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["superadmin-ads"] });
      toast.success("Campaign visibility updated.");
    },
    onError: () => toast.error("Failed to toggle campaign visibility."),
  });

  // --- Mutation Pipeline: Extend Duration ---
  const extendMutation = useMutation({
    mutationFn: async () =>
      api.post(`/superadmin/ads/${selectedAd.id}/extend/`, {
        months: extendMonths,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["superadmin-ads"] });
      setIsExtendModalOpen(false);
      setSelectedAd(null);
      toast.success("Campaign duration extended.");
    },
    onError: () => toast.error("Failed to extend campaign duration."),
  });

  // --- Mutation Pipeline: Delete Campaign ---
  const deleteMutation = useMutation({
    mutationFn: async (id) => api.delete(`/superadmin/ads/${id}/`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["superadmin-ads"] });
      toast.success("Campaign deleted permanently.");
    },
    onError: () => toast.error("Failed to delete campaign."),
  });

  // --- Action Handlers ---
  const openCreateModal = () => {
    setSelectedAd(null);
    setFormData({
      title: "",
      target_link: "",
      duration_months: "1",
      image: null,
    });
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    setIsFormModalOpen(true);
  };

  const openEditModal = (ad) => {
    setSelectedAd(ad);
    setFormData({ title: ad.title, target_link: ad.target_link, image: null });
    setImagePreview(
      ad.image.startsWith("http") ? ad.image : `${baseURL}${ad.image}`,
    );
    if (fileInputRef.current) fileInputRef.current.value = "";
    setIsFormModalOpen(true);
  };

  const closeFormModal = () => {
    setIsFormModalOpen(false);
    setSelectedAd(null);
    if (imagePreview && !imagePreview.startsWith("http"))
      URL.revokeObjectURL(imagePreview);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData({ ...formData, image: file });
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 pb-24 transition-colors duration-300 bg-slate-50 dark:bg-slate-950">
      {/* --- Workspace Header --- */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b pb-6 transition-colors duration-300 border-slate-200 dark:border-slate-800/80">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-3 transition-colors duration-300 text-slate-900 dark:text-white">
            <div className="p-1.5 rounded-lg border transition-colors duration-300 bg-rose-50 border-rose-200 dark:bg-rose-500/10 dark:border-rose-500/20">
              <Megaphone className="h-5 w-5 transition-colors duration-300 text-rose-600 dark:text-rose-500" />
            </div>
            Advertisement Manager
          </h1>
          <p className="text-sm mt-2 transition-colors duration-300 text-slate-600 dark:text-slate-400">
            Upload banners, control global visibility, and extend active
            campaign durations.
          </p>
        </div>
        <Button
          variant="primary"
          className="gap-2 shadow-md hover:shadow-lg transition-all w-full sm:w-auto dark:shadow-lg"
          onClick={openCreateModal}
        >
          <Plus className="h-4 w-4" /> Create New Ad
        </Button>
      </div>

      {/* --- Primary Data Table Area --- */}
      <Card className="overflow-hidden backdrop-blur-xl shadow-xl dark:shadow-2xl transition-colors duration-300 bg-white/80 border-slate-200 dark:bg-slate-900/60 dark:border-slate-800/80">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm transition-colors duration-300 text-slate-700 dark:text-slate-300">
            <thead className="text-xs uppercase font-bold border-b transition-colors duration-300 bg-slate-50 text-slate-500 border-slate-200 dark:bg-slate-950/40 dark:border-slate-800/80">
              <tr>
                <th className="px-6 py-5">Banner & Campaign</th>
                <th className="px-6 py-5">Performance</th>
                <th className="px-6 py-5">Duration & Expiry</th>
                <th className="px-6 py-5">Status</th>
                <th className="px-6 py-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y transition-colors duration-300 divide-slate-200 dark:divide-slate-800/50">
              {isLoading ? (
                <tr>
                  <td colSpan="5" className="px-6 py-24 text-center">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 transition-colors duration-300 text-rose-600 dark:text-rose-500" />
                    <p className="text-sm font-medium tracking-widest uppercase transition-colors duration-300 text-slate-500 dark:text-slate-400">
                      Loading Campaigns...
                    </p>
                  </td>
                </tr>
              ) : isError ? (
                <tr>
                  <td
                    colSpan="5"
                    className="px-6 py-24 text-center animate-in fade-in duration-500"
                  >
                    <div className="h-20 w-20 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-inner border transition-colors duration-300 bg-rose-50 border-rose-200 dark:bg-rose-500/10 dark:border-rose-500/20">
                      <ServerCrash className="h-10 w-10 transition-colors duration-300 text-rose-600 dark:text-rose-500" />
                    </div>
                    <h3 className="text-xl font-bold mb-2 tracking-tight transition-colors duration-300 text-slate-900 dark:text-white">
                      Telemetry Failure
                    </h3>
                    <p className="max-w-sm mx-auto leading-relaxed text-sm mb-6 transition-colors duration-300 text-slate-600 dark:text-slate-400">
                      Unable to synchronize advertisement data from the central
                      database.
                    </p>
                    <Button
                      variant="outline"
                      className="transition-colors duration-300 bg-white border-slate-200 text-slate-700 hover:bg-slate-50 dark:bg-slate-900/50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                      onClick={() => refetch()}
                    >
                      <RefreshCw className="h-4 w-4 mr-2" /> Retry Connection
                    </Button>
                  </td>
                </tr>
              ) : ads.length === 0 ? (
                <tr>
                  <td
                    colSpan="5"
                    className="px-6 py-24 text-center animate-in fade-in duration-500"
                  >
                    <div className="h-20 w-20 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-inner border transition-colors duration-300 bg-slate-50 border-slate-200 dark:bg-slate-800/50 dark:border-slate-700">
                      <MegaphoneOff className="h-10 w-10 transition-colors duration-300 text-slate-400 dark:text-slate-500" />
                    </div>
                    <h3 className="text-xl font-bold mb-2 tracking-tight transition-colors duration-300 text-slate-900 dark:text-white">
                      No Active Campaigns
                    </h3>
                    <p className="max-w-sm mx-auto leading-relaxed text-sm transition-colors duration-300 text-slate-600 dark:text-slate-400">
                      There are no active or expired advertisements on the
                      platform. Create your first campaign to get started.
                    </p>
                  </td>
                </tr>
              ) : (
                ads.map((ad) => (
                  <tr
                    key={ad.id}
                    className="transition-colors group hover:bg-slate-50 dark:hover:bg-slate-800/30"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="h-14 w-24 shrink-0 rounded-lg overflow-hidden border shadow-sm transition-colors duration-300 bg-slate-100 border-slate-200 dark:bg-slate-950 dark:border-slate-700/50">
                          <img
                            src={
                              ad.image.startsWith("http")
                                ? ad.image
                                : `${baseURL}${ad.image}`
                            }
                            alt={ad.title}
                            className="h-full w-full object-cover"
                          />
                        </div>
                        <div>
                          <p className="font-bold text-sm transition-colors duration-300 text-slate-900 dark:text-white">
                            {ad.title}
                          </p>
                          <a
                            href={ad.target_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs font-medium flex items-center gap-1.5 mt-1 transition-colors w-fit text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                          >
                            Target URL <ExternalLink className="h-3 w-3" />
                          </a>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 font-mono font-bold w-fit px-3 py-1.5 rounded-lg border shadow-inner transition-colors duration-300 bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20">
                        <MousePointerClick className="h-4 w-4" />{" "}
                        {ad.clicks.toLocaleString()}
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1.5 text-xs font-medium">
                        <span className="flex items-center gap-1.5 transition-colors duration-300 text-slate-600 dark:text-slate-400">
                          <Clock className="h-3.5 w-3.5 transition-colors duration-300 text-slate-400 dark:text-slate-500" />{" "}
                          Created: {formatDate(ad.created_at)}
                        </span>
                        <span
                          className={`flex items-center gap-1.5 transition-colors duration-300 ${ad.is_expired ? "text-rose-600 dark:text-rose-400" : "text-slate-700 dark:text-slate-300"}`}
                        >
                          <Calendar className="h-3.5 w-3.5" /> Expiry:{" "}
                          {formatDate(ad.expires_at)}
                        </span>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      {ad.is_expired ? (
                        <Badge
                          variant="danger"
                          className="px-2.5 py-1 transition-colors duration-300 bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20"
                        >
                          Expired
                        </Badge>
                      ) : ad.is_active ? (
                        <Badge
                          variant="success"
                          className="px-2.5 py-1 transition-colors duration-300 bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20"
                        >
                          Running
                        </Badge>
                      ) : (
                        <Badge
                          variant="warning"
                          className="px-2.5 py-1 transition-colors duration-300 bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20"
                        >
                          Paused
                        </Badge>
                      )}
                    </td>

                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                        {/* Toggle Disable/Enable */}
                        <Button
                          variant="ghost"
                          size="sm"
                          title={ad.is_active ? "Pause Ad" : "Resume Ad"}
                          className={`h-8 w-8 p-0 transition-colors duration-300 ${ad.is_active ? "text-amber-600 hover:text-amber-700 hover:bg-amber-50 dark:text-amber-500/70 dark:hover:text-amber-400 dark:hover:bg-amber-500/10" : "text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:text-emerald-500/70 dark:hover:text-emerald-400 dark:hover:bg-emerald-500/10"}`}
                          onClick={() => toggleMutation.mutate(ad.id)}
                          disabled={toggleMutation.isPending || ad.is_expired}
                        >
                          {toggleMutation.isPending &&
                          toggleMutation.variables === ad.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : ad.is_active ? (
                            <Pause className="h-4 w-4" />
                          ) : (
                            <Play className="h-4 w-4" />
                          )}
                        </Button>

                        {/* Extend Duration */}
                        <Button
                          variant="ghost"
                          size="sm"
                          title="Extend Duration"
                          className="h-8 w-8 p-0 transition-colors duration-300 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:text-blue-500/70 dark:hover:text-blue-400 dark:hover:bg-blue-500/10"
                          onClick={() => {
                            setSelectedAd(ad);
                            setIsExtendModalOpen(true);
                          }}
                        >
                          <Clock className="h-4 w-4" />
                        </Button>

                        {/* Edit */}
                        <Button
                          variant="ghost"
                          size="sm"
                          title="Edit Ad"
                          className="h-8 w-8 p-0 transition-colors duration-300 text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800"
                          onClick={() => openEditModal(ad)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>

                        {/* Delete */}
                        <Button
                          variant="ghost"
                          size="sm"
                          title="Delete Ad"
                          className="h-8 w-8 p-0 disabled:opacity-50 transition-colors duration-300 text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:text-rose-500/70 dark:hover:text-rose-400 dark:hover:bg-rose-500/10"
                          onClick={() => {
                            if (
                              window.confirm(
                                `Delete "${ad.title}" permanently?`,
                              )
                            ) {
                              deleteMutation.mutate(ad.id);
                            }
                          }}
                          disabled={deleteMutation.isPending}
                        >
                          {deleteMutation.isPending &&
                          deleteMutation.variables === ad.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
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

      {/* --- CREATE / EDIT MODAL --- */}
      <Modal
        isOpen={isFormModalOpen}
        onClose={closeFormModal}
        title={selectedAd ? "Edit Advertisement" : "Launch Campaign"}
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            saveMutation.mutate();
          }}
          className="space-y-6"
        >
          {/* Image Upload Area */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider transition-colors duration-300 text-slate-600 dark:text-slate-400">
              Banner Image (Required)
            </label>
            <div
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all duration-300 relative overflow-hidden h-44 flex items-center justify-center group bg-slate-50 border-slate-300 hover:bg-slate-100 hover:border-rose-400 dark:bg-slate-950/50 dark:border-slate-700 dark:hover:bg-slate-900 dark:hover:border-rose-500/50`}
            >
              {imagePreview ? (
                <>
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="absolute inset-0 w-full h-full object-cover opacity-80 dark:opacity-60 group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm bg-white/40 dark:bg-slate-950/40">
                    <span className="text-sm font-bold flex items-center gap-2 transition-colors duration-300 text-slate-900 dark:text-white">
                      <Edit className="h-4 w-4" /> Change Image
                    </span>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center">
                  <UploadCloud className="h-10 w-10 mb-3 transition-colors duration-300 text-slate-400 group-hover:text-rose-600 dark:text-slate-500 dark:group-hover:text-rose-500" />
                  <span className="text-sm font-medium transition-colors duration-300 text-slate-600 dark:text-slate-400">
                    Click to browse or drop banner image
                  </span>
                </div>
              )}
            </div>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              ref={fileInputRef}
              onChange={handleImageChange}
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider transition-colors duration-300 text-slate-600 dark:text-slate-400">
              Campaign Title
            </label>
            <Input
              required
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              placeholder="e.g., Summer Blood Drive 2026"
              className="h-11 transition-colors duration-300 focus:ring-rose-500/20 bg-white border-slate-200 dark:bg-slate-950/50 dark:border-slate-700"
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider transition-colors duration-300 text-slate-600 dark:text-slate-400">
              Target URL (On Click)
            </label>
            <Input
              required
              type="url"
              value={formData.target_link}
              onChange={(e) =>
                setFormData({ ...formData, target_link: e.target.value })
              }
              placeholder="https://sponsor-website.com"
              className="h-11 transition-colors duration-300 focus:ring-rose-500/20 bg-white border-slate-200 dark:bg-slate-950/50 dark:border-slate-700"
            />
          </div>

          {!selectedAd && (
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider transition-colors duration-300 text-slate-600 dark:text-slate-400">
                Initial Time Period
              </label>
              <Select
                value={formData.duration_months}
                onChange={(e) =>
                  setFormData({ ...formData, duration_months: e.target.value })
                }
                className="h-11 transition-colors duration-300 focus:ring-rose-500/20 bg-white border-slate-200 dark:bg-slate-950/50 dark:border-slate-700"
              >
                <option value="1">1 Month</option>
                <option value="3">3 Months</option>
                <option value="6">6 Months</option>
                <option value="12">1 Year</option>
              </Select>
            </div>
          )}

          <div className="pt-6 border-t flex justify-end gap-3 transition-colors duration-300 border-slate-200 dark:border-slate-800">
            <Button
              type="button"
              variant="ghost"
              className="transition-colors duration-300 text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800"
              onClick={closeFormModal}
            >
              Abort
            </Button>
            <Button
              type="submit"
              variant="primary"
              className="min-w-40 shadow-md hover:shadow-lg font-bold transition-all dark:shadow-lg"
              disabled={
                saveMutation.isPending || (!selectedAd && !formData.image)
              }
            >
              {saveMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />{" "}
                  Processing...
                </>
              ) : (
                "Save Campaign"
              )}
            </Button>
          </div>
        </form>
      </Modal>

      {/* --- EXTEND DURATION MODAL --- */}
      <Modal
        isOpen={isExtendModalOpen}
        onClose={() => setIsExtendModalOpen(false)}
        title="Extend Campaign Duration"
      >
        <div className="space-y-6">
          <div className="p-4 rounded-xl border shadow-inner flex flex-col gap-1 transition-colors duration-300 bg-slate-50 border-slate-200 dark:bg-slate-950/80 dark:border-slate-800">
            <span className="text-sm font-medium transition-colors duration-300 text-slate-500 dark:text-slate-400">
              Current Expiry
            </span>
            <span className="text-lg font-bold tracking-tight transition-colors duration-300 text-slate-900 dark:text-white">
              {selectedAd && formatDate(selectedAd.expires_at)}
            </span>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider transition-colors duration-300 text-slate-600 dark:text-slate-400">
              Add Time to Campaign
            </label>
            <Select
              value={extendMonths}
              onChange={(e) => setExtendMonths(e.target.value)}
              className="h-11 transition-colors duration-300 bg-white border-slate-200 dark:bg-slate-950/50 dark:border-slate-700 dark:focus:border-blue-500"
            >
              <option value="1">+ 1 Month</option>
              <option value="3">+ 3 Months</option>
              <option value="6">+ 6 Months</option>
              <option value="12">+ 1 Year</option>
            </Select>
          </div>

          <div className="pt-6 flex justify-end gap-3 border-t transition-colors duration-300 border-slate-200 dark:border-slate-800/80">
            <Button
              type="button"
              variant="ghost"
              className="transition-colors duration-300 text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800"
              onClick={() => setIsExtendModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              className="min-w-32 shadow-md hover:shadow-lg font-bold transition-all duration-300 bg-blue-600 hover:bg-blue-500 text-white dark:shadow-lg dark:bg-blue-600 dark:hover:bg-blue-500"
              onClick={() => extendMutation.mutate()}
              disabled={extendMutation.isPending}
            >
              {extendMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Updating...
                </>
              ) : (
                "Extend Ad"
              )}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
