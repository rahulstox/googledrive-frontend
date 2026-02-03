import React, { useEffect, useRef } from "react";
import { X, AlertTriangle, Trash2 } from "lucide-react";

export default function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Delete",
  cancelText = "Cancel",
  isDangerous = true,
  isLoading = false,
}) {
  const modalRef = useRef(null);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape") onClose();
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      // Prevent body scroll
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        ref={modalRef}
        className="bg-white dark:bg-zinc-900 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 border border-gray-200 dark:border-zinc-800"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="p-6 pb-0 flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div
              className={`p-3 rounded-full ${
                isDangerous
                  ? "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-500"
                  : "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-500"
              }`}
            >
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              {title}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-500 dark:text-gray-500 dark:hover:text-gray-400 rounded-full hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
            {message}
          </p>
        </div>

        {/* Footer */}
        <div className="p-6 pt-0 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl font-medium text-gray-700 dark:text-gray-300 bg-gray-100 hover:bg-gray-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-300 dark:focus:ring-gray-600"
            disabled={isLoading}
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={`px-5 py-2.5 rounded-xl font-medium text-white shadow-sm flex items-center gap-2 transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 ${
              isDangerous
                ? "bg-red-600 hover:bg-red-700 focus:ring-red-500"
                : "bg-blue-600 hover:bg-blue-700 focus:ring-blue-500"
            } ${isLoading ? "opacity-70 cursor-not-allowed" : "hover:-translate-y-0.5"}`}
            disabled={isLoading}
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Trash2 className="w-4 h-4" />
            )}
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
