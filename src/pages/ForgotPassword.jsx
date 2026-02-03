import { useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { Mail } from "lucide-react";
import { api } from "../api/client";

// Robust email regex
const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [touched, setTouched] = useState(false);

  const isValid = emailRegex.test(email);

  const handleEmailChange = (e) => {
    const val = e.target.value;
    setEmail(val);
    if (touched && val && !emailRegex.test(val)) {
      setError("Please enter a valid email address.");
    } else {
      setError("");
    }
  };

  const handleBlur = () => {
    setTouched(true);
    if (email && !emailRegex.test(email)) {
      setError("Please enter a valid email address.");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isValid) return;

    setLoading(true);
    try {
      await api("/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      setSent(true);
      toast.success("If an account exists, you will receive a reset link.");
    } catch (err) {
      toast.error(err.message || "Request failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-sky-200 via-sky-50 to-white relative">
      {/* Background Decorative Elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-white/30 rounded-full blur-3xl mix-blend-overlay" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-sky-200/20 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] border border-white/40 rounded-full opacity-50 pointer-events-none" />
      </div>

      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-8 relative z-10 animate-fade-in-up">
        {/* Logo Icon */}
        <div className="flex justify-center mb-6">
          <div className="p-3 bg-white rounded-xl shadow-lg border border-gray-100">
            <Mail className="w-6 h-6 text-gray-900" />
          </div>
        </div>

        <h1 className="text-2xl font-bold text-center text-gray-900 mb-2">
          Forgot password
        </h1>
        <p className="text-center text-gray-500 text-sm mb-8 px-4">
          {sent
            ? "Check your email for the reset link."
            : "Enter your email and we'll send a reset link."}
        </p>

        {!sent ? (
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div className="relative group">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none transition-colors group-focus-within:text-gray-900 text-gray-400">
                <Mail className="w-5 h-5" />
              </div>
              <input
                type="email"
                value={email}
                onChange={handleEmailChange}
                onBlur={handleBlur}
                placeholder="Email"
                aria-label="Email Address"
                aria-invalid={!!error}
                aria-required="true"
                required
                className={`w-full pl-12 pr-4 py-3.5 bg-gray-50 hover:bg-gray-100 focus:bg-white border ${
                  error
                    ? "border-red-500 focus:ring-red-500"
                    : "border-transparent focus:ring-gray-900"
                } rounded-xl text-gray-900 placeholder-gray-400 focus:ring-2 transition-all duration-200`}
              />
              {error && (
                <p className="mt-1 text-sm text-red-500 pl-1" role="alert">
                  {error}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading || !isValid}
              className="w-full py-3.5 rounded-xl bg-[#18181b] hover:bg-black text-white font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none"
            >
              {loading ? "Sending..." : "Send reset link"}
            </button>
          </form>
        ) : (
          <Link
            to="/login"
            className="block w-full py-3.5 rounded-xl bg-[#18181b] hover:bg-black text-white font-medium text-center shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
          >
            Back to sign in
          </Link>
        )}

        {!sent && (
          <p className="mt-8 text-center text-sm text-gray-500">
            <Link
              to="/login"
              className="font-semibold text-gray-900 hover:underline decoration-2 underline-offset-2"
            >
              Back to sign in
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}
