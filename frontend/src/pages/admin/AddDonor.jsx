import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  UserPlus,
  ArrowLeft,
  Loader2,
  Activity,
  MapPin,
  ClipboardCheck,
  Save,
  UserCircle,
  ShieldAlert,
} from "lucide-react";
import toast from "react-hot-toast";

import { Button } from "../../components/ui/Button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../components/ui/Card";
import { Input } from "../../components/ui/Input";
import { Select } from "../../components/ui/Select";
import { SearchableSelect } from "../../components/ui/SearchableSelect";
import api from "../../lib/axios";

const BLOOD_GROUPS = [
  "A+",
  "A-",
  "A1+",
  "A1-",
  "A1B+",
  "A1B-",
  "A2+",
  "A2-",
  "A2B+",
  "A2B-",
  "AB+",
  "AB-",
  "B+",
  "B-",
  "BBG",
  "INRA",
  "O+",
  "O-",
];

export default function AddDonor() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // --- Geographic Hierarchy State ---
  const [states, setStates] = useState([]);
  const [districts, setDistricts] = useState([]);

  // --- Form Payload State ---
  const [formData, setFormData] = useState({
    full_name: "",
    phone_number: "",
    date_of_birth: "",
    gender: "M",
    blood_group: "",
    last_donation_date: "",
    is_permanently_deferred: false,
    deferral_reason: "",
    country: "",
    state: "",
    district: "",
    has_consented: false,
  });

  const [fieldErrors, setFieldErrors] = useState({});

  // --- Pipeline 1: Initialize Base Geographic & Tenant Data ---
  const { data: initialData, isLoading: isLoadingGeo } = useQuery({
    queryKey: ["addDonorContext"],
    queryFn: async () => {
      const [orgRes, countriesRes] = await Promise.all([
        api.get("/tenant/organization/"),
        api.get("/locations/countries/"),
      ]);
      return { org: orgRes.data, countries: countriesRes.data };
    },
    staleTime: Infinity,
  });

  // Auto-hydrate the form AND fetch the dependent dropdown options
  useEffect(() => {
    if (initialData && !formData.country) {
      const org = initialData.org;

      setFormData((prev) => ({
        ...prev,
        country: org.country?.toString() || "",
        state: org.state?.toString() || "",
        district: org.district?.toString() || "",
      }));

      if (org.country) {
        api
          .get(`/locations/states/?country=${org.country}`)
          .then((res) => setStates(res.data))
          .catch(() => toast.error("Failed to hydrate states."));
      }
      if (org.state) {
        api
          .get(`/locations/districts/?state=${org.state}`)
          .then((res) => setDistricts(res.data))
          .catch(() => toast.error("Failed to hydrate districts."));
      }
    }
  }, [initialData]);

  // --- Pipeline 2: Cascading Dropdown Handlers ---
  const handleCountryChange = async (val) => {
    setFormData((prev) => ({ ...prev, country: val, state: "", district: "" }));
    setStates([]);
    setDistricts([]);
    if (val) {
      try {
        const res = await api.get(`/locations/states/?country=${val}`);
        setStates(res.data);
      } catch (err) {
        toast.error("Failed to load regional boundaries.");
      }
    }
  };

  const handleStateChange = async (val) => {
    setFormData((prev) => ({ ...prev, state: val, district: "" }));
    setDistricts([]);
    if (val) {
      try {
        const res = await api.get(`/locations/districts/?state=${val}`);
        setDistricts(res.data);
      } catch (err) {
        toast.error("Failed to load local districts.");
      }
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // --- Pipeline 3: Mutation Engine ---
  const createMutation = useMutation({
    mutationFn: async (payload) => {
      const response = await api.post("/tenant/donors/", payload);
      return response.data;
    },
    onSuccess: () => {
      setFieldErrors({});
      toast.success("Donor registered successfully.");
      queryClient.invalidateQueries({ queryKey: ["tenantDonors"] });
      queryClient.invalidateQueries({ queryKey: ["tenant-dashboard-stats"] });
      navigate("/admin/donors");
    },
    onError: (err) => {
      if (
        err.response?.status === 400 &&
        typeof err.response.data === "object"
      ) {
        setFieldErrors(err.response.data);
        toast.error("Validation failed. Please check the highlighted fields.");
      } else {
        toast.error(
          err.response?.data?.detail ||
            "Registration failed due to a server error.",
        );
      }
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    setFieldErrors({});

    if (!formData.country || !formData.state || !formData.district) {
      toast.error("Geographic jurisdiction is required.");
      return;
    }
    if (!formData.has_consented) {
      toast.error("Donor consent verification is mandatory.");
      return;
    }

    const payload = {
      ...formData,
      last_donation_date: formData.last_donation_date || null,
    };

    createMutation.mutate(payload);
  };

  if (isLoadingGeo) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] transition-colors duration-300">
        <Loader2 className="h-10 w-10 animate-spin text-rose-600 dark:text-rose-500 mb-4 transition-colors duration-300" />
        <p className="text-slate-500 dark:text-slate-400 font-medium tracking-widest uppercase text-sm transition-colors duration-300">
          Provisioning Form Schema...
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-24 transition-colors">
      {/* --- Workspace Header --- */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b pb-6 relative z-10 transition-colors duration-300 border-slate-200 dark:border-slate-800/80">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Link to="/admin/donors">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 rounded-full transition-colors duration-300 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <h1 className="text-2xl font-bold flex items-center gap-3 tracking-tight transition-colors duration-300 text-slate-900 dark:text-white">
              <div className="p-1.5 rounded-lg border shadow-inner transition-colors duration-300 bg-rose-50 border-rose-200 dark:bg-rose-500/10 dark:border-rose-500/20">
                <UserPlus className="h-5 w-5 transition-colors duration-300 text-rose-600 dark:text-rose-500" />
              </div>
              Register New Donor
            </h1>
          </div>
          <p className="text-sm ml-11 transition-colors duration-300 text-slate-600 dark:text-slate-400">
            Register a new blood donor to your facility's active directory.
          </p>
        </div>
      </div>

      {/* --- Modular Two-Column Layout --- */}
      <form
        onSubmit={handleSubmit}
        className="grid grid-cols-1 lg:grid-cols-3 gap-6"
      >
        {/* LEFT COLUMN: Identity & Location (HIGHER Z-INDEX TO OVERLAP RIGHT COLUMN ON MOBILE) */}
        <div className="lg:col-span-2 space-y-6 relative z-30">
          {/* Module 1: Identity & Demographics */}
          <Card className="backdrop-blur-xl shadow-lg relative z-20 transition-colors duration-300 bg-white/60 border-slate-200 dark:bg-slate-900/40 dark:border-slate-800/80 dark:shadow-xl">
            <CardHeader className="border-b pb-4 transition-colors duration-300 border-slate-200 dark:border-slate-800/60">
              <CardTitle className="text-lg font-bold flex items-center gap-3 transition-colors duration-300 text-slate-900 dark:text-white">
                <div className="h-10 w-10 rounded-xl flex items-center justify-center border shrink-0 transition-colors duration-300 bg-blue-50 border-blue-200 dark:bg-blue-500/10 dark:border-blue-500/20">
                  <UserCircle className="h-5 w-5 transition-colors duration-300 text-blue-600 dark:text-blue-500" />
                </div>
                Identity & Demographics
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2 sm:col-span-2">
                  <label
                    className={`text-xs font-bold uppercase tracking-wider transition-colors duration-300 ${fieldErrors.full_name ? "text-red-600 dark:text-red-400" : "text-slate-600 dark:text-slate-400"}`}
                  >
                    Full Name *
                  </label>
                  <Input
                    name="full_name"
                    placeholder="E.g. John Doe"
                    className={`h-11 transition-all duration-300 ${fieldErrors.full_name ? "border-red-500 focus:border-red-500 focus:ring-red-500/30" : "focus:border-rose-500 focus:ring-rose-500/20"}`}
                    value={formData.full_name}
                    onChange={handleChange}
                    required
                    autoFocus
                  />
                  {fieldErrors.full_name && (
                    <p className="text-xs mt-1 transition-colors duration-300 text-red-600 dark:text-red-400">
                      {fieldErrors.full_name[0]}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <label
                    className={`text-xs font-bold uppercase tracking-wider transition-colors duration-300 ${fieldErrors.phone_number ? "text-red-600 dark:text-red-400" : "text-slate-600 dark:text-slate-400"}`}
                  >
                    Phone Number *
                  </label>
                  <Input
                    name="phone_number"
                    type="tel"
                    placeholder="+919876543210"
                    className={`font-mono h-11 transition-all duration-300 ${fieldErrors.phone_number ? "border-red-500 focus:border-red-500 focus:ring-red-500/30" : "focus:border-rose-500 focus:ring-rose-500/20"}`}
                    value={formData.phone_number}
                    onChange={handleChange}
                    required
                  />
                  {fieldErrors.phone_number && (
                    <p className="text-xs mt-1 transition-colors duration-300 text-red-600 dark:text-red-400">
                      {fieldErrors.phone_number[0]}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <label
                    className={`text-xs font-bold uppercase tracking-wider transition-colors duration-300 ${fieldErrors.date_of_birth ? "text-red-600 dark:text-red-400" : "text-slate-600 dark:text-slate-400"}`}
                  >
                    Date of Birth *
                  </label>
                  <Input
                    name="date_of_birth"
                    type="date"
                    className={`h-11 transition-all duration-300 ${fieldErrors.date_of_birth ? "border-red-500 focus:border-red-500 focus:ring-red-500/30" : "focus:border-rose-500 focus:ring-rose-500/20"}`}
                    value={formData.date_of_birth}
                    onChange={handleChange}
                    max={new Date().toISOString().split("T")[0]}
                    required
                  />
                  {fieldErrors.date_of_birth && (
                    <p className="text-xs mt-1 transition-colors duration-300 text-red-600 dark:text-red-400">
                      {fieldErrors.date_of_birth[0]}
                    </p>
                  )}
                </div>

                <div className="space-y-2 sm:col-span-2">
                  <label
                    className={`text-xs font-bold uppercase tracking-wider transition-colors duration-300 ${fieldErrors.gender ? "text-red-600 dark:text-red-400" : "text-slate-600 dark:text-slate-400"}`}
                  >
                    Biological Gender *
                  </label>
                  <Select
                    name="gender"
                    className={`h-11 transition-all duration-300 ${fieldErrors.gender ? "border-red-500 focus:border-red-500 focus:ring-red-500/30 text-red-600 dark:text-red-100" : "focus:border-rose-500 focus:ring-rose-500/20"}`}
                    value={formData.gender}
                    onChange={handleChange}
                    required
                  >
                    <option value="M">Male (90-day cycle)</option>
                    <option value="F">Female (120-day cycle)</option>
                    <option value="O">Other (120-day cycle)</option>
                  </Select>
                  {fieldErrors.gender && (
                    <p className="text-xs mt-1 transition-colors duration-300 text-red-600 dark:text-red-400">
                      {fieldErrors.gender[0]}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Module 2: Geographic Jurisdiction */}
          <Card className="backdrop-blur-xl shadow-lg overflow-visible relative z-30 transition-colors duration-300 bg-white/60 border-slate-200 dark:bg-slate-900/40 dark:border-slate-800/80 dark:shadow-xl">
            <CardHeader className="border-b pb-4 transition-colors duration-300 border-slate-200 dark:border-slate-800/60">
              <CardTitle className="text-lg font-bold flex items-center gap-3 transition-colors duration-300 text-slate-900 dark:text-white">
                <div className="h-10 w-10 rounded-xl flex items-center justify-center border shrink-0 transition-colors duration-300 bg-amber-50 border-amber-200 dark:bg-amber-500/10 dark:border-amber-500/20">
                  <MapPin className="h-5 w-5 transition-colors duration-300 text-amber-600 dark:text-amber-500" />
                </div>
                Donor Location
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <p className="text-xs mb-5 font-medium uppercase tracking-wider transition-colors duration-300 text-slate-500 dark:text-slate-400">
                Defaults to your organization's registered region.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="space-y-2">
                  <SearchableSelect
                    placeholder="Country *"
                    className={`h-11 transition-all duration-300 ${fieldErrors.country ? "border-red-500 focus:border-red-500" : ""}`}
                    value={formData.country}
                    options={
                      initialData?.countries?.map((c) => ({
                        label: c.name,
                        value: c.id.toString(),
                      })) || []
                    }
                    onChange={handleCountryChange}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <SearchableSelect
                    placeholder="State/Province *"
                    className={`h-11 transition-all duration-300 ${fieldErrors.state ? "border-red-500 focus:border-red-500" : ""}`}
                    value={formData.state}
                    options={states.map((s) => ({
                      label: s.name,
                      value: s.id.toString(),
                    }))}
                    onChange={handleStateChange}
                    disabled={!formData.country}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <SearchableSelect
                    placeholder="District/City *"
                    className={`h-11 transition-all duration-300 ${fieldErrors.district ? "border-red-500 focus:border-red-500" : ""}`}
                    value={formData.district}
                    options={districts.map((d) => ({
                      label: d.name,
                      value: d.id.toString(),
                    }))}
                    onChange={(val) =>
                      handleChange({ target: { name: "district", value: val } })
                    }
                    disabled={!formData.state}
                    required
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* RIGHT COLUMN: Medical & Submission (LOWER Z-INDEX SO LEFT COLUMN DROPDOWNS OVERLAP IT) */}
        <div className="lg:col-span-1 space-y-6 relative z-10">
          {/* Module 3: Medical Context */}
          <Card className="backdrop-blur-xl shadow-lg relative z-10 transition-colors duration-300 bg-white/60 border-slate-200 dark:bg-slate-900/40 dark:border-slate-800/80 dark:shadow-xl">
            <CardHeader className="border-b pb-4 transition-colors duration-300 border-slate-200 dark:border-slate-800/60">
              <CardTitle className="text-lg font-bold flex items-center gap-3 transition-colors duration-300 text-slate-900 dark:text-white">
                <div className="h-10 w-10 rounded-xl flex items-center justify-center border shrink-0 transition-colors duration-300 bg-emerald-50 border-emerald-200 dark:bg-emerald-500/10 dark:border-emerald-500/20">
                  <Activity className="h-5 w-5 transition-colors duration-300 text-emerald-600 dark:text-emerald-500" />
                </div>
                Medical Status
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="space-y-2">
                <label
                  className={`text-xs font-bold uppercase tracking-wider transition-colors duration-300 ${fieldErrors.blood_group ? "text-red-600 dark:text-red-400" : "text-slate-600 dark:text-slate-400"}`}
                >
                  Blood Group *
                </label>
                <Select
                  name="blood_group"
                  className={`h-11 transition-all duration-300 ${fieldErrors.blood_group ? "border-red-500 text-red-600 dark:text-red-100" : "focus:border-rose-500"}`}
                  value={formData.blood_group}
                  onChange={handleChange}
                  required
                >
                  <option value="" disabled>
                    Select Group
                  </option>
                  {BLOOD_GROUPS.map((bg) => (
                    <option key={bg} value={bg}>
                      {bg}
                    </option>
                  ))}
                </Select>
                {fieldErrors.blood_group && (
                  <p className="text-xs mt-1 transition-colors duration-300 text-red-600 dark:text-red-400">
                    {fieldErrors.blood_group[0]}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label
                  className={`text-xs font-bold uppercase tracking-wider transition-colors duration-300 ${fieldErrors.last_donation_date ? "text-red-600 dark:text-red-400" : "text-slate-600 dark:text-slate-400"}`}
                >
                  Last Donation Date
                </label>
                <Input
                  name="last_donation_date"
                  type="date"
                  className={`h-11 transition-all duration-300 ${fieldErrors.last_donation_date ? "border-red-500" : "focus:border-rose-500"}`}
                  value={formData.last_donation_date}
                  max={new Date().toISOString().split("T")[0]}
                  onChange={handleChange}
                />
              </div>

              <div className="pt-4 border-t transition-colors duration-300 border-slate-200 dark:border-slate-800/60">
                <label className="flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-colors duration-300 bg-amber-50 border-amber-200 hover:bg-amber-100 dark:bg-amber-500/5 dark:border-amber-500/20 dark:hover:bg-amber-500/10">
                  <input
                    type="checkbox"
                    name="is_permanently_deferred"
                    className="mt-0.5 h-4 w-4 rounded transition-colors duration-300 cursor-pointer border-slate-300 bg-white text-amber-600 focus:ring-amber-500 dark:border-slate-600 dark:bg-slate-950 dark:text-amber-500 dark:focus:ring-offset-slate-900"
                    checked={formData.is_permanently_deferred}
                    onChange={handleChange}
                  />
                  <div className="flex-1">
                    <span className="text-sm font-bold flex items-center gap-2 mb-1 transition-colors duration-300 text-amber-700 dark:text-amber-500">
                      <ShieldAlert className="h-4 w-4" /> Medical Deferral
                    </span>
                    <p className="text-xs leading-relaxed transition-colors duration-300 text-slate-600 dark:text-slate-400">
                      Mark as medically ineligible. They will be hidden from the
                      public emergency directory.
                    </p>
                  </div>
                </label>

                {formData.is_permanently_deferred && (
                  <div className="mt-4 animate-in fade-in slide-in-from-top-2 duration-300">
                    <textarea
                      name="deferral_reason"
                      placeholder="Required: Deferral Reason (e.g. Chronic condition)..."
                      className={`w-full min-h-25 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-1 transition-all duration-300 resize-none shadow-inner ${fieldErrors.deferral_reason ? "border bg-white border-red-500 dark:border-red-500/80 dark:bg-slate-950/50" : "bg-white border text-slate-900 border-amber-200 focus:border-amber-500 dark:border-amber-500/20 dark:bg-slate-950/50 dark:focus:border-amber-500 dark:text-slate-200"}`}
                      value={formData.deferral_reason}
                      onChange={handleChange}
                      required={formData.is_permanently_deferred}
                    />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Module 4: Authorization & Submission */}
          <Card className="backdrop-blur-xl shadow-lg relative overflow-hidden z-10 transition-colors duration-300 bg-white/80 border-rose-200 dark:bg-slate-900/80 dark:border-rose-500/30 dark:shadow-2xl">
            <div className="absolute inset-0 bg-linear-to-br pointer-events-none transition-colors duration-300 from-rose-100 to-transparent dark:from-rose-500/10" />
            <CardContent className="p-6 relative z-10 flex flex-col gap-6">
              <label className="flex items-start gap-3 cursor-pointer group">
                <input
                  name="has_consented"
                  type="checkbox"
                  checked={formData.has_consented}
                  onChange={handleChange}
                  className={`mt-1 h-5 w-5 rounded transition-all cursor-pointer bg-white dark:bg-slate-950 ${fieldErrors.has_consented ? "border-red-500 text-red-600 focus:ring-red-500 dark:text-red-500" : "border-slate-300 text-emerald-600 focus:ring-emerald-500 dark:border-slate-600 dark:text-emerald-500"}`}
                  required
                />
                <div>
                  <span
                    className={`text-sm font-bold flex items-center gap-2 transition-colors ${fieldErrors.has_consented ? "text-red-600 dark:text-red-400" : "text-slate-900 group-hover:text-rose-600 dark:text-white dark:group-hover:text-rose-100"}`}
                  >
                    <ClipboardCheck
                      className={`h-4 w-4 ${fieldErrors.has_consented ? "text-red-600 dark:text-red-500" : "text-emerald-600 dark:text-emerald-500"}`}
                    />
                    Explicit Consent Verified
                  </span>
                  <p className="text-xs mt-1.5 leading-relaxed transition-colors duration-300 text-slate-600 dark:text-slate-400">
                    I attest that this individual has authorized our facility to
                    store their medical data and surface their masked contact
                    information to the public.
                  </p>
                </div>
              </label>

              <Button
                type="submit"
                variant="primary"
                className="w-full h-14 text-base font-bold shadow-md hover:shadow-lg transition-all dark:shadow-[0_0_20px_rgba(225,29,72,0.2)] dark:hover:shadow-[0_0_30px_rgba(225,29,72,0.4)]"
                disabled={createMutation.isPending}
              >
                {createMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />{" "}
                    Registering...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-5 w-5" /> Save Donor Record
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      </form>
    </div>
  );
}
