import { useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { HardDrive, Mail, ArrowRight } from 'lucide-react';
import { api } from '../api/client';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) {
      toast.error('Please enter your email.');
      return;
    }
    setLoading(true);
    try {
      await api('/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      setSent(true);
      toast.success('If an account exists, you will receive a reset link.');
    } catch (err) {
      toast.error(err.message || 'Request failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 perspective-3d">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/2 w-96 h-96 bg-drive-accent/12 rounded-full blur-3xl -translate-x-1/2 animate-float" style={{ animationDuration: '9s' }} />
      </div>
      <div className="card-3d glass w-full max-w-md border border-drive-border rounded-2xl shadow-3d p-8 animate-slide-up relative z-10 pointer-events-auto">
        <div className="flex justify-center mb-8">
          <div className="p-3 rounded-xl bg-drive-accent/20 shadow-glow">
            <HardDrive className="w-10 h-10 text-drive-accent" aria-hidden />
          </div>
        </div>
        <h1 className="text-2xl font-bold text-center text-white mb-2">Forgot password</h1>
        <p className="text-drive-muted text-center text-sm mb-8">
          {sent ? 'Check your email for the reset link.' : 'Enter your email and we\'ll send a reset link.'}
        </p>
        {!sent ? (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-drive-muted" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-drive-dark border border-drive-border text-white placeholder-drive-muted focus:outline-none focus:ring-2 focus:ring-drive-accent"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-drive-accent hover:bg-drive-accentHover text-white font-medium flex items-center justify-center gap-2 shadow-glow hover:shadow-glow-lg transition-all duration-250 disabled:opacity-50"
            >
              {loading ? 'Sending...' : 'Send reset link'}
              <ArrowRight className="w-4 h-4" aria-hidden />
            </button>
          </form>
        ) : (
          <Link
            to="/login"
            className="block w-full py-3 rounded-xl bg-drive-accent hover:bg-drive-accentHover text-white font-medium text-center transition"
          >
            Back to sign in
          </Link>
        )}
        <p className="mt-6 text-center text-sm text-drive-muted">
          <Link to="/login" className="text-drive-accent hover:underline">
            Back to sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
