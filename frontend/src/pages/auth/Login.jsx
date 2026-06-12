import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Droplet,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Loader2,
  ShieldCheck,
} from "lucide-react";
import toast from "react-hot-toast";

import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import api from "../../lib/axios";

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();

  // UI State
  const [showPassword, setShowPassword] = useState(false);

  // 2FA State
  const [requires2FA, setRequires2FA] = useState(false);
  const [tempToken, setTempToken] = useState("");
  const [otpCode, setOtpCode] = useState("");

  // Form State
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const from = location.state?.from || null;

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  // Complete Login
  const completeLogin = (role) => {
    localStorage.setItem("isAuthenticated", "true");
    localStorage.setItem("userRole", role);
    queryClient.clear();

    toast.success("Login successful");

    if (from) {
      navigate(from, { replace: true });
    } else {
      if (role === "SUPER_ADMIN") {
        navigate("/superadmin", { replace: true });
      } else {
        navigate("/admin", { replace: true });
      }
    }
  };

  // Login Mutation
  const loginMutation = useMutation({
    mutationFn: async (credentials) => {
      const res = await api.post("/auth/login/", credentials);
      return res.data;
    },

    onSuccess: (data) => {
      if (data.requires_2fa) {
        setTempToken(data.temp_token);
        setRequires2FA(true);

        toast("Enter your verification code", {
          icon: "🔐",
        });
      } else {
        const userRole = data.role || data.user?.role;
        completeLogin(userRole);
      }
    },

    onError: (err) => {
      console.error("Login Error:", err);

      if (err.response?.status === 401) {
        toast.error("Invalid email or password");
      } else if (err.response?.status === 403) {
        toast.error("Your account is pending approval");
      } else if (err.response?.status === 429) {
        toast.error("Too many attempts. Please try again later");
      } else {
        toast.error(
          err.response?.data?.detail || "Unable to complete login request",
        );
      }
    },
  });

  // 2FA Verification
  const verify2FAMutation = useMutation({
    mutationFn: async (payload) => {
      const res = await api.post("/auth/login/2fa/", payload);
      return res.data;
    },

    onSuccess: (data) => {
      completeLogin(data.role);
    },

    onError: (err) => {
      toast.error(err.response?.data?.error || "Invalid verification code");
    },
  });

  // Login Submit
  const handleSubmit = (e) => {
    e.preventDefault();

    loginMutation.mutate({
      email: formData.email,
      password: formData.password,
    });
  };

  // 2FA Submit
  const handle2FASubmit = (e) => {
    e.preventDefault();

    verify2FAMutation.mutate({
      temp_token: tempToken,
      code: otpCode,
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10 relative overflow-hidden transition-colors duration-300 bg-slate-50 dark:bg-slate-950">
      {/* Ambient Background */}
      <div
        className="absolute top-[-10%] right-[-5%] w-100 md:w-150 h-112.5 rounded-full blur-[120px] pointer-events-none transition-colors duration-300 bg-rose-500/10 dark:bg-rose-600/15"
        aria-hidden="true"
      />
      <div
        className="absolute bottom-[-10%] left-[-5%] w-100 md:w-150 h-112.5 rounded-full blur-[120px] pointer-events-none transition-colors duration-300 bg-blue-500/10 dark:bg-blue-600/10"
        aria-hidden="true"
      />

      {/* Main Container */}
      <div className="w-full max-w-md relative z-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <Link
            to="/"
            className="group flex items-center justify-center h-16 w-16 rounded-2xl border transition-all duration-300 shadow-md bg-white border-slate-200 hover:border-rose-300 dark:bg-slate-900 dark:border-slate-800 dark:shadow-2xl dark:hover:border-rose-500/40"
          >
            {requires2FA ? (
              <ShieldCheck className="h-8 w-8 transition-transform duration-300 group-hover:scale-110 text-blue-600 dark:text-blue-500" />
            ) : (
              <Droplet className="h-8 w-8 transition-transform duration-300 group-hover:scale-110 text-rose-600 dark:text-rose-500" />
            )}
          </Link>

          <h1 className="mt-6 text-3xl font-extrabold tracking-tight text-center transition-colors duration-300 text-slate-900 dark:text-white">
            {requires2FA ? "Two-Factor Verification" : "Welcome Back"}
          </h1>

          <p className="mt-3 text-sm text-center leading-relaxed max-w-sm transition-colors duration-300 text-slate-600 dark:text-slate-400">
            {requires2FA
              ? "Enter the 6-digit verification code from your authenticator app."
              : "Sign in to access your Bloodonate organization dashboard."}
          </p>
        </div>

        {/* Auth Card */}
        <div className="backdrop-blur-xl border rounded-3xl shadow-xl px-6 sm:px-10 py-10 transition-colors duration-300 bg-white/80 border-slate-200 dark:bg-slate-900/60 dark:border-slate-800/80 dark:shadow-2xl">
          {!requires2FA ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Email */}
              <div className="space-y-2">
                <label
                  htmlFor="email"
                  className="text-xs font-bold uppercase tracking-wider transition-colors duration-300 text-slate-600 dark:text-slate-400"
                >
                  Email Address
                </label>

                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 transition-colors duration-300 text-slate-400 group-focus-within:text-rose-600 dark:text-slate-500 dark:group-focus-within:text-rose-500" />

                  <Input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    placeholder="admin@organization.com"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    disabled={loginMutation.isPending}
                    className="pl-12 h-12 transition-all duration-300 focus:ring-rose-500/20"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="password"
                    className="text-xs font-bold uppercase tracking-wider transition-colors duration-300 text-slate-600 dark:text-slate-400"
                  >
                    Password
                  </label>

                  <Link
                    to="/forgot-password"
                    className="text-sm font-medium transition-colors duration-300 text-rose-600 hover:text-rose-700 dark:text-rose-500 dark:hover:text-rose-400"
                  >
                    Forgot password?
                  </Link>
                </div>

                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 transition-colors duration-300 text-slate-400 group-focus-within:text-rose-600 dark:text-slate-500 dark:group-focus-within:text-rose-500" />

                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    placeholder="••••••••"
                    required
                    value={formData.password}
                    onChange={handleChange}
                    disabled={loginMutation.isPending}
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
              </div>

              {/* Submit */}
              <div className="pt-2">
                <Button
                  type="submit"
                  variant="primary"
                  disabled={loginMutation.isPending}
                  className="w-full py-6 text-base font-semibold rounded-xl shadow-md transition-all gap-2 hover:-translate-y-0.5 hover:shadow-lg dark:shadow-lg dark:hover:shadow-rose-500/20"
                >
                  {loginMutation.isPending ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Signing In...
                    </>
                  ) : (
                    <>
                      Sign In
                      <ArrowRight className="h-5 w-5" />
                    </>
                  )}
                </Button>
              </div>
            </form>
          ) : (
            <form
              onSubmit={handle2FASubmit}
              className="space-y-6 animate-in slide-in-from-right-8 duration-500"
            >
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider transition-colors duration-300 text-slate-600 dark:text-slate-400">
                  Verification Code
                </label>

                <Input
                  type="text"
                  maxLength={6}
                  required
                  autoFocus
                  value={otpCode}
                  onChange={(e) =>
                    setOtpCode(e.target.value.replace(/\D/g, ""))
                  }
                  placeholder="000000"
                  className="h-16 text-center text-3xl tracking-[0.5em] font-mono focus:border-blue-500 focus:ring-blue-500/20"
                />
              </div>

              <Button
                type="submit"
                variant="primary"
                disabled={verify2FAMutation.isPending || otpCode.length !== 6}
                className="w-full py-6 text-base font-semibold rounded-xl shadow-md transition-all hover:shadow-lg dark:shadow-lg"
              >
                {verify2FAMutation.isPending ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  "Verify & Continue"
                )}
              </Button>

              <button
                type="button"
                onClick={() => {
                  setRequires2FA(false);
                  setOtpCode("");
                }}
                className="w-full text-sm transition-colors duration-300 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
              >
                ← Back to login
              </button>
            </form>
          )}

          {/* Footer */}
          {!requires2FA && (
            <div className="mt-8 pt-6 border-t text-center transition-colors duration-300 border-slate-200 dark:border-slate-800/80">
              <p className="text-sm transition-colors duration-300 text-slate-600 dark:text-slate-400">
                Need organization access?{" "}
                <Link
                  to="/register-org"
                  className="font-semibold transition-colors duration-300 text-slate-900 hover:text-rose-600 dark:text-white dark:hover:text-rose-400"
                >
                  Register Organization
                </Link>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
