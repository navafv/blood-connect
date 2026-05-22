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
} from "lucide-react";
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

  // Modals State
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isExtendModalOpen, setIsExtendModalOpen] = useState(false);
  const [selectedAd, setSelectedAd] = useState(null);

  // Form State
  const [imagePreview, setImagePreview] = useState(null);
  const [formData, setFormData] = useState({
    title: "",
    target_link: "",
    duration_months: "1",
    image: null,
  });

  const [extendMonths, setExtendMonths] = useState("1");

  const baseURL =
    import.meta.env.VITE_API_URL?.replace("/api", "") ||
    "http://localhost:8000";

  // --- API QUERIES & MUTATIONS ---
  const { data: ads = [], isLoading } = useQuery({
    queryKey: ["superadmin-ads"],
    queryFn: async () => {
      const res = await api.get("/superadmin/ads/");
      return res.data.results || res.data;
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = new FormData();
      payload.append("title", formData.title);
      payload.append("target_link", formData.target_link);

      if (formData.image) payload.append("image", formData.image);

      if (selectedAd) {
        // Edit Existing Ad
        return api.patch(`/superadmin/ads/${selectedAd.id}/`, payload, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      } else {
        // Create New Ad
        payload.append("duration_months", formData.duration_months);
        return api.post("/superadmin/ads/", payload, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["superadmin-ads"]);
      closeFormModal();
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async (id) => api.post(`/superadmin/ads/${id}/toggle/`),
    onSuccess: () => queryClient.invalidateQueries(["superadmin-ads"]),
  });

  const extendMutation = useMutation({
    mutationFn: async () =>
      api.post(`/superadmin/ads/${selectedAd.id}/extend/`, {
        months: extendMonths,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries(["superadmin-ads"]);
      setIsExtendModalOpen(false);
      setSelectedAd(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => api.delete(`/superadmin/ads/${id}/`),
    onSuccess: () => queryClient.invalidateQueries(["superadmin-ads"]),
  });

  // --- HANDLERS ---
  const openCreateModal = () => {
    setSelectedAd(null);
    setFormData({
      title: "",
      target_link: "",
      duration_months: "1",
      image: null,
    });
    setImagePreview(null);
    setIsFormModalOpen(true);
  };

  const openEditModal = (ad) => {
    setSelectedAd(ad);
    setFormData({ title: ad.title, target_link: ad.target_link, image: null });
    setImagePreview(
      ad.image.startsWith("http") ? ad.image : `${baseURL}${ad.image}`,
    );
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
    <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800 pb-6">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <Megaphone className="h-6 w-6 text-rose-500" /> Advertisement
            Manager
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Upload banners, control visibility, and extend ad durations.
          </p>
        </div>
        <Button variant="primary" className="gap-2" onClick={openCreateModal}>
          <Plus className="h-4 w-4" /> Create New Ad
        </Button>
      </div>

      {/* Ad Table */}
      <Card className="border-slate-800 bg-slate-900/60 backdrop-blur-md">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-900/80 text-xs uppercase text-slate-400 border-b border-slate-800">
              <tr>
                <th className="px-6 py-4 font-medium">Banner & Campaign</th>
                <th className="px-6 py-4 font-medium">Performance</th>
                <th className="px-6 py-4 font-medium">Duration / Expiry</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {isLoading ? (
                <tr>
                  <td
                    colSpan="5"
                    className="px-6 py-12 text-center text-slate-500"
                  >
                    <Loader2 className="h-8 w-8 animate-spin mx-auto text-rose-500 mb-2" />{" "}
                    Loading campaigns...
                  </td>
                </tr>
              ) : ads.length === 0 ? (
                <tr>
                  <td
                    colSpan="5"
                    className="px-6 py-12 text-center text-slate-500"
                  >
                    No ads found. Create one to get started.
                  </td>
                </tr>
              ) : (
                ads.map((ad) => (
                  <tr
                    key={ad.id}
                    className="hover:bg-slate-800/30 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <img
                          src={
                            ad.image.startsWith("http")
                              ? ad.image
                              : `${baseURL}${ad.image}`
                          }
                          alt={ad.title}
                          className="h-14 w-24 object-cover rounded border border-slate-700"
                        />
                        <div>
                          <p className="font-medium text-white text-base">
                            {ad.title}
                          </p>
                          <a
                            href={ad.target_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 mt-1"
                          >
                            Target Link <ExternalLink className="h-3 w-3" />
                          </a>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 font-mono text-emerald-400 font-bold bg-emerald-500/10 w-fit px-3 py-1 rounded-lg border border-emerald-500/20">
                        <MousePointerClick className="h-4 w-4" />{" "}
                        {ad.clicks.toLocaleString()}
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1 text-xs">
                        <span className="text-slate-400">
                          Created: {formatDate(ad.created_at)}
                        </span>
                        <span
                          className={`font-medium flex items-center gap-1 ${ad.is_expired ? "text-rose-400" : "text-slate-200"}`}
                        >
                          <Calendar className="h-3 w-3" /> Expiry:{" "}
                          {formatDate(ad.expires_at)}
                        </span>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      {ad.is_expired ? (
                        <Badge variant="danger">Expired</Badge>
                      ) : ad.is_active ? (
                        <Badge variant="success">Running</Badge>
                      ) : (
                        <Badge variant="warning">Paused</Badge>
                      )}
                    </td>

                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {/* Toggle Disable/Enable */}
                        <Button
                          variant="ghost"
                          size="icon"
                          title={ad.is_active ? "Pause Ad" : "Resume Ad"}
                          className={`h-8 w-8 ${ad.is_active ? "text-amber-400 hover:bg-amber-500/10" : "text-emerald-400 hover:bg-emerald-500/10"}`}
                          onClick={() => toggleMutation.mutate(ad.id)}
                          disabled={toggleMutation.isPending || ad.is_expired}
                        >
                          {ad.is_active ? (
                            <Pause className="h-4 w-4" />
                          ) : (
                            <Play className="h-4 w-4" />
                          )}
                        </Button>

                        {/* Extend Duration */}
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Extend Duration"
                          className="h-8 w-8 text-blue-400 hover:bg-blue-500/10"
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
                          size="icon"
                          title="Edit Ad"
                          className="h-8 w-8 text-slate-400 hover:text-white"
                          onClick={() => openEditModal(ad)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>

                        {/* Delete */}
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Delete Ad"
                          className="h-8 w-8 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10"
                          onClick={() => {
                            if (
                              window.confirm(
                                `Delete "${ad.title}" permanently?`,
                              )
                            )
                              deleteMutation.mutate(ad.id);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
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
        title={selectedAd ? "Edit Advertisement" : "Create Advertisement"}
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            saveMutation.mutate();
          }}
          className="space-y-5"
        >
          {/* Image Upload Area */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300">
              Banner Image (Required)
            </label>
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-700 bg-slate-950/50 hover:bg-slate-900 rounded-xl p-4 text-center cursor-pointer transition-colors relative overflow-hidden h-40 flex items-center justify-center"
            >
              {imagePreview ? (
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="absolute inset-0 w-full h-full object-cover opacity-60"
                />
              ) : (
                <div className="flex flex-col items-center">
                  <UploadCloud className="h-8 w-8 text-slate-500 mb-2" />
                  <span className="text-sm text-slate-400">
                    Click to upload banner image
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
            <label className="text-sm font-medium text-slate-300">
              Campaign Title
            </label>
            <Input
              required
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              placeholder="e.g., Save Lives Campaign"
              className="bg-slate-950"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300">
              Target URL (On Click)
            </label>
            <Input
              required
              type="url"
              value={formData.target_link}
              onChange={(e) =>
                setFormData({ ...formData, target_link: e.target.value })
              }
              placeholder="https://sponsor.com"
              className="bg-slate-950"
            />
          </div>

          {/* Only show duration on CREATE. For edits, they use the Extend button. */}
          {!selectedAd && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">
                Initial Time Period
              </label>
              <Select
                value={formData.duration_months}
                onChange={(e) =>
                  setFormData({ ...formData, duration_months: e.target.value })
                }
                className="bg-slate-950"
              >
                <option value="1">1 Month</option>
                <option value="3">3 Months</option>
                <option value="6">6 Months</option>
                <option value="12">1 Year</option>
              </Select>
            </div>
          )}

          <div className="pt-4 flex justify-end gap-3 border-t border-slate-800 mt-6">
            <Button type="button" variant="ghost" onClick={closeFormModal}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={
                saveMutation.isPending || (!selectedAd && !formData.image)
              }
            >
              {saveMutation.isPending ? "Saving..." : "Save Advertisement"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* --- EXTEND DURATION MODAL --- */}
      <Modal
        isOpen={isExtendModalOpen}
        onClose={() => setIsExtendModalOpen(false)}
        title="Extend Ad Duration"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-400">
            Current Expiry:{" "}
            <strong className="text-white">
              {selectedAd && formatDate(selectedAd.expires_at)}
            </strong>
          </p>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300">
              Add Time
            </label>
            <Select
              value={extendMonths}
              onChange={(e) => setExtendMonths(e.target.value)}
              className="bg-slate-950"
            >
              <option value="1">+ 1 Month</option>
              <option value="3">+ 3 Months</option>
              <option value="6">+ 6 Months</option>
              <option value="12">+ 1 Year</option>
            </Select>
          </div>
          <div className="pt-4 flex justify-end gap-3 border-t border-slate-800 mt-6">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsExtendModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={() => extendMutation.mutate()}
              disabled={extendMutation.isPending}
            >
              {extendMutation.isPending ? "Updating..." : "Extend Ad"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
