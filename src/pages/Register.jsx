import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { Mail, Lock, User, ArrowRight, Github } from "lucide-react";
import { api } from "../api/client";

const GoogleIcon = ({ className }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      fill="#4285F4"
    />
    <path
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      fill="#34A853"
    />
    <path
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.84z"
      fill="#FBBC05"
    />
    <path
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      fill="#EA4335"
    />
  </svg>
);

export default function Register() {
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !firstName || !lastName || !password) {
      toast.error("Please fill all fields.");
      return;
    }
    if (password.length < 8) {
      toast.error("Password must be at least 8 characters.");
      return;
    }
    setLoading(true);
    try {
      const data = await api("/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, firstName, lastName, password }),
      });
      toast.success("Account created! Check your email to activate.");
      navigate("/login");
    } catch (err) {
      const msg = err.message || "Registration failed.";
      if (
        msg.includes("Failed to fetch") ||
        msg.includes("NetworkError") ||
        msg.includes("ECONNRESET")
      ) {
        toast.error(
          "Cannot reach server. Check your connection and try again.",
        );
      } else {
        toast.error(msg);
      }
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
            <ArrowRight className="w-6 h-6 text-gray-900" />
          </div>
        </div>

        <h1 className="text-2xl font-bold text-center text-gray-900 mb-2">
          Create account
        </h1>
        <p className="text-center text-gray-500 text-sm mb-8 px-4">
          Get started with your free account today.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="relative group">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none transition-colors group-focus-within:text-gray-900 text-gray-400">
                <User className="w-5 h-5" />
              </div>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="First name"
                className="w-full pl-12 pr-4 py-3.5 bg-gray-50 hover:bg-gray-100 focus:bg-white border-none rounded-xl text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-gray-900 transition-all duration-200"
              />
            </div>
            <div className="relative group">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none transition-colors group-focus-within:text-gray-900 text-gray-400">
                <User className="w-5 h-5" />
              </div>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Last name"
                className="w-full pl-12 pr-4 py-3.5 bg-gray-50 hover:bg-gray-100 focus:bg-white border-none rounded-xl text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-gray-900 transition-all duration-200"
              />
            </div>
          </div>

          <div className="relative group">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none transition-colors group-focus-within:text-gray-900 text-gray-400">
              <Mail className="w-5 h-5" />
            </div>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              className="w-full pl-12 pr-4 py-3.5 bg-gray-50 hover:bg-gray-100 focus:bg-white border-none rounded-xl text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-gray-900 transition-all duration-200"
            />
          </div>

          <div className="relative group">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none transition-colors group-focus-within:text-gray-900 text-gray-400">
              <Lock className="w-5 h-5" />
            </div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password (min 8 chars)"
              className="w-full pl-12 pr-12 py-3.5 bg-gray-50 hover:bg-gray-100 focus:bg-white border-none rounded-xl text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-gray-900 transition-all duration-200"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl bg-[#18181b] hover:bg-black text-white font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none"
          >
            {loading ? "Creating account..." : "Sign up"}
          </button>
        </form>

        <div className="mt-8 mb-6 relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-100"></div>
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white px-4 text-gray-400 tracking-wider">
              Or sign up with
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => toast("Google signup coming soon!", { icon: "🚧" })}
            className="flex items-center justify-center gap-2 py-2.5 bg-white border border-gray-100 rounded-xl shadow-sm hover:shadow-md hover:bg-gray-50 transition-all duration-200 group"
          >
            <GoogleIcon className="w-5 h-5" />
            <span className="text-sm font-medium text-gray-700">Google</span>
          </button>
          <button
            type="button"
            onClick={() => toast("GitHub signup coming soon!", { icon: "🚧" })}
            className="flex items-center justify-center gap-2 py-2.5 bg-white border border-gray-100 rounded-xl shadow-sm hover:shadow-md hover:bg-gray-50 transition-all duration-200 group"
          >
            <Github className="w-5 h-5 text-gray-900" />
            <span className="text-sm font-medium text-gray-700">GitHub</span>
          </button>
        </div>

        <p className="mt-8 text-center text-sm text-gray-500">
          Already have an account?{" "}
          <Link
            to="/login"
            className="font-semibold text-gray-900 hover:underline decoration-2 underline-offset-2"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
