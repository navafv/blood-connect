import React, { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { cn } from "../../lib/utils";

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
    // Using requestAnimationFrame ensures the modal is fully rendered before focusing
    requestAnimationFrame(() => {
      if (modalRef.current) {
        modalRef.current.focus();
      }
    });

    // Prevent background scrolling while modal is open, but save the original state
    const originalStyle = window.getComputedStyle(document.body).overflow;
    document.body.style.overflow = "hidden";

    // 3. Handle keyboard events (Tab trapping and Escape to close)
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        onCloseRef.current(); // Use the ref here!
        return;
      }

      if (e.key === "Tab") {
        if (!modalRef.current) return;

        // Find all focusable elements inside the modal
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
          // Shift + Tab: If on the first element (or the modal itself), jump to the last element
          if (
            document.activeElement === firstElement ||
            document.activeElement === modalRef.current
          ) {
            lastElement.focus();
            e.preventDefault();
          }
        } else {
          // Tab: If on the last element, jump back to the first element
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
      {/* Dimmed Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={() => onCloseRef.current()}
        aria-hidden="true" /* Hide backdrop from screen readers */
      />

      {/* Modal Dialog */}
      <div
        ref={modalRef}
        tabIndex={-1} /* Allows the div to receive programmatic focus */
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn(
          "relative z-50 w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl animate-in zoom-in-95 fade-in duration-200 focus:outline-none",
          className,
        )}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold tracking-tight text-white">
            {title}
          </h2>
          <button
            onClick={() => onCloseRef.current()}
            className="rounded-full p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-rose-500"
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
