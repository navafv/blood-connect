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

/**
 * Credential Re-issuance Boundary
 * Finalizes the password reset protocol by consuming secure URL tokens
 * and transmitting the cryptographically updated credential payload.
 */
export default function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Extract cryptographic identifiers from the routing parameters
  const uid = searchParams.get("uid");
  const token = searchParams.get("token");

  // --- UI Transition State ---
  const [status, setStatus] = useState("idle"); // 'idle' | 'loading' | 'success' | 'invalid_link'
  const [showPassword, setShowPassword] = useState(false);

  // --- Payload State ---
  const [formData, setFormData] = useState({
    password: "",
    confirmPassword: "",
  });

  /**
   * Pre-flight Validation
   * Ensures the requisite cryptographic parameters are present before rendering
   * the mutation interface.
   */
  useEffect(() => {
    if (!uid || !token) {
      setStatus("invalid_link");
    }
  }, [uid, token]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  /**
   * Credential Dispatch
   * Validates the payload locally before attempting a network mutation.
   */
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Client-side Policy Enforcement
    if (formData.password.length < 8) {
      toast.error(
        "Password must meet minimum length requirements (8 characters).",
      );
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error(
        "Cryptographic mismatch. Please ensure passwords match exactly.",
      );
      return;
    }

    setStatus("loading");

    try {
      await api.post("/auth/password-reset-confirm/", {
        uid: uid,
        token: token,
        new_password: formData.password,
      });

      setStatus("success");
      toast.success("Credential updated securely.");

      // Graceful routing delay to allow user to read the success state
      setTimeout(() => {
        navigate("/login");
      }, 3000);
    } catch (err) {
      console.error("Re-issuance Failure:", err);
      setStatus("idle");
      toast.error(
        err.response?.data?.error ||
          err.response?.data?.detail ||
          "The security token is invalid or has expired. Please request a new recovery link.",
      );
    }
  };

  // --- FAULT TOLERANCE: MISSING/EXPIRED LINK STATE ---
  if (status === "invalid_link") {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4 relative overflow-hidden">
        <div
          className="absolute top-[-10%] left-[-10%] w-100 h-100 bg-rose-600/10 rounded-full blur-[100px] pointer-events-none"
          aria-hidden="true"
        />

        <Card className="max-w-md w-full border-slate-800/80 bg-slate-900/60 backdrop-blur-xl p-10 text-center shadow-2xl relative z-10 animate-in fade-in zoom-in-95 duration-500">
          <div className="mx-auto h-20 w-20 bg-rose-500/10 rounded-2xl flex items-center justify-center mb-6 border border-rose-500/20">
            <AlertCircle className="h-10 w-10 text-rose-500" />
          </div>
          <h3 className="text-2xl font-bold text-white mb-3 tracking-tight">
            Invalid Recovery Link
          </h3>
          <p className="text-slate-400 text-base mb-8 leading-relaxed">
            The cryptographic parameters in this URL are missing, malformed, or
            have expired. For your security, you must generate a fresh request.
          </p>
          <Link to="/forgot-password" className="block w-full">
            <Button
              variant="primary"
              className="w-full py-6 text-base font-semibold shadow-lg"
            >
              Request New Link
            </Button>
          </Link>
        </Card>
      </div>
    );
  }

  // --- NOMINAL STATE: RESET INTERFACE ---
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4 relative overflow-hidden">
      {/* --- Ambient Environmental Glows --- */}
      <div
        className="absolute top-[-10%] left-[-10%] w-100 h-100 bg-rose-600/15 rounded-full blur-[100px] pointer-events-none"
        aria-hidden="true"
      />
      <div
        className="absolute bottom-[-10%] right-[-10%] w-100 h-100 bg-emerald-600/10 rounded-full blur-[100px] pointer-events-none"
        aria-hidden="true"
      />

      {/* --- Main Workspace --- */}
      <div className="w-full max-w-md z-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
        {/* Header */}
        <div className="flex flex-col items-center mb-8">
          <Link
            to="/"
            className="flex items-center justify-center h-16 w-16 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl group hover:border-rose-500/30 transition-all duration-300 mb-4"
          >
            <Droplet className="h-8 w-8 text-rose-500 drop-shadow-[0_0_8px_rgba(225,29,72,0.5)] group-hover:scale-110 transition-transform duration-300" />
          </Link>
          <p className="text-slate-400 text-sm uppercase tracking-widest font-semibold">
            Secure Account Recovery
          </p>
        </div>

        <Card className="border-slate-800/80 shadow-2xl bg-slate-900/60 backdrop-blur-xl rounded-3xl overflow-hidden">
          {status === "success" ? (
            /* --- Post-Mutation Success State --- */
            <CardContent className="pt-12 pb-12 flex flex-col items-center text-center animate-in fade-in zoom-in-95 duration-500">
              <div className="h-20 w-20 bg-emerald-500/10 rounded-full flex items-center justify-center mb-6 border border-emerald-500/20 relative">
                <div className="absolute inset-0 bg-emerald-500/20 rounded-full blur-md animate-pulse" />
                <CheckCircle2 className="h-10 w-10 text-emerald-500 relative z-10" />
              </div>
              <h3 className="text-3xl font-bold text-white mb-3 tracking-tight">
                Credential Updated
              </h3>
              <p className="text-slate-400 text-base mb-8 px-4 leading-relaxed">
                Your administrative password has been securely updated. The
                system will route you to the authorization gateway momentarily.
              </p>
              <Button
                variant="primary"
                className="w-full py-6 text-base font-semibold shadow-lg"
                onClick={() => navigate("/login")}
              >
                Go to Login Now
              </Button>
            </CardContent>
          ) : (
            /* --- Form State --- */
            <>
              <CardHeader className="text-center pb-6 pt-10 border-b border-slate-800/50">
                <div className="mx-auto h-16 w-16 bg-rose-500/10 rounded-2xl flex items-center justify-center mb-4 border border-rose-500/20">
                  <ShieldCheck className="h-8 w-8 text-rose-500" />
                </div>
                <CardTitle className="text-2xl font-extrabold tracking-tight text-white">
                  Create New Password
                </CardTitle>
                <p className="text-sm text-slate-400 mt-2 px-2">
                  Deploy a strong cryptographic key to secure your
                  organization's registry.
                </p>
              </CardHeader>

              <CardContent className="pt-8 px-8 pb-8">
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Primary Password Field */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      New Password
                    </label>
                    <div className="relative group">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500 group-focus-within:text-rose-500 transition-colors" />
                      <Input
                        type={showPassword ? "text" : "password"}
                        name="password"
                        placeholder="••••••••"
                        autoComplete="new-password"
                        className="pl-12 pr-12 py-6 bg-slate-950/50 border-slate-700 focus:border-rose-500 focus:ring-rose-500/20 transition-all text-base"
                        value={formData.password}
                        onChange={handleChange}
                        required
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                        tabIndex="-1"
                        aria-label={
                          showPassword ? "Hide password" : "Show password"
                        }
                      >
                        {showPassword ? (
                          <EyeOff className="h-5 w-5" />
                        ) : (
                          <Eye className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Confirmation Field */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Confirm New Password
                    </label>
                    <div className="relative group">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500 group-focus-within:text-rose-500 transition-colors" />
                      <Input
                        type={showPassword ? "text" : "password"}
                        name="confirmPassword"
                        placeholder="••••••••"
                        autoComplete="new-password"
                        className="pl-12 py-6 bg-slate-950/50 border-slate-700 focus:border-rose-500 focus:ring-rose-500/20 transition-all text-base"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        required
                      />
                    </div>
                  </div>

                  {/* Submission Matrix */}
                  <div className="pt-4">
                    <Button
                      type="submit"
                      variant="primary"
                      className="w-full py-6 text-base font-semibold transition-all hover:shadow-[0_0_30px_rgba(225,29,72,0.3)] rounded-xl gap-2"
                      disabled={status === "loading"}
                    >
                      {status === "loading" ? (
                        <>
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                          Committing Key...
                        </>
                      ) : (
                        <>
                          Secure Account
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
