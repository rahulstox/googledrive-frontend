import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { api } from "../api/client";
import toast from "react-hot-toast";

export default function SettingsModal({ isOpen, onClose }) {
  const [retentionDays, setRetentionDays] = useState(30);
  const [customDays, setCustomDays] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadSettings();
    }
  }, [isOpen]);

  const loadSettings = async () => {
    try {
      const res = await api("/auth/me");
      if (res.user?.trashRetentionDays) {
        setRetentionDays(res.user.trashRetentionDays);
        if (![7, 30].includes(res.user.trashRetentionDays)) {
          setCustomDays(res.user.trashRetentionDays);
        }
      }
    } catch (err) {
      console.error("Failed to load settings", err);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      let days = retentionDays;
      if (retentionDays === "custom") {
        days = parseInt(customDays, 10);
        if (isNaN(days) || days < 1 || days > 365) {
          toast.error("Please enter a valid number of days (1-365)");
          setLoading(false);
          return;
        }
      }

      await api("/auth/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trashRetentionDays: days }),
      });
      toast.success("Settings saved");
      onClose();
    } catch (err) {
      toast.error(err.message || "Failed to save settings");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-drive-card w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="p-6 border-b border-drive-border flex items-center justify-between">
          <h2 className="text-xl font-bold text-drive-text">Settings</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-drive-border rounded-full transition-colors text-drive-muted hover:text-drive-text"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div>
            <h3 className="font-semibold text-drive-text mb-2">
              Trash Retention
            </h3>
            <p className="text-sm text-drive-muted mb-4">
              Items in the trash will be permanently deleted after this period.
            </p>

            <div className="space-y-3">
              <label className="flex items-center gap-3 p-3 rounded-xl border border-drive-border cursor-pointer hover:bg-drive-dark/50 transition-colors">
                <input
                  type="radio"
                  name="retention"
                  checked={retentionDays === 7}
                  onChange={() => setRetentionDays(7)}
                  className="w-4 h-4 text-drive-accent focus:ring-drive-accent"
                />
                <span className="text-drive-text">7 Days</span>
              </label>

              <label className="flex items-center gap-3 p-3 rounded-xl border border-drive-border cursor-pointer hover:bg-drive-dark/50 transition-colors">
                <input
                  type="radio"
                  name="retention"
                  checked={retentionDays === 30}
                  onChange={() => setRetentionDays(30)}
                  className="w-4 h-4 text-drive-accent focus:ring-drive-accent"
                />
                <span className="text-drive-text">30 Days</span>
              </label>

              <label className="flex items-center gap-3 p-3 rounded-xl border border-drive-border cursor-pointer hover:bg-drive-dark/50 transition-colors">
                <input
                  type="radio"
                  name="retention"
                  checked={
                    retentionDays !== 7 && retentionDays !== 30
                  }
                  onChange={() => {
                    setRetentionDays("custom");
                    if (customDays === "") setCustomDays("60");
                  }}
                  className="w-4 h-4 text-drive-accent focus:ring-drive-accent"
                />
                <span className="text-drive-text">Custom</span>
              </label>

              {(retentionDays === "custom" || (retentionDays !== 7 && retentionDays !== 30)) && (
                <div className="ml-7">
                  <input
                    type="number"
                    min="1"
                    max="365"
                    value={customDays}
                    onChange={(e) => {
                      setCustomDays(e.target.value);
                      setRetentionDays("custom");
                    }}
                    className="w-full px-3 py-2 rounded-lg border border-drive-border bg-transparent text-drive-text focus:border-drive-accent focus:ring-1 focus:ring-drive-accent outline-none transition-all"
                    placeholder="Enter days (1-365)"
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-drive-border flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-drive-muted hover:bg-drive-border transition-colors font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            className="px-6 py-2 rounded-xl bg-drive-accent text-white hover:bg-drive-accentHover transition-colors font-medium shadow-lg shadow-drive-accent/25 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}
