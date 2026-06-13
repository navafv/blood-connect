import React, { useState, useEffect, useRef, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import zxcvbn from "zxcvbn";
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
  UploadCloud,
  Edit,
  ShieldCheck,
} from "lucide-react";
import toast from "react-hot-toast";

import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { SearchableSelect } from "../../components/ui/SearchableSelect";
import api from "../../lib/axios";

export default function RegisterOrg() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  // UI State
  const [status, setStatus] = useState("idle");
  const [showPassword, setShowPassword] = useState(false);
  const [logoPreview, setLogoPreview] = useState(null);

  // Location Data
  const [countries, setCountries] = useState([]);
  const [states, setStates] = useState([]);
  const [districts, setDistricts] = useState([]);

  // Form Data
  const [formData, setFormData] = useState({
    orgName: "",
    orgType: "",
    contactName: "",
    email: "",
    contact_phone: "",
    address_line: "",
    password: "",
    country_id: "",
    state_id: "",
    district_id: "",
    is_searchable: true,
    consent_agreed: false,
    logo: null,
  });

  // --- Password Strength Calculation ---
  const pwdResult = useMemo(() => {
    return formData.password ? zxcvbn(formData.password) : null;
  }, [formData.password]);

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

  // Input Change
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  // File Change with Preview
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData({ ...formData, logo: file });
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  // Submit via FormData for Image Upload support
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.orgType) {
      toast.error("Please select an Organization Type.");
      return;
    }

    if (formData.password.length < 8) {
      toast.error("Password must be at least 8 characters long.");
      return;
    }

    if (!formData.consent_agreed) {
      toast.error("You must agree to the Terms of Service and Privacy Policy.");
      return;
    }

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
    payload.append("consent_agreed", formData.consent_agreed);

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
    <div className="min-h-screen flex items-center justify-center px-4 py-10 relative overflow-hidden transition-colors duration-300 bg-slate-50 dark:bg-slate-950">
      {/* Ambient Background */}
      <div
        className="absolute top-[-10%] right-[-5%] w-[480px] h-[480px] rounded-full blur-[120px] pointer-events-none transition-colors duration-300 bg-rose-500/10 dark:bg-rose-600/15"
        aria-hidden="true"
      />
      <div
        className="absolute bottom-[-10%] left-[-5%] w-[480px] h-[480px] rounded-full blur-[120px] pointer-events-none transition-colors duration-300 bg-blue-500/10 dark:bg-blue-600/10"
        aria-hidden="true"
      />

      {/* Main Container */}
      <div className="w-full max-w-4xl relative z-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
        {/* Header */}
        <div className="flex flex-col items-center mb-8">
          <Link
            to="/"
            className="group flex items-center justify-center h-16 w-16 rounded-2xl border transition-all duration-300 shadow-md bg-white border-slate-200 hover:border-rose-300 dark:bg-slate-900 dark:border-slate-800 dark:shadow-2xl dark:hover:border-rose-500/40"
          >
            <Droplet className="h-8 w-8 transition-transform duration-300 group-hover:scale-110 text-rose-600 dark:text-rose-500" />
          </Link>

          <h1 className="mt-6 text-3xl font-extrabold tracking-tight text-center transition-colors duration-300 text-slate-900 dark:text-white">
            Register Your Organization
          </h1>

          <p className="mt-3 text-sm text-center leading-relaxed max-w-2xl transition-colors duration-300 text-slate-600 dark:text-slate-400">
            Create a secure Bloodonate workspace to manage blood donors,
            emergency requests, and organization operations.
          </p>
        </div>

        {/* Card */}
        <div className="backdrop-blur-xl border rounded-3xl shadow-xl px-6 sm:px-10 py-10 transition-colors duration-300 bg-white/80 border-slate-200 dark:bg-slate-900/60 dark:border-slate-800/80 dark:shadow-2xl">
          {status === "success" ? (
            <div className="text-center py-12 animate-in fade-in zoom-in duration-500">
              <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full border mb-6 relative transition-colors duration-300 bg-emerald-50 border-emerald-200 dark:bg-emerald-500/10 dark:border-emerald-500/20">
                <div className="absolute inset-0 rounded-full blur-md animate-pulse transition-colors duration-300 bg-emerald-200/50 dark:bg-emerald-500/20" />
                <CheckCircle2 className="h-12 w-12 relative z-10 transition-colors duration-300 text-emerald-600 dark:text-emerald-500" />
              </div>

              <h3 className="text-3xl font-bold mb-3 transition-colors duration-300 text-slate-900 dark:text-white">
                Registration Successful
              </h3>

              <p className="text-base max-w-md mx-auto leading-relaxed mb-8 transition-colors duration-300 text-slate-600 dark:text-slate-400">
                Your organization account has been created successfully.
                Redirecting you to email verification...
              </p>

              <Loader2 className="h-8 w-8 animate-spin mx-auto transition-colors duration-300 text-rose-600 dark:text-rose-500" />
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-10">
              {/* --- Organization Info --- */}
              <div className="space-y-6">
                <div>
                  <h2 className="text-sm font-bold uppercase tracking-wider flex items-center gap-2 transition-colors duration-300 text-slate-900 dark:text-white">
                    <Building2 className="h-4 w-4 transition-colors duration-300 text-rose-600 dark:text-rose-500" />
                    Organization Information
                  </h2>
                  <p className="mt-2 text-sm transition-colors duration-300 text-slate-600 dark:text-slate-400">
                    Enter your organization details and administrator
                    information.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-5 gap-y-6">
                  {/* Org Name */}
                  <div className="md:col-span-2 space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider transition-colors duration-300 text-slate-600 dark:text-slate-400">
                      Organization Name *
                    </label>
                    <div className="relative group">
                      <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 transition-colors duration-300 text-slate-400 group-focus-within:text-rose-600 dark:text-slate-500 dark:group-focus-within:text-rose-500" />
                      <Input
                        name="orgName"
                        placeholder="e.g. City General Hospital"
                        required
                        value={formData.orgName}
                        onChange={handleChange}
                        disabled={status === "loading"}
                        className="pl-12 h-12 transition-all duration-300 focus:ring-rose-500/20"
                      />
                    </div>
                  </div>

                  {/* Org Type */}
                  <div className="md:col-span-2 space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider transition-colors duration-300 text-slate-600 dark:text-slate-400">
                      Organization Type *
                    </label>
                    <SearchableSelect
                      value={formData.orgType}
                      onChange={(val) =>
                        handleChange({
                          target: { name: "orgType", value: val },
                        })
                      }
                      options={orgTypeOptions}
                      placeholder="Select your facility type"
                      required
                    />
                  </div>

                  {/* Contact Name */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider transition-colors duration-300 text-slate-600 dark:text-slate-400">
                      Administrator Name *
                    </label>
                    <div className="relative group">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 transition-colors duration-300 text-slate-400 group-focus-within:text-rose-600 dark:text-slate-500 dark:group-focus-within:text-rose-500" />
                      <Input
                        name="contactName"
                        placeholder="e.g. Jane Doe"
                        required
                        value={formData.contactName}
                        onChange={handleChange}
                        disabled={status === "loading"}
                        className="pl-12 h-12 transition-all duration-300 focus:ring-rose-500/20"
                      />
                    </div>
                  </div>

                  {/* Contact Phone */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider transition-colors duration-300 text-slate-600 dark:text-slate-400">
                      Contact Phone Number *
                    </label>
                    <div className="relative group">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 transition-colors duration-300 text-slate-400 group-focus-within:text-rose-600 dark:text-slate-500 dark:group-focus-within:text-rose-500" />
                      <Input
                        name="contact_phone"
                        type="tel"
                        placeholder="+919876543210"
                        required
                        value={formData.contact_phone}
                        onChange={handleChange}
                        disabled={status === "loading"}
                        className="pl-12 h-12 transition-all duration-300 focus:ring-rose-500/20"
                      />
                    </div>
                  </div>

                  {/* Email */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider transition-colors duration-300 text-slate-600 dark:text-slate-400">
                      Official Email Address *
                    </label>
                    <div className="relative group">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 transition-colors duration-300 text-slate-400 group-focus-within:text-rose-600 dark:text-slate-500 dark:group-focus-within:text-rose-500" />
                      <Input
                        type="email"
                        name="email"
                        placeholder="admin@hospital.com"
                        required
                        value={formData.email}
                        onChange={handleChange}
                        disabled={status === "loading"}
                        className="pl-12 h-12 transition-all duration-300 focus:ring-rose-500/20"
                      />
                    </div>
                  </div>

                  {/* Password & Strength Meter */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider transition-colors duration-300 text-slate-600 dark:text-slate-400">
                      Account Password *
                    </label>
                    <div className="relative group">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 transition-colors duration-300 text-slate-400 group-focus-within:text-rose-600 dark:text-slate-500 dark:group-focus-within:text-rose-500" />
                      <Input
                        type={showPassword ? "text" : "password"}
                        name="password"
                        placeholder="••••••••"
                        required
                        value={formData.password}
                        onChange={handleChange}
                        disabled={status === "loading"}
                        className="pl-12 pr-12 h-12 transition-all duration-300 focus:ring-rose-500/20"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 transition-colors duration-300 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300"
                      >
                        {showPassword ? (
                          <EyeOff className="h-5 w-5" />
                        ) : (
                          <Eye className="h-5 w-5" />
                        )}
                      </button>
                    </div>

                    {/* --- Visual Password Strength Meter --- */}
                    {!formData.password ? (
                      <p className="text-xs transition-colors duration-300 text-slate-500 dark:text-slate-400">
                        Must be at least 8 characters long.
                      </p>
                    ) : (
                      <div className="space-y-1.5 pt-1">
                        <div className="flex gap-1 h-1.5 w-full">
                          {[0, 1, 2, 3].map((index) => {
                            let bgColor = "bg-slate-200 dark:bg-slate-700";
                            if (pwdResult && pwdResult.score >= index) {
                              if (pwdResult.score === 0) bgColor = "bg-red-500";
                              else if (pwdResult.score === 1)
                                bgColor = "bg-orange-500";
                              else if (pwdResult.score === 2)
                                bgColor = "bg-amber-500";
                              else if (pwdResult.score === 3)
                                bgColor = "bg-emerald-400";
                              else bgColor = "bg-emerald-600";
                            }
                            return (
                              <div
                                key={index}
                                className={`h-full flex-1 rounded-full transition-colors duration-300 ${bgColor}`}
                              />
                            );
                          })}
                        </div>
                        <div className="flex justify-between items-start text-[11px]">
                          <span
                            className={`font-bold transition-colors ${
                              pwdResult.score <= 1
                                ? "text-red-500"
                                : pwdResult.score === 2
                                  ? "text-amber-500"
                                  : "text-emerald-600 dark:text-emerald-400"
                            }`}
                          >
                            {pwdResult.score === 0 && "Very Weak"}
                            {pwdResult.score === 1 && "Weak"}
                            {pwdResult.score === 2 && "Fair"}
                            {pwdResult.score === 3 && "Good"}
                            {pwdResult.score === 4 && "Strong"}
                          </span>
                          {pwdResult.feedback.warning && (
                            <span className="text-red-500 max-w-[70%] text-right leading-tight">
                              {pwdResult.feedback.warning}
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Address Line */}
                  <div className="md:col-span-2 space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider transition-colors duration-300 text-slate-600 dark:text-slate-400">
                      Complete Street Address *
                    </label>
                    <div className="relative group">
                      <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 transition-colors duration-300 text-slate-400 group-focus-within:text-rose-600 dark:text-slate-500 dark:group-focus-within:text-rose-500" />
                      <Input
                        name="address_line"
                        placeholder="123 Health Ave, Building B"
                        required
                        value={formData.address_line}
                        onChange={handleChange}
                        disabled={status === "loading"}
                        className="pl-12 h-12 transition-all duration-300 focus:ring-rose-500/20"
                      />
                    </div>
                  </div>

                  {/* Modern Logo Upload Zone */}
                  <div className="md:col-span-2 space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider transition-colors duration-300 text-slate-600 dark:text-slate-400">
                      Organization Logo (Optional)
                    </label>
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all duration-300 relative overflow-hidden h-36 flex flex-col items-center justify-center group bg-slate-50 border-slate-300 hover:bg-slate-100 hover:border-rose-400 dark:bg-slate-950/50 dark:border-slate-700 dark:hover:bg-slate-900 dark:hover:border-rose-500/50`}
                    >
                      {logoPreview ? (
                        <>
                          <img
                            src={logoPreview}
                            alt="Logo Preview"
                            className="h-20 w-20 rounded-lg object-cover shadow-md z-10 group-hover:scale-105 transition-transform duration-300 bg-white"
                          />
                          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px] bg-white/60 dark:bg-slate-950/60 z-20">
                            <span className="text-sm font-bold flex items-center gap-2 transition-colors duration-300 text-slate-900 dark:text-white">
                              <Edit className="h-4 w-4" /> Change Image
                            </span>
                          </div>
                        </>
                      ) : (
                        <>
                          <UploadCloud className="h-8 w-8 mb-2 transition-colors duration-300 text-slate-400 group-hover:text-rose-600 dark:text-slate-500 dark:group-hover:text-rose-500" />
                          <span className="text-sm font-medium transition-colors duration-300 text-slate-600 dark:text-slate-400">
                            Click to browse or drop an image
                          </span>
                        </>
                      )}
                    </div>
                    <p className="text-xs transition-colors duration-300 text-slate-500 dark:text-slate-400">
                      Accepted formats: Square PNG or JPG. Max size: 2MB.
                    </p>
                    <input
                      type="file"
                      name="logo"
                      accept="image/*"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      disabled={status === "loading"}
                      className="hidden"
                    />
                  </div>
                </div>
              </div>

              {/* --- Location --- */}
              <div className="space-y-6 border-t pt-8 transition-colors duration-300 border-slate-200 dark:border-slate-800">
                <div>
                  <h2 className="text-sm font-bold uppercase tracking-wider flex items-center gap-2 transition-colors duration-300 text-slate-900 dark:text-white">
                    <MapPin className="h-4 w-4 transition-colors duration-300 text-emerald-600 dark:text-emerald-500" />
                    Location Information
                  </h2>
                  <p className="mt-2 text-sm transition-colors duration-300 text-slate-600 dark:text-slate-400">
                    Select the exact region where your organization operates.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider transition-colors duration-300 text-slate-600 dark:text-slate-400">
                      Country *
                    </label>
                    <SearchableSelect
                      value={formData.country_id}
                      onChange={handleCountryChange}
                      options={countries.map((c) => ({
                        label: c.name,
                        value: c.id.toString(),
                      }))}
                      placeholder="Select Country"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider transition-colors duration-300 text-slate-600 dark:text-slate-400">
                      State / Province *
                    </label>
                    <SearchableSelect
                      value={formData.state_id}
                      onChange={handleStateChange}
                      options={states.map((s) => ({
                        label: s.name,
                        value: s.id.toString(),
                      }))}
                      placeholder="Select State"
                      disabled={!formData.country_id}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider transition-colors duration-300 text-slate-600 dark:text-slate-400">
                      District / City *
                    </label>
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
                      required
                    />
                  </div>
                </div>
              </div>

              {/* --- Public Listing --- */}
              <div className="space-y-5 border-t pt-8 transition-colors duration-300 border-slate-200 dark:border-slate-800">
                <div>
                  <h2 className="text-sm font-bold uppercase tracking-wider flex items-center gap-2 transition-colors duration-300 text-slate-900 dark:text-white">
                    <Globe className="h-4 w-4 transition-colors duration-300 text-blue-600 dark:text-blue-500" />
                    Public Directory
                  </h2>
                  <p className="mt-2 text-sm transition-colors duration-300 text-slate-600 dark:text-slate-400">
                    Allow your organization to appear in public donor search
                    results.
                  </p>
                </div>

                <label className="flex items-start gap-4 p-5 rounded-2xl border transition-all duration-300 cursor-pointer bg-slate-50 border-slate-200 hover:bg-slate-100 dark:bg-slate-950/40 dark:border-slate-700 dark:hover:bg-slate-900">
                  <input
                    type="checkbox"
                    name="is_searchable"
                    checked={formData.is_searchable}
                    onChange={handleChange}
                    disabled={status === "loading"}
                    className="mt-1 h-5 w-5 rounded transition-colors duration-300 border-slate-300 bg-white text-rose-600 focus:ring-rose-500 dark:border-slate-600 dark:bg-slate-950 dark:text-rose-500"
                  />
                  <div>
                    <span className="block font-medium transition-colors duration-300 text-slate-900 dark:text-white">
                      Enable Public Visibility
                    </span>
                    <span className="block mt-1 text-sm leading-relaxed transition-colors duration-300 text-slate-600 dark:text-slate-400">
                      Your organization and available donors may appear in
                      emergency donor searches while protecting personal donor
                      information.
                    </span>
                  </div>
                </label>
              </div>

              {/* --- Privacy & Consent --- */}
              <div className="pt-2">
                <label className="flex items-start gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    name="consent_agreed"
                    required
                    checked={formData.consent_agreed}
                    onChange={handleChange}
                    disabled={status === "loading"}
                    className="mt-0.5 h-4 w-4 rounded transition-colors duration-300 border-slate-300 bg-white text-rose-600 focus:ring-rose-500 dark:border-slate-600 dark:bg-slate-950 dark:text-rose-500"
                  />
                  <span className="text-sm leading-relaxed transition-colors duration-300 text-slate-600 group-hover:text-slate-800 dark:text-slate-400 dark:group-hover:text-slate-300">
                    I acknowledge that I have read and agree to the{" "}
                    <Link
                      to="/terms-of-service"
                      className="font-semibold transition-colors duration-300 text-rose-600 hover:text-rose-700 dark:text-rose-400 dark:hover:text-rose-300 underline underline-offset-2"
                    >
                      Terms of Service
                    </Link>{" "}
                    and{" "}
                    <Link
                      to="/privacy-policy"
                      className="font-semibold transition-colors duration-300 text-rose-600 hover:text-rose-700 dark:text-rose-400 dark:hover:text-rose-300 underline underline-offset-2"
                    >
                      Privacy Policy
                    </Link>
                    , and I consent to the processing of this organization's
                    data.
                  </span>
                </label>
              </div>

              {/* Submit */}
              <div className="pt-4 border-t transition-colors duration-300 border-slate-200 dark:border-slate-800">
                <Button
                  type="submit"
                  variant="primary"
                  disabled={status === "loading" || !formData.consent_agreed}
                  className="w-full py-6 text-base font-semibold rounded-xl shadow-md hover:shadow-lg transition-all gap-2 dark:shadow-lg dark:hover:shadow-rose-500/20"
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
            <div className="mt-8 pt-6 border-t text-center transition-colors duration-300 border-slate-200 dark:border-slate-800">
              <p className="text-sm transition-colors duration-300 text-slate-600 dark:text-slate-400">
                Already have an account?{" "}
                <Link
                  to="/login"
                  className="font-semibold transition-colors duration-300 text-slate-900 hover:text-rose-600 dark:text-white dark:hover:text-rose-400"
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
