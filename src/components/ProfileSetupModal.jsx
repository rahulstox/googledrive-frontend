import { useState, useEffect } from "react";
import { User, Check, AlertCircle, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { api } from "../api/client";
import { useAuth } from "../context/useAuth";

export default function ProfileSetupModal() {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [username, setUsername] = useState("");
  const [debouncedUsername, setDebouncedUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);
  const [usernameError, setUsernameError] = useState("");
  const [isAvailable, setIsAvailable] = useState(false);
  const [hasSkipped, setHasSkipped] = useState(false);

  useEffect(() => {
    // Show modal if user is logged in but has no username or names, and hasn't skipped
    if (!hasSkipped && user && !user.username) {
      setIsOpen(true);
      if (user.username && !username) setUsername(user.username);
    } else {
      setIsOpen(false);
    }
  }, [user, hasSkipped]);

  // Debounce username input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedUsername(username);
    }, 300);
    return () => clearTimeout(timer);
  }, [username]);

  // Validate and check availability
  useEffect(() => {
    const checkUsername = async () => {
      if (!debouncedUsername) {
        setUsernameError("");
        setIsAvailable(false);
        return;
      }

      // Regex validation
      const usernameRegex = /^[A-Za-z0-9_-]{3,20}$/;
      if (!usernameRegex.test(debouncedUsername)) {
        setUsernameError(
          "Username must be 3-20 characters and can only contain letters, numbers, underscores, and hyphens",
        );
        setIsAvailable(false);
        return;
      }

      setChecking(true);
      setUsernameError("");

      try {
        const { exists } = await api(
          `/auth/check-username?u=${encodeURIComponent(debouncedUsername)}`,
        );
        if (exists) {
          setUsernameError("This username is already taken");
          setIsAvailable(false);
        } else {
          setIsAvailable(true);
        }
      } catch (err) {
        console.error("Username check error:", err);
        // Don't block user on network error, but maybe warn?
        // Or just assume valid for now and let backend catch it on save.
      } finally {
        setChecking(false);
      }
    };

    checkUsername();
  }, [debouncedUsername]);

  const handleSkip = async () => {
    // Generate defaults if missing
    const updates = {};
    if (!user.username) {
      const randomSuffix = Math.random().toString(16).slice(2, 10);
      updates.username = `user_${randomSuffix}`;
    }

    try {
      await api("/auth/me", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });

      await refreshUser();
      setHasSkipped(true);
      setIsOpen(false);
      toast.success("Setup skipped—you can update profile later.");
      setTimeout(() => {
        navigate("/dashboard");
      }, 1500);
    } catch (err) {
      console.error("Skip error:", err);
      // Fallback: just close locally if network fails, though next reload will show it again
      setHasSkipped(true);
      setIsOpen(false);
      navigate("/dashboard");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (usernameError || !isAvailable || !username) return;

    setLoading(true);
    try {
      await api("/auth/me", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username }),
      });

      await refreshUser();
      toast.success(`Welcome back, ${username}!`);
      setIsOpen(false);
      setTimeout(() => {
        navigate("/dashboard");
      }, 1500);
    } catch (err) {
      console.error("Profile update error:", err);
      toast.error(err.message || "Failed to update profile. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-scale-up">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-900">
            Complete your profile
          </h2>
          <button
            type="button"
            onClick={handleSkip}
            className="text-sm font-medium text-gray-500 hover:text-gray-800 transition-colors focus:outline-none focus:ring-2 focus:ring-black rounded px-2 py-1"
            tabIndex="0"
          >
            Skip
          </button>
        </div>

        <div className="p-6">
          <p className="text-gray-500 mb-6">
            Please complete your profile information.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="username"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Username
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                  <User className="w-5 h-5" />
                </div>
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className={`w-full pl-10 pr-10 py-2 border rounded-lg focus:ring-2 focus:outline-none transition-all ${
                    usernameError
                      ? "border-red-500 focus:ring-red-200"
                      : isAvailable
                        ? "border-green-500 focus:ring-green-200"
                        : "border-gray-300 focus:ring-black focus:border-transparent"
                  }`}
                  placeholder="Choose a username"
                  autoFocus
                  aria-invalid={!!usernameError}
                  aria-describedby="username-help username-error"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  {checking ? (
                    <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
                  ) : usernameError ? (
                    <AlertCircle className="w-5 h-5 text-red-500" />
                  ) : isAvailable ? (
                    <Check className="w-5 h-5 text-green-500" />
                  ) : null}
                </div>
              </div>

              {usernameError ? (
                <p id="username-error" className="mt-1 text-sm text-red-500">
                  {usernameError}
                </p>
              ) : (
                <p id="username-help" className="mt-1 text-xs text-gray-500">
                  3-20 characters, letters, numbers, underscores, and hyphens
                  only.
                </p>
              )}
            </div>

            <div className="pt-4 flex justify-end gap-3">
              <button
                type="submit"
                disabled={
                  loading || !!usernameError || !isAvailable || !username
                }
                className="w-full bg-black hover:bg-gray-800 text-white font-medium py-2.5 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center mt-2"
              >
                {loading ? (
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                ) : null}
                {loading ? "Saving..." : "Save & Continue"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
