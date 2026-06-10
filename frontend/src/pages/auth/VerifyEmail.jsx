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
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4 py-10 relative overflow-hidden">
      <div
        className="absolute top-[-10%] right-[-5%] w-md h-112 bg-emerald-600/15 rounded-full blur-[120px] pointer-events-none"
        aria-hidden="true"
      />
      <div
        className="absolute bottom-[-10%] left-[-5%] w-md h-112 bg-blue-600/10 rounded-full blur-[120px] pointer-events-none"
        aria-hidden="true"
      />
      <div className="w-full max-w-md relative z-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
        <div className="flex flex-col items-center mb-8">
          <Link
            to="/"
            className="group flex items-center justify-center h-16 w-16 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl transition-all duration-300 hover:border-emerald-500/40"
          >
            <Droplet className="h-8 w-8 text-rose-500 transition-transform duration-300 group-hover:scale-110" />
          </Link>

          <h1 className="mt-6 text-3xl font-extrabold tracking-tight text-white text-center">
            Verify Your Email
          </h1>

          <p className="mt-3 text-sm text-slate-400 text-center leading-relaxed max-w-sm">
            Enter the 6-digit verification code sent to your email address.
          </p>
        </div>

        <Card className="border-slate-800/80 bg-slate-900/60 backdrop-blur-xl shadow-2xl rounded-3xl overflow-hidden">
          {status === "success" ? (
            <CardContent className="pt-12 pb-12 flex flex-col items-center text-center animate-in fade-in zoom-in duration-500">
              <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-emerald-500/10 border border-emerald-500/20 mb-6 relative">
                <div className="absolute inset-0 bg-emerald-500/20 rounded-full blur-md animate-pulse" />
                <CheckCircle2 className="h-12 w-12 text-emerald-500 relative z-10" />
              </div>

              <h2 className="text-3xl font-bold text-white mb-3">
                Email Verified
              </h2>

              <p className="text-slate-400 text-base leading-relaxed max-w-sm mx-auto mb-8">
                Your email address has been verified successfully. Redirecting
                you to login...
              </p>

              <div className="flex items-center gap-3 px-5 py-3 rounded-xl bg-slate-950/50 border border-slate-800">
                <Loader2 className="h-4 w-4 text-emerald-500 animate-spin" />
                <span className="text-sm text-slate-300 font-medium">
                  Redirecting...
                </span>
              </div>
            </CardContent>
          ) : (
            <>
              <CardHeader className="text-center border-b border-slate-800/50 pt-10 pb-6">
                <div className="mx-auto h-16 w-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-4">
                  <MailCheck className="h-8 w-8 text-emerald-500" />
                </div>
                <CardTitle className="text-2xl font-extrabold tracking-tight text-white">
                  Email Verification
                </CardTitle>
                <p className="mt-3 text-sm text-slate-400 leading-relaxed px-2">
                  We sent a verification code to
                  <br />
                  <span className="text-slate-200 font-medium break-all">
                    {email}
                  </span>
                </p>
              </CardHeader>

              <CardContent className="pt-8 px-8 pb-8">
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Verification Code
                    </label>
                    <div className="relative group">
                      <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 h-6 w-6 text-slate-500 transition-colors group-focus-within:text-emerald-500" />
                      <Input
                        type="text"
                        autoComplete="one-time-code"
                        placeholder="000000"
                        maxLength={6}
                        required
                        autoFocus
                        value={otp}
                        onChange={handleChange}
                        className="pl-14 h-14 text-center text-3xl tracking-[0.5em] font-mono font-bold bg-slate-950/50 border-slate-700 focus:border-emerald-500 focus:ring-emerald-500/20 transition-all"
                      />
                    </div>
                  </div>

                  <div className="pt-2">
                    <Button
                      type="submit"
                      variant="primary"
                      disabled={status === "loading" || otp.length !== 6}
                      className="w-full py-6 text-base font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-500 shadow-lg hover:shadow-emerald-500/20 transition-all gap-2"
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

        {status !== "success" && (
          <div className="mt-6 bg-slate-900/40 backdrop-blur-md border border-slate-800/60 rounded-2xl p-5 text-center">
            <p className="text-sm text-slate-400 mb-3">
              Didn’t receive the verification code?
            </p>
            <button
              onClick={handleResend}
              disabled={countdown > 0 || isResending}
              className={`inline-flex items-center gap-2 text-sm font-semibold transition-all ${
                countdown > 0
                  ? "text-slate-500 cursor-not-allowed"
                  : "text-emerald-400 hover:text-emerald-300"
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
