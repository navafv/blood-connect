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

  // --- UI Transition State ---
  const [showPassword, setShowPassword] = useState(false);

  // --- 2FA Gateway State ---
  const [requires2FA, setRequires2FA] = useState(false);
  const [tempToken, setTempToken] = useState("");
  const [otpCode, setOtpCode] = useState("");

  // --- Payload State ---
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const from = location.state?.from || null;

  // Reusable helper to finish login and route the user
  const completeLogin = (role) => {
    localStorage.setItem("isAuthenticated", "true");
    localStorage.setItem("userRole", role);
    queryClient.removeQueries({ queryKey: ["auth-session-verify"] });

    toast.success("Authentication successful. Initializing workspace.");

    if (from) {
      navigate(from, { replace: true });
    } else {
      if (role === "SUPER_ADMIN") navigate("/superadmin", { replace: true });
      else navigate("/admin", { replace: true });
    }
  };

  // --- Step 1: Initial Email/Password Pipeline ---
  const loginMutation = useMutation({
    mutationFn: async (credentials) => {
      const res = await api.post("/auth/login/", credentials);
      return res.data;
    },
    onSuccess: (data) => {
      // FIX: Check if the backend intercepted us and demanded 2FA
      if (data.requires_2fa) {
        setTempToken(data.temp_token);
        setRequires2FA(true);
        toast("2FA Code Required", { icon: "🔐" });
      } else {
        // Standard login (2FA disabled)
        const userRole = data.role || data.user?.role;
        completeLogin(userRole);
      }
    },
    onError: (err) => {
      console.error("Authentication Failure:", err);
      toast.dismiss();

      if (err.response?.status === 401) {
        toast.error(
          "Invalid credentials. Please verify your email and password.",
        );
      } else if (err.response?.status === 403) {
        toast.error("Account suspended or pending verification.");
      } else if (err.response?.status === 429) {
        toast.error("Too many login attempts. Please try again later.");
      } else {
        toast.error(
          err.response?.data?.detail || "System error during authentication.",
        );
      }
    },
  });

  // --- Step 2: 2FA Verification Pipeline ---
  const verify2FAMutation = useMutation({
    mutationFn: async (payload) => {
      const res = await api.post("/auth/login/2fa/", payload);
      return res.data;
    },
    onSuccess: (data) => {
      completeLogin(data.role);
    },
    onError: (err) => {
      toast.error(err.response?.data?.error || "Invalid 2FA code.");
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    loginMutation.mutate({
      email: formData.email,
      password: formData.password,
    });
  };

  const handle2FASubmit = (e) => {
    e.preventDefault();
    verify2FAMutation.mutate({
      temp_token: tempToken,
      code: otpCode,
    });
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      <div
        className="absolute top-[-10%] right-[-5%] w-96 h-96 bg-rose-600/15 rounded-full blur-[120px] pointer-events-none"
        aria-hidden="true"
      />
      <div
        className="absolute bottom-[-10%] left-[-5%] w-96 h-96 bg-blue-600/10 rounded-full blur-[120px] pointer-events-none"
        aria-hidden="true"
      />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
        <div className="flex justify-center mb-8">
          <div className="h-16 w-16 bg-slate-950 border border-slate-800 rounded-2xl flex items-center justify-center shadow-inner">
            {requires2FA ? (
              <ShieldCheck className="h-8 w-8 text-blue-500" />
            ) : (
              <Droplet className="h-8 w-8 text-rose-500" />
            )}
          </div>
        </div>
        <h2 className="text-center text-2xl font-bold leading-9 tracking-tight text-white">
          {requires2FA ? "Two-Factor Auth" : "Access your workspace"}
        </h2>
        <p className="mt-2 text-center text-sm text-slate-400">
          {requires2FA
            ? "Enter the 6-digit code from your authenticator app."
            : "Enter your administrative credentials to continue."}
        </p>
      </div>

      <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-md relative z-10 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-100">
        <div className="bg-slate-900/60 backdrop-blur-xl px-6 py-10 shadow-2xl sm:rounded-3xl sm:px-12 border border-slate-800/80">
          {/* DYNAMIC FORM RENDERING */}
          {!requires2FA ? (
            <form className="space-y-6" onSubmit={handleSubmit}>
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
                    placeholder="admin@organization.com"
                    className="pl-12 bg-slate-950/50 border-slate-700 focus:border-rose-500 h-12 transition-all"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    disabled={loginMutation.isPending}
                  />
                </div>
              </div>

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
                    placeholder="••••••••"
                    className="pl-12 pr-12 bg-slate-950/50 border-slate-700 focus:border-rose-500 h-12 transition-all"
                    required
                    value={formData.password}
                    onChange={handleChange}
                    disabled={loginMutation.isPending}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 focus:outline-none transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <Button
                  type="submit"
                  variant="primary"
                  className="w-full flex justify-center items-center py-6 text-base font-semibold shadow-lg hover:shadow-rose-500/20 transition-all rounded-xl gap-2"
                  disabled={loginMutation.isPending}
                >
                  {loginMutation.isPending ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />{" "}
                      Authenticating...
                    </>
                  ) : (
                    <>
                      <Lock className="h-5 w-5" /> Secure Sign In{" "}
                      <ArrowRight className="h-5 w-5 ml-1" />
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
                <Input
                  type="text"
                  maxLength={6}
                  required
                  value={otpCode}
                  onChange={(e) =>
                    setOtpCode(e.target.value.replace(/\D/g, ""))
                  }
                  className="bg-slate-950/50 border-slate-700 text-center text-3xl tracking-[0.5em] font-mono h-16 text-white"
                  placeholder="000000"
                  autoFocus
                />
              </div>
              <Button
                type="submit"
                variant="primary"
                className="w-full h-12 text-base font-bold shadow-lg"
                disabled={verify2FAMutation.isPending || otpCode.length !== 6}
              >
                {verify2FAMutation.isPending ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  "Verify Identity"
                )}
              </Button>
              <button
                type="button"
                onClick={() => setRequires2FA(false)}
                className="w-full text-sm text-slate-400 hover:text-white transition-colors text-center mt-4 block"
              >
                &larr; Cancel and return to login
              </button>
            </form>
          )}

          {!requires2FA && (
            <div className="mt-8 text-center text-sm text-slate-400 border-t border-slate-800/80 pt-6">
              Not a registered organization?{" "}
              <Link
                to="/register-org"
                className="font-semibold leading-6 text-white hover:text-rose-400 transition-colors"
              >
                Request Access
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
