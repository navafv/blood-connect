import React, { useState } from "react";
import { Link } from "react-router-dom";
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
            Forgot Password
          </h1>

          <p className="mt-3 text-sm text-slate-400 text-center leading-relaxed max-w-sm">
            Enter your registered email address and we’ll send you a secure
            password reset link.
          </p>
        </div>

        {/* Card */}
        <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-3xl shadow-2xl px-6 sm:px-10 py-10">
          {status === "success" ? (
            <div className="text-center py-8 animate-in fade-in zoom-in duration-500">
              {/* Success Icon */}
              <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-emerald-500/10 border border-emerald-500/20 mb-6 relative">
                <div className="absolute inset-0 bg-emerald-500/20 rounded-full blur-md animate-pulse" />

                <CheckCircle2 className="h-12 w-12 text-emerald-500 relative z-10" />
              </div>

              {/* Title */}
              <h3 className="text-3xl font-bold text-white mb-3">
                Check Your Inbox
              </h3>

              {/* Description */}
              <p className="text-slate-400 text-base leading-relaxed max-w-sm mx-auto mb-8">
                If an account exists for{" "}
                <span className="text-slate-200 font-medium">{email}</span>, a
                password reset link has been sent.
              </p>

              {/* Button */}
              <Link to="/login" className="block w-full">
                <Button
                  variant="outline"
                  className="w-full py-6 text-base font-semibold rounded-xl border-slate-700 bg-slate-900/40 hover:bg-slate-800 text-slate-300 transition-all"
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
                  className="text-xs font-bold uppercase tracking-wider text-slate-400"
                >
                  Email Address
                </label>

                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500 transition-colors group-focus-within:text-rose-500" />

                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    placeholder="admin@organization.com"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={status === "loading"}
                    className="pl-12 h-12 bg-slate-950/50 border-slate-700 focus:border-rose-500 focus:ring-rose-500/20 transition-all"
                  />
                </div>
              </div>

              {/* Submit */}
              <div className="pt-2">
                <Button
                  type="submit"
                  variant="primary"
                  disabled={status === "loading" || !email}
                  className="w-full py-6 text-base font-semibold rounded-xl shadow-lg hover:shadow-rose-500/20 transition-all gap-2"
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
                  className="inline-flex items-center text-sm font-medium text-slate-400 hover:text-rose-400 transition-colors"
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
