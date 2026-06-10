import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Building2,
  Mail,
  Lock,
  User,
  ArrowRight,
  Droplet,
  Loader2,
  MapPin,
  Globe,
  Eye,
  EyeOff,
  CheckCircle2,
  Phone,
  Upload,
} from "lucide-react";
import toast from "react-hot-toast";

import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { SearchableSelect } from "../../components/ui/SearchableSelect";
import api from "../../lib/axios";

export default function RegisterOrg() {
  const navigate = useNavigate();

  // UI State
  const [status, setStatus] = useState("idle");
  const [showPassword, setShowPassword] = useState(false);

  // Location Data
  const [countries, setCountries] = useState([]);
  const [states, setStates] = useState([]);
  const [districts, setDistricts] = useState([]);

  // Form Data with new Contact Phone, Address, and Logo
  const [formData, setFormData] = useState({
    orgName: "",
    orgType: "HOSPITAL",
    contactName: "",
    email: "",
    contact_phone: "",
    address_line: "",
    password: "",
    country_id: "",
    state_id: "",
    district_id: "",
    is_searchable: true,
    logo: null,
  });

  // Organization Types
  const orgTypeOptions = [
    { label: "Hospital", value: "HOSPITAL" },
    { label: "Blood Bank", value: "BLOOD_BANK" },
    { label: "NGO / Volunteer Group", value: "NGO" },
    { label: "Private Clinic", value: "CLINIC" },
  ];

  // Fetch Countries
  useEffect(() => {
    const fetchCountries = async () => {
      try {
        const response = await api.get("/locations/countries/");
        setCountries(response.data);
      } catch (err) {
        toast.error("Unable to load country data");
      }
    };

    fetchCountries();
  }, []);

  // Country Change
  const handleCountryChange = async (val) => {
    setFormData({
      ...formData,
      country_id: val,
      state_id: "",
      district_id: "",
    });

    setStates([]);
    setDistricts([]);

    if (val) {
      try {
        const response = await api.get(`/locations/states/?country=${val}`);

        setStates(response.data);
      } catch (err) {
        toast.error("Unable to load states");
      }
    }
  };

  // State Change
  const handleStateChange = async (val) => {
    setFormData({
      ...formData,
      state_id: val,
      district_id: "",
    });

    setDistricts([]);

    if (val) {
      try {
        const response = await api.get(`/locations/districts/?state=${val}`);

        setDistricts(response.data);
      } catch (err) {
        toast.error("Unable to load districts");
      }
    }
  };

  // Input Change (Modified to handle Files)
  const handleChange = (e) => {
    const { name, value, type, checked, files } = e.target;

    if (type === "file") {
      setFormData({
        ...formData,
        [name]: files[0],
      });
    } else {
      setFormData({
        ...formData,
        [name]: type === "checkbox" ? checked : value,
      });
    }
  };

  // Submit via FormData for Image Upload support
  const handleSubmit = async (e) => {
    e.preventDefault();

    setStatus("loading");

    const payload = new FormData();
    payload.append("orgName", formData.orgName);
    payload.append("orgType", formData.orgType);
    payload.append("contactName", formData.contactName);
    payload.append("email", formData.email);
    payload.append("contact_phone", formData.contact_phone);
    payload.append("address_line", formData.address_line);
    payload.append("password", formData.password);
    payload.append("country_id", formData.country_id);
    payload.append("state_id", formData.state_id);
    payload.append("district_id", formData.district_id);
    payload.append("is_searchable", formData.is_searchable);

    if (formData.logo) {
      payload.append("logo", formData.logo);
    }

    try {
      await api.post("/auth/register/", payload, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setStatus("success");

      toast.success("Organization registered successfully");

      setTimeout(() => {
        navigate("/verify-email", {
          state: { email: formData.email },
        });
      }, 2500);
    } catch (err) {
      setStatus("idle");

      toast.error(
        err.response?.data?.error || "Unable to complete registration",
      );
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4 py-10 relative overflow-hidden">
      {/* Ambient Background */}{" "}
      <div
        className="absolute top-[-10%] right-[-5%] w-120 h-120 bg-rose-600/15 rounded-full blur-[120px] pointer-events-none"
        aria-hidden="true"
      />
      <div
        className="absolute bottom-[-10%] left-[-5%] w-120 h-120 bg-blue-600/10 rounded-full blur-[120px] pointer-events-none"
        aria-hidden="true"
      />
      {/* Main Container */}
      <div className="w-full max-w-4xl relative z-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
        {/* Header */}
        <div className="flex flex-col items-center mb-8">
          <Link
            to="/"
            className="group flex items-center justify-center h-16 w-16 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl transition-all duration-300 hover:border-rose-500/40"
          >
            <Droplet className="h-8 w-8 text-rose-500 transition-transform duration-300 group-hover:scale-110" />
          </Link>

          <h1 className="mt-6 text-3xl font-extrabold tracking-tight text-white text-center">
            Register Your Organization
          </h1>

          <p className="mt-3 text-sm text-slate-400 text-center leading-relaxed max-w-2xl">
            Create a secure BlooDonate workspace to manage blood donors,
            emergency requests, and organization operations.
          </p>
        </div>

        {/* Card */}
        <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-3xl shadow-2xl px-6 sm:px-10 py-10">
          {status === "success" ? (
            <div className="text-center py-12 animate-in fade-in zoom-in duration-500">
              <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-emerald-500/10 border border-emerald-500/20 mb-6 relative">
                <div className="absolute inset-0 bg-emerald-500/20 rounded-full blur-md animate-pulse" />

                <CheckCircle2 className="h-12 w-12 text-emerald-500 relative z-10" />
              </div>

              <h3 className="text-3xl font-bold text-white mb-3">
                Registration Successful
              </h3>

              <p className="text-slate-400 text-base max-w-md mx-auto leading-relaxed mb-8">
                Your organization account has been created successfully.
                Redirecting you to email verification...
              </p>

              <Loader2 className="h-8 w-8 text-rose-500 animate-spin mx-auto" />
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-10">
              {/* Organization Info */}
              <div className="space-y-6">
                <div>
                  <h2 className="text-sm font-bold uppercase tracking-wider text-white flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-rose-500" />
                    Organization Information
                  </h2>

                  <p className="mt-2 text-sm text-slate-400">
                    Enter your organization details and administrator
                    information.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* Org Name */}
                  <div className="md:col-span-2 relative group">
                    <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500 transition-colors group-focus-within:text-rose-500" />

                    <Input
                      name="orgName"
                      placeholder="Organization Name"
                      required
                      value={formData.orgName}
                      onChange={handleChange}
                      disabled={status === "loading"}
                      className="pl-12 h-12 bg-slate-950/50 border-slate-700 focus:border-rose-500 focus:ring-rose-500/20 transition-all"
                    />
                  </div>

                  {/* Org Type */}
                  <div className="md:col-span-2">
                    <SearchableSelect
                      value={formData.orgType}
                      onChange={(val) =>
                        handleChange({
                          target: {
                            name: "orgType",
                            value: val,
                          },
                        })
                      }
                      options={orgTypeOptions}
                      placeholder="Select Organization Type"
                      className="bg-slate-950/50"
                      required
                    />
                  </div>

                  {/* Contact Name */}
                  <div className="relative group">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500 transition-colors group-focus-within:text-rose-500" />

                    <Input
                      name="contactName"
                      placeholder="Administrator Name"
                      required
                      value={formData.contactName}
                      onChange={handleChange}
                      disabled={status === "loading"}
                      className="pl-12 h-12 bg-slate-950/50 border-slate-700 focus:border-rose-500 focus:ring-rose-500/20 transition-all"
                    />
                  </div>

                  {/* Contact Phone */}
                  <div className="relative group">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500 transition-colors group-focus-within:text-rose-500" />

                    <Input
                      name="contact_phone"
                      placeholder="Contact Phone Number"
                      required
                      value={formData.contact_phone}
                      onChange={handleChange}
                      disabled={status === "loading"}
                      className="pl-12 h-12 bg-slate-950/50 border-slate-700 focus:border-rose-500 focus:ring-rose-500/20 transition-all"
                    />
                  </div>

                  {/* Email */}
                  <div className="relative group">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500 transition-colors group-focus-within:text-rose-500" />

                    <Input
                      type="email"
                      name="email"
                      placeholder="Official Email Address"
                      required
                      value={formData.email}
                      onChange={handleChange}
                      disabled={status === "loading"}
                      className="pl-12 h-12 bg-slate-950/50 border-slate-700 focus:border-rose-500 focus:ring-rose-500/20 transition-all"
                    />
                  </div>

                  {/* Password */}
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500 transition-colors group-focus-within:text-rose-500" />

                    <Input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      placeholder="Create Password"
                      required
                      value={formData.password}
                      onChange={handleChange}
                      disabled={status === "loading"}
                      className="pl-12 pr-12 h-12 bg-slate-950/50 border-slate-700 focus:border-rose-500 focus:ring-rose-500/20 transition-all"
                    />

                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>
                  </div>

                  {/* Address Line */}
                  <div className="md:col-span-2 relative group">
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500 transition-colors group-focus-within:text-rose-500" />

                    <Input
                      name="address_line"
                      placeholder="Complete Address Details"
                      required
                      value={formData.address_line}
                      onChange={handleChange}
                      disabled={status === "loading"}
                      className="pl-12 h-12 bg-slate-950/50 border-slate-700 focus:border-rose-500 focus:ring-rose-500/20 transition-all"
                    />
                  </div>

                  {/* Logo Upload */}
                  <div className="md:col-span-2 relative group">
                    <Upload className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500 transition-colors group-focus-within:text-rose-500" />

                    <Input
                      type="file"
                      name="logo"
                      accept="image/*"
                      onChange={handleChange}
                      disabled={status === "loading"}
                      className="pl-12 h-12 bg-slate-950/50 border-slate-700 focus:border-rose-500 focus:ring-rose-500/20 transition-all text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-rose-500/10 file:text-rose-500 hover:file:bg-rose-500/20"
                    />
                  </div>
                </div>
              </div>

              {/* Location */}
              <div className="space-y-6 border-t border-slate-800 pt-8">
                <div>
                  <h2 className="text-sm font-bold uppercase tracking-wider text-white flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-emerald-500" />
                    Location Information
                  </h2>

                  <p className="mt-2 text-sm text-slate-400">
                    Select the region where your organization operates.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  {/* Country */}
                  <SearchableSelect
                    value={formData.country_id}
                    onChange={handleCountryChange}
                    options={countries.map((c) => ({
                      label: c.name,
                      value: c.id.toString(),
                    }))}
                    placeholder="Select Country"
                    className="bg-slate-950/50"
                    required
                  />

                  {/* State */}
                  <SearchableSelect
                    value={formData.state_id}
                    onChange={handleStateChange}
                    options={states.map((s) => ({
                      label: s.name,
                      value: s.id.toString(),
                    }))}
                    placeholder="Select State"
                    disabled={!formData.country_id}
                    className="bg-slate-950/50"
                    required
                  />

                  {/* District */}
                  <SearchableSelect
                    value={formData.district_id}
                    onChange={(val) =>
                      handleChange({
                        target: {
                          name: "district_id",
                          value: val,
                        },
                      })
                    }
                    options={districts.map((d) => ({
                      label: d.name,
                      value: d.id.toString(),
                    }))}
                    placeholder="Select District"
                    disabled={!formData.state_id}
                    className="bg-slate-950/50"
                    required
                  />
                </div>
              </div>

              {/* Public Listing */}
              <div className="space-y-5 border-t border-slate-800 pt-8">
                <div>
                  <h2 className="text-sm font-bold uppercase tracking-wider text-white flex items-center gap-2">
                    <Globe className="h-4 w-4 text-blue-500" />
                    Public Directory
                  </h2>

                  <p className="mt-2 text-sm text-slate-400">
                    Allow your organization to appear in public donor search
                    results.
                  </p>
                </div>

                <label className="flex items-start gap-4 p-5 rounded-2xl border border-slate-700 bg-slate-950/40 hover:bg-slate-900 transition-all cursor-pointer">
                  <input
                    type="checkbox"
                    name="is_searchable"
                    checked={formData.is_searchable}
                    onChange={handleChange}
                    disabled={status === "loading"}
                    className="mt-1 h-5 w-5 rounded border-slate-600 bg-slate-950 text-rose-500 focus:ring-rose-500"
                  />

                  <div>
                    <span className="block text-white font-medium">
                      Enable Public Visibility
                    </span>

                    <span className="block mt-1 text-sm text-slate-400 leading-relaxed">
                      Your organization and available donors may appear in
                      emergency donor searches while protecting personal donor
                      information.
                    </span>
                  </div>
                </label>
              </div>

              {/* Submit */}
              <div className="pt-2">
                <Button
                  type="submit"
                  variant="primary"
                  disabled={status === "loading"}
                  className="w-full py-6 text-base font-semibold rounded-xl shadow-lg hover:shadow-rose-500/20 transition-all gap-2"
                >
                  {status === "loading" ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Creating Account...
                    </>
                  ) : (
                    <>
                      Register Organization
                      <ArrowRight className="h-5 w-5" />
                    </>
                  )}
                </Button>
              </div>
            </form>
          )}

          {/* Footer */}
          {status !== "success" && (
            <div className="mt-8 pt-6 border-t border-slate-800 text-center">
              <p className="text-sm text-slate-400">
                Already have an account?{" "}
                <Link
                  to="/login"
                  className="font-semibold text-white hover:text-rose-400 transition-colors"
                >
                  Sign In
                </Link>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
