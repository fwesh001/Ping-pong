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
      headerBg: "bg-red-50",
      headerText: "text-red-900",
      button: "bg-red-600 hover:bg-red-700 text-white",
      buttonDisabled: "bg-red-300 text-white cursor-not-allowed",
    },
    warning: {
      icon: "⚡",
      headerBg: "bg-yellow-50",
      headerText: "text-yellow-900",
      button: "bg-yellow-600 hover:bg-yellow-700 text-white",
      buttonDisabled: "bg-yellow-300 text-white cursor-not-allowed",
    },
    info: {
      icon: "ℹ️",
      headerBg: "bg-blue-50",
      headerText: "text-blue-900",
      button: "bg-blue-600 hover:bg-blue-700 text-white",
      buttonDisabled: "bg-blue-300 text-white cursor-not-allowed",
    },
  };

  const styles = variantStyles[variant];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        {/* Header */}
        <div className={`${styles.headerBg} px-6 py-4 border-b border-gray-200`}>
          <div className="flex items-center gap-3">
            <span className="text-2xl">{styles.icon}</span>
            <h3 className={`text-lg font-bold ${styles.headerText}`}>{title}</h3>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          <p className="text-gray-700">
            This action cannot be undone.{" "}
            <span className="font-semibold text-gray-900">{targetName}</span> will be
            permanently affected.
          </p>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {promptText}
            </label>
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={targetName}
              className="input-field font-mono text-sm"
              autoFocus
            />
            {inputValue && !isMatch && (
              <p className="text-xs text-red-600 mt-1">
                Text does not match. Please type exactly: <span className="font-mono font-bold">{targetName}</span>
              </p>
            )}
            {isMatch && (
              <p className="text-xs text-green-600 mt-1">✓ Match confirmed</p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-3">
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
