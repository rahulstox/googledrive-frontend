import { useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { HardDrive, Lock, ArrowRight } from 'lucide-react';
import { api } from '../api/client';

export default function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password.length < 8) {
      toast.error('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirm) {
      toast.error('Passwords do not match.');
      return;
    }
    setLoading(true);
    try {
      await api(`/auth/reset-password/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      setSuccess(true);
      toast.success('Password updated. You can now sign in.');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      toast.error(err.message || 'Reset failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 perspective-3d">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute bottom-1/3 right-1/4 w-96 h-96 bg-drive-accent/12 rounded-full blur-3xl animate-float" style={{ animationDuration: '9s' }} />
      </div>
      <div className="card-3d glass w-full max-w-md border border-drive-border rounded-2xl shadow-3d p-8 animate-slide-up relative z-10 pointer-events-auto">
        <div className="flex justify-center mb-8">
          <div className="p-3 rounded-xl bg-drive-accent/20 shadow-glow">
            <HardDrive className="w-10 h-10 text-drive-accent" aria-hidden />
          </div>
        </div>
        <h1 className="text-2xl font-bold text-center text-white mb-2">New password</h1>
        <p className="text-drive-muted text-center text-sm mb-8">
          {success ? 'Password updated successfully.' : 'Enter your new password below.'}
        </p>
        {!success ? (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">New password (min 8 characters)</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-drive-muted" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-drive-dark border border-drive-border text-white placeholder-drive-muted focus:outline-none focus:ring-2 focus:ring-drive-accent"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">Confirm password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-drive-muted" />
                <input
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-drive-dark border border-drive-border text-white placeholder-drive-muted focus:outline-none focus:ring-2 focus:ring-drive-accent"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-drive-accent hover:bg-drive-accentHover text-white font-medium flex items-center justify-center gap-2 shadow-glow hover:shadow-glow-lg transition-all duration-250 disabled:opacity-50"
            >
              {loading ? 'Updating...' : 'Update password'}
              <ArrowRight className="w-4 h-4" aria-hidden />
            </button>
          </form>
        ) : (
          <Link
            to="/login"
            className="block w-full py-3 rounded-xl bg-drive-accent hover:bg-drive-accentHover text-white font-medium text-center transition"
          >
            Go to sign in
          </Link>
        )}
      </div>
    </div>
  );
}
