import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import { Lock, Check, X, AlertCircle } from "lucide-react";
import { api } from "../api/client";

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const token = searchParams.get("token");
  const emailParam = searchParams.get("email");

  // Decode email from base64url
  let email = "";
  try {
    if (emailParam) {
      // Replace base64url chars with standard base64 chars
      const base64 = emailParam.replace(/-/g, "+").replace(/_/g, "/");
      email = atob(base64);
    }
  } catch (err) {
    console.error("Failed to decode email:", err);
  }

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  // Validation states
  const [touched, setTouched] = useState(false);
  const validations = {
    length: password.length >= 8,
    upper: /[A-Z]/.test(password),
    lower: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[^A-Za-z0-9]/.test(password),
  };
  const isStrong = Object.values(validations).every(Boolean);
  const match = password === confirm;

  useEffect(() => {
    if (!token || !email) {
      setError("Invalid link parameters.");
      setVerifying(false);
      return;
    }

    const verifyToken = async () => {
      try {
        await api("/auth/verify-reset-token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token, email }),
        });
        setVerifying(false);
      } catch (err) {
        setError(err.message || "Invalid or expired link.");
        setVerifying(false);
      }
    };

    verifyToken();
  }, [token, email]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isStrong || !match) return;

    setLoading(true);
    try {
      await api("/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, email, newPassword: password }),
      });
      setSuccess(true);
      toast.success("Password updated. You can now sign in.");
      setTimeout(() => navigate("/login"), 5000); // 5s auto redirect
    } catch (err) {
      toast.error(err.message || "Reset failed.");
    } finally {
      setLoading(false);
    }
  };

  if (verifying) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
        <div className="w-full max-w-md bg-white rounded-3xl shadow-xl p-8 text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-red-100 rounded-full">
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            Link Expired or Invalid
          </h2>
          <p className="text-gray-500 mb-6">{error}</p>
          <Link
            to="/forgot-password"
            className="inline-block px-6 py-3 rounded-xl bg-gray-900 text-white font-medium hover:bg-black transition-colors"
          >
            Request new link
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-sky-200 via-sky-50 to-white relative">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-8 relative z-10 animate-fade-in-up">
        <div className="flex justify-center mb-6">
          <div className="p-3 bg-white rounded-xl shadow-lg border border-gray-100">
            <Lock className="w-6 h-6 text-gray-900" />
          </div>
        </div>

        <h1 className="text-2xl font-bold text-center text-gray-900 mb-2">
          New password
        </h1>

        {success ? (
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <div className="p-2 bg-green-100 rounded-full">
                <Check className="w-6 h-6 text-green-600" />
              </div>
            </div>
            <p className="text-gray-600 mb-6">
              Password updated successfully! Redirecting to login in 5
              seconds...
            </p>
            <Link
              to="/login"
              className="block w-full py-3.5 rounded-xl bg-[#18181b] hover:bg-black text-white font-medium transition-all"
            >
              Login now
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                  <Lock className="w-5 h-5" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setTouched(true);
                  }}
                  placeholder="New password"
                  className="w-full pl-12 pr-4 py-3.5 bg-gray-50 hover:bg-gray-100 focus:bg-white border-none rounded-xl text-gray-900 focus:ring-2 focus:ring-gray-900 transition-all"
                />
              </div>

              {/* Password Strength Indicators */}
              <div
                className={`space-y-2 text-xs transition-all duration-300 ${touched ? "opacity-100" : "opacity-50"}`}
              >
                <div className="grid grid-cols-2 gap-2">
                  <Requirement label="8+ chars" met={validations.length} />
                  <Requirement label="Uppercase" met={validations.upper} />
                  <Requirement label="Lowercase" met={validations.lower} />
                  <Requirement label="Number" met={validations.number} />
                  <Requirement
                    label="Special Character"
                    met={validations.special}
                  />
                </div>
              </div>

              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                  <Lock className="w-5 h-5" />
                </div>
                <input
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="Confirm password"
                  className={`w-full pl-12 pr-4 py-3.5 bg-gray-50 hover:bg-gray-100 focus:bg-white border ${
                    confirm && !match ? "border-red-500" : "border-transparent"
                  } rounded-xl text-gray-900 focus:ring-2 focus:ring-gray-900 transition-all`}
                />
                {confirm && !match && (
                  <p className="absolute -bottom-5 left-1 text-xs text-red-500">
                    Passwords do not match
                  </p>
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !isStrong || !match}
              className="w-full py-3.5 rounded-xl bg-[#18181b] hover:bg-black text-white font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none"
            >
              {loading ? "Updating..." : "Reset Password"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

function Requirement({ label, met }) {
  return (
    <div
      className={`flex items-center gap-1.5 ${met ? "text-green-600" : "text-gray-400"}`}
    >
      {met ? (
        <Check className="w-3.5 h-3.5" />
      ) : (
        <div className="w-3.5 h-3.5 rounded-full border border-gray-300" />
      )}
      <span>{label}</span>
    </div>
  );
}
