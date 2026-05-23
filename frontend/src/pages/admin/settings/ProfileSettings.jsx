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
  CheckCircle2,
  FileText,
  ImagePlus,
} from "lucide-react";
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
  const [formData, setFormData] = useState({});
  const [fileData, setFileData] = useState({
    banner_image: null,
    gallery_photo_1: null,
    gallery_photo_2: null,
  });
  const [updateSuccess, setUpdateSuccess] = useState(false);
  const [updateError, setUpdateError] = useState("");

  // 1. Fetch Organization Data
  const {
    data: orgData,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["tenant-org-profile"],
    queryFn: async () => {
      const response = await api.get("/tenant/organization/");
      return response.data;
    },
  });

  // Pre-fill form when data loads or edit mode is toggled
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
      // Reset file inputs when leaving edit mode
      setFileData({
        banner_image: null,
        gallery_photo_1: null,
        gallery_photo_2: null,
      });
    }
  }, [orgData, isEditing]);

  // 2. Add a specialized change handler just for the slug to prevent spaces/symbols
  const handleSlugChange = (e) => {
    const formattedSlug = e.target.value
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, "-"); // Replaces spaces and symbols with hyphens
    setFormData({ ...formData, slug: formattedSlug });
  };

  // 2. Update Mutation
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
      setUpdateSuccess(true);
      setUpdateError("");
      setTimeout(() => setUpdateSuccess(false), 3000);
    },
    onError: (err) => {
      setUpdateError(
        err.response?.data?.detail ||
          "Failed to update profile. Please check the fields.",
      );
    },
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    setFileData({ ...fileData, [e.target.name]: e.target.files[0] });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setUpdateError("");

    const payload = new FormData();

    // Append standard text fields
    Object.keys(formData).forEach((key) => {
      if (formData[key] !== null && formData[key] !== undefined) {
        payload.append(key, formData[key]);
      }
    });

    // Append files ONLY if the user actually selected a new one
    if (fileData.banner_image)
      payload.append("banner_image", fileData.banner_image);
    if (fileData.gallery_photo_1)
      payload.append("gallery_photo_1", fileData.gallery_photo_1);
    if (fileData.gallery_photo_2)
      payload.append("gallery_photo_2", fileData.gallery_photo_2);

    updateMutation.mutate(payload);
  };

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center text-slate-400">
        <Loader2 className="h-8 w-8 animate-spin text-rose-500" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-6 max-w-4xl mx-auto flex items-center gap-3 text-rose-400 bg-rose-500/10 rounded-xl">
        <AlertCircle className="h-5 w-5" />
        <p>Failed to load organization profile.</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800 pb-6">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <Building2 className="h-6 w-6 text-rose-500" /> Organization Profile
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Manage your hospital or blood bank's public details and contact
            information.
          </p>
        </div>
        {!isEditing && (
          <Button
            variant="outline"
            className="gap-2 border-slate-700 hover:bg-slate-800 text-slate-300"
            onClick={() => setIsEditing(true)}
          >
            <Edit className="h-4 w-4" /> Edit Profile
          </Button>
        )}
      </div>

      {updateSuccess && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center gap-3 text-emerald-400 animate-in fade-in">
          <CheckCircle2 className="h-5 w-5" />
          <p className="text-sm font-medium">
            Organization profile updated successfully.
          </p>
        </div>
      )}

      {updateError && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-center gap-3 text-rose-400 animate-in fade-in">
          <AlertCircle className="h-5 w-5" />
          <p className="text-sm font-medium">{updateError}</p>
        </div>
      )}

      <Card className="border-slate-800 bg-slate-900/60 backdrop-blur-md">
        <CardHeader className="border-b border-slate-800 pb-4">
          <CardTitle className="text-lg font-medium text-white">
            General Information
          </CardTitle>
        </CardHeader>

        <CardContent className="pt-6">
          {isEditing ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-400">
                    Organization Name
                  </label>
                  <Input
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="bg-slate-950"
                  />
                </div>
                <div className="space-y-2 col-span-2">
                  <label className="text-sm font-medium text-slate-400">
                    Custom Profile URL
                  </label>
                  <div className="flex rounded-md shadow-sm">
                    <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-slate-700 bg-slate-800 text-slate-400 sm:text-sm">
                      bloodconnect.com/hospital/
                    </span>
                    <Input
                      name="slug"
                      value={formData.slug}
                      onChange={handleSlugChange}
                      className="flex-1 rounded-none rounded-r-md bg-slate-950 focus:ring-rose-500"
                      placeholder="your-hospital-name"
                      required
                    />
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    This is your public web address. Only lowercase letters,
                    numbers, and hyphens are allowed.
                  </p>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-400">
                    Public Contact Email
                  </label>
                  <Input
                    name="contact_email"
                    type="email"
                    value={formData.contact_email}
                    onChange={handleChange}
                    required
                    className="bg-slate-950"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-400">
                    Public Phone Number
                  </label>
                  <Input
                    name="contact_phone"
                    value={formData.contact_phone}
                    onChange={handleChange}
                    required
                    className="bg-slate-950"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-400">
                    Street Address
                  </label>
                  <Input
                    name="address_line"
                    value={formData.address_line}
                    onChange={handleChange}
                    required
                    className="bg-slate-950"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-400">
                  Organization Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={4}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white placeholder-slate-500 focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
                  placeholder="Tell donors about your hospital/facility..."
                />
              </div>

              <div className="space-y-4 pt-4 border-t border-slate-800">
                <h3 className="text-sm font-medium text-slate-300 flex items-center gap-2">
                  <ImagePlus className="h-4 w-4" /> Public Profile Photos
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs text-slate-400">
                      Hero Banner Image
                    </label>
                    <Input
                      type="file"
                      accept="image/*"
                      name="banner_image"
                      onChange={handleFileChange}
                      className="bg-slate-950 text-slate-400 file:text-rose-500 file:bg-rose-500/10 file:border-0 file:rounded-md file:mr-4 file:px-3 file:py-1 text-sm h-12"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs text-slate-400">
                      Gallery Photo 1
                    </label>
                    <Input
                      type="file"
                      accept="image/*"
                      name="gallery_photo_1"
                      onChange={handleFileChange}
                      className="bg-slate-950 text-slate-400 file:text-rose-500 file:bg-rose-500/10 file:border-0 file:rounded-md file:mr-4 file:px-3 file:py-1 text-sm h-12"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs text-slate-400">
                      Gallery Photo 2
                    </label>
                    <Input
                      type="file"
                      accept="image/*"
                      name="gallery_photo_2"
                      onChange={handleFileChange}
                      className="bg-slate-950 text-slate-400 file:text-rose-500 file:bg-rose-500/10 file:border-0 file:rounded-md file:mr-4 file:px-3 file:py-1 text-sm h-12"
                    />
                  </div>
                </div>
              </div>

              {/* Geographic Lock Warning */}
              <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg text-sm text-amber-400/90 flex gap-2">
                <AlertCircle className="h-5 w-5 shrink-0" />
                <p>
                  Geographic regions (Country, State, District) are locked to
                  maintain search integrity. If your facility has relocated,
                  please contact Super Admin support to initiate a region
                  transfer.
                </p>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
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
                  className="min-w-32"
                >
                  {updateMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />{" "}
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" /> Save Changes
                    </>
                  )}
                </Button>
              </div>
            </form>
          ) : (
            // --- READ ONLY MODE ---
            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <Building2 className="h-5 w-5 text-slate-500 mt-0.5" />
                    <div>
                      <p className="text-sm text-slate-500">
                        Organization Name
                      </p>
                      <p className="text-white font-medium text-lg">
                        {orgData.name}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Mail className="h-5 w-5 text-slate-500 mt-0.5" />
                    <div>
                      <p className="text-sm text-slate-500">Support Email</p>
                      <p className="text-white font-medium">
                        {orgData.contact_email}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Phone className="h-5 w-5 text-slate-500 mt-0.5" />
                    <div>
                      <p className="text-sm text-slate-500">Phone Hotline</p>
                      <p className="text-white font-medium">
                        {orgData.contact_phone}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <MapPin className="h-5 w-5 text-slate-500 mt-0.5" />
                    <div>
                      <p className="text-sm text-slate-500">
                        Registered Location
                      </p>
                      <p className="text-white font-medium">
                        {orgData.address_line}
                      </p>
                      <p className="text-slate-400 text-sm mt-1">
                        {orgData.district_name}, {orgData.state_name}
                      </p>
                      <p className="text-slate-400 text-sm">
                        {orgData.country_name}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 pt-2">
                    <FileText className="h-5 w-5 text-slate-500 mt-0.5" />
                    <div>
                      <p className="text-sm text-slate-500">About Facility</p>
                      <p className="text-slate-300 text-sm mt-1 leading-relaxed max-w-md">
                        {orgData.description || (
                          <span className="italic text-slate-600">
                            No description provided.
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {(orgData.banner_image ||
                orgData.gallery_photo_1 ||
                orgData.gallery_photo_2) && (
                <div className="mt-8 pt-6 border-t border-slate-800">
                  <h4 className="text-sm text-slate-500 mb-4 flex items-center gap-2">
                    <ImagePlus className="h-4 w-4" /> Uploaded Media
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {orgData.banner_image && (
                      <div className="space-y-1">
                        <p className="text-xs text-slate-500 uppercase tracking-wider">
                          Hero Banner
                        </p>
                        <img
                          src={orgData.banner_image}
                          alt="Banner"
                          className="w-full h-28 object-cover rounded-lg border border-slate-700/50 shadow-md"
                        />
                      </div>
                    )}
                    {orgData.gallery_photo_1 && (
                      <div className="space-y-1">
                        <p className="text-xs text-slate-500 uppercase tracking-wider">
                          Gallery 1
                        </p>
                        <img
                          src={orgData.gallery_photo_1}
                          alt="Gallery 1"
                          className="w-full h-28 object-cover rounded-lg border border-slate-700/50 shadow-md"
                        />
                      </div>
                    )}
                    {orgData.gallery_photo_2 && (
                      <div className="space-y-1">
                        <p className="text-xs text-slate-500 uppercase tracking-wider">
                          Gallery 2
                        </p>
                        <img
                          src={orgData.gallery_photo_2}
                          alt="Gallery 2"
                          className="w-full h-28 object-cover rounded-lg border border-slate-700/50 shadow-md"
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
