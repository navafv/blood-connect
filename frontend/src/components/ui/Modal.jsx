import React, { useEffect, useRef, useId } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cn } from "../../lib/utils";

export function Modal({ isOpen, onClose, title, children, className }) {
  const modalRef = useRef(null);
  const previousFocusRef = useRef(null);
  const onCloseRef = useRef(onClose);
  const titleId = useId();

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!isOpen) return;

    previousFocusRef.current = document.activeElement;

    requestAnimationFrame(() => {
      if (modalRef.current) {
        modalRef.current.focus();
      }
    });

    const originalStyle = window.getComputedStyle(document.body).overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        onCloseRef.current();
        return;
      }

      if (e.key === "Tab") {
        if (!modalRef.current) return;
        const focusableElements = modalRef.current.querySelectorAll(
          'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
        );

        if (focusableElements.length === 0) {
          e.preventDefault();
          return;
        }

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey) {
          if (
            document.activeElement === firstElement ||
            document.activeElement === modalRef.current
          ) {
            lastElement.focus();
            e.preventDefault();
          }
        } else {
          if (document.activeElement === lastElement) {
            firstElement.focus();
            e.preventDefault();
          }
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = originalStyle;

      if (previousFocusRef.current) {
        previousFocusRef.current.focus();
      }
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-0">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300 transition-colors dark:bg-slate-950/80"
        onClick={() => onCloseRef.current()}
        aria-hidden="true"
      />

      {/* Modal Container */}
      <div
        ref={modalRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        className={cn(
          "relative z-[101] w-full max-w-lg rounded-2xl border p-6 sm:p-8 animate-in zoom-in-95 fade-in duration-300 focus:outline-none transition-colors",
          // Light Mode
          "bg-white/95 border-slate-200 shadow-2xl text-slate-900 backdrop-blur-xl",
          // Dark Mode
          "dark:bg-slate-900/95 dark:border-slate-700/60 dark:shadow-[0_0_50px_rgba(0,0,0,0.5)] dark:text-white",
          className,
        )}
      >
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-200 transition-colors dark:border-slate-800/80">
          {title && (
            <h2
              id={titleId}
              className="text-xl font-bold tracking-tight text-slate-900 transition-colors dark:text-white"
            >
              {title}
            </h2>
          )}
          <button
            onClick={() => onCloseRef.current()}
            className="rounded-full p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors focus:outline-none focus:ring-2 focus:ring-rose-500/50 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800"
            aria-label="Close modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div>{children}</div>
      </div>
    </div>,
    document.body,
  );
}
