import { useEffect, useState, useRef } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import { api } from "../api/client";
import { useAuth } from "../context/useAuth";

export default function Activate() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState("loading");
  const hasFetched = useRef(false);
  const { refreshUser, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!token) {
      setStatus("error");
      return;
    }

    // Prevent double execution in StrictMode
    if (hasFetched.current) return;
    hasFetched.current = true;

    // Use query param in API call as well
    api(`/auth/activate?token=${token}`)
      .then(async () => {
        setStatus("success");
        toast.success("Account activated! You can now sign in.");

        // If user is already logged in, refresh their status and redirect
        try {
          if (localStorage.getItem("drive_token")) {
            await refreshUser();
            // Short delay to let user see success message, then redirect
            setTimeout(() => {
              navigate("/");
            }, 2000);
          }
        } catch (e) {
          console.error("Failed to refresh user:", e);
        }
      })
      .catch((err) => {
        setStatus("error");
        toast.error(err.message || "Activation link is invalid or expired.");
      });
  }, [token, refreshUser, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-sky-200 via-sky-50 to-white relative">
      {/* Background Decorative Elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-white/30 rounded-full blur-3xl mix-blend-overlay" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-sky-200/20 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] border border-white/40 rounded-full opacity-50 pointer-events-none" />
      </div>

      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-8 relative z-10 animate-fade-in-up text-center">
        {/* Status Icon */}
        <div className="flex justify-center mb-6">
          <div className="p-3 bg-white rounded-xl shadow-lg border border-gray-100">
            {status === "loading" && (
              <Loader2 className="w-8 h-8 text-gray-900 animate-spin" />
            )}
            {status === "success" && (
              <CheckCircle className="w-8 h-8 text-green-500" />
            )}
            {status === "error" && <XCircle className="w-8 h-8 text-red-500" />}
          </div>
        </div>

        {status === "loading" && (
          <>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Activating...
            </h1>
            <p className="text-gray-500 text-sm">
              Please wait while we activate your account.
            </p>
          </>
        )}

        {status === "success" && (
          <>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Your account is activated. Welcome!
            </h1>
            <p className="text-gray-500 text-sm mb-8">
              {localStorage.getItem("drive_token")
                ? "Redirecting you to the dashboard..."
                : "You can now sign in with your email and password."}
            </p>
            {!localStorage.getItem("drive_token") && (
              <Link
                to="/login"
                className="inline-block w-full py-3.5 rounded-xl bg-[#18181b] hover:bg-black text-white font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
              >
                Sign in
              </Link>
            )}
            {localStorage.getItem("drive_token") && (
              <Link
                to="/"
                className="inline-block w-full py-3.5 rounded-xl bg-[#18181b] hover:bg-black text-white font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
              >
                Go to Dashboard
              </Link>
            )}
          </>
        )}

        {status === "error" && (
          <>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Activation failed
            </h1>
            <p className="text-gray-500 text-sm mb-8">
              The link is invalid or has expired. You can request a new one by
              signing up again.
            </p>
            <Link
              to="/register"
              className="inline-block w-full py-3.5 rounded-xl bg-[#18181b] hover:bg-black text-white font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
            >
              Sign up again
            </Link>
            <div className="mt-4">
              <Link
                to="/login"
                className="text-sm font-semibold text-gray-900 hover:underline"
              >
                Back to sign in
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
