import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { AlertTriangle, Copy, LogIn } from "lucide-react";
import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";

export function SessionExpiredModal({ isOpen, onClose }) {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLoginRedirect = () => {
    onClose();
    const currentPath = location.pathname + location.search;
    navigate("/login", { state: { from: currentPath } });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Session Expired"
      hideCloseButton={true}
    >
      <div className="flex flex-col items-center text-center space-y-4 py-4">
        <div className="h-16 w-16 bg-rose-50 rounded-full flex items-center justify-center border border-rose-100 mb-2 transition-colors duration-300 dark:bg-rose-500/10 dark:border-rose-500/20">
          <AlertTriangle className="h-8 w-8 text-rose-600 transition-colors duration-300 dark:text-rose-500" />
        </div>

        <h3 className="text-xl font-bold text-slate-900 tracking-tight transition-colors duration-300 dark:text-white">
          Security Timeout
        </h3>

        <p className="text-sm text-slate-600 leading-relaxed max-w-sm transition-colors duration-300 dark:text-slate-400">
          For your security, your session has been disconnected due to
          inactivity.
          <strong className="text-rose-600 block mt-2 transition-colors duration-300 dark:text-rose-400">
            If you were typing a long form, please copy your text now before
            clicking continue!
          </strong>
        </p>

        <div className="pt-6 w-full flex flex-col gap-3">
          <Button variant="outline" onClick={onClose} className="w-full">
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
