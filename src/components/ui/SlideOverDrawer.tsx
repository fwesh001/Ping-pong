"use client";

import React, { useEffect, useRef } from "react";
import { X } from "lucide-react";

interface SlideOverDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export default function SlideOverDrawer({ isOpen, onClose, title, children, footer }: SlideOverDrawerProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  // Close on Escape key
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) onClose();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [isOpen, onClose]);

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-300"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer Panel */}
      <div
        ref={panelRef}
        className="relative w-full max-w-lg bg-slate-800 border-l border-slate-700 flex flex-col animate-slide-in"
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        {/* Sticky Header */}
        <div className="flex-shrink-0 flex items-center justify-between px-6 py-4 border-b border-slate-700 bg-slate-800">
          <h2 className="text-lg font-bold text-slate-100 font-poppins">{title}</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-700/50 transition-colors"
            aria-label="Close drawer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {children}
        </div>

        {/* Sticky Footer */}
        {footer && (
          <div className="flex-shrink-0 flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-700 bg-slate-800">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
