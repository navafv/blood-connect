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

  // Email from Router State
  const email = location.state?.email;

  // UI State
  const [otp, setOtp] = useState("");
  const [status, setStatus] = useState("idle");
  const [countdown, setCountdown] = useState(30);
  const [isResending, setIsResending] = useState(false);

  // Countdown Timer
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // Redirect if email missing
  if (!email) {
    return <Navigate to="/register-org" replace />;
  }

  // OTP Input
  const handleChange = (e) => {
    const value = e.target.value.replace(/\D/g, "").slice(0, 6);
    setOtp(value);
  };

  // Submit
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (otp.length !== 6) {
      toast.error("Verification code must contain 6 digits");
      return;
    }

    setStatus("loading");

    try {
      await api.post("/auth/verify-email/", {
        email,
        otp,
      });

      setStatus("success");
      toast.success("Email verified successfully");

      setTimeout(() => {
        navigate("/login", {
          state: {
            message:
              "Email verified successfully. Your account is pending administrator approval.",
          },
        });
      }, 3500);
    } catch (err) {
      console.error("Verification Error:", err);
      setStatus("idle");
      toast.error(
        err.response?.data?.error ||
          err.response?.data?.detail ||
          "Invalid or expired verification code",
      );
    }
  };

  // Resend OTP
  const handleResend = async () => {
    setIsResending(true);

    try {
      await api.post("/auth/resend-otp/", {
        email,
      });

      setCountdown(60);
      setOtp("");
      toast.success("A new verification code has been sent");
    } catch (err) {
      console.error("Resend Error:", err);
      toast.error(
        err.response?.data?.error || "Unable to resend verification code",
      );
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10 relative overflow-hidden transition-colors duration-300 bg-slate-50 dark:bg-slate-950">
      {/* Ambient Background */}
      <div
        className="absolute top-[-10%] right-[-5%] w-120 h-120 rounded-full blur-[120px] pointer-events-none transition-colors duration-300 bg-emerald-500/10 dark:bg-emerald-600/15"
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
            className="group flex items-center justify-center h-16 w-16 rounded-2xl border transition-all duration-300 shadow-md bg-white border-slate-200 hover:border-emerald-300 dark:bg-slate-900 dark:border-slate-800 dark:shadow-2xl dark:hover:border-emerald-500/40"
          >
            <Droplet className="h-8 w-8 transition-transform duration-300 group-hover:scale-110 text-rose-600 dark:text-rose-500" />
          </Link>

          <h1 className="mt-6 text-3xl font-extrabold tracking-tight text-center transition-colors duration-300 text-slate-900 dark:text-white">
            Verify Your Email
          </h1>

          <p className="mt-3 text-sm text-center leading-relaxed max-w-sm transition-colors duration-300 text-slate-600 dark:text-slate-400">
            Enter the 6-digit verification code sent to your email address.
          </p>
        </div>

        {/* Card */}
        <Card className="backdrop-blur-xl border rounded-3xl shadow-xl overflow-hidden transition-colors duration-300 bg-white/80 border-slate-200 dark:bg-slate-900/60 dark:border-slate-800/80 dark:shadow-2xl">
          {status === "success" ? (
            <CardContent className="pt-12 pb-12 flex flex-col items-center text-center animate-in fade-in zoom-in duration-500">
              <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full border mb-6 relative transition-colors duration-300 bg-emerald-50 border-emerald-200 dark:bg-emerald-500/10 dark:border-emerald-500/20">
                <div className="absolute inset-0 rounded-full blur-md animate-pulse transition-colors duration-300 bg-emerald-200/50 dark:bg-emerald-500/20" />
                <CheckCircle2 className="h-12 w-12 relative z-10 transition-colors duration-300 text-emerald-600 dark:text-emerald-500" />
              </div>

              <h2 className="text-3xl font-bold mb-3 transition-colors duration-300 text-slate-900 dark:text-white">
                Email Verified
              </h2>

              <p className="text-base leading-relaxed max-w-sm mx-auto mb-8 transition-colors duration-300 text-slate-600 dark:text-slate-400">
                Your email address has been verified successfully. Redirecting
                you to login...
              </p>

              <div className="flex items-center gap-3 px-5 py-3 rounded-xl border transition-colors duration-300 bg-slate-50 border-slate-200 dark:bg-slate-950/50 dark:border-slate-800">
                <Loader2 className="h-4 w-4 animate-spin transition-colors duration-300 text-emerald-600 dark:text-emerald-500" />
                <span className="text-sm font-medium transition-colors duration-300 text-slate-700 dark:text-slate-300">
                  Redirecting...
                </span>
              </div>
            </CardContent>
          ) : (
            <>
              {/* Header */}
              <CardHeader className="text-center border-b pt-10 pb-6 transition-colors duration-300 border-slate-200 dark:border-slate-800/50">
                <div className="mx-auto h-16 w-16 rounded-2xl border flex items-center justify-center mb-4 transition-colors duration-300 bg-emerald-50 border-emerald-200 dark:bg-emerald-500/10 dark:border-emerald-500/20">
                  <MailCheck className="h-8 w-8 transition-colors duration-300 text-emerald-600 dark:text-emerald-500" />
                </div>
                <CardTitle className="text-2xl font-extrabold tracking-tight transition-colors duration-300 text-slate-900 dark:text-white">
                  Email Verification
                </CardTitle>
                <p className="mt-3 text-sm leading-relaxed px-2 transition-colors duration-300 text-slate-600 dark:text-slate-400">
                  We sent a verification code to
                  <br />
                  <span className="font-medium break-all transition-colors duration-300 text-slate-900 dark:text-slate-200">
                    {email}
                  </span>
                </p>
              </CardHeader>

              {/* Form */}
              <CardContent className="pt-8 px-8 pb-8">
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider transition-colors duration-300 text-slate-600 dark:text-slate-400">
                      Verification Code
                    </label>
                    <div className="relative group">
                      <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 h-6 w-6 transition-colors duration-300 text-slate-400 group-focus-within:text-emerald-600 dark:text-slate-500 dark:group-focus-within:text-emerald-500" />

                      <Input
                        type="text"
                        autoComplete="one-time-code"
                        placeholder="000000"
                        maxLength={6}
                        required
                        autoFocus
                        value={otp}
                        onChange={handleChange}
                        className="pl-14 h-14 text-center text-3xl tracking-[0.5em] font-mono font-bold transition-all duration-300 focus:border-emerald-500 focus:ring-emerald-500/20 dark:focus:border-emerald-500 dark:focus:ring-emerald-500/20"
                      />
                    </div>
                  </div>

                  <div className="pt-2">
                    {/* Note: Deliberately overriding primary styles here to use Emerald for verification success context */}
                    <Button
                      type="submit"
                      disabled={status === "loading" || otp.length !== 6}
                      className="w-full py-6 text-base font-semibold rounded-xl text-white shadow-md hover:shadow-lg transition-all gap-2 bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-500 dark:shadow-lg dark:hover:shadow-emerald-500/20"
                    >
                      {status === "loading" ? (
                        <>
                          <Loader2 className="h-5 w-5 animate-spin" />
                          Verifying...
                        </>
                      ) : (
                        <>
                          Verify Email
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

        {/* Resend Action */}
        {status !== "success" && (
          <div className="mt-6 backdrop-blur-md border rounded-2xl p-5 text-center shadow-sm transition-colors duration-300 bg-white/60 border-slate-200 dark:bg-slate-900/40 dark:border-slate-800/60 dark:shadow-none">
            <p className="text-sm mb-3 transition-colors duration-300 text-slate-600 dark:text-slate-400">
              Didn’t receive the verification code?
            </p>
            <button
              onClick={handleResend}
              disabled={countdown > 0 || isResending}
              className={`inline-flex items-center gap-2 text-sm font-semibold transition-colors duration-300 ${
                countdown > 0
                  ? "text-slate-400 cursor-not-allowed dark:text-slate-500"
                  : "text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300"
              }`}
            >
              {isResending ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : countdown > 0 ? (
                `Resend available in ${countdown}s`
              ) : (
                <>
                  <RefreshCw className="h-4 w-4" />
                  Resend Code
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
