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

  // Extract the secure tokens from the URL
  const uid = searchParams.get("uid");
  const token = searchParams.get("token");

  const [status, setStatus] = useState("idle"); // 'idle' | 'loading' | 'success' | 'error' | 'invalid_link'
  const [errorMessage, setErrorMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    password: "",
    confirmPassword: "",
  });

  // Check if the link is missing the required parameters
  useEffect(() => {
    if (!uid || !token) {
      setStatus("invalid_link");
    }
  }, [uid, token]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (status === "error") setStatus("idle");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.password.length < 6) {
      setStatus("error");
      setErrorMessage("Password must be at least 6 characters long.");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setStatus("error");
      setErrorMessage("Passwords do not match. Please try again.");
      return;
    }

    setStatus("loading");
    setErrorMessage("");

    try {
      // Send the tokens and new password to Django
      await api.post("/auth/password-reset-confirm/", {
        uid: uid,
        token: token,
        new_password: formData.password,
      });

      setStatus("success");

      // Automatically redirect to login after 3 seconds
      setTimeout(() => {
        navigate("/login");
      }, 3000);
    } catch (err) {
      console.error(err);
      setStatus("error");
      setErrorMessage(
        err.response?.data?.error ||
          "This reset link is invalid or has expired. Please request a new one.",
      );
    }
  };

  // --- UI FOR MISSING/INVALID LINK ---
  if (status === "invalid_link") {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4">
        <Card className="max-w-md w-full border-slate-800 bg-slate-900/80 p-8 text-center">
          <AlertCircle className="h-12 w-12 text-rose-500 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-white mb-2">
            Invalid Reset Link
          </h3>
          <p className="text-slate-400 text-sm mb-6">
            This password reset link is missing or broken. Please request a new
            link from the forgot password page.
          </p>
          <Link to="/forgot-password">
            <Button variant="primary" className="w-full">
              Request New Link
            </Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4 relative overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-rose-600/20 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-emerald-600/10 rounded-full blur-[100px] pointer-events-none" />

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
          <p className="text-slate-400 text-sm">Secure Account Recovery</p>
        </div>

        <Card className="border-slate-800 shadow-2xl bg-slate-900/80 backdrop-blur-xl">
          {status === "success" ? (
            /* --- Success State --- */
            <CardContent className="pt-8 pb-8 flex flex-col items-center text-center animate-in fade-in zoom-in-95 duration-500">
              <div className="h-16 w-16 bg-emerald-500/10 rounded-full flex items-center justify-center mb-6 border border-emerald-500/20">
                <CheckCircle2 className="h-8 w-8 text-emerald-500" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">
                Password Updated!
              </h3>
              <p className="text-slate-400 text-sm mb-8 px-4">
                Your organization's password has been successfully changed. You
                will be redirected to the login page momentarily.
              </p>
              <Button
                variant="primary"
                className="w-full py-5"
                onClick={() => navigate("/login")}
              >
                Go to Login Now
              </Button>
            </CardContent>
          ) : (
            /* --- Form State --- */
            <>
              <CardHeader className="text-center pb-2">
                <div className="mx-auto h-12 w-12 bg-rose-500/10 rounded-full flex items-center justify-center mb-4 border border-rose-500/20">
                  <ShieldCheck className="h-6 w-6 text-rose-500" />
                </div>
                <CardTitle className="text-2xl font-bold">
                  Create New Password
                </CardTitle>
                <p className="text-sm text-slate-400 mt-2 px-2">
                  Please enter a strong password for your account.
                </p>
              </CardHeader>

              <CardContent className="pt-6">
                <form onSubmit={handleSubmit} className="space-y-5">
                  {/* Error Message */}
                  {status === "error" && (
                    <div className="p-3 text-sm text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-lg animate-in fade-in">
                      {errorMessage}
                    </div>
                  )}

                  {/* New Password Input */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-300">
                      New Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
                      <Input
                        type={showPassword ? "text" : "password"}
                        name="password"
                        placeholder="••••••••"
                        className="pl-10 pr-10 py-5 bg-slate-950/50"
                        value={formData.password}
                        onChange={handleChange}
                        required
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                      >
                        {showPassword ? (
                          <EyeOff className="h-5 w-5" />
                        ) : (
                          <Eye className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Confirm Password Input */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-300">
                      Confirm New Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
                      <Input
                        type={showPassword ? "text" : "password"}
                        name="confirmPassword"
                        placeholder="••••••••"
                        className="pl-10 py-5 bg-slate-950/50"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        required
                      />
                    </div>
                  </div>

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    variant="primary"
                    className="w-full py-5 mt-2 text-base font-semibold transition-all hover:shadow-[0_0_20px_rgba(225,29,72,0.4)]"
                    disabled={status === "loading"}
                  >
                    {status === "loading" ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Saving Password...
                      </>
                    ) : (
                      <>
                        Reset Password
                        <ArrowRight className="ml-2 h-5 w-5" />
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
