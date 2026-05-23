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
        name: orgData.name || "",
        contact_email: orgData.contact_email || "",
        contact_phone: orgData.contact_phone || "",
        address_line: orgData.address_line || "",
        description: orgData.description || "",
      });
    }
  }, [orgData, isEditing]);

  // 2. Update Mutation
  const updateMutation = useMutation({
    mutationFn: async (payload) => {
      const response = await api.patch("/tenant/organization/", payload);
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

  const handleSubmit = (e) => {
    e.preventDefault();
    setUpdateError("");
    updateMutation.mutate(formData);
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
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
