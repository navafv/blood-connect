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
} from "lucide-react";
import toast from "react-hot-toast";

import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { SearchableSelect } from "../../components/ui/SearchableSelect";
import api from "../../lib/axios";

/**
 * Tenant Onboarding Boundary
 * Facilitates the registration of new healthcare organizations (Hospitals, NGOs).
 * Captures institutional identity, administrative credentials, and enforces
 * strict geographical boundaries for downstream donor management.
 */
export default function RegisterOrg() {
  const navigate = useNavigate();

  // --- UI Transition State ---
  const [status, setStatus] = useState("idle"); // 'idle' | 'loading' | 'success'
  const [showPassword, setShowPassword] = useState(false);

  // --- Geographic Master Data State ---
  const [countries, setCountries] = useState([]);
  const [states, setStates] = useState([]);
  const [districts, setDistricts] = useState([]);

  // --- Payload State ---
  const [formData, setFormData] = useState({
    orgName: "",
    orgType: "HOSPITAL",
    contactName: "",
    email: "",
    password: "",
    country_id: "",
    state_id: "",
    district_id: "",
    is_searchable: true,
  });

  /**
   * Initializes the geographic hierarchy by fetching whitelisted root nodes (Countries).
   */
  useEffect(() => {
    const fetchCountries = async () => {
      try {
        const response = await api.get("/locations/countries/");
        setCountries(response.data);
      } catch (err) {
        console.error("Geographic initialization failed:", err);
        toast.error("Failed to load regional data. Please refresh the page.");
      }
    };
    fetchCountries();
  }, []);

  // --- Cascading Geographic Handlers ---
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
        toast.error("Failed to fetch state boundaries.");
      }
    }
  };

  const handleStateChange = async (val) => {
    setFormData({ ...formData, state_id: val, district_id: "" });
    setDistricts([]);

    if (val) {
      try {
        const response = await api.get(`/locations/districts/?state=${val}`);
        setDistricts(response.data);
      } catch (err) {
        toast.error("Failed to fetch district boundaries.");
      }
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  /**
   * Tenant Provisioning Dispatch
   * Transmits the onboarding payload to the backend. Upon success, routes the user
   * to the email verification gate to confirm administrative control of the provided domain.
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus("loading");

    try {
      await api.post("/auth/register/", formData);

      setStatus("success");
      toast.success("Organization provisioned successfully.");

      // Delay routing to allow success state animation to complete
      setTimeout(() => {
        navigate("/verify-email", { state: { email: formData.email } });
      }, 2500);
    } catch (err) {
      console.error("Provisioning Failure:", err);
      setStatus("idle");
      toast.error(
        err.response?.data?.error ||
          err.response?.data?.detail ||
          "Registration failed. Please verify your inputs and try again.",
      );
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* --- Ambient Environmental Glows --- */}
      <div
        className="absolute top-[-10%] right-[-5%] w-125 h-125 bg-rose-600/15 rounded-full blur-[120px] pointer-events-none"
        aria-hidden="true"
      />
      <div
        className="absolute bottom-[-10%] left-[-5%] w-125 h-125 bg-blue-600/10 rounded-full blur-[120px] pointer-events-none"
        aria-hidden="true"
      />

      {/* --- Brand Header --- */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
        <div className="flex justify-center">
          <Link
            to="/"
            className="flex items-center gap-3 text-rose-500 hover:text-rose-400 transition-colors group"
          >
            <div className="h-12 w-12 rounded-xl bg-slate-900 flex items-center justify-center border border-slate-800 shadow-lg group-hover:border-rose-500/30 transition-all duration-300">
              <Droplet className="h-7 w-7 fill-current drop-shadow-[0_0_8px_rgba(225,29,72,0.5)]" />
            </div>
            <span className="text-3xl font-extrabold text-white tracking-tight">
              BloodConnect
            </span>
          </Link>
        </div>
        <h2 className="mt-8 text-center text-2xl font-bold leading-9 tracking-tight text-white">
          Register your Organization
        </h2>
        <p className="mt-2 text-center text-sm text-slate-400">
          Provision a secure workspace to manage your local donor registry.
        </p>
      </div>

      {/* --- Registration Form Console --- */}
      <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-150 relative z-10 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-100 mb-10">
        <div className="bg-slate-900/60 backdrop-blur-xl px-6 py-10 shadow-2xl sm:rounded-3xl sm:px-10 border border-slate-800/80">
          {status === "success" ? (
            /* Success State */
            <div className="text-center animate-in fade-in zoom-in duration-500 py-12">
              <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-emerald-500/10 border border-emerald-500/20 mb-6 relative">
                <div className="absolute inset-0 bg-emerald-500/20 rounded-full blur-md animate-pulse" />
                <CheckCircle2 className="h-12 w-12 text-emerald-500 relative z-10" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-3 tracking-tight">
                Registration Successful!
              </h3>
              <p className="text-slate-400 text-base mb-8 max-w-sm mx-auto leading-relaxed">
                Your workspace has been provisioned. Redirecting you to the
                security gateway to verify your email address...
              </p>
              <Loader2 className="h-8 w-8 text-rose-500 animate-spin mx-auto" />
            </div>
          ) : (
            /* Form State */
            <form className="space-y-8" onSubmit={handleSubmit}>
              {/* 1. Identity Matrix */}
              <div className="space-y-5 pb-8 border-b border-slate-800/80">
                <h3 className="text-sm font-bold uppercase tracking-wider text-white flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-rose-500" /> 1.
                  Institutional Identity
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="sm:col-span-2 relative group">
                    <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500 group-focus-within:text-rose-500 transition-colors" />
                    <Input
                      name="orgName"
                      placeholder="Official Organization Name"
                      className="pl-12 bg-slate-950/50 border-slate-700 focus:border-rose-500 focus:ring-rose-500/20 h-12 transition-all"
                      required
                      value={formData.orgName}
                      onChange={handleChange}
                      disabled={status === "loading"}
                    />
                  </div>

                  <div className="sm:col-span-2 relative group">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500 group-focus-within:text-rose-500 transition-colors" />
                    <Input
                      name="contactName"
                      placeholder="Primary Administrator Name"
                      className="pl-12 bg-slate-950/50 border-slate-700 focus:border-rose-500 focus:ring-rose-500/20 h-12 transition-all"
                      required
                      value={formData.contactName}
                      onChange={handleChange}
                      disabled={status === "loading"}
                    />
                  </div>

                  <div className="relative group">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500 group-focus-within:text-rose-500 transition-colors" />
                    <Input
                      name="email"
                      type="email"
                      placeholder="Official Email"
                      className="pl-12 bg-slate-950/50 border-slate-700 focus:border-rose-500 focus:ring-rose-500/20 h-12 transition-all"
                      required
                      value={formData.email}
                      onChange={handleChange}
                      disabled={status === "loading"}
                    />
                  </div>

                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500 group-focus-within:text-rose-500 transition-colors" />
                    <Input
                      name="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Secure Password"
                      className="pl-12 pr-12 bg-slate-950/50 border-slate-700 focus:border-rose-500 focus:ring-rose-500/20 h-12 transition-all"
                      required
                      value={formData.password}
                      onChange={handleChange}
                      disabled={status === "loading"}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 focus:outline-none transition-colors"
                      tabIndex="-1"
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* 2. Geographic Constraints */}
              <div className="space-y-5 pb-8 border-b border-slate-800/80 relative z-30">
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-white flex items-center gap-2 mb-1">
                    <MapPin className="h-4 w-4 text-emerald-500" /> 2.
                    Operational Jurisdiction
                  </h3>
                  <p className="text-xs text-slate-500">
                    Your registry will be geographically locked to this specific
                    administrative region.
                  </p>
                </div>

                <div className="relative z-30">
                  <SearchableSelect
                    value={formData.country_id}
                    onChange={handleCountryChange}
                    options={countries.map((c) => ({
                      label: c.name,
                      value: c.id.toString(),
                    }))}
                    placeholder="Select Sovereign Nation"
                    className="bg-slate-950/50"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="relative z-20">
                    <SearchableSelect
                      value={formData.state_id}
                      onChange={handleStateChange}
                      options={states.map((s) => ({
                        label: s.name,
                        value: s.id.toString(),
                      }))}
                      placeholder="Select State/Province"
                      disabled={!formData.country_id}
                      className="bg-slate-950/50"
                      required
                    />
                  </div>

                  <div className="relative z-10">
                    <SearchableSelect
                      value={formData.district_id}
                      onChange={(val) =>
                        handleChange({
                          target: { name: "district_id", value: val },
                        })
                      }
                      options={districts.map((d) => ({
                        label: d.name,
                        value: d.id.toString(),
                      }))}
                      placeholder="Select District/City"
                      disabled={!formData.state_id}
                      className="bg-slate-950/50"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* 3. Global Directory Preference */}
              <div className="space-y-5">
                <h3 className="text-sm font-bold uppercase tracking-wider text-white flex items-center gap-2">
                  <Globe className="h-4 w-4 text-blue-500" /> 3. Directory
                  Integration
                </h3>

                <label className="flex items-start gap-4 p-5 rounded-2xl border border-slate-700 bg-slate-900/50 cursor-pointer hover:bg-slate-800/80 transition-all shadow-inner group">
                  <div className="flex h-6 items-center shrink-0 mt-0.5">
                    <input
                      id="is_searchable"
                      name="is_searchable"
                      type="checkbox"
                      checked={formData.is_searchable}
                      onChange={handleChange}
                      className="h-5 w-5 rounded border-slate-600 bg-slate-950 text-rose-500 focus:ring-rose-500 focus:ring-offset-slate-900 transition-all cursor-pointer"
                      disabled={status === "loading"}
                    />
                  </div>
                  <div className="text-sm leading-relaxed">
                    <span className="font-semibold text-white block mb-1 group-hover:text-rose-100 transition-colors">
                      Enable Public Discoverability
                    </span>
                    <span className="text-slate-400 text-xs sm:text-sm block">
                      Permit the routing engine to surface your facility's
                      eligible donors during public emergency queries. Personal
                      donor identifiers remain{" "}
                      <strong className="text-slate-300">
                        strictly encrypted and masked
                      </strong>
                      .
                    </span>
                  </div>
                </label>
              </div>

              {/* Submission Matrix */}
              <div className="pt-4">
                <Button
                  type="submit"
                  variant="primary"
                  className="w-full flex justify-center items-center py-6 text-base font-semibold shadow-lg hover:shadow-rose-500/20 transition-all rounded-xl gap-2"
                  disabled={status === "loading"}
                >
                  {status === "loading" ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Provisioning Workspace...
                    </>
                  ) : (
                    <>
                      Submit Registration
                      <ArrowRight className="h-5 w-5" />
                    </>
                  )}
                </Button>
              </div>
            </form>
          )}

          {/* Alternate Routing */}
          {status !== "success" && (
            <div className="mt-8 text-center text-sm text-slate-400 border-t border-slate-800/80 pt-6">
              Already possess an administrative account?{" "}
              <Link
                to="/login"
                className="font-semibold leading-6 text-white hover:text-rose-400 transition-colors"
              >
                Sign in securely
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
