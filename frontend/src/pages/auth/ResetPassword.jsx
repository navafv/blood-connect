import React, { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  Droplet,
  Lock,
  ArrowRight,
  Loader2,
  CheckCircle2,
  Eye,
  EyeOff,
  ShieldCheck,
  AlertCircle,
} from "lucide-react";
import toast from "react-hot-toast";

import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "../../components/ui/Card";

import { Input } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";
import api from "../../lib/axios";

export default function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // URL Params
  const uid = searchParams.get("uid");
  const token = searchParams.get("token");

  // UI State
  const [status, setStatus] = useState("idle");
  const [showPassword, setShowPassword] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    password: "",
    confirmPassword: "",
  });

  // Validate Link
  useEffect(() => {
    if (!uid || !token) {
      setStatus("invalid_link");
    }
  }, [uid, token]);

  // Input Change
  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Submit
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (formData.password.length < 8) {
      toast.error("Password must contain at least 8 characters");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setStatus("loading");

    try {
      await api.post("/auth/password-reset-confirm/", {
        uid,
        token,
        new_password: formData.password,
      });

      setStatus("success");

      toast.success("Password updated successfully");

      setTimeout(() => {
        navigate("/login");
      }, 3000);
    } catch (err) {
      console.error("Reset Error:", err);

      setStatus("idle");

      toast.error(
        err.response?.data?.error ||
          err.response?.data?.detail ||
          "This reset link is invalid or expired",
      );
    }
  };

  // Invalid Link State
  if (status === "invalid_link") {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4 py-10 relative overflow-hidden">
        {/* Ambient Background */}{" "}
        <div
          className="absolute top-[-10%] right-[-5%] w-md h-112 bg-rose-600/15 rounded-full blur-[120px] pointer-events-none"
          aria-hidden="true"
        />
        <div
          className="absolute bottom-[-10%] left-[-5%] w-md h-112 bg-blue-600/10 rounded-full blur-[120px] pointer-events-none"
          aria-hidden="true"
        />
        <div className="w-full max-w-md relative z-10 animate-in fade-in zoom-in-95 duration-500">
          <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-3xl shadow-2xl px-6 sm:px-10 py-12 text-center">
            {/* Icon */}
            <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-rose-500/10 border border-rose-500/20 mb-6 relative">
              <div className="absolute inset-0 bg-rose-500/20 rounded-full blur-md animate-pulse" />

              <AlertCircle className="h-12 w-12 text-rose-500 relative z-10" />
            </div>

            {/* Title */}
            <h2 className="text-3xl font-bold text-white mb-3">
              Invalid Reset Link
            </h2>

            {/* Description */}
            <p className="text-slate-400 text-base leading-relaxed mb-8 max-w-sm mx-auto">
              This password reset link is invalid, incomplete, or has already
              expired.
            </p>

            {/* Action */}
            <Link to="/forgot-password" className="block w-full">
              <Button
                variant="primary"
                className="w-full py-6 text-base font-semibold rounded-xl shadow-lg hover:shadow-rose-500/20 transition-all"
              >
                Request New Link
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4 py-10 relative overflow-hidden">
      {/* Ambient Background */}{" "}
      <div
        className="absolute top-[-10%] right-[-5%] w-md h-112 bg-rose-600/15 rounded-full blur-[120px] pointer-events-none"
        aria-hidden="true"
      />
      <div
        className="absolute bottom-[-10%] left-[-5%] w-md h-112 bg-blue-600/10 rounded-full blur-[120px] pointer-events-none"
        aria-hidden="true"
      />
      {/* Main Container */}
      <div className="w-full max-w-md relative z-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
        {/* Header */}
        <div className="flex flex-col items-center mb-8">
          <Link
            to="/"
            className="group flex items-center justify-center h-16 w-16 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl transition-all duration-300 hover:border-rose-500/40"
          >
            <Droplet className="h-8 w-8 text-rose-500 transition-transform duration-300 group-hover:scale-110" />
          </Link>

          <h1 className="mt-6 text-3xl font-extrabold tracking-tight text-white text-center">
            Create New Password
          </h1>

          <p className="mt-3 text-sm text-slate-400 text-center leading-relaxed max-w-sm">
            Choose a strong password to secure your Bloodonate account.
          </p>
        </div>

        {/* Card */}
        <Card className="border-slate-800/80 bg-slate-900/60 backdrop-blur-xl shadow-2xl rounded-3xl overflow-hidden">
          {status === "success" ? (
            <CardContent className="pt-12 pb-12 flex flex-col items-center text-center animate-in fade-in zoom-in duration-500">
              {/* Success Icon */}
              <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-emerald-500/10 border border-emerald-500/20 mb-6 relative">
                <div className="absolute inset-0 bg-emerald-500/20 rounded-full blur-md animate-pulse" />

                <CheckCircle2 className="h-12 w-12 text-emerald-500 relative z-10" />
              </div>

              {/* Title */}
              <h2 className="text-3xl font-bold text-white mb-3">
                Password Updated
              </h2>

              {/* Description */}
              <p className="text-slate-400 text-base leading-relaxed max-w-sm mx-auto mb-8">
                Your password has been updated successfully. Redirecting you to
                login...
              </p>

              {/* Button */}
              <Button
                variant="primary"
                className="w-full py-6 text-base font-semibold rounded-xl shadow-lg hover:shadow-rose-500/20 transition-all"
                onClick={() => navigate("/login")}
              >
                Go to Login
              </Button>
            </CardContent>
          ) : (
            <>
              {/* Header */}
              <CardHeader className="text-center border-b border-slate-800/50 pt-10 pb-6">
                <div className="mx-auto h-16 w-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mb-4">
                  <ShieldCheck className="h-8 w-8 text-rose-500" />
                </div>

                <CardTitle className="text-2xl font-extrabold tracking-tight text-white">
                  Reset Password
                </CardTitle>

                <p className="mt-3 text-sm text-slate-400 leading-relaxed px-2">
                  Enter a new password for your account.
                </p>
              </CardHeader>

              {/* Form */}
              <CardContent className="pt-8 px-8 pb-8">
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Password */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      New Password
                    </label>

                    <div className="relative group">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500 transition-colors group-focus-within:text-rose-500" />

                      <Input
                        type={showPassword ? "text" : "password"}
                        name="password"
                        autoComplete="new-password"
                        placeholder="••••••••"
                        required
                        autoFocus
                        value={formData.password}
                        onChange={handleChange}
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
                  </div>

                  {/* Confirm Password */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Confirm Password
                    </label>

                    <div className="relative group">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500 transition-colors group-focus-within:text-rose-500" />

                      <Input
                        type={showPassword ? "text" : "password"}
                        name="confirmPassword"
                        autoComplete="new-password"
                        placeholder="••••••••"
                        required
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        className="pl-12 h-12 bg-slate-950/50 border-slate-700 focus:border-rose-500 focus:ring-rose-500/20 transition-all"
                      />
                    </div>
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
                          Updating Password...
                        </>
                      ) : (
                        <>
                          Update Password
                          <ArrowRight className="h-5 w-5" />
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
