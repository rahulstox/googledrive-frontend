import { useState, useEffect } from "react";
import { X, Copy, Check, ShieldCheck, Loader2 } from "lucide-react";
import { api } from "../api/client";
import toast from "react-hot-toast";

export default function TwoFactorSetupModal({ isOpen, onClose, onComplete }) {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [qrCode, setQrCode] = useState(null);
  const [secret, setSecret] = useState(null);
  const [token, setToken] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen) {
      generateSecret();
    } else {
      // Reset state on close
      setToken("");
      setQrCode(null);
      setSecret(null);
      setLoading(true);
    }
  }, [isOpen]);

  const generateSecret = async () => {
    try {
      setLoading(true);
      const res = await api("/auth/2fa/generate", { method: "POST" });
      setQrCode(res.qrCode);
      setSecret(res.secret);
    } catch (err) {
      console.error("Failed to generate 2FA secret", err);
      toast.error("Failed to start 2FA setup. Please try again.");
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const handleCopySecret = () => {
    if (secret) {
      navigator.clipboard.writeText(secret);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success("Secret copied to clipboard");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!token || token.length !== 6) return;

    try {
      setSubmitting(true);
      await api("/auth/2fa/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });

      toast.success("Two-Factor Authentication enabled successfully!");
      if (onComplete) onComplete();
      onClose();
    } catch (err) {
      console.error("2FA Verification failed", err);
      toast.error(err.message || "Invalid verification code. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-drive-card w-full max-w-md p-6 rounded-2xl shadow-xl transform transition-all scale-100 animate-in zoom-in-95 duration-200 border border-drive-border">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/10 rounded-xl">
              <ShieldCheck className="w-6 h-6 text-blue-500" />
            </div>
            <h2 className="text-xl font-bold text-drive-text">Enable 2FA</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-drive-border rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-drive-muted" />
          </button>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-drive-accent animate-spin mb-4" />
            <p className="text-drive-muted">Generating security keys...</p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-gray-50 dark:bg-drive-dark p-4 rounded-xl flex flex-col items-center border border-drive-border">
              {qrCode && (
                <img
                  src={qrCode}
                  alt="2FA QR Code"
                  className="w-48 h-48 rounded-lg border border-gray-200 dark:border-gray-700 mb-4"
                />
              )}
              <p className="text-sm text-center text-drive-muted mb-2">
                Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.)
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-drive-muted uppercase tracking-wider">
                Or enter this code manually
              </label>
              <div className="flex items-center gap-2">
                <code className="flex-1 p-3 bg-gray-50 dark:bg-drive-dark border border-drive-border rounded-xl text-center font-mono text-drive-text tracking-widest text-lg">
                  {secret}
                </code>
                <button
                  onClick={handleCopySecret}
                  className="p-3 bg-gray-50 dark:bg-drive-dark border border-drive-border rounded-xl hover:bg-gray-100 dark:hover:bg-drive-border transition-colors text-drive-text"
                  title="Copy to clipboard"
                >
                  {copied ? <Check className="w-5 h-5 text-green-500" /> : <Copy className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 pt-2">
              <div>
                <label className="block text-sm font-medium text-drive-text mb-2">
                  Verification Code
                </label>
                <input
                  type="text"
                  value={token}
                  onChange={(e) => setToken(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="000000"
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-drive-dark border border-drive-border rounded-xl text-drive-text focus:outline-none focus:ring-2 focus:ring-drive-accent focus:border-transparent transition-all text-center text-xl tracking-widest"
                  maxLength={6}
                  autoFocus
                />
                <p className="mt-2 text-xs text-drive-muted text-center">
                  Enter the 6-digit code from your app to verify setup.
                </p>
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
                  disabled={token.length !== 6 || submitting}
                  className="px-5 py-2.5 rounded-xl bg-drive-accent text-white font-medium hover:bg-drive-accent/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md flex items-center gap-2"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    "Verify & Enable"
                  )}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
