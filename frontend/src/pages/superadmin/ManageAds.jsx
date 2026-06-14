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
  Play,
  Pause,
  Clock,
  MegaphoneOff,
  ServerCrash,
  RefreshCw,
  Eye,
  Image as ImageIcon,
  MonitorPlay,
  ArrowLeft,
  Settings,
  ImagePlus,
} from "lucide-react";
import toast from "react-hot-toast";

import { Card, CardContent } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Select } from "../../components/ui/Select";
import { Badge } from "../../components/ui/Badge";
import api from "../../lib/axios";
import { getImageUrl } from "../../lib/utils";

export default function ManageAds() {
  const queryClient = useQueryClient();
  const bannerInputRef = useRef(null);
  const portraitInputRef = useRef(null);
  const heroInputRef = useRef(null);

  const [viewState, setViewState] = useState("table");
  const [isExtendModalOpen, setIsExtendModalOpen] = useState(false);
  const [selectedAd, setSelectedAd] = useState(null);

  const [bannerPreview, setBannerPreview] = useState(null);
  const [portraitPreview, setPortraitPreview] = useState(null);
  const [heroPreview, setHeroPreview] = useState(null);

  const [formData, setFormData] = useState({
    title: "",
    target_link: "",
    duration_months: "1",
    banner_image: null,
    portrait_image: null,
    hero_image: null,
    show_on_hero: false,
  });

  const [extendMonths, setExtendMonths] = useState("1");

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

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = new FormData();
      payload.append("title", formData.title);
      payload.append("target_link", formData.target_link);
      payload.append("show_on_hero", formData.show_on_hero);

      if (formData.banner_image instanceof File)
        payload.append("banner_image", formData.banner_image);
      if (formData.portrait_image instanceof File)
        payload.append("portrait_image", formData.portrait_image);
      if (formData.hero_image instanceof File)
        payload.append("hero_image", formData.hero_image);

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
      closeForm();
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

  const openCreateForm = () => {
    setSelectedAd(null);
    setFormData({
      title: "",
      target_link: "",
      duration_months: "1",
      banner_image: null,
      portrait_image: null,
      hero_image: null,
      show_on_hero: false,
    });
    setBannerPreview(null);
    setPortraitPreview(null);
    setHeroPreview(null);

    if (bannerInputRef.current) bannerInputRef.current.value = "";
    if (portraitInputRef.current) portraitInputRef.current.value = "";
    if (heroInputRef.current) heroInputRef.current.value = "";

    setViewState("form");
  };

  const openEditForm = (ad) => {
    setSelectedAd(ad);
    setFormData({
      title: ad.title,
      target_link: ad.target_link,
      show_on_hero: ad.show_on_hero || false,
      banner_image: null,
      portrait_image: null,
      hero_image: null,
    });

    setBannerPreview(ad.banner_image ? getImageUrl(ad.banner_image) : null);
    setPortraitPreview(
      ad.portrait_image ? getImageUrl(ad.portrait_image) : null,
    );
    setHeroPreview(ad.hero_image ? getImageUrl(ad.hero_image) : null);

    if (bannerInputRef.current) bannerInputRef.current.value = "";
    if (portraitInputRef.current) portraitInputRef.current.value = "";
    if (heroInputRef.current) heroInputRef.current.value = "";

    setViewState("form");
  };

  const closeForm = () => {
    setViewState("table");
    setSelectedAd(null);

    if (bannerPreview && bannerPreview.startsWith("blob:"))
      URL.revokeObjectURL(bannerPreview);
    if (portraitPreview && portraitPreview.startsWith("blob:"))
      URL.revokeObjectURL(portraitPreview);
    if (heroPreview && heroPreview.startsWith("blob:"))
      URL.revokeObjectURL(heroPreview);
  };

  const handleImageChange = (e, type) => {
    const file = e.target.files[0];
    if (file) {
      if (type === "banner") {
        setFormData({ ...formData, banner_image: file });
        setBannerPreview(URL.createObjectURL(file));
      } else if (type === "portrait") {
        setFormData({ ...formData, portrait_image: file });
        setPortraitPreview(URL.createObjectURL(file));
      } else if (type === "hero") {
        setFormData({ ...formData, hero_image: file });
        setHeroPreview(URL.createObjectURL(file));
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

  if (viewState === "form") {
    return (
      <div className="p-4 sm:p-6 max-w-6xl mx-auto space-y-6 animate-in fade-in slide-in-from-right-8 duration-500 pb-24 transition-colors bg-slate-50 dark:bg-slate-950">
        <div className="flex items-center gap-4 border-b pb-6 border-slate-200 dark:border-slate-800/80">
          <Button
            variant="outline"
            size="icon"
            onClick={closeForm}
            className="shrink-0"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              {selectedAd ? "Edit Campaign Assets" : "Launch New Campaign"}
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Upload media formats and configure targeting.
            </p>
          </div>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            saveMutation.mutate();
          }}
          className="space-y-8"
        >
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-5 space-y-6">
              <Card className="border-slate-200 dark:border-slate-800 shadow-lg">
                <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
                    <Settings className="h-5 w-5" />
                  </div>
                  <h3 className="font-bold text-slate-900 dark:text-white">
                    Campaign Details
                  </h3>
                </div>
                <CardContent className="p-6 space-y-5">
                  <div className="space-y-2">
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
                      className="bg-slate-50 dark:bg-slate-950/50"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                      Target URL (On Click){" "}
                      <span className="text-rose-500">*</span>
                    </label>
                    <Input
                      required
                      type="url"
                      value={formData.target_link}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          target_link: e.target.value,
                        })
                      }
                      placeholder="https://sponsor-website.com"
                      className="bg-slate-50 dark:bg-slate-950/50"
                    />
                  </div>

                  {!selectedAd && (
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                        Initial Time Period{" "}
                        <span className="text-rose-500">*</span>
                      </label>
                      <Select
                        value={formData.duration_months}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            duration_months: e.target.value,
                          })
                        }
                        className="bg-slate-50 dark:bg-slate-950/50"
                      >
                        <option value="1">1 Month</option>
                        <option value="3">3 Months</option>
                        <option value="6">6 Months</option>
                        <option value="12">1 Year</option>
                      </Select>
                    </div>
                  )}

                  <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                    <div className="flex items-start gap-3 p-4 rounded-xl bg-purple-50/50 border border-purple-100 dark:bg-purple-500/5 dark:border-purple-500/10">
                      <input
                        type="checkbox"
                        id="show_on_hero"
                        checked={formData.show_on_hero}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            show_on_hero: e.target.checked,
                          })
                        }
                        className="mt-1 h-5 w-5 rounded border-slate-300 text-purple-600 focus:ring-purple-500 dark:border-slate-600 dark:bg-slate-800 dark:checked:bg-purple-500"
                      />
                      <label
                        htmlFor="show_on_hero"
                        className="text-sm font-medium text-slate-800 dark:text-slate-200 cursor-pointer flex-1"
                      >
                        Show on Public Hero Slider
                        <p className="text-[11px] font-normal text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                          Requires a Hi-Res Hero image upload. This will inject
                          the ad into the main page carousel rotation.
                        </p>
                      </label>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="lg:col-span-7 space-y-6">
              <Card className="border-slate-200 dark:border-slate-800 shadow-lg">
                <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
                    <ImagePlus className="h-5 w-5" />
                  </div>
                  <h3 className="font-bold text-slate-900 dark:text-white">
                    Media Assets
                  </h3>
                </div>

                <CardContent className="p-6 space-y-8">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                    <div className="sm:col-span-2 space-y-2">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 flex items-center justify-between">
                        <span>
                          Standard Banner{" "}
                          <span className="text-rose-500">*</span>
                        </span>
                        <Badge variant="outline" className="text-[9px]">
                          Landscape
                        </Badge>
                      </label>
                      <div
                        onClick={() => bannerInputRef.current?.click()}
                        className="border-2 border-dashed rounded-xl p-2 text-center cursor-pointer relative overflow-hidden h-40 flex flex-col items-center justify-center group bg-slate-50 border-slate-300 hover:border-rose-400 dark:bg-slate-950/50 dark:border-slate-700 dark:hover:border-rose-500/50 transition-all"
                      >
                        {bannerPreview ? (
                          <>
                            <img
                              src={bannerPreview}
                              alt="Preview"
                              className="absolute inset-0 w-full h-full object-contain p-2"
                            />
                            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 flex items-center justify-center bg-white/70 dark:bg-black/70 backdrop-blur-sm transition-all">
                              <span className="text-xs font-bold flex items-center text-slate-900 dark:text-white">
                                <Edit className="h-4 w-4 mr-1.5" /> Replace
                              </span>
                            </div>
                          </>
                        ) : (
                          <>
                            <ImageIcon className="h-8 w-8 mb-2 text-slate-400 group-hover:text-rose-500 transition-colors" />
                            <span className="text-[11px] font-medium text-slate-500">
                              1200 × 400px (Max 5MB)
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

                    <div className="sm:col-span-1 space-y-2">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 flex items-center justify-between">
                        <span>Sidebar</span>
                        <Badge
                          variant="outline"
                          className="text-[9px] bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20"
                        >
                          Portrait
                        </Badge>
                      </label>
                      <div className="flex justify-center">
                        <div
                          onClick={() => portraitInputRef.current?.click()}
                          className="border-2 border-dashed rounded-xl p-2 text-center cursor-pointer relative overflow-hidden h-40 w-full sm:w-32 flex flex-col items-center justify-center group bg-slate-50 border-slate-300 hover:border-blue-400 dark:bg-slate-950/50 dark:border-slate-700 dark:hover:border-blue-500/50 transition-all"
                        >
                          {portraitPreview ? (
                            <>
                              <img
                                src={portraitPreview}
                                alt="Preview"
                                className="absolute inset-0 w-full h-full object-cover"
                              />
                              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 flex items-center justify-center bg-white/70 dark:bg-black/70 backdrop-blur-sm transition-all text-center">
                                <span className="text-[10px] leading-tight font-bold flex flex-col items-center text-slate-900 dark:text-white">
                                  <Edit className="h-4 w-4 mb-1" /> Replace
                                </span>
                              </div>
                            </>
                          ) : (
                            <>
                              <ImageIcon className="h-6 w-6 mb-2 text-slate-400 group-hover:text-blue-500 transition-colors" />
                              <span className="text-[10px] font-medium text-slate-500 leading-tight">
                                800 × 1200px
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

                  <div className="space-y-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 flex items-center justify-between">
                      <span>Hero Slider Background (Optional)</span>
                      <Badge
                        variant="outline"
                        className="text-[9px] bg-purple-50 text-purple-600 border-purple-200 dark:bg-purple-500/10 dark:text-purple-400 dark:border-purple-500/20"
                      >
                        Hi-Res Landscape
                      </Badge>
                    </label>
                    <div
                      onClick={() => heroInputRef.current?.click()}
                      className="border-2 border-dashed rounded-xl p-2 text-center cursor-pointer relative overflow-hidden h-48 flex flex-col items-center justify-center group bg-slate-50 border-slate-300 hover:border-purple-400 dark:bg-slate-950/50 dark:border-slate-700 dark:hover:border-purple-500/50 transition-all"
                    >
                      {heroPreview ? (
                        <>
                          <img
                            src={heroPreview}
                            alt="Hero Preview"
                            className="absolute inset-0 w-full h-full object-cover opacity-90"
                          />
                          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 flex items-center justify-center bg-white/70 dark:bg-black/70 backdrop-blur-sm transition-all">
                            <span className="text-xs font-bold flex items-center text-slate-900 dark:text-white">
                              <Edit className="h-4 w-4 mr-1.5" /> Replace Hero
                              Banner
                            </span>
                          </div>
                        </>
                      ) : (
                        <>
                          <MonitorPlay className="h-10 w-10 mb-3 text-slate-400 group-hover:text-purple-500 transition-colors" />
                          <span className="text-sm font-bold text-slate-600 dark:text-slate-300">
                            Upload 1920 × 1080px Image
                          </span>
                          <span className="text-xs text-slate-500 mt-1">
                            Required if "Show on Public Hero Slider" is checked.
                          </span>
                        </>
                      )}
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      ref={heroInputRef}
                      onChange={(e) => handleImageChange(e, "hero")}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          <div className="flex items-center justify-end gap-4 pt-6 border-t border-slate-200 dark:border-slate-800">
            <Button type="button" variant="ghost" size="lg" onClick={closeForm}>
              Discard Changes
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="min-w-[200px] shadow-lg"
              disabled={
                saveMutation.isPending ||
                (!selectedAd && !formData.banner_image)
              }
            >
              {saveMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Saving
                  Assets...
                </>
              ) : (
                "Save & Publish Campaign"
              )}
            </Button>
          </div>
        </form>
      </div>
    );
  }

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
          onClick={openCreateForm}
        >
          <Plus className="h-4 w-4" /> Create Campaign
        </Button>
      </div>

      <Card className="overflow-hidden backdrop-blur-xl shadow-xl dark:shadow-2xl transition-colors duration-300 bg-white/80 border-slate-200 dark:bg-slate-900/60 dark:border-slate-800/80">
        {/* --- DESKTOP VIEW (Table) --- */}
        <div className="hidden md:block overflow-x-auto">
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
                            src={getImageUrl(ad.banner_image)}
                            alt={ad.title}
                            className="h-full w-full object-cover"
                          />
                        </div>
                        <div className="h-12 w-20 shrink-0 rounded-lg overflow-hidden border shadow-sm transition-colors duration-300 bg-slate-100 border-slate-200 dark:bg-slate-950 dark:border-slate-700/50 relative">
                          {ad.portrait_image ? (
                            <img
                              src={getImageUrl(ad.portrait_image)}
                              alt={ad.title}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center text-[8px] text-slate-400 font-bold uppercase">
                              No Portrait
                            </div>
                          )}
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

                          {ad.show_on_hero && (
                            <div className="mt-2 inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-purple-100 text-purple-700 border border-purple-200 dark:bg-purple-500/10 dark:text-purple-400 dark:border-purple-500/20">
                              <MonitorPlay className="h-3 w-3" /> Hero Slider Ad
                            </div>
                          )}
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
                          onClick={() => openEditForm(ad)}
                        >
                          <Edit className="h-4 w-4 text-slate-600" />
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

        {/* --- MOBILE STACKED VIEW --- */}
        <div className="md:hidden flex flex-col gap-4 p-4">
          {isLoading ? (
            <div className="py-24 text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-rose-600" />
              <p className="text-sm font-medium tracking-widest uppercase text-slate-500">
                Loading Campaigns...
              </p>
            </div>
          ) : isError ? (
            <div className="py-24 text-center">
              <ServerCrash className="h-10 w-10 mx-auto mb-4 text-rose-600" />
              <p className="mb-4 text-slate-600">Telemetry Failure</p>
            </div>
          ) : ads.length === 0 ? (
            <div className="py-24 text-center">
              <MegaphoneOff className="h-10 w-10 mx-auto mb-4 text-slate-400" />
              <p className="text-slate-600">No active campaigns found.</p>
            </div>
          ) : (
            ads.map((ad) => (
              <div
                key={ad.id}
                className="border rounded-2xl p-4 flex flex-col gap-4 shadow-sm bg-white dark:bg-slate-900/50 dark:border-slate-800"
              >
                <div className="flex items-start gap-3">
                  <div className="h-16 w-24 shrink-0 rounded-lg overflow-hidden border bg-slate-100 dark:bg-slate-800 dark:border-slate-700">
                    {ad.banner_image && (
                      <img
                        src={getImageUrl(ad.banner_image)}
                        alt={ad.title}
                        className="h-full w-full object-cover"
                      />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm text-slate-900 dark:text-white truncate">
                      {ad.title}
                    </p>
                    <div className="mt-1 flex flex-wrap gap-1.5">
                      {ad.is_expired ? (
                        <Badge
                          variant="danger"
                          className="text-[9px] px-1.5 py-0.5"
                        >
                          Expired
                        </Badge>
                      ) : ad.is_active ? (
                        <Badge
                          variant="success"
                          className="text-[9px] px-1.5 py-0.5"
                        >
                          Running
                        </Badge>
                      ) : (
                        <Badge
                          variant="warning"
                          className="text-[9px] px-1.5 py-0.5"
                        >
                          Paused
                        </Badge>
                      )}
                      {ad.show_on_hero && (
                        <Badge
                          variant="outline"
                          className="text-[9px] px-1.5 py-0.5 bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-500/10 dark:text-purple-400 dark:border-purple-500/20"
                        >
                          Hero Ad
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-2.5 rounded-xl border bg-blue-50/50 border-blue-100 text-blue-700 dark:bg-blue-500/10 dark:border-blue-500/20 dark:text-blue-400 font-mono font-bold flex flex-col justify-center items-center gap-1.5">
                    <span className="text-[10px] text-blue-500 dark:text-blue-300 font-sans tracking-widest uppercase">
                      Views
                    </span>
                    <span className="flex items-center gap-1">
                      <Eye className="h-3 w-3" /> {ad.views.toLocaleString()}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl border bg-emerald-50/50 border-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:border-emerald-500/20 dark:text-emerald-400 font-mono font-bold flex flex-col justify-center items-center gap-1.5">
                    <span className="text-[10px] text-emerald-500 dark:text-emerald-300 font-sans tracking-widest uppercase">
                      Clicks
                    </span>
                    <span className="flex items-center gap-1">
                      <MousePointerClick className="h-3 w-3" />{" "}
                      {ad.clicks.toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t dark:border-slate-800">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 px-2"
                    onClick={() => toggleMutation.mutate(ad.id)}
                  >
                    {ad.is_active ? (
                      <span className="flex items-center gap-1 text-amber-600">
                        <Pause className="h-4 w-4" /> Pause
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-emerald-600">
                        <Play className="h-4 w-4" /> Play
                      </span>
                    )}
                  </Button>
                  <div className="flex gap-1.5">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0"
                      onClick={() => {
                        setSelectedAd(ad);
                        setIsExtendModalOpen(true);
                      }}
                    >
                      <Clock className="h-4 w-4 text-blue-600" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0"
                      onClick={() => openEditForm(ad)}
                    >
                      <Edit className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0"
                      onClick={() => {
                        if (window.confirm("Delete?"))
                          deleteMutation.mutate(ad.id);
                      }}
                    >
                      <Trash2 className="h-4 w-4 text-rose-600" />
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>

      {/* --- EXTEND DURATION MODAL --- */}
      {isExtendModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 w-full max-w-sm shadow-2xl border border-slate-200 dark:border-slate-800">
            <h3 className="text-lg font-bold mb-4 text-slate-900 dark:text-white">
              Extend Campaign
            </h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                  Add Time
                </label>
                <Select
                  value={extendMonths}
                  onChange={(e) => setExtendMonths(e.target.value)}
                  className="w-full bg-white dark:bg-slate-950 focus:border-blue-500"
                >
                  <option value="1">+ 1 Month</option>
                  <option value="3">+ 3 Months</option>
                  <option value="6">+ 6 Months</option>
                  <option value="12">+ 1 Year</option>
                </Select>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <Button
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
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Extend Ad"
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
