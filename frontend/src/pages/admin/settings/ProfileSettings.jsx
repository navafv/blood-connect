import { useState, useEffect } from "react";
import {
  Building2,
  Mail,
  Phone,
  MapPin,
  Save,
  Loader2,
  CheckCircle2,
  AlertCircle,
  FileText,
} from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "../../../components/ui/Card";
import { Input } from "../../../components/ui/Input";
import { Select } from "../../../components/ui/Select";
import { Button } from "../../../components/ui/Button";
import api from "../../../lib/axios";

export default function ProfileSettings() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [error, setError] = useState("");

  // Keys updated to match Django's OrganizationSerializer
  const [formData, setFormData] = useState({
    name: "",
    org_type: "HOSPITAL",
    contact_email: "",
    contact_phone: "",
    address_line: "",
    description: "",
  });

  // 1. Fetch current organization details on load
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await api.get("/tenant/organization/");
        // Pre-fill the form with the database values
        setFormData({
          name: response.data.name || "",
          org_type: response.data.org_type || "HOSPITAL",
          contact_email: response.data.contact_email || "",
          contact_phone: response.data.contact_phone || "",
          address_line: response.data.address_line || "",
          description: response.data.description || "",
        });
      } catch (err) {
        console.error("Error fetching profile:", err);
        setError("Failed to load profile data.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (successMessage) setSuccessMessage("");
    if (error) setError("");
  };

  // 2. Save changes to Django
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSuccessMessage("");
    setError("");

    try {
      await api.patch("/tenant/organization/", formData);
      setSuccessMessage("Organization profile successfully updated.");
      setTimeout(() => setSuccessMessage(""), 4000);
    } catch (err) {
      console.error("Update failed:", err);
      setError(
        err.response?.data?.detail ||
          "Failed to update profile. Please check the fields.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-rose-500" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Settings Header */}
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">
          Profile Settings
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Manage how your organization appears on the public directory.
        </p>
      </div>

      <Card className="border-slate-800 bg-slate-900/60 backdrop-blur-md">
        <CardHeader className="border-b border-slate-800 pb-4">
          <CardTitle className="flex items-center gap-2 text-rose-500">
            <Building2 className="h-5 w-5" />
            General Information
          </CardTitle>
        </CardHeader>

        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-8">
            {error && (
              <div className="flex items-center gap-2 p-4 text-sm text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-lg">
                <AlertCircle className="h-5 w-5 shrink-0" />
                <p>{error}</p>
              </div>
            )}

            {/* --- Basic Information --- */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">
                  Organization Name
                </label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <Input
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="pl-10 bg-slate-950/50"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">
                  Organization Type
                </label>
                <Select
                  name="org_type"
                  value={formData.org_type}
                  onChange={handleChange}
                  className="bg-slate-950/50"
                  required
                >
                  <option value="HOSPITAL">Hospital</option>
                  <option value="BLOOD_BANK">Blood Bank</option>
                  <option value="NGO">NGO / Volunteer Group</option>
                  <option value="CLINIC">Private Clinic</option>
                </Select>
              </div>
            </div>

            {/* --- Contact Details --- */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-slate-800/50">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">
                  Public Contact Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <Input
                    type="email"
                    name="contact_email"
                    value={formData.contact_email}
                    onChange={handleChange}
                    className="pl-10 bg-slate-950/50"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">
                  Public Phone Number
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <Input
                    type="tel"
                    name="contact_phone"
                    value={formData.contact_phone}
                    onChange={handleChange}
                    className="pl-10 bg-slate-950/50"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium text-slate-300">
                  Physical Address
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                  <textarea
                    name="address_line"
                    value={formData.address_line}
                    onChange={handleChange}
                    rows={2}
                    className="flex w-full rounded-md border border-slate-700 bg-slate-950/50 pl-10 pr-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent transition-colors resize-none"
                    required
                  />
                </div>
              </div>
            </div>

            {/* --- Additional Info --- */}
            <div className="space-y-2 pt-6 border-t border-slate-800/50">
              <label className="text-sm font-medium text-slate-300">
                About Organization
              </label>
              <div className="relative">
                <FileText className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={4}
                  placeholder="Briefly describe your organization and services..."
                  className="flex w-full rounded-md border border-slate-700 bg-slate-950/50 pl-10 pr-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent transition-colors resize-none"
                />
              </div>
              <p className="text-xs text-slate-500">
                This description may be visible on your public profile.
              </p>
            </div>

            {/* --- Actions --- */}
            <div className="pt-6 border-t border-slate-800 flex items-center justify-between">
              <div className="flex-1">
                {successMessage && (
                  <div className="flex items-center gap-2 text-emerald-400 text-sm animate-in fade-in">
                    <CheckCircle2 className="h-4 w-4" />
                    {successMessage}
                  </div>
                )}
              </div>

              <Button
                type="submit"
                variant="primary"
                className="min-w-35 gap-2"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" /> Save Changes
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
