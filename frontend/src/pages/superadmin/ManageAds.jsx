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
  Eye,
  Image as ImageIcon,
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
  const bannerInputRef = useRef(null);
  const portraitInputRef = useRef(null);

  // --- UI Transition States ---
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isExtendModalOpen, setIsExtendModalOpen] = useState(false);
  const [selectedAd, setSelectedAd] = useState(null);

  // --- Payload States ---
  const [bannerPreview, setBannerPreview] = useState(null);
  const [portraitPreview, setPortraitPreview] = useState(null);
  const [formData, setFormData] = useState({
    title: "",
    target_link: "",
    duration_months: "1",
    banner_image: null,
    portrait_image: null,
  });
  const [extendMonths, setExtendMonths] = useState("1");

  const apiBase = import.meta.env.PROD
    ? import.meta.env.VITE_API_BASE_URL || "https://api.bloodonate.org/api"
    : "http://localhost:8000/api";
  const baseURL = apiBase.replace(/\/api\/?$/, "");

  // --- Query Pipeline ---
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

  // --- Mutation Pipelines ---
  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = new FormData();
      payload.append("title", formData.title);
      payload.append("target_link", formData.target_link);

      if (formData.banner_image)
        payload.append("banner_image", formData.banner_image);
      if (formData.portrait_image)
        payload.append("portrait_image", formData.portrait_image);

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
      toast.success(selectedAd ? "Campaign updated." : "Campaign launched.");
    },
    onError: (err) => {
      toast.error(
        err.response?.data?.error || "Failed to process campaign data.",
      );
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async (id) => api.post(`/superadmin/ads/${id}/toggle/`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["superadmin-ads"] });
      toast.success("Visibility updated.");
    },
  });

  const extendMutation = useMutation({
    mutationFn: async () =>
      api.post(`/superadmin/ads/${selectedAd.id}/extend/`, {
        months: extendMonths,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["superadmin-ads"] });
      setIsExtendModalOpen(false);
      setSelectedAd(null);
      toast.success("Duration extended.");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => api.delete(`/superadmin/ads/${id}/`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["superadmin-ads"] });
      toast.success("Campaign deleted.");
    },
  });

  // --- Action Handlers ---
  const openCreateModal = () => {
    setSelectedAd(null);
    setFormData({
      title: "",
      target_link: "",
      duration_months: "1",
      banner_image: null,
      portrait_image: null,
    });
    setBannerPreview(null);
    setPortraitPreview(null);
    if (bannerInputRef.current) bannerInputRef.current.value = "";
    if (portraitInputRef.current) portraitInputRef.current.value = "";
    setIsFormModalOpen(true);
  };

  const openEditModal = (ad) => {
    setSelectedAd(ad);
    setFormData({
      title: ad.title,
      target_link: ad.target_link,
      banner_image: null,
      portrait_image: null,
    });

    setBannerPreview(
      ad.banner_image
        ? ad.banner_image.startsWith("http")
          ? ad.banner_image
          : `${baseURL}${ad.banner_image}`
        : null,
    );
    setPortraitPreview(
      ad.portrait_image
        ? ad.portrait_image.startsWith("http")
          ? ad.portrait_image
          : `${baseURL}${ad.portrait_image}`
        : null,
    );

    if (bannerInputRef.current) bannerInputRef.current.value = "";
    if (portraitInputRef.current) portraitInputRef.current.value = "";
    setIsFormModalOpen(true);
  };

  const closeFormModal = () => {
    setIsFormModalOpen(false);
    setSelectedAd(null);
    if (bannerPreview && !bannerPreview.startsWith("http"))
      URL.revokeObjectURL(bannerPreview);
    if (portraitPreview && !portraitPreview.startsWith("http"))
      URL.revokeObjectURL(portraitPreview);
  };

  const handleImageChange = (e, type) => {
    const file = e.target.files[0];
    if (file) {
      if (type === "banner") {
        setFormData({ ...formData, banner_image: file });
        setBannerPreview(URL.createObjectURL(file));
      } else {
        setFormData({ ...formData, portrait_image: file });
        setPortraitPreview(URL.createObjectURL(file));
      }
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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b pb-6 transition-colors duration-300 border-slate-200 dark:border-slate-800/80">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-3 transition-colors duration-300 text-slate-900 dark:text-white">
            <div className="p-1.5 rounded-lg border transition-colors duration-300 bg-rose-50 border-rose-200 dark:bg-rose-500/10 dark:border-rose-500/20">
              <Megaphone className="h-5 w-5 transition-colors duration-300 text-rose-600 dark:text-rose-500" />
            </div>
            Advertisement Manager
          </h1>
          <p className="text-sm mt-2 transition-colors duration-300 text-slate-600 dark:text-slate-400">
            Upload multi-format banners, track impressions, and manage active
            sponsorships.
          </p>
        </div>
        <Button
          variant="primary"
          className="gap-2 shadow-md"
          onClick={openCreateModal}
        >
          <Plus className="h-4 w-4" /> Create Campaign
        </Button>
      </div>

      <Card className="overflow-hidden backdrop-blur-xl shadow-xl dark:shadow-2xl transition-colors duration-300 bg-white/80 border-slate-200 dark:bg-slate-900/60 dark:border-slate-800/80">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm transition-colors duration-300 text-slate-700 dark:text-slate-300">
            <thead className="text-xs uppercase font-bold border-b transition-colors duration-300 bg-slate-50 text-slate-500 border-slate-200 dark:bg-slate-950/40 dark:border-slate-800/80">
              <tr>
                <th className="px-6 py-5">Campaign Media</th>
                <th className="px-6 py-5">Analytics</th>
                <th className="px-6 py-5">Duration & Expiry</th>
                <th className="px-6 py-5">Status</th>
                <th className="px-6 py-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y transition-colors duration-300 divide-slate-200 dark:divide-slate-800/50">
              {isLoading ? (
                <tr>
                  <td colSpan="5" className="px-6 py-24 text-center">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-rose-600" />
                    <p className="text-sm font-medium tracking-widest uppercase text-slate-500">
                      Loading Campaigns...
                    </p>
                  </td>
                </tr>
              ) : isError ? (
                <tr>
                  <td colSpan="5" className="px-6 py-24 text-center">
                    <ServerCrash className="h-10 w-10 mx-auto mb-4 text-rose-600" />
                    <p className="mb-4 text-slate-600">Telemetry Failure</p>
                    <Button variant="outline" onClick={() => refetch()}>
                      <RefreshCw className="h-4 w-4 mr-2" /> Retry
                    </Button>
                  </td>
                </tr>
              ) : ads.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-24 text-center">
                    <MegaphoneOff className="h-10 w-10 mx-auto mb-4 text-slate-400" />
                    <p className="text-slate-600">No active campaigns found.</p>
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
                        <div className="h-12 w-20 shrink-0 rounded-lg overflow-hidden border shadow-sm transition-colors duration-300 bg-slate-100 border-slate-200 dark:bg-slate-950 dark:border-slate-700/50 relative">
                          <img
                            src={
                              ad.banner_image?.startsWith("http")
                                ? ad.banner_image
                                : `${baseURL}${ad.banner_image}`
                            }
                            alt={ad.title}
                            className="h-full w-full object-cover"
                          />
                        </div>
                        <div className="h-12 w-20 shrink-0 rounded-lg overflow-hidden border shadow-sm transition-colors duration-300 bg-slate-100 border-slate-200 dark:bg-slate-950 dark:border-slate-700/50 relative">
                          <img
                            src={
                              ad.portrait_image?.startsWith("http")
                                ? ad.portrait_image
                                : `${baseURL}${ad.portrait_image}`
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
                            className="text-xs font-medium flex items-center gap-1.5 mt-1 text-blue-600 hover:text-blue-700 dark:text-blue-400"
                          >
                            Target URL <ExternalLink className="h-3 w-3" />
                          </a>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2 font-mono font-bold w-fit px-2 py-1 rounded-md border text-[11px] transition-colors duration-300 bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20">
                          <Eye className="h-3 w-3" />{" "}
                          {ad.views.toLocaleString()} Views
                        </div>
                        <div className="flex items-center gap-2 font-mono font-bold w-fit px-2 py-1 rounded-md border text-[11px] transition-colors duration-300 bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20">
                          <MousePointerClick className="h-3 w-3" />{" "}
                          {ad.clicks.toLocaleString()} Clicks
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1.5 text-xs font-medium text-slate-600 dark:text-slate-400">
                        <span className="flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5" /> Start:{" "}
                          {formatDate(ad.created_at)}
                        </span>
                        <span
                          className={`flex items-center gap-1.5 ${ad.is_expired ? "text-rose-600 dark:text-rose-400" : ""}`}
                        >
                          <Calendar className="h-3.5 w-3.5" /> End:{" "}
                          {formatDate(ad.expires_at)}
                        </span>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      {ad.is_expired ? (
                        <Badge variant="danger" className="px-2.5 py-1">
                          Expired
                        </Badge>
                      ) : ad.is_active ? (
                        <Badge variant="success" className="px-2.5 py-1">
                          Running
                        </Badge>
                      ) : (
                        <Badge variant="warning" className="px-2.5 py-1">
                          Paused
                        </Badge>
                      )}
                    </td>

                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => toggleMutation.mutate(ad.id)}
                          disabled={toggleMutation.isPending || ad.is_expired}
                        >
                          {ad.is_active ? (
                            <Pause className="h-4 w-4 text-amber-600" />
                          ) : (
                            <Play className="h-4 w-4 text-emerald-600" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-blue-600"
                          onClick={() => {
                            setSelectedAd(ad);
                            setIsExtendModalOpen(true);
                          }}
                        >
                          <Clock className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => openEditModal(ad)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-rose-600"
                          onClick={() => {
                            if (window.confirm("Delete permanently?"))
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
        title={selectedAd ? "Edit Advertisement" : "Launch Campaign"}
        size="2xl"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            saveMutation.mutate();
          }}
          className="space-y-6"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 1. Banner Upload (Landscape) */}
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 flex items-center justify-between">
                <span>
                  Banner Image <span className="text-rose-500">*</span>
                </span>
                <Badge variant="outline" className="text-[9px]">
                  Landscape
                </Badge>
              </label>
              <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400 pb-1">
                Recommended:{" "}
                <span className="font-mono text-slate-700 dark:text-slate-300">
                  1200 × 400px
                </span>{" "}
                (Max 5MB)
              </p>
              <div
                onClick={() => bannerInputRef.current?.click()}
                className="border-2 border-dashed rounded-xl p-2 text-center cursor-pointer relative overflow-hidden h-36 flex flex-col items-center justify-center group bg-slate-50 border-slate-300 hover:border-rose-400 dark:bg-slate-950/50 dark:border-slate-700 dark:hover:border-rose-500/50 transition-all"
              >
                {bannerPreview ? (
                  <>
                    <img
                      src={bannerPreview}
                      alt="Banner Preview"
                      className="absolute inset-0 w-full h-full object-contain p-2"
                    />
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 flex items-center justify-center bg-white/60 dark:bg-black/60 backdrop-blur-sm transition-all">
                      <span className="text-xs font-bold flex items-center text-slate-900 dark:text-white">
                        <Edit className="h-4 w-4 mr-1.5" /> Replace Landscape
                      </span>
                    </div>
                  </>
                ) : (
                  <>
                    <ImageIcon className="h-8 w-8 mb-2 text-slate-400 group-hover:text-rose-500 transition-colors" />
                    <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
                      Upload Landscape Banner
                    </span>
                  </>
                )}
              </div>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                ref={bannerInputRef}
                onChange={(e) => handleImageChange(e, "banner")}
              />
            </div>

            {/* 2. Portrait Upload (Vertical) */}
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 flex items-center justify-between">
                <span>Portrait Image</span>
                <Badge
                  variant="outline"
                  className="text-[9px] bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20"
                >
                  Vertical
                </Badge>
              </label>
              <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400 pb-1">
                Recommended:{" "}
                <span className="font-mono text-slate-700 dark:text-slate-300">
                  800 × 1200px
                </span>{" "}
                (Max 5MB)
              </p>

              {/* Flex container to center the strict vertical box */}
              <div className="flex w-full justify-center lg:justify-start">
                <div
                  onClick={() => portraitInputRef.current?.click()}
                  className="border-2 border-dashed rounded-xl p-2 text-center cursor-pointer relative overflow-hidden h-36 w-24 flex flex-col items-center justify-center group bg-slate-50 border-slate-300 hover:border-blue-400 dark:bg-slate-950/50 dark:border-slate-700 dark:hover:border-blue-500/50 transition-all"
                >
                  {portraitPreview ? (
                    <>
                      <img
                        src={portraitPreview}
                        alt="Portrait Preview"
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 flex items-center justify-center bg-white/60 dark:bg-black/60 backdrop-blur-sm transition-all text-center">
                        <span className="text-[10px] leading-tight font-bold flex flex-col items-center text-slate-900 dark:text-white">
                          <Edit className="h-4 w-4 mb-1" /> Replace
                        </span>
                      </div>
                    </>
                  ) : (
                    <>
                      <ImageIcon className="h-6 w-6 mb-2 text-slate-400 group-hover:text-blue-500 transition-colors" />
                      <span className="text-[10px] font-medium text-slate-600 dark:text-slate-400 leading-tight">
                        Upload Vertical
                      </span>
                    </>
                  )}
                </div>
              </div>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                ref={portraitInputRef}
                onChange={(e) => handleImageChange(e, "portrait")}
              />
            </div>
          </div>

          <div className="space-y-2 pt-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
              Campaign Title <span className="text-rose-500">*</span>
            </label>
            <Input
              required
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              placeholder="e.g., Summer Blood Drive 2026"
              className="bg-white dark:bg-slate-950/50 focus:ring-rose-500/20"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
              Target URL (On Click) <span className="text-rose-500">*</span>
            </label>
            <Input
              required
              type="url"
              value={formData.target_link}
              onChange={(e) =>
                setFormData({ ...formData, target_link: e.target.value })
              }
              placeholder="https://sponsor-website.com"
              className="bg-white dark:bg-slate-950/50 focus:ring-rose-500/20"
            />
          </div>

          {!selectedAd && (
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                Initial Time Period <span className="text-rose-500">*</span>
              </label>
              <Select
                value={formData.duration_months}
                onChange={(e) =>
                  setFormData({ ...formData, duration_months: e.target.value })
                }
                className="bg-white dark:bg-slate-950/50 focus:ring-rose-500/20"
              >
                <option value="1">1 Month</option>
                <option value="3">3 Months</option>
                <option value="6">6 Months</option>
                <option value="12">1 Year</option>
              </Select>
            </div>
          )}

          <div className="pt-6 border-t flex justify-end gap-3 border-slate-200 dark:border-slate-800">
            <Button
              type="button"
              variant="ghost"
              onClick={closeFormModal}
              className="text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800"
            >
              Abort
            </Button>
            <Button
              type="submit"
              variant="primary"
              className="min-w-40 shadow-md hover:shadow-lg transition-all dark:shadow-lg"
              disabled={
                saveMutation.isPending ||
                (!selectedAd && !formData.banner_image)
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
        title="Extend Campaign"
      >
        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
              Add Time to Campaign
            </label>
            <Select
              value={extendMonths}
              onChange={(e) => setExtendMonths(e.target.value)}
              className="bg-white dark:bg-slate-950/50"
            >
              <option value="1">+ 1 Month</option>
              <option value="3">+ 3 Months</option>
              <option value="6">+ 6 Months</option>
              <option value="12">+ 1 Year</option>
            </Select>
          </div>
          <div className="pt-4 flex justify-end gap-3 border-t border-slate-200 dark:border-slate-800">
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
              {extendMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
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
