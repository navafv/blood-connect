import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  Droplet,
  MailCheck,
  ShieldCheck,
  ArrowRight,
  Loader2,
  RefreshCw,
  CheckCircle2,
} from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "../../components/ui/Card";
import { Input } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";

export default function VerifyEmail() {
  const navigate = useNavigate();
  const [otp, setOtp] = useState("");
  const [status, setStatus] = useState("idle"); // 'idle' | 'loading' | 'success' | 'error'
  const [errorMessage, setErrorMessage] = useState("");
  const [countdown, setCountdown] = useState(30);
  const [isResending, setIsResending] = useState(false);

  // Handle countdown timer for the resend button
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleChange = (e) => {
    // Only allow numbers and limit to 6 characters
    const value = e.target.value.replace(/\D/g, "").slice(0, 6);
    setOtp(value);
    if (status === "error") setStatus("idle");
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (otp.length !== 6) {
      setStatus("error");
      setErrorMessage("Please enter a valid 6-digit verification code.");
      return;
    }

    setStatus("loading");
    setErrorMessage("");

    // Mock API call to verify the OTP
    setTimeout(() => {
      if (otp === "123456") {
        // Mock "incorrect" code for testing error state
        setStatus("error");
        setErrorMessage("Invalid or expired code. Please try again.");
      } else {
        setStatus("success");
        // Redirect to dashboard after showing success state
        setTimeout(() => {
          navigate("/admin");
        }, 2000);
      }
    }, 1500);
  };

  const handleResend = () => {
    setIsResending(true);

    // Mock API call to resend email
    setTimeout(() => {
      setIsResending(false);
      setCountdown(30); // Reset timer to 30 seconds
      setOtp("");
      setStatus("idle");
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4 relative overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-emerald-600/20 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-96 h-96 bg-blue-600/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Main Container */}
      <div className="w-full max-w-md z-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
        {/* Logo Header */}
        <div className="flex flex-col items-center mb-8">
          <Link
            to="/"
            className="flex items-center gap-2 text-rose-500 hover:text-rose-400 transition-colors mb-2"
          >
            <Droplet className="h-10 w-10 fill-current" />
            <span className="text-3xl font-bold text-white tracking-tight">
              BloodConnect
            </span>
          </Link>
          <p className="text-slate-400 text-sm">Organization Security</p>
        </div>

        <Card className="border-slate-800 shadow-2xl bg-slate-900/80 backdrop-blur-xl">
          {status === "success" ? (
            /* --- Success State --- */
            <CardContent className="pt-8 pb-8 flex flex-col items-center text-center animate-in fade-in zoom-in-95 duration-500">
              <div className="h-16 w-16 bg-emerald-500/10 rounded-full flex items-center justify-center mb-6 border border-emerald-500/20">
                <CheckCircle2 className="h-8 w-8 text-emerald-500" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">
                Email Verified!
              </h3>
              <p className="text-slate-400 text-sm mb-2 px-4">
                Your organization account has been successfully verified and
                activated.
              </p>
              <p className="text-xs text-slate-500 animate-pulse">
                Redirecting to your dashboard...
              </p>
            </CardContent>
          ) : (
            /* --- Form State --- */
            <>
              <CardHeader className="text-center pb-2">
                <div className="mx-auto h-12 w-12 bg-emerald-500/10 rounded-full flex items-center justify-center mb-4 border border-emerald-500/20">
                  <MailCheck className="h-6 w-6 text-emerald-500" />
                </div>
                <CardTitle className="text-2xl font-bold">
                  Verify Your Email
                </CardTitle>
                <p className="text-sm text-slate-400 mt-2 px-2">
                  We've sent a 6-digit verification code to your organization's
                  email address.
                </p>
              </CardHeader>

              <CardContent className="pt-6">
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Error Message */}
                  {status === "error" && (
                    <div className="p-3 text-sm text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-lg animate-in fade-in flex items-center gap-2">
                      <ShieldCheck className="h-4 w-4 shrink-0" />
                      <span>{errorMessage}</span>
                    </div>
                  )}

                  {/* OTP Input */}
                  <div className="space-y-2">
                    <Input
                      type="text"
                      placeholder="• • • • • •"
                      className="py-6 text-center text-3xl tracking-[1em] font-mono bg-slate-950/50 placeholder:tracking-normal placeholder:text-lg focus:ring-emerald-500"
                      value={otp}
                      onChange={handleChange}
                      required
                      autoFocus
                    />
                  </div>

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    variant="primary"
                    className="w-full py-5 text-base font-semibold transition-all"
                    disabled={status === "loading" || otp.length !== 6}
                  >
                    {status === "loading" ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Verifying...
                      </>
                    ) : (
                      <>
                        Verify Account
                        <ArrowRight className="ml-2 h-5 w-5" />
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </>
          )}
        </Card>

        {/* Resend Code Footer */}
        {status !== "success" && (
          <div className="mt-8 text-center space-y-4">
            <p className="text-sm text-slate-400">Didn't receive the code?</p>
            <button
              onClick={handleResend}
              disabled={countdown > 0 || isResending}
              className={`inline-flex items-center gap-2 text-sm font-medium transition-colors ${
                countdown > 0
                  ? "text-slate-500 cursor-not-allowed"
                  : "text-emerald-500 hover:text-emerald-400"
              }`}
            >
              {isResending ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : countdown > 0 ? (
                `Resend code in ${countdown}s`
              ) : (
                <>
                  <RefreshCw className="h-4 w-4" />
                  Resend Code Now
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
