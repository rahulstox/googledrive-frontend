import React, { useState } from "react";
import { X, AlertTriangle, Trash2 } from "lucide-react";

export default function DeleteAccountModal({ isOpen, onClose, onConfirm, loading }) {
  const [password, setPassword] = useState("");

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onConfirm(password);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-drive-card w-full max-w-md p-6 rounded-2xl shadow-xl transform transition-all scale-100 animate-in zoom-in-95 duration-200 border border-drive-border">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-xl">
              <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-500" />
            </div>
            <h2 className="text-xl font-bold text-drive-text">Delete Account</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-drive-border rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-drive-muted" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-6 space-y-4">
            <div className="p-4 bg-red-50 dark:bg-red-900/10 rounded-xl border border-red-100 dark:border-red-900/30">
              <p className="text-sm text-red-600 dark:text-red-400">
                <strong>Warning:</strong> This action is irreversible. All your files, folders, and personal data will be permanently deleted.
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-drive-text mb-2">
                Confirm your password
              </label>
              <input
                autoFocus
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full px-4 py-3 bg-gray-50 dark:bg-drive-dark border border-drive-border rounded-xl text-drive-text focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                required
              />
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl text-drive-muted font-medium hover:bg-gray-100 dark:hover:bg-drive-border transition-colors"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!password || loading}
              className="px-5 py-2.5 rounded-xl bg-red-600 text-white font-medium hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md flex items-center gap-2"
            >
              {loading ? "Deleting..." : (
                <>
                  <Trash2 className="w-4 h-4" />
                  Delete Permanently
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
