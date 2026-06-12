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

export default function ProfileSettings() {
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);

  // --- Form & Asset State ---
  const [formData, setFormData] = useState({});
  const [fileData, setFileData] = useState({
    logo: null,
    banner_image: null,
  });

  // --- Query Pipeline: Fetch Tenant Profile ---
  const {
    data: orgData,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["tenant-org-profile"],
    queryFn: async () => (await api.get("/tenant/organization/")).data,
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
      setFileData({ logo: null, banner_image: null });
    }
  }, [orgData, isEditing]);

  // Enforce URL-safe slug formatting dynamically
  const handleSlugChange = (e) =>
    setFormData({
      ...formData,
      slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"),
    });

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleFileChange = (e) =>
    setFileData({ ...fileData, [e.target.name]: e.target.files[0] });

  // --- Mutation Pipeline: Commit Updates ---
  const updateMutation = useMutation({
    mutationFn: async (payload) =>
      api.patch("/tenant/organization/", payload, {
        headers: { "Content-Type": "multipart/form-data" },
      }),
    onSuccess: () => {
      // FIX: Strict object syntax for React Query v5
      queryClient.invalidateQueries({ queryKey: ["tenant-org-profile"] });
      setIsEditing(false);
      toast.success("Organization profile updated.");
    },
    onError: (err) =>
      toast.error(err.response?.data?.detail || "Update failed."),
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = new FormData();

    // FIX: Safe Append to prevent literal "null" strings being saved in DB
    Object.keys(formData).forEach((key) => {
      const val = formData[key];
      if (val !== null && val !== undefined && val !== "") {
        payload.append(key, val);
      } else if (val === "") {
        payload.append(key, "");
      }
    });

    if (fileData.logo) payload.append("logo", fileData.logo);
    if (fileData.banner_image)
      payload.append("banner_image", fileData.banner_image);

    updateMutation.mutate(payload);
  };

  // --- UI Transition States ---
  if (isLoading)
    return (
      <div className="flex h-[60vh] items-center justify-center transition-colors duration-300">
        <Loader2 className="h-10 w-10 animate-spin transition-colors duration-300 text-rose-600 dark:text-rose-500" />
      </div>
    );

  if (isError) {
    return (
      <div className="flex flex-col h-[60vh] items-center justify-center text-center animate-in fade-in duration-500 transition-colors duration-300">
        <div className="h-20 w-20 rounded-2xl flex items-center justify-center border mb-6 transition-colors duration-300 bg-rose-50 border-rose-200 dark:bg-rose-500/10 dark:border-rose-500/20">
          <AlertCircle className="h-10 w-10 transition-colors duration-300 text-rose-600 dark:text-rose-500" />
        </div>
        <h3 className="text-2xl font-bold mb-2 transition-colors duration-300 text-slate-900 dark:text-white">
          Telemetry Failure
        </h3>
        <p className="max-w-md mb-6 leading-relaxed transition-colors duration-300 text-slate-600 dark:text-slate-400">
          Unable to retrieve organizational profile from the central database.
        </p>
        <Button
          variant="outline"
          className="transition-colors duration-300 bg-white border-slate-200 text-slate-700 hover:bg-slate-50 dark:bg-slate-900/50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          onClick={() => refetch()}
        >
          Retry Connection
        </Button>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-24 transition-colors duration-300">
      {/* --- Workspace Header --- */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b pb-6 transition-colors duration-300 border-slate-200 dark:border-slate-800/80">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3 tracking-tight transition-colors duration-300 text-slate-900 dark:text-white">
            <div className="p-1.5 rounded-lg border transition-colors duration-300 bg-rose-50 border-rose-200 dark:bg-rose-500/10 dark:border-rose-500/20">
              <Building2 className="h-5 w-5 transition-colors duration-300 text-rose-600 dark:text-rose-500" />
            </div>
            Organization Profile
          </h1>
          <p className="text-sm mt-2 transition-colors duration-300 text-slate-600 dark:text-slate-400">
            Manage your facility's public-facing directory details and media
            assets.
          </p>
        </div>
        {!isEditing && (
          <Button
            variant="outline"
            className="gap-2 w-full sm:w-auto transition-colors duration-300 text-slate-700 border-slate-200 bg-white hover:bg-slate-50 hover:text-slate-900 dark:text-slate-300 dark:border-slate-700 dark:bg-slate-900/50 dark:hover:bg-slate-800 dark:hover:text-white"
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
            <Card className="backdrop-blur-xl shadow-lg transition-colors duration-300 bg-white/60 border-slate-200 dark:bg-slate-900/40 dark:border-slate-800/80 dark:shadow-xl">
              <CardHeader className="border-b pb-5 transition-colors duration-300 border-slate-200 dark:border-slate-800/60">
                <CardTitle className="text-lg font-bold flex items-center gap-3 transition-colors duration-300 text-slate-900 dark:text-white">
                  <div className="h-10 w-10 rounded-xl flex items-center justify-center border shrink-0 transition-colors duration-300 bg-blue-50 border-blue-200 dark:bg-blue-500/10 dark:border-blue-500/20">
                    <Building2 className="h-5 w-5 transition-colors duration-300 text-blue-600 dark:text-blue-500" />
                  </div>
                  Institutional Identity
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider transition-colors duration-300 text-slate-600 dark:text-slate-400">
                      Organization Name *
                    </label>
                    <Input
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      className="h-11 transition-colors duration-300 focus:ring-rose-500/20"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider transition-colors duration-300 text-slate-600 dark:text-slate-400">
                      Public Profile URL *
                    </label>
                    <div className="flex rounded-lg shadow-sm">
                      <span className="inline-flex items-center px-4 rounded-l-lg border border-r-0 text-sm transition-colors duration-300 bg-slate-50 border-slate-200 text-slate-500 dark:bg-slate-800/50 dark:border-slate-700 dark:text-slate-400">
                        bloodonate.org/hospital/
                      </span>
                      <Input
                        name="slug"
                        value={formData.slug}
                        onChange={handleSlugChange}
                        className="flex-1 rounded-none rounded-r-lg h-11 transition-colors duration-300 focus:ring-rose-500/20"
                        placeholder="your-hospital-name"
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider transition-colors duration-300 text-slate-600 dark:text-slate-400">
                      Public Contact Email *
                    </label>
                    <Input
                      name="contact_email"
                      type="email"
                      value={formData.contact_email}
                      onChange={handleChange}
                      className="h-11 transition-colors duration-300 focus:ring-rose-500/20"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider transition-colors duration-300 text-slate-600 dark:text-slate-400">
                      Public Phone Number *
                    </label>
                    <Input
                      name="contact_phone"
                      value={formData.contact_phone}
                      onChange={handleChange}
                      className="h-11 transition-colors duration-300 focus:ring-rose-500/20"
                      required
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Module 2: Location & Description */}
            <Card className="backdrop-blur-xl shadow-lg transition-colors duration-300 bg-white/60 border-slate-200 dark:bg-slate-900/40 dark:border-slate-800/80 dark:shadow-xl">
              <CardHeader className="border-b pb-5 transition-colors duration-300 border-slate-200 dark:border-slate-800/60">
                <CardTitle className="text-lg font-bold flex items-center gap-3 transition-colors duration-300 text-slate-900 dark:text-white">
                  <div className="h-10 w-10 rounded-xl flex items-center justify-center border shrink-0 transition-colors duration-300 bg-emerald-50 border-emerald-200 dark:bg-emerald-500/10 dark:border-emerald-500/20">
                    <MapPin className="h-5 w-5 transition-colors duration-300 text-emerald-600 dark:text-emerald-500" />
                  </div>
                  Location & Description
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider transition-colors duration-300 text-slate-600 dark:text-slate-400">
                    Street Address *
                  </label>
                  <Input
                    name="address_line"
                    value={formData.address_line}
                    onChange={handleChange}
                    className="h-11 transition-colors duration-300 focus:ring-rose-500/20"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider transition-colors duration-300 text-slate-600 dark:text-slate-400">
                    Organization Bio
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows={4}
                    className="w-full rounded-xl border px-4 py-3 text-sm focus:outline-none focus:ring-1 transition-all resize-none shadow-sm dark:shadow-inner bg-white border-slate-200 text-slate-900 placeholder-slate-400 focus:border-rose-500 focus:ring-rose-500/20 dark:bg-slate-950/50 dark:border-slate-700 dark:text-white dark:placeholder-slate-500 dark:focus:ring-rose-500/50"
                    placeholder="Provide a brief overview of your facility to public donors..."
                  />
                </div>
              </CardContent>
            </Card>

            {/* Module 3: Branding Assets */}
            <Card className="backdrop-blur-xl shadow-lg transition-colors duration-300 bg-white/60 border-slate-200 dark:bg-slate-900/40 dark:border-slate-800/80 dark:shadow-xl">
              <CardHeader className="border-b pb-5 transition-colors duration-300 border-slate-200 dark:border-slate-800/60">
                <CardTitle className="text-lg font-bold flex items-center gap-3 transition-colors duration-300 text-slate-900 dark:text-white">
                  <div className="h-10 w-10 rounded-xl flex items-center justify-center border shrink-0 transition-colors duration-300 bg-amber-50 border-amber-200 dark:bg-amber-500/10 dark:border-amber-500/20">
                    <ImagePlus className="h-5 w-5 transition-colors duration-300 text-amber-600 dark:text-amber-500" />
                  </div>
                  Branding Assets
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <label className="text-xs font-bold uppercase tracking-wider transition-colors duration-300 text-slate-600 dark:text-slate-400">
                      Square Logo (PNG/JPG)
                    </label>
                    <Input
                      type="file"
                      accept="image/*"
                      name="logo"
                      onChange={handleFileChange}
                      className="h-12 transition-colors duration-300 text-slate-600 dark:text-slate-400 file:text-rose-600 file:bg-rose-50 hover:file:bg-rose-100 dark:file:text-rose-500 dark:file:bg-rose-500/10 dark:hover:file:bg-rose-500/20 file:border-0 file:rounded-md file:mr-4 file:px-4 file:py-1.5 file:font-semibold text-sm"
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="text-xs font-bold uppercase tracking-wider transition-colors duration-300 text-slate-600 dark:text-slate-400">
                      Hero Banner
                    </label>
                    <Input
                      type="file"
                      accept="image/*"
                      name="banner_image"
                      onChange={handleFileChange}
                      className="h-12 transition-colors duration-300 text-slate-600 dark:text-slate-400 file:text-rose-600 file:bg-rose-50 hover:file:bg-rose-100 dark:file:text-rose-500 dark:file:bg-rose-500/10 dark:hover:file:bg-rose-500/20 file:border-0 file:rounded-md file:mr-4 file:px-4 file:py-1.5 file:font-semibold text-sm"
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
                className="transition-colors duration-300 text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800"
                onClick={() => setIsEditing(false)}
                disabled={updateMutation.isPending}
              >
                <X className="h-4 w-4 mr-2" /> Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={updateMutation.isPending}
                className="min-w-40 shadow-md hover:shadow-lg dark:shadow-lg"
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
            <Card className="backdrop-blur-xl shadow-xl overflow-hidden relative transition-colors duration-300 bg-white/80 border-slate-200 dark:bg-slate-900/40 dark:border-slate-800/80">
              {orgData.banner_image && (
                <div className="absolute top-0 right-0 w-1/2 h-full opacity-30 dark:opacity-10 pointer-events-none">
                  <div className="absolute inset-0 z-10 transition-colors duration-300 bg-linear-to-r from-white to-transparent dark:from-slate-900" />
                  <img
                    src={orgData.banner_image}
                    alt="Cover"
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <CardContent className="p-8 relative z-20">
                {/* Logo & Name Header */}
                <div className="flex items-center gap-6 mb-10 pb-8 border-b transition-colors duration-300 border-slate-200 dark:border-slate-800/60">
                  {orgData.logo ? (
                    <img
                      src={orgData.logo}
                      alt="Logo"
                      className="h-24 w-24 rounded-2xl object-cover border shadow-xl transition-colors duration-300 bg-white border-white dark:bg-slate-950 dark:border-slate-700"
                    />
                  ) : (
                    <div className="h-24 w-24 rounded-2xl flex items-center justify-center border shadow-xl transition-colors duration-300 bg-slate-100 border-slate-200 dark:bg-slate-800/80 dark:border-slate-700">
                      <Building2 className="h-10 w-10 transition-colors duration-300 text-slate-400 dark:text-slate-500" />
                    </div>
                  )}
                  <div>
                    <h2 className="text-3xl font-black tracking-tight transition-colors duration-300 text-slate-900 dark:text-white">
                      {orgData.name}
                    </h2>
                    <div className="flex items-center gap-1.5 mt-2 font-medium transition-colors duration-300 text-rose-600 dark:text-rose-400">
                      <LinkIcon className="h-4 w-4" />
                      bloodonate.org/hospital/{orgData.slug}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  <div className="space-y-8">
                    <div className="flex items-start gap-4">
                      <div className="h-12 w-12 rounded-xl flex items-center justify-center border shrink-0 transition-colors duration-300 bg-slate-50 border-slate-200 dark:bg-slate-800/80 dark:border-slate-700">
                        <MapPin className="h-6 w-6 transition-colors duration-300 text-slate-500 dark:text-slate-400" />
                      </div>
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wider mb-1 transition-colors duration-300 text-slate-500 dark:text-slate-500">
                          Registered Location
                        </p>
                        <p className="font-medium transition-colors duration-300 text-slate-900 dark:text-white">
                          {orgData.address_line}
                        </p>
                        <p className="text-sm mt-0.5 transition-colors duration-300 text-slate-600 dark:text-slate-400">
                          {orgData.district_name}, {orgData.state_name}
                        </p>
                        <p className="text-sm transition-colors duration-300 text-slate-500 dark:text-slate-500">
                          {orgData.country_name}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-4">
                      <div className="h-12 w-12 rounded-xl flex items-center justify-center border shrink-0 transition-colors duration-300 bg-slate-50 border-slate-200 dark:bg-slate-800/80 dark:border-slate-700">
                        <Mail className="h-6 w-6 transition-colors duration-300 text-slate-500 dark:text-slate-400" />
                      </div>
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wider mb-1 transition-colors duration-300 text-slate-500 dark:text-slate-500">
                          Support Email
                        </p>
                        <p className="font-medium font-mono tracking-tight transition-colors duration-300 text-slate-900 dark:text-white">
                          {orgData.contact_email}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-4">
                      <div className="h-12 w-12 rounded-xl flex items-center justify-center border shrink-0 transition-colors duration-300 bg-slate-50 border-slate-200 dark:bg-slate-800/80 dark:border-slate-700">
                        <Phone className="h-6 w-6 transition-colors duration-300 text-slate-500 dark:text-slate-400" />
                      </div>
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wider mb-1 transition-colors duration-300 text-slate-500 dark:text-slate-500">
                          Phone Hotline
                        </p>
                        <p className="font-medium font-mono tracking-tight transition-colors duration-300 text-slate-900 dark:text-white">
                          {orgData.contact_phone}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 h-full border-t md:border-t-0 md:border-l pt-8 md:pt-0 md:pl-10 transition-colors duration-300 border-slate-200 dark:border-slate-800/60">
                    <div className="h-12 w-12 rounded-xl flex items-center justify-center border shrink-0 transition-colors duration-300 bg-slate-50 border-slate-200 dark:bg-slate-800/80 dark:border-slate-700">
                      <FileText className="h-6 w-6 transition-colors duration-300 text-slate-500 dark:text-slate-400" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-bold uppercase tracking-wider mb-2 transition-colors duration-300 text-slate-500 dark:text-slate-500">
                        Institutional Biography
                      </p>
                      <p className="text-sm leading-relaxed transition-colors duration-300 text-slate-700 dark:text-slate-300">
                        {orgData.description || (
                          <span className="italic transition-colors duration-300 text-slate-500 dark:text-slate-600">
                            No organizational description provided.
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
