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
} from "lucide-react";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { SearchableSelect } from "../../components/ui/SearchableSelect";
import api from "../../lib/axios";

export default function RegisterOrg() {
  const navigate = useNavigate();
  const [status, setStatus] = useState("idle"); // 'idle' | 'loading' | 'success'
  const [error, setError] = useState("");

  // Geographic State
  const [countries, setCountries] = useState([]);
  const [states, setStates] = useState([]);
  const [districts, setDistricts] = useState([]);

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

  // 1. Fetch Whitelisted Countries on Load
  useEffect(() => {
    const fetchCountries = async () => {
      try {
        const response = await api.get("/locations/countries/");
        setCountries(response.data);
      } catch (err) {
        console.error("Failed to fetch countries");
      }
    };
    fetchCountries();
  }, []);

  // 2. Handle Geographic Changes
  const handleCountryChange = async (e) => {
    const countryId = e.target.value;
    setFormData({
      ...formData,
      country_id: countryId,
      state_id: "",
      district_id: "",
    });
    setStates([]);
    setDistricts([]);

    if (countryId) {
      try {
        const response = await api.get(
          `/locations/states/?country=${countryId}`,
        );
        setStates(response.data);
      } catch (err) {
        console.error("Failed to fetch states");
      }
    }
  };

  const handleStateChange = async (e) => {
    const stateId = e.target.value;
    setFormData({ ...formData, state_id: stateId, district_id: "" });
    setDistricts([]);

    if (stateId) {
      try {
        const response = await api.get(
          `/locations/districts/?state=${stateId}`,
        );
        setDistricts(response.data);
      } catch (err) {
        console.error("Failed to fetch districts");
      }
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
    setError("");
  };

  // 3. Submit Registration to Django
  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus("loading");
    setError("");

    try {
      // Hit the Django Registration View
      await api.post("/auth/register/", formData);

      setStatus("success");

      setTimeout(() => {
        navigate("/verify-email", { state: { email: formData.email } });
      }, 2000);
    } catch (err) {
      console.error(err);
      setStatus("idle");
      // Show error from Django
      setError(
        err.response?.data?.error ||
          "Registration failed. Please check your details.",
      );
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute top-[-10%] right-[-5%] w-96 h-96 bg-rose-600/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-5%] w-96 h-96 bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
        <div className="flex justify-center">
          <Link
            to="/"
            className="flex items-center gap-2 text-rose-500 hover:text-rose-400 transition-colors"
          >
            <Droplet className="h-10 w-10 fill-current" />
            <span className="text-3xl font-bold text-white tracking-tight">
              BloodConnect
            </span>
          </Link>
        </div>
        <h2 className="mt-6 text-center text-2xl font-bold leading-9 tracking-tight text-white">
          Register your Organization
        </h2>
        <p className="mt-2 text-center text-sm text-slate-400">
          Join our network to manage your local donor registry securely.
        </p>
      </div>

      <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-125 relative z-10 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-100">
        <div className="bg-slate-900/80 backdrop-blur-xl px-6 py-10 shadow-2xl sm:rounded-2xl sm:px-10 border border-slate-800">
          {status === "success" ? (
            <div className="text-center animate-in fade-in zoom-in duration-500">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10 border border-emerald-500/20 mb-6">
                <Mail className="h-8 w-8 text-emerald-500" />
              </div>
              <h3 className="text-xl font-medium text-white mb-2">
                Registration Successful!
              </h3>
              <p className="text-slate-400 text-sm mb-6">
                Redirecting you to verify your email address...
              </p>
              <Loader2 className="h-6 w-6 text-rose-500 animate-spin mx-auto" />
            </div>
          ) : (
            <form className="space-y-5" onSubmit={handleSubmit}>
              {error && (
                <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm p-3 rounded-lg text-center animate-in fade-in">
                  {error}
                </div>
              )}

              {/* Organization Details */}
              <div className="space-y-4 pb-4 border-b border-slate-800">
                <h3 className="text-sm font-semibold text-white">
                  1. Organization Details
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2 relative">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
                    <Input
                      name="orgName"
                      placeholder="Organization Name"
                      className="pl-10 bg-slate-950"
                      required
                      value={formData.orgName}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="col-span-2 relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
                    <Input
                      name="contactName"
                      placeholder="Admin Contact Name"
                      className="pl-10 bg-slate-950"
                      required
                      value={formData.contactName}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="col-span-2 sm:col-span-1 relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
                    <Input
                      name="email"
                      type="email"
                      placeholder="Official Email"
                      className="pl-10 bg-slate-950"
                      required
                      value={formData.email}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="col-span-2 sm:col-span-1 relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
                    <Input
                      name="password"
                      type="password"
                      placeholder="Password"
                      className="pl-10 bg-slate-950"
                      required
                      value={formData.password}
                      onChange={handleChange}
                    />
                  </div>
                </div>
              </div>

              {/* Geographic Locking Details */}
              <div className="space-y-4 pt-2 pb-4 border-b border-slate-800">
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-rose-500" /> 2. Geographic
                  Lock
                </h3>
                <p className="text-xs text-slate-500 mb-2">
                  Your organization will be restricted to managing donors in
                  this specific region.
                </p>

                <SearchableSelect
                  value={formData.country_id}
                  onChange={(val) =>
                    handleCountryChange({ target: { value: val } })
                  }
                  options={countries.map((c) => ({
                    label: c.name,
                    value: c.id.toString(),
                  }))}
                  placeholder="Select Country"
                  className="bg-slate-950"
                  required
                />

                <div className="grid grid-cols-2 gap-4">
                  <SearchableSelect
                    value={formData.state_id}
                    onChange={(val) =>
                      handleStateChange({ target: { value: val } })
                    }
                    options={states.map((s) => ({
                      label: s.name,
                      value: s.id.toString(),
                    }))}
                    placeholder="Select State"
                    disabled={!formData.country_id}
                    className="bg-slate-950"
                    required
                  />

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
                    placeholder="Select District"
                    disabled={!formData.state_id}
                    className="bg-slate-950"
                    required
                  />
                </div>
              </div>

              <div className="space-y-4 pt-2">
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <Globe className="h-4 w-4 text-emerald-500" /> 3. Public
                  Directory
                </h3>

                <label className="flex items-start gap-3 p-4 rounded-xl border border-slate-700 bg-slate-900/50 cursor-pointer hover:bg-slate-800/50 transition-colors">
                  <div className="flex h-6 items-center">
                    <input
                      id="is_searchable"
                      name="is_searchable"
                      type="checkbox"
                      checked={formData.is_searchable}
                      onChange={handleChange}
                      className="h-5 w-5 rounded border-slate-600 bg-slate-950 text-rose-500 focus:ring-rose-500 focus:ring-offset-slate-900 transition-all cursor-pointer"
                    />
                  </div>
                  <div className="text-sm leading-tight">
                    <span className="font-medium text-white block mb-1">
                      List our donors in the public search directory
                    </span>
                    <span className="text-slate-400 text-xs block">
                      Allow public users to find your facility when searching
                      for specific blood groups. Your donors' personal contact
                      information will <strong>never</strong> be shown publicly.
                    </span>
                  </div>
                </label>
              </div>

              <div className="pt-4">
                <Button
                  type="submit"
                  variant="primary"
                  className="w-full flex justify-center items-center py-5 text-base"
                  disabled={status === "loading"}
                >
                  {status === "loading" ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />{" "}
                      Processing...
                    </>
                  ) : (
                    <>
                      <span className="mr-2">Register Organization</span>
                      <ArrowRight className="h-5 w-5" />
                    </>
                  )}
                </Button>
              </div>
            </form>
          )}

          {status !== "success" && (
            <div className="mt-6 text-center text-sm text-slate-400">
              Already have an account?{" "}
              <Link
                to="/login"
                className="font-semibold leading-6 text-rose-500 hover:text-rose-400 transition-colors"
              >
                Sign in to Dashboard
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
