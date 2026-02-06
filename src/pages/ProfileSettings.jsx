import { useState, useEffect } from "react";
import { useAuth } from "../context/useAuth";
import { api } from "../api/client";
import toast from "react-hot-toast";
import DeleteAccountModal from "../components/DeleteAccountModal";
import TwoFactorSetupModal from "../components/TwoFactorSetupModal";
import Disable2FAModal from "../components/Disable2FAModal";
import {
  formatUserAgent,
  parseUserAgent,
  formatRelativeTime,
} from "../utils/formatters";
import {
  User,
  Lock,
  Settings,
  Shield,
  Camera,
  Loader2,
  Save,
  LogOut,
  Smartphone,
  Mail,
  Globe,
  Bell,
  Eye,
  EyeOff,
  Activity,
  History,
  Trash2,
  AlertTriangle,
  X,
  Monitor,
  Laptop,
} from "lucide-react";

export default function ProfileSettings() {
  const [activeTab, setActiveTab] = useState("profile");
  const { user, refreshUser, logout } = useAuth();

  const tabs = [
    { id: "profile", label: "Profile", icon: User },
    { id: "security", label: "Security", icon: Shield },
    { id: "password", label: "Password", icon: Lock },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  return (
    <div className="flex-1 h-full overflow-hidden flex flex-col md:flex-row bg-drive-dark/50">
      {/* Sidebar */}
      <div className="w-full md:w-64 bg-drive-card border-r border-drive-border flex-shrink-0">
        <div className="p-6 border-b border-drive-border/50">
          <h1 className="text-xl font-bold text-drive-text">Settings</h1>
          <p className="text-sm text-drive-muted mt-1">Manage your account</p>
        </div>
        <nav className="p-4 space-y-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                activeTab === tab.id
                  ? "bg-drive-accent text-white shadow-lg shadow-drive-accent/25"
                  : "text-drive-muted hover:bg-drive-dark hover:text-drive-text"
              }`}
            >
              <tab.icon className="w-5 h-5" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 md:p-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {activeTab === "profile" && (
            <ProfileInfo user={user} refreshUser={refreshUser} />
          )}
          {activeTab === "password" && <PasswordManager />}
          {activeTab === "settings" && (
            <AccountSettings
              user={user}
              refreshUser={refreshUser}
              logout={logout}
            />
          )}
          {activeTab === "security" && (
            <Security user={user} refreshUser={refreshUser} />
          )}
        </div>
      </div>
    </div>
  );
}

function ProfileInfo({ user, refreshUser }) {
  const [formData, setFormData] = useState({
    username: user?.username || "",
    bio: user?.bio || "",
    phoneNumber: user?.phoneNumber || "",
    avatarUrl: user?.avatarUrl || "",
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        username: user.username || "",
        bio: user.bio || "",
        phoneNumber: user.phoneNumber || "",
        avatarUrl: user.avatarUrl || "",
      });
    }
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api("/auth/me", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      await refreshUser();
      toast.success("Profile updated successfully!");
    } catch (err) {
      toast.error(err.message || "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="bg-drive-card border border-drive-border rounded-2xl p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-drive-text mb-6">
          Personal Information
        </h2>

        <div className="flex flex-col md:flex-row gap-8 items-start mb-8">
          <div className="relative group mx-auto md:mx-0">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-drive-accent to-purple-600 flex items-center justify-center text-3xl font-bold text-white shadow-xl overflow-hidden">
              {formData.avatarUrl ? (
                <img
                  src={formData.avatarUrl}
                  alt="Avatar"
                  className="w-full h-full object-cover"
                />
              ) : (
                formData.username?.[0]?.toUpperCase()
              )}
            </div>
            <button className="absolute bottom-0 right-0 p-2 bg-drive-card border border-drive-border rounded-full shadow-lg hover:bg-drive-border transition-colors text-drive-text">
              <Camera className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 w-full">
            <div className="space-y-2">
              <label className="text-sm font-medium text-drive-muted">
                Username
              </label>
              <input
                type="text"
                value={formData.username}
                onChange={(e) =>
                  setFormData({ ...formData, username: e.target.value })
                }
                className="w-full px-4 py-2.5 bg-drive-dark border border-drive-border rounded-xl text-drive-text focus:ring-2 focus:ring-drive-accent focus:border-transparent outline-none transition-all"
              />
            </div>
            <div className="mt-4 space-y-2">
              <label className="text-sm font-medium text-drive-muted">
                Bio
              </label>
              <textarea
                value={formData.bio}
                onChange={(e) =>
                  setFormData({ ...formData, bio: e.target.value })
                }
                rows={3}
                maxLength={500}
                className="w-full px-4 py-2.5 bg-drive-dark border border-drive-border rounded-xl text-drive-text focus:ring-2 focus:ring-drive-accent focus:border-transparent outline-none transition-all resize-none"
                placeholder="Tell us a little about yourself..."
              />
              <p className="text-xs text-drive-muted text-right">
                {formData.bio.length}/500
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-drive-muted flex items-center gap-2">
              <Mail className="w-4 h-4" /> Email Address
            </label>
            <input
              type="email"
              value={user?.email || ""}
              disabled
              className="w-full px-4 py-2.5 bg-drive-dark/50 border border-drive-border rounded-xl text-drive-muted cursor-not-allowed"
            />
            <p className="text-xs text-yellow-500/80">
              Email cannot be changed directly.
            </p>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-drive-muted flex items-center gap-2">
              <Smartphone className="w-4 h-4" /> Phone Number
            </label>
            <input
              type="tel"
              value={formData.phoneNumber}
              onChange={(e) =>
                setFormData({ ...formData, phoneNumber: e.target.value })
              }
              className="w-full px-4 py-2.5 bg-drive-dark border border-drive-border rounded-xl text-drive-text focus:ring-2 focus:ring-drive-accent focus:border-transparent outline-none transition-all"
              placeholder="+1 (555) 000-0000"
            />
          </div>
        </div>

        <div className="mt-8 flex justify-end">
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="px-6 py-2.5 bg-drive-accent hover:bg-drive-accentHover text-white font-medium rounded-xl shadow-lg shadow-drive-accent/20 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}

function PasswordManager() {
  const [formData, setFormData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  const getStrength = (pass) => {
    let score = 0;
    if (pass.length >= 8) score++;
    if (/[A-Z]/.test(pass)) score++;
    if (/[0-9]/.test(pass)) score++;
    if (/[^A-Za-z0-9]/.test(pass)) score++;
    return score;
  };

  const strength = getStrength(formData.newPassword);
  const strengthLabels = ["Weak", "Fair", "Good", "Strong", "Excellent"];
  const strengthColors = [
    "text-red-500",
    "text-orange-500",
    "text-yellow-500",
    "text-blue-500",
    "text-green-500",
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.newPassword !== formData.confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }
    setLoading(true);
    try {
      await api("/auth/password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: formData.currentPassword,
          newPassword: formData.newPassword,
        }),
      });
      toast.success("Password updated successfully!");
      setFormData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (err) {
      toast.error(err.message || "Failed to update password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="bg-drive-card border border-drive-border rounded-2xl p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-drive-text mb-6">
          Change Password
        </h2>

        <form onSubmit={handleSubmit} className="max-w-xl space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-drive-muted">
              Current Password
            </label>
            <div className="relative">
              <input
                type={showPassword.current ? "text" : "password"}
                value={formData.currentPassword}
                onChange={(e) =>
                  setFormData({ ...formData, currentPassword: e.target.value })
                }
                className="w-full px-4 py-2.5 bg-drive-dark border border-drive-border rounded-xl text-drive-text focus:ring-2 focus:ring-drive-accent focus:border-transparent outline-none transition-all pr-10"
                required
              />
              <button
                type="button"
                onClick={() =>
                  setShowPassword((p) => ({ ...p, current: !p.current }))
                }
                className="absolute right-3 top-1/2 -translate-y-1/2 text-drive-muted hover:text-drive-text"
              >
                {showPassword.current ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-drive-muted">
              New Password
            </label>
            <div className="relative">
              <input
                type={showPassword.new ? "text" : "password"}
                value={formData.newPassword}
                onChange={(e) =>
                  setFormData({ ...formData, newPassword: e.target.value })
                }
                className="w-full px-4 py-2.5 bg-drive-dark border border-drive-border rounded-xl text-drive-text focus:ring-2 focus:ring-drive-accent focus:border-transparent outline-none transition-all pr-10"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((p) => ({ ...p, new: !p.new }))}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-drive-muted hover:text-drive-text"
              >
                {showPassword.new ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
            {formData.newPassword && (
              <div className="flex items-center gap-2 text-xs">
                <div className="flex gap-1 h-1 flex-1">
                  {[...Array(4)].map((_, i) => (
                    <div
                      key={i}
                      className={`flex-1 rounded-full ${
                        i < strength
                          ? strengthColors[strength]
                          : "bg-drive-border"
                      } bg-current opacity-50`}
                    />
                  ))}
                </div>
                <span className={`${strengthColors[strength]} font-medium`}>
                  {strengthLabels[strength]}
                </span>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-drive-muted">
              Confirm New Password
            </label>
            <div className="relative">
              <input
                type={showPassword.confirm ? "text" : "password"}
                value={formData.confirmPassword}
                onChange={(e) =>
                  setFormData({ ...formData, confirmPassword: e.target.value })
                }
                className="w-full px-4 py-2.5 bg-drive-dark border border-drive-border rounded-xl text-drive-text focus:ring-2 focus:ring-drive-accent focus:border-transparent outline-none transition-all pr-10"
                required
              />
              <button
                type="button"
                onClick={() =>
                  setShowPassword((p) => ({ ...p, confirm: !p.confirm }))
                }
                className="absolute right-3 top-1/2 -translate-y-1/2 text-drive-muted hover:text-drive-text"
              >
                {showPassword.confirm ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          <div className="pt-4">
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 bg-drive-accent hover:bg-drive-accentHover text-white font-medium rounded-xl shadow-lg shadow-drive-accent/20 transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              Update Password
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function AccountSettings({ user, refreshUser, logout }) {
  const [preferences, setPreferences] = useState(
    user?.preferences || {
      notifications: { email: true, push: true, sms: false },
      privacy: { profileVisibility: "public", showActivityStatus: true },
      language: "en",
      timezone: "UTC",
    },
  );
  const [loading, setLoading] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  useEffect(() => {
    if (user?.preferences) {
      setPreferences(user.preferences);
    }
  }, [user]);

  const handleToggle = (category, key) => {
    setPreferences((prev) => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: !prev[category][key],
      },
    }));
  };

  const handleChange = (key, value) => {
    setPreferences((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await api("/auth/me", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ preferences }),
      });
      await refreshUser();
      toast.success("Settings updated!");
    } catch (err) {
      toast.error("Failed to update settings");
    } finally {
      setLoading(false);
    }
  };

  const confirmDeleteAccount = async (password) => {
    setIsDeletingAccount(true);
    try {
      await api("/auth/me", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      toast.success("Account deleted successfully.");
      setIsDeleteModalOpen(false);
      logout();
    } catch (err) {
      toast.error(err.message || "Failed to delete account.");
    } finally {
      setIsDeletingAccount(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="bg-drive-card border border-drive-border rounded-2xl p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-drive-text mb-6">
          Preferences
        </h2>

        <div className="space-y-8">
          {/* Notifications */}
          <div>
            <h3 className="text-sm font-medium text-drive-accent uppercase tracking-wider mb-4">
              Notifications
            </h3>
            <div className="space-y-4">
              <Toggle
                label="Email Notifications"
                description="Receive updates and alerts via email"
                checked={preferences.notifications?.email}
                onChange={() => handleToggle("notifications", "email")}
              />
              <Toggle
                label="Push Notifications"
                description="Receive push notifications on your device"
                checked={preferences.notifications?.push}
                onChange={() => handleToggle("notifications", "push")}
              />
            </div>
          </div>

          {/* Privacy */}
          <div>
            <h3 className="text-sm font-medium text-drive-accent uppercase tracking-wider mb-4">
              Privacy
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-drive-text">
                    Profile Visibility
                  </p>
                  <p className="text-xs text-drive-muted">
                    Control who can see your profile
                  </p>
                </div>
                <select
                  value={preferences.privacy?.profileVisibility}
                  onChange={(e) =>
                    setPreferences((p) => ({
                      ...p,
                      privacy: {
                        ...p.privacy,
                        profileVisibility: e.target.value,
                      },
                    }))
                  }
                  className="bg-drive-dark border border-drive-border rounded-lg px-3 py-1.5 text-sm text-drive-text outline-none focus:ring-2 focus:ring-drive-accent"
                >
                  <option value="public">Public</option>
                  <option value="contacts">Contacts Only</option>
                  <option value="private">Private</option>
                </select>
              </div>
              <Toggle
                label="Show Activity Status"
                description="Let others know when you are active"
                checked={preferences.privacy?.showActivityStatus}
                onChange={() => handleToggle("privacy", "showActivityStatus")}
              />
            </div>
          </div>

          {/* Regional */}
          <div>
            <h3 className="text-sm font-medium text-drive-accent uppercase tracking-wider mb-4">
              Regional
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-drive-muted flex items-center gap-2">
                  <Globe className="w-4 h-4" /> Language
                </label>
                <select
                  value={preferences.language}
                  onChange={(e) => handleChange("language", e.target.value)}
                  className="w-full bg-drive-dark border border-drive-border rounded-xl px-4 py-2.5 text-drive-text outline-none focus:ring-2 focus:ring-drive-accent"
                >
                  <option value="en">English (US)</option>
                  <option value="es">Spanish</option>
                  <option value="fr">French</option>
                  <option value="de">German</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-drive-muted flex items-center gap-2">
                  <Activity className="w-4 h-4" /> Timezone
                </label>
                <select
                  value={preferences.timezone}
                  onChange={(e) => handleChange("timezone", e.target.value)}
                  className="w-full bg-drive-dark border border-drive-border rounded-xl px-4 py-2.5 text-drive-text outline-none focus:ring-2 focus:ring-drive-accent"
                >
                  <option value="UTC">UTC (GMT+0)</option>
                  <option value="EST">EST (GMT-5)</option>
                  <option value="PST">PST (GMT-8)</option>
                  <option value="IST">IST (GMT+5:30)</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-drive-border flex justify-between items-center">
          <button
            onClick={() => {
              if (window.confirm("Are you sure you want to log out?")) logout();
            }}
            className="text-drive-muted hover:text-drive-text font-medium text-sm flex items-center gap-2"
          >
            <LogOut className="w-4 h-4" /> Log Out
          </button>

          <button
            onClick={handleSave}
            disabled={loading}
            className="px-6 py-2.5 bg-drive-accent hover:bg-drive-accentHover text-white font-medium rounded-xl shadow-lg shadow-drive-accent/20 transition-all flex items-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            Save Changes
          </button>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="bg-red-500/5 border border-red-500/20 rounded-2xl p-6">
        <h2 className="text-lg font-semibold text-red-500 mb-2 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5" /> Danger Zone
        </h2>
        <p className="text-sm text-drive-muted mb-6">
          Permanently delete your account and all associated data. This action
          cannot be undone.
        </p>
        <div className="flex justify-end">
          <button
            onClick={() => setIsDeleteModalOpen(true)}
            className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
          >
            <Trash2 className="w-4 h-4" /> Delete Account
          </button>
        </div>
      </div>

      <DeleteAccountModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDeleteAccount}
        loading={isDeletingAccount}
      />
    </div>
  );
}

function Toggle({ label, description, checked, onChange }) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <p className="font-medium text-drive-text">{label}</p>
        <p className="text-xs text-drive-muted">{description}</p>
      </div>
      <button
        onClick={onChange}
        className={`w-11 h-6 rounded-full transition-colors relative ${
          checked ? "bg-drive-accent" : "bg-drive-border"
        }`}
      >
        <div
          className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
            checked ? "translate-x-5" : ""
          }`}
        />
      </button>
    </div>
  );
}

