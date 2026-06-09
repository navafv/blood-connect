import React, { useState } from "react";
import { ShieldCheck, ShieldAlert, Key, Smartphone, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

import { Card, CardHeader, CardTitle, CardContent } from "../../../components/ui/Card";
import { Button } from "../../../components/ui/Button";
import { Input } from "../../../components/ui/Input";
import { Modal } from "../../../components/ui/Modal";
import api from "../../../lib/axios";

export default function SecuritySettings() {
  const [is2FAEnabled, setIs2FAEnabled] = useState(false); // Fetch from user profile in reality
  const [isSetupModalOpen, setIsSetupModalOpen] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);

  // Mock function for starting 2FA setup
  const initiate2FA = () => {
    setIsSetupModalOpen(true);
    // In production, API call to backend to generate TOTP secret and return QR code URL
  };

  const handleVerify2FA = (e) => {
    e.preventDefault();
    setIsVerifying(true);
    // Mock API Verification Delay
    setTimeout(() => {
      setIsVerifying(false);
      if (verificationCode === "123456") { // Mock success condition
        setIs2FAEnabled(true);
        setIsSetupModalOpen(false);
        toast.success("Two-Factor Authentication successfully enabled.");
      } else {
        toast.error("Invalid verification code. Try again.");
      }
    }, 1500);
  };

  const disable2FA = () => {
    if (window.confirm("Are you sure you want to disable 2FA? This decreases your account security.")) {
      setIs2FAEnabled(false);
      toast.success("Two-Factor Authentication disabled.");
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 pb-24">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
          <div className="p-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20">
            <ShieldCheck className="h-5 w-5 text-blue-500" />
          </div>
          Account Security
        </h1>
        <p className="text-sm text-slate-400 mt-2">Manage your authentication methods and secure your administrative access.</p>
      </div>

      <Card className="bg-slate-900/40 border-slate-800/80 shadow-xl">
        <CardHeader className="border-b border-slate-800/60 pb-5">
          <CardTitle className="text-lg text-white flex items-center gap-2">
            <Smartphone className="h-5 w-5 text-slate-400" /> Two-Factor Authentication (2FA)
          </CardTitle>
          {/* <CardDescription className="text-sm text-slate-400 mt-1">
            Add an extra layer of security to your account by requiring a time-based one-time password (TOTP) during login.
          </CardDescription> */}
        </CardHeader>
        <CardContent className="p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            {is2FAEnabled ? (
              <>
                <div className="h-12 w-12 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                  <ShieldCheck className="h-6 w-6 text-emerald-500" />
                </div>
                <div>
                  <p className="font-bold text-emerald-400">2FA is currently ENABLED</p>
                  <p className="text-sm text-slate-400">Your account is heavily protected against unauthorized access.</p>
                </div>
              </>
            ) : (
              <>
                <div className="h-12 w-12 rounded-full bg-amber-500/10 flex items-center justify-center border border-amber-500/20">
                  <ShieldAlert className="h-6 w-6 text-amber-500" />
                </div>
                <div>
                  <p className="font-bold text-amber-400">2FA is currently DISABLED</p>
                  <p className="text-sm text-slate-400">Enable 2FA to protect your facility's medical data from unauthorized access.</p>
                </div>
              </>
            )}
          </div>
          <Button 
            variant={is2FAEnabled ? "outline" : "primary"}
            className={is2FAEnabled ? "border-slate-700 bg-slate-900 text-rose-400 hover:text-rose-300 hover:border-rose-500/50" : "bg-blue-600 hover:bg-blue-500 font-bold"}
            onClick={is2FAEnabled ? disable2FA : initiate2FA}
          >
            {is2FAEnabled ? "Disable 2FA" : "Set up 2FA"}
          </Button>
        </CardContent>
      </Card>

      <Card className="bg-slate-900/40 border-slate-800/80 shadow-xl">
        <CardHeader className="border-b border-slate-800/60 pb-5">
          <CardTitle className="text-lg text-white flex items-center gap-2">
            <Key className="h-5 w-5 text-slate-400" /> Change Password
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <form className="max-w-md space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase text-slate-400">Current Password</label>
              <Input type="password" placeholder="••••••••" className="bg-slate-950/50 border-slate-700" />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase text-slate-400">New Password</label>
              <Input type="password" placeholder="••••••••" className="bg-slate-950/50 border-slate-700" />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase text-slate-400">Confirm New Password</label>
              <Input type="password" placeholder="••••••••" className="bg-slate-950/50 border-slate-700" />
            </div>
            <Button variant="outline" className="w-full mt-2 border-slate-700 text-slate-300 hover:bg-slate-800">
              Update Password
            </Button>
          </form>
        </CardContent>
      </Card>

      <Modal isOpen={isSetupModalOpen} onClose={() => setIsSetupModalOpen(false)} title="Configure Authenticator">
        <div className="space-y-6">
          <p className="text-sm text-slate-300 leading-relaxed text-center">
            Scan the QR code below using an authenticator app (like Google Authenticator or Authy) to link your account.
          </p>
          
          <div className="flex justify-center p-4 bg-white rounded-xl mx-auto w-fit">
            {/* Mock QR Code Image - Replace with base64 string from backend in production */}
            <img src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=otpauth://totp/BloodConnect:Admin?secret=JBSWY3DPEHPK3PXP&issuer=BloodConnect" alt="2FA QR Code" className="w-48 h-48" />
          </div>

          <form onSubmit={handleVerify2FA} className="space-y-4 pt-4 border-t border-slate-800">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase text-slate-400 text-center block">Enter 6-Digit Code</label>
              <Input 
                type="text" 
                maxLength={6} 
                required
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                placeholder="123456" 
                className="bg-slate-950/50 border-slate-700 text-center text-2xl tracking-[0.5em] font-mono h-14" 
              />
            </div>
            <Button type="submit" variant="primary" className="w-full font-bold shadow-lg" disabled={isVerifying || verificationCode.length !== 6}>
              {isVerifying ? <Loader2 className="animate-spin h-5 w-5" /> : "Verify & Enable"}
            </Button>
          </form>
        </div>
      </Modal>
    </div>
  );
}