import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  Mail,
  ArrowLeft,
  Droplet,
  Loader2,
  Send,
  Terminal,
} from "lucide-react";
import toast from "react-hot-toast";

import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import api from "../../lib/axios";

/**
 * Credential Recovery Boundary
 * Initiates the password reset protocol. Employs a deterministic success state
 * regardless of email existence to prevent user enumeration attacks.
 */
export default function ForgotPassword() {
  // --- UI Transition State ---
  const [status, setStatus] = useState("idle"); // 'idle' | 'loading' | 'success'

  // --- Payload State ---
  const [email, setEmail] = useState("");

  /**
   * Dispatches the recovery request to the authentication server.
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus("loading");

    try {
      await api.post("/auth/password-reset-request/", { email });

      // Deterministic success state mitigates enumeration vulnerabilities
      setStatus("success");
      toast.success("Recovery protocol initiated.");
    } catch (err) {
      console.error("Recovery Request Failure:", err);
      toast.error(
        "Failed to process request. Please verify network connectivity.",
      );
      setStatus("idle");
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* --- Ambient Environmental Glows --- */}
      <div
        className="absolute top-[-10%] right-[-5%] w-100 h-100 bg-rose-600/15 rounded-full blur-[120px] pointer-events-none"
        aria-hidden="true"
      />
      <div
        className="absolute bottom-[-10%] left-[-5%] w-100 h-100 bg-blue-600/10 rounded-full blur-[120px] pointer-events-none"
        aria-hidden="true"
      />

      {/* --- Brand Header --- */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
        <div className="flex justify-center mb-8">
          <Link
            to="/"
            className="flex items-center justify-center h-16 w-16 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl group hover:border-rose-500/30 transition-all duration-300"
          >
            <Droplet className="h-8 w-8 text-rose-500 drop-shadow-[0_0_8px_rgba(225,29,72,0.5)] group-hover:scale-110 transition-transform duration-300" />
          </Link>
        </div>
        <h2 className="text-center text-3xl font-extrabold leading-9 tracking-tight text-white">
          Reset your password
        </h2>
        <p className="mt-3 text-center text-sm text-slate-400 max-w-sm mx-auto">
          Enter your organization's official email address and we will securely
          route a recovery link to your inbox.
        </p>
      </div>

      {/* --- Recovery Form Console --- */}
      <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-110 relative z-10 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-100">
        <div className="bg-slate-900/60 backdrop-blur-xl px-6 py-10 shadow-2xl sm:rounded-3xl sm:px-12 border border-slate-800/80">
          {status === "success" ? (
            /* Success State */
            <div className="text-center animate-in fade-in zoom-in-95 duration-500">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/10 border border-emerald-500/20 mb-6 relative">
                <div className="absolute inset-0 bg-emerald-500/20 rounded-full blur-md animate-pulse" />
                <Send className="h-8 w-8 text-emerald-500 relative z-10 -ml-1 mt-1" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-3 tracking-tight">
                Check your inbox
              </h3>
              <p className="text-slate-400 text-base mb-8 leading-relaxed">
                If an authorized account exists for{" "}
                <strong className="text-slate-200 font-medium">{email}</strong>,
                a recovery payload has been dispatched.
              </p>

              {/* Developer Environment Alert */}
              <div className="p-5 bg-slate-950 rounded-xl border border-slate-800 shadow-inner mb-8 text-left">
                <div className="flex items-center gap-2 mb-2">
                  <Terminal className="h-4 w-4 text-rose-500" />
                  <p className="text-xs font-bold uppercase tracking-wider text-rose-500">
                    Developer Notice
                  </p>
                </div>
                <p className="text-sm text-slate-400 leading-relaxed">
                  Email routing is currently suppressed. Check your{" "}
                  <strong className="text-slate-300">
                    Django terminal stdout
                  </strong>{" "}
                  to retrieve the generated recovery link.
                </p>
              </div>

              <Link to="/login" className="block w-full">
                <Button
                  variant="outline"
                  className="w-full py-6 text-base font-semibold border-slate-700 bg-slate-900/50 hover:bg-slate-800 text-slate-300 transition-colors rounded-xl"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Return to Login
                </Button>
              </Link>
            </div>
          ) : (
            /* Input State */
            <form className="space-y-8" onSubmit={handleSubmit}>
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
                    type="email"
                    autoComplete="email"
                    placeholder="admin@organization.com"
                    className="pl-12 bg-slate-950/50 border-slate-700 focus:border-rose-500 focus:ring-rose-500/20 h-12 transition-all"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={status === "loading"}
                  />
                </div>
              </div>

              {/* Submission Matrix */}
              <div className="pt-2">
                <Button
                  type="submit"
                  variant="primary"
                  className="w-full flex justify-center items-center py-6 text-base font-semibold shadow-lg hover:shadow-rose-500/20 transition-all rounded-xl gap-2"
                  disabled={status === "loading" || !email}
                >
                  {status === "loading" ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Initiating Protocol...
                    </>
                  ) : (
                    <>
                      <Send className="h-5 w-5" />
                      Transmit Recovery Link
                    </>
                  )}
                </Button>
              </div>

              {/* Alternate Routing */}
              <div className="mt-8 text-center pt-2">
                <Link
                  to="/login"
                  className="inline-flex items-center text-sm font-semibold text-slate-400 hover:text-rose-400 transition-colors"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Return to secure login
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