function Security({ user, refreshUser }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [show2FAModal, setShow2FAModal] = useState(false);
  const [showDisable2FAModal, setShowDisable2FAModal] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const histRes = await api("/auth/history");
        setHistory(histRes.history || []);
      } catch (err) {
        console.error("Failed to load security data", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* 2FA */}
      <div className="bg-drive-card border border-drive-border rounded-2xl p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-drive-text mb-4">
          Two-Factor Authentication
        </h2>
        <div className="flex items-center justify-between p-4 bg-drive-dark/30 rounded-xl border border-drive-border">
          <div className="flex items-center gap-4">
            <div
              className={`p-3 rounded-lg ${user?.twoFactorEnabled ? "bg-green-500/10 text-green-500" : "bg-blue-500/10 text-blue-500"}`}
            >
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <p className="font-medium text-drive-text">
                Two-Factor Authentication
              </p>
              <p className="text-sm text-drive-muted">
                {user?.twoFactorEnabled
                  ? "Your account is secured with 2FA."
                  : "Add an extra layer of security to your account."}
              </p>
            </div>
          </div>
          <button
            onClick={() =>
              user?.twoFactorEnabled
                ? setShowDisable2FAModal(true)
                : setShow2FAModal(true)
            }
            className={`px-4 py-2 text-sm font-medium border rounded-lg transition-colors ${
              user?.twoFactorEnabled
                ? "bg-red-500/10 border-red-500/20 text-red-500 hover:bg-red-500/20"
                : "bg-drive-dark border-drive-border text-drive-text hover:bg-drive-border"
            }`}
          >
            {user?.twoFactorEnabled ? "Disable" : "Enable"}
          </button>
        </div>
      </div>

      {/* Login History */}
      <div className="bg-drive-card border border-drive-border rounded-2xl p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-drive-text mb-4 flex items-center gap-2">
          <History className="w-5 h-5" /> Login History
        </h2>
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-drive-accent" />
          </div>
        ) : history.length === 0 ? (
          <p className="text-drive-muted text-sm">No history available.</p>
        ) : (
          <div className="space-y-4">
            {history
              .slice()
              .reverse()
              .map((entry, i) => {
                const { browser, os, type } = parseUserAgent(entry.device);
                const Icon =
                  type === "mobile"
                    ? Smartphone
                    : os.includes("Windows") || os.includes("macOS")
                      ? Monitor
                      : Laptop;

                return (
                  <div
                    key={i}
                    className="flex items-center justify-between p-3 bg-drive-dark/30 rounded-xl border border-drive-border/50"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`p-2 rounded-lg ${
                          i === 0
                            ? "bg-green-500/10 text-green-500"
                            : "bg-drive-border/50 text-drive-muted"
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-drive-text">
                          {browser} on {os}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-drive-muted">
                          <span>{entry.ip || "Unknown IP"}</span>
                          <span>•</span>
                          <span>{formatRelativeTime(entry.timestamp)}</span>
                          {i === 0 && (
                            <span className="px-1.5 py-0.5 rounded bg-green-500/10 text-green-500 font-medium text-[10px] border border-green-500/20">
                              Latest
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        )}
      </div>

      <TwoFactorSetupModal
        isOpen={show2FAModal}
        onClose={() => setShow2FAModal(false)}
        onComplete={() => {
          refreshUser();
        }}
      />

      <Disable2FAModal
        isOpen={showDisable2FAModal}
        onClose={() => setShowDisable2FAModal(false)}
        onComplete={() => {
          refreshUser();
        }}
      />
    </div>
  );
}
