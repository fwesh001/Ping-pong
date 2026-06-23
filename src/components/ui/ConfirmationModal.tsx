"use client";

import React, { useState, useEffect } from "react";

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  targetName: string;
  promptText?: string;
  confirmButtonText?: string;
  cancelButtonText?: string;
  variant?: "danger" | "warning" | "info";
}

export default function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  targetName,
  promptText = `Type "${targetName}" to confirm`,
  confirmButtonText = "Confirm",
  cancelButtonText = "Cancel",
  variant = "danger",
}: ConfirmationModalProps) {
  const [inputValue, setInputValue] = useState("");
  const [isMatch, setIsMatch] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setInputValue("");
      setIsMatch(false);
    }
  }, [isOpen]);

  useEffect(() => {
    setIsMatch(inputValue === targetName);
  }, [inputValue, targetName]);

  if (!isOpen) return null;

  const variantStyles = {
    danger: {
      icon: "⚠️",
      headerBg: "bg-slate-800",
      headerText: "text-rose-400",
      button: "bg-rose-400 hover:bg-rose-500 text-slate-900",
      buttonDisabled: "bg-rose-700 text-slate-400 cursor-not-allowed",
    },
    warning: {
      icon: "⚡",
      headerBg: "bg-slate-800",
      headerText: "text-amber-400",
      button: "bg-amber-400 hover:bg-amber-500 text-slate-900",
      buttonDisabled: "bg-amber-700 text-slate-400 cursor-not-allowed",
    },
    info: {
      icon: "ℹ️",
      headerBg: "bg-slate-800",
      headerText: "text-brand-cyan",
      button: "bg-brand-cyan hover:bg-brand-cyan/90 text-slate-900",
      buttonDisabled: "bg-brand-cyan/40 text-slate-400 cursor-not-allowed",
    },
  };
  if (!isOpen) return null;

  const styles = variantStyles[variant];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-slate-800 rounded-xl shadow-2xl w-full max-w-md mx-4 overflow-hidden border border-slate-700">
        {/* Header */}
        <div className={`${styles.headerBg} px-6 py-4 border-b border-slate-700`}>
          <div className="flex items-center gap-3">
            <span className="text-2xl">{styles.icon}</span>
            <h3 className={`text-lg font-bold ${styles.headerText} font-poppins`}>{title}</h3>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          <p className="text-slate-300">
            This action cannot be undone.{" "}
            <span className="font-semibold text-slate-100">{targetName}</span> will be
            permanently affected.
          </p>

          <div>
            <label className="block text-sm font-medium text-slate-100 mb-1">
              {promptText}
            </label>
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={targetName}
              className="input-field font-mono-var text-sm"
              autoFocus
            />
            {inputValue && !isMatch && (
              <p className="text-xs text-rose-400 mt-1">
                Text does not match. Please type exactly: <span className="font-mono-var font-bold">{targetName}</span>
              </p>
            )}
            {isMatch && (
              <p className="text-xs text-emerald-400 mt-1">✓ Match confirmed</p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-800 border-t border-slate-700 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="btn-secondary"
          >
            {cancelButtonText}
          </button>
          <button
            onClick={() => {
              onConfirm();
              setInputValue("");
            }}
            disabled={!isMatch}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${isMatch ? styles.button : styles.buttonDisabled}`}
          >
            {confirmButtonText}
          </button>
        </div>
      </div>
    </div>
  );
}
