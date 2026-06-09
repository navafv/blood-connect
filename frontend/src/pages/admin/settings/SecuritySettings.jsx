import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ShieldCheck,
  ShieldAlert,
  Key,
  Smartphone,
  Loader2,
} from "lucide-react";
import toast from "react-hot-toast";

import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "../../../components/ui/Card";
import { Button } from "../../../components/ui/Button";
import { Input } from "../../../components/ui/Input";
import { Modal } from "../../../components/ui/Modal";
import api from "../../../lib/axios";

export default function SecuritySettings() {
  const queryClient = useQueryClient();
  const [isSetupModalOpen, setIsSetupModalOpen] = useState(false);
  const [qrUri, setQrUri] = useState("");
  const [verificationCode, setVerificationCode] = useState("");

  const [passwords, setPasswords] = useState({
    old_password: "",
    new_password: "",
    confirm_password: "",
  });

  // Fetch Current Security Status
  const { data: securityData, isLoading } = useQuery({
    queryKey: ["security-status"],
    queryFn: async () => (await api.get("/auth/security/")).data,
  });

  // --- Password Change Engine ---
  const passwordMutation = useMutation({
    mutationFn: async (payload) => api.post("/auth/security/", payload),
    onSuccess: () => {
      toast.success("Password updated securely.");
      setPasswords({
        old_password: "",
        new_password: "",
        confirm_password: "",
      });
    },
    onError: (err) =>
      toast.error(err.response?.data?.error || "Failed to update password."),
  });

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    if (passwords.new_password !== passwords.confirm_password) {
      return toast.error("New passwords do not match.");
    }
    passwordMutation.mutate({
      old_password: passwords.old_password,
      new_password: passwords.new_password,
    });
  };

  // --- 2FA Engine ---
  const initiate2FAMutation = useMutation({
    mutationFn: async () => api.post("/auth/2fa/setup/"),
    onSuccess: (res) => {
      setQrUri(res.data.qr_uri);
      setIsSetupModalOpen(true);
    },
  });

  const toggle2FAMutation = useMutation({
    mutationFn: async (payload) => api.post("/auth/2fa/toggle/", payload),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["security-status"] });
      toast.success(res.data.message);
      setIsSetupModalOpen(false);
      setVerificationCode("");
    },
    onError: (err) =>
      toast.error(err.response?.data?.error || "Failed to alter 2FA status."),
  });

  if (isLoading)
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-rose-500" />
      </div>
    );

  const is2FAEnabled = securityData?.is_2fa_enabled;

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6 animate-in fade-in pb-24">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
          <div className="p-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20">
            <ShieldCheck className="h-5 w-5 text-blue-500" />
          </div>
          Account Security
        </h1>
        <p className="text-sm text-slate-400 mt-2">
          Manage your authentication methods and secure your administrative
          access.
        </p>
      </div>

      {/* --- 2FA Card --- */}
      <Card className="bg-slate-900/40 border-slate-800/80 shadow-xl">
        <CardHeader className="border-b border-slate-800/60 pb-5">
          <CardTitle className="text-lg text-white flex items-center gap-2">
            <Smartphone className="h-5 w-5 text-slate-400" /> Two-Factor
            Authentication
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            {is2FAEnabled ? (
              <>
                <div className="h-12 w-12 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                  <ShieldCheck className="h-6 w-6 text-emerald-500" />
                </div>
                <div>
                  <p className="font-bold text-emerald-400">2FA is ENABLED</p>
                  <p className="text-sm text-slate-400">
                    Your account is heavily protected.
                  </p>
                </div>
              </>
            ) : (
              <>
                <div className="h-12 w-12 rounded-full bg-amber-500/10 flex items-center justify-center border border-amber-500/20">
                  <ShieldAlert className="h-6 w-6 text-amber-500" />
                </div>
                <div>
                  <p className="font-bold text-amber-400">2FA is DISABLED</p>
                  <p className="text-sm text-slate-400">
                    Enable 2FA to protect medical data.
                  </p>
                </div>
              </>
            )}
          </div>
          <Button
            variant={is2FAEnabled ? "outline" : "primary"}
            className={
              is2FAEnabled
                ? "border-slate-700 text-rose-400 hover:text-rose-300"
                : "bg-blue-600 font-bold"
            }
            onClick={() =>
              is2FAEnabled
                ? toggle2FAMutation.mutate({ action: "disable" })
                : initiate2FAMutation.mutate()
            }
            disabled={
              initiate2FAMutation.isPending || toggle2FAMutation.isPending
            }
          >
            {is2FAEnabled ? "Disable 2FA" : "Set up 2FA"}
          </Button>
        </CardContent>
      </Card>

      {/* --- Password Card --- */}
      <Card className="bg-slate-900/40 border-slate-800/80 shadow-xl">
        <CardHeader className="border-b border-slate-800/60 pb-5">
          <CardTitle className="text-lg text-white flex items-center gap-2">
            <Key className="h-5 w-5 text-slate-400" /> Change Password
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <form onSubmit={handlePasswordSubmit} className="max-w-md space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase text-slate-400">
                Current Password
              </label>
              <Input
                type="password"
                required
                value={passwords.old_password}
                onChange={(e) =>
                  setPasswords({ ...passwords, old_password: e.target.value })
                }
                className="bg-slate-950/50 border-slate-700"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase text-slate-400">
                New Password
              </label>
              <Input
                type="password"
                required
                value={passwords.new_password}
                onChange={(e) =>
                  setPasswords({ ...passwords, new_password: e.target.value })
                }
                className="bg-slate-950/50 border-slate-700"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase text-slate-400">
                Confirm New Password
              </label>
              <Input
                type="password"
                required
                value={passwords.confirm_password}
                onChange={(e) =>
                  setPasswords({
                    ...passwords,
                    confirm_password: e.target.value,
                  })
                }
                className="bg-slate-950/50 border-slate-700"
              />
            </div>
            <Button
              type="submit"
              variant="outline"
              className="w-full mt-2"
              disabled={passwordMutation.isPending}
            >
              {passwordMutation.isPending ? "Updating..." : "Update Password"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* --- 2FA Setup Modal --- */}
      <Modal
        isOpen={isSetupModalOpen}
        onClose={() => setIsSetupModalOpen(false)}
        title="Configure Authenticator"
      >
        <div className="space-y-6">
          <p className="text-sm text-slate-300 leading-relaxed text-center">
            Scan the QR code below using an authenticator app (like Google
            Authenticator or Authy).
          </p>
          <div className="flex justify-center p-4 bg-white rounded-xl mx-auto w-fit">
            {/* Serverless QR Code rendering! */}
            <img
              src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrUri)}`}
              alt="2FA QR Code"
              className="w-48 h-48"
            />
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              toggle2FAMutation.mutate({
                action: "enable",
                code: verificationCode,
              });
            }}
            className="space-y-4 pt-4 border-t border-slate-800"
          >
            <Input
              type="text"
              maxLength={6}
              required
              value={verificationCode}
              onChange={(e) =>
                setVerificationCode(e.target.value.replace(/\D/g, ""))
              }
              className="bg-slate-950/50 text-center text-3xl font-mono h-14"
              placeholder="000000"
            />
            <Button
              type="submit"
              variant="primary"
              className="w-full font-bold shadow-lg"
              disabled={
                toggle2FAMutation.isPending || verificationCode.length !== 6
              }
            >
              {toggle2FAMutation.isPending ? (
                <Loader2 className="animate-spin h-5 w-5" />
              ) : (
                "Verify & Enable"
              )}
            </Button>
          </form>
        </div>
      </Modal>
    </div>
  );
}
