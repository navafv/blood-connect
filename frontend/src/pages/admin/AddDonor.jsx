import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  UserPlus,
  ArrowLeft,
  Loader2,
  Heart,
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

  // Auto-hydrate the form with the organization's regional lock
  useEffect(() => {
    if (initialData && !formData.country) {
      setFormData((prev) => ({
        ...prev,
        country: initialData.org.country?.toString() || "",
        state: initialData.org.state?.toString() || "",
        district: initialData.org.district?.toString() || "",
      }));
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
      toast.success("Donor record provisioned securely.");
      queryClient.invalidateQueries({ queryKey: ["tenantDonors"] });
      queryClient.invalidateQueries({ queryKey: ["tenant-dashboard-stats"] });
      navigate("/admin/donors");
    },
    onError: (err) => {
      console.error("Submission Failure:", err.response?.data);
      toast.error(
        err.response?.data?.detail ||
          "Registration failed. Please audit input fields.",
      );
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();

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
      <div className="flex flex-col items-center justify-center h-[60vh]">
        <Loader2 className="h-10 w-10 animate-spin text-rose-500 mb-4" />
        <p className="text-slate-400 font-medium tracking-widest uppercase text-sm">
          Provisioning Form Schema...
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-24">
      {/* --- Workspace Header --- */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800/80 pb-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Link to="/admin/donors">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 rounded-full hover:bg-slate-800 text-slate-400"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <h1 className="text-2xl font-bold text-white flex items-center gap-3 tracking-tight">
              <div className="p-1.5 rounded-lg bg-rose-500/10 border border-rose-500/20">
                <UserPlus className="h-5 w-5 text-rose-500" />
              </div>
              Register New Donor
            </h1>
          </div>
          <p className="text-sm text-slate-400 ml-11">
            Provision a new donor identity into your facility's active
            jurisdiction.
          </p>
        </div>
      </div>

      {/* --- Modular Form Layout --- */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Module 1: Identity & Demographics */}
        <Card className="border-slate-800/80 bg-slate-900/40 backdrop-blur-xl shadow-xl">
          <CardHeader className="border-b border-slate-800/60 pb-5">
            <CardTitle className="text-lg font-bold text-white flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20 shrink-0">
                <UserCircle className="h-5 w-5 text-blue-500" />
              </div>
              Identity & Demographics
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Full Name *
                </label>
                <Input
                  name="full_name"
                  placeholder="E.g. John Doe"
                  className="bg-slate-950/50 border-slate-700 focus:border-rose-500 h-11"
                  value={formData.full_name}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Phone Number *
                </label>
                <Input
                  name="phone_number"
                  type="tel"
                  placeholder="+91 98765 43210"
                  className="bg-slate-950/50 border-slate-700 focus:border-rose-500 font-mono h-11"
                  value={formData.phone_number}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Date of Birth *
                </label>
                <Input
                  name="date_of_birth"
                  type="date"
                  className="bg-slate-950/50 border-slate-700 focus:border-rose-500 h-11"
                  value={formData.date_of_birth}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Biological Gender *
                </label>
                <Select
                  name="gender"
                  className="bg-slate-950/50 border-slate-700 focus:border-rose-500 h-11"
                  value={formData.gender}
                  onChange={handleChange}
                  required
                >
                  <option value="M">Male (90-day cycle)</option>
                  <option value="F">Female (120-day cycle)</option>
                  <option value="O">Other</option>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Module 2: Medical Context */}
        <Card className="border-slate-800/80 bg-slate-900/40 backdrop-blur-xl shadow-xl">
          <CardHeader className="border-b border-slate-800/60 pb-5">
            <CardTitle className="text-lg font-bold text-white flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 shrink-0">
                <Activity className="h-5 w-5 text-emerald-500" />
              </div>
              Medical Context
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Blood Group *
                </label>
                <Select
                  name="blood_group"
                  className="bg-slate-950/50 border-slate-700 focus:border-rose-500 h-11"
                  value={formData.blood_group}
                  onChange={handleChange}
                  required
                >
                  <option value="" disabled>
                    Select Confirmed Group
                  </option>
                  {BLOOD_GROUPS.map((bg) => (
                    <option key={bg} value={bg}>
                      {bg}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Last Donation Date
                </label>
                <Input
                  name="last_donation_date"
                  type="date"
                  className="bg-slate-950/50 border-slate-700 focus:border-rose-500 h-11"
                  value={formData.last_donation_date}
                  onChange={handleChange}
                />
              </div>
            </div>

            {/* Deferral Sub-Module */}
            <div className="p-5 rounded-2xl border border-amber-500/20 bg-amber-500/5 shadow-inner">
              <label className="flex items-start gap-4 cursor-pointer group">
                <div className="mt-1">
                  <input
                    type="checkbox"
                    name="is_permanently_deferred"
                    className="h-5 w-5 rounded border-slate-600 bg-slate-950 text-amber-500 focus:ring-amber-500 focus:ring-offset-slate-900 transition-all cursor-pointer"
                    checked={formData.is_permanently_deferred}
                    onChange={handleChange}
                  />
                </div>
                <div className="flex-1">
                  <span className="text-sm font-bold text-amber-500 flex items-center gap-2 mb-1 group-hover:text-amber-400 transition-colors">
                    <ShieldAlert className="h-4 w-4" /> Permanent Medical
                    Deferral
                  </span>
                  <p className="text-xs text-slate-400 leading-relaxed max-w-2xl">
                    Mark this donor as medically ineligible. They will remain in
                    your system for internal auditing but will be permanently
                    hidden from the public emergency directory.
                  </p>
                </div>
              </label>

              {formData.is_permanently_deferred && (
                <div className="mt-4 pt-4 border-t border-amber-500/10 animate-in fade-in slide-in-from-top-2 duration-300">
                  <label className="text-xs font-bold uppercase tracking-wider text-amber-500/70 mb-2 block">
                    Clinical Deferral Reason *
                  </label>
                  <textarea
                    name="deferral_reason"
                    placeholder="E.g., Chronic heart condition, infectious disease protocol..."
                    className="w-full min-h-25 rounded-xl border border-amber-500/20 bg-slate-950/50 px-4 py-3 text-sm text-slate-200 placeholder-slate-500 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500/30 transition-all resize-none shadow-inner"
                    value={formData.deferral_reason}
                    onChange={handleChange}
                    required={formData.is_permanently_deferred}
                  />
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Module 3: Geographic Jurisdiction */}
        <Card className="border-slate-800/80 bg-slate-900/40 backdrop-blur-xl shadow-xl overflow-visible">
          <CardHeader className="border-b border-slate-800/60 pb-5">
            <CardTitle className="text-lg font-bold text-white flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20 shrink-0">
                <MapPin className="h-5 w-5 text-amber-500" />
              </div>
              Location Binding
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <p className="text-xs text-slate-400 mb-4 font-medium uppercase tracking-wider">
              Defaults to your organization's registered region.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <SearchableSelect
                placeholder="Country"
                className="bg-slate-950/50 h-11"
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
              <SearchableSelect
                placeholder="State/Province"
                className="bg-slate-950/50 h-11"
                value={formData.state}
                options={states.map((s) => ({
                  label: s.name,
                  value: s.id.toString(),
                }))}
                onChange={handleStateChange}
                disabled={!formData.country}
                required
              />
              <SearchableSelect
                placeholder="District/City"
                className="bg-slate-950/50 h-11"
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
          </CardContent>
        </Card>

        {/* Module 4: Authorization & Submission */}
        <Card className="border-rose-500/20 bg-slate-900/60 backdrop-blur-xl shadow-2xl relative overflow-hidden">
          <div
            className="absolute inset-0 bg-linear-to-r from-rose-500/5 to-transparent pointer-events-none"
            aria-hidden="true"
          />
          <CardContent className="p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
            <label className="flex items-center gap-4 cursor-pointer group flex-1">
              <input
                name="has_consented"
                type="checkbox"
                checked={formData.has_consented}
                onChange={handleChange}
                className="h-6 w-6 rounded border-slate-600 bg-slate-950 text-rose-500 focus:ring-rose-500 transition-all cursor-pointer"
                required
              />
              <div>
                <span className="text-base font-bold text-white flex items-center gap-2 group-hover:text-rose-100 transition-colors">
                  <ClipboardCheck className="h-5 w-5 text-emerald-500" />{" "}
                  Explicit Consent Verified
                </span>
                <p className="text-xs text-slate-400 mt-1 max-w-lg">
                  I legally attest that this individual has authorized our
                  organization to store their medical data and surface their
                  masked contact information for emergency donation requests.
                </p>
              </div>
            </label>

            <Button
              type="submit"
              variant="primary"
              className="w-full md:w-auto min-w-50 h-14 text-base font-bold shadow-[0_0_20px_rgba(225,29,72,0.2)] hover:shadow-[0_0_30px_rgba(225,29,72,0.4)] transition-all"
              disabled={createMutation.isPending}
            >
              {createMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />{" "}
                  Provisioning...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-5 w-5" /> Commit Record
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
