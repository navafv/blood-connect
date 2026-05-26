import React, { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { cn } from "../../lib/utils";

/**
 * Enterprise Modal Dialog
 * Features focus-trapping for accessibility, scroll-locking, and
 * premium glassmorphic depth layering.
 */
export function Modal({ isOpen, onClose, title, children, className }) {
  const modalRef = useRef(null);
  const previousFocusRef = useRef(null);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!isOpen) return;

    // 1. Store the element that had focus before the modal opened
    previousFocusRef.current = document.activeElement;

    // 2. Focus the modal container itself so screen readers start reading the title
    requestAnimationFrame(() => {
      if (modalRef.current) {
        modalRef.current.focus();
      }
    });

    // Prevent background scrolling while modal is open
    const originalStyle = window.getComputedStyle(document.body).overflow;
    document.body.style.overflow = "hidden";

    // 3. Handle keyboard events (Tab trapping and Escape to close)
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
      // 4. Cleanup: Remove listener, restore scroll, and return focus
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = originalStyle;

      if (previousFocusRef.current) {
        previousFocusRef.current.focus();
      }
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-0">
      {/* Dimmed Glassmorphic Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-300"
        onClick={() => onCloseRef.current()}
        aria-hidden="true"
      />

      {/* Modal Dialog Container */}
      <div
        ref={modalRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn(
          "relative z-50 w-full max-w-lg rounded-2xl border border-slate-700/60 bg-slate-900/95 backdrop-blur-xl p-6 sm:p-8 shadow-[0_0_50px_rgba(0,0,0,0.5)] animate-in zoom-in-95 fade-in duration-300 focus:outline-none",
          className,
        )}
      >
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-800/80">
          <h2 className="text-xl font-bold tracking-tight text-white">
            {title}
          </h2>
          <button
            onClick={() => onCloseRef.current()}
            className="rounded-full p-2 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-rose-500/50"
            aria-label="Close modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div>{children}</div>
      </div>
    </div>
  );
}
