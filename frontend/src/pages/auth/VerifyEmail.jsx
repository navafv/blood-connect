import { useState, useEffect } from "react";
import { useNavigate, useLocation, Link, Navigate } from "react-router-dom";
import {
  Droplet,
  MailCheck,
  ShieldCheck,
  ArrowRight,
  Loader2,
  RefreshCw,
  CheckCircle2,
  Terminal,
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

export default function VerifyEmail() {
  const navigate = useNavigate();
  const location = useLocation();

  // Extract the target identity from the router state pipeline
  const email = location.state?.email;

  // --- UI Transition & Payload State ---
  const [otp, setOtp] = useState("");
  const [status, setStatus] = useState("idle"); // 'idle' | 'loading' | 'success'
  const [countdown, setCountdown] = useState(30);
  const [isResending, setIsResending] = useState(false);

  if (!email) {
    return <Navigate to="/register-org" replace />;
  }

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleChange = (e) => {
    // Restrict payload strictly to numeric characters, maximum 6 digits
    const value = e.target.value.replace(/\D/g, "").slice(0, 6);
    setOtp(value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (otp.length !== 6) {
      toast.error("Cryptographic mismatch: Token must be exactly 6 digits.");
      return;
    }

    setStatus("loading");

    try {
      await api.post("/auth/verify-email/", { email, otp });

      setStatus("success");
      toast.success("Identity verified successfully.");

      // Route to the holding/login gateway as the tenant awaits SuperAdmin provisioning
      setTimeout(() => {
        navigate("/login", {
          state: {
            message:
              "Email verified successfully! Your account is pending Super Admin approval. You will receive a notification once activated.",
          },
        });
      }, 3500);
    } catch (err) {
      console.error("Verification Failure:", err);
      setStatus("idle");
      toast.error(
        err.response?.data?.error ||
          err.response?.data?.detail ||
          "The security token is invalid or has expired. Please request a new one.",
      );
    }
  };

  const handleResend = async () => {
    setIsResending(true);
    setStatus("idle");

    try {
      await api.post("/auth/resend-otp/", { email });
      setCountdown(60); // Apply stricter cooldown on subsequent requests
      setOtp("");
      toast.success("A new secure token has been dispatched to your inbox.");
    } catch (err) {
      console.error("Re-issuance Failure:", err);
      toast.error(
        err.response?.data?.error ||
          "Failed to dispatch new token. Please verify network connectivity.",
      );
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4 relative overflow-hidden">
      {/* --- Ambient Environmental Glows --- */}
      <div
        className="absolute top-[-10%] right-[-10%] w-100 h-100 bg-emerald-600/15 rounded-full blur-[100px] pointer-events-none"
        aria-hidden="true"
      />
      <div
        className="absolute bottom-[-10%] left-[-10%] w-100 h-100 bg-blue-600/10 rounded-full blur-[100px] pointer-events-none"
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
            Tenant Authorization Gate
          </p>
        </div>

        <Card className="border-slate-800/80 shadow-2xl bg-slate-900/60 backdrop-blur-xl rounded-3xl overflow-hidden">
          {status === "success" ? (
            /* --- Post-Verification Success State --- */
            <CardContent className="pt-12 pb-12 flex flex-col items-center text-center animate-in fade-in zoom-in-95 duration-500">
              <div className="h-20 w-20 bg-emerald-500/10 rounded-full flex items-center justify-center mb-6 border border-emerald-500/20 relative">
                <div className="absolute inset-0 bg-emerald-500/20 rounded-full blur-md animate-pulse" />
                <CheckCircle2 className="h-10 w-10 text-emerald-500 relative z-10" />
              </div>
              <h3 className="text-3xl font-bold text-white mb-3 tracking-tight">
                Identity Verified
              </h3>
              <p className="text-slate-400 text-base mb-6 px-4 leading-relaxed">
                Your organizational email has been successfully authenticated.
              </p>
              <div className="flex items-center gap-3 px-5 py-3 rounded-xl bg-slate-950/50 border border-slate-800 shadow-inner">
                <Loader2 className="h-4 w-4 text-emerald-500 animate-spin" />
                <span className="text-sm font-medium text-slate-300">
                  Routing to login portal...
                </span>
              </div>
            </CardContent>
          ) : (
            /* --- Form State --- */
            <>
              <CardHeader className="text-center pb-6 pt-10 border-b border-slate-800/50">
                <div className="mx-auto h-16 w-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center mb-4 border border-emerald-500/20">
                  <MailCheck className="h-8 w-8 text-emerald-500" />
                </div>
                <CardTitle className="text-2xl font-extrabold tracking-tight text-white">
                  Verify Your Email
                </CardTitle>
                <p className="text-sm text-slate-400 mt-3 px-4 leading-relaxed">
                  We have dispatched a 6-digit security token to <br />
                  <strong className="text-slate-200 font-medium">
                    {email}
                  </strong>
                </p>
              </CardHeader>

              <CardContent className="pt-8 px-8 pb-8">
                {/* Developer Environment Alert */}
                <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 shadow-inner mb-6 text-left">
                  <div className="flex items-center gap-2 mb-2">
                    <Terminal className="h-4 w-4 text-emerald-500" />
                    <p className="text-xs font-bold uppercase tracking-wider text-emerald-500">
                      Developer Notice
                    </p>
                  </div>
                  <p className="text-sm text-slate-400 leading-relaxed">
                    Check your{" "}
                    <strong className="text-slate-300">
                      Django terminal stdout
                    </strong>{" "}
                    to retrieve the generated OTP token.
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-400 sr-only">
                      Verification Code
                    </label>
                    <div className="relative group">
                      <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 h-6 w-6 text-slate-500 group-focus-within:text-emerald-500 transition-colors" />
                      <Input
                        type="text"
                        name="otp"
                        autoComplete="one-time-code"
                        placeholder="• • • • • •"
                        className="pl-14 py-6 text-center text-3xl tracking-[0.5em] sm:tracking-[1em] font-mono font-bold bg-slate-950/50 border-slate-700 focus:border-emerald-500 focus:ring-emerald-500/20 transition-all placeholder:tracking-normal placeholder:font-sans placeholder:text-lg placeholder:font-normal"
                        value={otp}
                        onChange={handleChange}
                        maxLength={6}
                        required
                        autoFocus
                      />
                    </div>
                  </div>

                  {/* Submission Matrix */}
                  <div className="pt-2">
                    <Button
                      type="submit"
                      variant="primary"
                      className="w-full py-6 text-base font-semibold transition-all hover:shadow-[0_0_30px_rgba(16,185,129,0.2)] bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl gap-2"
                      disabled={status === "loading" || otp.length !== 6}
                    >
                      {status === "loading" ? (
                        <>
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                          Authenticating...
                        </>
                      ) : (
                        <>
                          Verify Identity
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

        {/* --- Throttle & Resend Control --- */}
        {status !== "success" && (
          <div className="mt-8 p-6 bg-slate-900/40 backdrop-blur-md rounded-3xl border border-slate-800/60 text-center space-y-3">
            <p className="text-sm font-medium text-slate-400">
              Did not receive the token?
            </p>
            <button
              onClick={handleResend}
              disabled={countdown > 0 || isResending}
              className={`inline-flex items-center gap-2 text-sm font-bold transition-all ${
                countdown > 0
                  ? "text-slate-500 cursor-not-allowed"
                  : "text-emerald-400 hover:text-emerald-300 hover:scale-105"
              }`}
            >
              {isResending ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" /> Dispatched...
                </>
              ) : countdown > 0 ? (
                `Re-issue allowed in ${countdown}s`
              ) : (
                <>
                  <RefreshCw className="h-4 w-4" /> Discard and Resend Code
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
