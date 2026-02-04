import { useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import toast from "react-hot-toast";
import { Mail, Loader2 } from "lucide-react";
import { api } from "../api/client";

export default function CheckEmail() {
  const navigate = useNavigate();
  const location = useLocation();
  const [timeLeft, setTimeLeft] = useState(5);
  const [isResending, setIsResending] = useState(false);
  const email = location.state?.email;

  useEffect(() => {
    if (timeLeft <= 0) {
      navigate("/login");
    }
  }, [timeLeft, navigate]);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleResend = async () => {
    if (!email) {
      toast.error("Email address missing. Please try logging in.");
      return;
    }

    if (isResending) return;

    setIsResending(true);
    try {
      await api("/auth/resend-activation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      toast.success("Activation email resent!");
    } catch (err) {
      toast.error(err.message || "Failed to resend email.");
    } finally {
      setIsResending(false);
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

      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-8 relative z-10 animate-fade-in-up text-center">
        <div className="flex justify-center mb-6">
          <div className="p-3 bg-white rounded-xl shadow-lg border border-gray-100">
            <Mail className="w-8 h-8 text-sky-500" />
          </div>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Please go activate your account
        </h1>
        <p className="text-gray-500 text-sm mb-8">
          We've sent an activation link to your email. Please check your inbox
          and click the link to activate your account.
        </p>

        <div className="space-y-4">
          <button
            onClick={handleResend}
            disabled={isResending}
            className="w-full py-3.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-900 font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isResending && <Loader2 className="w-4 h-4 animate-spin" />}
            {isResending ? "Resending..." : "Resend e-mail"}
          </button>

          <p className="text-xs text-gray-400">
            Redirecting to login in {timeLeft} seconds...
          </p>

          <Link
            to="/login"
            className="inline-block text-sm text-sky-600 hover:text-sky-700 font-medium"
          >
            Go to Login now
          </Link>
        </div>
      </div>
    </div>
  );
}
