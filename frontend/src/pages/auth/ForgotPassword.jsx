import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Mail,
  ArrowLeft,
  Droplet,
  Loader2,
  Send,
  CheckCircle2,
} from "lucide-react";
import toast from "react-hot-toast";

import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import api from "../../lib/axios";

export default function ForgotPassword() {
  // UI State
  const [status, setStatus] = useState("idle");
  const [email, setEmail] = useState("");

  // Submit
  const handleSubmit = async (e) => {
    e.preventDefault();

    setStatus("loading");

    try {
      await api.post("/auth/password-reset-request/", {
        email,
      });

      setStatus("success");

      toast.success("Password reset link sent");
    } catch (err) {
      console.error("Password Reset Error:", err);

      toast.error("Unable to process your request right now");

      setStatus("idle");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10 relative overflow-hidden transition-colors duration-300 bg-slate-50 dark:bg-slate-950">
      {/* Ambient Background */}
      <div
        className="absolute top-[-10%] right-[-5%] w-120 h-120 rounded-full blur-[120px] pointer-events-none transition-colors duration-300 bg-rose-500/10 dark:bg-rose-600/15"
        aria-hidden="true"
      />
      <div
        className="absolute bottom-[-10%] left-[-5%] w-120 h-120 rounded-full blur-[120px] pointer-events-none transition-colors duration-300 bg-blue-500/10 dark:bg-blue-600/10"
        aria-hidden="true"
      />

      {/* Main Container */}
      <div className="w-full max-w-md relative z-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
        {/* Header */}
        <div className="flex flex-col items-center mb-8">
          <Link
            to="/"
            className="group flex items-center justify-center h-16 w-16 rounded-2xl border transition-all duration-300 shadow-md bg-white border-slate-200 hover:border-rose-300 dark:bg-slate-900 dark:border-slate-800 dark:shadow-2xl dark:hover:border-rose-500/40"
          >
            <Droplet className="h-8 w-8 transition-transform duration-300 group-hover:scale-110 text-rose-600 dark:text-rose-500" />
          </Link>

          <h1 className="mt-6 text-3xl font-extrabold tracking-tight text-center transition-colors duration-300 text-slate-900 dark:text-white">
            Forgot Password
          </h1>

          <p className="mt-3 text-sm text-center leading-relaxed max-w-sm transition-colors duration-300 text-slate-600 dark:text-slate-400">
            Enter your registered email address and we’ll send you a secure
            password reset link.
          </p>
        </div>

        {/* Card */}
        <div className="backdrop-blur-xl border rounded-3xl shadow-xl px-6 sm:px-10 py-10 transition-colors duration-300 bg-white/80 border-slate-200 dark:bg-slate-900/60 dark:border-slate-800/80 dark:shadow-2xl">
          {status === "success" ? (
            <div className="text-center py-8 animate-in fade-in zoom-in duration-500">
              {/* Success Icon */}
              <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full border mb-6 relative transition-colors duration-300 bg-emerald-50 border-emerald-200 dark:bg-emerald-500/10 dark:border-emerald-500/20">
                <div className="absolute inset-0 rounded-full blur-md animate-pulse transition-colors duration-300 bg-emerald-200/50 dark:bg-emerald-500/20" />

                <CheckCircle2 className="h-12 w-12 relative z-10 transition-colors duration-300 text-emerald-600 dark:text-emerald-500" />
              </div>

              {/* Title */}
              <h3 className="text-3xl font-bold mb-3 transition-colors duration-300 text-slate-900 dark:text-white">
                Check Your Inbox
              </h3>

              {/* Description */}
              <p className="text-base leading-relaxed max-w-sm mx-auto mb-8 transition-colors duration-300 text-slate-600 dark:text-slate-400">
                If an account exists for{" "}
                <span className="font-medium transition-colors duration-300 text-slate-900 dark:text-slate-200">
                  {email}
                </span>
                , a password reset link has been sent.
              </p>

              {/* Button */}
              <Link to="/login" className="block w-full">
                <Button
                  variant="outline"
                  className="w-full py-6 text-base font-semibold rounded-xl transition-all"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Login
                </Button>
              </Link>
            </div>
          ) : (
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
                    type="email"
                    autoComplete="email"
                    placeholder="admin@organization.com"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={status === "loading"}
                    className="pl-12 h-12 transition-all duration-300 focus:ring-rose-500/20"
                  />
                </div>
              </div>

              {/* Submit */}
              <div className="pt-2">
                <Button
                  type="submit"
                  variant="primary"
                  disabled={status === "loading" || !email}
                  className="w-full py-6 text-base font-semibold rounded-xl shadow-md transition-all gap-2 hover:-translate-y-0.5 hover:shadow-lg dark:shadow-lg dark:hover:shadow-rose-500/20"
                >
                  {status === "loading" ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Sending Reset Link...
                    </>
                  ) : (
                    <>
                      <Send className="h-5 w-5" />
                      Send Reset Link
                    </>
                  )}
                </Button>
              </div>

              {/* Footer Link */}
              <div className="pt-2 text-center">
                <Link
                  to="/login"
                  className="inline-flex items-center text-sm font-medium transition-colors duration-300 text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Login
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
