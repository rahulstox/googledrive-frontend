import { useState } from "react";
import { X, ShieldAlert, Loader2, Lock } from "lucide-react";
import { api } from "../api/client";
import toast from "react-hot-toast";

export default function Disable2FAModal({ isOpen, onClose, onComplete }) {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!password) return;

    try {
      setLoading(true);
      await api("/auth/2fa/disable", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      toast.success("Two-Factor Authentication disabled.");
      if (onComplete) onComplete();
      onClose();
      setPassword("");
    } catch (err) {
      console.error("Disable 2FA failed", err);
      toast.error(err.message || "Failed to disable 2FA. Check your password.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-drive-card w-full max-w-md p-6 rounded-2xl shadow-xl transform transition-all scale-100 animate-in zoom-in-95 duration-200 border border-drive-border">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-500/10 rounded-xl">
              <ShieldAlert className="w-6 h-6 text-red-500" />
            </div>
            <h2 className="text-xl font-bold text-drive-text">Disable 2FA</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-drive-border rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-drive-muted" />
          </button>
        </div>

        <div className="mb-6">
          <p className="text-drive-text mb-2">
            Are you sure you want to disable Two-Factor Authentication?
          </p>
          <p className="text-sm text-drive-muted">
            Your account will be less secure. You will only need your password to log in.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-drive-text mb-2">
              Confirm Password
            </label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-drive-muted">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-drive-dark border border-drive-border rounded-xl text-drive-text focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                autoFocus
                required
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl text-drive-muted font-medium hover:bg-gray-100 dark:hover:bg-drive-border transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!password || loading}
              className="px-5 py-2.5 rounded-xl bg-red-600 text-white font-medium hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md flex items-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Disabling...
                </>
              ) : (
                "Disable 2FA"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
