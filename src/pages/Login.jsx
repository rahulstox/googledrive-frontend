import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { HardDrive, Mail, Lock, ArrowRight } from "lucide-react";
import { useAuth } from "../context/useAuth";
import { api } from "../api/client";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Please enter email and password.");
      return;
    }
    setLoading(true);
    try {
      const data = await api("/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      login(data.token, data.user);
      toast.success("Welcome back!");
      navigate("/");
    } catch (err) {
      toast.error(err.message || "Login failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 perspective-3d relative">
      <div
        className="absolute inset-0 overflow-hidden pointer-events-none"
        aria-hidden
      >
        <div
          className="absolute top-1/4 left-1/4 w-96 h-96 bg-drive-accent/12 rounded-full blur-3xl animate-float"
          style={{ animationDuration: "8s" }}
        />
        <div
          className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl animate-float"
          style={{ animationDuration: "10s", animationDelay: "1s" }}
        />
      </div>
      <div className="card-3d glass w-full max-w-md border border-drive-border rounded-2xl shadow-3d p-8 animate-slide-up relative z-10 pointer-events-auto">
        <div className="flex justify-center mb-8">
          <div className="p-3 rounded-xl bg-drive-accent/20 shadow-glow">
            <HardDrive className="w-10 h-10 text-drive-accent" aria-hidden />
          </div>
        </div>
        <h1 className="text-2xl font-bold text-center text-white mb-2">
          Sign in
        </h1>
        <p className="text-drive-muted text-center text-sm mb-8">
          Enter your credentials to access your files
        </p>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-drive-muted" />
              <input
                type="email"
                name="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-drive-dark border border-drive-border text-white placeholder-drive-muted focus:outline-none focus:ring-2 focus:ring-drive-accent focus:border-transparent"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-drive-muted" />
              <input
                type="password"
                name="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-drive-dark border border-drive-border text-white placeholder-drive-muted focus:outline-none focus:ring-2 focus:ring-drive-accent focus:border-transparent"
              />
            </div>
          </div>
          <div className="flex justify-end">
            <Link
              to="/forgot-password"
              className="text-sm text-drive-accent hover:underline"
            >
              Forgot password?
            </Link>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-drive-accent hover:bg-drive-accentHover text-white font-medium flex items-center justify-center gap-2 shadow-glow hover:shadow-glow-lg transition-all duration-250 disabled:opacity-50"
          >
            {loading ? "Signing in..." : "Sign in"}
            <ArrowRight className="w-4 h-4" aria-hidden />
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-drive-muted">
          Don't have an account?{" "}
          <Link
            to="/register"
            className="text-drive-accent hover:underline font-medium"
          >
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
