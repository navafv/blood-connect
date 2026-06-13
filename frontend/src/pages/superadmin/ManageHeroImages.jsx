import React, { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Plus,
  Edit,
  Trash2,
  Loader2,
  Play,
  Pause,
  ServerCrash,
  ArrowLeft,
  Settings,
  ImagePlus,
  MonitorPlay,
  ImageOff,
} from "lucide-react";
import toast from "react-hot-toast";

import { Card, CardContent } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Badge } from "../../components/ui/Badge";
import api from "../../lib/axios";
import { getImageUrl } from "../../lib/utils";

export default function ManageHeroImages() {
  const queryClient = useQueryClient();
  const imageInputRef = useRef(null);

  const [viewState, setViewState] = useState("table");
  const [selectedImage, setSelectedImage] = useState(null);

  const [imagePreview, setImagePreview] = useState(null);

  const [formData, setFormData] = useState({
    alt_text: "",
    order: 0,
    image: null,
  });

  const {
    data: heroImages = [],
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["superadmin-hero-images"],
    queryFn: async () => {
      const res = await api.get("/superadmin/hero-images/");
      return res.data.results || res.data;
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = new FormData();
      payload.append("alt_text", formData.alt_text);
      payload.append("order", formData.order);

      // [FIX]: Ensure it's a file before appending
      if (formData.image instanceof File) {
        payload.append("image", formData.image);
      }

      if (selectedImage) {
        return api.patch(
          `/superadmin/hero-images/${selectedImage.id}/`,
          payload,
          {
            headers: { "Content-Type": "multipart/form-data" },
          },
        );
      } else {
        return api.post("/superadmin/hero-images/", payload, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["superadmin-hero-images"] });
      closeForm();
      toast.success(
        selectedImage ? "Hero slide updated." : "Hero slide created.",
      );
    },
    onError: (err) => {
      toast.error(
        err.response?.data?.error || "Failed to process hero image data.",
      );
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async (id) => api.post(`/superadmin/hero-images/${id}/toggle/`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["superadmin-hero-images"] });
      toast.success("Visibility updated.");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => api.delete(`/superadmin/hero-images/${id}/`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["superadmin-hero-images"] });
      toast.success("Hero image deleted.");
    },
  });

  const openCreateForm = () => {
    setSelectedImage(null);
    setFormData({
      alt_text: "",
      order: 0,
      image: null,
    });
    setImagePreview(null);
    if (imageInputRef.current) imageInputRef.current.value = "";
    setViewState("form");
  };

  const openEditForm = (img) => {
    setSelectedImage(img);
    setFormData({
      alt_text: img.alt_text || "",
      order: img.order || 0,
      image: null,
    });

    // [FIX]: Map correctly
    setImagePreview(img.image ? getImageUrl(img.image) : null);

    if (imageInputRef.current) imageInputRef.current.value = "";
    setViewState("form");
  };

  const closeForm = () => {
    setViewState("table");
    setSelectedImage(null);
    if (imagePreview && imagePreview.startsWith("blob:")) {
      URL.revokeObjectURL(imagePreview);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData({ ...formData, image: file });
      setImagePreview(URL.createObjectURL(file));
    }
  };

  if (viewState === "form") {
    return (
      <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-6 animate-in fade-in slide-in-from-right-8 duration-500 pb-24 transition-colors bg-slate-50 dark:bg-slate-950">
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
              {selectedImage ? "Edit Hero Slide" : "Add New Hero Slide"}
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Upload a high-resolution background for the public homepage.
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
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-6">
              <Card className="border-slate-200 dark:border-slate-800 shadow-lg h-full">
                <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
                    <ImagePlus className="h-5 w-5" />
                  </div>
                  <h3 className="font-bold text-slate-900 dark:text-white">
                    Slide Image
                  </h3>
                </div>

                <CardContent className="p-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 flex items-center justify-between">
                      <span>
                        Background Image{" "}
                        {selectedImage ? (
                          ""
                        ) : (
                          <span className="text-rose-500">*</span>
                        )}
                      </span>
                      <Badge
                        variant="outline"
                        className="text-[9px] bg-purple-50 text-purple-600 border-purple-200 dark:bg-purple-500/10 dark:text-purple-400 dark:border-purple-500/20"
                      >
                        1920 x 1080px
                      </Badge>
                    </label>
                    <div
                      onClick={() => imageInputRef.current?.click()}
                      className="border-2 border-dashed rounded-xl p-2 text-center cursor-pointer relative overflow-hidden h-64 flex flex-col items-center justify-center group bg-slate-50 border-slate-300 hover:border-purple-400 dark:bg-slate-950/50 dark:border-slate-700 dark:hover:border-purple-500/50 transition-all"
                    >
                      {imagePreview ? (
                        <>
                          <img
                            src={imagePreview}
                            alt="Preview"
                            className="absolute inset-0 w-full h-full object-cover opacity-90"
                          />
                          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 flex items-center justify-center bg-white/70 dark:bg-black/70 backdrop-blur-sm transition-all">
                            <span className="text-xs font-bold flex items-center text-slate-900 dark:text-white">
                              <Edit className="h-4 w-4 mr-1.5" /> Replace
                              Background
                            </span>
                          </div>
                        </>
                      ) : (
                        <>
                          <MonitorPlay className="h-10 w-10 mb-3 text-slate-400 group-hover:text-purple-500 transition-colors" />
                          <span className="text-sm font-bold text-slate-600 dark:text-slate-300">
                            Click to Upload Image
                          </span>
                          <span className="text-xs text-slate-500 mt-1">
                            JPEG, PNG, WEBP (Max 5MB)
                          </span>
                        </>
                      )}
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      ref={imageInputRef}
                      onChange={handleImageChange}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card className="border-slate-200 dark:border-slate-800 shadow-lg h-full">
                <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
                    <Settings className="h-5 w-5" />
                  </div>
                  <h3 className="font-bold text-slate-900 dark:text-white">
                    Configuration
                  </h3>
                </div>
                <CardContent className="p-6 space-y-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                      Alt Text (SEO / Accessibility)
                    </label>
                    <Input
                      value={formData.alt_text}
                      onChange={(e) =>
                        setFormData({ ...formData, alt_text: e.target.value })
                      }
                      placeholder="e.g., Donor holding a blood bag"
                      className="bg-slate-50 dark:bg-slate-950/50"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                      Display Order (Sort Index)
                    </label>
                    <Input
                      type="number"
                      min="0"
                      value={formData.order}
                      onChange={(e) =>
                        setFormData({ ...formData, order: e.target.value })
                      }
                      placeholder="0"
                      className="bg-slate-50 dark:bg-slate-950/50"
                    />
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Lower numbers appear first in the carousel sequence.
                    </p>
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
                saveMutation.isPending || (!selectedImage && !formData.image)
              }
            >
              {saveMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Saving...
                </>
              ) : (
                "Save & Publish Slide"
              )}
            </Button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 pb-24 transition-colors duration-300 bg-slate-50 dark:bg-slate-950">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b pb-6 transition-colors duration-300 border-slate-200 dark:border-slate-800/80">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-3 transition-colors duration-300 text-slate-900 dark:text-white">
            <div className="p-1.5 rounded-lg border transition-colors duration-300 bg-purple-50 border-purple-200 dark:bg-purple-500/10 dark:border-purple-500/20">
              <MonitorPlay className="h-5 w-5 transition-colors duration-300 text-purple-600 dark:text-purple-500" />
            </div>
            Hero Image Slider
          </h1>
          <p className="text-sm mt-2 transition-colors duration-300 text-slate-600 dark:text-slate-400">
            Manage the background slides displayed on the public home page.
          </p>
        </div>
        <Button
          variant="primary"
          className="gap-2 shadow-md bg-purple-600 hover:bg-purple-700 border-purple-600"
          onClick={openCreateForm}
        >
          <Plus className="h-4 w-4" /> Add New Slide
        </Button>
      </div>

      <Card className="overflow-hidden backdrop-blur-xl shadow-xl dark:shadow-2xl transition-colors duration-300 bg-white/80 border-slate-200 dark:bg-slate-900/60 dark:border-slate-800/80">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm transition-colors duration-300 text-slate-700 dark:text-slate-300">
            <thead className="text-xs uppercase font-bold border-b transition-colors duration-300 bg-slate-50 text-slate-500 border-slate-200 dark:bg-slate-950/40 dark:border-slate-800/80">
              <tr>
                <th className="px-6 py-5">Slide Media</th>
                <th className="px-6 py-5">Alt Text</th>
                <th className="px-6 py-5">Sort Order</th>
                <th className="px-6 py-5">Status</th>
                <th className="px-6 py-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y transition-colors duration-300 divide-slate-200 dark:divide-slate-800/50">
              {isLoading ? (
                <tr>
                  <td colSpan="5" className="px-6 py-24 text-center">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-purple-600" />
                    <p className="text-sm font-medium tracking-widest uppercase text-slate-500">
                      Loading Slides...
                    </p>
                  </td>
                </tr>
              ) : isError ? (
                <tr>
                  <td colSpan="5" className="px-6 py-24 text-center">
                    <ServerCrash className="h-10 w-10 mx-auto mb-4 text-rose-600" />
                    <p className="mb-4 text-slate-600">Failed to fetch data.</p>
                  </td>
                </tr>
              ) : heroImages.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-24 text-center">
                    <ImageOff className="h-10 w-10 mx-auto mb-4 text-slate-400" />
                    <p className="text-slate-600">
                      No hero images uploaded yet.
                    </p>
                  </td>
                </tr>
              ) : (
                heroImages.map((img) => (
                  <tr
                    key={img.id}
                    className="transition-colors group hover:bg-slate-50 dark:hover:bg-slate-800/30"
                  >
                    <td className="px-6 py-4">
                      <div className="h-16 w-28 shrink-0 rounded-lg overflow-hidden border shadow-sm transition-colors duration-300 bg-slate-100 border-slate-200 dark:bg-slate-950 dark:border-slate-700/50">
                        <img
                          src={getImageUrl(img.image)}
                          alt={img.alt_text || `Slide ${img.id}`}
                          className="h-full w-full object-cover"
                        />
                      </div>
                    </td>

                    <td className="px-6 py-4 max-w-[200px] truncate">
                      {img.alt_text ? (
                        <span className="text-slate-900 dark:text-slate-200">
                          {img.alt_text}
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">None</span>
                      )}
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center h-8 w-8 rounded-full bg-slate-100 dark:bg-slate-800 font-bold text-slate-700 dark:text-slate-300">
                        {img.order}
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      {img.is_active ? (
                        <Badge variant="success" className="px-2.5 py-1">
                          Visible
                        </Badge>
                      ) : (
                        <Badge
                          variant="warning"
                          className="px-2.5 py-1 text-slate-700"
                        >
                          Hidden
                        </Badge>
                      )}
                    </td>

                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => toggleMutation.mutate(img.id)}
                          disabled={toggleMutation.isPending}
                        >
                          {img.is_active ? (
                            <Pause className="h-4 w-4 text-amber-600" />
                          ) : (
                            <Play className="h-4 w-4 text-emerald-600" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => openEditForm(img)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-rose-600"
                          onClick={() => {
                            if (
                              window.confirm(
                                "Are you sure you want to delete this slide permanently?",
                              )
                            )
                              deleteMutation.mutate(img.id);
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
    </div>
  );
}
