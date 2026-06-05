import React from "react";
import { AlertTriangle, Copy, LogIn } from "lucide-react";
import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";

export function SessionExpiredModal({ isOpen, onClose }) {
  const handleLoginRedirect = () => {
    window.location.href = "/login";
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Session Expired"
      hideCloseButton={true}
    >
      <div className="flex flex-col items-center text-center space-y-4 py-4">
        <div className="h-16 w-16 bg-rose-500/10 rounded-full flex items-center justify-center border border-rose-500/20 mb-2">
          <AlertTriangle className="h-8 w-8 text-rose-500" />
        </div>

        <h3 className="text-xl font-bold text-white tracking-tight">
          Security Timeout
        </h3>

        <p className="text-sm text-slate-400 leading-relaxed max-w-sm">
          For your security, your session has been disconnected due to
          inactivity.
          <strong className="text-rose-400 block mt-2">
            If you were typing a long form, please copy your text now before
            clicking continue!
          </strong>
        </p>

        <div className="pt-6 w-full flex flex-col gap-3">
          <Button
            variant="outline"
            onClick={onClose}
            className="w-full border-slate-700 bg-slate-900 text-slate-300 hover:text-white"
          >
            <Copy className="h-4 w-4 mr-2" />
            Let me copy my work first
          </Button>
          <Button
            variant="primary"
            onClick={handleLoginRedirect}
            className="w-full shadow-lg"
          >
            <LogIn className="h-4 w-4 mr-2" />
            Go to Login
          </Button>
        </div>
      </div>
    </Modal>
  );
}
