import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import {
  Droplet,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Loader2,
} from "lucide-react";
import toast from "react-hot-toast";

import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import api from "../../lib/axios";

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();

  // --- UI Transition State ---
  const [showPassword, setShowPassword] = useState(false);

  // --- Payload State ---
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Capture the URL they were on before the session expired
  const from = location.state?.from || null;

  // --- Unified Authentication Pipeline ---
  const loginMutation = useMutation({
    mutationFn: async (credentials) => {
      const res = await api.post("/auth/login/", credentials);
      return res.data;
    },
    onSuccess: (data) => {
      // Hydrate client-side routing state flags
      const userRole = data.role || data.user?.role;
      localStorage.setItem("isAuthenticated", "true");
      localStorage.setItem("userRole", userRole);

      toast.success("Authentication successful. Initializing workspace.");

      // --- Seamless Redirection Logic ---
      if (from) {
        // Return them exactly where they were
        navigate(from, { replace: true });
      } else {
        // Default routing based on role
        if (userRole === "SUPER_ADMIN") {
          navigate("/superadmin", { replace: true });
        } else {
          navigate("/admin", { replace: true });
        }
      }
    },
    onError: (err) => {
      console.error("Authentication Failure:", err);
      if (err.response?.status === 401) {
        toast.error(
          "Invalid credentials. Please verify your email and password.",
        );
      } else if (err.response?.status === 403) {
        toast.error("Account suspended or pending verification.");
      } else {
        toast.error(
          err.response?.data?.detail ||
            "System error during authentication. Please try again later.",
        );
      }
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    loginMutation.mutate({
      email: formData.email,
      password: formData.password,
    });
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* --- Ambient Environmental Glows --- */}
      <div
        className="absolute top-[-10%] right-[-5%] w-96 h-96 bg-rose-600/15 rounded-full blur-[120px] pointer-events-none"
        aria-hidden="true"
      />
      <div
        className="absolute bottom-[-10%] left-[-5%] w-96 h-96 bg-blue-600/10 rounded-full blur-[120px] pointer-events-none"
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
          Access your workspace
        </h2>
        <p className="mt-2 text-center text-sm text-slate-400">
          Enter your administrative credentials to continue.
        </p>
      </div>

      {/* --- Authentication Form Console --- */}
      <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-110 relative z-10 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-100">
        <div className="bg-slate-900/60 backdrop-blur-xl px-6 py-10 shadow-2xl sm:rounded-3xl sm:px-12 border border-slate-800/80">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* Identity Input */}
            <div className="space-y-2">
              <label
                className="text-xs font-bold uppercase tracking-wider text-slate-400"
                htmlFor="email"
              >
                Email Address
              </label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500 group-focus-within:text-rose-500 transition-colors" />
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="admin@organization.com"
                  className="pl-12 bg-slate-950/50 border-slate-700 focus:border-rose-500 focus:ring-rose-500/20 h-12 transition-all"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  disabled={loginMutation.isPending}
                />
              </div>
            </div>

            {/* Credential Input */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label
                  className="text-xs font-bold uppercase tracking-wider text-slate-400"
                  htmlFor="password"
                >
                  Password
                </label>
                <Link
                  to="/forgot-password"
                  className="text-sm font-semibold text-rose-500 hover:text-rose-400 transition-colors"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500 group-focus-within:text-rose-500 transition-colors" />
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className="pl-12 pr-12 bg-slate-950/50 border-slate-700 focus:border-rose-500 focus:ring-rose-500/20 h-12 transition-all"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  disabled={loginMutation.isPending}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 focus:outline-none transition-colors"
                  tabIndex="-1"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Submission Matrix */}
            <div className="pt-2">
              <Button
                type="submit"
                variant="primary"
                className="w-full flex justify-center items-center py-6 text-base font-semibold shadow-lg hover:shadow-rose-500/20 transition-all rounded-xl gap-2"
                disabled={loginMutation.isPending}
              >
                {loginMutation.isPending ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Authenticating...
                  </>
                ) : (
                  <>
                    Secure Sign In
                    <ArrowRight className="h-5 w-5" />
                  </>
                )}
              </Button>
            </div>
          </form>

          {/* Alternate Routing */}
          <div className="mt-8 text-center text-sm text-slate-400 border-t border-slate-800/80 pt-6">
            Not a registered organization?{" "}
            <Link
              to="/register-org"
              className="font-semibold leading-6 text-white hover:text-rose-400 transition-colors"
            >
              Request Access
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
