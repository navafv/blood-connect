import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Building2,
  Mail,
  Phone,
  MapPin,
  Edit,
  Save,
  X,
  Loader2,
  AlertCircle,
  FileText,
  ImagePlus,
  Link as LinkIcon,
  CheckCircle2,
} from "lucide-react";
import toast from "react-hot-toast";

import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "../../../components/ui/Card";
import { Button } from "../../../components/ui/Button";
import { Input } from "../../../components/ui/Input";
import api from "../../../lib/axios";

/**
 * Tenant Profile Settings Workspace
 * Allows organization administrators to manage their public-facing directory
 * profile, contact vectors, and institutional media assets.
 */
export default function ProfileSettings() {
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);

  // --- Form & Asset State ---
  const [formData, setFormData] = useState({});
  const [fileData, setFileData] = useState({
    banner_image: null,
    gallery_photo_1: null,
    gallery_photo_2: null,
  });

  // --- Query Pipeline: Fetch Tenant Profile ---
  const {
    data: orgData,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["tenant-org-profile"],
    queryFn: async () => {
      const response = await api.get("/tenant/organization/");
      return response.data;
    },
  });

  // Hydrate local form state when data resolves or edit mode is toggled
  useEffect(() => {
    if (orgData && !isEditing) {
      setFormData({
        slug: orgData.slug || "",
        name: orgData.name || "",
        contact_email: orgData.contact_email || "",
        contact_phone: orgData.contact_phone || "",
        address_line: orgData.address_line || "",
        description: orgData.description || "",
      });
      // Flush pending file uploads when cancelling edit mode
      setFileData({
        banner_image: null,
        gallery_photo_1: null,
        gallery_photo_2: null,
      });
    }
  }, [orgData, isEditing]);

  // Enforce URL-safe slug formatting dynamically
  const handleSlugChange = (e) => {
    const formattedSlug = e.target.value
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, "-");
    setFormData({ ...formData, slug: formattedSlug });
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    setFileData({ ...fileData, [e.target.name]: e.target.files[0] });
  };

  // --- Mutation Pipeline: Commit Updates ---
  const updateMutation = useMutation({
    mutationFn: async (payload) => {
      const response = await api.patch("/tenant/organization/", payload, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["tenant-org-profile"]);
      setIsEditing(false);
      toast.success("Organization profile updated successfully.");
    },
    onError: (err) => {
      toast.error(
        err.response?.data?.detail ||
          "Failed to update profile. Please verify your inputs.",
      );
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();

    const payload = new FormData();

    // Append primitive text fields
    Object.keys(formData).forEach((key) => {
      if (formData[key] !== null && formData[key] !== undefined) {
        payload.append(key, formData[key]);
      }
    });

    // Conditionally append modified assets
    if (fileData.banner_image)
      payload.append("banner_image", fileData.banner_image);
    if (fileData.gallery_photo_1)
      payload.append("gallery_photo_1", fileData.gallery_photo_1);
    if (fileData.gallery_photo_2)
      payload.append("gallery_photo_2", fileData.gallery_photo_2);

    updateMutation.mutate(payload);
  };

  // --- UI Transition States ---
  if (isLoading) {
    return (
      <div className="flex flex-col h-[60vh] items-center justify-center text-slate-400 gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-rose-500" />
        <span className="text-sm font-semibold tracking-widest uppercase">
          Fetching Profile...
        </span>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col h-[60vh] items-center justify-center text-center animate-in fade-in duration-500">
        <div className="h-20 w-20 rounded-2xl bg-rose-500/10 flex items-center justify-center border border-rose-500/20 mb-6">
          <AlertCircle className="h-10 w-10 text-rose-500" />
        </div>
        <h3 className="text-2xl font-bold text-white mb-2">
          Telemetry Failure
        </h3>
        <p className="text-slate-400 max-w-md mb-6 leading-relaxed">
          Unable to retrieve organizational profile from the central database.
        </p>
        <Button
          variant="outline"
          className="border-slate-700 bg-slate-900/50"
          onClick={() => refetch()}
        >
          Retry Connection
        </Button>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-24">
      {/* --- Workspace Header --- */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800/80 pb-6">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3 tracking-tight">
            <div className="p-1.5 rounded-lg bg-rose-500/10 border border-rose-500/20">
              <Building2 className="h-5 w-5 text-rose-500" />
            </div>
            Organization Profile
          </h1>
          <p className="text-sm text-slate-400 mt-2">
            Manage your facility's public-facing directory details and media
            assets.
          </p>
        </div>
        {!isEditing && (
          <Button
            variant="outline"
            className="gap-2 border-slate-700 bg-slate-900/50 hover:bg-slate-800 text-slate-300 w-full sm:w-auto transition-colors"
            onClick={() => setIsEditing(true)}
          >
            <Edit className="h-4 w-4" /> Edit Profile
          </Button>
        )}
      </div>

      <div className="space-y-8">
        {isEditing ? (
          /* =========================================
             EDIT MODE
             ========================================= */
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Module 1: Institutional Identity */}
            <Card className="border-slate-800/80 bg-slate-900/40 backdrop-blur-xl shadow-xl">
              <CardHeader className="border-b border-slate-800/60 pb-5">
                <CardTitle className="text-lg font-bold text-white flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20 shrink-0">
                    <Building2 className="h-5 w-5 text-blue-500" />
                  </div>
                  Institutional Identity
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Organization Name *
                    </label>
                    <Input
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      className="bg-slate-950/50 border-slate-700 h-11"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Public Profile URL *
                    </label>
                    <div className="flex rounded-lg shadow-sm">
                      <span className="inline-flex items-center px-4 rounded-l-lg border border-r-0 border-slate-700 bg-slate-800/50 text-slate-400 text-sm">
                        bloodconnect.com/
                      </span>
                      <Input
                        name="slug"
                        value={formData.slug}
                        onChange={handleSlugChange}
                        className="flex-1 rounded-none rounded-r-lg bg-slate-950/50 border-slate-700 focus:ring-rose-500 h-11"
                        placeholder="your-hospital-name"
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Public Contact Email *
                    </label>
                    <Input
                      name="contact_email"
                      type="email"
                      value={formData.contact_email}
                      onChange={handleChange}
                      className="bg-slate-950/50 border-slate-700 h-11"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Public Phone Number *
                    </label>
                    <Input
                      name="contact_phone"
                      value={formData.contact_phone}
                      onChange={handleChange}
                      className="bg-slate-950/50 border-slate-700 h-11"
                      required
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Module 2: Location & Description */}
            <Card className="border-slate-800/80 bg-slate-900/40 backdrop-blur-xl shadow-xl">
              <CardHeader className="border-b border-slate-800/60 pb-5">
                <CardTitle className="text-lg font-bold text-white flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 shrink-0">
                    <MapPin className="h-5 w-5 text-emerald-500" />
                  </div>
                  Location & Description
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Street Address *
                  </label>
                  <Input
                    name="address_line"
                    value={formData.address_line}
                    onChange={handleChange}
                    className="bg-slate-950/50 border-slate-700 h-11"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Organization Bio
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows={4}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950/50 px-4 py-3 text-sm text-white placeholder-slate-500 focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500/50 transition-all resize-none shadow-inner"
                    placeholder="Provide a brief overview of your facility to public donors..."
                  />
                </div>
              </CardContent>
            </Card>

            {/* Module 3: Media Assets */}
            <Card className="border-slate-800/80 bg-slate-900/40 backdrop-blur-xl shadow-xl">
              <CardHeader className="border-b border-slate-800/60 pb-5">
                <CardTitle className="text-lg font-bold text-white flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20 shrink-0">
                    <ImagePlus className="h-5 w-5 text-amber-500" />
                  </div>
                  Media Assets
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-3">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Hero Banner
                    </label>
                    <Input
                      type="file"
                      accept="image/*"
                      name="banner_image"
                      onChange={handleFileChange}
                      className="bg-slate-950/50 text-slate-400 file:text-rose-500 file:bg-rose-500/10 file:border-0 file:rounded-md file:mr-4 file:px-4 file:py-1.5 file:font-semibold text-sm h-12"
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Facility Photo 1
                    </label>
                    <Input
                      type="file"
                      accept="image/*"
                      name="gallery_photo_1"
                      onChange={handleFileChange}
                      className="bg-slate-950/50 text-slate-400 file:text-rose-500 file:bg-rose-500/10 file:border-0 file:rounded-md file:mr-4 file:px-4 file:py-1.5 file:font-semibold text-sm h-12"
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Facility Photo 2
                    </label>
                    <Input
                      type="file"
                      accept="image/*"
                      name="gallery_photo_2"
                      onChange={handleFileChange}
                      className="bg-slate-950/50 text-slate-400 file:text-rose-500 file:bg-rose-500/10 file:border-0 file:rounded-md file:mr-4 file:px-4 file:py-1.5 file:font-semibold text-sm h-12"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Form Actions */}
            <div className="flex justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="ghost"
                className="text-slate-400 hover:text-white"
                onClick={() => setIsEditing(false)}
                disabled={updateMutation.isPending}
              >
                <X className="h-4 w-4 mr-2" /> Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={updateMutation.isPending}
                className="min-w-40 shadow-lg"
              >
                {updateMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" /> Commit Changes
                  </>
                )}
              </Button>
            </div>
          </form>
        ) : (
          /* =========================================
             READ-ONLY MODE
             ========================================= */
          <div className="space-y-6">
            <Card className="border-slate-800/80 bg-slate-900/40 backdrop-blur-xl shadow-xl overflow-hidden relative">
              {orgData.banner_image && (
                <div className="absolute top-0 right-0 w-1/2 h-full opacity-10 pointer-events-none">
                  <div className="absolute inset-0 bg-linear-to-r from-slate-900 to-transparent z-10" />
                  <img
                    src={orgData.banner_image}
                    alt="Cover"
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <CardContent className="p-8 relative z-20">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  <div className="space-y-6">
                    <div className="flex items-start gap-4">
                      <div className="h-12 w-12 rounded-xl bg-slate-800/80 flex items-center justify-center border border-slate-700 shrink-0">
                        <Building2 className="h-6 w-6 text-slate-400" />
                      </div>
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                          Organization Name
                        </p>
                        <p className="text-xl font-bold text-white tracking-tight">
                          {orgData.name}
                        </p>
                        <div className="flex items-center gap-1.5 mt-2 text-sm text-rose-400 hover:text-rose-300 transition-colors">
                          <LinkIcon className="h-3.5 w-3.5" />
                          <span>bloodconnect.com/{orgData.slug}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-start gap-4">
                      <div className="h-12 w-12 rounded-xl bg-slate-800/80 flex items-center justify-center border border-slate-700 shrink-0">
                        <MapPin className="h-6 w-6 text-slate-400" />
                      </div>
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                          Registered Location
                        </p>
                        <p className="text-white font-medium">
                          {orgData.address_line}
                        </p>
                        <p className="text-slate-400 text-sm mt-0.5">
                          {orgData.district_name}, {orgData.state_name}
                        </p>
                        <p className="text-slate-500 text-sm">
                          {orgData.country_name}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="flex items-start gap-4">
                      <div className="h-12 w-12 rounded-xl bg-slate-800/80 flex items-center justify-center border border-slate-700 shrink-0">
                        <Mail className="h-6 w-6 text-slate-400" />
                      </div>
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                          Support Email
                        </p>
                        <p className="text-white font-medium font-mono tracking-tight">
                          {orgData.contact_email}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-4">
                      <div className="h-12 w-12 rounded-xl bg-slate-800/80 flex items-center justify-center border border-slate-700 shrink-0">
                        <Phone className="h-6 w-6 text-slate-400" />
                      </div>
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                          Phone Hotline
                        </p>
                        <p className="text-white font-medium font-mono tracking-tight">
                          {orgData.contact_phone}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-8 pt-8 border-t border-slate-800/60">
                  <div className="flex items-start gap-4">
                    <div className="h-12 w-12 rounded-xl bg-slate-800/80 flex items-center justify-center border border-slate-700 shrink-0">
                      <FileText className="h-6 w-6 text-slate-400" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                        Institutional Biography
                      </p>
                      <p className="text-slate-300 text-sm leading-relaxed">
                        {orgData.description || (
                          <span className="italic text-slate-600">
                            No organizational description provided.
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Media Asset Preview Grid */}
            {(orgData.banner_image ||
              orgData.gallery_photo_1 ||
              orgData.gallery_photo_2) && (
              <Card className="border-slate-800/80 bg-slate-900/40 backdrop-blur-xl shadow-xl">
                <CardHeader className="border-b border-slate-800/60 pb-5">
                  <CardTitle className="text-lg font-bold text-white flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20 shrink-0">
                      <ImagePlus className="h-5 w-5 text-amber-500" />
                    </div>
                    Public Media Assets
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {orgData.banner_image && (
                      <div className="space-y-2">
                        <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                          Hero Banner
                        </p>
                        <div className="aspect-video rounded-xl overflow-hidden border border-slate-700 shadow-md">
                          <img
                            src={orgData.banner_image}
                            alt="Banner"
                            className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                          />
                        </div>
                      </div>
                    )}
                    {orgData.gallery_photo_1 && (
                      <div className="space-y-2">
                        <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                          Gallery 1
                        </p>
                        <div className="aspect-video rounded-xl overflow-hidden border border-slate-700 shadow-md">
                          <img
                            src={orgData.gallery_photo_1}
                            alt="Gallery 1"
                            className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                          />
                        </div>
                      </div>
                    )}
                    {orgData.gallery_photo_2 && (
                      <div className="space-y-2">
                        <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                          Gallery 2
                        </p>
                        <div className="aspect-video rounded-xl overflow-hidden border border-slate-700 shadow-md">
                          <img
                            src={orgData.gallery_photo_2}
                            alt="Gallery 2"
                            className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
